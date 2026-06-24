import React, { useRef, useState } from 'react';
import api from '../api';
import FileAttachment from './FileAttachment';

const ACCEPT = 'image/*,video/*,audio/*,.pdf,.zip,.rar,.7z,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.ipynb,.py,.js,.json';

export default function FileUpload({ onUploaded, onClear, value }) {
  const inputRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');

  const handleFile = async (file) => {
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post('/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      onUploaded(data);
    } catch (err) {
      setError(err.response?.data?.error || 'Échec du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  if (value) {
    return (
      <div className="relative">
        <FileAttachment url={value.url} type={value.type} name={value.name} />
        <button
          type="button"
          onClick={onClear}
          className="absolute top-2 right-2 w-6 h-6 bg-slate-900/80 hover:bg-slate-800 text-white rounded-full flex items-center justify-center text-xs transition-colors"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <div
        onDragOver={e => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className="border-2 border-dashed border-slate-600 hover:border-violet-500 rounded-xl p-4 text-center cursor-pointer transition-colors group"
      >
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-slate-400">
            <div className="w-4 h-4 border-2 border-violet-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">Téléchargement en cours...</span>
          </div>
        ) : (
          <div className="text-slate-400 group-hover:text-slate-300 transition-colors">
            <div className="text-2xl mb-1">📎</div>
            <p className="text-sm font-medium">Glisse un fichier ici ou clique</p>
            <p className="text-xs text-slate-500 mt-0.5">Images, vidéos, audio, PDF, ZIP, RAR... (100 MB max)</p>
          </div>
        )}
      </div>
      {error && <p className="text-xs text-red-400 mt-1 px-1">{error}</p>}
      <input ref={inputRef} type="file" accept={ACCEPT} className="hidden" onChange={e => handleFile(e.target.files[0])} />
    </div>
  );
}
