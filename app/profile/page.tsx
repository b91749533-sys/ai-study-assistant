import * as React from 'react';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';
import { AppLayout } from '@/components/AppLayout';
import { getUserStatsAction, getActivityLogsAction } from '@/app/actions/statsActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Flame, Clock, BookOpen, BrainCircuit, Award, Calendar } from 'lucide-react';

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  const [stats, activities] = await Promise.all([
    getUserStatsAction(),
    getActivityLogsAction()
  ]);

  const activeStats = stats || {
    streakDays: 1,
    totalStudyHours: 0,
    flashcardsCreated: 0,
    quizzesCompleted: 0,
    achievements: ['welcome_badge']
  };

  const statMetrics = [
    { label: 'Active Streak', value: `${activeStats.streakDays} Days`, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Total Study Time', value: `${activeStats.totalStudyHours.toFixed(1)} hours`, icon: Clock, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Flashcards Made', value: `${activeStats.flashcardsCreated} cards`, icon: BookOpen, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Quizzes Taken', value: `${activeStats.quizzesCompleted} completed`, icon: BrainCircuit, color: 'text-amber-500 bg-amber-500/10' },
  ];

  const badges = [
    { id: 'welcome_badge', label: 'First Steps 🎓', desc: 'Registered and created study workspace.', unlocked: activeStats.achievements.includes('welcome_badge') },
    { id: 'first_upload', label: 'Knowledge Base 📂', desc: 'Uploaded your first textbook or syllabus.', unlocked: activeStats.achievements.includes('first_upload') || activeStats.totalStudyHours > 0.5 },
    { id: 'streak_3', label: 'Dedicated Scholar 🔥', desc: 'Maintained a 3-day active study streak.', unlocked: activeStats.achievements.includes('streak_3') || activeStats.streakDays >= 3 },
    { id: 'perfect_quiz', label: 'Subject Master 🎯', desc: 'Achieved 100% score on a generated quiz.', unlocked: activeStats.achievements.includes('perfect_quiz') },
  ];

  return (
    <AppLayout user={user as any}>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Student Profile</h1>
          <p className="text-xs text-muted-foreground">View your study statistics and check earned milestones.</p>
        </div>

        {/* Profile Card */}
        <Card glow className="p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
            <div className="h-20 w-20 rounded-full border bg-muted flex items-center justify-center font-bold text-2xl text-indigo-500 overflow-hidden shrink-0">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user.username?.slice(0, 2).toUpperCase() || 'ST'
              )}
            </div>
            <div className="space-y-1">
              <h2 className="text-xl font-bold tracking-tight">{user.username || 'Student'}</h2>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <Badge variant="outline" className="text-[10px]">
                  Registered {new Date(user.createdAt).toLocaleDateString()}
                </Badge>
                <Badge variant="success" className="text-[10px] font-bold">
                  🔥 Streak: {activeStats.streakDays} Days
                </Badge>
              </div>
            </div>
          </div>
        </Card>

        {/* Stats Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statMetrics.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <Card key={idx} className="p-4 flex items-center gap-4">
                <div className={`p-2.5 rounded-xl ${stat.color} shrink-0`}>
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-lg font-bold tracking-tight">{stat.value}</p>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Achievements list */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
              <Award className="h-4 w-4 text-indigo-500" />
              <span>Milestones & Badges</span>
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {badges.map((bdg, idx) => (
                <Card key={idx} className={`p-5 transition-all ${bdg.unlocked ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'opacity-60 bg-muted/20'}`}>
                  <div className="flex justify-between items-start gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold">{bdg.label}</h4>
                      <p className="text-[10px] text-muted-foreground leading-relaxed">{bdg.desc}</p>
                    </div>
                    <Badge variant={bdg.unlocked ? 'success' : 'outline'} className="text-[9px] font-mono shrink-0 uppercase">
                      {bdg.unlocked ? 'Unlocked' : 'Locked'}
                    </Badge>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          {/* Activity timeline in profile */}
          <Card className="p-5 flex flex-col justify-between">
            <CardHeader className="p-0 pb-4 border-b">
              <CardTitle className="text-xs font-bold uppercase tracking-wider">Workspace Activity Feed</CardTitle>
            </CardHeader>
            <CardContent className="p-0 pt-4 flex-grow">
              {activities.length === 0 ? (
                <p className="text-xs text-muted-foreground italic text-center py-6">No logs.</p>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activities.map(log => (
                    <div key={log.id} className="text-xs space-y-1 border-b pb-2 last:border-0 last:pb-0">
                      <p className="font-semibold text-foreground">{log.activity}</p>
                      {log.details && (
                        <p className="text-[10px] text-muted-foreground">{log.details}</p>
                      )}
                      <span className="text-[9px] text-muted-foreground block">
                        {new Date(log.createdAt).toLocaleDateString()} {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
