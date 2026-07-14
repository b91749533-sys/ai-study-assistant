'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { 
  Sparkles, Home, BookOpen, User, Settings, 
  LogOut, Moon, Sun, Menu, Search, X, Calendar 
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { logoutAction } from '@/app/actions/authActions';
import { CommandPalette } from '@/components/CommandPalette';

interface AppLayoutProps {
  children: React.ReactNode;
  user: {
    username: string | null;
    email: string;
    avatarUrl: string | null;
    statistics?: {
      streakDays: number;
    } | null;
  };
}

export function AppLayout({ children, user }: AppLayoutProps) {
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);

  const navItems = [
    { label: 'Dashboard', href: '/dashboard', icon: Home },
    { label: 'Workspace', href: '/workspace', icon: BookOpen },
    { label: 'Profile', href: '/profile', icon: User },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleLogout = async () => {
    await logoutAction();
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col md:flex-row font-sans">
      <CommandPalette />

      {/* Mobile Header Bar */}
      <header className="md:hidden flex items-center justify-between border-b px-4 h-14 bg-background/80 backdrop-blur-md sticky top-0 z-30">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold text-sm">
          <Sparkles className="h-4 w-4 text-indigo-500" />
          <span>StudySync</span>
        </Link>
        <div className="flex items-center gap-2">
          {/* Quick search button */}
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8"
            onClick={() => {
              // Trigger Cmd+K search programmatically by dispatching event
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
              window.dispatchEvent(event);
            }}
          >
            <Search className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </header>

      {/* Sidebar Navigation */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-64 border-r bg-card flex flex-col justify-between
        transition-transform duration-300 md:relative md:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="flex flex-col p-4 space-y-6">
          {/* Logo */}
          <div className="flex items-center justify-between border-b pb-4 px-2">
            <Link href="/dashboard" className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2 font-bold text-lg">
                <Sparkles className="h-5 w-5 text-indigo-500 animate-pulse" />
                <span>StudySync.ai</span>
              </div>
              <span className="text-[9px] text-muted-foreground font-medium pl-7">by Manssouri Youssef</span>
            </Link>
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8"
              onClick={() => setMobileMenuOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* User profile brief card */}
          <div className="flex items-center gap-3 bg-muted/40 p-3 rounded-xl border">
            <div className="h-10 w-10 rounded-full border bg-background flex items-center justify-center font-bold text-sm text-indigo-500 overflow-hidden">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
              ) : (
                user.username?.slice(0, 2).toUpperCase() || 'ST'
              )}
            </div>
            <div className="overflow-hidden flex-1">
              <h4 className="text-xs font-semibold truncate leading-none mb-1">
                {user.username || 'User'}
              </h4>
              <p className="text-[10px] text-muted-foreground truncate leading-none">
                {user.email}
              </p>
            </div>
            <span className="text-xs bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 px-1.5 py-0.5 rounded-full font-bold whitespace-nowrap">
              🔥 {user.statistics?.streakDays || 1}
            </span>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1 px-1">
            {navItems.map((item, idx) => {
              const active = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={idx}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${active 
                      ? 'bg-primary text-primary-foreground font-semibold' 
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'}
                  `}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer actions */}
        <div className="p-4 border-t space-y-3 bg-muted/10">
          {/* Quick global search trigger button */}
          <Button 
            variant="outline" 
            className="w-full justify-start text-xs text-muted-foreground gap-2 font-normal"
            onClick={() => {
              const event = new KeyboardEvent('keydown', { key: 'k', ctrlKey: true });
              window.dispatchEvent(event);
            }}
          >
            <Search className="h-3.5 w-3.5" />
            <span>Search...</span>
            <kbd className="ml-auto pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[9px] font-medium opacity-100">
              Ctrl+K
            </kbd>
          </Button>

          <div className="flex items-center justify-between px-2">
            {/* Theme toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
            >
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            {/* Logout button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="h-8 w-8 text-muted-foreground hover:text-red-500 hover:bg-red-500/10"
            >
              <LogOut className="h-[1.2rem] w-[1.2rem]" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main page content area */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="flex-grow p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
