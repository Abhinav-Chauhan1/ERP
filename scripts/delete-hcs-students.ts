/**
 * PERMANENTLY delete a set of Howard Convent students and their user accounts.
 *
 *   npx tsx scripts/delete-hcs-students.ts --list <ids.json>            # dry run
 *   npx tsx scripts/delete-hcs-students.ts --list <ids.json> --apply    # DELETE
 *
 * <ids.json> is an array of objects each carrying at least { id, admissionId, name }.
 *
 * A complete snapshot of every row about to be removed is written to
 * scripts/.hcs-DELETED-<ts>.json BEFORE anything is deleted. That file is the only
 * way back — this operation is irreversible.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const argv = process.argv
const listPath = argv[argv.indexOf('--list') + 1]
if (!listPath || !fs.existsSync(listPath)) { console.error('missing --list <file>'); process.exit(1) }
const APPLY = argv.includes('--apply')
const targets = JSON.parse(fs.readFileSync(listPath, 'utf8')) as Array<{id:string;admissionId:string;name:string}>
const ids = targets.map(t => t.id)
const p = new PrismaClient()

async function main() {
  console.log(APPLY ? '=== PERMANENTLY DELETING ===' : '=== DRY RUN (nothing will be deleted) ===')
  console.log(`students targeted: ${ids.length}\n`)

  const students = await p.student.findMany({
    where: { id: { in: ids } },
    include: { user: true, enrollments: { include: { class: true, section: true } }, feeTypeAmounts: true },
  })
  if (students.length !== ids.length)
    console.log(`WARNING: ${ids.length - students.length} of the targeted ids no longer exist`)

  for (const s of students) {
    const e = s.enrollments.find(x => x.status === 'ACTIVE')
    console.log(`   ${s.admissionId.padEnd(6)} ${s.user.name.slice(0,24).padEnd(26)} ` +
      `${e ? (e.class.name + ' ' + e.section.name.trim()).padEnd(14) : '(no enrolment)'.padEnd(14)} ` +
      `PEN ${(s.pen ?? '-').padEnd(13)} enrolments ${s.enrollments.length}  feeAmounts ${s.feeTypeAmounts.length}`)
  }

  const userIds = students.map(s => s.userId)
  const snapshot = {
    deletedAt: new Date().toISOString(),
    students,
    userSchools: await p.userSchool.findMany({ where: { userId: { in: userIds } } }),
  }

  if (!APPLY) {
    console.log(`\nWould delete: ${students.length} students, ${students.length} user accounts, ` +
      `${students.reduce((n,s)=>n+s.enrollments.length,0)} enrolments, ` +
      `${students.reduce((n,s)=>n+s.feeTypeAmounts.length,0)} fee-amount rows, ` +
      `${snapshot.userSchools.length} user-school links.`)
    console.log('\nNothing was deleted. Re-run with --apply to commit.')
    return
  }

  const stamp = new Date().toISOString().replace(/[:.]/g,'-')
  const backup = path.join('scripts', `.hcs-DELETED-${stamp}.json`)
  fs.writeFileSync(backup, JSON.stringify(snapshot, null, 1))
  console.log(`\nfull snapshot written to ${backup}`)

  const res = await p.$transaction(async (tx) => {
    const fee  = await tx.feeTypeStudentAmount.deleteMany({ where: { studentId: { in: ids } } })
    const enr  = await tx.classEnrollment.deleteMany({ where: { studentId: { in: ids } } })
    const stu  = await tx.student.deleteMany({ where: { id: { in: ids } } })
    const us   = await tx.userSchool.deleteMany({ where: { userId: { in: userIds } } })
    const usr  = await tx.user.deleteMany({ where: { id: { in: userIds } } })
    return { fee: fee.count, enr: enr.count, stu: stu.count, us: us.count, usr: usr.count }
  })

  console.log('\n=== DELETED ===')
  console.log(`   fee-amount rows : ${res.fee}`)
  console.log(`   enrolments      : ${res.enr}`)
  console.log(`   students        : ${res.stu}`)
  console.log(`   user-school     : ${res.us}`)
  console.log(`   user accounts   : ${res.usr}`)
  console.log(`\nIrreversible. Snapshot: ${backup}`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
