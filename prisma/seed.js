const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const email = 'demo@studysync.ai';
  
  // Check if exists
  const existing = await prisma.user.findUnique({
    where: { email }
  });

  if (existing) {
    console.log('Demo user already seeded.');
    return;
  }

  // Create demo user
  const user = await prisma.user.create({
    data: {
      email,
      username: 'DemoScholar',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=DemoScholar',
      statistics: {
        create: {
          streakDays: 5,
          lastStudyDate: new Date(),
          totalStudyHours: 12.5,
          flashcardsCreated: 24,
          quizzesCompleted: 6,
          documentsUploaded: 2,
          achievements: ['welcome_badge', 'first_upload', 'streak_3'],
        }
      },
      activityLogs: {
        create: [
          { activity: 'Registered account', details: 'Welcome to StudySync.ai!' },
          { activity: 'Uploaded document', details: 'Uploaded syllabus.pdf' },
          { activity: 'Generated flashcards', details: 'Created 8 cards for Chapter 1' },
          { activity: 'Completed quiz', details: 'Scored 85% on Biology Basics' }
        ]
      }
    }
  });

  console.log('Successfully seeded database with demo user:', user.email);
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
