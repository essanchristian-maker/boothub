import React, { useState, useRef, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, unreadCount, notifications, fetchNotifications, markNotificationsRead } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showNotifs, setShowNotifs]   = useState(false);
  const [showMenu,   setShowMenu]     = useState(false);
  const notifsRef = useRef(null);
  const menuRef   = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (notifsRef.current && !notifsRef.current.contains(e.target)) setShowNotifs(false);
      if (menuRef.current   && !menuRef.current.contains(e.target))   setShowMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleNotifClick = async () => {
    if (!showNotifs) {
      await fetchNotifications();
      if (unreadCount > 0) await markNotificationsRead();
    }
    setShowNotifs(v => !v);
    setShowMenu(false);
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  const isActive = (path) => location.pathname === path;

  const notifLabel = (n) => {
    if (n.type === 'like')    return `${n.from_name} a aimé ton post`;
    if (n.type === 'comment') return `${n.from_name} a commenté ton post`;
    if (n.type === 'reply')   return `${n.from_name} a répondu à ton commentaire`;
    return n.type;
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60)   return "à l'instant";
    if (s < 3600) return `${Math.floor(s / 60)}min`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}j`;
  };

  return (
    <nav className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-700/50">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2 flex-shrink-0">
          <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <span className="font-bold text-white text-lg hidden sm:block">BootHub</span>
        </Link>

        {/* Nav links */}
        <div className="flex items-center gap-1">
          <Link to="/"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            <span className="hidden sm:inline">Fil</span>
          </Link>
          <Link to="/members"
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              isActive('/members') ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white hover:bg-slate-800'
            }`}
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="hidden sm:inline">Membres</span>
          </Link>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">

          {/* Notifications */}
          <div className="relative" ref={notifsRef}>
            <button onClick={handleNotifClick}
              className="relative p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-4 h-4 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifs && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                <div className="px-4 py-3 border-b border-slate-700">
                  <span className="font-semibold text-white text-sm">Notifications</span>
                </div>
                {notifications.length === 0 ? (
                  <div className="px-4 py-6 text-center text-slate-400 text-sm">Aucune notification</div>
                ) : (
                  <div className="max-h-72 overflow-y-auto">
                    {notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 flex items-start gap-3 border-b border-slate-700/50 last:border-0 ${!n.read ? 'bg-violet-500/5' : ''}`}>
                        <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                          style={{ backgroundColor: n.avatar_color }}>
                          {n.from_name.charAt(0).toUpperCase()}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-slate-200">{notifLabel(n)}</p>
                          <p className="text-xs text-slate-500 mt-0.5">{timeAgo(n.created_at)}</p>
                        </div>
                        {!n.read && <div className="w-2 h-2 bg-violet-500 rounded-full mt-1.5 flex-shrink-0" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button onClick={() => { setShowMenu(v => !v); setShowNotifs(false); }}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: user.avatar_color }}>
                {user.name.charAt(0).toUpperCase()}
              </div>
            </button>

            {showMenu && (
              <div className="absolute right-0 top-full mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in">
                <Link to={`/profile/${user.id}`}
                  onClick={() => setShowMenu(false)}
                  className="flex items-center gap-2.5 px-4 py-3 text-sm text-slate-200 hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  Mon profil
                </Link>
                <div className="border-t border-slate-700" />
                <button onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-4 py-3 text-sm text-red-400 hover:bg-slate-700 transition-colors">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Déconnexion
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
