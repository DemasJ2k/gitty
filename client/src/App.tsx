import { Route, Switch, Redirect, useLocation } from 'wouter';
import { useAuth } from '@/hooks/useAuth';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { LoginPage } from '@/pages/LoginPage';
import { ChatPage } from '@/pages/ChatPage';
import { JournalPage } from '@/pages/JournalPage';
import { ChartsPage } from '@/pages/ChartsPage';
import { StrategiesPage } from '@/pages/StrategiesPage';
import { ToolsPage } from '@/pages/ToolsPage';
import { PlaybooksPage } from '@/pages/PlaybooksPage';
import { KnowledgePage } from '@/pages/KnowledgePage';
import { AlertsPage } from '@/pages/AlertsPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { SettingsPage } from '@/pages/SettingsPage';

function App() {
  const { user, loading, login, signup, logout } = useAuth();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return <LoginPage onLogin={login} onSignup={signup} />;
  }

  return (
    <DashboardLayout onLogout={logout}>
      <Switch>
        <Route path="/">
          <Redirect to="/dashboard" />
        </Route>
        <Route path="/dashboard">
          <DashboardPage />
        </Route>
        <Route path="/chat">
          <ChatPage />
        </Route>
        <Route path="/journal">
          <JournalPage />
        </Route>
        <Route path="/charts">
          <ChartsPage />
        </Route>
        <Route path="/strategies">
          <StrategiesPage />
        </Route>
        <Route path="/tools">
          <ToolsPage />
        </Route>
        <Route path="/playbooks">
          <PlaybooksPage />
        </Route>
        <Route path="/knowledge">
          <KnowledgePage />
        </Route>
        <Route path="/backtest">
          <Redirect to="/strategies" />
        </Route>
        <Route path="/alerts">
          <AlertsPage />
        </Route>
        <Route path="/settings">
          <SettingsPage />
        </Route>
        <Route path="/:rest*">
          {() => (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h1 className="text-6xl font-bold mb-4">404</h1>
                <p className="text-muted-foreground">Page not found</p>
              </div>
            </div>
          )}
        </Route>
      </Switch>
    </DashboardLayout>
  );
}

export default App;
