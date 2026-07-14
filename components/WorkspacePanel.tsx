'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  FileText, MessageSquare, BookOpen, BrainCircuit, Calendar, 
  Trash2, Send, Plus, Award, CheckCircle, HelpCircle, ArrowLeft,
  ChevronLeft, ChevronRight, Bookmark, Star, Sparkles, Loader2, Save
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';

// Action imports
import { deleteDocumentAction } from '@/app/actions/documentActions';
import { createChatAction, sendMessageAction, getChatMessagesAction } from '@/app/actions/chatActions';
import { generateFlashcardsAction, getFlashcardsAction, toggleFavoriteFlashcardAction, recordFlashcardStudyAction } from '@/app/actions/flashcardActions';
import { generateQuizAction, submitQuizAnswersAction, getQuizAction } from '@/app/actions/quizActions';
import { createNoteAction, updateNoteAction, generateNoteSummaryAction } from '@/app/actions/noteActions';
import { generateStudyPlanAction, toggleTaskCompleteAction, createTaskAction } from '@/app/actions/plannerActions';

interface Document {
  id: string;
  name: string;
  type: string;
  content: string;
  createdAt: Date;
}

interface Chat {
  id: string;
  title: string;
  documentId: string | null;
}

interface FlashcardSet {
  id: string;
  title: string;
  description: string | null;
  _count?: { flashcards: number };
}

interface Quiz {
  id: string;
  title: string;
  difficulty: string;
  score: number | null;
}

interface Note {
  id: string;
  title: string;
  content: string;
  summary: any;
}

interface Task {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  isCompleted: boolean;
}

interface WorkspacePanelProps {
  initialDocuments: Document[];
  initialChats: Chat[];
  initialFlashcardSets: FlashcardSet[];
  initialQuizzes: Quiz[];
  initialNotes: Note[];
  initialTasks: Task[];
}

export function WorkspacePanel({
  initialDocuments,
  initialChats,
  initialFlashcardSets,
  initialQuizzes,
  initialNotes,
  initialTasks
}: WorkspacePanelProps) {
  const [activeTab, setActiveTab] = React.useState<'documents' | 'chat' | 'flashcards' | 'quiz' | 'notes' | 'planner'>('documents');
  const [documents, setDocuments] = React.useState<Document[]>(initialDocuments);
  const [selectedDoc, setSelectedDoc] = React.useState<Document | null>(initialDocuments[0] || null);

  // ----------------------------------------------------
  // Documents Management
  // ----------------------------------------------------
  const handleDeleteDoc = async (id: string) => {
    if (confirm('Are you sure you want to delete this document and its AI vectors?')) {
      const res = await deleteDocumentAction(id);
      if (res.success) {
        setDocuments(prev => prev.filter(d => d.id !== id));
        if (selectedDoc?.id === id) {
          setSelectedDoc(documents.find(d => d.id !== id) || null);
        }
      }
    }
  };

  // ----------------------------------------------------
  // AI Chat (RAG)
  // ----------------------------------------------------
  const [chats, setChats] = React.useState<Chat[]>(initialChats);
  const [activeChatId, setActiveChatId] = React.useState<string | null>(initialChats[0]?.id || null);
  const [messages, setMessages] = React.useState<any[]>([]);
  const [chatLoading, setChatLoading] = React.useState(false);
  const [chatInput, setChatInput] = React.useState('');
  const [messageSending, setMessageSending] = React.useState(false);

  React.useEffect(() => {
    if (activeChatId) {
      setChatLoading(true);
      getChatMessagesAction(activeChatId).then(msgs => {
        setMessages(msgs);
        setChatLoading(false);
      });
    } else {
      setMessages([]);
    }
  }, [activeChatId]);

  const handleStartChat = async () => {
    const title = selectedDoc ? `Chat about ${selectedDoc.name}` : 'General study chat';
    const res = await createChatAction(title, selectedDoc?.id);
    if (res.success && res.chat) {
      setChats(prev => [res.chat!, ...prev]);
      setActiveChatId(res.chat.id);
      setActiveTab('chat');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !activeChatId || messageSending) return;

    const userText = chatInput.trim();
    setChatInput('');
    setMessageSending(true);

    // Optimistic user message append
    setMessages(prev => [...prev, { id: 'temp-u', role: 'user', content: userText, createdAt: new Date() }]);

    const res = await sendMessageAction(activeChatId, userText);
    if (res.success && res.assistantMessage) {
      setMessages(prev => [
        ...prev.filter(m => m.id !== 'temp-u'),
        res.userMessage,
        res.assistantMessage
      ]);
    }
    setMessageSending(false);
  };

  // ----------------------------------------------------
  // Flashcards Viewer
  // ----------------------------------------------------
  const [flashcardSets, setFlashcardSets] = React.useState<FlashcardSet[]>(initialFlashcardSets);
  const [activeSetId, setActiveSetId] = React.useState<string | null>(null);
  const [flashcards, setFlashcards] = React.useState<any[]>([]);
  const [currentCardIdx, setCurrentCardIdx] = React.useState(0);
  const [isFlipped, setIsFlipped] = React.useState(false);
  const [fcGenerating, setFcGenerating] = React.useState(false);

  React.useEffect(() => {
    if (activeSetId) {
      getFlashcardsAction(activeSetId).then(cards => {
        setFlashcards(cards);
        setCurrentCardIdx(0);
        setIsFlipped(false);
      });
    }
  }, [activeSetId]);

  const handleGenerateCards = async () => {
    if (!selectedDoc) return;
    setFcGenerating(true);
    const res = await generateFlashcardsAction(selectedDoc.id, `Cards: ${selectedDoc.name}`, 8);
    if (res.success && res.flashcardSet) {
      setFlashcardSets(prev => [res.flashcardSet as any, ...prev]);
      setActiveSetId(res.flashcardSet.id);
    }
    setFcGenerating(false);
  };

  const handleCardStudy = async (card: any) => {
    await recordFlashcardStudyAction(card.id);
  };

  const handleToggleFavorite = async (cardId: string) => {
    const res = await toggleFavoriteFlashcardAction(cardId);
    if (res.success && res.card) {
      setFlashcards(prev => prev.map(c => c.id === cardId ? { ...c, isFavorite: res.card.isFavorite } : c));
    }
  };

  // ----------------------------------------------------
  // Quiz Generator
  // ----------------------------------------------------
  const [quizzes, setQuizzes] = React.useState<Quiz[]>(initialQuizzes);
  const [activeQuizId, setActiveQuizId] = React.useState<string | null>(null);
  const [quizDetails, setQuizDetails] = React.useState<any>(null);
  const [quizGenerating, setQuizGenerating] = React.useState(false);
  const [quizDifficulty, setQuizDifficulty] = React.useState('medium');
  const [quizQuestionCount, setQuizQuestionCount] = React.useState(5);
  const [userQuizAnswers, setUserQuizAnswers] = React.useState<Record<string, string>>({});
  const [quizResults, setQuizResults] = React.useState<any>(null);
  const [quizSubmitting, setQuizSubmitting] = React.useState(false);

  const handleGenerateQuiz = async () => {
    if (!selectedDoc) return;
    setQuizGenerating(true);
    const res = await generateQuizAction(selectedDoc.id, `Quiz: ${selectedDoc.name}`, quizDifficulty, quizQuestionCount);
    if (res.success && res.quiz) {
      setQuizzes(prev => [res.quiz as any, ...prev]);
      setActiveQuizId(res.quiz.id);
      setQuizDetails(res.quiz);
      setUserQuizAnswers({});
      setQuizResults(null);
    }
    setQuizGenerating(false);
  };

  const handleSelectQuiz = async (quizId: string) => {
    setActiveQuizId(quizId);
    setQuizResults(null);
    setUserQuizAnswers({});
    const quiz = await getQuizAction(quizId);
    setQuizDetails(quiz);
  };

  const handleQuizSubmit = async () => {
    if (!activeQuizId || !quizDetails) return;
    setQuizSubmitting(true);
    const submissions = quizDetails.questions.map((q: any) => ({
      questionId: q.id,
      answer: userQuizAnswers[q.id] || ''
    }));

    const res = await submitQuizAnswersAction(activeQuizId, submissions);
    if (res.success) {
      setQuizResults(res);
    }
    setQuizSubmitting(false);
  };

  // ----------------------------------------------------
  // AI Notes & Markdown Editor
  // ----------------------------------------------------
  const [notes, setNotes] = React.useState<Note[]>(initialNotes);
  const [activeNoteId, setActiveNoteId] = React.useState<string | null>(initialNotes[0]?.id || null);
  const [noteTitle, setNoteTitle] = React.useState('');
  const [noteContent, setNoteContent] = React.useState('');
  const [noteSummary, setNoteSummary] = React.useState<any>(null);
  const [noteSaving, setNoteSaving] = React.useState(false);
  const [noteSummarizing, setNoteSummarizing] = React.useState(false);

  React.useEffect(() => {
    const actNote = notes.find(n => n.id === activeNoteId);
    if (actNote) {
      setNoteTitle(actNote.title);
      setNoteContent(actNote.content);
      setNoteSummary(actNote.summary);
    } else {
      setNoteTitle('');
      setNoteContent('');
      setNoteSummary(null);
    }
  }, [activeNoteId, notes]);

  const handleCreateNote = async () => {
    const title = selectedDoc ? `Notes for ${selectedDoc.name}` : 'New Study Note';
    const res = await createNoteAction(title, '', selectedDoc?.id);
    if (res.success && res.note) {
      setNotes(prev => [res.note as any, ...prev]);
      setActiveNoteId(res.note.id);
    }
  };

  const handleSaveNote = async () => {
    if (!activeNoteId) return;
    setNoteSaving(true);
    const res = await updateNoteAction(activeNoteId, noteTitle, noteContent);
    if (res.success && res.note) {
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, title: noteTitle, content: noteContent } : n));
    }
    setNoteSaving(false);
  };

  const handleSummarizeNote = async () => {
    if (!activeNoteId) return;
    setNoteSummarizing(true);
    const res = await generateNoteSummaryAction(activeNoteId);
    if (res.success && res.summary) {
      setNoteSummary(res.summary);
      setNotes(prev => prev.map(n => n.id === activeNoteId ? { ...n, summary: res.summary } : n));
    }
    setNoteSummarizing(false);
  };

  // ----------------------------------------------------
  // Study Planner Calendar View
  // ----------------------------------------------------
  const [tasks, setTasks] = React.useState<Task[]>(initialTasks);
  const [examDate, setExamDate] = React.useState('');
  const [hoursPerWeek, setHoursPerWeek] = React.useState(6);
  const [difficulty, setDifficulty] = React.useState('medium');
  const [subjects, setSubjects] = React.useState('');
  const [plannerLoading, setPlannerLoading] = React.useState(false);

  // Task adding
  const [newTaskTitle, setNewTaskTitle] = React.useState('');
  const [newTaskDesc, setNewTaskDesc] = React.useState('');
  const [newTaskDate, setNewTaskDate] = React.useState('');
  const [taskCreating, setTaskCreating] = React.useState(false);

  const handleGeneratePlan = async () => {
    if (!subjects.trim()) return;
    setPlannerLoading(true);
    const subjectArr = subjects.split(',').map(s => s.trim());
    const res = await generateStudyPlanAction(examDate, hoursPerWeek, difficulty, subjectArr);
    if (res.success && res.studyPlan) {
      setTasks(prev => [...(res.studyPlan.tasks as any), ...prev]);
      setSubjects('');
    }
    setPlannerLoading(false);
  };

  const handleToggleTask = async (taskId: string) => {
    const res = await toggleTaskCompleteAction(taskId);
    if (res.success && res.task) {
      setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: res.task.isCompleted } : t));
    }
  };

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    setTaskCreating(true);
    const res = await createTaskAction(newTaskTitle, newTaskDesc, newTaskDate);
    if (res.success && res.task) {
      setTasks(prev => [res.task as any, ...prev]);
      setNewTaskTitle('');
      setNewTaskDesc('');
      setNewTaskDate('');
    }
    setTaskCreating(false);
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
      {/* Sidebar: Active document selection & tab selector */}
      <div className="xl:col-span-1 space-y-6">
        {/* Document Selection Card */}
        <Card className="p-4 space-y-4">
          <div className="space-y-1.5">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Study File</h3>
            {documents.length === 0 ? (
              <p className="text-[10px] text-muted-foreground italic">No files uploaded. Go to Documents tab.</p>
            ) : (
              <div className="relative">
                <select
                  value={selectedDoc?.id || ''}
                  onChange={e => setSelectedDoc(documents.find(d => d.id === e.target.value) || null)}
                  className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                >
                  {documents.map(doc => (
                    <option key={doc.id} value={doc.id}>{doc.name}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {selectedDoc && (
            <div className="flex gap-2">
              <Button size="sm" className="flex-1 text-[11px] h-8" onClick={handleStartChat}>
                <MessageSquare className="mr-1.5 h-3.5 w-3.5" />
                <span>Chat</span>
              </Button>
              <Button size="sm" variant="outline" className="flex-1 text-[11px] h-8" onClick={handleCreateNote}>
                <Plus className="mr-1.5 h-3.5 w-3.5" />
                <span>Note</span>
              </Button>
            </div>
          )}
        </Card>

        {/* Tab selection links */}
        <Card className="p-3">
          <nav className="flex flex-col gap-1">
            {[
              { id: 'documents', label: 'Course Library', icon: FileText },
              { id: 'chat', label: 'AI Chat (RAG)', icon: MessageSquare },
              { id: 'flashcards', label: 'Flashcards', icon: BookOpen },
              { id: 'quiz', label: 'Quiz Generator', icon: BrainCircuit },
              { id: 'notes', label: 'AI Note Editor', icon: FileText },
              { id: 'planner', label: 'Study Planner', icon: Calendar },
            ].map(tab => {
              const active = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-xs font-semibold rounded-lg text-left transition-colors cursor-pointer
                    ${active 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  `}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </Card>
      </div>

      {/* Main interactive panel */}
      <div className="xl:col-span-3">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="min-h-[500px]"
          >
            {/* 1. DOCUMENTS TAB */}
            {activeTab === 'documents' && (
              <Card glow className="p-6 space-y-6">
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Course Library</h2>
                  <p className="text-xs text-muted-foreground">Manage your uploaded materials and syllabus vector states.</p>
                </div>

                {documents.length === 0 ? (
                  <div className="py-12 border border-dashed rounded-xl text-center space-y-3">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground animate-pulse" />
                    <div>
                      <p className="text-xs font-semibold">Your library is empty</p>
                      <p className="text-[10px] text-muted-foreground mt-1">Upload a textbook, lecture notes, or PDF slides on the dashboard.</p>
                    </div>
                  </div>
                ) : (
                  <div className="divide-y border rounded-xl overflow-hidden bg-card">
                    {documents.map(doc => (
                      <div key={doc.id} className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors">
                        <div className="flex items-center gap-3 overflow-hidden">
                          <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500 shrink-0">
                            <FileText className="h-5 w-5" />
                          </div>
                          <div className="overflow-hidden">
                            <p className="text-xs font-semibold truncate max-w-sm">{doc.name}</p>
                            <p className="text-[9px] text-muted-foreground uppercase">{doc.type}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
                            onClick={() => handleDeleteDoc(doc.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* 2. CHAT TAB */}
            {activeTab === 'chat' && (
              <Card glow className="h-[600px] flex flex-col justify-between overflow-hidden">
                <CardHeader className="border-b pb-4 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4 text-indigo-500" />
                      <span>RAG Copilot</span>
                    </CardTitle>
                    <CardDescription className="text-[10px]">
                      Answers generated only from {selectedDoc ? `"${selectedDoc.name}"` : 'your library'}
                    </CardDescription>
                  </div>
                  {chats.length > 0 && (
                    <select
                      value={activeChatId || ''}
                      onChange={e => setActiveChatId(e.target.value)}
                      className="h-8 rounded-lg border bg-background px-2.5 py-0.5 text-[10px] max-w-[200px]"
                    >
                      {chats.map(c => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  )}
                </CardHeader>

                {/* Messages grid */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {activeChatId ? (
                    chatLoading ? (
                      <div className="space-y-4 py-4">
                        <Skeleton className="h-10 w-2/3" />
                        <Skeleton className="h-16 w-3/4 ml-auto" />
                        <Skeleton className="h-12 w-1/2" />
                      </div>
                    ) : messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <MessageSquare className="h-8 w-8 text-muted-foreground" />
                        <div>
                          <p className="text-xs font-semibold">Start your study chat</p>
                          <p className="text-[10px] text-muted-foreground mt-1">Ask questions about document formulas, facts, or chapters.</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, idx) => {
                        const isUser = msg.role === 'user';
                        return (
                          <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-xl p-3 border text-xs leading-relaxed ${
                              isUser 
                                ? 'bg-primary text-primary-foreground border-transparent' 
                                : 'bg-muted/40 text-foreground'
                            }`}>
                              <p className="whitespace-pre-wrap">{msg.content}</p>

                              {/* Message RAG sources bubble */}
                              {!isUser && msg.sources && (msg.sources as any[]).length > 0 && (
                                <div className="mt-3 pt-2.5 border-t border-muted border-dashed space-y-1">
                                  <p className="text-[9px] font-semibold text-muted-foreground flex items-center gap-1">
                                    <Bookmark className="h-3 w-3" />
                                    <span>Citations</span>
                                  </p>
                                  <div className="flex flex-wrap gap-1.5">
                                    {(msg.sources as any[]).map((src, sidx) => (
                                      <span 
                                        key={sidx} 
                                        className="text-[8px] bg-background/50 border px-1.5 py-0.5 rounded cursor-help font-mono"
                                        title={src.snippet}
                                      >
                                        {src.docName} (p. {src.pageNumber || 'N/A'})
                                      </span>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                      <MessageSquare className="h-8 w-8 text-muted-foreground" />
                      <div className="space-y-2">
                        <p className="text-xs font-semibold">No active chat sessions</p>
                        <Button size="sm" className="h-8 text-[11px]" onClick={handleStartChat}>
                          Create Study Chat
                        </Button>
                      </div>
                    </div>
                  )}

                  {messageSending && (
                    <div className="flex justify-start">
                      <div className="bg-muted/40 rounded-xl p-3 border text-xs flex items-center gap-2">
                        <Loader2 className="h-4.5 w-4.5 text-indigo-500 animate-spin" />
                        <span>Searching source indexes and writing response...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Input form */}
                <form onSubmit={handleSendMessage} className="p-4 border-t flex gap-2">
                  <Input
                    placeholder="Ask about formulas, definitions, summaries..."
                    value={chatInput}
                    onChange={e => setChatInput(e.target.value)}
                    disabled={!activeChatId || messageSending}
                    className="flex-grow text-xs h-9"
                  />
                  <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!activeChatId || !chatInput.trim() || messageSending}>
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </Card>
            )}

            {/* 3. FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
              <div className="space-y-6">
                {!activeSetId ? (
                  <Card glow className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Flashcard Study Decks</h2>
                        <p className="text-xs text-muted-foreground">Spaced repetition decks generated from course readings.</p>
                      </div>
                      {selectedDoc && (
                        <Button 
                          onClick={handleGenerateCards} 
                          disabled={fcGenerating}
                          className="h-9 text-xs flex items-center gap-1.5"
                        >
                          {fcGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                          <span>Generate from Active File</span>
                        </Button>
                      )}
                    </div>

                    {flashcardSets.length === 0 ? (
                      <div className="py-12 border border-dashed rounded-xl text-center space-y-3">
                        <BookOpen className="h-8 w-8 mx-auto text-muted-foreground" />
                        <p className="text-xs text-muted-foreground">No study decks generated. Pick a document and click Generate!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {flashcardSets.map(set => (
                          <Card key={set.id} glow className="p-5 hover:border-indigo-500/30 transition-all">
                            <div className="flex justify-between items-start">
                              <div className="space-y-1">
                                <h4 className="text-xs font-bold">{set.title}</h4>
                                <p className="text-[10px] text-muted-foreground">{set.description}</p>
                              </div>
                              <Badge variant="outline" className="text-[9px] font-mono">
                                {set._count?.flashcards || 8} Cards
                              </Badge>
                            </div>
                            <div className="pt-4 flex gap-2">
                              <Button 
                                size="sm" 
                                className="flex-1 text-[10px] h-8"
                                onClick={() => setActiveSetId(set.id)}
                              >
                                Study Deck
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    )}
                  </Card>
                ) : (
                  // Active Deck Study Mode
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSetId(null)}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <h2 className="text-base font-bold">
                          {flashcardSets.find(s => s.id === activeSetId)?.title}
                        </h2>
                        <p className="text-[10px] text-muted-foreground">Study Mode - Click card to flip</p>
                      </div>
                    </div>

                    {flashcards.length === 0 ? (
                      <Card className="p-12 text-center text-xs text-muted-foreground">
                        Empty set.
                      </Card>
                    ) : (
                      <div className="max-w-md mx-auto space-y-6">
                        {/* Interactive Flip Card container */}
                        <div 
                          onClick={() => {
                            setIsFlipped(!isFlipped);
                            if (!isFlipped) {
                              handleCardStudy(flashcards[currentCardIdx]);
                            }
                          }}
                          className="w-full aspect-[4/3] relative cursor-pointer group"
                          style={{ perspective: '1000px' }}
                        >
                          <motion.div 
                            animate={{ rotateY: isFlipped ? 180 : 0 }}
                            transition={{ duration: 0.4 }}
                            className="w-full h-full relative"
                            style={{ transformStyle: 'preserve-3d' }}
                          >
                            {/* Front Side */}
                            <Card className="absolute inset-0 p-8 flex flex-col justify-between items-center text-center bg-card shadow-xl select-none" style={{ backfaceVisibility: 'hidden' }}>
                              <div className="w-full flex justify-between text-muted-foreground text-[10px]">
                                <span>Question Card</span>
                                <button 
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleToggleFavorite(flashcards[currentCardIdx].id);
                                  }}
                                  className="text-muted-foreground hover:text-amber-500"
                                >
                                  <Star className={`h-4 w-4 ${flashcards[currentCardIdx].isFavorite ? 'fill-amber-500 text-amber-500' : ''}`} />
                                </button>
                              </div>
                              <p className="text-sm font-semibold tracking-tight leading-relaxed max-w-xs">
                                {flashcards[currentCardIdx].front}
                              </p>
                              <span className="text-[9px] text-muted-foreground uppercase font-semibold">Click to Reveal</span>
                            </Card>

                            {/* Back Side */}
                            <Card className="absolute inset-0 p-8 flex flex-col justify-between items-center text-center bg-muted/90 shadow-xl select-none" style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}>
                              <div className="w-full text-left text-muted-foreground text-[10px]">
                                <span>Core Answer</span>
                              </div>
                              <p className="text-xs leading-relaxed text-foreground font-medium max-w-xs">
                                {flashcards[currentCardIdx].back}
                              </p>
                              <span className="text-[9px] text-muted-foreground uppercase font-semibold">Click to Flip Back</span>
                            </Card>
                          </motion.div>
                        </div>

                        {/* Slide controllers */}
                        <div className="flex items-center justify-between max-w-sm mx-auto">
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={currentCardIdx === 0}
                            onClick={() => {
                              setCurrentCardIdx(prev => prev - 1);
                              setIsFlipped(false);
                            }}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>
                          <span className="text-xs font-semibold text-muted-foreground font-mono">
                            {currentCardIdx + 1} / {flashcards.length}
                          </span>
                          <Button 
                            variant="outline" 
                            size="icon" 
                            disabled={currentCardIdx === flashcards.length - 1}
                            onClick={() => {
                              setCurrentCardIdx(prev => prev + 1);
                              setIsFlipped(false);
                            }}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 4. QUIZZES TAB */}
            {activeTab === 'quiz' && (
              <div className="space-y-6">
                {!activeQuizId ? (
                  <Card glow className="p-6 space-y-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                      <div>
                        <h2 className="text-lg font-bold tracking-tight">Quiz Generator</h2>
                        <p className="text-xs text-muted-foreground">Test your knowledge with multiple-choice, true/false, and short answer quizzes.</p>
                      </div>
                    </div>

                    {selectedDoc ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border p-4 rounded-xl bg-muted/20">
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Difficulty</label>
                          <select 
                            value={quizDifficulty} 
                            onChange={e => setQuizDifficulty(e.target.value)}
                            className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs"
                          >
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-semibold text-muted-foreground uppercase">Questions Count</label>
                          <select 
                            value={quizQuestionCount} 
                            onChange={e => setQuizQuestionCount(Number(e.target.value))}
                            className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs"
                          >
                            <option value="3">3 Questions</option>
                            <option value="5">5 Questions</option>
                            <option value="10">10 Questions</option>
                          </select>
                        </div>
                        <div className="flex items-end">
                          <Button 
                            className="w-full h-9 text-xs"
                            onClick={handleGenerateQuiz} 
                            disabled={quizGenerating}
                          >
                            {quizGenerating ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4 text-amber-500" />}
                            <span>Generate Quiz</span>
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground italic">Select a document to unlock quiz generators.</p>
                    )}

                    {quizzes.length === 0 ? (
                      <div className="py-8 text-center text-xs text-muted-foreground">
                        No quizzes completed. Create one above!
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quiz Archives</h3>
                        <div className="divide-y border rounded-xl overflow-hidden bg-card">
                          {quizzes.map(qz => (
                            <div key={qz.id} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                              <div>
                                <h4 className="text-xs font-semibold">{qz.title}</h4>
                                <p className="text-[9px] text-muted-foreground uppercase">Difficulty: {qz.difficulty}</p>
                              </div>
                              <div className="flex items-center gap-3">
                                {qz.score !== null ? (
                                  <Badge variant={qz.score >= 80 ? 'success' : 'outline'} className="font-mono text-xs font-bold">
                                    {qz.score}%
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-[9px]">Unfinished</Badge>
                                )}
                                <Button size="sm" variant="secondary" className="text-[10px] h-8" onClick={() => handleSelectQuiz(qz.id)}>
                                  Take / Review
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </Card>
                ) : (
                  // Active Quiz Runner
                  <div className="space-y-6">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveQuizId(null)}>
                        <ChevronLeft className="h-5 w-5" />
                      </Button>
                      <div>
                        <h2 className="text-base font-bold">{quizDetails?.title}</h2>
                        <p className="text-[10px] text-muted-foreground uppercase">Difficulty: {quizDetails?.difficulty}</p>
                      </div>
                    </div>

                    {!quizResults ? (
                      // Quiz taker view
                      <Card className="p-6 space-y-6">
                        {quizDetails?.questions.map((q: any, idx: number) => (
                          <div key={q.id} className="space-y-3 border-b pb-5 last:border-b-0 last:pb-0">
                            <p className="text-xs font-semibold leading-relaxed">
                              {idx + 1}. {q.text}
                            </p>
                            
                            {q.type === 'MCQ' || q.type === 'TF' ? (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                {q.options.map((opt: string, oidx: number) => {
                                  const selected = userQuizAnswers[q.id] === opt;
                                  return (
                                    <button
                                      key={oidx}
                                      onClick={() => setUserQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                                      className={`
                                        p-2.5 rounded-lg border text-left text-xs font-medium transition-colors cursor-pointer
                                        ${selected ? 'border-primary bg-primary/5 font-semibold' : 'hover:bg-muted/50'}
                                      `}
                                    >
                                      {opt}
                                    </button>
                                  );
                                })}
                              </div>
                            ) : (
                              // Short Answer / Fill in Blanks text field
                              <Input
                                placeholder="Type your answer here..."
                                value={userQuizAnswers[q.id] || ''}
                                onChange={e => setUserQuizAnswers(prev => ({ ...prev, [q.id]: e.target.value }))}
                                className="text-xs"
                              />
                            )}
                          </div>
                        ))}

                        <Button 
                          onClick={handleQuizSubmit} 
                          disabled={quizSubmitting}
                          className="w-full flex items-center justify-center gap-1.5 h-10"
                        >
                          {quizSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                          <span>Submit Answers</span>
                        </Button>
                      </Card>
                    ) : (
                      // Quiz scoring results view
                      <Card className="p-6 space-y-6">
                        <div className="text-center py-6 border-b space-y-2">
                          <span className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Your Score</span>
                          <h3 className="text-4xl font-extrabold text-indigo-500 font-mono">
                            {quizResults.score}%
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Correct: {quizResults.correctCount} / {quizResults.totalQuestions} Questions
                          </p>
                        </div>

                        <div className="space-y-6 pt-4">
                          {quizResults.results.map((res: any, idx: number) => (
                            <div key={res.questionId} className="space-y-2.5 border-b pb-5 last:border-b-0 last:pb-0">
                              <div className="flex justify-between items-start gap-3">
                                <p className="text-xs font-semibold leading-relaxed">
                                  {idx + 1}. {res.text}
                                </p>
                                <Badge variant={res.isCorrect ? 'success' : 'destructive'} className="text-[8px] tracking-wide shrink-0 uppercase font-mono">
                                  {res.isCorrect ? 'Correct' : 'Incorrect'}
                                </Badge>
                              </div>

                              <div className="text-xs space-y-1 bg-muted/40 p-3 rounded-lg border">
                                <p className="text-muted-foreground">
                                  Your Answer: <span className="font-semibold text-foreground">{res.submittedAnswer || 'None'}</span>
                                </p>
                                {!res.isCorrect && (
                                  <p className="text-muted-foreground">
                                    Correct Answer: <span className="font-semibold text-emerald-500">{res.correctAnswer}</span>
                                  </p>
                                )}
                                {res.explanation && (
                                  <p className="text-[10px] text-muted-foreground mt-2 border-t pt-1.5 italic">
                                    💡 {res.explanation}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        <Button className="w-full" onClick={() => setActiveQuizId(null)}>
                          Back to Quizzes
                        </Button>
                      </Card>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* 5. NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="space-y-6">
                {!activeNoteId ? (
                  <Card glow className="p-6 space-y-4 text-center">
                    <FileText className="h-8 w-8 mx-auto text-muted-foreground" />
                    <h3 className="text-xs font-semibold">No notes active</h3>
                    <Button size="sm" onClick={handleCreateNote}>Create Study Note</Button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Markdown Editor */}
                    <Card glow className="lg:col-span-2 p-5 space-y-4 flex flex-col justify-between h-[620px]">
                      <div className="space-y-4 flex-grow flex flex-col justify-start">
                        <div className="flex items-center justify-between border-b pb-3">
                          <input
                            type="text"
                            placeholder="Note Title"
                            value={noteTitle}
                            onChange={e => setNoteTitle(e.target.value)}
                            className="font-bold text-base bg-transparent border-none focus:outline-none w-full"
                          />
                          <div className="flex items-center gap-2 shrink-0">
                            {notes.length > 1 && (
                              <select
                                value={activeNoteId}
                                onChange={e => setActiveNoteId(e.target.value)}
                                className="h-8 rounded-lg border bg-background px-2 py-0.5 text-[10px] max-w-[120px]"
                              >
                                {notes.map(n => (
                                  <option key={n.id} value={n.id}>{n.title}</option>
                                ))}
                              </select>
                            )}
                            <Button 
                              size="sm" 
                              variant="ghost" 
                              className="h-8 text-[10px]" 
                              onClick={handleCreateNote}
                            >
                              <Plus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        <textarea
                          placeholder="Write markdown study summaries, formulas, or lecture lists..."
                          value={noteContent}
                          onChange={e => setNoteContent(e.target.value)}
                          className="w-full flex-grow text-xs leading-relaxed focus:outline-none resize-none font-mono bg-transparent pt-2 min-h-[400px]"
                        />
                      </div>

                      <div className="flex gap-2 border-t pt-4 mt-auto">
                        <Button 
                          size="sm" 
                          className="flex-1 text-xs" 
                          onClick={handleSaveNote}
                          disabled={noteSaving}
                        >
                          {noteSaving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                          <span>Save Changes</span>
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="flex-1 text-xs text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20" 
                          onClick={handleSummarizeNote}
                          disabled={noteSummarizing || !noteContent.trim()}
                        >
                          {noteSummarizing ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4" />}
                          <span>Extract AI Summary</span>
                        </Button>
                      </div>
                    </Card>

                    {/* Right: AI Summary View panel */}
                    <Card className="lg:col-span-1 p-5 space-y-4 h-[620px] overflow-y-auto">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5 border-b pb-2">
                        <Sparkles className="h-4 w-4 text-indigo-500" />
                        <span>AI Summarizer Panel</span>
                      </h3>

                      {!noteSummary ? (
                        <div className="h-[450px] flex flex-col items-center justify-center text-center p-4 space-y-3">
                          <Sparkles className="h-6 w-6 text-muted-foreground animate-bounce" />
                          <div>
                            <p className="text-xs font-semibold">No AI Summary generated</p>
                            <p className="text-[10px] text-muted-foreground mt-1">Write notes and click "Extract AI Summary" to fetch bullet outlines and concepts.</p>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6 text-xs">
                          {/* Short summary */}
                          <div className="space-y-1.5">
                            <h4 className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Concept Abstract</h4>
                            <p className="leading-relaxed bg-muted/40 p-2.5 rounded-lg border font-medium">
                              {noteSummary.shortSummary}
                            </p>
                          </div>

                          {/* Bullet points */}
                          <div className="space-y-2">
                            <h4 className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Bullet Points</h4>
                            <ul className="list-disc pl-4 space-y-1 leading-relaxed text-muted-foreground">
                              {noteSummary.bulletPoints.map((pt: string, idx: number) => (
                                <li key={idx}>{pt}</li>
                              ))}
                            </ul>
                          </div>

                          {/* Key concepts */}
                          <div className="space-y-3">
                            <h4 className="font-semibold text-muted-foreground uppercase text-[9px] tracking-wider">Vocabulary Terms</h4>
                            <div className="space-y-2">
                              {noteSummary.keyConcepts.map((item: any, idx: number) => (
                                <div key={idx} className="border p-2 rounded-lg bg-muted/20">
                                  <p className="font-bold text-foreground">{item.concept}</p>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">{item.definition}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </Card>
                  </div>
                )}
              </div>
            )}

            {/* 6. PLANNER TAB */}
            {activeTab === 'planner' && (
              <div className="space-y-6">
                <Card glow className="p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-bold tracking-tight">Study Planner</h2>
                    <p className="text-xs text-muted-foreground">Generate a calendar schedule based on target exam dates and subjects.</p>
                  </div>

                  {/* Input form */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 border rounded-xl bg-muted/20">
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Exam Date</label>
                      <input 
                        type="date"
                        value={examDate}
                        onChange={e => setExamDate(e.target.value)}
                        className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Weekly Hours</label>
                      <input 
                        type="number"
                        value={hoursPerWeek}
                        onChange={e => setHoursPerWeek(Number(e.target.value))}
                        className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-semibold text-muted-foreground uppercase">Subjects (Comma separated)</label>
                      <Input
                        placeholder="Biology, Chemistry..."
                        value={subjects}
                        onChange={e => setSubjects(e.target.value)}
                        className="text-xs h-9"
                      />
                    </div>
                    <div className="flex items-end">
                      <Button 
                        className="w-full h-9 text-xs"
                        onClick={handleGeneratePlan}
                        disabled={plannerLoading || !subjects.trim()}
                      >
                        {plannerLoading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Sparkles className="mr-1.5 h-4 w-4 text-amber-500" />}
                        <span>Build Schedule</span>
                      </Button>
                    </div>
                  </div>

                  {/* Task list and calendar grid layout */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left: Schedule Tasks list */}
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Planner Checklists</h3>
                      
                      {tasks.length === 0 ? (
                        <div className="py-12 border border-dashed rounded-xl text-center text-xs text-muted-foreground">
                          Your calendar schedule is empty. Generate one above!
                        </div>
                      ) : (
                        <div className="divide-y border rounded-xl overflow-hidden bg-card">
                          {tasks.map(tsk => {
                            const dateStr = tsk.dueDate ? new Date(tsk.dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : 'No date';
                            return (
                              <div key={tsk.id} className="flex justify-between items-center p-4 hover:bg-muted/30 transition-colors">
                                <div className="flex items-start gap-3">
                                  <input
                                    type="checkbox"
                                    checked={tsk.isCompleted}
                                    onChange={() => handleToggleTask(tsk.id)}
                                    className="mt-0.5 rounded cursor-pointer accent-indigo-500"
                                  />
                                  <div>
                                    <p className={`text-xs font-semibold ${tsk.isCompleted ? 'line-through text-muted-foreground' : ''}`}>{tsk.title}</p>
                                    {tsk.description && (
                                      <p className="text-[10px] text-muted-foreground mt-0.5">{tsk.description}</p>
                                    )}
                                  </div>
                                </div>
                                <Badge variant="outline" className="text-[9px] font-mono shrink-0">
                                  {dateStr}
                                </Badge>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {/* Right: Add Custom Task */}
                    <div className="lg:col-span-1">
                      <Card className="p-5">
                        <h3 className="text-xs font-bold uppercase tracking-wider border-b pb-3 mb-4">Add Study Task</h3>
                        <form onSubmit={handleAddTask} className="space-y-4">
                          <div className="space-y-1.5">
                            <label className="text-[9px] font-semibold text-muted-foreground uppercase">Task Name</label>
                            <Input
                              placeholder="Review chapter formulas"
                              value={newTaskTitle}
                              onChange={e => setNewTaskTitle(e.target.value)}
                              className="text-xs"
                              required
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-semibold text-muted-foreground uppercase">Description</label>
                            <textarea
                              placeholder="Read page 15-30 of document"
                              value={newTaskDesc}
                              onChange={e => setNewTaskDesc(e.target.value)}
                              className="w-full h-16 rounded-lg border bg-transparent p-2.5 text-xs focus:ring-1 focus:ring-ring focus:outline-none"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="text-[9px] font-semibold text-muted-foreground uppercase">Due Date</label>
                            <input
                              type="date"
                              value={newTaskDate}
                              onChange={e => setNewTaskDate(e.target.value)}
                              className="w-full h-9 rounded-lg border bg-background px-3 py-1 text-xs"
                            />
                          </div>

                          <Button type="submit" size="sm" className="w-full" disabled={taskCreating}>
                            {taskCreating ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Create Task'}
                          </Button>
                        </form>
                      </Card>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
