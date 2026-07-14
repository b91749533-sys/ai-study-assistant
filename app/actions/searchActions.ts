'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';

export interface SearchResult {
  id: string;
  type: 'document' | 'note' | 'flashcard' | 'quiz';
  title: string;
  subtitle: string;
  url: string;
}

/**
 * Global search across all user's notes, documents, flashcards, and quizzes.
 */
export async function globalSearchAction(query: string): Promise<SearchResult[]> {
  const user = await getCurrentUser();
  if (!user || !query.trim()) return [];

  const cleanQuery = query.toLowerCase();

  try {
    // 1. Search Documents
    const docs = await prisma.document.findMany({
      where: {
        userId: user.id,
        OR: [
          { name: { contains: cleanQuery, mode: 'insensitive' } },
          { content: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 2. Search Notes
    const notes = await prisma.note.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { content: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 3. Search Flashcard Sets
    const flashcardSets = await prisma.flashcardSet.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: cleanQuery, mode: 'insensitive' } },
          { description: { contains: cleanQuery, mode: 'insensitive' } }
        ]
      },
      take: 5
    });

    // 4. Search Quizzes
    const quizzes = await prisma.quiz.findMany({
      where: {
        userId: user.id,
        title: { contains: cleanQuery, mode: 'insensitive' }
      },
      take: 5
    });

    const results: SearchResult[] = [];

    docs.forEach(d => {
      results.push({
        id: d.id,
        type: 'document',
        title: d.name,
        subtitle: `Document - ${(d.type || 'text').toUpperCase()}`,
        url: `/workspace?tab=documents&id=${d.id}`
      });
    });

    notes.forEach(n => {
      results.push({
        id: n.id,
        type: 'note',
        title: n.title,
        subtitle: 'Study Note',
        url: `/workspace?tab=notes&id=${n.id}`
      });
    });

    flashcardSets.forEach(f => {
      results.push({
        id: f.id,
        type: 'flashcard',
        title: f.title,
        subtitle: `Flashcard Set - ${f.description || 'Practice set'}`,
        url: `/workspace?tab=flashcards&id=${f.id}`
      });
    });

    quizzes.forEach(q => {
      results.push({
        id: q.id,
        type: 'quiz',
        title: q.title,
        subtitle: `Quiz - ${q.difficulty.toUpperCase()} difficulty (${q.totalQuestions} questions)`,
        url: `/workspace?tab=quizzes&id=${q.id}`
      });
    });

    return results;
  } catch (error) {
    console.error('Search error:', error);
    return [];
  }
}
