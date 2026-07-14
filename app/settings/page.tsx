import * as React from 'react';
export const dynamic = 'force-dynamic';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/services/authService';
import { AppLayout } from '@/components/AppLayout';
import { SettingsPanel } from '@/components/SettingsPanel';

export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect('/login');
  }

  return (
    <AppLayout user={user as any}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">Account Settings</h1>
          <p className="text-xs text-muted-foreground">Adjust preferences, toggle notifications, and export library data.</p>
        </div>

        <SettingsPanel user={user as any} />
      </div>
    </AppLayout>
  );
}
