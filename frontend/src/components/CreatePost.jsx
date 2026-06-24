import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import FileUpload from './FileUpload';
import FileAttachment from './FileAttachment';

const TAGS = ['Python', 'Machine Learning', 'Deep Learning', 'Data Science', 'SQL', 'NLP', 'Computer Vision', 'Projet', 'Ressource', 'Question'];
const LANGS = ['python', 'javascript', 'sql', 'bash', 'json', 'yaml', 'markdown', 'autre'];

const TYPES = [
  { id: 'text',     label: 'Texte',     icon: '💬' },
  { id: 'code',     label: 'Code',      icon: '👨‍💻' },
  { id: 'resource', label: 'Ressource', icon: '🔗' },
];

export default function CreatePost({ onCreated }) {
  const { user } = useAuth();
  const [expanded, setExpanded]   = useState(false);
  const [type, setType]           = useState('text');
  const [content, setContent]     = useState('');
  const [lang, setLang]           = useState('python');
  const [url, setUrl]             = useState('');
  const [tags, setTags]           = useState([]);
  const [fileData, setFileData]   = useState(null);
  const [showFile, setShowFile]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  const toggleTag = (t) => setTags(prev => prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim() && !fileData) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await api.post('/posts', {
        content: content.trim() || (fileData ? fileData.name : ''),
        type,
        code_language: type === 'code' ? lang : '',
        resource_url: type === 'resource' ? url : '',
        tags,
        file_url:  fileData?.url  || '',
        file_type: fileData?.type || '',
        file_name: fileData?.name || '',
      });
      onCreated(data);
      setContent('');
      setUrl('');
      setTags([]);
      setType('text');
      setFileData(null);
      setShowFile(false);
      setExpanded(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la publication');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
      {!expanded ? (
        <button
          onClick={() => setExpanded(true)}
          className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-800/80 transition-colors"
        >
          <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
            style={{ backgroundColor: user.avatar_color }}>
            {user.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-slate-400 text-sm">Partage quelque chose avec le bootcamp...</span>
        </button>
      ) : (
        <form onSubmit={handleSubmit} className="p-4 space-y-3 animate-fade-in">
          {/* Author + type selector */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
              style={{ backgroundColor: user.avatar_color }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex gap-1">
              {TYPES.map(t => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setType(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    type === t.id ? 'bg-violet-600 text-white' : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {t.icon} {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Code language */}
          {type === 'code' && (
            <select
              value={lang}
              onChange={e => setLang(e.target.value)}
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500"
            >
              {LANGS.map(l => <option key={l} value={l}>{l}</option>)}
            </select>
          )}

          {/* Content */}
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={type === 'code' ? 6 : 3}
            placeholder={
              type === 'code'     ? '# Colle ton code ici...' :
              type === 'resource' ? 'Décris la ressource...' :
              'Quoi de neuf ? Partage une idée, une question, une découverte...'
            }
            className={`w-full bg-slate-900/60 border border-slate-600 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent resize-none ${
              type === 'code' ? 'font-mono text-green-300' : ''
            }`}
            autoFocus
          />

          {/* URL for resource */}
          {type === 'resource' && (
            <input
              type="url"
              value={url}
              onChange={e => setUrl(e.target.value)}
              placeholder="https://..."
              className="w-full bg-slate-900/60 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent"
            />
          )}

          {/* Fichier joint */}
          <div>
            <button type="button" onClick={() => setShowFile(v => !v)}
              className={`flex items-center gap-2 text-xs px-3 py-1.5 rounded-lg border transition-colors mb-2 ${
                showFile || fileData ? 'bg-violet-600/20 text-violet-300 border-violet-500/30' : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
              }`}>
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
              </svg>
              {fileData ? `📎 ${fileData.name}` : 'Joindre un fichier (image, vidéo, audio, zip…)'}
            </button>
            {showFile && (
              <FileUpload value={fileData} onUploaded={setFileData} onClear={() => { setFileData(null); setShowFile(false); }} />
            )}
          </div>

          {/* Tags */}
          <div>
            <p className="text-xs text-slate-400 mb-2">Tags (optionnel)</p>
            <div className="flex flex-wrap gap-1.5">
              {TAGS.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => toggleTag(t)}
                  className={`text-xs px-2.5 py-1 rounded-full border transition-colors ${
                    tags.includes(t)
                      ? 'bg-violet-600 text-white border-violet-500'
                      : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
                  }`}
                >
                  #{t}
                </button>
              ))}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => { setExpanded(false); setContent(''); setTags([]); setFileData(null); setShowFile(false); }}
              className="px-4 py-2 text-sm text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={(!content.trim() && !fileData) || loading}
              className="px-5 py-2 text-sm font-semibold text-white bg-violet-600 hover:bg-violet-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {loading ? 'Publication...' : 'Publier'}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
