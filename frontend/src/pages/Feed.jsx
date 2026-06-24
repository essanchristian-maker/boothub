import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import PostCard from '../components/PostCard';
import CreatePost from '../components/CreatePost';

const TAGS = ['Python', 'Machine Learning', 'Deep Learning', 'Data Science', 'SQL', 'NLP', 'Computer Vision', 'Projet', 'Ressource', 'Question'];

export default function Feed() {
  const { user, socket } = useAuth();
  const [posts, setPosts]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [activeTag, setActiveTag] = useState('');

  const fetchPosts = useCallback(async () => {
    try {
      const { data } = await api.get('/posts', { params: activeTag ? { tag: activeTag } : {} });
      setPosts(data);
    } finally {
      setLoading(false);
    }
  }, [activeTag]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  useEffect(() => {
    if (!socket) return;
    const onNew    = (post) => setPosts(prev => [post, ...prev]);
    const onDelete = ({ id }) => setPosts(prev => prev.filter(p => p.id !== id));
    socket.on('new_post', onNew);
    socket.on('delete_post', onDelete);
    return () => { socket.off('new_post', onNew); socket.off('delete_post', onDelete); };
  }, [socket]);

  const handlePostCreated = (post) => setPosts(prev => [post, ...prev]);
  const handlePostDeleted = (id) => setPosts(prev => prev.filter(p => p.id !== id));
  const handleLikeToggled = (id, liked) => {
    setPosts(prev => prev.map(p =>
      p.id === id ? { ...p, liked_by_me: liked ? 1 : 0, likes_count: p.likes_count + (liked ? 1 : -1) } : p
    ));
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 grid grid-cols-1 lg:grid-cols-4 gap-6">

      {/* Sidebar gauche */}
      <aside className="hidden lg:block lg:col-span-1 space-y-4">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: user.avatar_color }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="text-sm font-semibold text-white">{user.name}</div>
              <div className="text-xs text-slate-400">{user.email}</div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Filtrer par tag</h3>
          <div className="flex flex-col gap-1.5">
            <button
              onClick={() => setActiveTag('')}
              className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                activeTag === '' ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'
              }`}
            >
              Tous les posts
            </button>
            {TAGS.map(tag => (
              <button
                key={tag}
                onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
                className={`text-left px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  activeTag === tag ? 'bg-violet-600 text-white' : 'text-slate-300 hover:bg-slate-700'
                }`}
              >
                #{tag}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Fil principal */}
      <main className="lg:col-span-2 space-y-4">
        <CreatePost onCreated={handlePostCreated} />

        {/* Tags mobile */}
        <div className="lg:hidden flex gap-2 overflow-x-auto pb-1 no-scrollbar">
          <button
            onClick={() => setActiveTag('')}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              activeTag === '' ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}
          >
            Tous
          </button>
          {TAGS.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag === activeTag ? '' : tag)}
              className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                activeTag === tag ? 'bg-violet-600 text-white' : 'bg-slate-800 text-slate-300 border border-slate-700'
              }`}
            >
              #{tag}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <div className="text-4xl mb-3">📭</div>
            <p className="font-medium">Aucun post pour l'instant</p>
            <p className="text-sm mt-1">Sois le premier à partager quelque chose !</p>
          </div>
        ) : (
          <div className="space-y-4">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onDelete={handlePostDeleted}
                onLike={handleLikeToggled}
              />
            ))}
          </div>
        )}
      </main>

      {/* Sidebar droite */}
      <aside className="hidden lg:block lg:col-span-1">
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-4 sticky top-20">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Stats du bootcamp</h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Posts aujourd'hui</span>
              <span className="text-sm font-semibold text-violet-400">
                {posts.filter(p => new Date(p.created_at).toDateString() === new Date().toDateString()).length}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-300">Total posts</span>
              <span className="text-sm font-semibold text-violet-400">{posts.length}</span>
            </div>
          </div>
        </div>
      </aside>

    </div>
  );
}
