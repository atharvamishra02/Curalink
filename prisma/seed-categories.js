const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('Seeding forum categories...');

  const categories = [
    {
      name: 'General Discussion',
      slug: 'general',
      description: 'General discussions about research and academia',
      icon: '💬'
    },
    {
      name: 'Research & Methodology',
      slug: 'research',
      description: 'Discussions about research methods and approaches',
      icon: '🔬'
    },
    {
      name: 'Clinical Trials',
      slug: 'clinical-trials',
      description: 'Topics related to clinical trials and studies',
      icon: '🏥'
    },
    {
      name: 'Publications',
      slug: 'publications',
      description: 'Discussions about publications and peer review',
      icon: '📚'
    },
    {
      name: 'Questions & Answers',
      slug: 'qa',
      description: 'Ask and answer questions',
      icon: '❓'
    },
    {
      name: 'Collaboration Opportunities',
      slug: 'collaboration',
      description: 'Find collaborators and research partners',
      icon: '🤝'
    }
  ];

  for (const category of categories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: category,
      create: category
    });
    console.log(`✓ Created/Updated category: ${category.name}`);
  }

  console.log('✅ Forum categories seeded successfully!');
}

main()
  .catch((e) => {
    console.error('Error seeding categories:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
