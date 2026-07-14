'use client';

import * as React from 'react';
import Link from 'next/link';
import { loginAction } from '@/app/actions/authActions';
import { Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card';

export default function LoginPage() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }

    setLoading(true);
    setError(null);

    const res = await loginAction(email);
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Glow shapes */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] bg-indigo-500/5 rounded-full blur-[80px] pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 space-y-4">
        <Link href="/" className="inline-flex items-center gap-2 font-bold text-xl tracking-tight">
          <Sparkles className="h-6 w-6 text-indigo-500 animate-pulse" />
          <span>StudySync.ai</span>
        </Link>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10">
        <Card glass className="shadow-xl">
          <CardHeader>
            <CardTitle>Welcome back</CardTitle>
            <CardDescription>Enter your email to sign in to your study workspace.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-red-500 rounded-md">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label htmlFor="email" className="text-xs font-semibold text-muted-foreground">
                  Email Address
                </label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  disabled={loading}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2 border-t pt-4">
            <p className="text-xs text-muted-foreground">
              Don't have an account?{' '}
              <Link href="/register" className="text-indigo-500 hover:underline font-semibold">
                Sign up free
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
