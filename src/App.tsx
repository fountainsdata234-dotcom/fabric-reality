import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Home,
  Users,
  Compass,
  Layers,
  MessageSquare,
  User as UserIcon,
  Crown,
  Sun,
  Moon,
  ArrowUp,
  LogIn,
  LogOut,
  Sparkles,
  ShieldCheck,
  MapPin,
  Menu,
  X,
  Phone,
  Radio,
  PlusCircle
} from 'lucide-react';
import { User, Garment } from './types';
import { api } from './services/api';
import { Logo } from './components/Logo';
import { MotionCanvas } from './components/MotionCanvas';
import { LandingPage } from './components/LandingPage';
import { HomePage } from './components/HomePage';
import { TailorDirectory } from './components/TailorDirectory';
import { TailorStudio } from './components/TailorStudio';
import { CustomerHub } from './components/CustomerHub';
import { AdminPlatform } from './components/AdminPlatform';
import { CollectionsPage } from './components/CollectionsPage';
import { AuthModal } from './components/AuthModal';
import { LegalModal } from './components/LegalModal';
import { ChatModal } from './components/ChatModal';
import { TailorStudioView } from './components/TailorStudioView';
import { generateAvatarUrl } from './data/countries';

export default function App() {
  // Navigation & View State
  const [currentView, setCurrentView] = useState<'landing' | 'home' | 'tailors' | 'collections' | 'studio' | 'customer' | 'admin'>('landing');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register_tailor' | 'register_customer'>('login');
  const [legalModalOpen, setLegalModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms'>('privacy');

  // Chat & Studio Inspection Modals
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [chatRecipient, setChatRecipient] = useState<any | null>(null);
  const [chatAttachedGarment, setChatAttachedGarment] = useState<Garment | null>(null);
  const [inspectedTailor, setInspectedTailor] = useState<User | null>(null);

  // Theme & UI utilities
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [announcement, setAnnouncement] = useState<string | null>(null);

  // Check saved session on mount
  useEffect(() => {
    const savedUserStr = localStorage.getItem('fabric_user');
    if (savedUserStr) {
      try {
        const parsed = JSON.parse(savedUserStr);
        setCurrentUser(parsed);
        if (parsed.role === 'admin') {
          setCurrentView('admin');
        } else if (parsed.role === 'tailor') {
          setCurrentView('studio');
        } else {
          setCurrentView('home');
        }
      } catch (err) {
        console.error('Session restore error:', err);
      }
    }

    const savedTheme = localStorage.getItem('fabric_theme') as 'dark' | 'light';
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Scroll listener for back-to-top
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('fabric_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('fabric_user', JSON.stringify(user));
    if (user.role === 'admin') {
      setCurrentView('admin');
    } else if (user.role === 'tailor') {
      setCurrentView('studio');
    } else {
      setCurrentView('home');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('fabric_user');
    setCurrentView('landing');
  };

  const openAuth = (mode: 'login' | 'register_tailor' | 'register_customer' = 'login') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const openLegal = (type: 'privacy' | 'terms') => {
    setLegalModalType(type);
    setLegalModalOpen(true);
  };

  const handleStartChat = (recipient: any, garment?: Garment) => {
    setChatRecipient(recipient);
    setChatAttachedGarment(garment || null);
    setChatModalOpen(true);
  };

  const handleSelectTailorById = async (tailorId: string) => {
    try {
      const res = await api.getTailorDetails(tailorId);
      if (res.tailor) {
        setInspectedTailor(res.tailor);
      }
    } catch (err) {
      console.error('Fetch tailor error:', err);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#050505] text-[#E0E0E0] font-sans antialiased pb-20 md:pb-0 relative overflow-x-hidden selection:bg-amber-500 selection:text-black">
      {/* Elegant Dark Ambient Atmosphere Glows */}
      <div className="fixed top-[-120px] right-[-120px] w-[520px] h-[520px] bg-amber-500/10 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-120px] left-[-120px] w-[440px] h-[440px] bg-blue-500/10 rounded-full blur-[110px] pointer-events-none z-0" />

      {/* Dynamic Background Motion Graphics */}
      <MotionCanvas />

      {/* Global Announcements Bar if present */}
      {announcement && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-yellow-500 text-stone-950 text-xs font-black py-2 px-4 text-center flex items-center justify-center gap-2 relative z-40 shadow-lg">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span>{announcement}</span>
          <button onClick={() => setAnnouncement(null)} className="ml-2 hover:opacity-75">
            ✕
          </button>
        </div>
      )}

      {/* Main Top Navigation Header */}
      <header className="sticky top-0 z-40 bg-[#050505]/80 backdrop-blur-md border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* Brand Logo */}
          <div
            onClick={() => setCurrentView('landing')}
            className="cursor-pointer flex items-center"
          >
            <Logo size="md" />
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs uppercase tracking-widest font-medium text-stone-300">
            <button
              onClick={() => setCurrentView('home')}
              className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'home'
                  ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                  : 'hover:text-amber-400 text-stone-400'
                }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span>Trending & Feed</span>
            </button>

            <button
              onClick={() => setCurrentView('tailors')}
              className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'tailors'
                  ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                  : 'hover:text-amber-400 text-stone-400'
                }`}
            >
              <Scissors className="w-3.5 h-3.5" />
              <span>Artisans</span>
            </button>

            <button
              onClick={() => setCurrentView('collections')}
              className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'collections'
                  ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                  : 'hover:text-amber-400 text-stone-400'
                }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Collections</span>
            </button>

            {/* Role-Specific Navigation Buttons */}
            {currentUser?.role === 'tailor' && (
              <button
                onClick={() => setCurrentView('studio')}
                className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'studio'
                    ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                    : 'text-amber-400/90 hover:text-amber-300'
                  }`}
              >
                <Scissors className="w-3.5 h-3.5" />
                <span>My Tailor Studio</span>
              </button>
            )}

            {currentUser?.role === 'customer' && (
              <button
                onClick={() => setCurrentView('customer')}
                className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'customer'
                    ? 'text-amber-400 font-bold border-b-2 border-amber-400'
                    : 'hover:text-amber-400 text-stone-400'
                  }`}
              >
                <UserIcon className="w-3.5 h-3.5" />
                <span>Customer Hub</span>
              </button>
            )}

            {currentUser?.role === 'admin' && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`py-2 transition-colors flex items-center gap-1.5 ${currentView === 'admin'
                    ? 'text-red-400 font-bold border-b-2 border-red-400'
                    : 'text-red-400 hover:text-red-300'
                  }`}
              >
                <Crown className="w-3.5 h-3.5" />
                <span>Executive Admin</span>
              </button>
            )}
          </nav>

          {/* Right Action Icons & Auth */}
          <div className="flex items-center gap-3">
            {/* In-App Live Messages Trigger */}
            {currentUser && (
              <button
                onClick={() => {
                  setChatRecipient(null);
                  setChatModalOpen(true);
                }}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-amber-400 border border-white/10 transition-colors relative"
                title="In-App Messages & Broadcasts"
              >
                <MessageSquare className="w-4 h-4" />
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-500" />
              </button>
            )}

            {/* User Profile or Sign In Buttons */}
            {currentUser ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => {
                    if (currentUser.role === 'admin') setCurrentView('admin');
                    else if (currentUser.role === 'tailor') setCurrentView('studio');
                    else setCurrentView('customer');
                  }}
                  className="flex items-center gap-2 p-1.5 pr-4 rounded-full bg-white/5 border border-white/10 hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-xs"
                >
                  <img
                    src={currentUser.avatarUrl || generateAvatarUrl(currentUser.name, currentUser.role)}
                    alt={currentUser.name}
                    className="w-7 h-7 rounded-full object-cover border border-amber-500/40"
                  />
                  <span className="font-semibold text-stone-200 hidden sm:inline max-w-[120px] truncate">
                    {currentUser.name}
                  </span>
                </button>

                <button
                  onClick={handleLogout}
                  className="p-2.5 rounded-full bg-white/5 hover:bg-red-950/60 text-stone-400 hover:text-red-400 border border-white/10 transition-colors"
                  title="Sign Out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => openAuth('login')}
                  className="px-5 py-2 text-xs uppercase tracking-wider font-semibold text-white border border-white/20 rounded-full hover:bg-white/5 transition-all"
                >
                  Login
                </button>

                <button
                  onClick={() => openAuth('register_tailor')}
                  className="px-6 py-2 text-xs uppercase tracking-wider bg-white text-black font-bold rounded-full hover:bg-amber-400 active:scale-95 transition-all hidden sm:inline-flex items-center gap-1.5 shadow-lg shadow-white/5"
                >
                  <span>Join Now</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Viewport Container */}
      <main className="relative z-10 min-h-[calc(100vh-144px)]">
        {currentView === 'landing' && (
          <LandingPage
            onExploreClick={() => setCurrentView('home')}
            onOpenAuth={openAuth}
            onOpenLegal={openLegal}
          />
        )}

        {currentView === 'home' && (
          <HomePage
            currentUser={currentUser}
            onOpenAuth={openAuth}
            onOpenTailorStudio={() => setCurrentView('studio')}
            onSelectTailorById={handleSelectTailorById}
            onStartChat={handleStartChat}
            onOpenCollections={() => setCurrentView('collections')}
          />
        )}

        {currentView === 'tailors' && (
          <TailorDirectory
            currentUser={currentUser}
            onSelectTailor={(tailor) => setInspectedTailor(tailor)}
            onStartChat={handleStartChat}
            onOpenAuth={openAuth}
          />
        )}

        {currentView === 'collections' && (
          <CollectionsPage
            onSelectTailorById={handleSelectTailorById}
            onOpenAuth={openAuth}
          />
        )}

        {currentView === 'studio' && currentUser?.role === 'tailor' && (
          <TailorStudio
            currentUser={currentUser}
            onUserUpdate={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('fabric_user', JSON.stringify(updated));
            }}
            onOpenChat={() => {
              setChatRecipient(null);
              setChatModalOpen(true);
            }}
          />
        )}

        {currentView === 'customer' && currentUser?.role === 'customer' && (
          <CustomerHub
            currentUser={currentUser}
            onUserUpdate={(updated) => {
              setCurrentUser(updated);
              localStorage.setItem('fabric_user', JSON.stringify(updated));
            }}
            onSelectTailor={(t) => setInspectedTailor(t)}
            onStartChat={handleStartChat}
          />
        )}

        {currentView === 'admin' && currentUser?.role === 'admin' && (
          <AdminPlatform
            currentUser={currentUser}
            onOpenChatWithUser={(user) => handleStartChat(user)}
          />
        )}
      </main>

      {/* --- ELEGANT DARK FOOTER --- */}
      <footer className="h-16 flex items-center justify-between px-6 sm:px-10 border-t border-white/5 bg-[#050505]/90 backdrop-blur-md text-[10px] text-gray-500 z-20">
        <div className="flex items-center gap-6 uppercase tracking-widest">
          <span>© {new Date().getFullYear()} Fabric Reality</span>
          <button onClick={() => openLegal('privacy')} className="hover:text-white transition-colors">
            Privacy Policy
          </button>
          <button onClick={() => openLegal('terms')} className="hover:text-white transition-colors">
            Terms & Conditions
          </button>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></span>
            <span className="uppercase tracking-widest text-stone-400">System Secure</span>
          </div>
          <button
            onClick={scrollToTop}
            className="w-8 h-8 border border-white/10 rounded-full flex items-center justify-center hover:bg-white hover:text-black text-stone-400 transition-all cursor-pointer"
            title="Back to Top"
          >
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </footer>

      {/* --- SMART MOBILE APP BOTTOM NAVIGATION BAR (Screen size < md) --- */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080808]/95 backdrop-blur-lg border-t border-white/10 px-3 py-2 flex items-center justify-around shadow-2xl">
        <button
          onClick={() => setCurrentView('home')}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'home' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Home Feed</span>
        </button>

        <button
          onClick={() => setCurrentView('tailors')}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'tailors' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Scissors className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Artisans</span>
        </button>

        <button
          onClick={() => setCurrentView('collections')}
          className={`flex flex-col items-center gap-1 transition-all ${currentView === 'collections' ? 'text-amber-400 font-bold' : 'text-stone-400 hover:text-stone-200'
            }`}
        >
          <Layers className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Lookbooks</span>
        </button>

        <button
          onClick={() => {
            if (!currentUser) openAuth('login');
            else {
              setChatRecipient(null);
              setChatModalOpen(true);
            }
          }}
          className="flex flex-col items-center gap-1 text-stone-400 hover:text-stone-200"
        >
          <MessageSquare className="w-5 h-5" />
          <span className="text-[10px] tracking-tight">Messages</span>
        </button>

        {currentUser ? (
          <button
            onClick={() => {
              if (currentUser.role === 'admin') setCurrentView('admin');
              else if (currentUser.role === 'tailor') setCurrentView('studio');
              else setCurrentView('customer');
            }}
            className={`flex flex-col items-center gap-1 transition-all ${currentView === 'studio' || currentView === 'customer' || currentView === 'admin'
                ? 'text-amber-400 font-bold'
                : 'text-stone-400'
              }`}
          >
            <UserIcon className="w-5 h-5" />
            <span className="text-[10px] tracking-tight">
              {currentUser.role === 'tailor' ? 'My Studio' : currentUser.role === 'admin' ? 'Admin' : 'Profile'}
            </span>
          </button>
        ) : (
          <button
            onClick={() => openAuth('login')}
            className="flex flex-col items-center gap-1 text-amber-400"
          >
            <LogIn className="w-5 h-5" />
            <span className="text-[10px] font-bold tracking-tight">Sign In</span>
          </button>
        )}
      </div>

      {/* Floating Back to Top Button for mobile */}
      {showBackToTop && (
        <button
          onClick={scrollToTop}
          className="md:hidden fixed bottom-20 right-5 z-40 p-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-2xl transition-all"
          title="Back to Top"
        >
          <ArrowUp className="w-5 h-5" />
        </button>
      )}

      {/* Modals & Overlays */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleLoginSuccess}
        initialMode={authModalMode}
        onOpenLegal={openLegal}
      />

      <LegalModal
        isOpen={legalModalOpen}
        onClose={() => setLegalModalOpen(false)}
        type={legalModalType}
      />

      {currentUser && (
        <ChatModal
          isOpen={chatModalOpen}
          onClose={() => setChatModalOpen(false)}
          currentUser={currentUser}
          recipientUser={chatRecipient}
          attachedGarment={chatAttachedGarment}
        />
      )}

      {inspectedTailor && (
        <TailorStudioView
          tailor={inspectedTailor}
          currentUser={currentUser}
          onClose={() => setInspectedTailor(null)}
          onStartChat={handleStartChat}
          onOpenAuth={openAuth}
        />
      )}
    </div>
  );
}
