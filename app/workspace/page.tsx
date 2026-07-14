import * as React from 'react';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';
import { AppLayout } from '@/components/AppLayout';
import { WorkspacePanel } from '@/components/WorkspacePanel';

// Imports actions to pre-load data server-side
import { getDocumentsAction } from '@/app/actions/documentActions';
import { getChatsAction } from '@/app/actions/chatActions';
import { getFlashcardSetsAction } from '@/app/actions/flashcardActions';
import { getQuizzesAction } from '@/app/actions/quizActions';
import { getNotesAction } from '@/app/actions/noteActions';
import { getTasksAction } from '@/app/actions/plannerActions';

export default async function WorkspacePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Pre-load all user datasets
  const [
    documents,
    chats,
    flashcardSets,
    quizzes,
    notes,
    tasks
  ] = await Promise.all([
    getDocumentsAction(),
    getChatsAction(),
    getFlashcardSetsAction(),
    getQuizzesAction(),
    getNotesAction(),
    getTasksAction()
  ]);

  return (
    <AppLayout user={user as any}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">AI Study Workspace</h1>
          <p className="text-xs text-muted-foreground">
            Select files to chat, review flashcards, generate quizzes, and write structured notes.
          </p>
        </div>

        <WorkspacePanel
          initialDocuments={documents as any}
          initialChats={chats as any}
          initialFlashcardSets={flashcardSets as any}
          initialQuizzes={quizzes as any}
          initialNotes={notes as any}
          initialTasks={tasks as any}
        />
      </div>
    </AppLayout>
  );
}
