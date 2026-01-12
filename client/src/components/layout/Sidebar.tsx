import { Link, useLocation } from 'wouter';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  MessageSquare,
  BookOpen,
  LineChart,
  Target,
  Wrench,
  FileText,
  Library,
  Bell,
  Settings,
  LogOut,
  Sun,
  Moon,
  Monitor,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTheme } from '@/contexts/ThemeContext';
import { useSidebar } from '@/contexts/SidebarContext';

interface SidebarProps {
  onLogout: () => void;
}

const navItems = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/chat', label: 'Chat', icon: MessageSquare },
  { path: '/journal', label: 'Journal', icon: BookOpen },
  { path: '/charts', label: 'Charts', icon: LineChart },
  { path: '/strategies', label: 'Strategies', icon: Target },
  { path: '/alerts', label: 'Alerts', icon: Bell },
  { path: '/tools', label: 'Tools', icon: Wrench },
  { path: '/playbooks', label: 'Playbooks', icon: FileText },
  { path: '/knowledge', label: 'Knowledge', icon: Library },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export function Sidebar({ onLogout }: SidebarProps) {
  const [location] = useLocation();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { isOpen, close } = useSidebar();

  const cycleTheme = () => {
    if (theme === 'light') setTheme('dark');
    else if (theme === 'dark') setTheme('system');
    else setTheme('light');
  };

  const ThemeIcon = theme === 'system' ? Monitor : resolvedTheme === 'dark' ? Moon : Sun;

  if (!isOpen) return null;

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 z-40 md:hidden" 
        onClick={close}
        data-testid="sidebar-overlay"
      />
      <aside 
        className={cn(
          "flex flex-col w-64 bg-card border-r h-screen z-50",
          "fixed md:relative md:z-auto"
        )} 
        data-testid="sidebar"
      >
        <div className="p-4 border-b flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold" data-testid="app-title">Trading AI</h1>
            <p className="text-xs text-muted-foreground">Analysis Platform</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={close}
            data-testid="button-close-sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location === item.path || (location === '/' && item.path === '/chat');
            
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => window.innerWidth < 768 && close()}
                className={cn(
                  'flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent text-muted-foreground hover:text-foreground'
                )}
                data-testid={`nav-${item.label.toLowerCase()}`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t space-y-2">
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={cycleTheme}
            data-testid="button-theme-toggle"
          >
            <ThemeIcon className="h-4 w-4" />
            {theme === 'system' ? 'System' : theme === 'dark' ? 'Dark' : 'Light'}
          </Button>
          <Button
            variant="ghost"
            className="w-full justify-start gap-3"
            onClick={onLogout}
            data-testid="button-logout"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
    </>
  );
}
