import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Home, Compass, MessageCircle, User, Settings, ShieldCheck, LogOut } from 'lucide-react';
import { useAuth } from '@client/src/contexts/AuthContext';

const BottomNav = () => {
  const navItems = [
    { to: '/', icon: Home, label: '首页', end: true },
    { to: '/discover', icon: Compass, label: '发现' },
    { to: '/messages', icon: MessageCircle, label: '消息' },
    { to: '/profile', icon: User, label: '我的' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t bg-white/90 backdrop-blur-lg md:hidden">
      <div className="flex items-center justify-around h-16 px-4">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 w-14 transition-colors ${
                isActive
                  ? 'text-[hsl(var(--primary))]'
                  : 'text-[hsl(var(--muted-foreground))]'
              }`
            }
          >
            <item.icon size={22} strokeWidth={2} />
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </div>
      <div className="h-safe-area-inset-bottom" />
    </nav>
  );
};

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const navItems = [
    { to: '/', icon: Home, label: '首页', end: true },
    { to: '/discover', icon: Compass, label: '发现' },
    { to: '/messages', icon: MessageCircle, label: '消息' },
    { to: '/profile', icon: User, label: '我的' },
  ];

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r bg-white h-screen sticky top-0 z-30">
      <div className="p-6 border-b">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-[hsl(var(--primary))] to-[hsl(var(--accent))] bg-clip-text text-transparent">
          机电校园
        </h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">
          分享校园生活的每个瞬间
        </p>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const isActive = item.end
            ? location.pathname === item.to
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-[hsl(var(--primary))] text-white shadow-lg shadow-[hsl(var(--primary))/20%]'
                  : 'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] hover:text-[hsl(var(--foreground))]'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </NavLink>
          );
        })}

        {user?.isAdmin && (
          <NavLink
            to="/admin"
            className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all mt-4 ${
              location.pathname.startsWith('/admin')
                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg'
                : 'text-amber-600 hover:bg-amber-50 border border-amber-200'
            }`}
          >
            <ShieldCheck size={20} />
            管理后台
          </NavLink>
        )}
      </nav>

      {user && (
        <div className="p-4 border-t">
          <div className="flex items-center gap-3 mb-3 px-2">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[hsl(var(--primary))] to-[hsl(var(--accent))] flex items-center justify-center text-white font-semibold">
              {user.nickname.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user.nickname}</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] truncate">
                {user.phone}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] rounded-xl transition-colors"
          >
            <LogOut size={18} />
            退出登录
          </button>
        </div>
      )}
    </aside>
  );
};

export default function Layout() {
  return (
    <div className="min-h-screen app-gradient-bg">
      <div className="flex max-w-6xl mx-auto">
        <Sidebar />
        <main className="flex-1 min-h-screen pb-20 md:pb-0">
          <Outlet />
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
