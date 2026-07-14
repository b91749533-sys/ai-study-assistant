'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';
import { generateFlashcards } from '@/services/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Automatically generate a flashcard set from an uploaded document.
 */
export async function generateFlashcardsAction(documentId: string, title: string, count: number = 8) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.userId !== user.id) {
      return { error: 'Document not found or unauthorized.' };
    }

    // Call Gemini API to generate cards
    const cardData = await generateFlashcards(doc.content, count);

    // Save FlashcardSet and Flashcards in database
    const flashcardSet = await prisma.flashcardSet.create({
      data: {
        userId: user.id,
        title: title || `Cards from ${doc.name}`,
        description: `Automatically generated study set from ${doc.name}.`,
        documentId: doc.id,
        flashcards: {
          create: cardData.map(card => ({
            front: card.front,
            back: card.back,
          })),
        },
      },
      include: {
        flashcards: true,
      },
    });

    // Update User Stats
    await prisma.userStats.update({
      where: { userId: user.id },
      data: {
        flashcardsCreated: { increment: cardData.length },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Generated flashcards',
        details: `Generated ${cardData.length} flashcards from "${doc.name}".`,
      },
    });

    revalidatePath('/dashboard');
    revalidatePath('/workspace');
    return { success: true, flashcardSet };
  } catch (error) {
    console.error('Error in generateFlashcardsAction:', error);
    return { error: (error as Error).message };
  }
}

/**
 * Fetch all flashcard sets for the current user.
 */
export async function getFlashcardSetsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.flashcardSet.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { flashcards: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch all flashcards in a specific set.
 */
export async function getFlashcardsAction(setId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const set = await prisma.flashcardSet.findUnique({
    where: { id: setId },
  });

  if (!set || set.userId !== user.id) return [];

  return prisma.flashcard.findMany({
    where: { setId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Toggle favorite status of a flashcard.
 */
export async function toggleFavoriteFlashcardAction(cardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { set: true }
    });

    if (!card || card.set.userId !== user.id) {
      return { error: 'Card not found.' };
    }

    const updated = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        isFavorite: !card.isFavorite,
      },
    });

    return { success: true, card: updated };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Increment study count and update last studied timestamp.
 */
export async function recordFlashcardStudyAction(cardId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
      include: { set: true }
    });

    if (!card || card.set.userId !== user.id) {
      return { error: 'Card not found.' };
    }

    await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        studiedCount: { increment: 1 },
        lastStudied: new Date(),
      },
    });

    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Delete a flashcard set.
 */
export async function deleteFlashcardSetAction(setId: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const set = await prisma.flashcardSet.findUnique({
      where: { id: setId },
    });

    if (!set || set.userId !== user.id) {
      return { error: 'Flashcard set not found.' };
    }

    await prisma.flashcardSet.delete({
      where: { id: setId },
    });

    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
