import { prisma } from '@/prisma/client';

async function main() {
  console.log('Seeding database...');
  
  // Clear all data
  await prisma.linkAnalytic.deleteMany();
  await prisma.post.deleteMany();
  await prisma.group.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.user.deleteMany();

  // Create users
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: 'hashed_pass',
      phoneNumber: '+1234567890',
      universityGroup: 'CR-211',
      role: 0,
    },
  });

  await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: 'hashed_pass',
      phoneNumber: '+0987654321',
      universityGroup: 'CR-212',
      role: 0,
      friends: [user1.id],
    },
  });

  console.log('✅ Seeding complete');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
