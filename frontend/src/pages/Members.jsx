import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';

function Avatar({ name, color, size = 'md' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-12 h-12 text-sm', lg: 'w-16 h-16 text-lg' };
  return (
    <div className={`${sizes[size]} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}

export default function Members() {
  const [members, setMembers] = useState([]);
  const [search, setSearch]   = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/users').then(({ data }) => { setMembers(data); setLoading(false); });
  }, []);

  const filtered = members.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase()) ||
    (m.skills || []).some(s => s.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">Membres du bootcamp</h1>
          <p className="text-slate-400 text-sm mt-0.5">{members.length} apprenants inscrits</p>
        </div>
      </div>

      <div className="relative mb-6">
        <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Rechercher par nom, email ou compétence..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-2.5 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition"
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-500">
          <p className="text-lg">Aucun membre trouvé</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(member => (
            <Link
              key={member.id}
              to={`/profile/${member.id}`}
              className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 hover:border-violet-500/50 hover:bg-slate-800 transition-all group"
            >
              <div className="flex items-start gap-3 mb-3">
                <Avatar name={member.name} color={member.avatar_color} size="md" />
                <div className="min-w-0">
                  <div className="font-semibold text-white group-hover:text-violet-300 transition-colors truncate">
                    {member.name}
                  </div>
                  <div className="text-xs text-slate-400 truncate">{member.email}</div>
                </div>
              </div>

              {member.bio && (
                <p className="text-sm text-slate-400 mb-3 line-clamp-2">{member.bio}</p>
              )}

              {member.skills && member.skills.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {member.skills.slice(0, 4).map(skill => (
                    <span key={skill} className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded-md">
                      {skill}
                    </span>
                  ))}
                  {member.skills.length > 4 && (
                    <span className="text-xs text-slate-500">+{member.skills.length - 4}</span>
                  )}
                </div>
              )}

              <div className="flex items-center gap-1 text-xs text-slate-500 pt-2 border-t border-slate-700/50">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                {member.posts_count || 0} post{member.posts_count !== 1 ? 's' : ''}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
