import { Outlet } from 'react-router-dom';
import { CheckSquare, LogOut } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { initials } from '../lib/format';
import { Badge } from './ui/Badge';

function UserChip(): JSX.Element | null {
  const { user, logout } = useAuth();
  if (!user) return null;
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
        {initials(user.name)}
      </div>
      <div className="hidden sm:block">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-slate-800">{user.name}</p>
          {user.role === 'ADMIN' && (
            <Badge className="bg-purple-100 text-purple-700">Admin</Badge>
          )}
        </div>
        <p className="text-xs text-slate-500">{user.email}</p>
      </div>
      <button
        type="button"
        onClick={logout}
        aria-label="Log out"
        className="rounded-lg p-2 text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-700"
      >
        <LogOut className="h-5 w-5" />
      </button>
    </div>
  );
}

export function Layout(): JSX.Element {
  return (
    <div className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-600 text-white">
              <CheckSquare className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-base font-bold leading-tight text-slate-900">
                Smart Task
              </h1>
              <p className="text-xs text-slate-500">Enterprise Service</p>
            </div>
          </div>
          <UserChip />
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
