import { LayoutDashboard, History, TrendingUp, Plus, Dumbbell } from 'lucide-react';
import type { Page } from '../App';
import clsx from 'clsx';

interface Props {
  page: Page;
  setPage: (p: Page) => void;
  onNew: () => void;
}

const navItems = [
  { id: 'dashboard' as Page, label: 'Tableau de bord', icon: LayoutDashboard },
  { id: 'history' as Page, label: 'Historique', icon: History },
  { id: 'progress' as Page, label: 'Progression', icon: TrendingUp },
];

export default function Navigation({ page, setPage, onNew }: Props) {
  return (
    <>
      {/* Desktop top bar */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 flex items-center h-16 gap-6">
          <div className="flex items-center gap-2 font-bold text-lg text-indigo-600 mr-2">
            <Dumbbell size={22} />
            <span className="hidden sm:inline">Suivi Sport</span>
          </div>
          <nav className="hidden md:flex items-center gap-1 flex-1">
            {navItems.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setPage(id)}
                className={clsx(
                  'flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors',
                  page === id
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                )}
              >
                <Icon size={16} />
                {label}
              </button>
            ))}
          </nav>
          <button onClick={onNew} className="btn-primary ml-auto">
            <Plus size={16} />
            <span className="hidden sm:inline">Nouvelle séance</span>
          </button>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 z-50 flex">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setPage(id)}
            className={clsx(
              'flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium transition-colors',
              page === id ? 'text-indigo-600' : 'text-gray-400'
            )}
          >
            <Icon size={20} />
            <span>{label.split(' ')[0]}</span>
          </button>
        ))}
        <button
          onClick={onNew}
          className="flex-1 flex flex-col items-center gap-1 py-3 text-xs font-medium text-indigo-600"
        >
          <Plus size={20} />
          <span>Nouvelle</span>
        </button>
      </nav>
    </>
  );
}
