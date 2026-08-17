import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Send,
  MessageSquare,
  Sparkles,
  Phone,
  Shield,
  CheckCircle2,
  Radio,
  User as UserIcon,
  Shirt
} from 'lucide-react';
import { User, Garment, Message } from '../types';
import { api } from '../services/api';
import { formatWhatsAppUrl, generateAvatarUrl } from '../data/countries';

interface ChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  recipientUser?: {
    id: string;
    name: string;
    avatarUrl?: string;
    phone?: string;
    whatsappPhone?: string;
    role: any;
  } | null;
  attachedGarment?: Garment | null;
}

export const ChatModal: React.FC<ChatModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  recipientUser,
  attachedGarment,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [activeTab, setActiveTab] = useState<'direct' | 'announcements'>('direct');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadMessages();
      const interval = setInterval(loadMessages, 4000);
      return () => clearInterval(interval);
    }
  }, [isOpen, recipientUser?.id, currentUser.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadMessages = async () => {
    try {
      const res = await api.getMessages(currentUser.id, recipientUser?.id);
      if (res.messages) {
        setMessages(res.messages);
      }
    } catch (err) {
      console.error('Messages load error:', err);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    setIsSending(true);
    try {
      const res = await api.sendMessage({
        senderId: currentUser.id,
        recipientId: recipientUser?.id || 'all',
        text: inputText,
        garmentId: attachedGarment?.id,
        garmentTitle: attachedGarment?.title,
        garmentImage: attachedGarment?.imageUrl,
      });

      if (res.message) {
        setMessages((prev) => [...prev, res.message]);
        setInputText('');
      }
    } catch (err: any) {
      console.error('Send message error:', err);
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  const directMessages = messages.filter((m) => !m.isAnnouncement);
  const announcementMessages = messages.filter((m) => m.isAnnouncement);

  const displayedMessages = activeTab === 'direct' ? directMessages : announcementMessages;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-stone-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-xl h-[85vh] max-h-[680px] bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-stone-950 border-b border-stone-800">
          <div className="flex items-center gap-3">
            {recipientUser ? (
              <img
                src={recipientUser.avatarUrl || generateAvatarUrl(recipientUser.name, recipientUser.role)}
                alt={recipientUser.name}
                className="w-10 h-10 rounded-full object-cover border border-amber-500/50"
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
                <MessageSquare className="w-5 h-5" />
              </div>
            )}

            <div>
              <h2 className="text-sm font-bold text-stone-100">
                {recipientUser ? recipientUser.name : 'Fabric Reality In-App Chat'}
              </h2>
              <span className="text-[11px] text-amber-400 flex items-center gap-1 font-mono">
                ● Live Encrypted Chat
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {recipientUser && (
              <a
                href={formatWhatsAppUrl(
                  recipientUser.whatsappPhone || recipientUser.phone,
                  recipientUser.name,
                  attachedGarment?.title
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center gap-1"
              >
                <Phone className="w-3 h-3" />
                <span className="hidden sm:inline">WhatsApp</span>
              </a>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab switch between Direct Chat & Announcements */}
        <div className="grid grid-cols-2 p-1 bg-stone-950 border-b border-stone-800 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('direct')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'direct' ? 'bg-stone-800 text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            Direct Messages ({directMessages.length})
          </button>
          <button
            onClick={() => setActiveTab('announcements')}
            className={`py-1.5 rounded-lg transition-all ${
              activeTab === 'announcements' ? 'bg-stone-800 text-amber-400 font-bold' : 'text-stone-400'
            }`}
          >
            📢 Announcements ({announcementMessages.length})
          </button>
        </div>

        {/* Attached Garment Context Bar */}
        {attachedGarment && (
          <div className="px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-3">
            <img
              src={attachedGarment.imageUrl}
              alt={attachedGarment.title}
              className="w-10 h-10 rounded-lg object-cover border border-amber-500/40"
            />
            <div className="min-w-0 flex-1 text-xs">
              <span className="text-[10px] text-amber-400 font-mono uppercase block">Inquiring about:</span>
              <p className="font-bold text-stone-200 truncate">{attachedGarment.title}</p>
            </div>
            <span className="text-xs font-serif font-black text-amber-400">
              {attachedGarment.currency}{attachedGarment.price > 0 ? attachedGarment.price.toLocaleString() : ''}
            </span>
          </div>
        )}

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-sans text-xs">
          {displayedMessages.length === 0 ? (
            <div className="py-12 text-center text-stone-500 space-y-2">
              <MessageSquare className="w-8 h-8 mx-auto text-stone-600" />
              <p>No messages in this thread yet. Send a greeting to start!</p>
            </div>
          ) : (
            displayedMessages.map((msg) => {
              const isMine = msg.senderId === currentUser.id;
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2.5 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}
                >
                  <img
                    src={msg.senderAvatar || generateAvatarUrl(msg.senderName, msg.senderRole)}
                    alt={msg.senderName}
                    className="w-7 h-7 rounded-full object-cover border border-stone-700 mt-1"
                  />

                  <div
                    className={`max-w-[78%] rounded-2xl p-3.5 space-y-1 shadow-md ${
                      msg.isAnnouncement
                        ? 'bg-amber-950/80 border border-amber-800/80 text-amber-200 w-full'
                        : isMine
                        ? 'bg-amber-500 text-stone-950 rounded-tr-none font-medium'
                        : 'bg-stone-800 text-stone-100 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 text-[10px] opacity-75">
                      <span className="font-bold">{msg.senderName}</span>
                      <span>
                        {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {msg.garmentTitle && (
                      <div className="p-1.5 rounded-lg bg-stone-950/30 text-[11px] font-mono flex items-center gap-1.5 mb-1">
                        <Shirt className="w-3 h-3 text-amber-400" />
                        <span className="truncate">Ref: {msg.garmentTitle}</span>
                      </div>
                    )}

                    <p className="leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        {activeTab === 'direct' && (
          <form onSubmit={handleSendMessage} className="p-3 bg-stone-950 border-t border-stone-800 flex items-center gap-2">
            <input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type message regarding fabric, measurements, delivery..."
              className="flex-1 px-4 py-2.5 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-xs focus:outline-none focus:border-amber-500"
            />
            <button
              type="submit"
              disabled={isSending || !inputText.trim()}
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow-md transition-all disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
};
