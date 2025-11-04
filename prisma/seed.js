import prisma from '../lib/prisma.js';

const medicalConditions = ['Brain Cancer', 'Glioma', 'Lung Cancer', 'Breast Cancer', 'Heart Disease'];

async function main() {
  console.log('🌱 Starting database seed...');

  // Create forum categories
  const forumCategories = [
    {
      name: 'Cancer Research',
      description: 'Discussions about cancer treatments and research',
      slug: 'cancer-research',
      icon: '🎗️',
    },
    {
      name: 'Clinical Trials',
      description: 'Share experiences and ask about clinical trials',
      slug: 'clinical-trials',
      icon: '🔬',
    },
    {
      name: 'Heart Disease',
      description: 'Heart disease research and treatments',
      slug: 'heart-disease',
      icon: '❤️',
    },
    {
      name: 'General Health',
      description: 'General health discussions',
      slug: 'general-health',
      icon: '🏥',
    },
  ];

  for (const category of forumCategories) {
    await prisma.forumCategory.upsert({
      where: { slug: category.slug },
      update: {},
      create: category,
    });
  }

  console.log('✅ Forum categories created');

  // Create sample publications
  const samplePublications = [
    {
      title: 'Novel Immunotherapy Approaches in Brain Cancer Treatment',
      authors: ['Dr. Jane Smith', 'Dr. John Doe'],
      abstract: 'This study explores new immunotherapy methods for treating glioblastoma...',
      summary: 'Research shows promising results using CAR-T cell therapy for brain cancer.',
      journal: 'Nature Medicine',
      keywords: ['brain cancer', 'immunotherapy', 'glioblastoma'],
      url: 'https://example.com/publication1',
    },
    {
      title: 'Advances in Lung Cancer Screening and Early Detection',
      authors: ['Dr. Emily Johnson'],
      abstract: 'Early detection of lung cancer using AI-powered imaging...',
      summary: 'AI helps detect lung cancer 2 years earlier than traditional methods.',
      journal: 'JAMA Oncology',
      keywords: ['lung cancer', 'screening', 'AI'],
      url: 'https://example.com/publication2',
    },
  ];

  for (const pub of samplePublications) {
    await prisma.publication.create({
      data: pub,
    });
  }

  console.log('✅ Sample publications created');

  // Create sample clinical trials
  const sampleTrials = [
    {
      title: 'Phase III Trial of Novel Immunotherapy for Glioblastoma',
      description: 'A randomized, double-blind study evaluating a new immunotherapy agent...',
      summary: 'Testing new drug that helps immune system fight brain tumors.',
      phase: 'PHASE_3',
      status: 'RECRUITING',
      conditions: ['Glioblastoma', 'Brain Cancer'],
      interventions: ['Immunotherapy', 'Checkpoint Inhibitor'],
      eligibilityCriteria: 'Adults 18-75 with newly diagnosed glioblastoma',
      location: 'Multiple Sites',
      city: 'New York',
      country: 'United States',
      contactEmail: 'trials@example.com',
      nctId: 'NCT12345678',
      url: 'https://clinicaltrials.gov/study/NCT12345678',
    },
    {
      title: 'Study of Targeted Therapy for Non-Small Cell Lung Cancer',
      description: 'Investigating effectiveness of targeted therapy in NSCLC patients...',
      summary: 'New targeted treatment for lung cancer with fewer side effects.',
      phase: 'PHASE_2',
      status: 'RECRUITING',
      conditions: ['Lung Cancer', 'NSCLC'],
      interventions: ['Targeted Therapy'],
      eligibilityCriteria: 'Adults with Stage IIIB or IV NSCLC',
      location: 'Multiple Sites',
      city: 'Los Angeles',
      country: 'United States',
      contactEmail: 'lung-trials@example.com',
      nctId: 'NCT87654321',
      url: 'https://clinicaltrials.gov/study/NCT87654321',
    },
  ];

  for (const trial of sampleTrials) {
    await prisma.clinicalTrial.create({
      data: trial,
    });
  }

  console.log('✅ Sample clinical trials created');

  console.log('🎉 Database seed completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
