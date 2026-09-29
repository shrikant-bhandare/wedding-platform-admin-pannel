import React, { useState, useEffect, useRef, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, Send, Search, ArrowLeft, User, Clock, Loader, RefreshCw } from 'lucide-react';
import { adminApi } from '../../services/api';

const API_BASE = import.meta.env.VITE_API_URL?.replace('/api/v1', '') || 'http://localhost:3000';

interface Participant {
  _id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  role?: string;
}

interface Chat {
  _id: string;
  participants: Participant[];
  lastMessage?: string;
  lastMessageAt?: string;
  updatedAt: string;
}

interface Message {
  _id: string;
  chat: string;
  sender: { _id: string; name: string };
  content: string;
  createdAt: string;
}

const ChatSupportPage: React.FC = () => {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [loading, setLoading] = useState(true);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const selectedChatIdRef = useRef<string | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Socket.IO connection
  useEffect(() => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const socket = io(API_BASE, {
      path: '/socket.io/',
      auth: { token },
      transports: ['polling', 'websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    });

    socket.on('connect', () => {
      console.log('Admin chat socket connected');
      // Re-join current chat room on reconnect
      if (selectedChatIdRef.current) {
        socket.emit('join-chat', selectedChatIdRef.current);
      }
    });

    socket.on('new-message', (data: { chatId: string; message: Message }) => {
      // Update messages if viewing that chat
      if (data.chatId === selectedChatIdRef.current) {
        setMessages(prev => {
          if (prev.some(m => m._id === data.message._id)) return prev;
          return [...prev, data.message];
        });
      }

      // Update chat list preview
      setChats(prev =>
        prev.map(c =>
          c._id === data.chatId
            ? { ...c, lastMessage: data.message.content, lastMessageAt: data.message.createdAt }
            : c
        ).sort((a, b) => new Date(b.lastMessageAt || b.updatedAt).getTime() - new Date(a.lastMessageAt || a.updatedAt).getTime())
      );
    });

    socket.on('message-notification', (data: { chatId: string }) => {
      // Refresh chat list to show new messages
      setChats(prev =>
        prev.map(c =>
          c._id === data.chatId
            ? { ...c, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    });

    socket.on('connect_error', (err) => {
      console.warn('Admin chat socket error:', err.message);
    });

    socketRef.current = socket;

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, []);

  // Fetch all chats
  const fetchChats = async () => {
    try {
      setLoading(true);
      const response = await adminApi.getAllChats({ limit: 100 });
      const data = response?.data?.data || response?.data || [];
      setChats(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch chats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  // Select a chat and load messages
  const selectChat = async (chat: Chat) => {
    // Leave previous chat room
    if (selectedChatIdRef.current) {
      socketRef.current?.emit('leave-chat', selectedChatIdRef.current);
    }

    setSelectedChat(chat);
    selectedChatIdRef.current = chat._id;
    setMessagesLoading(true);
    setMessages([]);

    try {
      const response = await adminApi.getChatMessages(chat._id, { limit: 100 });
      const data = response?.data?.data || response?.data || [];
      setMessages(Array.isArray(data) ? data : []);

      // Join socket room
      socketRef.current?.emit('join-chat', chat._id);

      // Mark as read
      adminApi.markChatRead(chat._id).catch(() => {});
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setMessagesLoading(false);
    }
  };

  // Send admin reply
  const sendReply = async () => {
    if (!reply.trim() || !selectedChat || sending) return;

    const content = reply.trim();
    setReply('');
    setSending(true);

    try {
      const response = await adminApi.adminReplyChat(selectedChat._id, content);
      const msg = response?.data?.message || response?.message;
      if (msg) {
        setMessages(prev => {
          if (prev.some(m => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }

      // Update chat list
      setChats(prev =>
        prev.map(c =>
          c._id === selectedChat._id
            ? { ...c, lastMessage: content, lastMessageAt: new Date().toISOString() }
            : c
        )
      );
    } catch (err) {
      console.error('Failed to send reply:', err);
      setReply(content);
    } finally {
      setSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendReply();
    }
  };

  const getUserFromChat = (chat: Chat): Participant | undefined => {
    return chat.participants?.find(p => p.role === 'USER');
  };

  const getChatUserName = (chat: Chat): string => {
    const user = getUserFromChat(chat);
    if (!user) return 'Unknown User';
    return [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email || 'User';
  };

  const formatTime = (dateStr?: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    if (diffHrs < 48) return 'Yesterday';
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const filteredChats = chats.filter(chat => {
    if (!searchQuery) return true;
    const userName = getChatUserName(chat).toLowerCase();
    const lastMsg = (typeof chat.lastMessage === 'string' ? chat.lastMessage : '').toLowerCase();
    return userName.includes(searchQuery.toLowerCase()) || lastMsg.includes(searchQuery.toLowerCase());
  });

  // Chat list panel
  const renderChatList = () => (
    <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-96 border-r border-gray-200 bg-white`}>
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-900">Support Chats</h2>
          <button
            onClick={fetchChats}
            className="p-2 text-gray-500 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Chat list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex items-center justify-center p-8">
            <Loader className="w-6 h-6 animate-spin text-green-600" />
          </div>
        ) : filteredChats.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-gray-400">
            <MessageCircle className="w-12 h-12 mb-3" />
            <p className="text-sm">{searchQuery ? 'No matching chats' : 'No support chats yet'}</p>
          </div>
        ) : (
          filteredChats.map(chat => {
            const userName = getChatUserName(chat);
            const isSelected = selectedChat?._id === chat._id;
            return (
              <button
                key={chat._id}
                onClick={() => selectChat(chat)}
                className={`w-full flex items-center gap-3 p-4 text-left transition-colors border-b border-gray-50 ${
                  isSelected ? 'bg-green-50 border-l-4 border-l-green-500' : 'hover:bg-gray-50'
                }`}
              >
                <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-bold text-sm">{userName.charAt(0).toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-800 truncate">{userName}</p>
                    <span className="text-xs text-gray-400 flex-shrink-0 ml-2">
                      {formatTime(chat.lastMessageAt || chat.updatedAt)}
                    </span>
                  </div>
                  {chat.lastMessage && (
                    <p className="text-xs text-gray-500 truncate mt-0.5">
                      {typeof chat.lastMessage === 'string' ? chat.lastMessage : ''}
                    </p>
                  )}
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );

  // Chat detail panel
  const renderChatDetail = () => {
    if (!selectedChat) {
      return (
        <div className="hidden lg:flex flex-1 items-center justify-center bg-gray-50">
          <div className="text-center">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 font-medium">Select a conversation</p>
            <p className="text-gray-400 text-sm">Choose from the list to start replying</p>
          </div>
        </div>
      );
    }

    const userName = getChatUserName(selectedChat);
    const userInfo = getUserFromChat(selectedChat);

    return (
      <div className="flex flex-col flex-1 bg-white">
        {/* Chat header */}
        <div className="flex items-center gap-3 p-4 border-b border-gray-200 bg-white">
          <button
            onClick={() => {
              if (selectedChat) socketRef.current?.emit('leave-chat', selectedChat._id);
              setSelectedChat(null);
              setMessages([]);
            }}
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center">
            <User className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800">{userName}</p>
            {userInfo?.email && (
              <p className="text-xs text-gray-500">{userInfo.email}</p>
            )}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <Clock className="w-3 h-3" />
            <span>{formatTime(selectedChat.lastMessageAt || selectedChat.updatedAt)}</span>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-gray-50">
          {messagesLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader className="w-6 h-6 animate-spin text-green-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center text-gray-400 p-8">
              <p className="text-sm">No messages yet</p>
            </div>
          ) : (
            messages.map(msg => {
              const isAdmin = msg.sender._id !== getUserFromChat(selectedChat)?._id;
              return (
                <div key={msg._id} className={`flex ${isAdmin ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-4 py-3 shadow-sm ${
                      isAdmin
                        ? 'bg-green-600 text-white rounded-br-sm'
                        : 'bg-white text-gray-800 rounded-bl-sm border border-gray-200'
                    }`}
                  >
                    {!isAdmin && (
                      <p className="text-xs font-medium text-green-600 mb-1">{msg.sender.name}</p>
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                    <p className={`text-xs mt-1.5 ${isAdmin ? 'text-green-200' : 'text-gray-400'}`}>
                      {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Reply input */}
        <div className="p-4 bg-white border-t border-gray-200">
          <div className="flex items-center gap-3">
            <input
              type="text"
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Type your reply..."
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
            <button
              onClick={sendReply}
              disabled={!reply.trim() || sending}
              className="bg-green-600 text-white p-3 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Chat Support</h1>
        <p className="text-gray-600">View and respond to user support messages</p>
      </div>

      <div className="flex h-[calc(100vh-200px)] bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        {renderChatList()}
        {renderChatDetail()}
      </div>
    </div>
  );
};

export default ChatSupportPage;
