/**
 * Create a single Howard Convent student (User + Student + ClassEnrollment + UserSchool).
 *
 *   npx tsx scripts/create-hcs-student.ts --data <student.json>            # dry run
 *   npx tsx scripts/create-hcs-student.ts --data <student.json> --apply    # create
 *
 * Refuses to run if the admission ID is already taken. Writes the created ids to
 * scripts/.hcs-CREATED-<ts>.json so the record can be removed again if needed.
 */
import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import path from 'path'

const SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'
const argv = process.argv
const dataPath = argv[argv.indexOf('--data') + 1]
if (!dataPath || !fs.existsSync(dataPath)) { console.error('missing --data <file>'); process.exit(1) }
const APPLY = argv.includes('--apply')
const d = JSON.parse(fs.readFileSync(dataPath, 'utf8'))
const p = new PrismaClient()

async function main() {
  console.log(APPLY ? '=== CREATING ===' : '=== DRY RUN (nothing written) ===')

  const clash = await p.student.findUnique({ where: { admissionId: d.admissionId }, select: { id: true } })
  if (clash) { console.error(`admission ID ${d.admissionId} is already in use — aborting`); process.exit(1) }

  const parts = d.section.trim().split(/\s+/)
  const sec = parts.pop()!, cls = parts.join(' ')
  const section = await p.classSection.findFirst({
    where: { schoolId: SCHOOL_ID, class: { name: cls, academicYear: { isCurrent: true } } , name: { startsWith: sec } },
    include: { class: true } })
  if (!section) { console.error(`section not found: ${d.section}`); process.exit(1) }

  const [firstName, ...rest] = d.name.split(/\s+/)
  console.log(`   name          ${d.name}`)
  console.log(`   admission ID  ${d.admissionId}`)
  console.log(`   class         ${section.class.name} ${section.name.trim()}  (${section.id})`)
  console.log(`   father        ${d.fatherName}`)
  console.log(`   mother        ${d.motherName}`)
  console.log(`   gender        ${d.gender}`)
  console.log(`   date of birth ${d.dateOfBirth}${d.dobIsPlaceholder ? '   <-- PLACEHOLDER, replace when known' : ''}`)
  console.log(`   category      ${d.category}`)
  console.log(`   address       ${d.address}`)
  console.log(`   parent mobile ${d.parentMobile}`)

  if (!APPLY) { console.log('\nNothing was written. Re-run with --apply to create.'); return }

  const out = await p.$transaction(async (tx) => {
    const user = await tx.user.create({ data: {
      name: d.name, firstName, lastName: rest.join(' ') || null,
      role: 'STUDENT', isActive: true, phone: d.parentMobile ?? null, mustChangePassword: true } })
    const student = await tx.student.create({ data: {
      userId: user.id, schoolId: SCHOOL_ID, admissionId: d.admissionId,
      admissionDate: new Date(d.admissionDate), dateOfBirth: new Date(d.dateOfBirth),
      gender: d.gender, fatherName: d.fatherName, motherName: d.motherName,
      category: d.category ?? null, address: d.address ?? null,
      parentMobile: d.parentMobile ?? null, nationality: 'Indian' } })
    const enrol = await tx.classEnrollment.create({ data: {
      studentId: student.id, classId: section.classId, sectionId: section.id,
      schoolId: SCHOOL_ID, status: 'ACTIVE', enrollDate: new Date(d.admissionDate) } })
    await tx.userSchool.create({ data: { userId: user.id, schoolId: SCHOOL_ID, role: 'STUDENT', isActive: true } })
    return { userId: user.id, studentId: student.id, enrolId: enrol.id }
  })

  const stamp = new Date().toISOString().replace(/[:.]/g,'-')
  const rec = path.join('scripts', `.hcs-CREATED-${stamp}.json`)
  fs.writeFileSync(rec, JSON.stringify({ createdAt: stamp, input: d, ...out }, null, 1))
  console.log(`\n=== CREATED ===\n   student ${out.studentId}\n   user    ${out.userId}\n   enrol   ${out.enrolId}`)
  console.log(`   record: ${rec}`)
}
main().catch(e => { console.error(e); process.exit(1) }).finally(() => p.$disconnect())
