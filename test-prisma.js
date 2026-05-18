const { connectDB } = require('./lib/db');
const prisma = require('./lib/prisma');
require('dotenv').config();

async function main() {
  try {
    console.log('Testing Database connection...');
    await connectDB();
    console.log('DATABASE_URL:', process.env.DATABASE_URL);
    const userCount = await prisma.user.count();
    console.log('User count:', userCount);
  } catch (error) {
    console.error('Database test failed!');
    console.error(error);
  } finally {
    process.exit();
  }
}

main();
