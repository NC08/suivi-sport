import { useState, useEffect } from 'react';
import type { Session } from './types';
import { loadSessions } from './utils/storage';
import Navigation from './components/Navigation';
import Dashboard from './components/Dashboard';
import NewSession from './components/NewSession';
import SessionHistory from './components/SessionHistory';
import ProgressCharts from './components/ProgressCharts';

export type Page = 'dashboard' | 'new-session' | 'history' | 'progress';

export default function App() {
  const [page, setPage] = useState<Page>('dashboard');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [editingSession, setEditingSession] = useState<Session | null>(null);

  useEffect(() => {
    setSessions(loadSessions());
  }, []);

  const refresh = () => setSessions(loadSessions());

  const handleEdit = (session: Session) => {
    setEditingSession(session);
    setPage('new-session');
  };

  const handleNewSession = () => {
    setEditingSession(null);
    setPage('new-session');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation page={page} setPage={setPage} onNew={handleNewSession} />
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 py-6">
        {page === 'dashboard' && (
          <Dashboard sessions={sessions} onNew={handleNewSession} setPage={setPage} />
        )}
        {page === 'new-session' && (
          <NewSession
            sessions={sessions}
            editing={editingSession}
            onSaved={() => { refresh(); setPage('history'); }}
            onCancel={() => setPage('history')}
          />
        )}
        {page === 'history' && (
          <SessionHistory
            sessions={sessions}
            onEdit={handleEdit}
            onDelete={refresh}
          />
        )}
        {page === 'progress' && (
          <ProgressCharts sessions={sessions} />
        )}
      </main>
    </div>
  );
}
