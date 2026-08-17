import React, { useState } from 'react';
import {
  Scissors,
  UserCheck,
  Sparkles,
  MapPin,
  MessageCircle,
  Star,
  ShieldCheck,
  ArrowRight,
  TrendingUp,
  Award,
  Layers,
  ChevronDown,
  Globe,
  Camera,
  CheckCircle2,
  Heart,
  PhoneCall,
  Crown
} from 'lucide-react';
import { Logo } from './Logo';
import { COUNTRIES } from '../data/countries';

interface LandingPageProps {
  onOpenAuth: (mode: 'login' | 'register_tailor' | 'register_customer') => void;
  openLegalModal: (type: 'terms' | 'privacy') => void;
  onExploreClick: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenAuth,
  openLegalModal,
  onExploreClick,
}) => {
  const [selectedDemoCountry, setSelectedDemoCountry] = useState('Nigeria');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  const faqs = [
    {
      q: 'How does Fabric Reality connect me with bespoke tailors?',
      a: 'Fabric Reality intelligently pairs customers with certified bespoke artisans based on precise geographic proximity (Country, State, and City) and garment specialty tags like Agbada, Senator, Tuxedos, and Bridal Gowns. You can view their original portfolios, verify customer ratings, and contact them instantly via in-app chat or WhatsApp.'
    },
    {
      q: 'How do Tailors upload and showcase their clothing designs?',
      a: 'Tailors can create their custom digital portfolio studio in minutes, upload high-resolution garment photos directly to secure Amazon AWS S3 storage, tag their creations with smart keywords, organize them into curated collections, and set their transparent pricing guides.'
    },
    {
      q: 'How does the Rating and Review system work?',
      a: 'To guarantee genuine trust, only verified customers can rate garments and tailors with 1-5 star reviews. Top-rated tailors receive higher search ranking and trending visibility in the community feed.'
    },
    {
      q: 'What is the Tailor Promotion Center and how does it work?',
      a: 'Tailors who want to amplify their reach can select verified promotional packages (such as Spotlight Gold). Picking a plan opens direct invoice coordination with our administrative desk (08029772375). Promoted tailors earn the verified gold ribbon, top carousel features, and 5x search visibility.'
    }
  ];

  return (
    <div className="relative min-h-screen bg-[#050505] text-[#E0E0E0] selection:bg-amber-500 selection:text-black font-sans overflow-hidden">
      {/* Background Atmosphere Lights */}
      <div className="absolute top-[-100px] right-[-100px] w-[500px] h-[500px] bg-amber-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-100px] left-[-100px] w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Hero Section */}
      <section className="relative pt-8 pb-16 lg:pt-16 lg:pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">

          {/* Left Column: Hero Content & CTA Cards */}
          <div className="lg:col-span-7 flex flex-col justify-center gap-6">
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-full w-fit">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
              <span className="text-[11px] uppercase tracking-wider text-amber-400 font-bold">
                Secure S3 Storage Integrated & Geo-Matching
              </span>
            </div>

            {/* Main Headline */}
            <h1 className="text-5xl sm:text-7xl font-bold leading-tight text-white tracking-tight">
              Tailor your <br />
              <span className="italic font-serif text-amber-500">Reality.</span>
            </h1>

            {/* Subtext */}
            <p className="text-base sm:text-lg text-gray-400 max-w-xl leading-relaxed font-light">
              Connect with elite artisans or showcase your craft. Real-time geo-matching for bespoke fashion near you with certified customer ratings and AWS S3 portfolio sync.
            </p>

            {/* Interactive Choice Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2 max-w-lg">
              <button
                onClick={() => onOpenAuth('register_tailor')}
                className="group flex flex-col items-center justify-center p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-amber-500/50 hover:bg-amber-500/5 transition-all text-left cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Scissors className="w-6 h-6 text-amber-500" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-white">I am a Tailor</span>
                <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Build your Portfolio</span>
              </button>

              <button
                onClick={() => onOpenAuth('register_customer')}
                className="group flex flex-col items-center justify-center p-6 border border-white/10 bg-white/5 rounded-2xl hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-left cursor-pointer"
              >
                <div className="w-12 h-12 bg-white/10 rounded-full mb-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <UserCheck className="w-6 h-6 text-blue-400" />
                </div>
                <span className="text-sm font-semibold uppercase tracking-widest text-white">Find a Tailor</span>
                <span className="text-[10px] text-gray-500 mt-1 uppercase tracking-wider">Smart Geo-Search</span>
              </button>
            </div>

            {/* Secondary Direct Link */}
            <div>
              <button
                onClick={() => onExploreClick()}
                className="inline-flex items-center gap-2 text-xs font-semibold text-stone-400 hover:text-amber-400 transition-colors uppercase tracking-wider"
              >
                <span>Explore master lookbooks & live feed without account</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            </div>
          </div>

          {/* Right Column: Interactive Phone Mockup with Lookbook Showcase */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            <div className="relative w-80 sm:w-88 h-[480px] bg-[#111111] rounded-[40px] border-[8px] border-[#222222] shadow-2xl shadow-black/80 overflow-hidden flex flex-col justify-between">
              {/* Notch */}
              <div className="h-5 w-1/3 bg-[#222222] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-xl z-30 flex items-center justify-center">
                <div className="w-3 h-3 rounded-full bg-stone-900 border border-stone-800" />
              </div>

              {/* Screen Contents */}
              <div className="p-5 pt-8 flex flex-col gap-4 flex-1 overflow-hidden">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white uppercase tracking-wider">Trending Now</span>
                  <div className="w-7 h-7 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                  </div>
                </div>

                {/* Garment Preview Box */}
                <div className="relative h-56 bg-stone-900 rounded-2xl border border-white/5 overflow-hidden group">
                  <img
                    src="https://images.unsplash.com/photo-1594938298603-c8148c4dae35?w=800&auto=format&fit=crop&q=80"
                    alt="Royal Agbada"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                  <div className="absolute bottom-3 left-3 right-3 flex items-end justify-between">
                    <div>
                      <span className="bg-black/60 backdrop-blur-md px-2 py-0.5 rounded text-[9px] text-amber-400 font-bold uppercase tracking-wider">
                        #AGBADA
                      </span>
                      <h4 className="text-xs font-bold text-white mt-1">Royal Gold-Embroidered Robe</h4>
                    </div>
                    <span className="text-xs font-serif font-black text-amber-400">₦125,000</span>
                  </div>
                </div>

                {/* Tailor Info Card */}
                <div className="flex flex-col gap-2 bg-white/5 p-3 rounded-xl border border-white/5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-white">Amina Couture Studio</span>
                    <span className="text-xs font-bold text-amber-400">★ 4.9</span>
                  </div>
                  <div className="flex gap-2">
                    <div className="px-2.5 py-0.5 bg-white/5 rounded-full text-[9px] uppercase tracking-wider text-stone-300">Lagos, NG</div>
                    <div className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 rounded-full text-[9px] uppercase tracking-wider font-bold">Bespoke Master</div>
                  </div>
                  <button
                    onClick={() => onOpenAuth('register_customer')}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-400 text-black text-[11px] font-bold rounded-lg mt-1 transition-colors"
                  >
                    Follow Artisan Studio
                  </button>
                </div>
              </div>

              {/* Mockup Bottom Navigation Bar */}
              <div className="h-12 bg-[#181818] border-t border-white/5 flex justify-around items-center px-4">
                <Scissors className="w-4 h-4 text-amber-500" />
                <Sparkles className="w-4 h-4 text-stone-500" />
                <MessageCircle className="w-4 h-4 text-stone-500" />
                <UserCheck className="w-4 h-4 text-stone-500" />
              </div>
            </div>

            {/* Rotating Decorative Badge */}
            <div className="absolute -bottom-4 -right-4 w-28 h-28 border-2 border-dashed border-amber-500/20 rounded-full flex items-center justify-center animate-spin-slow pointer-events-none hidden sm:flex">
              <div className="w-20 h-20 border border-amber-500/40 rounded-full flex items-center justify-center bg-[#050505]/80 backdrop-blur-sm">
                <span className="text-[8px] text-amber-500 uppercase tracking-widest text-center font-bold">
                  Bespoke<br />Cloud
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Trust Metrics Bar */}
        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto border-t border-white/10 pt-10">
          <div className="p-4 text-center border border-white/5 bg-white/5 rounded-2xl">
            <div className="text-2xl sm:text-3xl font-black font-serif text-amber-400">100%</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Real Tailor Photos</div>
          </div>
          <div className="p-4 text-center border border-white/5 bg-white/5 rounded-2xl">
            <div className="text-2xl sm:text-3xl font-black font-serif text-amber-400">45+</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">Countries Supported</div>
          </div>
          <div className="p-4 text-center border border-white/5 bg-white/5 rounded-2xl">
            <div className="text-2xl sm:text-3xl font-black font-serif text-amber-400">Direct</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">WhatsApp & Chat</div>
          </div>
          <div className="p-4 text-center border border-white/5 bg-white/5 rounded-2xl">
            <div className="text-2xl sm:text-3xl font-black font-serif text-amber-400">S3 Cloud</div>
            <div className="text-xs uppercase tracking-wider text-gray-400 mt-1">AWS Storage</div>
          </div>
        </div>
      </section>

      {/* Interactive Location Matching Feature Showcase */}
      <section className="py-16 bg-white/[0.02] border-y border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 uppercase tracking-widest mb-2">
              <MapPin className="w-4 h-4" />
              <span>Smart Geolocation Matching</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">
              Find Master Tailors Right Around Your Corner
            </h2>
            <p className="text-sm text-stone-400 mt-3 font-light">
              Customers specify their country and city. Fabric Reality immediately calculates proximity and surfaces certified artisans who specialize in your desired styles.
            </p>
          </div>

          {/* Interactive Match Card Preview */}
          <div className="bg-[#0c0c0c] rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl max-w-4xl mx-auto">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-6 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                  <Globe className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Select Your Target Region</h3>
                  <p className="text-xs text-stone-400">Simulate how customers find tailors in their local area</p>
                </div>
              </div>

              <select
                value={selectedDemoCountry}
                onChange={(e) => setSelectedDemoCountry(e.target.value)}
                className="w-full sm:w-auto px-4 py-2.5 bg-black/60 border border-white/15 rounded-xl text-stone-100 font-medium text-xs focus:outline-none focus:border-amber-500"
              >
                {COUNTRIES.slice(0, 15).map((c) => (
                  <option key={c.code} value={c.name} className="bg-stone-900 text-white">
                    {c.flag} {c.name} ({c.dialCode})
                  </option>
                ))}
              </select>
            </div>

            <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-400">Proximity Match</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-mono font-bold">NEARBY</span>
                </div>
                <h4 className="text-sm font-bold text-white">Local City Indexing</h4>
                <p className="text-xs text-stone-400 mt-1">Automatic distance calculation matching state, city, and region in {selectedDemoCountry}.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-400">Dial Code Lock</span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-mono font-bold">VERIFIED</span>
                </div>
                <h4 className="text-sm font-bold text-white">Validated Phone & WhatsApp</h4>
                <p className="text-xs text-stone-400 mt-1">Country codes are dynamically locked to prevent invalid numbers and enable seamless WhatsApp routing.</p>
              </div>

              <div className="p-5 rounded-2xl bg-white/5 border border-white/10 hover:border-amber-500/40 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-amber-400">Tag Filtering</span>
                  <span className="px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 text-[10px] font-mono font-bold">SMART</span>
                </div>
                <h4 className="text-sm font-bold text-white">Authentic Garment Tags</h4>
                <p className="text-xs text-stone-400 mt-1">Instant discovery across Agbada, Kaftan, Senator, Suits, and Bridal categories.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* For Tailors vs For Customers Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl sm:text-4xl font-serif font-black text-white">
            A Purpose-Built Ecosystem for Bespoke Fashion
          </h2>
          <p className="text-sm text-stone-400 mt-2 font-light">
            Tailored tools for fashion artisans, and seamless custom discovery for clients.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Tailor Card */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-amber-500/30 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-black flex items-center justify-center font-black">
                <Scissors className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Master Artisans</span>
                <h3 className="text-2xl font-serif font-bold text-white">For Bespoke Tailors</h3>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-stone-300">
              <li className="flex items-start gap-3">
                <Camera className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>High-Resolution Portfolio Studio:</strong> Upload authentic garment photos directly to Amazon S3 cloud storage with tags, fabric types, and turnaround days.</span>
              </li>
              <li className="flex items-start gap-3">
                <Layers className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Curated Collections:</strong> Organize your bespoke designs into seasonal lookbooks and bridal catalogues.</span>
              </li>
              <li className="flex items-start gap-3">
                <PhoneCall className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Direct WhatsApp Inquiries:</strong> Route customers straight to your WhatsApp (or in-app chat) with the exact garment they want.</span>
              </li>
              <li className="flex items-start gap-3">
                <Crown className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Promotion Center:</strong> Pick verified plans to secure top carousel highlights, gold badges, and 5x search visibility.</span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('register_tailor')}
                className="w-full py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20"
              >
                <span>Create Tailor Studio Account</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Customer Card */}
          <div className="p-8 rounded-3xl bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-white/10 text-amber-400 flex items-center justify-center font-black">
                <UserCheck className="w-6 h-6" />
              </div>
              <div>
                <span className="text-xs font-bold text-stone-400 tracking-wider uppercase">Discerning Clients</span>
                <h3 className="text-2xl font-serif font-bold text-white">For Fashion Customers</h3>
              </div>
            </div>

            <ul className="space-y-4 text-sm text-stone-300">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Nearby Tailor Matching:</strong> Find skilled artisans in your city, filter by specialty, and view their exact contact info.</span>
              </li>
              <li className="flex items-start gap-3">
                <Star className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Verified Ratings & Reviews:</strong> Rate garments and tailor service. Read genuine feedback from other customers.</span>
              </li>
              <li className="flex items-start gap-3">
                <Heart className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Follow & Wishlist:</strong> Follow your favorite tailors to get notifications when they publish new collections.</span>
              </li>
              <li className="flex items-start gap-3">
                <MessageCircle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <span><strong>Consultation & Measurements:</strong> Send measurements and inquire about fabric sourcing in live chat.</span>
              </li>
            </ul>

            <div className="mt-8 pt-6 border-t border-white/10">
              <button
                onClick={() => onOpenAuth('register_customer')}
                className="w-full py-4 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 border border-white/20"
              >
                <span>Join as a Customer</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-16 bg-white/[0.02] border-t border-white/5 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-xl mx-auto mb-12">
            <h2 className="text-3xl font-serif font-black text-white">Loved by Tailors & Clients Worldwide</h2>
            <p className="text-xs text-stone-400 mt-2 font-light">Real experiences from our bespoke community.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "Fabric Reality doubled my bespoke Agbada orders within three weeks. Customers find me by my Ikeja location, review my AWS S3 portfolio, and WhatsApp me directly."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-amber-600 flex items-center justify-center font-bold text-black text-xs">
                  KB
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Kareem Babatunde</div>
                  <div className="text-[10px] text-amber-400">Master Couture Tailor • Lagos, Nigeria</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "Finding a master tailor for my wedding suit who truly understood bespoke wool blends was difficult until I searched Fabric Reality. The fit was 100% immaculate."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white text-xs">
                  DA
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Dr. David Adeleke</div>
                  <div className="text-[10px] text-stone-400">Customer • London & Abuja</div>
                </div>
              </div>
            </div>

            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 space-y-4">
              <div className="flex items-center text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <p className="text-xs text-stone-300 leading-relaxed italic">
                "The promotion center was worth every penny. Getting featured on the top carousel brought diaspora clients ordering custom Senator suits for ceremonies."
              </p>
              <div className="flex items-center gap-3 pt-2 border-t border-white/5">
                <div className="w-9 h-9 rounded-full bg-emerald-600 flex items-center justify-center font-bold text-white text-xs">
                  CO
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Chidi Okafor</div>
                  <div className="text-[10px] text-amber-400">Creative Director, Royal Senator • Accra</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Accordion */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-serif font-black text-white">Frequently Asked Questions</h2>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, index) => {
            const isOpen = openFaqIndex === index;
            return (
              <div
                key={index}
                className="rounded-2xl bg-white/5 border border-white/10 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                  className="w-full px-6 py-4 flex items-center justify-between text-left text-stone-200 font-semibold text-sm hover:text-amber-400 transition-colors"
                >
                  <span>{faq.q}</span>
                  <ChevronDown className={`w-4 h-4 text-amber-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-6 pb-4 text-xs text-stone-400 leading-relaxed border-t border-white/5 pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
