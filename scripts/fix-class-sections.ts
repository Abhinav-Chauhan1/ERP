/**
 * Apply a register-confirmed section placement for one class at Howard Convent School.
 *
 *   npx tsx scripts/fix-class-sections.ts --class "Class 2" --list <confirmed.tsv>          # dry run
 *   npx tsx scripts/fix-class-sections.ts --class "Class 2" --list <confirmed.tsv> --apply  # write
 *
 * List shape: one row per student, tab separated: <admissionId>\t<name>\t<section>
 * The name column is advisory only — matching is by admissionId — but a mismatch
 * against the stored name is reported so a mis-keyed row cannot pass silently.
 * A before-image of every touched enrollment is written to scripts/.hcs-<class>-<ts>.json.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'
const argv = process.argv
const listPath = argv[argv.indexOf('--list') + 1]
if (!listPath || !fs.existsSync(listPath)) { console.error('missing --list <file.tsv>'); process.exit(1) }
const APPLY = argv.includes('--apply')
const CLASS = argv.includes('--class') ? argv[argv.indexOf('--class') + 1] : 'Class 1'
const p = new PrismaClient()

async function main() {
  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (no writes) ===')
  console.log(`class: ${CLASS}`)

  const want = new Map<string, { name: string; sec: string }>()
  for (const line of fs.readFileSync(listPath, 'utf8').split('\n')) {
    if (!line.trim()) continue
    const [adm, name, sec] = line.split('\t').map(s => s.trim())
    if (!['A', 'B', 'C'].includes(sec)) throw new Error(`bad section "${sec}" for ${adm}`)
    want.set(adm, { name, sec })
  }
  console.log(`list: ${listPath} (${want.size} rows)`)

  const ay = await p.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, isCurrent: true }, select: { id: true, name: true } })
  const cls = await p.class.findFirst({
    where: { schoolId: SCHOOL_ID, academicYearId: ay!.id, name: CLASS },
    select: { id: true, sections: { select: { id: true, name: true } } },
  })
  if (!cls) throw new Error(`no class named "${CLASS}" in the current academic year`)
  const secId = new Map(cls!.sections.map(s => [s.name, s.id]))
  for (const s of new Set([...want.values()].map(v => v.sec))) {
    if (!secId.has(s)) throw new Error(`${CLASS} has no section ${s}`)
  }

  const rows = await p.classEnrollment.findMany({
    where: { classId: cls!.id },
    select: { id: true, sectionId: true, section: { select: { name: true } },
      student: { select: { id: true, admissionId: true, user: { select: { name: true } } } } },
  })

  const seen = new Set<string>()
  const moves: { eid: string; sid: string; adm: string; name: string; from: string; fromId: string; to: string; toId: string }[] = []
  const nameWarnings: string[] = []

  for (const r of rows) {
    const adm = r.student.admissionId
    const w = want.get(adm)
    if (!w) { console.log(`  ! adm ${adm} (${r.student.user.name}) is enrolled but absent from the list — left as ${r.section.name}`); continue }
    seen.add(adm)
    if (w.name.toLowerCase() !== r.student.user.name.toLowerCase()) {
      nameWarnings.push(`  ? adm ${adm}: list says "${w.name}", DB says "${r.student.user.name}"`)
    }
    if (w.sec !== r.section.name) {
      moves.push({ eid: r.id, sid: r.student.id, adm, name: r.student.user.name,
        from: r.section.name, fromId: r.sectionId, to: w.sec, toId: secId.get(w.sec)! })
    }
  }
  for (const adm of want.keys()) if (!seen.has(adm)) console.log(`  ! adm ${adm} (${want.get(adm)!.name}) is in the list but has no ${CLASS} enrollment`)
  if (nameWarnings.length) { console.log('\nname mismatches (matching is by admissionId, so these are advisory):'); nameWarnings.forEach(w => console.log(w)) }

  console.log(`\nmoves: ${moves.length}`)
  for (const m of moves) console.log(`  ${m.adm.padEnd(6)} ${m.name.padEnd(24)} ${m.from} -> ${m.to}`)

  const after: Record<string, number> = {}
  for (const s of cls.sections) after[s.name] = 0
  for (const w of want.values()) after[w.sec]++
  const split = Object.keys(after).sort().map(k => `${k}=${after[k]}`).join('  ')
  console.log(`\nresulting split: ${split}  (total ${want.size})`)

  const touched = new Set(moves.map(m => m.sid))
  if (touched.size) {
    const att = await p.studentAttendance.groupBy({
      by: ['studentId', 'sectionId'],
      where: { studentId: { in: [...touched] } },
      _count: { _all: true },
    })
    if (att.length) {
      console.log('\nexisting attendance rows for moved students (these keep their old sectionId):')
      const secName = new Map(cls!.sections.map(s => [s.id, s.name]))
      for (const a of att) console.log(`  student ${a.studentId}  section ${secName.get(a.sectionId) ?? a.sectionId}  ${a._count._all} rows`)
    } else {
      console.log('\nno attendance rows exist for the moved students — nothing else to reconcile')
    }
  }

  if (!moves.length) { console.log('\nnothing to do.'); await p.$disconnect(); return }
  if (!APPLY) { console.log('\ndry run — pass --apply to write'); await p.$disconnect(); return }

  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const backup = path.join('scripts', `.hcs-${CLASS.toLowerCase().replace(/\s+/g, '')}-${stamp}.json`)
  fs.writeFileSync(backup, JSON.stringify({ classId: cls!.id, academicYear: ay!.name, moves }, null, 1))
  console.log(`\nbefore-image written to ${backup}`)

  await p.$transaction(moves.map(m => p.classEnrollment.update({ where: { id: m.eid }, data: { sectionId: m.toId } })))
  console.log(`updated ${moves.length} enrollment rows.`)
  await p.$disconnect()
}
main().catch(async e => { console.error(e); await p.$disconnect(); process.exit(1) })
