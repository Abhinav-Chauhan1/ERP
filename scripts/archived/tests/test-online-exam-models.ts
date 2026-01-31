/**
 * Test script to verify online exam models are working correctly
 */

import { PrismaClient, QuestionType, Difficulty, ExamAttemptStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function testOnlineExamModels() {
  console.log('Testing Online Exam Models...\n');

  try {
    // Test 1: Verify QuestionBank model exists and can be queried
    console.log('1. Testing QuestionBank model...');
    const questionCount = await prisma.questionBank.count();
    console.log(`   ✓ QuestionBank model accessible. Current count: ${questionCount}`);

    // Test 2: Verify OnlineExam model exists and can be queried
    console.log('2. Testing OnlineExam model...');
    const examCount = await prisma.onlineExam.count();
    console.log(`   ✓ OnlineExam model accessible. Current count: ${examCount}`);

    // Test 3: Verify ExamAttempt model exists and can be queried
    console.log('3. Testing ExamAttempt model...');
    const attemptCount = await prisma.examAttempt.count();
    console.log(`   ✓ ExamAttempt model accessible. Current count: ${attemptCount}`);

    // Test 4: Verify enums are accessible
    console.log('4. Testing enums...');
    console.log(`   ✓ QuestionType enum: ${Object.keys(QuestionType).join(', ')}`);
    console.log(`   ✓ Difficulty enum: ${Object.keys(Difficulty).join(', ')}`);
    console.log(`   ✓ ExamAttemptStatus enum: ${Object.keys(ExamAttemptStatus).join(', ')}`);

    // Test 5: Verify relationships exist
    console.log('5. Testing model relationships...');
    
    // Check if we can query with includes (this will fail if relationships don't exist)
    const questionWithRelations = await prisma.questionBank.findFirst({
      include: {
        subject: true,
        teacher: true,
      },
    });
    console.log(`   ✓ QuestionBank relationships (subject, teacher) are accessible`);

    const examWithRelations = await prisma.onlineExam.findFirst({
      include: {
        subject: true,
        class: true,
        teacher: true,
        attempts: true,
      },
    });
    console.log(`   ✓ OnlineExam relationships (subject, class, teacher, attempts) are accessible`);

    const attemptWithRelations = await prisma.examAttempt.findFirst({
      include: {
        exam: true,
        student: true,
      },
    });
    console.log(`   ✓ ExamAttempt relationships (exam, student) are accessible`);

    console.log('\n✅ All online exam models are working correctly!');
  } catch (error) {
    console.error('\n❌ Error testing online exam models:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the test
testOnlineExamModels()
  .then(() => {
    console.log('\nTest completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\nTest failed:', error);
    process.exit(1);
  });
