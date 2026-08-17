import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  Star,
  MessageSquare,
  Phone,
  Scissors,
  Users,
  Clock,
  Layers,
  Crown,
  Share2,
  CheckCircle2,
  Calendar,
  DollarSign,
  Heart
} from 'lucide-react';
import { User, Garment, Collection, Review } from '../types';
import { api } from '../services/api';
import { formatWhatsAppUrl, generateAvatarUrl } from '../data/countries';

interface TailorStudioViewProps {
  tailor: User;
  currentUser: User | null;
  onClose: () => void;
  onStartChat: (recipient: User, garment?: Garment) => void;
  onOpenAuth: (mode?: any) => void;
}

export const TailorStudioView: React.FC<TailorStudioViewProps> = ({
  tailor,
  currentUser,
  onClose,
  onStartChat,
  onOpenAuth,
}) => {
  const [garments, setGarments] = useState<Garment[]>([]);
  const [collections, setCollections] = useState<Collection[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(tailor.followersCount);
  const [activeTab, setActiveTab] = useState<'garments' | 'collections' | 'pricing' | 'reviews'>('garments');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTailorDetails();
    if (currentUser?.followingIds) {
      setIsFollowing(currentUser.followingIds.includes(tailor.id));
    }
  }, [tailor.id]);

  const fetchTailorDetails = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTailorDetails(tailor.id);
      if (res.garments) setGarments(res.garments);
      if (res.collections) setCollections(res.collections);
      if (res.reviews) setReviews(res.reviews);
    } catch (err) {
      console.error('Error fetching tailor details:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    try {
      const res = await api.toggleFollow(currentUser.id, tailor.id);
      if (res && res.isFollowing !== undefined) {
        setIsFollowing(res.isFollowing);
        setFollowersCount(res.followersCount);
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  const whatsAppUrl = formatWhatsAppUrl(
    tailor.whatsappPhone || tailor.phone,
    tailor.name
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl my-8 bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-full bg-stone-950/80 text-stone-300 hover:text-white border border-stone-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Top Banner & Header */}
        <div className="relative p-6 sm:p-8 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 border-b border-stone-800">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <img
                  src={tailor.avatarUrl || generateAvatarUrl(tailor.name, 'tailor')}
                  alt={tailor.name}
                  className="w-20 h-20 sm:w-24 sm:h-24 rounded-3xl object-cover border-2 border-amber-500/60 shadow-xl"
                />
                {tailor.isPromoted && (
                  <div className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-amber-500 text-stone-950 shadow-md">
                    <Crown className="w-4 h-4" />
                  </div>
                )}
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl sm:text-2xl font-serif font-black text-stone-100">{tailor.name}</h1>
                  {tailor.isPromoted && (
                    <span className="px-2.5 py-0.5 rounded-full bg-amber-500 text-stone-950 text-[10px] font-black uppercase">
                      PROMOTED ARTISAN
                    </span>
                  )}
                </div>

                <p className="text-xs text-amber-400 font-medium flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 shrink-0" />
                  <span>
                    {tailor.city ? `${tailor.city}, ` : ''}
                    {tailor.state ? `${tailor.state}, ` : ''}
                    {tailor.country}
                  </span>
                </p>

                <div className="flex items-center gap-4 mt-2 text-xs">
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    <Star className="w-3.5 h-3.5 fill-amber-400" />
                    {tailor.ratingAverage.toFixed(1)} ({tailor.ratingCount} reviews)
                  </span>

                  <span className="text-stone-300 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5" />
                    {followersCount} Followers
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <a
                href={whatsAppUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <Phone className="w-4 h-4" />
                <span>WhatsApp</span>
              </a>

              <button
                onClick={() => {
                  if (!currentUser) onOpenAuth('login');
                  else onStartChat(tailor);
                }}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1.5 shadow"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Chat</span>
              </button>

              <button
                onClick={handleFollowToggle}
                className={`px-3 py-2.5 rounded-xl text-xs font-bold transition-all border ${
                  isFollowing
                    ? 'bg-stone-800 text-stone-300 border-stone-700'
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                }`}
              >
                {isFollowing ? 'Following ✓' : 'Follow'}
              </button>
            </div>
          </div>

          {/* Bio & Specialties */}
          <p className="text-xs text-stone-300 mt-4 leading-relaxed max-w-3xl">
            {tailor.bio || 'Master bespoke tailor dedicated to crafting luxury traditional and modern attires with premium quality fabrics.'}
          </p>

          {tailor.specialties && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tailor.specialties.map((spec) => (
                <span
                  key={spec}
                  className="px-2.5 py-1 rounded-lg bg-stone-950 text-amber-300 border border-stone-800 text-xs font-medium"
                >
                  #{spec}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Tab Headers */}
        <div className="flex items-center gap-2 px-6 py-3 bg-stone-950 border-b border-stone-800 text-xs font-bold">
          <button
            onClick={() => setActiveTab('garments')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'garments' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Portfolio Garments ({garments.length})
          </button>
          <button
            onClick={() => setActiveTab('collections')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'collections' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Collections ({collections.length})
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'pricing' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Pricing & Hours
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-4 py-1.5 rounded-xl transition-all ${
              activeTab === 'reviews' ? 'bg-amber-500 text-stone-950' : 'text-stone-400 hover:text-stone-200'
            }`}
          >
            Customer Reviews ({reviews.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-4">
          {activeTab === 'garments' && (
            <div>
              {garments.length === 0 ? (
                <div className="p-12 text-center text-stone-500 text-xs">
                  This tailor has not published any garments yet. Check back soon!
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {garments.map((g) => (
                    <div key={g.id} className="rounded-2xl bg-stone-950 border border-stone-800 overflow-hidden space-y-2 p-2.5">
                      <div className="relative aspect-[4/5] rounded-xl overflow-hidden bg-stone-900">
                        <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                      </div>
                      <h4 className="text-xs font-bold text-stone-100 truncate">{g.title}</h4>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-amber-400 font-bold">
                          {g.currency}{g.price > 0 ? g.price.toLocaleString() : 'Price on Inquiry'}
                        </span>
                        <span className="text-stone-400 text-[11px] flex items-center gap-1">
                          <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                          {g.averageRating ? g.averageRating.toFixed(1) : '5.0'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'collections' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {collections.length === 0 ? (
                <div className="col-span-2 p-8 text-center text-stone-500 text-xs">
                  No curated collections available.
                </div>
              ) : (
                collections.map((col) => (
                  <div key={col.id} className="p-5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                    <h4 className="text-sm font-bold text-stone-100">{col.title}</h4>
                    <p className="text-xs text-stone-400">{col.description}</p>
                    <span className="text-[11px] text-amber-400 font-mono block pt-2">
                      {col.itemCount || 0} Garments included
                    </span>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'pricing' && (
            <div className="space-y-4 max-w-xl mx-auto">
              <div className="p-4 bg-stone-950 rounded-2xl border border-stone-800 text-xs">
                <span className="text-stone-400 block mb-1">Standard Studio Operating Hours</span>
                <span className="font-bold text-stone-100">
                  {tailor.availability || 'Mon - Sat: 9:00 AM - 7:00 PM'}
                </span>
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-amber-400">Standard Service Rate Sheet</h4>
                {(
                  tailor.pricingGuide || [
                    { service: 'Bespoke Senator / Kaftan (2pc)', estimatedPrice: '₦20,000 - ₦35,000', turnaround: '3-5 Days' },
                    { service: 'Grand 3-Piece Agbada', estimatedPrice: '₦40,000 - ₦80,000', turnaround: '5-7 Days' },
                    { service: 'Bespoke 2-Piece Suit', estimatedPrice: '₦50,000 - ₦110,000', turnaround: '7-10 Days' },
                  ]
                ).map((rate, idx) => (
                  <div key={idx} className="p-3 bg-stone-950 rounded-xl border border-stone-800 flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-stone-200 block">{rate.service}</span>
                      <span className="text-[10px] text-stone-400">{rate.turnaround}</span>
                    </div>
                    <span className="font-serif font-black text-amber-400">{rate.estimatedPrice}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div className="space-y-3">
              {reviews.length === 0 ? (
                <div className="p-8 text-center text-stone-500 text-xs">
                  No verified customer reviews submitted yet. Be the first customer to rate this tailor!
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="p-4 rounded-2xl bg-stone-950 border border-stone-800 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-stone-200">{rev.customerName}</span>
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400" />
                        {rev.rating} / 5
                      </div>
                    </div>
                    <p className="text-stone-300">{rev.comment}</p>
                    <span className="text-[10px] text-stone-500 block">
                      {new Date(rev.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
