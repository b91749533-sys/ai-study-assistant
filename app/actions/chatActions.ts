'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';
import { generateEmbedding, generateRAGAnswer } from '@/services/gemini';
import { revalidatePath } from 'next/cache';

/**
 * Helper to calculate cosine similarity between two float arrays.
 */
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length === 0 || vecB.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Create a new chat session.
 */
export async function createChatAction(title: string, documentId?: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    const chat = await prisma.chat.create({
      data: {
        userId: user.id,
        title,
        documentId: documentId || null,
      },
    });

    revalidatePath('/workspace');
    return { success: true, chat };
  } catch (error) {
    return { error: (error as Error).message };
  }
}

/**
 * Fetch all chat sessions for the current user.
 */
export async function getChatsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.chat.findMany({
    where: { userId: user.id },
    include: {
      document: {
        select: { name: true }
      }
    },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Fetch message history for a specific chat.
 */
export async function getChatMessagesAction(chatId: string) {
  const user = await getCurrentUser();
  if (!user) return [];

  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
  });

  if (!chat || chat.userId !== user.id) return [];

  return prisma.message.findMany({
    where: { chatId },
    orderBy: { createdAt: 'asc' },
  });
}

/**
 * Send a user message, trigger RAG cosine similarity matching, query Gemini, and save AI response.
 */
export async function sendMessageAction(chatId: string, content: string) {
  const user = await getCurrentUser();
  if (!user) return { error: 'Unauthorized' };

  try {
    // 1. Fetch chat and confirm ownership
    const chat = await prisma.chat.findUnique({
      where: { id: chatId },
      include: { document: true }
    });

    if (!chat || chat.userId !== user.id) {
      return { error: 'Chat session not found.' };
    }

    // 2. Save user message
    const userMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'user',
        content,
      },
    });

    // 3. Retrieve documents to search from
    // If chat is linked to a document, search only that. Otherwise, search all user documents.
    const documentIds = chat.documentId 
      ? [chat.documentId] 
      : (await prisma.document.findMany({ where: { userId: user.id }, select: { id: true } })).map(d => d.id);

    let contextChunks: { content: string; pageNumber: number | null; docName: string }[] = [];

    if (documentIds.length > 0) {
      // 4. Generate user query embedding
      const queryVector = await generateEmbedding(content);

      // 5. Fetch all chunk embeddings for these documents
      const dbEmbeddings = await prisma.embedding.findMany({
        where: {
          documentId: { in: documentIds }
        },
        include: {
          document: {
            select: { name: true }
          }
        }
      });

      // 6. Calculate similarities in JS
      const scoredChunks = dbEmbeddings.map(emb => {
        const similarity = cosineSimilarity(queryVector, emb.vector);
        return {
          content: emb.content,
          pageNumber: emb.pageNumber,
          docName: emb.document.name,
          similarity
        };
      });

      // Sort and take top 4 chunks
      scoredChunks.sort((a, b) => b.similarity - a.similarity);
      contextChunks = scoredChunks.slice(0, 4);
    }

    // 7. Get chat history (last 6 messages for context)
    const history = await prisma.message.findMany({
      where: { chatId },
      orderBy: { createdAt: 'desc' },
      take: 6
    });
    // Reverse to chronological
    const formattedHistory = history.reverse().map(m => ({
      role: m.role,
      content: m.content
    }));

    // 8. Generate RAG answer
    const { answer, sources } = await generateRAGAnswer(formattedHistory, contextChunks, content);

    // 9. Save assistant response
    const assistantMessage = await prisma.message.create({
      data: {
        chatId,
        role: 'assistant',
        content: answer,
        sources: sources as any,
      },
    });

    // 10. Increment study stats hours slightly for interactive chat activity
    await prisma.userStats.update({
      where: { userId: user.id },
      data: {
        totalStudyHours: { increment: 0.1 } // Increment 0.1 study hours per query
      }
    });

    revalidatePath('/workspace');
    return { success: true, userMessage, assistantMessage };
  } catch (error) {
    console.error('Send message action error:', error);
    return { error: (error as Error).message };
  }
}
