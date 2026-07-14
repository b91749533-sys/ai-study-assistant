'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';
import { generateSummary } from '@/services/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Create a new study note.
 */
export async function createNoteAction(title: string, content: string, documentId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const note = await prisma.note.create({
      data: {
        userId: user.id,
        title: title || 'Untitled Note',
        content: content || '',
        documentId: documentId || null,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Created note',
        details: `Created new study note "${note.title}".`,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true, note };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Update an existing study note.
 */
export async function updateNoteAction(noteId: string, title: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== user.id) {
      return { error: 'Note not found or unauthorized.' };
    }

    const updated = await prisma.note.update({
      where: { id: noteId },
      data: {
        title,
        content,
      },
    });

    return { success: true, note: updated };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Generate AI Summary (short, detailed, bullet points, concepts) and save to note.
 */
export async function generateNoteSummaryAction(noteId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== user.id) {
      return { error: 'Note not found or unauthorized.' };
    }

    if (!note.content.trim()) {
      return { error: 'Note content is empty. Add text before summarizing.' };
    }

    // Call Gemini API
    const summaryData = await generateSummary(note.content);

    // Save summary in database
    const updatedNote = await prisma.note.update({
      where: { id: noteId },
      data: {
        summary: summaryData as any,
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Generated AI Summary',
        details: `Generated study summary for note "${note.title}".`,
      },
    });

    revalidatePath('/workspace');
    return { success: true, summary: summaryData, note: updatedNote };
  } catch (error) {
    console.error('Error generating note summary:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Fetch all study notes.
 */
export async function getNotesAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.note.findMany({
    where: { userId: user.id },
    orderBy: { updatedAt: 'desc' },
  });
}

/**
 * Fetch a single note's contents.
 */
export async function getNoteAction(noteId: string) {
  const user = await getCurrentUser();
  if (!user) return null;

  const note = await prisma.note.findUnique({
    where: { id: noteId },
  });

  if (!note || note.userId !== user.id) return null;
  return note;
}

/**
 * Delete a study note.
 */
export async function deleteNoteAction(noteId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const note = await prisma.note.findUnique({
      where: { id: noteId },
    });

    if (!note || note.userId !== user.id) {
      return { error: 'Note not found.' };
    }

    await prisma.note.delete({
      where: { id: noteId },
    });

    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
