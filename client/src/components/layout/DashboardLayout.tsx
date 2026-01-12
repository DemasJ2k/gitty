import { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { useSidebar } from '@/contexts/SidebarContext';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

interface DashboardLayoutProps {
  children: ReactNode;
  onLogout: () => void;
}

export function DashboardLayout({ children, onLogout }: DashboardLayoutProps) {
  const { isOpen, toggle } = useSidebar();

  return (
    <div className="flex h-screen overflow-hidden" data-testid="dashboard-layout">
      <Sidebar onLogout={onLogout} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!isOpen && (
          <header className="flex items-center gap-3 p-4 border-b bg-card md:hidden">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              data-testid="button-open-sidebar"
            >
              <Menu className="h-5 w-5" />
            </Button>
            <h1 className="font-semibold">Trading AI</h1>
          </header>
        )}
        <main className="flex-1 overflow-auto bg-background">
          {children}
        </main>
      </div>
    </div>
  );
}
