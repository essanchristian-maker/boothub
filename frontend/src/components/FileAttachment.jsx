import React, { useState } from 'react';

const ICONS = {
  pdf:   { icon: '📄', color: 'text-red-400',    bg: 'bg-red-400/10 border-red-400/30' },
  zip:   { icon: '🗜️', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  rar:   { icon: '🗜️', color: 'text-yellow-400', bg: 'bg-yellow-400/10 border-yellow-400/30' },
  doc:   { icon: '📝', color: 'text-blue-400',   bg: 'bg-blue-400/10 border-blue-400/30' },
  xls:   { icon: '📊', color: 'text-green-400',  bg: 'bg-green-400/10 border-green-400/30' },
  ppt:   { icon: '📊', color: 'text-orange-400', bg: 'bg-orange-400/10 border-orange-400/30' },
  other: { icon: '📎', color: 'text-slate-400',  bg: 'bg-slate-400/10 border-slate-400/30' },
};

function fileIcon(name = '', type = '') {
  const ext = name.split('.').pop()?.toLowerCase();
  if (type.startsWith('image/') || type.startsWith('video/') || type.startsWith('audio/')) return null;
  return ICONS[ext] || ICONS.other;
}

export default function FileAttachment({ url, type = '', name = '', compact = false }) {
  const [videoErr, setVideoErr] = useState(false);

  if (!url) return null;

  // Image
  if (type.startsWith('image/')) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer"
        className="block mt-2 rounded-xl overflow-hidden border border-slate-700 max-w-sm">
        <img src={url} alt={name} className="w-full object-cover max-h-72" />
      </a>
    );
  }

  // Video
  if (type.startsWith('video/') && !videoErr) {
    return (
      <div className="mt-2 rounded-xl overflow-hidden border border-slate-700 max-w-sm bg-black">
        <video controls className="w-full max-h-64" onError={() => setVideoErr(true)}>
          <source src={url} type={type} />
          <a href={url} target="_blank" rel="noopener noreferrer" className="text-violet-400 text-sm p-2 block">
            Télécharger la vidéo
          </a>
        </video>
      </div>
    );
  }

  // Audio
  if (type.startsWith('audio/')) {
    return (
      <div className="mt-2 flex items-center gap-3 bg-slate-700/40 border border-slate-600 rounded-xl px-4 py-3 max-w-sm">
        <span className="text-2xl">🎵</span>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 truncate mb-1">{name}</p>
          <audio controls className="w-full h-8">
            <source src={url} type={type} />
          </audio>
        </div>
      </div>
    );
  }

  // Fichier raw (PDF, ZIP, RAR, etc.)
  const fi = fileIcon(name, type);
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" download={name}
      className={`mt-2 inline-flex items-center gap-3 px-4 py-3 rounded-xl border ${fi?.bg || ICONS.other.bg} hover:opacity-80 transition-opacity max-w-xs`}>
      <span className="text-xl flex-shrink-0">{fi?.icon || '📎'}</span>
      <div className="min-w-0">
        <p className={`text-sm font-medium truncate ${fi?.color || 'text-slate-400'}`}>{name || 'Fichier'}</p>
        <p className="text-xs text-slate-500">Cliquer pour télécharger</p>
      </div>
      <svg className="w-4 h-4 text-slate-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
      </svg>
    </a>
  );
}
