import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Eye,
  Heart,
  MapPin,
  Crown,
  ShieldCheck,
  Tag,
  ArrowRight,
  Flame,
  Shirt
} from 'lucide-react';
import { Garment, User } from '../types';
import { formatWhatsAppUrl, generateAvatarUrl } from '../data/countries';

interface SmoothCarouselProps {
  garments: Garment[];
  onInspectGarment: (garment: Garment) => void;
  onSelectTailor: (tailorId: string) => void;
  onLikeGarment: (garment: Garment) => void;
  likedMap: Record<string, boolean>;
  onOpenAuth: (mode?: any) => void;
}

// Curated Showcase items across diverse styles (Streetwear, Ready-to-Wear, Agbada, Suits, Casual Luxe)
const SHOWCASE_STYLES: Partial<Garment>[] = [
  {
    id: 'showcase_streetwear_1',
    title: 'Urban Oversized Utility Bomber & Cargo Set',
    category: 'Streetwear & Urban Contemporary',
    description: 'Heavyweight matte twill fabric with modular pocket detailing, waterproof zip tracks, and tailored streetwear silhouette.',
    price: 45000,
    currency: '₦',
    imageUrl: 'https://images.unsplash.com/photo-1509631179647-0177331693ae?auto=format&fit=crop&w=1200&q=80',
    tags: ['streetwear', 'urban', 'bomber', 'cargo'],
    tailorName: 'Obsidian Street Atelier',
    tailorCity: 'Lagos',
    tailorCountry: 'Nigeria',
    tailorIsPromoted: true,
    likesCount: 142,
    averageRating: 4.9,
    ratingsCount: 28,
  },
  {
    id: 'showcase_ready_to_wear_2',
    title: 'Minimalist Italian Linen Double-Breasted Blazer',
    category: 'Ready-to-Wear & Everyday Luxe',
    description: 'Deconstructed shoulder pad silhouette crafted with breathable raw flax linen and horn buttons. Effortless everyday luxury.',
    price: 65000,
    currency: '₦',
    imageUrl: 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=1200&q=80',
    tags: ['ready-to-wear', 'blazer', 'linen', 'minimalist'],
    tailorName: 'Maison Aurelius',
    tailorCity: 'London',
    tailorCountry: 'United Kingdom',
    tailorIsPromoted: true,
    likesCount: 219,
    averageRating: 5.0,
    ratingsCount: 45,
  },
  {
    id: 'showcase_agbada_3',
    title: 'Imperial Hand-Embroidered Royal Agbada & Fila',
    category: 'Traditional (Agbada, Kaftan, Senator)',
    description: '3-Piece Grand Royal ensemble cut from gold-threaded Aso-Oke with geometric crystal chain-stitch embroidery on chest and shoulders.',
    price: 95000,
    currency: '₦',
    imageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=80',
    tags: ['agbada', 'royal', 'embroidery', 'traditional'],
    tailorName: 'Adeleke Heritage Tailors',
    tailorCity: 'Ibadan',
    tailorCountry: 'Nigeria',
    tailorIsPromoted: true,
    likesCount: 380,
    averageRating: 5.0,
    ratingsCount: 62,
  },
  {
    id: 'showcase_couture_4',
    title: 'Architectural Corseted Velvet Evening Gown',
    category: 'Bridal & Haute Couture',
    description: 'Deep emerald French micro-velvet structured with internal steel boning and an asymmetric cascading silk taffeta train.',
    price: 150000,
    currency: '₦',
    imageUrl: 'https://images.unsplash.com/photo-1566174053879-31528523f8ae?auto=format&fit=crop&w=1200&q=80',
    tags: ['corset', 'velvet', 'bridal', 'haute-couture'],
    tailorName: 'Valerie Vance Couture',
    tailorCity: 'Paris',
    tailorCountry: 'France',
    tailorIsPromoted: true,
    likesCount: 412,
    averageRating: 4.9,
    ratingsCount: 77,
  },
  {
    id: 'showcase_denim_5',
    title: 'Sashiko Reconstructed Raw Denim Jacket',
    category: 'Denim & Leathercraft',
    description: 'Japanese 14oz selvedge denim hand-stitched with indigo boro patches and custom engraved copper rivets.',
    price: 52000,
    currency: '₦',
    imageUrl: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=1200&q=80',
    tags: ['denim', 'streetwear', 'vintage', 'raw-selvedge'],
    tailorName: 'Tokyo Stitch Works',
    tailorCity: 'Tokyo',
    tailorCountry: 'Japan',
    tailorIsPromoted: false,
    likesCount: 195,
    averageRating: 4.8,
    ratingsCount: 34,
  }
];

export const SmoothCarousel: React.FC<SmoothCarouselProps> = ({
  garments,
  onInspectGarment,
  onSelectTailor,
  onLikeGarment,
  likedMap,
  onOpenAuth,
}) => {
  // Combine real uploaded garments (filtered by imageUrl) with showcase fallback styles
  const realItems = garments.filter((g) => g.imageUrl && g.imageUrl.trim() !== '');
  const activeItems: (Garment | Partial<Garment>)[] = realItems.length > 0
    ? [...realItems, ...SHOWCASE_STYLES.slice(0, Math.max(0, 5 - realItems.length))]
    : SHOWCASE_STYLES;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const autoPlayDuration = 5500; // 5.5s per slide

  // Next / Prev slide handlers
  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % activeItems.length);
    setProgress(0);
  };

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + activeItems.length) % activeItems.length);
    setProgress(0);
  };

  // Auto-play timer with smooth progress bar
  useEffect(() => {
    if (activeItems.length <= 1 || isPaused) return;

    const interval = 50; // Update progress bar every 50ms
    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          nextSlide();
          return 0;
        }
        return prev + (interval / autoPlayDuration) * 100;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused, activeItems.length]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (diff > 45) nextSlide();
    else if (diff < -45) prevSlide();
    touchStartX.current = null;
  };

  const currentItem = activeItems[currentIndex] || activeItems[0];

  return (
    <div
      id="smooth-fashion-carousel"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative rounded-3xl bg-[#0a0a0a] border border-white/10 overflow-hidden shadow-2xl transition-all duration-300"
    >
      {/* Top Animated Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-white/10 z-30">
        <div
          className="h-full bg-gradient-to-r from-amber-500 via-yellow-400 to-amber-300 transition-all duration-75"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main Slide Presentation Track */}
      <div className="relative min-h-[360px] sm:min-h-[420px] md:h-[460px] w-full flex flex-col md:flex-row overflow-hidden">
        {/* Left/Main Image Showcase Container */}
        <div className="relative w-full md:w-3/5 h-64 sm:h-72 md:h-full bg-[#050505] overflow-hidden group">
          <img
            key={currentItem.id}
            src={currentItem.imageUrl}
            alt={currentItem.title}
            className="w-full h-full object-cover object-center transition-transform duration-1000 ease-out group-hover:scale-105"
          />

          {/* Luxury Edge Gradient Vignette */}
          <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-black/80 via-black/20 to-transparent pointer-events-none" />

          {/* S3 Security / Verified Badge */}
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-black/70 backdrop-blur-md border border-amber-500/30 text-amber-400 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1.5 shadow-lg">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>AWS S3 CLOUD SYNCED</span>
            </span>

            {currentItem.tailorIsPromoted && (
              <span className="px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-black uppercase flex items-center gap-1 shadow-md">
                <Crown className="w-3 h-3" />
                <span>FEATURED SPOTLIGHT</span>
              </span>
            )}
          </div>

          {/* Floating Category Pill */}
          <div className="absolute bottom-4 left-4 z-20 flex items-center gap-2">
            <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-md border border-white/15 text-stone-200 text-xs font-semibold">
              {currentItem.category || 'Contemporary Fashion'}
            </span>
          </div>
        </div>

        {/* Right Info & Interaction Panel */}
        <div className="w-full md:w-2/5 p-6 sm:p-8 flex flex-col justify-between bg-[#0a0a0a] border-t md:border-t-0 md:border-l border-white/10">
          <div className="space-y-4">
            {/* Tag Pills */}
            <div className="flex flex-wrap items-center gap-1.5">
              {(currentItem.tags || ['bespoke', 'ready-to-wear', 'fashion']).slice(0, 3).map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-amber-400/90 text-[10px] font-mono tracking-tight"
                >
                  #{tag}
                </span>
              ))}
            </div>

            {/* Title */}
            <h2 className="text-xl sm:text-2xl font-serif font-black text-white leading-snug line-clamp-2">
              {currentItem.title}
            </h2>

            {/* Description */}
            <p className="text-xs text-gray-400 line-clamp-3 leading-relaxed font-light">
              {currentItem.description || 'Exquisite tailoring combining precise structural fitting, premium textiles, and signature hand-finishing.'}
            </p>

            {/* Tailor Brand Profile Preview */}
            <div
              onClick={() => {
                if (currentItem.tailorId) onSelectTailor(currentItem.tailorId);
              }}
              className="flex items-center gap-3 p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 cursor-pointer transition-all"
            >
              <img
                src={currentItem.tailorAvatar || generateAvatarUrl(currentItem.tailorName || 'Tailor', 'tailor')}
                alt={currentItem.tailorName || 'Tailor'}
                className="w-11 h-11 rounded-full border border-amber-500/40 object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-xs font-bold text-white truncate">{currentItem.tailorName || 'Master Artisan'}</p>
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                </div>
                <p className="text-[11px] text-gray-400 flex items-center gap-1 truncate">
                  <MapPin className="w-3 h-3 text-amber-400 shrink-0" />
                  <span>{currentItem.tailorCity || 'Lagos'}, {currentItem.tailorCountry || 'Nigeria'}</span>
                </p>
              </div>

              <div className="text-right">
                <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5 justify-end">
                  ★ {currentItem.averageRating || 5.0}
                </span>
                <span className="text-[10px] text-gray-500 block">({currentItem.ratingsCount || 12} reviews)</span>
              </div>
            </div>
          </div>

          {/* Pricing & Call to Actions */}
          <div className="pt-5 mt-4 border-t border-white/10 flex items-center justify-between gap-3">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-mono tracking-wider block">Estimated Price</span>
              <span className="text-lg sm:text-xl font-bold font-serif text-amber-400">
                {currentItem.currency || '₦'}
                {currentItem.price && currentItem.price > 0
                  ? currentItem.price.toLocaleString()
                  : 'Consultation'}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onLikeGarment(currentItem as Garment)}
                className={`p-2.5 rounded-xl border transition-all ${
                  likedMap[currentItem.id || '']
                    ? 'bg-red-500/20 border-red-500/60 text-red-400'
                    : 'bg-white/5 border-white/10 text-gray-400 hover:text-white'
                }`}
                title="Like design"
              >
                <Heart className={`w-4 h-4 ${likedMap[currentItem.id || ''] ? 'fill-current' : ''}`} />
              </button>

              <button
                type="button"
                onClick={() => onInspectGarment(currentItem as Garment)}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-stone-950 font-black text-xs shadow-lg hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Inspect Design</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        type="button"
        onClick={prevSlide}
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all shadow-xl"
        title="Previous slide"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>

      <button
        type="button"
        onClick={nextSlide}
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/70 backdrop-blur-md border border-white/20 text-white hover:bg-amber-500 hover:text-stone-950 flex items-center justify-center transition-all shadow-xl"
        title="Next slide"
      >
        <ChevronRight className="w-5 h-5" />
      </button>

      {/* Slide Thumb Indicator Dots */}
      <div className="absolute bottom-3 right-6 z-20 hidden sm:flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
        {activeItems.map((_, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              setCurrentIndex(idx);
              setProgress(0);
            }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === currentIndex ? 'w-6 bg-amber-400' : 'w-1.5 bg-white/30 hover:bg-white/60'
            }`}
          />
        ))}
      </div>
    </div>
  );
};
