// Test database connection
import prisma from '../lib/prisma.js';

async function testConnection() {
  try {
    console.log('🔄 Testing database connection...');
    
    // Try to connect and query
    const result = await prisma.$queryRaw`SELECT 1 as test`;
    console.log('✅ Database connection successful!');
    console.log('Result:', result);
    
    // Try to count users
    const userCount = await prisma.user.count();
    console.log(`📊 Total users in database: ${userCount}`);
    
    await prisma.$disconnect();
    console.log('✅ Disconnected successfully');
    
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    console.error('Error details:', error);
    process.exit(1);
  }
}

testConnection();
