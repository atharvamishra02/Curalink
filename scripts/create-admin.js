const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Check if admin already exists
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@gmail.com' }
    });

    if (existingAdmin) {
      console.log('Admin user already exists!');
      console.log('Email: admin@gmail.com');
      console.log('Updating role to ADMIN...');
      
      await prisma.user.update({
        where: { email: 'admin@gmail.com' },
        data: { role: 'ADMIN' }
      });
      
      console.log('✅ Admin role updated successfully!');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('admin234', 10);

    // Create admin user
    const admin = await prisma.user.create({
      data: {
        email: 'admin@gmail.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'ADMIN',
        patientProfile: {
          create: {
            conditions: [],
            symptoms: ''
          }
        }
      }
    });

    console.log('✅ Admin user created successfully!');
    console.log('Email: admin@gmail.com');
    console.log('Password: admin234');
    console.log('Role: ADMIN');
    console.log('ID:', admin.id);

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
