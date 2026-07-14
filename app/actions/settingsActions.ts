'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser, logoutUser } from '@/services/authService';
import { redirect } from 'next/navigation';

/**
 * Exports all user data into a structured JSON string.
 */
export async function exportUserDataAction() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const fullData = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        statistics: true,
        documents: {
          select: { name: true, type: true, content: true, createdAt: true }
        },
        notes: {
          select: { title: true, content: true, summary: true, createdAt: true }
        },
        flashcardSets: {
          include: { flashcards: true }
        },
        quizzes: {
          include: { questions: true }
        },
        studyPlans: {
          include: { tasks: true }
        },
        tasks: {
          where: { studyPlanId: null }
        },
        activityLogs: true
      }
    });

    return {
      success: true,
      data: JSON.stringify(fullData, null, 2)
    };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Permanently deletes the user's account and all associated data.
 */
export async function deleteAccountAction() {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    await prisma.user.delete({
      where: { id: user.id }
    });

    await logoutUser();
  } catch (error) {
    return { error: (error as Error).message };
  }

  redirect('/');
}
