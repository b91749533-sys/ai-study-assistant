import * as React from 'react';
export const dynamic = 'force-dynamic';
import Link from 'next/link';
import { getCurrentUser } from '@/services/authService';
import { ArrowRight, Sparkles, BookOpen, BrainCircuit, CheckCircle, Calendar, MessageSquare, Terminal } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';

export default async function LandingPage() {
  const user = await getCurrentUser();

  const features = [
    {
      title: 'AI Chat with RAG',
      desc: 'Ask questions about your uploaded PDFs, Word docs, or notes, and get answers cited directly from specific pages.',
      icon: MessageSquare,
      color: 'from-blue-500/20 to-indigo-500/20'
    },
    {
      title: 'Smart Flashcards',
      desc: 'Automatically generate flashcards from document summaries and study using active recall and spaced repetition.',
      icon: BookOpen,
      color: 'from-purple-500/20 to-pink-500/20'
    },
    {
      title: 'Adaptive Quizzes',
      desc: 'Create MCQs, True/False, and Short Answer quizzes with automatic grading and AI explanations for every answer.',
      icon: BrainCircuit,
      color: 'from-amber-500/20 to-orange-500/20'
    },
    {
      title: 'Study Planner',
      desc: 'Map out your exams and schedule customizable study tasks on an interactive calendar to optimize review times.',
      icon: Calendar,
      color: 'from-emerald-500/20 to-teal-500/20'
    }
  ];

  const pricing = [
    {
      name: 'Scholar (Free)',
      price: '$0',
      desc: 'Essential tools for students starting with AI studying.',
      features: [
        'Upload up to 5 documents',
        'AI Summaries (Short & Bullet points)',
        'Basic Flashcards (up to 20 cards)',
        'Standard RAG Chat (50 AI questions/mo)'
      ],
      cta: 'Get Started',
      link: '/register',
      highlighted: false
    },
    {
      name: 'Academic Pro',
      price: '$9.99',
      desc: 'Unlimited power for high-performing students.',
      features: [
        'Unlimited document uploads',
        'Unlimited AI RAG Chat & Sources',
        'Detailed summaries & key concept extracts',
        'Unlimited Flashcard Sets & Quiz exports',
        'Interactive Study Planner Calendar',
        'Priority Gemini API throughput'
      ],
      cta: 'Upgrade to Pro',
      link: '/register',
      highlighted: true
    }
  ];

  const testimonials = [
    {
      quote: "This study assistant changed how I prep for midterms. Being able to chat with my entire biology textbook and see source page highlights saved me weeks.",
      author: "Sarah Jenkins",
      role: "Pre-Med Sophomore, Stanford"
    },
    {
      quote: "The automated flashcards and calendar scheduler took the anxiety out of studying. I generated a full 30-day exam prep list in 15 seconds.",
      author: "Marcus Vance",
      role: "M.S. Computer Science, Georgia Tech"
    }
  ];

  const faqs = [
    {
      q: "Which file formats do you support?",
      a: "We support PDF, DOCX, PPTX, TXT, and Markdown files. Our indexing system extracts the text content and creates embeddings automatically."
    },
    {
      q: "How does the RAG search work?",
      a: "When you upload a document, we break it into sections and convert them to vector embeddings. When you ask a question, we compute the similarity to find the exact pages containing the answer and supply them to Gemini."
    },
    {
      q: "Can I use it on my mobile phone?",
      a: "Yes! The entire application is built with a mobile-first responsive grid, optimized for iPads, tablets, and smartphones."
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b bg-background/60 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg tracking-tight">
            <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
            <span>StudySync.ai</span>
          </Link>

          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </nav>

          <div className="flex items-center gap-4">
            {user ? (
              <Button asChild variant="default" size="sm">
                <Link href="/dashboard">Go to Dashboard</Link>
              </Button>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium hover:text-foreground transition-colors">
                  Log in
                </Link>
                <Button asChild size="sm">
                  <Link href="/register">Sign up</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 overflow-hidden border-b">
        {/* Glow effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center relative">
          <div className="space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
              <Sparkles className="h-3 w-3" />
              <span>Next-Gen Spaced Repetition Platform</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
              Study Smart.<br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                Not Harder.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              Upload your syllabus, textbooks, or course files. Chat with your docs, auto-generate flashcards, create adaptive quizzes, and schedule tasks automatically.
            </p>

            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-2">
              <Button asChild size="lg" className="w-full sm:w-auto">
                <Link href={user ? '/dashboard' : '/register'} className="flex items-center gap-2">
                  <span>Start studying free</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                <a href="#features">See features</a>
              </Button>
            </div>
          </div>

          {/* Floating UI Graphic */}
          <div className="flex justify-center relative">
            <div className="w-full max-w-md aspect-square rounded-2xl border bg-card/40 backdrop-blur-md p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full bg-red-500" />
                    <span className="h-3 w-3 rounded-full bg-yellow-500" />
                    <span className="h-3 w-3 rounded-full bg-green-500" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-mono">ai_study_helper.ts</span>
                </div>
                <div className="space-y-2 font-mono text-xs text-muted-foreground">
                  <p className="text-indigo-400">&gt; import &#123; GeminiRAG &#125; from 'gemini'</p>
                  <p className="text-emerald-400">&gt; const syllabus = await Document.parse('sys.pdf')</p>
                  <p className="text-purple-400">&gt; const flashcards = await AI.generateCards(syllabus)</p>
                  <p className="text-amber-400">&gt; const quiz = await AI.generateQuiz(syllabus)</p>
                </div>
              </div>

              {/* Graphical cards floating inside */}
              <div className="grid grid-cols-2 gap-3 pt-6">
                <div className="border bg-background/80 p-3 rounded-xl shadow-sm text-center">
                  <span className="text-xs text-muted-foreground block mb-1">Study Streak</span>
                  <span className="text-xl font-bold text-indigo-500">12 Days 🔥</span>
                </div>
                <div className="border bg-background/80 p-3 rounded-xl shadow-sm text-center">
                  <span className="text-xs text-muted-foreground block mb-1">Quiz Accuracy</span>
                  <span className="text-xl font-bold text-emerald-500">94.2% 🎯</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 border-b w-full">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Supercharged Learning Features</h2>
          <p className="text-muted-foreground text-sm">
            Tackle complex subjects with tools custom built for retention and active learning.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feat, idx) => {
            const IconComponent = feat.icon;
            return (
              <Card key={idx} glow className="flex flex-col h-full">
                <CardHeader>
                  <div className={`p-3 rounded-xl bg-gradient-to-r ${feat.color} w-fit mb-4`}>
                    <IconComponent className="h-6 w-6 text-indigo-500" />
                  </div>
                  <CardTitle className="text-base font-semibold">{feat.title}</CardTitle>
                </CardHeader>
                <CardContent className="flex-grow pt-0">
                  <CardDescription className="text-xs leading-relaxed text-muted-foreground">
                    {feat.desc}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30 border-b w-full">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
            <h2 className="text-3xl font-bold tracking-tight">Loved by high achievers</h2>
            <p className="text-muted-foreground text-sm">
              See how students and researchers are saving hours of note-taking every single week.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {testimonials.map((test, idx) => (
              <Card key={idx} glass className="p-6 flex flex-col justify-between">
                <CardContent className="p-0 mb-6">
                  <p className="text-sm italic leading-relaxed text-muted-foreground">
                    "{test.quote}"
                  </p>
                </CardContent>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-indigo-500/10 border flex items-center justify-center font-bold text-indigo-500 text-sm">
                    {test.author.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold">{test.author}</h4>
                    <p className="text-xs text-muted-foreground">{test.role}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 max-w-7xl mx-auto px-4 border-b w-full">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Simple, transparent pricing</h2>
          <p className="text-muted-foreground text-sm">
            Choose the plan that fits your study routine. No hidden fees, cancel anytime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          {pricing.map((tier, idx) => (
            <Card key={idx} className={`relative flex flex-col h-full ${tier.highlighted ? 'border-indigo-500/50 shadow-indigo-500/5' : ''}`}>
              {tier.highlighted && (
                <span className="absolute top-0 right-6 -translate-y-1/2 bg-indigo-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                  Popular
                </span>
              )}
              <CardHeader>
                <CardTitle className="text-lg">{tier.name}</CardTitle>
                <CardDescription className="text-xs">{tier.desc}</CardDescription>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold tracking-tight">{tier.price}</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </CardHeader>
              <CardContent className="flex-grow pt-0">
                <ul className="space-y-3 text-xs text-muted-foreground">
                  {tier.features.map((feat, fidx) => (
                    <li key={fidx} className="flex items-start gap-2">
                      <CheckCircle className="h-4 w-4 text-indigo-500 shrink-0 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
              <div className="p-6 pt-0 mt-auto">
                <Button asChild variant={tier.highlighted ? 'default' : 'outline'} className="w-full">
                  <Link href={tier.link}>{tier.cta}</Link>
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Accordion */}
      <section id="faq" className="py-20 max-w-7xl mx-auto px-4 border-b w-full">
        <div className="text-center max-w-xl mx-auto mb-16 space-y-4">
          <h2 className="text-3xl font-bold tracking-tight">Frequently Asked Questions</h2>
          <p className="text-muted-foreground text-sm">
            Answers to common questions about syncing notes, uploading materials, and AI limits.
          </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-4">
          {faqs.map((faq, idx) => (
            <Card key={idx} glass className="p-5">
              <h3 className="font-semibold text-sm mb-2">{faq.q}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{faq.a}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t mt-auto w-full bg-muted/10">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-500" />
            <span className="font-bold tracking-tight text-sm">StudySync.ai</span>
          </div>

          <p className="text-xs text-muted-foreground text-center sm:text-left">
            &copy; {new Date().getFullYear()} StudySync.ai by Manssouri Youssef. All rights reserved.
          </p>

          <div className="flex gap-4 text-xs text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms of Service</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
