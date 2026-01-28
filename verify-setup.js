const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifySetup() {
  try {
    console.log('🔍 Verifying database setup...');
    
    // Check subscription plans
    const plans = await prisma.subscriptionPlan.count();
    console.log(`✅ Subscription Plans: ${plans}`);
    
    // Check enhanced subscriptions
    const subscriptions = await prisma.enhancedSubscription.count();
    console.log(`✅ Enhanced Subscriptions: ${subscriptions}`);
    
    // Check analytics events
    const events = await prisma.analyticsEvent.count();
    console.log(`✅ Analytics Events: ${events}`);
    
    // Check support tickets
    const tickets = await prisma.supportTicket.count();
    console.log(`✅ Support Tickets: ${tickets}`);
    
    // Check knowledge base articles
    const articles = await prisma.knowledgeBaseArticle.count();
    console.log(`✅ Knowledge Base Articles: ${articles}`);
    
    console.log('\n🎉 Database setup verification completed successfully!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

verifySetup();