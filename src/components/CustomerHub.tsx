import React, { useState, useEffect } from 'react';
import {
  Heart,
  Users,
  MapPin,
  Camera,
  Star,
  MessageSquare,
  Phone,
  Scissors,
  CheckCircle2,
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { User, Garment, Review } from '../types';
import { api } from '../services/api';
import { generateAvatarUrl, formatWhatsAppUrl } from '../data/countries';

interface CustomerHubProps {
  currentUser: User;
  onUserUpdate: (user: User) => void;
  onSelectTailor: (tailor: User) => void;
  onStartChat: (recipient: any, garment?: Garment) => void;
}

export const CustomerHub: React.FC<CustomerHubProps> = ({
  currentUser,
  onUserUpdate,
  onSelectTailor,
  onStartChat,
}) => {
  const [activeTab, setActiveTab] = useState<'following' | 'saved' | 'profile'>('following');
  const [followingTailors, setFollowingTailors] = useState<User[]>([]);
  const [likedGarments, setLikedGarments] = useState<Garment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Profile Edit
  const [name, setName] = useState(currentUser.name);
  const [city, setCity] = useState(currentUser.city || '');
  const [stateName, setStateName] = useState(currentUser.state || '');
  const [avatarPreview, setAvatarPreview] = useState(currentUser.avatarUrl || '');

  useEffect(() => {
    fetchHubData();
  }, [currentUser.id]);

  const fetchHubData = async () => {
    setIsLoading(true);
    try {
      const [tailorsRes, garmentsRes] = await Promise.all([
        api.getTailors(),
        api.getGarments(),
      ]);

      if (tailorsRes.tailors && currentUser.followingIds) {
        const followed = tailorsRes.tailors.filter((t) =>
          currentUser.followingIds?.includes(t.id)
        );
        setFollowingTailors(followed);
      }

      if (garmentsRes.garments) {
        setLikedGarments(garmentsRes.garments.slice(0, 8));
      }
    } catch (err) {
      console.error('Customer hub load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.updateProfile({
        userId: currentUser.id,
        name,
        city,
        state: stateName,
        avatarUrl: avatarPreview,
      });
      if (res.user) {
        onUserUpdate(res.user);
        alert('Customer profile updated!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to update');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header */}
      <div className="rounded-3xl bg-stone-900 p-6 sm:p-8 border border-stone-800 shadow-2xl flex flex-col sm:flex-row items-center gap-6">
        <img
          src={currentUser.avatarUrl || generateAvatarUrl(currentUser.name, 'customer')}
          alt={currentUser.name}
          className="w-20 h-20 rounded-full object-cover border-2 border-amber-500/50 shadow-md"
        />
        <div className="flex-1 text-center sm:text-left">
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-1">
            <ShieldCheck className="w-4 h-4" />
            <span>Verified Customer Account</span>
          </div>
          <h1 className="text-2xl font-serif font-black text-stone-100">{currentUser.name}</h1>
          <p className="text-xs text-stone-400 mt-1 flex items-center justify-center sm:justify-start gap-1">
            <MapPin className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {currentUser.city ? `${currentUser.city}, ` : ''}
              {currentUser.country}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveTab('following')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'following' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400'
            }`}
          >
            Following ({followingTailors.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'profile' ? 'bg-amber-500 text-stone-950' : 'bg-stone-950 text-stone-400'
            }`}
          >
            Settings
          </button>
        </div>
      </div>

      {/* Following Tailors Tab */}
      {activeTab === 'following' && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-100">
            Tailors You Follow ({followingTailors.length})
          </h2>

          {followingTailors.length === 0 ? (
            <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-stone-800 space-y-2">
              <Users className="w-10 h-10 text-stone-600 mx-auto" />
              <h3 className="text-sm font-bold text-stone-200">Not Following Any Tailors Yet</h3>
              <p className="text-xs text-stone-400">
                Explore the artisan directory to follow bespoke tailors and stay updated on new collections.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {followingTailors.map((tailor) => (
                <div key={tailor.id} className="p-5 rounded-2xl bg-stone-900 border border-stone-800 space-y-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={tailor.avatarUrl || generateAvatarUrl(tailor.name, 'tailor')}
                      alt={tailor.name}
                      className="w-12 h-12 rounded-full object-cover border border-amber-500/40"
                    />
                    <div className="min-w-0 flex-1">
                      <h3 className="text-xs font-bold text-stone-100 truncate">{tailor.name}</h3>
                      <p className="text-[11px] text-amber-400">{tailor.city}, {tailor.country}</p>
                      <span className="text-[10px] text-stone-400 font-mono">
                        ★ {tailor.ratingAverage.toFixed(1)} rating
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-stone-800">
                    <a
                      href={formatWhatsAppUrl(tailor.whatsappPhone || tailor.phone, tailor.name)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                    >
                      <Phone className="w-3 h-3" />
                      <span>WhatsApp</span>
                    </a>
                    <button
                      onClick={() => onSelectTailor(tailor)}
                      className="py-1.5 px-2 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 text-[11px] font-bold"
                    >
                      View Studio
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile Settings Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-4 text-xs">
          <h2 className="text-lg font-serif font-black text-stone-100">Customer Location & Avatar</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-stone-950 rounded-2xl border border-stone-800">
              <img
                src={avatarPreview || generateAvatarUrl(currentUser.name, 'customer')}
                alt="Avatar"
                className="w-14 h-14 rounded-full object-cover border border-amber-500"
              />
              <label className="px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg cursor-pointer">
                <span>Change DP</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const base64 = reader.result as string;
                      setAvatarPreview(base64);
                      try {
                        const res = await api.uploadImage(base64, `customer_dp_${Date.now()}`, 'avatars');
                        if (res.url) setAvatarPreview(res.url);
                      } catch (err) {
                        console.warn('Cached avatar');
                      }
                    };
                    reader.readAsDataURL(file);
                  }}
                  className="hidden"
                />
              </label>
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">State / Region</label>
                <input
                  type="text"
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
                />
              </div>
              <div>
                <label className="block font-semibold text-stone-300 mb-1">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow"
            >
              Update Preferences
            </button>
          </form>
        </div>
      )}
    </div>
  );
};
