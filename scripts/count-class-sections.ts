import { PrismaClient } from '@prisma/client'
const p = new PrismaClient()
const SCHOOL_ID = 'cmpavpvbu000nog4o78c6q1u5'

async function main() {
  const school = await p.school.findUnique({ where: { id: SCHOOL_ID }, select: { name: true } })
  const ay = await p.academicYear.findFirst({ where: { schoolId: SCHOOL_ID, isCurrent: true }, select: { id: true, name: true } })
  console.log(`School: ${school?.name}   AY: ${ay?.name}\n`)

  const classes = await p.class.findMany({
    where: { schoolId: SCHOOL_ID, academicYearId: ay!.id },
    select: { id: true, name: true, sections: { select: { id: true, name: true, capacity: true } } },
  })

  const grouped = await p.classEnrollment.groupBy({
    by: ['classId', 'sectionId', 'status'],
    where: { schoolId: SCHOOL_ID, classId: { in: classes.map(c => c.id) } },
    _count: { _all: true },
  })
  const key = (c: string, s: string, st: string) => `${c}|${s}|${st}`
  const m = new Map<string, number>()
  for (const g of grouped) m.set(key(g.classId, g.sectionId, g.status), g._count._all)

  const statuses = [...new Set(grouped.map(g => g.status))].sort()
  console.log('Class            Section   ACTIVE  ' + statuses.filter(s => s !== 'ACTIVE').join('  '))
  console.log('-'.repeat(70))

  const num = (n: string) => { const mm = n.match(/(\d+)/); return mm ? parseInt(mm[1]) : 999 }
  classes.sort((a, b) => num(a.name) - num(b.name) || a.name.localeCompare(b.name))

  let grandActive = 0, grandAll = 0
  for (const c of classes) {
    let clsActive = 0, clsAll = 0
    const secs = [...c.sections].sort((a, b) => a.name.localeCompare(b.name))
    for (const s of secs) {
      const active = m.get(key(c.id, s.id, 'ACTIVE')) ?? 0
      const others = statuses.filter(x => x !== 'ACTIVE').map(x => `${x}:${m.get(key(c.id, s.id, x)) ?? 0}`)
      const nonZeroOthers = others.filter(o => !o.endsWith(':0'))
      const all = statuses.reduce((t, x) => t + (m.get(key(c.id, s.id, x)) ?? 0), 0)
      clsActive += active; clsAll += all
      console.log(`${c.name.padEnd(16)} ${s.name.padEnd(9)} ${String(active).padStart(5)}   ${nonZeroOthers.join(' ')}`)
    }
    console.log(`${(' ' + c.name + ' TOTAL').padEnd(26)} ${String(clsActive).padStart(5)}   (all statuses: ${clsAll})`)
    console.log('')
    grandActive += clsActive; grandAll += clsAll
  }
  console.log('='.repeat(70))
  console.log(`TOTAL enrolled (ACTIVE): ${grandActive}   (all statuses: ${grandAll})`)

  const totalStudents = await p.student.count({ where: { schoolId: SCHOOL_ID } })
  const enrolledIds = await p.classEnrollment.findMany({
    where: { schoolId: SCHOOL_ID, classId: { in: classes.map(c => c.id) } },
    select: { studentId: true },
  })
  const uniq = new Set(enrolledIds.map(e => e.studentId))
  console.log(`Student rows for school: ${totalStudents}   distinct students with an enrollment this AY: ${uniq.size}   unplaced: ${totalStudents - uniq.size}`)

  const dupes = [...uniq].length
  const multi = enrolledIds.length - dupes
  if (multi > 0) console.log(`WARNING: ${multi} extra enrollment rows (students enrolled in >1 class/section this AY)`)

  await p.$disconnect()
}
main().catch(async e => { console.error(e); await p.$disconnect(); process.exit(1) })
