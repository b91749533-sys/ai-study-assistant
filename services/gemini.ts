import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize the Gemini API client
const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = apiKey ? new GoogleGenerativeAI(apiKey) : null;

// Determine if we should run in mock mode
const isMockMode = !genAI;

if (isMockMode) {
  console.warn('GEMINI_API_KEY is not defined. AI services will run in Demo/Mock Mode.');
}

/**
 * Generate 768-dimension vector embeddings using text-embedding-004.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  if (isMockMode) {
    // Generate a pseudo-random normalized 768-dimension vector based on text content
    const vector = Array.from({ length: 768 }, (_, idx) => {
      let hash = 0;
      for (let i = 0; i < text.length; i++) {
        hash = text.charCodeAt(i) + ((hash << 5) - hash);
      }
      return Math.sin(hash + idx);
    });
    // Normalize vector
    const magnitude = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
    return vector.map(v => v / (magnitude || 1));
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'text-embedding-004' });
    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (error) {
    console.error('Error generating embedding with Gemini:', error);
    throw error;
  }
}

/**
 * Generates an answer from context document chunks using RAG.
 */
export async function generateRAGAnswer(
  chatHistory: { role: string; content: string }[],
  contextChunks: { content: string; pageNumber: number | null; docName: string }[],
  userQuery: string
): Promise<{ answer: string; sources: { docName: string; pageNumber: number | null; snippet: string }[] }> {
  
  const sources = contextChunks.map(chunk => ({
    docName: chunk.docName,
    pageNumber: chunk.pageNumber,
    snippet: chunk.content.slice(0, 150) + '...'
  }));

  if (isMockMode) {
    const sampleAnswers = [
      `Based on the uploaded document "${sources[0]?.docName || 'Study Guide'}", here is what you need to know: The core principles focus on modular architecture, where each component is isolated. In Chapter 2 (page ${sources[0]?.pageNumber || 1}), it mentions that the main process uses hooks to manage state.`,
      `According to page ${sources[0]?.pageNumber || 2} of "${sources[0]?.docName || 'Notes'}", the key takeaways are: 1. Optimize query index. 2. Implement memoized caching. 3. Maintain asynchronous loops. Let me know if you want me to expand on any of these!`,
      `Analyzing your notes, yes. The concept is defined as a dynamic system where inputs determine the routing state. You can find more detail in the uploaded materials under chapter sections.`
    ];
    const randomIndex = Math.abs(userQuery.length) % sampleAnswers.length;
    return {
      answer: sampleAnswers[randomIndex] + `\n\n*(Note: Running in Demo Mode. Add GEMINI_API_KEY to see live RAG replies).*`,
      sources: sources.slice(0, 3)
    };
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });

    // Construct the context block
    const contextText = contextChunks
      .map((c, i) => `[Source ${i + 1} - ${c.docName} (Page ${c.pageNumber || 'N/A'})]: ${c.content}`)
      .join('\n\n');

    const prompt = `You are a helpful, senior academic study assistant. Answer the user's question based ONLY on the provided document sources. If the answer cannot be found in the sources, say: "I couldn't find that information in the uploaded documents." Do not make up facts.
    
Here are the source documents:
${contextText}

Here is the chat history:
${chatHistory.map(h => `${h.role}: ${h.content}`).join('\n')}
user: ${userQuery}

Provide a comprehensive, styled markdown response. Cite your sources clearly using [Source X] format matching the headers.`;

    const result = await model.generateContent(prompt);
    return {
      answer: result.response.text(),
      sources: sources.slice(0, 5)
    };
  } catch (error) {
    console.error('Error generating RAG answer:', error);
    return {
      answer: `Error communicating with Gemini: ${(error as Error).message}. Returning local mock answer fallback.\n\nHere is a summary of the source concepts: the uploaded content discusses architectural patterns and optimization processes.`,
      sources: sources.slice(0, 2)
    };
  }
}

/**
 * Generates summaries and key concepts for notes and documents.
 */
export async function generateSummary(text: string): Promise<{
  shortSummary: string;
  detailedSummary: string;
  bulletPoints: string[];
  keyConcepts: { concept: string; definition: string }[];
}> {
  if (isMockMode || text.length < 50) {
    return {
      shortSummary: 'This document provides a comprehensive overview of core system designs and study objectives.',
      detailedSummary: 'A detailed breakdown reveals structured methodologies for organizing study plans, analyzing key concepts, and verifying retention with flashcards and quizzes. The document aims to improve productivity and knowledge mapping through AI assistance.',
      bulletPoints: [
        'Organizes studies based on customizable difficulty paths',
        'Implements spaced repetition using structured flashcards',
        'Enables active recall using MCQs and short answer quizzes',
        'Uses RAG to answer queries directly from uploaded notes'
      ],
      keyConcepts: [
        { concept: 'Active Recall', definition: 'Testing memory by actively retrieving information rather than passive reading.' },
        { concept: 'Spaced Repetition', definition: 'Reviewing information at increasing intervals to improve long-term retention.' },
        { concept: 'Vector Embeddings', definition: 'Mathematical representation of text segments used to find semantic similarity.' }
      ]
    };
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Analyze the following text and return a JSON summary. Your response MUST be valid JSON (do not wrap in markdown code blocks like \`\`\`json, just return raw JSON content).
    
The JSON must follow this TypeScript interface:
interface Response {
  shortSummary: string;
  detailedSummary: string;
  bulletPoints: string[];
  keyConcepts: Array<{ concept: string; definition: string }>;
}

Text to analyze:
${text.slice(0, 50000)}`;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text().trim();
    // Clean any markdown wrapper if Gemini ignores instruction
    const jsonStr = responseText.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating summary:', error);
    // Graceful fallback
    return {
      shortSummary: 'Could not generate AI summary due to an API error.',
      detailedSummary: 'There was an issue parsing the document summary. Please check your Gemini API key in configuration settings.',
      bulletPoints: ['Error processing document content', 'Check your API configuration'],
      keyConcepts: [{ concept: 'System Error', definition: 'The AI model could not process this request.' }]
    };
  }
}

/**
 * Generate study flashcards.
 */
export async function generateFlashcards(text: string, count: number = 8): Promise<{ front: string; back: string }[]> {
  if (isMockMode || text.length < 50) {
    return [
      { front: 'What does RAG stand for in AI?', back: 'Retrieval-Augmented Generation' },
      { front: 'Explain Spaced Repetition.', back: 'An educational practice where cards are reviewed at increasing intervals.' },
      { front: 'What is the purpose of Vector Search?', back: 'To locate semantically similar text segments based on distance calculations.' },
      { front: 'What are the main HTTP methods?', back: 'GET, POST, PUT, DELETE, PATCH' },
      { front: 'What is Next.js Server Actions?', back: 'Asynchronous server functions that can be called directly from components.' }
    ].slice(0, count);
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Based on the following text, generate exactly ${count} study flashcards. Return raw JSON content only matching this schema:
    
interface Flashcard {
  front: string;
  back: string;
}
type Response = Flashcard[];

Text:
${text.slice(0, 40000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating flashcards:', error);
    return [
      { front: 'Flashcard generation error', back: 'Please verify the API configuration.' }
    ];
  }
}

/**
 * Generate a quiz.
 */
export async function generateQuiz(
  text: string,
  difficulty: string,
  count: number = 5
): Promise<{ type: string; text: string; options: string[]; correctAnswer: string; explanation: string }[]> {
  if (isMockMode || text.length < 50) {
    return [
      {
        type: 'MCQ',
        text: `Which architectural pattern is best suited for complex client-state rendering in Next.js? (Difficulty: ${difficulty})`,
        options: ['Zustand/Redux State Management', 'Server Actions only', 'Static Page caching', 'Inline CSS queries'],
        correctAnswer: 'Zustand/Redux State Management',
        explanation: 'For complex client-state, a client store like Zustand offers fine-grained rendering control, whereas Server Actions are for server mutators.'
      },
      {
        type: 'TF',
        text: 'True or False: PostgreSQL can calculate cosine similarity natively without pgvector.',
        options: ['True', 'False'],
        correctAnswer: 'False',
        explanation: 'Standard PostgreSQL lacks the vector operators. Calculating vector cosine similarity efficiently requires the pgvector extension.'
      },
      {
        type: 'FIB',
        text: 'A database index designed to search vector embeddings is called a _______ index.',
        options: [],
        correctAnswer: 'vector',
        explanation: 'Vector indexes like HNSW or IVFFlat are optimized for searching high-dimensional spaces.'
      }
    ].slice(0, count);
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Based on the text below, generate a quiz with ${count} questions of difficulty "${difficulty}". Include multiple types: MCQ (Multiple Choice), TF (True/False), FIB (Fill in the Blank), SA (Short Answer).
    
Return raw JSON content only matching this schema:
interface Question {
  type: 'MCQ' | 'TF' | 'FIB' | 'SA';
  text: string;
  options: string[]; // Options array (must have items for MCQ, empty for FIB or SA, exactly ["True", "False"] for TF)
  correctAnswer: string; // The correct answer text
  explanation: string; // Brief explanation of the answer
}
type Response = Question[];

Text:
${text.slice(0, 40000)}`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating quiz:', error);
    return [
      {
        type: 'MCQ',
        text: 'AI Quiz Error',
        options: ['API Limit', 'Bad Configuration', 'Network Downtime', 'Schema Mismatch'],
        correctAnswer: 'Bad Configuration',
        explanation: 'Check your API environment values.'
      }
    ];
  }
}

/**
 * Generate a personalized study plan calendar schedule.
 */
export async function generateStudyPlan(
  examDate: string | null,
  hoursPerWeek: number,
  difficulty: string,
  subjects: string[]
): Promise<{ title: string; tasks: { title: string; description: string; dueDate: string }[] }> {
  const targetDate = examDate ? new Date(examDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // Default to 30 days from now
  const subjectList = subjects.length > 0 ? subjects : ['General Study Concepts'];

  if (isMockMode) {
    const tasks: { title: string; description: string; dueDate: string }[] = [];
    const daysRemaining = Math.max(1, Math.floor((targetDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
    const taskCount = Math.min(10, Math.ceil(daysRemaining / 3));

    for (let i = 0; i < taskCount; i++) {
      const taskDate = new Date(Date.now() + i * 3 * 24 * 60 * 60 * 1000);
      const subj = subjectList[i % subjectList.length];
      tasks.push({
        title: `Study Session: ${subj} (Module ${i + 1})`,
        description: `Review fundamental components of ${subj}. Practice active recall and mock quiz questions. (Difficulty: ${difficulty})`,
        dueDate: taskDate.toISOString().split('T')[0]
      });
    }

    return {
      title: `${difficulty.toUpperCase()} Study Plan for ${subjectList.join(', ')}`,
      tasks
    };
  }

  try {
    const model = genAI!.getGenerativeModel({ model: 'gemini-1.5-flash' });
    const prompt = `Generate a personalized study plan leading to ${targetDate.toDateString()}. 
    
Details:
- Difficulty: ${difficulty}
- Study intensity: ${hoursPerWeek} hours per week
- Subjects to cover: ${subjectList.join(', ')}

Return raw JSON content only matching this schema:
interface Response {
  title: string;
  tasks: Array<{
    title: string;
    description: string;
    dueDate: string; // ISO Date string (YYYY-MM-DD)
  }>;
}

Ensure tasks are spaced out reasonably between now and the exam date.`;

    const result = await model.generateContent(prompt);
    const raw = result.response.text().trim();
    const jsonStr = raw.replace(/^```json/, '').replace(/```$/, '').trim();
    return JSON.parse(jsonStr);
  } catch (error) {
    console.error('Error generating study plan:', error);
    // Simple fallback
    return {
      title: `Study Planner (${difficulty})`,
      tasks: subjectList.map((subject, idx) => ({
        title: `Review ${subject}`,
        description: `Covers base chapters for ${subject}.`,
        dueDate: new Date(Date.now() + (idx + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      }))
    };
  }
}
