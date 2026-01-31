/**
 * Quick verification that Prisma types are correctly generated
 */

import { PrismaClient, FeeStructureClass, FeeTypeClassAmount } from '@prisma/client';

// This will fail to compile if the types don't exist
const prisma = new PrismaClient();

// Type check - these should not cause compilation errors
const feeStructureClass: FeeStructureClass = {
  id: 'test',
  feeStructureId: 'test',
  classId: 'test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

const feeTypeClassAmount: FeeTypeClassAmount = {
  id: 'test',
  feeTypeId: 'test',
  classId: 'test',
  amount: 100,
  createdAt: new Date(),
  updatedAt: new Date(),
};

console.log('✅ Prisma types are correctly generated!');
console.log('   - FeeStructureClass type: ✓');
console.log('   - FeeTypeClassAmount type: ✓');
