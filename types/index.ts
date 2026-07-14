export interface User {
  id: string;
  email: string;
  username: string | null;
  avatarUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  name: string;
  url: string | null;
  type: string;
  content: string;
  size: number | null;
  createdAt: Date;
}

export interface Embedding {
  id: string;
  documentId: string;
  content: string;
  pageNumber: number | null;
  vector: number[];
  createdAt: Date;
}

export interface Chat {
  id: string;
  userId: string;
  title: string;
  documentId: string | null;
  createdAt: Date;
}

export interface Message {
  id: string;
  chatId: string;
  role: 'user' | 'assistant';
  content: string;
  sources: Array<{
    docName: string;
    pageNumber: number | null;
    snippet: string;
  }> | null;
  createdAt: Date;
}

export interface UserStats {
  id: string;
  userId: string;
  streakDays: number;
  lastStudyDate: Date | null;
  totalStudyHours: number;
  flashcardsCreated: number;
  quizzesCompleted: number;
  documentsUploaded: number;
  achievements: string[];
}

export interface ActivityLog {
  id: string;
  userId: string;
  activity: string;
  details: string | null;
  createdAt: Date;
}
