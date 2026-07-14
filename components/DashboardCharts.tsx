'use client';

import * as React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  Tooltip, BarChart, Bar, CartesianGrid 
} from 'recharts';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';

interface DashboardChartsProps {
  studyHours: { day: string; hours: number }[];
  quizScores: { name: string; score: number }[];
}

export function DashboardCharts({ studyHours, quizScores }: DashboardChartsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Study Hours Card */}
      <Card glow className="h-[300px] flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Weekly Study Hours</CardTitle>
          <CardDescription className="text-xs">Time spent reading and chatting with documents</CardDescription>
        </CardHeader>
        <CardContent className="h-full flex-grow pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={studyHours} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <defs>
                <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="day" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Area 
                type="monotone" 
                dataKey="hours" 
                stroke="hsl(var(--primary))" 
                strokeWidth={2}
                fillOpacity={1} 
                fill="url(#colorHours)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Quiz Scores Card */}
      <Card glow className="h-[300px] flex flex-col justify-between">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-semibold">Quiz Performance History</CardTitle>
          <CardDescription className="text-xs">Correctness score percentages for recent quizzes</CardDescription>
        </CardHeader>
        <CardContent className="h-full flex-grow pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={quizScores} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))" 
                fontSize={10} 
                tickLine={false} 
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '11px',
                }}
              />
              <Bar 
                dataKey="score" 
                fill="hsl(var(--ring))" 
                radius={[4, 4, 0, 0]} 
                maxBarSize={40}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
