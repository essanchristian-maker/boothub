import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments] = useState([]);
  const [text, setText]         = useState('');
  const [loading, setLoading]   = useState(true);
  const [sending, setSending]   = useState(false);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`)
      .then(({ data }) => setComments(data))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, { content: text.trim() });
      setComments(prev => [...prev, data]);
      setText('');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="border-t border-slate-700/50 px-4 pt-3 pb-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-3 mb-3">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-2">Sois le premier à commenter</p>
          )}
          {comments.map(c => (
            <div key={c.id} className="flex gap-2.5">
              <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                style={{ backgroundColor: c.avatar_color }}>
                {c.user_name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 bg-slate-700/50 rounded-xl px-3 py-2">
                <div className="flex items-baseline gap-2">
                  <span className="text-xs font-semibold text-slate-200">{c.user_name}</span>
                  <span className="text-[10px] text-slate-500">{timeAgo(c.created_at)}</span>
                </div>
                <p className="text-sm text-slate-300 mt-0.5">{c.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleSend} className="flex gap-2 mt-2">
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
          style={{ backgroundColor: user.avatar_color }}>
          {user.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 flex gap-2">
          <input
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Écrire un commentaire..."
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent"
          />
          <button type="submit" disabled={!text.trim() || sending}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl text-sm transition-colors">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
