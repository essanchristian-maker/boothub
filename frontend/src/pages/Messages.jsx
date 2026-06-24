import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../api';
import FileUpload from '../components/FileUpload';
import FileAttachment from '../components/FileAttachment';

function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date)) / 1000);
  if (s < 60)    return "à l'instant";
  if (s < 3600)  return `${Math.floor(s / 60)}min`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function Avatar({ name, color, size = 'sm' }) {
  const s = size === 'sm' ? 'w-9 h-9 text-sm' : 'w-11 h-11 text-base';
  return (
    <div className={`${s} rounded-full flex items-center justify-center font-bold text-white flex-shrink-0`}
      style={{ backgroundColor: color }}>
      {name?.charAt(0).toUpperCase()}
    </div>
  );
}

function ConvItem({ conv, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        active ? 'bg-violet-600/20 border-r-2 border-violet-500' : 'hover:bg-slate-800/60'
      }`}
    >
      <Avatar name={conv.other_name} color={conv.other_color} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="text-sm font-semibold text-white truncate">{conv.other_name}</span>
          <span className="text-[10px] text-slate-500 flex-shrink-0">{timeAgo(conv.created_at)}</span>
        </div>
        <p className="text-xs text-slate-400 truncate">
          {conv.file_name ? `📎 ${conv.file_name}` : conv.content || '…'}
        </p>
      </div>
      {conv.unread_count > 0 && (
        <span className="w-5 h-5 bg-violet-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">
          {conv.unread_count}
        </span>
      )}
    </button>
  );
}

function Bubble({ msg, isMine }) {
  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0 mb-1"
          style={{ backgroundColor: msg.from_color || '#8b5cf6' }}>
          {msg.from_name?.charAt(0).toUpperCase()}
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {msg.content && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed break-words ${
            isMine
              ? 'bg-violet-600 text-white rounded-br-sm'
              : 'bg-slate-700 text-slate-100 rounded-bl-sm'
          }`}>
            {msg.content}
          </div>
        )}
        {msg.file_url && (
          <div className={isMine ? 'self-end' : 'self-start'}>
            <FileAttachment url={msg.file_url} type={msg.file_type} name={msg.file_name} />
          </div>
        )}
        <span className="text-[10px] text-slate-500 mt-1 px-1">{timeAgo(msg.created_at)}</span>
      </div>
    </div>
  );
}

export default function Messages() {
  const { user, socket } = useAuth();
  const { userId: paramUserId } = useParams();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId]           = useState(paramUserId ? parseInt(paramUserId) : null);
  const [activeUser, setActiveUser]       = useState(null);
  const [messages, setMessages]           = useState([]);
  const [allUsers, setAllUsers]           = useState([]);
  const [showUsers, setShowUsers]         = useState(false);
  const [text, setText]                   = useState('');
  const [fileData, setFileData]           = useState(null);
  const [showFile, setShowFile]           = useState(false);
  const [sending, setSending]             = useState(false);
  const bottomRef = useRef(null);

  const fetchConvs = useCallback(async () => {
    const { data } = await api.get('/messages/conversations');
    setConversations(data);
  }, []);

  useEffect(() => { fetchConvs(); }, [fetchConvs]);

  useEffect(() => {
    if (!activeId) return;
    api.get(`/messages/${activeId}`).then(({ data }) => {
      setMessages(data);
      fetchConvs();
    });
    api.get(`/users/${activeId}`).then(({ data }) => setActiveUser(data));
  }, [activeId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (!socket) return;
    const handler = (msg) => {
      if (msg.from_user_id === activeId) {
        setMessages(prev => [...prev, msg]);
      }
      fetchConvs();
    };
    socket.on('new_message', handler);
    return () => socket.off('new_message', handler);
  }, [socket, activeId, fetchConvs]);

  const openConv = (id) => {
    setActiveId(id);
    setShowUsers(false);
    navigate(`/messages/${id}`, { replace: true });
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !fileData) return;
    setSending(true);
    try {
      const { data } = await api.post(`/messages/${activeId}`, {
        content:   text.trim(),
        file_url:  fileData?.url  || '',
        file_type: fileData?.type || '',
        file_name: fileData?.name || '',
      });
      setMessages(prev => [...prev, data]);
      setText('');
      setFileData(null);
      setShowFile(false);
      fetchConvs();
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100vh-56px)] bg-slate-900">

      {/* Sidebar conversations */}
      <aside className={`w-80 flex-shrink-0 border-r border-slate-700/50 flex flex-col ${activeId ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-4 border-b border-slate-700/50">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-white">Messages</h2>
            <button
              onClick={() => { setShowUsers(v => !v); api.get('/users').then(({ data }) => setAllUsers(data)); }}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              title="Nouveau message"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
            </button>
          </div>

          {showUsers && (
            <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
              {allUsers.filter(u => u.id !== user.id).map(u => (
                <button key={u.id} onClick={() => openConv(u.id)}
                  className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-slate-700 text-left transition-colors">
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ backgroundColor: u.avatar_color }}>
                    {u.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm text-white">{u.name}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto">
          {conversations.length === 0 ? (
            <div className="text-center text-slate-500 text-sm px-4 py-8">
              <div className="text-3xl mb-2">💬</div>
              <p>Aucune conversation</p>
              <p className="text-xs mt-1">Clique sur + pour écrire</p>
            </div>
          ) : (
            conversations.map(c => (
              <ConvItem key={c.other_id} conv={c} active={activeId === c.other_id} onClick={() => openConv(c.other_id)} />
            ))
          )}
        </div>
      </aside>

      {/* Zone de chat */}
      <main className={`flex-1 flex flex-col ${!activeId ? 'hidden md:flex' : 'flex'}`}>
        {!activeId ? (
          <div className="flex-1 flex items-center justify-center text-slate-500">
            <div className="text-center">
              <div className="text-5xl mb-3">💬</div>
              <p className="font-medium text-slate-400">Sélectionne une conversation</p>
              <p className="text-sm mt-1">ou clique sur + pour en démarrer une</p>
            </div>
          </div>
        ) : (
          <>
            {/* Header chat */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-700/50 bg-slate-900/80 backdrop-blur-sm flex-shrink-0">
              <button onClick={() => { setActiveId(null); navigate('/messages', { replace: true }); }}
                className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              {activeUser && (
                <>
                  <Avatar name={activeUser.name} color={activeUser.avatar_color} />
                  <div>
                    <p className="font-semibold text-white text-sm">{activeUser.name}</p>
                    <p className="text-xs text-slate-400">{activeUser.email}</p>
                  </div>
                </>
              )}
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {messages.length === 0 && (
                <div className="text-center text-slate-500 text-sm py-12">
                  <div className="text-3xl mb-2">👋</div>
                  <p>Envoie le premier message !</p>
                </div>
              )}
              {messages.map(msg => (
                <Bubble key={msg.id} msg={msg} isMine={msg.from_user_id === user.id} />
              ))}
              <div ref={bottomRef} />
            </div>

            {/* Zone de saisie */}
            <div className="border-t border-slate-700/50 p-3 flex-shrink-0 bg-slate-900/80">
              {showFile && (
                <div className="mb-2">
                  <FileUpload
                    value={fileData}
                    onUploaded={setFileData}
                    onClear={() => { setFileData(null); setShowFile(false); }}
                  />
                </div>
              )}
              <form onSubmit={handleSend} className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowFile(v => !v)}
                  className={`p-2 rounded-xl transition-colors flex-shrink-0 ${
                    showFile || fileData ? 'text-violet-400 bg-violet-400/10' : 'text-slate-400 hover:text-white hover:bg-slate-800'
                  }`}
                  title="Joindre un fichier"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <input
                  value={text}
                  onChange={e => setText(e.target.value)}
                  placeholder={`Message à ${activeUser?.name || ''}...`}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-violet-500 focus:border-transparent transition"
                />
                <button
                  type="submit"
                  disabled={(!text.trim() && !fileData) || sending}
                  className="p-2.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-40 text-white rounded-xl transition-colors flex-shrink-0"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </form>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
