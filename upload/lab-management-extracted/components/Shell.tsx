"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import { useEffect, useState } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  UserPlus, 
  CheckSquare, 
  Network, 
  FileBarChart, 
  Settings,
  Sun,
  Moon,
  ClipboardList,
  Award
} from 'lucide-react';


const MENU_ITEMS = [
  { name: 'ڈیش بورڈ', path: '/', icon: LayoutDashboard },
  { name: 'حاضری', path: '/attendance', icon: CheckSquare },
  { name: 'کلاسز', path: '/classes', icon: Users },
  { name: 'کورسز', path: '/courses', icon: BookOpen },
  { name: 'طلباء', path: '/students', icon: UserPlus },
  { name: 'سکلز ٹریکر', path: '/skills', icon: Network },
  { name: 'ٹاسکس', path: '/tasks', icon: ClipboardList },
  { name: 'سرٹیفکیٹ', path: '/certificates', icon: Award },
  { name: 'رپورٹس', path: '/reports', icon: FileBarChart },
  { name: 'سیٹنگز', path: '/settings', icon: Settings },
];

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div className="w-9 h-9 rounded-xl bg-surface-base/30 animate-pulse border border-border-subtle/50" />;
  }

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  return (
    <button
      onClick={() => setTheme(isDark ? 'light' : 'dark')}
      className="p-2 border border-border-subtle/50 rounded-xl bg-surface-base/30 shadow-sm text-text-muted hover:text-text-primary hover:bg-surface-light transition-all flex items-center justify-center"
      aria-label="Toggle Theme"
      title={isDark ? "لائٹ موڈ آن کریں" : "ڈارک موڈ آن کریں"}
    >
      {isDark ? (
        <Sun className="w-5 h-5 transition-transform hover:rotate-45" />
      ) : (
        <Moon className="w-5 h-5 transition-transform hover:-rotate-12" />
      )}
    </button>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-bg-base overflow-hidden print:block print:h-auto transition-colors duration-300" dir="rtl">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-transparent flex flex-col relative z-20 gap-6 p-6 print:hidden border-l border-border-subtle/20">
        <div className="flex flex-col items-center">
          <div className="text-center">
            <h1 className="text-xl font-bold text-accent mb-1 drop-shadow-sm">شعبہ علوم جدیدہ</h1>
            <h2 className="text-lg font-bold text-text-primary">جامعہ اشرفیہ</h2>
            <h3 className="text-sm font-medium text-text-muted opacity-80 mt-1">نیلا گنبد لاہور</h3>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
          {MENU_ITEMS.map((item) => {
            const isActive = pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center gap-3 px-5 py-3 rounded-xl transition-all duration-300 ease-in-out cursor-pointer ${
                  isActive 
                    ? 'bg-surface-light text-accent border-r-4 border-accent' 
                    : 'text-text-muted hover:bg-surface-light/50 border-r-4 border-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform duration-300 ${isActive ? 'scale-110' : ''}`} />
                <span className="font-medium text-sm">{item.name}</span>
              </Link>
            );
          })}
        </nav>
        <div className="glass p-4 text-center text-xs opacity-60 border-dashed text-text-muted rounded-xl bg-surface-base/30 border border-border-subtle">
          ورژن 1.0.5<br/>آف لائن موڈ فعال ہے
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative z-10 p-6 gap-6 min-h-0 print:block print:h-auto print:p-0 print:overflow-visible">
        {/* Top Header Decor */}
        <header className="flex justify-between items-center bg-surface-base p-4 rounded-2xl border border-border-subtle flex-shrink-0 print:hidden shadow-sm">
          <div className="flex flex-col">
            <h2 className="text-xl font-bold text-text-primary">
              {MENU_ITEMS.find((m) => m.path === pathname)?.name || 'ڈیش بورڈ'}
            </h2>
            <p className="text-sm text-text-muted">
              آج: {new Intl.DateTimeFormat('ur-PK', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date())}
            </p>
          </div>
          <div className="flex items-center gap-4 text-text-muted mt-2 sm:mt-0 opacity-80">
            <span className="hidden sm:flex text-sm font-medium border border-border-subtle/50 px-3 py-1.5 rounded-xl bg-surface-base/50 shadow-sm items-center gap-1.5 hover:opacity-100 transition-opacity">
              کاوش: <span className="font-bold text-accent tracking-wide">ابن رحمت</span>
            </span>
            <ThemeToggle />
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative print:overflow-visible print:block mt-1">
          <div className="max-w-6xl mx-auto h-full text-text-primary print:h-auto pb-6">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
