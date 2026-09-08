/**
 * Apply a reconciliation plan to Howard Convent School's roster.
 *
 *   npx tsx scripts/fix-hcs-roster.ts --plan <plan.json>                  # dry run
 *   npx tsx scripts/fix-hcs-roster.ts --plan <plan.json> --apply          # write
 *   npx tsx scripts/fix-hcs-roster.ts --plan <plan.json> --apply --gender # include gender flips
 *
 * Plan shape: { moves:[{sid,adm,name,frm,to,kind}], fields:[{sid,adm,name,cls,set,old}] }
 * Placement comes from the UT-II marks list; field values come from the UDISE return.
 * A full before-image of every touched row is written to scripts/.hcs-backup-<ts>.json first.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'
const argv = process.argv
const planPath = argv[argv.indexOf('--plan') + 1]
if (!planPath || !fs.existsSync(planPath)) { console.error('missing --plan <file>'); process.exit(1) }
const PLAN = JSON.parse(fs.readFileSync(planPath, 'utf8'))
const APPLY = argv.includes('--apply')
const WITH_GENDER = argv.includes('--gender')
const p = new PrismaClient()

type Move = { sid:string; adm:string; name:string; frm:string; to:string; kind:string }
type Field = { sid:string; adm:string; name:string; cls:string; set:Record<string,string>; old:Record<string,string> }

async function main() {
  console.log(APPLY ? '=== APPLYING ===' : '=== DRY RUN (no writes) ===')
  console.log(`plan: ${planPath}`)
  console.log(WITH_GENDER ? 'gender changes: INCLUDED' : 'gender changes: skipped (--gender to include)')

  const classes = await p.class.findMany({
    where: { schoolId: SCHOOL_ID, academicYear: { isCurrent: true } },
    select: { id:true, name:true, sections:{ select:{ id:true, name:true } } } })
  const target = (label:string) => {
    const parts = label.trim().split(/\s+/); const sec = parts.pop()!; const cls = parts.join(' ')
    const c = classes.find(x => x.name.trim() === cls); if (!c) throw new Error(`no class ${cls}`)
    const s = c.sections.find(x => x.name.trim() === sec); if (!s) throw new Error(`no section ${label}`)
    return { classId: c.id, sectionId: s.id }
  }

  const sids = [...new Set([...(PLAN.moves||[]).map((m:Move)=>m.sid), ...(PLAN.fields||[]).map((f:Field)=>f.sid)])] as string[]
  const before = await p.student.findMany({ where: { id: { in: sids } },
    select: { id:true, admissionId:true, fatherName:true, motherName:true, pen:true, gender:true,
      category:true, aadhaarNumber:true, user:{ select:{ id:true, name:true } },
      enrollments:{ select:{ id:true, classId:true, sectionId:true, status:true,
        class:{select:{name:true}}, section:{select:{name:true}} } } } })

  const stamp = new Date().toISOString().replace(/[:.]/g,'-')
  const backup = path.join('scripts', `.hcs-backup-${stamp}.json`)
  if (APPLY) { fs.writeFileSync(backup, JSON.stringify(before, null, 1))
    console.log(`\nbefore-image of ${before.length} students -> ${backup}`) }

  // ---- guard: never write a PEN another student already holds ----
  const wantPens = (PLAN.fields||[]).filter((f:Field)=>f.set.pen).map((f:Field)=>f.set.pen)
  const held = wantPens.length ? await p.student.findMany({
    where:{ schoolId: SCHOOL_ID, pen:{ in: wantPens } },
    select:{ id:true, pen:true, admissionId:true, user:{select:{name:true}} } }) : []
  const planSids = new Set(sids)
  const blockedPens = new Set(held.filter(h=>!planSids.has(h.id)).map(h=>h.pen!))
  for (const h of held.filter(h=>!planSids.has(h.id)))
    console.log(`   PEN GUARD: ${h.pen} already held by adm ${h.admissionId} ${h.user.name} — skipping that write`)

  let moved = 0, skipped = 0
  if ((PLAN.moves||[]).length) console.log(`\n--- placement moves (${PLAN.moves.length})`)
  for (const m of (PLAN.moves||[]) as Move[]) {
    const st = before.find(b => b.id === m.sid)
    const enr = st?.enrollments.find(e => e.status === 'ACTIVE')
    if (!enr) { console.log(`   SKIP ${m.name} (${m.adm}) — no active enrolment`); skipped++; continue }
    const cur = `${enr.class.name.trim()} ${enr.section.name.trim()}`
    if (cur !== m.frm) { console.log(`   SKIP ${m.name} (${m.adm}) — now in ${cur}, expected ${m.frm}`); skipped++; continue }
    const t = target(m.to)
    console.log(`   ${m.frm} -> ${m.to}  ${m.name} (${m.adm})`)
    if (APPLY) await p.classEnrollment.update({ where:{ id: enr.id }, data:{ classId:t.classId, sectionId:t.sectionId } })
    moved++
  }

  console.log(`\n--- field updates from UDISE (${(PLAN.fields||[]).length} students)`)
  let updated = 0, genderHeld = 0, penHeld = 0
  for (const f of (PLAN.fields||[]) as Field[]) {
    const data: Record<string,string> = {}
    for (const [k,v] of Object.entries(f.set)) {
      if (k === 'gender' && !WITH_GENDER) { genderHeld++; continue }
      if (k === 'pen' && blockedPens.has(v)) { penHeld++; continue }
      data[k] = v
    }
    if (!Object.keys(data).length) continue
    console.log(`   ${f.cls.padEnd(18)} ${f.name.slice(0,20).padEnd(22)} ` +
      Object.entries(data).map(([k,v])=>`${k}: ${f.old[k]} -> ${v}`).join(' | '))
    if (APPLY) await p.student.update({ where:{ id: f.sid }, data })
    updated++
  }

  console.log(`\n=== ${APPLY ? 'APPLIED' : 'WOULD APPLY'} ===`)
  console.log(`  placement moves : ${moved}${skipped?` (${skipped} skipped)`:''}`)
  console.log(`  students updated: ${updated}${genderHeld?` (${genderHeld} gender held back)`:''}${penHeld?` (${penHeld} PEN held back)`:''}`)
  if (!APPLY) console.log('\nNothing was written. Re-run with --apply to commit.')
  else console.log(`\nRollback data: ${backup}`)
}
main().catch(e=>{console.error(e);process.exit(1)}).finally(()=>p.$disconnect())
