import { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { LayoutDashboard, Receipt, PieChart, Target, TrendingUp, Menu, X } from 'lucide-react';
import { CactusLogo } from '../brand/CactusLogo';
import { useAuthStore } from '../../store/authStore';
import type { User } from '../../types';

interface NavItemDef {
  path: string;
  label: string;
  icon: typeof LayoutDashboard;
}

const navItems: NavItemDef[] = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: Receipt },
  { path: '/budget', label: 'Budget', icon: PieChart },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/insights', label: 'Insights', icon: TrendingUp },
];

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-sage focus-visible:ring-offset-2 focus-visible:ring-offset-brand-cream';

function NavItem({
  item,
  active,
  onClick,
  variant = 'sidebar',
}: {
  item: NavItemDef;
  active: boolean;
  onClick?: () => void;
  variant?: 'sidebar' | 'tab';
}) {
  const Icon = item.icon;
  if (variant === 'tab') {
    return (
      <Link
        to={item.path}
        aria-current={active ? 'page' : undefined}
        onClick={onClick}
        className={`flex flex-col items-center gap-0.5 px-3 py-2 rounded-md ${focusRing} ${
          active ? 'text-brand-sage' : 'text-brand-text-faint'
        }`}
      >
        <Icon className="w-5 h-5" />
        <span className="text-[10px] font-sans-brand font-semibold">{item.label}</span>
      </Link>
    );
  }
  return (
    <Link
      to={item.path}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl font-sans-brand font-semibold text-sm transition-colors ${focusRing} ${
        active
          ? 'bg-brand-sage-soft text-brand-text border-l-[3px] border-brand-sage'
          : 'text-brand-text-muted hover:bg-brand-sage-soft/60 hover:text-brand-text'
      }`}
    >
      <Icon className="w-5 h-5 shrink-0" />
      <span>{item.label}</span>
    </Link>
  );
}

function UserSection({ user, onLogout }: { user: User | null; onLogout: () => Promise<void> }) {
  const [open, setOpen] = useState(false);
  if (!user) return null;
  const initial = user.firstName?.[0] ?? user.email[0];
  return (
    <div className="p-3 border-t border-brand-border relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2.5 w-full p-2 rounded-xl hover:bg-brand-sage-soft/60 transition-colors ${focusRing}`}
      >
        <div className="w-9 h-9 rounded-full bg-brand-sage text-white font-sans-brand font-bold flex items-center justify-center text-sm">
          {initial.toUpperCase()}
        </div>
        <div className="flex-1 text-left min-w-0">
          <p className="font-sans-brand font-semibold text-sm text-brand-text truncate">
            {user.firstName ?? user.email}
          </p>
          <p className="font-sans-brand text-xs text-brand-text-muted truncate">{user.email}</p>
        </div>
      </button>
      {open && (
        <div className="absolute bottom-full left-3 right-3 mb-2 bg-brand-surface border border-brand-border rounded-xl shadow-lg overflow-hidden">
          <button
            type="button"
            onClick={onLogout}
            className={`w-full px-4 py-3 text-left font-sans-brand font-semibold text-sm text-brand-text hover:bg-brand-sage-soft/60 ${focusRing}`}
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    if (path === '/budget')
      return location.pathname === '/budget' || location.pathname === '/spending-plan';
    return location.pathname.startsWith(path);
  };

  return (
    <div className="min-h-screen bg-brand-cream font-sans-brand">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 bg-brand-cream border-r border-brand-border">
        <div className="h-16 flex items-center px-5 border-b border-brand-border">
          <CactusLogo />
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavItem key={item.path} item={item} active={isActive(item.path)} />
          ))}
        </nav>
        <UserSection user={user} onLogout={logout} />
      </aside>

      {/* Mobile header */}
      <header className="md:hidden fixed top-0 inset-x-0 h-14 bg-brand-cream border-b border-brand-border flex items-center justify-between px-4 z-40">
        <CactusLogo />
        <button
          type="button"
          aria-label={mobileNavOpen ? 'close menu' : 'open menu'}
          onClick={() => setMobileNavOpen((v) => !v)}
          className={`p-2 rounded-md text-brand-text ${focusRing}`}
        >
          {mobileNavOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </header>

      {/* Mobile drawer */}
      {mobileNavOpen && (
        <div
          role="dialog"
          aria-label="menu"
          aria-modal="true"
          className="md:hidden fixed inset-0 top-14 z-30 bg-brand-cream animate-slide-in flex flex-col"
        >
          <nav className="flex-1 px-4 py-4 space-y-1">
            {navItems.map((item) => (
              <NavItem
                key={item.path}
                item={item}
                active={isActive(item.path)}
                onClick={() => setMobileNavOpen(false)}
              />
            ))}
          </nav>
          <UserSection user={user} onLogout={logout} />
        </div>
      )}

      {/* Mobile bottom tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 h-16 bg-brand-cream border-t border-brand-border flex items-center justify-around z-40">
        {navItems.map((item) => (
          <NavItem key={item.path} item={item} active={isActive(item.path)} variant="tab" />
        ))}
      </nav>

      {/* Main content */}
      <main className="md:pl-64 pt-14 md:pt-0 pb-16 md:pb-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
