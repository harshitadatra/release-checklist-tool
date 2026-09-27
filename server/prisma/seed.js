import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function seed() {
  console.log('🌱 Seeding database...');

  // Clear existing data
  await prisma.release.deleteMany({});

  // Create sample releases
  const releases = [
    {
      name: 'Version 1.0.1',
      date: new Date('2024-09-20'),
      additionalInfo: 'Patch release with bug fixes',
      completedSteps: [0, 1, 2, 3, 4, 5, 6], // All done
    },
    {
      name: 'Version 1.0.2',
      date: new Date('2024-09-28'),
      additionalInfo: 'Security updates and performance improvements',
      completedSteps: [0, 1, 2, 3, 4, 5, 6], // All done
    },
    {
      name: 'Version 1.1.0',
      date: new Date('2024-10-10'),
      additionalInfo: 'New feature: Release checklist dashboard',
      completedSteps: [0, 1, 2], // Ongoing
    },
    {
      name: 'Version 2 (beta)',
      date: new Date('2024-11-01'),
      additionalInfo: null,
      completedSteps: [], // Planned
    },
  ];

  for (const release of releases) {
    await prisma.release.create({ data: release });
  }

  console.log(`✅ Seeded ${releases.length} releases`);
}

seed()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
