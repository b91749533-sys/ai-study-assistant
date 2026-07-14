import * as React from 'react';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';
import { AppLayout } from '@/components/AppLayout';
import { 
  getUserStatsAction, 
  getActivityLogsAction, 
  getDashboardChartsDataAction 
} from '@/app/actions/statsActions';
import { getDocumentsAction } from '@/app/actions/documentActions';
import { getTasksAction } from '@/app/actions/plannerActions';
import { DashboardCharts } from '@/components/DashboardCharts';
import { DashboardTasksList } from '@/components/DashboardTasksList';
import { DashboardUploadZone } from '@/components/DashboardUploadZone';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { 
  Flame, Clock, BookOpen, BrainCircuit, 
  Award, Activity, Calendar, FileText 
} from 'lucide-react';

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  // Fetch all stats and resources in parallel
  const [
    stats,
    activities,
    chartsData,
    documents,
    tasks
  ] = await Promise.all([
    getUserStatsAction(),
    getActivityLogsAction(),
    getDashboardChartsDataAction(),
    getDocumentsAction(),
    getTasksAction()
  ]);

  const activeStats = stats || {
    streakDays: 1,
    totalStudyHours: 0,
    flashcardsCreated: 0,
    quizzesCompleted: 0,
    achievements: ['welcome_badge']
  };

  const statMetrics = [
    { label: 'Study Streak', value: `${activeStats.streakDays} Days`, icon: Flame, color: 'text-orange-500 bg-orange-500/10' },
    { label: 'Study Hours', value: `${activeStats.totalStudyHours.toFixed(1)} hrs`, icon: Clock, color: 'text-indigo-500 bg-indigo-500/10' },
    { label: 'Flashcards', value: `${activeStats.flashcardsCreated} cards`, icon: BookOpen, color: 'text-emerald-500 bg-emerald-500/10' },
    { label: 'Quizzes Taken', value: `${activeStats.quizzesCompleted} completed`, icon: BrainCircuit, color: 'text-amber-500 bg-amber-500/10' },
  ];

  const achievementNames: Record<string, { label: string; desc: string }> = {
    welcome_badge: { label: 'First Steps 🎓', desc: 'Registered and created study workspace.' },
    first_upload: { label: 'Knowledge Base 📂', desc: 'Uploaded your first textbook or syllabus.' },
    streak_3: { label: 'Dedicated Scholar 🔥', desc: 'Maintained a 3-day active study streak.' },
    perfect_quiz: { label: 'Subject Master 🎯', desc: 'Achieved 100% score on a generated quiz.' },
  };

  return (
    <AppLayout user={user as any}>
      <div className="space-y-8">
        {/* Top Header greeting */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">Study Dashboard</h1>
            <p className="text-xs text-muted-foreground">
              Track your weekly hours, complete generated tasks, and monitor achievements.
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-muted flex items-center gap-2 border">
            <span className="h-2 w-2 rounded-full bg-indigo-500 animate-ping" />
            <span>Interactive Workspace Live</span>
          </div>
        </div>

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

        {/* Recharts Graphical Trends */}
        <DashboardCharts 
          studyHours={chartsData.studyHours} 
          quizScores={chartsData.quizScores} 
        />

        {/* Triple Columns: Tasks, Upload, Activity Feed */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Upcoming Tasks */}
          <Card glow className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-indigo-500" />
                <span>Upcoming Study Calendar</span>
              </CardTitle>
              <CardDescription className="text-xs">Incomplete tasks due in the next few days</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <DashboardTasksList initialTasks={tasks as any} />
            </CardContent>
          </Card>

          {/* Column 2: Upload Zone & Achievements */}
          <div className="space-y-6">
            <DashboardUploadZone />

            {/* Achievements Card */}
            <Card className="p-5 space-y-4">
              <h3 className="text-sm font-semibold flex items-center gap-2">
                <Award className="h-4 w-4 text-indigo-500" />
                <span>Earned Badges</span>
              </h3>
              <div className="flex flex-wrap gap-2">
                {activeStats.achievements.map((ach, idx) => {
                  const details = achievementNames[ach] || { label: ach, desc: 'Earned study badge.' };
                  return (
                    <Badge key={idx} variant="success" className="px-2.5 py-1 text-[10px]" title={details.desc}>
                      {details.label}
                    </Badge>
                  );
                })}
                {activeStats.achievements.length === 1 && (
                  <p className="text-[10px] text-muted-foreground italic py-1">
                    Upload documents or take quizzes to unlock more badges!
                  </p>
                )}
              </div>
            </Card>
          </div>

          {/* Column 3: Recent Activity */}
          <Card className="flex flex-col justify-between">
            <CardHeader>
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-500" />
                <span>Recent Activities</span>
              </CardTitle>
              <CardDescription className="text-xs">Your latest study session actions</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              {activities.length === 0 ? (
                <div className="py-6 text-center text-xs text-muted-foreground border border-dashed rounded-xl">
                  No recent activities recorded.
                </div>
              ) : (
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1">
                  {activities.map(log => (
                    <div key={log.id} className="flex gap-3 text-xs">
                      <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-foreground">{log.activity}</p>
                        {log.details && (
                          <p className="text-[10px] text-muted-foreground mt-0.5">{log.details}</p>
                        )}
                        <span className="text-[9px] text-muted-foreground mt-1 block">
                          {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
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
