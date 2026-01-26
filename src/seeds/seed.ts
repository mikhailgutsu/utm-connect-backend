// src/seeds/seed.ts
import { prisma } from '@/prisma/client';

async function main() {
  console.log('🌱 Starting to seed the database...\n');

  // Clear existing data
  console.log('🗑️  Clearing existing data...');
  await prisma.linkAnalytic.deleteMany();
  await prisma.link.deleteMany();
  await prisma.campaign.deleteMany();
  await prisma.user.deleteMany();

  // Create test users
  console.log('👥 Creating test users...');
  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      name: 'John Doe',
      password: 'hashed_password_123', // TODO: hash in production
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      name: 'Jane Smith',
      password: 'hashed_password_456',
    },
  });

  console.log(`✅ Created users: ${user1.email}, ${user2.email}\n`);

  // Create test campaigns
  console.log('📢 Creating test campaigns...');
  const campaign1 = await prisma.campaign.create({
    data: {
      name: 'Summer Sale 2026',
      description: 'Marketing campaign for summer products',
      userId: user1.id,
    },
  });

  const campaign2 = await prisma.campaign.create({
    data: {
      name: 'Product Launch',
      description: 'New feature announcement campaign',
      userId: user1.id,
    },
  });

  const campaign3 = await prisma.campaign.create({
    data: {
      name: 'Black Friday 2026',
      description: 'Black Friday special offers',
      userId: user2.id,
    },
  });

  console.log(`✅ Created campaigns: ${campaign1.name}, ${campaign2.name}, ${campaign3.name}\n`);

  // Create test links
  console.log('🔗 Creating test links...');
  const link1 = await prisma.link.create({
    data: {
      originalUrl: 'https://example.com/products/summer-collection?utm_source=email&utm_medium=newsletter',
      shortCode: 'sum2026',
      campaignId: campaign1.id,
      userId: user1.id,
    },
  });

  const link2 = await prisma.link.create({
    data: {
      originalUrl: 'https://example.com/new-feature?utm_source=twitter&utm_medium=social',
      shortCode: 'newft',
      campaignId: campaign2.id,
      userId: user1.id,
    },
  });

  const link3 = await prisma.link.create({
    data: {
      originalUrl: 'https://example.com/black-friday?utm_source=instagram&utm_medium=social&utm_campaign=bf2026',
      shortCode: 'bf2026',
      campaignId: campaign3.id,
      userId: user2.id,
    },
  });

  const link4 = await prisma.link.create({
    data: {
      originalUrl: 'https://example.com/promo?utm_source=facebook&utm_medium=cpc&utm_campaign=awareness',
      shortCode: 'promo99',
      userId: user2.id,
    },
  });

  console.log(`✅ Created links: ${link1.shortCode}, ${link2.shortCode}, ${link3.shortCode}, ${link4.shortCode}\n`);

  // Create test analytics
  console.log('📊 Creating test analytics...');
  await prisma.linkAnalytic.create({
    data: {
      linkId: link1.id,
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      referer: 'https://example.com',
      ipAddress: '192.168.1.1',
    },
  });

  await prisma.linkAnalytic.create({
    data: {
      linkId: link1.id,
      userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_7_1 like Mac OS X)',
      referer: 'https://twitter.com',
      ipAddress: '192.168.1.2',
    },
  });

  await prisma.linkAnalytic.create({
    data: {
      linkId: link2.id,
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      referer: 'https://facebook.com',
      ipAddress: '192.168.1.3',
    },
  });

  console.log('✅ Created analytics data\n');

  // Summary
  const userCount = await prisma.user.count();
  const campaignCount = await prisma.campaign.count();
  const linkCount = await prisma.link.count();
  const analyticCount = await prisma.linkAnalytic.count();

  console.log('📊 Database Summary:');
  console.log(`   👥 Users: ${userCount}`);
  console.log(`   📢 Campaigns: ${campaignCount}`);
  console.log(`   🔗 Links: ${linkCount}`);
  console.log(`   📈 Analytics: ${analyticCount}\n`);

  console.log('✨ Database seeded successfully!\n');

  console.log('🔗 Test Links:');
  console.log(`   short: ${link1.shortCode} → ${link1.originalUrl.substring(0, 50)}...`);
  console.log(`   short: ${link2.shortCode} → ${link2.originalUrl.substring(0, 50)}...`);
  console.log(`   short: ${link3.shortCode} → ${link3.originalUrl.substring(0, 50)}...`);
  console.log(`   short: ${link4.shortCode} → ${link4.originalUrl.substring(0, 50)}...\n`);

  console.log('🧪 Test API Calls:');
  console.log(`   GET http://localhost:3000/api/users/me`);
  console.log(`   GET http://localhost:3000/api/campaigns/user/${user1.id}`);
  console.log(`   GET http://localhost:3000/api/links/${link1.shortCode}\n`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
