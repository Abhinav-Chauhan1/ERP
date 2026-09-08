/**
 * Reconcile Howard Convent School Class 1 & 2 against the UT-II marks list (class/section)
 * and the UDISE return (parent names, PEN, gender, category).
 *
 *   npx tsx scripts/fix-hcs-class-1-2.ts                 # dry run (default)
 *   npx tsx scripts/fix-hcs-class-1-2.ts --apply         # write, excluding gender flips
 *   npx tsx scripts/fix-hcs-class-1-2.ts --apply --gender # also apply the 4 gender changes
 *
 * Writes a full before-image of every touched row to scripts/.hcs-backup-<ts>.json first.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'
const PLAN = JSON.parse(fs.readFileSync(
  '/tmp/claude-1000/-home-abhinav-Documents-Projects-ERP/5182e1eb-5a8f-44b0-af41-f85deb5d1e08/scratchpad/recon/apply12.json','utf8'))

const APPLY = process.argv.includes('--apply')
const WITH_GENDER = process.argv.includes('--gender')
const p = new PrismaClient()

type Move = { sid:string; adm:string; name:string; frm:string; to:string; kind:string }
type Field = { sid:string; adm:string; name:string; cls:string; set:Record<string,string>; old:Record<string,string> }

async function main() {
  console.log(APPLY ? '=== APPLYING CHANGES ===' : '=== DRY RUN (no writes) ===')
  console.log(WITH_GENDER ? 'gender changes: INCLUDED' : 'gender changes: skipped (pass --gender to include)')

  // resolve target class/section ids
  const classes = await p.class.findMany({
    where: { schoolId: SCHOOL_ID, academicYear: { isCurrent: true } },
    select: { id:true, name:true, sections:{ select:{ id:true, name:true } } },
  })
  const secId = (label:string) => {
    const parts = label.trim().split(/\s+/)
    const sec = parts.pop()!
    const cls = parts.join(' ')
    const c = classes.find(x => x.name.trim() === cls)
    if (!c) throw new Error(`class not found: ${cls}`)
    const s = c.sections.find(x => x.name.trim() === sec)
    if (!s) throw new Error(`section not found: ${label}`)
    return { classId: c.id, sectionId: s.id }
  }

  const sids = [...new Set([...PLAN.moves.map((m:Move)=>m.sid), ...PLAN.fields.map((f:Field)=>f.sid)])]
  const before = await p.student.findMany({
    where: { id: { in: sids as string[] } },
    select: { id:true, admissionId:true, fatherName:true, motherName:true, pen:true, gender:true,
      category:true, aadhaarNumber:true,
      user:{ select:{ id:true, name:true } },
      enrollments:{ select:{ id:true, classId:true, sectionId:true, status:true,
        class:{select:{name:true}}, section:{select:{name:true}} } } },
  })
  const stamp = new Date().toISOString().replace(/[:.]/g,'-')
  const backup = path.join('scripts', `.hcs-backup-${stamp}.json`)
  if (APPLY) {
    fs.writeFileSync(backup, JSON.stringify(before, null, 1))
    console.log(`\nbefore-image of ${before.length} students written to ${backup}`)
  }

  // ---------------- 1. section moves ----------------
  console.log(`\n--- 1. placement moves (${PLAN.moves.length})`)
  let moved = 0, moveSkip = 0
  for (const m of PLAN.moves as Move[]) {
    const st = before.find(b => b.id === m.sid)
    const enr = st?.enrollments.find(e => e.status === 'ACTIVE')
    if (!enr) { console.log(`   SKIP ${m.name} (${m.adm}) — no active enrolment`); moveSkip++; continue }
    const cur = `${enr.class.name.trim()} ${enr.section.name.trim()}`
    if (cur !== m.frm) { console.log(`   SKIP ${m.name} (${m.adm}) — now in ${cur}, plan expected ${m.frm}`); moveSkip++; continue }
    const t = secId(m.to)
    console.log(`   ${m.frm} -> ${m.to}  ${m.name} (${m.adm})`)
    if (APPLY) {
      // @@unique([studentId, classId, sectionId]) — safe because the target row does not exist
      await p.classEnrollment.update({ where: { id: enr.id }, data: { classId: t.classId, sectionId: t.sectionId } })
    }
    moved++
  }

  // ---------------- 2. field updates ----------------
  console.log(`\n--- 2. field updates from UDISE (${PLAN.fields.length})`)
  let updated = 0, genderSkipped = 0
  for (const f of PLAN.fields as Field[]) {
    const data: Record<string,string> = {}
    for (const [k,v] of Object.entries(f.set)) {
      if (k === 'gender' && !WITH_GENDER) { genderSkipped++; continue }
      data[k] = v
    }
    if (!Object.keys(data).length) continue
    const shown = Object.entries(data).map(([k,v]) => `${k}: ${f.old[k]} -> ${v}`).join(' | ')
    console.log(`   ${f.cls.padEnd(11)} ${f.name.slice(0,20).padEnd(22)} ${shown}`)
    if (APPLY) await p.student.update({ where: { id: f.sid }, data })
    updated++
  }

  console.log(`\n=== ${APPLY ? 'APPLIED' : 'WOULD APPLY'} ===`)
  console.log(`  placement moves : ${moved}${moveSkip ? ` (${moveSkip} skipped)` : ''}`)
  console.log(`  students updated: ${updated}${genderSkipped ? ` (${genderSkipped} gender changes held back)` : ''}`)
  if (!APPLY) console.log('\nNothing was written. Re-run with --apply to commit.')
  else console.log(`\nRollback data: ${backup}`)

  // ---------------- verification ----------------
  if (APPLY) {
    const after = await p.classEnrollment.groupBy({
      by: ['classId','sectionId'], where: { schoolId: SCHOOL_ID, status: 'ACTIVE' }, _count: true })
    const nameOf = (cid:string, sid:string) => {
      const c = classes.find(x=>x.id===cid); return `${c?.name} ${c?.sections.find(s=>s.id===sid)?.name}`
    }
    console.log('\n--- Class 1 & 2 section counts after the change')
    after.map(a=>({label:nameOf(a.classId,a.sectionId), n:a._count}))
         .filter(x=>/^Class [12] /.test(x.label)).sort((a,b)=>a.label.localeCompare(b.label))
         .forEach(x=>console.log(`   ${x.label.padEnd(12)} ${x.n}`))
  }
}
main().catch(e=>{ console.error(e); process.exit(1) }).finally(()=>p.$disconnect())
