import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import CommentSection from './CommentSection';
import FileAttachment from './FileAttachment';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
}

const TAG_COLORS = {
  'Python':           'bg-blue-500/15 text-blue-400 border-blue-500/30',
  'Machine Learning': 'bg-purple-500/15 text-purple-400 border-purple-500/30',
  'Deep Learning':    'bg-violet-500/15 text-violet-400 border-violet-500/30',
  'Data Science':     'bg-teal-500/15 text-teal-400 border-teal-500/30',
  'NLP':              'bg-pink-500/15 text-pink-400 border-pink-500/30',
  'SQL':              'bg-orange-500/15 text-orange-400 border-orange-500/30',
  'Question':         'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
  'Ressource':        'bg-green-500/15 text-green-400 border-green-500/30',
  'Projet':           'bg-red-500/15 text-red-400 border-red-500/30',
};
const DEFAULT_TAG = 'bg-slate-600/40 text-slate-400 border-slate-500/30';

export default function PostCard({ post, onDelete, onLike }) {
  const { user } = useAuth();
  const [showComments, setShowComments] = useState(false);
  const [liking, setLiking] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleLike = async () => {
    if (liking) return;
    setLiking(true);
    try {
      const { data } = await api.post(`/posts/${post.id}/like`);
      onLike(post.id, data.liked);
    } finally {
      setLiking(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Supprimer ce post ?')) return;
    setDeleting(true);
    try {
      await api.delete(`/posts/${post.id}`);
      onDelete(post.id);
    } catch {
      setDeleting(false);
    }
  };

  return (
    <article className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden animate-fade-in hover:border-slate-600/70 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-4 pb-3">
        <div className="flex items-center gap-3">
          <Link to={`/profile/${post.user_id}`}>
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 hover:opacity-80 transition-opacity"
              style={{ backgroundColor: post.avatar_color }}>
              {post.user_name.charAt(0).toUpperCase()}
            </div>
          </Link>
          <div>
            <Link to={`/profile/${post.user_id}`}
              className="text-sm font-semibold text-white hover:text-violet-300 transition-colors">
              {post.user_name}
            </Link>
            <div className="text-xs text-slate-500">{timeAgo(post.created_at)}</div>
          </div>
        </div>

        {post.user_id === user.id && (
          <button onClick={handleDelete} disabled={deleting}
            className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors flex-shrink-0">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="px-4 pb-3">
        {post.type === 'code' ? (
          <div className="rounded-xl overflow-hidden border border-slate-700">
            <div className="flex items-center justify-between bg-slate-900 px-4 py-2 border-b border-slate-700">
              <span className="text-xs text-slate-400 font-mono">{post.code_language || 'code'}</span>
              <div className="flex gap-1.5">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
              </div>
            </div>
            <pre className="bg-slate-900/80 p-4 text-sm text-slate-300 overflow-x-auto font-mono leading-relaxed whitespace-pre-wrap">
              {post.content}
            </pre>
          </div>
        ) : post.type === 'resource' ? (
          <div>
            <p className="text-slate-200 text-sm leading-relaxed mb-2">{post.content}</p>
            {post.resource_url && (
              <a href={post.resource_url} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-violet-400 hover:text-violet-300 bg-violet-500/10 border border-violet-500/20 rounded-lg px-3 py-2 transition-colors mt-1">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="truncate max-w-xs">{post.resource_url}</span>
              </a>
            )}
          </div>
        ) : (
          <p className="text-slate-200 text-sm leading-relaxed whitespace-pre-wrap">{post.content}</p>
        )}

        {/* Fichier joint */}
        {post.file_url && (
          <div className="mt-3">
            <FileAttachment url={post.file_url} type={post.file_type} name={post.file_name} />
          </div>
        )}

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {post.tags.map(tag => (
              <span key={tag} className={`text-xs px-2 py-0.5 rounded-full border ${TAG_COLORS[tag] || DEFAULT_TAG}`}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer actions */}
      <div className="flex items-center gap-1 px-3 pb-3 border-t border-slate-700/50 pt-3">
        <button
          onClick={handleLike}
          disabled={liking}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            post.liked_by_me
              ? 'text-pink-400 bg-pink-400/10 hover:bg-pink-400/20'
              : 'text-slate-400 hover:text-pink-400 hover:bg-pink-400/10'
          }`}
        >
          <svg className={`w-4 h-4 transition-transform ${liking ? 'scale-110' : ''}`} fill={post.liked_by_me ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
          <span className="font-medium">{post.likes_count}</span>
        </button>

        <button
          onClick={() => setShowComments(v => !v)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm transition-colors ${
            showComments ? 'text-violet-400 bg-violet-400/10' : 'text-slate-400 hover:text-violet-400 hover:bg-violet-400/10'
          }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          <span className="font-medium">{post.comments_count}</span>
        </button>
      </div>

      {showComments && <CommentSection postId={post.id} />}
    </article>
  );
}
