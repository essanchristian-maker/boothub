import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import PostCard from '../components/PostCard';

const SKILL_SUGGESTIONS = ['Python', 'Machine Learning', 'Deep Learning', 'TensorFlow', 'PyTorch', 'Scikit-learn', 'Pandas', 'NumPy', 'SQL', 'NLP', 'Computer Vision', 'Data Science', 'Git', 'Docker', 'FastAPI', 'React'];

function Avatar({ name, color, size = 'xl' }) {
  const sizes = { md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-xl', xl: 'w-20 h-20 text-2xl' };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

function EditModal({ profile, onSave, onClose }) {
  const [form, setForm] = useState({ name: profile.name, bio: profile.bio || '', skills: profile.skills || [] });
  const [skillInput, setSkillInput] = useState('');
  const [saving, setSaving] = useState(false);

  const addSkill = (s) => {
    const trimmed = s.trim();
    if (trimmed && !form.skills.includes(trimmed)) {
      setForm(f => ({ ...f, skills: [...f.skills, trimmed] }));
    }
    setSkillInput('');
  };

  const removeSkill = (s) => setForm(f => ({ ...f, skills: f.skills.filter(x => x !== s) }));

  const handleSave = async () => {
    if (!form.name.trim()) return;
    setSaving(true);
    try { await onSave(form); onClose(); }
    finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-lg p-6 animate-fade-in">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-semibold text-white">Modifier le profil</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Nom</label>
            <input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Bio</label>
            <textarea
              value={form.bio}
              onChange={e => setForm(f => ({ ...f, bio: e.target.value }))}
              rows={3}
              placeholder="Décris-toi en quelques mots..."
              className="w-full bg-slate-900 border border-slate-600 rounded-lg px-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">Compétences</label>
            <div className="flex flex-wrap gap-2 mb-2">
              {form.skills.map(s => (
                <span key={s} className="flex items-center gap-1 bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2.5 py-0.5 rounded-full text-sm">
                  {s}
                  <button onClick={() => removeSkill(s)} className="hover:text-white ml-0.5">×</button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={skillInput}
                onChange={e => setSkillInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput); } }}
                placeholder="Ajouter une compétence..."
                className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
              />
              <button onClick={() => addSkill(skillInput)} className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-lg transition-colors">
                +
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {SKILL_SUGGESTIONS.filter(s => !form.skills.includes(s)).slice(0, 8).map(s => (
                <button key={s} onClick={() => addSkill(s)}
                  className="text-xs text-slate-400 bg-slate-700 hover:bg-slate-600 px-2 py-0.5 rounded-md transition-colors">
                  + {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors">
            Annuler
          </button>
          <button onClick={handleSave} disabled={saving}
            className="flex-1 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white rounded-lg text-sm font-semibold transition-colors disabled:opacity-50">
            {saving ? 'Sauvegarde...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Profile() {
  const { id } = useParams();
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [editing, setEditing]   = useState(false);

  const isOwn = user?.id === parseInt(id);

  useEffect(() => {
    setLoading(true);
    api.get(`/users/${id}`)
      .then(({ data }) => setProfile(data))
      .catch(() => navigate('/'))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePostDeleted = (pid) => setProfile(p => ({ ...p, posts: p.posts.filter(x => x.id !== pid) }));
  const handleLikeToggled = (pid, liked) => {
    setProfile(p => ({
      ...p,
      posts: p.posts.map(x => x.id === pid
        ? { ...x, liked_by_me: liked ? 1 : 0, likes_count: x.likes_count + (liked ? 1 : -1) }
        : x
      )
    }));
  };

  const handleSave = async (form) => {
    const { data } = await api.put(`/users/${id}`, form);
    setProfile(p => ({ ...p, ...data }));
    if (isOwn) updateUser(data);
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-[60vh]">
      <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      {editing && <EditModal profile={profile} onSave={handleSave} onClose={() => setEditing(false)} />}

      {/* Header */}
      <div className="bg-slate-800/60 border border-slate-700/50 rounded-2xl p-6 mb-6">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold text-white flex-shrink-0"
              style={{ backgroundColor: profile.avatar_color }}>
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
              <p className="text-slate-400 text-sm">{profile.email}</p>
              {profile.bio && <p className="text-slate-300 text-sm mt-2 max-w-md">{profile.bio}</p>}
            </div>
          </div>
          {isOwn && (
            <button
              onClick={() => setEditing(true)}
              className="flex-shrink-0 flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm font-medium rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modifier
            </button>
          )}
        </div>

        {profile.skills && profile.skills.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-700/50">
            {profile.skills.map(skill => (
              <span key={skill} className="text-xs bg-violet-600/20 text-violet-300 border border-violet-500/30 px-2.5 py-1 rounded-full">
                {skill}
              </span>
            ))}
          </div>
        )}

        <div className="flex gap-6 mt-4 pt-4 border-t border-slate-700/50">
          <div className="text-center">
            <div className="text-xl font-bold text-white">{profile.posts?.length || 0}</div>
            <div className="text-xs text-slate-400">Posts</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {(profile.posts || []).reduce((a, p) => a + p.likes_count, 0)}
            </div>
            <div className="text-xs text-slate-400">Likes reçus</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold text-white">
              {new Date(profile.created_at).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })}
            </div>
            <div className="text-xs text-slate-400">Membre depuis</div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <h2 className="text-lg font-semibold text-white mb-4">
        {isOwn ? 'Mes posts' : `Posts de ${profile.name}`}
      </h2>
      {!profile.posts || profile.posts.length === 0 ? (
        <div className="text-center py-12 text-slate-500">
          <div className="text-3xl mb-2">📝</div>
          <p>{isOwn ? "Tu n'as pas encore posté." : "Aucun post pour l'instant."}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {profile.posts.map(post => (
            <PostCard key={post.id} post={post} onDelete={handlePostDeleted} onLike={handleLikeToggled} />
          ))}
        </div>
      )}
    </div>
  );
}
