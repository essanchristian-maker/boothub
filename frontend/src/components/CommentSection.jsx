import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

function CommentItem({ comment, isReply, onReply }) {
  return (
    <div className={`flex gap-2.5 ${isReply ? 'ml-9 mt-2' : 'mt-3'}`}>
      {isReply && (
        <div className="absolute -left-5 top-3 w-4 h-px bg-slate-600" />
      )}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mt-0.5"
        style={{ backgroundColor: comment.avatar_color }}
      >
        {comment.user_name.charAt(0).toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="bg-slate-700/50 rounded-xl rounded-tl-sm px-3 py-2 inline-block max-w-full">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="text-xs font-semibold text-slate-200">{comment.user_name}</span>
            <span className="text-[10px] text-slate-500">{timeAgo(comment.created_at)}</span>
          </div>
          {comment.parent_user_name && (
            <span className="text-violet-400 text-xs font-medium mr-1">
              @{comment.parent_user_name}
            </span>
          )}
          <p className="text-sm text-slate-200 mt-0.5 break-words leading-relaxed">
            {comment.content}
          </p>
        </div>

        <button
          onClick={() => onReply(comment)}
          className="text-xs text-slate-500 hover:text-violet-400 mt-1 ml-1 transition-colors"
        >
          Répondre
        </button>
      </div>
    </div>
  );
}

export default function CommentSection({ postId }) {
  const { user } = useAuth();
  const [comments, setComments]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [text, setText]           = useState('');
  const [sending, setSending]     = useState(false);
  const [replyTo, setReplyTo]     = useState(null); // { id, user_name }
  const inputRef = useRef(null);

  useEffect(() => {
    api.get(`/posts/${postId}/comments`)
      .then(({ data }) => setComments(data))
      .finally(() => setLoading(false));
  }, [postId]);

  const handleReply = (comment) => {
    setReplyTo({ id: comment.id, user_name: comment.user_name });
    setText('');
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const cancelReply = () => {
    setReplyTo(null);
    setText('');
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const { data } = await api.post(`/posts/${postId}/comments`, {
        content: text.trim(),
        parent_id: replyTo?.id || null,
      });
      setComments(prev => [...prev, data]);
      setText('');
      setReplyTo(null);
    } finally {
      setSending(false);
    }
  };

  // Sépare commentaires racines et réponses
  const roots   = comments.filter(c => !c.parent_id);
  const replies = comments.filter(c => c.parent_id);

  return (
    <div className="border-t border-slate-700/50 px-4 pt-3 pb-4">
      {loading ? (
        <div className="flex justify-center py-4">
          <div className="w-5 h-5 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-0.5">
          {comments.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-3">
              Aucun commentaire — sois le premier !
            </p>
          )}

          {roots.map(root => (
            <div key={root.id} className="relative">
              <CommentItem comment={root} isReply={false} onReply={handleReply} />

              {/* Ligne verticale si le commentaire a des réponses */}
              {replies.some(r => r.parent_id === root.id) && (
                <div className="absolute left-3.5 top-9 bottom-2 w-px bg-slate-700" />
              )}

              {/* Réponses indentées */}
              {replies
                .filter(r => r.parent_id === root.id)
                .map(reply => (
                  <div key={reply.id} className="relative">
                    <CommentItem comment={reply} isReply={true} onReply={handleReply} />
                  </div>
                ))
              }
            </div>
          ))}
        </div>
      )}

      {/* Zone de saisie */}
      <form onSubmit={handleSend} className="mt-3">
        {/* Badge "En réponse à" */}
        {replyTo && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs text-violet-400 font-medium">
              ↩ Réponse à @{replyTo.user_name}
            </span>
            <button
              type="button"
              onClick={cancelReply}
              className="text-slate-500 hover:text-slate-300 text-xs transition-colors"
            >
              ✕ Annuler
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user.avatar_color }}
          >
            {user.name.charAt(0).toUpperCase()}
          </div>
          <input
            ref={inputRef}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Escape') cancelReply();
            }}
            placeholder={replyTo ? `Répondre à @${replyTo.user_name}...` : 'Écrire un commentaire...'}
            className="flex-1 bg-slate-700/50 border border-slate-600 rounded-xl px-3 py-1.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent transition"
          />
          <button
            type="submit"
            disabled={!text.trim() || sending}
            className="p-2 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
