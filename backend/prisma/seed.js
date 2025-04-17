const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  const password = await bcrypt.hash('Pharma@123', 10);

  const users = [
    { employeeId: 'EMP-0001', name: 'System Administrator', email: 'admin@pharma.com', role: 'ADMIN', department: 'IT' },
    { employeeId: 'EMP-0002', name: 'Site Training Coordinator', email: 'stc@pharma.com', role: 'STC', department: 'Quality Assurance' },
    { employeeId: 'EMP-0003', name: 'DTC Production', email: 'dtc@pharma.com', role: 'DTC', department: 'Production' },
    { employeeId: 'EMP-0004', name: 'Lead Trainer', email: 'trainer@pharma.com', role: 'TRAINER', department: 'Quality Assurance' },
    { employeeId: 'EMP-0005', name: 'Operator One', email: 'user1@pharma.com', role: 'USER', department: 'Production' },
    { employeeId: 'EMP-0006', name: 'Operator Two', email: 'user2@pharma.com', role: 'USER', department: 'Production' }
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { ...u, passwordHash: password }
    });
  }

  await prisma.training.upsert({
    where: { code: 'TRN-0001' },
    update: {},
    create: {
      code: 'TRN-0001',
      title: 'GMP Fundamentals & Data Integrity',
      description: 'Annual GMP refresher covering ALCOA+ principles, documentation practices and contamination control.',
      sopReference: 'SOP-QA-014',
      department: 'Production'
    }
  });

  console.log('Seed complete. All demo passwords: Pharma@123');
}

main().finally(() => prisma.$disconnect());
