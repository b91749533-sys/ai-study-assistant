'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';
import { generateStudyPlan } from '@/services/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Generate a study plan using Gemini and populate tasks.
 */
export async function generateStudyPlanAction(
  examDate: string,
  hoursPerWeek: number,
  difficulty: string,
  subjects: string[]
) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    // Call Gemini API to generate plan structure
    const planData = await generateStudyPlan(examDate, hoursPerWeek, difficulty, subjects);

    // Save StudyPlan and associated Tasks in database
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId: user.id,
        title: planData.title || `Plan for ${subjects.join(', ')}`,
        examDate: examDate ? new Date(examDate) : null,
        difficulty,
        hoursPerWeek,
        subjects,
        tasks: {
          create: planData.tasks.map(task => ({
            userId: user.id,
            title: task.title,
            description: task.description,
            dueDate: task.dueDate ? new Date(task.dueDate) : null,
          })),
        },
      },
      include: {
        tasks: true,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Generated study plan',
        details: `Generated study calendar for "${studyPlan.title}" containing ${planData.tasks.length} sessions.`,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true, studyPlan };
  } catch (error) {
    console.error('Error generating study plan:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Fetch all study plans.
 */
export async function getStudyPlansAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.studyPlan.findMany({
    where: { userId: user.id },
    include: {
      tasks: true,
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch all study planner tasks (both plan-linked and standalone).
 */
export async function getTasksAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.task.findMany({
    where: { userId: user.id },
    orderBy: { dueDate: 'asc' },
  });
}

/**
 * Toggle the completion status of a task.
 */
export async function toggleTaskCompleteAction(taskId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== user.id) {
      return { error: 'Task not found or unauthorized.' };
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        isCompleted: !task.isCompleted,
      },
    });

    // Increment study stats hours if completing a task
    if (updated.isCompleted) {
      await prisma.userStats.update({
        where: { userId: user.id },
        data: {
          totalStudyHours: { increment: 1.5 } // Count completed session as 1.5 study hours
        }
      });

      await prisma.activityLog.create({
        data: {
          userId: user.id,
          activity: 'Completed study task',
          details: `Completed task: "${task.title}". Added study hours!`,
        },
      });
    }

    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true, task: updated };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Create a custom standalone study task.
 */
export async function createTaskAction(title: string, description: string, dueDate: string, studyPlanId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const task = await prisma.task.create({
      data: {
        userId: user.id,
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        studyPlanId: studyPlanId || null,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true, task };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Delete a study task.
 */
export async function deleteTaskAction(taskId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const task = await prisma.task.findUnique({
      where: { id: taskId },
    });

    if (!task || task.userId !== user.id) {
      return { error: 'Task not found.' };
    }

    await prisma.task.delete({
      where: { id: taskId },
    });

    revalidatePath('/dashboard');
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
