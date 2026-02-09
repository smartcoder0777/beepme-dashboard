import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard' },
  { to: '/alerts', label: 'Alerts' },
  { to: '/users', label: 'Users' },
  { to: '/kyc-pending', label: 'KYC Pending' },
  { to: '/settings', label: 'Settings' },
];

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      <aside className="w-56 bg-gray-900 text-white flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <span className="font-semibold">BeepMe Admin</span>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {nav.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm ${isActive ? 'bg-primary text-white' : 'text-gray-300 hover:bg-gray-800'}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-700">
          <p className="text-xs text-gray-400 truncate px-2">{user?.email}</p>
          <button
            onClick={handleLogout}
            className="mt-2 w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded-lg"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
