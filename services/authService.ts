import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'study_assistant_user_id';

/**
 * Returns the currently authenticated user from cookies and database.
 */
export async function getCurrentUser() {
  try {
    const cookieStore = await cookies();
    const userId = cookieStore.get(COOKIE_NAME)?.value;

    if (!userId) return null;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        statistics: true,
      },
    });

    return user;
  } catch (error) {
    console.error('Error fetching current user:', error);
    return null;
  }
}

/**
 * Log in an existing user by email.
 */
export async function loginUser(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
    include: {
      statistics: true,
    },
  });

  if (!user) {
    throw new Error('User not found. Please register first.');
  }

  // Set auth cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return user;
}

/**
 * Register a new user and initialize study stats and activity.
 */
export async function registerUser(email: string, username: string) {
  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    throw new Error('User with this email already exists.');
  }

  // Create user and initial relations in a transaction
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: {
        email,
        username,
        avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(username)}`,
      },
    });

    // Create initial user statistics
    await tx.userStats.create({
      data: {
        userId: newUser.id,
        streakDays: 1,
        lastStudyDate: new Date(),
        totalStudyHours: 0,
        flashcardsCreated: 0,
        quizzesCompleted: 0,
        documentsUploaded: 0,
        achievements: ['welcome_badge'],
      },
    });

    // Create activity log
    await tx.activityLog.create({
      data: {
        userId: newUser.id,
        activity: 'Registered account',
        details: 'Welcome to AI Study Assistant!',
      },
    });

    return newUser;
  });

  // Set auth cookie
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 1 week
    path: '/',
  });

  return user;
}

/**
 * Logs out the current user by clearing the auth cookie.
 */
export async function logoutUser() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}
