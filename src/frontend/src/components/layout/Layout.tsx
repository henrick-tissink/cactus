import { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ArrowRightLeft,
  PiggyBank,
  Target,
  TrendingUp,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
} from 'lucide-react';
import { useAuthStore } from '../../store/authStore';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { path: '/budget', label: 'Budget', icon: PiggyBank },
  { path: '/goals', label: 'Goals', icon: Target },
  { path: '/insights', label: 'Insights', icon: TrendingUp },
];

function CactusLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 64" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
      <rect width="64" height="64" rx="16" fill="#1B7A4A" />
      <path d="M32 12C32 12 28 20 28 32C28 44 32 52 32 52C32 52 36 44 36 32C36 20 32 12 32 12Z" fill="#E8F5EE" />
      <path d="M22 24C22 24 26 26 28 32" stroke="#E8F5EE" strokeWidth="3" strokeLinecap="round" />
      <path d="M42 24C42 24 38 26 36 32" stroke="#E8F5EE" strokeWidth="3" strokeLinecap="round" />
      <path d="M20 36C20 36 25 34 28 36" stroke="#E8F5EE" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M44 36C44 36 39 34 36 36" stroke="#E8F5EE" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function Layout() {
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
  };

  const initials = user?.firstName?.[0]?.toUpperCase() || user?.email[0]?.toUpperCase() || '?';

  return (
    <div className="min-h-screen flex" style={{ backgroundColor: 'var(--surface)' }}>
      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 h-14 flex items-center justify-between px-4 border-b border-gray-200 bg-white">
        <button onClick={() => setMobileNavOpen(true)} className="p-2 -ml-2 text-gray-600">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <CactusLogo className="w-7 h-7" />
          <span className="font-bold text-[var(--cactus-green)]">Cactus</span>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </header>

      {/* Mobile overlay */}
      {mobileNavOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMobileNavOpen(false)} />
          <aside className="sidebar absolute left-0 top-0 bottom-0 w-64 flex flex-col animate-slide-in">
            <div className="h-16 flex items-center justify-between px-5">
              <div className="flex items-center gap-3">
                <CactusLogo className="w-8 h-8" />
                <span className="text-lg font-bold text-white">Cactus</span>
              </div>
              <button onClick={() => setMobileNavOpen(false)} className="p-1 text-white/60 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <NavList location={location} onNavigate={() => setMobileNavOpen(false)} />
            <UserSection
              user={user}
              initials={initials}
              showUserMenu={showUserMenu}
              setShowUserMenu={setShowUserMenu}
              onLogout={handleLogout}
            />
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="sidebar hidden lg:flex w-64 flex-col fixed inset-y-0 left-0 z-30">
        {/* Logo */}
        <div className="h-16 flex items-center gap-3 px-5 border-b border-white/10">
          <CactusLogo className="w-8 h-8" />
          <span className="text-lg font-bold text-white tracking-tight">Cactus</span>
        </div>

        <NavList location={location} />

        <UserSection
          user={user}
          initials={initials}
          showUserMenu={showUserMenu}
          setShowUserMenu={setShowUserMenu}
          onLogout={handleLogout}
        />
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 overflow-auto">
        <div className="pt-14 lg:pt-0">
          <div className="animate-fade-in">
            <Outlet />
          </div>
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 flex">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = location.pathname === path;
          return (
            <Link
              key={path}
              to={path}
              className={`flex-1 flex flex-col items-center gap-0.5 py-2 text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-[var(--cactus-green)]'
                  : 'text-gray-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

function NavList({ location, onNavigate }: { location: { pathname: string }; onNavigate?: () => void }) {
  return (
    <nav className="flex-1 px-3 py-4 space-y-1">
      {navItems.map(({ path, label, icon: Icon }) => {
        const isActive = location.pathname === path ||
          (path === '/budget' && location.pathname === '/spending-plan');
        return (
          <Link
            key={path}
            to={path}
            onClick={onNavigate}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              isActive
                ? 'sidebar-nav-item-active'
                : 'sidebar-nav-item'
            }`}
          >
            <Icon className="w-[18px] h-[18px]" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}

function UserSection({
  user,
  initials,
  showUserMenu,
  setShowUserMenu,
  onLogout,
}: {
  user: { firstName?: string; email: string } | null;
  initials: string;
  showUserMenu: boolean;
  setShowUserMenu: (v: boolean) => void;
  onLogout: () => void;
}) {
  return (
    <div className="p-3 border-t border-white/10 relative">
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg sidebar-nav-item"
      >
        <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-semibold text-white">
          {initials}
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className="text-sm font-medium text-white/90 truncate">
            {user?.firstName || 'User'}
          </p>
          <p className="text-xs text-white/50 truncate">{user?.email}</p>
        </div>
        <ChevronDown className={`w-4 h-4 text-white/40 transition-transform ${showUserMenu ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {showUserMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setShowUserMenu(false)} />
          <div className="absolute bottom-full left-3 right-3 mb-2 z-50 bg-white rounded-lg shadow-lg border border-gray-200 py-1 animate-fade-in">
            <Link
              to="/settings"
              onClick={() => setShowUserMenu(false)}
              className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
            <button
              onClick={() => { setShowUserMenu(false); onLogout(); }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
            >
              <LogOut className="w-4 h-4" />
              Log out
            </button>
          </div>
        </>
      )}
    </div>
  );
}
