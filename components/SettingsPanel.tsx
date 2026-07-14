'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { exportUserDataAction, deleteAccountAction } from '@/app/actions/settingsActions';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { 
  Sun, Moon, ShieldAlert, Download, Trash2, 
  Globe, Bell, Loader2, CheckCircle2 
} from 'lucide-react';

interface SettingsPanelProps {
  user: {
    username: string | null;
    email: string;
  };
}

export function SettingsPanel({ user }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme();
  
  const [lang, setLang] = React.useState('en');
  const [notifs, setNotifs] = React.useState(true);
  
  const [exporting, setExporting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState(0);
  const [statusMsg, setStatusMsg] = React.useState<string | null>(null);

  const handleExportData = async () => {
    setExporting(true);
    setStatusMsg(null);
    const res = await exportUserDataAction();
    if (res.success && res.data) {
      // Trigger browser download of the JSON backup
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(res.data);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `studysync_backup_${user.username || 'user'}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      setStatusMsg('Backup generated and download started!');
    } else {
      setStatusMsg('Failed to export study data.');
    }
    setExporting(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteStep === 0) {
      setDeleteStep(1);
      return;
    }

    setDeleting(true);
    const res = await deleteAccountAction();
    if (res && (res as any).error) {
      setStatusMsg((res as any).error);
      setDeleting(false);
      setDeleteStep(0);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {statusMsg && (
        <div className="p-3 text-xs bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <span>{statusMsg}</span>
        </div>
      )}

      {/* Theme Card */}
      <Card className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Sun className="h-4 w-4 text-indigo-500" />
          <span>Interface Appearance</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Select light or dark mode theme for study workspaces.</p>
        <div className="flex gap-2">
          <Button 
            variant={theme === 'light' ? 'default' : 'outline'} 
            size="sm" 
            className="flex items-center gap-1.5 h-8 text-[11px]"
            onClick={() => setTheme('light')}
          >
            <Sun className="h-3.5 w-3.5" />
            <span>Light Theme</span>
          </Button>
          <Button 
            variant={theme === 'dark' ? 'default' : 'outline'} 
            size="sm" 
            className="flex items-center gap-1.5 h-8 text-[11px]"
            onClick={() => setTheme('dark')}
          >
            <Moon className="h-3.5 w-3.5" />
            <span>Dark Theme</span>
          </Button>
        </div>
      </Card>

      {/* Language Card */}
      <Card className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Globe className="h-4 w-4 text-indigo-500" />
          <span>Language Preference</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Choose default workspace text localization.</p>
        <select
          value={lang}
          onChange={e => setLang(e.target.value)}
          className="h-8 rounded-lg border bg-background px-3 py-1 text-xs focus:ring-1 focus:ring-ring focus:outline-none max-w-xs w-full"
        >
          <option value="en">English (US)</option>
          <option value="es">Español (ES)</option>
          <option value="fr">Français (FR)</option>
        </select>
      </Card>

      {/* Notifications Card */}
      <Card className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Bell className="h-4 w-4 text-indigo-500" />
          <span>Study Notifications</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Receive calendar task reminders and study summary outputs.</p>
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={notifs}
            onChange={e => setNotifs(e.target.checked)}
            className="rounded cursor-pointer accent-indigo-500"
          />
          <span className="text-xs font-medium">Enable browser task notifications</span>
        </div>
      </Card>

      {/* Backup and Export */}
      <Card className="p-5">
        <h3 className="text-xs font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
          <Download className="h-4 w-4 text-indigo-500" />
          <span>Backup Study Library</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Download a copy of your uploaded files, note summaries, and study stats in JSON.</p>
        <Button 
          onClick={handleExportData} 
          disabled={exporting}
          className="h-9 text-xs flex items-center gap-1.5"
        >
          {exporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
          <span>Export All Data</span>
        </Button>
      </Card>

      {/* Danger Zone: Delete Account */}
      <Card className="p-5 border-red-500/20 bg-red-500/[0.01]">
        <h3 className="text-xs font-bold uppercase tracking-wider text-red-500 mb-4 flex items-center gap-2">
          <ShieldAlert className="h-4 w-4" />
          <span>Danger Zone</span>
        </h3>
        <p className="text-[11px] text-muted-foreground mb-4">Permanently delete your StudySync account, documents, embeddings, and stats. This is irreversible.</p>
        
        {deleteStep === 0 ? (
          <Button 
            variant="destructive" 
            className="h-9 text-xs flex items-center gap-1.5"
            onClick={handleDeleteAccount}
          >
            <Trash2 className="h-4 w-4" />
            <span>Delete Account</span>
          </Button>
        ) : (
          <div className="space-y-4 border border-red-500/20 p-4 rounded-lg bg-red-500/5">
            <p className="text-xs font-semibold text-red-600">Are you absolutely sure? This will delete all documents and study calendars.</p>
            <div className="flex gap-2">
              <Button 
                variant="destructive" 
                size="sm"
                className="h-8 text-[11px]"
                disabled={deleting}
                onClick={handleDeleteAccount}
              >
                {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Yes, Permanently Delete'}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-8 text-[11px]"
                onClick={() => setDeleteStep(0)}
                disabled={deleting}
              >
                Cancel
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
