'use server';

import { prisma } from '@/lib/prisma';
import { getCurrentUser } from '@/services/authService';
import { extractTextFromFile } from '@/services/documentParser';
import { generateEmbedding } from '@/services/gemini';
import * as fs from 'fs';
import * as path from 'path';
import { revalidatePath } from 'recache'; // Next.js standard path invalidation or let's use next/cache revalidatePath
import { revalidatePath as nextRevalidatePath } from 'next/cache';

/**
 * Upload, parse, chunk, embed, and store a document.
 */
export async function uploadDocumentAction(formData: FormData) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'You must be logged in to upload documents.' };
  }

  const file = formData.get('file') as File;
  if (!file || file.size === 0) {
    return { error: 'No file provided or file is empty.' };
  }

  // Create temporary directory in workspace
  const tempDir = path.join(process.cwd(), 'scratch', 'uploads');
  if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
  }

  const tempFilePath = path.join(tempDir, `${Date.now()}_${file.name}`);
  
  try {
    // Write buffer to temporary file
    const buffer = Buffer.from(await file.arrayBuffer());
    fs.writeFileSync(tempFilePath, buffer);

    // Extract file extension
    const ext = file.name.split('.').pop() || '';
    
    // Extract text content
    const extractedText = await extractTextFromFile(tempFilePath, ext);
    if (!extractedText.trim()) {
      throw new Error('No readable text could be extracted from this document.');
    }

    // Save Document record
    const document = await prisma.document.create({
      data: {
        userId: user.id,
        name: file.name,
        type: ext.toLowerCase(),
        content: extractedText,
        size: file.size,
      },
    });

    // Chunk text: ~1000 characters with ~200 characters overlap
    const chunks: { content: string; pageNumber: number }[] = [];
    const chunkSize = 1000;
    const overlap = 200;
    let start = 0;
    let pageNum = 1;

    // Simple page detection for text: double newlines can represent breaks,
    // or we can increment page content pages roughly every 3000 chars.
    while (start < extractedText.length) {
      const chunkText = extractedText.slice(start, start + chunkSize);
      chunks.push({
        content: chunkText,
        pageNumber: pageNum,
      });

      start += chunkSize - overlap;
      if (start % 3000 === 0) {
        pageNum++;
      }
    }

    // Generate embeddings for each chunk and save them
    // Note: To avoid throttling issues, we process them in batches
    for (const chunk of chunks) {
      try {
        const vector = await generateEmbedding(chunk.content);
        await prisma.embedding.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            pageNumber: chunk.pageNumber,
            vector,
          },
        });
      } catch (embErr) {
        console.error('Error generating embedding for chunk:', embErr);
        // Fallback to storing chunk with empty vector
        await prisma.embedding.create({
          data: {
            documentId: document.id,
            content: chunk.content,
            pageNumber: chunk.pageNumber,
            vector: [],
          },
        });
      }
    }

    // Update user stats
    await prisma.userStats.update({
      where: { userId: user.id },
      data: {
        documentsUploaded: { increment: 1 },
      },
    });

    // Log Activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Uploaded document',
        details: `Successfully uploaded and indexed "${file.name}" (${(file.size / 1024).toFixed(1)} KB).`,
      },
    });

    nextRevalidatePath('/dashboard');
    nextRevalidatePath('/workspace');
    return { success: true, document };
  } catch (error) {
    console.error('Document upload action error:', error);
    return { error: (error as Error).message };
  } finally {
    // Delete temporary file safely
    try {
      if (fs.existsSync(tempFilePath)) {
        fs.unlinkSync(tempFilePath);
      }
    } catch (cleanupErr) {
      console.error('Failed to clean up temp file:', cleanupErr);
    }
  }
}

/**
 * Fetch all documents for the current user.
 */
export async function getDocumentsAction() {
  const user = await getCurrentUser();
  if (!user) return [];

  return prisma.document.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' },
  });
}

/**
 * Delete an uploaded document and its embeddings.
 */
export async function deleteDocumentAction(documentId: string) {
  const user = await getCurrentUser();
  if (!user) {
    return { error: 'Unauthorized' };
  }

  try {
    const doc = await prisma.document.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.userId !== user.id) {
      return { error: 'Document not found or unauthorized.' };
    }

    await prisma.document.delete({
      where: { id: documentId },
    });

    // Log activity
    await prisma.activityLog.create({
      data: {
        userId: user.id,
        activity: 'Deleted document',
        details: `Deleted "${doc.name}" from library.`,
      },
    });

    nextRevalidatePath('/dashboard');
    nextRevalidatePath('/workspace');
    return { success: true };
  } catch (error) {
    return { error: (error as Error).message };
  }
}
