import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Search,
  Filter,
  Star,
  MessageSquare,
  Phone,
  Scissors,
  Users,
  Crown,
  Grid,
  Map as MapIcon,
  ChevronRight
} from 'lucide-react';
import { User, Garment } from '../types';
import { api } from '../services/api';
import { COUNTRIES, formatWhatsAppUrl, generateAvatarUrl, POPULAR_TAGS } from '../data/countries';

interface TailorDirectoryProps {
  currentUser: User | null;
  onSelectTailor: (tailor: User) => void;
  onStartChat: (recipient: User, garment?: Garment) => void;
  onOpenAuth: (mode?: any) => void;
}

export const TailorDirectory: React.FC<TailorDirectoryProps> = ({
  currentUser,
  onSelectTailor,
  onStartChat,
  onOpenAuth,
}) => {
  const [tailors, setTailors] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<string>(currentUser?.country || '');
  const [selectedState, setSelectedState] = useState<string>('');
  const [selectedCity, setSelectedCity] = useState<string>('');
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});

  // Dynamic Location Lists
  const [countriesList, setCountriesList] = useState<any[]>([]);
  const [statesList, setStatesList] = useState<any[]>([]);
  const [citiesList, setCitiesList] = useState<any[]>([]);
  const [loadingLocations, setLoadingLocations] = useState({
    countries: false,
    states: false,
    cities: false,
  });
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [promotedOnly, setPromotedOnly] = useState(false);

  // Fetch countries on component mount
  useEffect(() => {
    const loadCountries = async () => {
      setLoadingLocations(prev => ({ ...prev, countries: true }));
      try {
        const list = await api.getCountries();
        if (list && list.length > 0) {
          setCountriesList(list);
        } else {
          setCountriesList(COUNTRIES);
        }
      } catch (err) {
        console.warn("Failed to fetch countries, falling back to static list:", err);
        setCountriesList(COUNTRIES);
      } finally {
        setLoadingLocations(prev => ({ ...prev, countries: false }));
      }
    };
    loadCountries();
  }, []);

  // Fetch states when selected country changes
  useEffect(() => {
    const loadStates = async () => {
      if (!selectedCountry) {
        setStatesList([]);
        setCitiesList([]);
        setSelectedState('');
        setSelectedCity('');
        return;
      }


      const countryObj = countriesList.find(c => c.name === selectedCountry);
      if (!countryObj) {
        setStatesList([]);
        setCitiesList([]);
        setSelectedState('');
        setSelectedCity('');
        return;
      }

      setLoadingLocations(prev => ({ ...prev, states: true }));
      setStatesList([]);
      setCitiesList([]);
      setSelectedState('');
      setSelectedCity('');
      try {
        const list = await api.getStates(countryObj.code);
        setStatesList(list);
      } catch (err) {
        console.error("Failed to fetch states for " + countryObj.code, err);
      } finally {
        setLoadingLocations(prev => ({ ...prev, states: false }));
      }
    };
    loadStates();
  }, [selectedCountry, countriesList]);

  // Fetch cities when selected state changes
  useEffect(() => {
    const loadCities = async () => {
      if (!selectedState || !selectedCountry) {
        setCitiesList([]);
        setSelectedCity('');
        return;
      }

      const countryObj = countriesList.find(c => c.name === selectedCountry);
      const stateObj = statesList.find(s => s.name === selectedState);
      if (!countryObj || !stateObj) {
        setCitiesList([]);
        setSelectedCity('');
        return;
      }

      setLoadingLocations(prev => ({ ...prev, cities: true }));
      setCitiesList([]);
      setSelectedCity('');
      try {
        const list = await api.getCities(countryObj.code, stateObj.iso2);
        setCitiesList(list);
      } catch (err) {
        console.error("Failed to fetch cities for " + stateObj.iso2, err);
      } finally {
        setLoadingLocations(prev => ({ ...prev, cities: false }));
      }
    };
    loadCities();
  }, [selectedState, selectedCountry, countriesList, statesList]);

  useEffect(() => {
    fetchTailors();
  }, [selectedCountry, selectedState, selectedCity, selectedTag, promotedOnly, searchQuery]);

  const fetchTailors = async () => {
    setIsLoading(true);
    try {
      const res = await api.getTailors({
        country: selectedCountry || undefined,
        state: selectedState || undefined,
        city: selectedCity || undefined,
        tag: selectedTag || undefined,
        search: searchQuery || undefined,
        promotedOnly: promotedOnly ? true : undefined,
      });
      if (res.tailors) {
        setTailors(res.tailors);

        // Update following state
        if (currentUser?.followingIds) {
          const map: Record<string, boolean> = {};
          currentUser.followingIds.forEach((id) => (map[id] = true));
          setFollowingMap(map);
        }
      }
    } catch (err) {
      console.error('Error fetching tailors:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // fetchTailors() is now called automatically by the useEffect hook when searchQuery changes.
  };

  const handleFollowToggle = async (tailorId: string) => {
    if (!currentUser) {
      onOpenAuth('login');
      return;
    }

    try {
      const res = await api.toggleFollow(currentUser.id, tailorId);
      if (res && res.isFollowing !== undefined) {
        setFollowingMap((prev) => ({ ...prev, [tailorId]: res.isFollowing }));
        setTailors((prev) =>
          prev.map((t) =>
            t.id === tailorId ? { ...t, followersCount: res.followersCount } : t
          )
        );
      }
    } catch (err) {
      console.error('Follow error:', err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900/60 dark:bg-stone-900/60 p-5 rounded-3xl border border-stone-800 backdrop-blur-sm">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-500 uppercase tracking-widest mb-1">
            <Scissors className="w-4 h-4" />
            <span>Master Artisans Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-900 dark:text-stone-100">
            Certified Bespoke Tailors
          </h1>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
            {currentUser?.city
              ? `Showing tailors matching your location near ${currentUser.city}, ${currentUser.country}`
              : 'Discover verified tailors by specialty, city location, and customer rating.'}
          </p>
        </div>

        {/* View Switcher: Grid vs Map */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 bg-stone-950 rounded-2xl border border-stone-800 text-xs font-semibold">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${viewMode === 'grid'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Grid View</span>
            </button>
            <button
              onClick={() => setViewMode('map')}
              className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition-all ${viewMode === 'map'
                ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
                : 'text-stone-400 hover:text-stone-200'
                }`}
            >
              <MapIcon className="w-3.5 h-3.5" />
              <span>Inbuilt Map</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-stone-900/40 p-4 rounded-2xl border border-stone-800/80 space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tailor by name, specialty (Agbada, Suits), or city..."
              className="w-full pl-10 pr-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs sm:text-sm text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500"
            >
              <option value="">All Countries ({countriesList.length || COUNTRIES.length})</option>
              {countriesList.map((c) => (
                <option key={c.code} value={c.name}>
                  {c.flag} {c.name}
                </option>
              ))}
            </select>

            {selectedCountry && (statesList.length > 0 || loadingLocations.states) && (
              <select
                value={selectedState}
                disabled={loadingLocations.states}
                onChange={(e) => setSelectedState(e.target.value)}
                className="px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 max-w-[150px] disabled:opacity-50"
              >
                <option value="">{loadingLocations.states ? 'Loading States...' : 'All States'}</option>
                {statesList.map((s) => (
                  <option key={s.iso2 || s.name} value={s.name}>
                    {s.name}
                  </option>
                ))}
              </select>
            )}

            {selectedState && (citiesList.length > 0 || loadingLocations.cities) && (
              <select
                value={selectedCity}
                disabled={loadingLocations.cities}
                onChange={(e) => setSelectedCity(e.target.value)}
                className="px-3 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-200 focus:outline-none focus:border-amber-500 max-w-[150px] disabled:opacity-50"
              >
                <option value="">{loadingLocations.cities ? 'Loading Cities...' : 'All Cities'}</option>
                {citiesList.map((c) => (
                  <option key={c.name} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}

            <button
              type="button"
              onClick={() => setPromotedOnly(!promotedOnly)}
              className={`px-3 py-2.5 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 whitespace-nowrap ${promotedOnly
                ? 'bg-amber-500/20 border-amber-500 text-amber-300'
                : 'bg-stone-950 border-stone-800 text-stone-400 hover:border-stone-700'
                }`}
            >
              <Crown className="w-3.5 h-3.5 text-amber-400" />
              <span>Promoted Only</span>
            </button>

            <button
              type="submit"
              className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-stone-950 rounded-xl font-bold text-xs shadow-md transition-all"
            >
              Search
            </button>
          </div>
        </form>

        {/* Quick Tag Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
          <span className="text-stone-400 text-[11px] font-semibold flex items-center gap-1 shrink-0 mr-1">
            <Filter className="w-3 h-3 text-amber-500" /> Tags:
          </span>
          <button
            onClick={() => setSelectedTag('')}
            className={`px-2.5 py-1 rounded-lg shrink-0 font-medium transition-all ${selectedTag === ''
              ? 'bg-amber-500 text-stone-950 font-bold'
              : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
              }`}
          >
            All Specialties
          </button>
          {POPULAR_TAGS.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? '' : tag)}
              className={`px-2.5 py-1 rounded-lg shrink-0 font-medium capitalize transition-all ${selectedTag === tag
                ? 'bg-amber-500 text-stone-950 font-bold'
                : 'bg-stone-950 text-stone-400 hover:text-stone-200 border border-stone-800'
                }`}
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === 'map' ? (
        /* --- INBUILT INTERACTIVE MAP VIEW --- */
        <div className="bg-stone-900/60 rounded-3xl p-6 border border-stone-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-amber-500" />
              <h2 className="text-lg font-bold text-stone-100">Interactive Tailor Geolocation Map</h2>
            </div>
            <span className="text-xs text-stone-400">
              Showing {tailors.length} active artisan locations
            </span>
          </div>

          {/* Map Canvas Graphic */}
          <div className="relative w-full h-[450px] bg-stone-950 rounded-2xl border border-stone-800 overflow-hidden flex items-center justify-center p-4">
            {/* Ambient Map Grid */}
            <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:24px_24px]" />
            <div className="absolute inset-0 bg-gradient-to-t from-stone-950 via-transparent to-stone-950/40 pointer-events-none" />

            {/* Stylized World & Regional Pins */}
            <div className="relative z-10 w-full h-full max-w-4xl flex flex-wrap items-center justify-center gap-6 p-6 overflow-y-auto">
              {tailors.length === 0 ? (
                <div className="text-center text-stone-400 text-xs">
                  No tailors found in this geographic area. Try selecting "All Countries".
                </div>
              ) : (
                tailors.map((tailor) => (
                  <div
                    key={tailor.id}
                    className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 hover:border-amber-500 shadow-xl transition-all w-full max-w-xs flex flex-col justify-between cursor-pointer"
                    onClick={() => onSelectTailor(tailor)}
                  >
                    <div className="flex items-start gap-3">
                      <img
                        src={tailor.avatarUrl || generateAvatarUrl(tailor.name, 'tailor')}
                        alt={tailor.name}
                        className="w-11 h-11 rounded-full object-cover border border-amber-500/40 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1">
                          <h3 className="text-xs font-bold text-stone-100 truncate">{tailor.name}</h3>
                          {tailor.isPromoted && <Crown className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                        </div>
                        <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" />
                          <span>{tailor.city}, {tailor.country}</span>
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {tailor.ratingAverage.toFixed(1)}
                      </span>
                      <span className="text-stone-400">{tailor.followersCount} followers</span>
                      <span className="text-amber-400 font-bold hover:underline">View Studio →</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : (
        /* --- GRID VIEW --- */
        <div>
          {isLoading ? (
            <div className="py-20 text-center">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-xs text-stone-400">Loading master tailors...</p>
            </div>
          ) : tailors.length === 0 ? (
            <div className="py-16 text-center bg-stone-900/40 rounded-3xl border border-stone-800 p-8">
              <Scissors className="w-10 h-10 text-stone-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-stone-200">No Tailors Found Matching Criteria</h3>
              <p className="text-xs text-stone-400 mt-1 max-w-md mx-auto">
                Be the first tailor in this location! Create your profile to showcase your bespoke creations.
              </p>
              <button
                onClick={() => onOpenAuth('register_tailor')}
                className="mt-4 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs transition-all"
              >
                Join as Tailor in {selectedCountry || 'Your City'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tailors.map((tailor) => {
                const isFollowing = !!followingMap[tailor.id];
                const whatsAppUrl = formatWhatsAppUrl(
                  tailor.whatsappPhone || tailor.phone,
                  tailor.name
                );

                return (
                  <div
                    key={tailor.id}
                    className={`rounded-3xl bg-stone-900/80 border p-6 flex flex-col justify-between transition-all hover:shadow-2xl relative overflow-hidden ${tailor.isPromoted
                      ? 'border-amber-500/60 shadow-amber-500/10'
                      : 'border-stone-800 hover:border-stone-700'
                      }`}
                  >
                    {/* Top Promoted Ribbon */}
                    {tailor.isPromoted && (
                      <div className="absolute top-0 right-0 bg-gradient-to-l from-amber-500 to-yellow-400 text-stone-950 text-[10px] font-black tracking-wider uppercase px-3 py-1 rounded-bl-xl shadow-md flex items-center gap-1">
                        <Crown className="w-3 h-3" />
                        <span>PROMOTED ARTISAN</span>
                      </div>
                    )}

                    <div>
                      {/* Tailor Header Info */}
                      <div className="flex items-start gap-4">
                        <img
                          src={tailor.avatarUrl || generateAvatarUrl(tailor.name, 'tailor')}
                          alt={tailor.name}
                          className="w-16 h-16 rounded-2xl object-cover border-2 border-amber-500/40 bg-stone-800 shrink-0"
                        />

                        <div className="min-w-0 flex-1">
                          <h3 className="text-base font-bold text-stone-100 flex items-center gap-1.5 truncate">
                            <span>{tailor.name}</span>
                          </h3>

                          <p className="text-xs text-amber-400 flex items-center gap-1 mt-1 font-medium">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            <span className="truncate">
                              {tailor.city ? `${tailor.city}, ` : ''}
                              {tailor.state ? `${tailor.state}, ` : ''}
                              {tailor.country}
                            </span>
                          </p>

                          <div className="flex items-center gap-3 mt-2 text-xs">
                            <span className="flex items-center gap-1 font-bold text-amber-400">
                              <Star className="w-3.5 h-3.5 fill-amber-400" />
                              {tailor.ratingAverage.toFixed(1)}
                              <span className="text-stone-400 font-normal text-[11px]">
                                ({tailor.ratingCount})
                              </span>
                            </span>

                            <span className="text-stone-400 flex items-center gap-1 text-[11px]">
                              <Users className="w-3.5 h-3.5" />
                              {tailor.followersCount} followers
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Bio */}
                      <p className="text-xs text-stone-300 mt-4 line-clamp-2 leading-relaxed">
                        {tailor.bio || 'Dedicated bespoke tailoring artisan crafting authentic modern & traditional garments.'}
                      </p>

                      {/* Specialties */}
                      {tailor.specialties && tailor.specialties.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {tailor.specialties.slice(0, 4).map((spec) => (
                            <span
                              key={spec}
                              className="px-2 py-0.5 rounded-md bg-stone-950 text-amber-300/90 border border-stone-800 text-[11px] font-medium"
                            >
                              {spec}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Availability & Turnaround */}
                      {tailor.availability && (
                        <div className="mt-3 text-[11px] text-stone-400 font-mono">
                          🕒 {tailor.availability}
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-6 pt-4 border-t border-stone-800/80 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        {/* WhatsApp Button */}
                        <a
                          href={whatsAppUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow transition-all"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </a>

                        {/* In-App Message */}
                        <button
                          onClick={() => {
                            if (!currentUser) onOpenAuth('login');
                            else onStartChat(tailor);
                          }}
                          className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold flex items-center justify-center gap-1.5 border border-stone-700 transition-all"
                        >
                          <MessageSquare className="w-3.5 h-3.5 text-amber-400" />
                          <span>In-App Chat</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Follow Button */}
                        <button
                          onClick={() => handleFollowToggle(tailor.id)}
                          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${isFollowing
                            ? 'bg-stone-800 text-stone-300 border border-stone-700'
                            : 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                        >
                          <Users className="w-3.5 h-3.5" />
                          <span>{isFollowing ? 'Following' : 'Follow Tailor'}</span>
                        </button>

                        {/* View Full Studio */}
                        <button
                          onClick={() => onSelectTailor(tailor)}
                          className="py-2 px-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 text-xs font-bold flex items-center justify-center gap-1 transition-all"
                        >
                          <span>Studio</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
