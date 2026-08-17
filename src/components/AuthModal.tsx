import React, { useState, useEffect } from 'react';
import { X, Scissors, UserCheck, Shield, Sparkles, Upload, Eye, EyeOff, Globe, CheckCircle2, Phone } from 'lucide-react';
import { COUNTRIES, generateAvatarUrl, POPULAR_TAGS } from '../data/countries';
import { validatePassword, validatePhoneNumber, sanitizePhoneInput, sanitizeAddressInput, getPhoneHint, formatPhoneAsYouType } from '../data/locations';
import { api } from '../services/api';
import { User, UserRole, CountryInfo as Country } from '../types';
import { Logo } from './Logo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialMode?: 'login' | 'register_tailor' | 'register_customer';
  onSuccess?: (user: User, token: string) => void;
  onOpenLegal?: (type: 'terms' | 'privacy') => void;
}

// Interfaces for data from the new API
interface ApiState {
  name: string;
  iso2: string;
}

interface ApiCity {
  name: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  initialMode = 'register_tailor',
  onSuccess,
  onOpenLegal
}) => {
  const [mode, setMode] = useState<'login' | 'register_tailor' | 'register_customer'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string | undefined>>({});
  const [locationLoading, setLocationLoading] = useState({
    countries: false,
    states: false,
    cities: false,
  });
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync mode with initialMode whenever modal opens or mode changes
  // This effect now ONLY runs when the modal is first opened with a new initialMode.
  useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
      setErrorMessage(null);
      setFormErrors({});
    }
  }, [initialMode]);

  // This new, separate effect ONLY runs when the mode changes.
  // It clears form fields to prevent data leakage between login/register forms.
  useEffect(() => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSelectedCountryCode('NG');
    setPhoneRaw('');
    setWhatsappRaw('');
    setStateName('');
    setCityName('');
    setStreetAddress('');
    setBio('');
    setAvatarPreview('');
  }, [mode]);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedCountryCode, setSelectedCountryCode] = useState('NG');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [whatsappRaw, setWhatsappRaw] = useState('');
  const [stateName, setStateName] = useState('');
  const [cityName, setCityName] = useState('');
  const [streetAddress, setStreetAddress] = useState('');
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>(['ready-to-wear', 'suits', 'agbada', 'streetwear', 'senator']);
  const [bio, setBio] = useState('');
  const [avatarPreview, setAvatarPreview] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [rememberMe, setRememberMe] = useState(true);
  const [availability, setAvailability] = useState('Mon - Sat: 9:00 AM - 7:00 PM');

  const [availableStates, setAvailableStates] = useState<ApiState[]>([]);
  const [availableCities, setAvailableCities] = useState<ApiCity[]>([]);

  // State for searchable dropdowns
  const [countrySearch, setCountrySearch] = useState('');
  const [stateSearch, setStateSearch] = useState('');
  const [citySearch, setCitySearch] = useState('');
  const [activeDropdown, setActiveDropdown] = useState<'country' | 'state' | 'city' | null>(null);

  // State for the master list of countries from the API
  const [countries, setCountries] = useState<Country[]>([]);

  // Fetch countries and attempt auto-location detection when modal opens
  useEffect(() => {
    if (isOpen && mode !== 'login' && countries.length === 0) {
      const fetchCountries = async () => {
        setLocationLoading(prev => ({ ...prev, countries: true, states: false, cities: false }));
        let loadedCountries: Country[] = [];
        try {
          const countryList = await api.getCountries();
          if (countryList && countryList.length > 0) {
            loadedCountries = countryList;
            setCountries(countryList);
            setErrorMessage(null); // Clear any previous error
          } else {
            console.warn("No countries returned from API. Falling back to static list.");
            loadedCountries = COUNTRIES;
            setCountries(COUNTRIES);
          }
        } catch (error) {
          console.error("Failed to fetch countries, falling back to static list:", error);
          loadedCountries = COUNTRIES;
          setCountries(COUNTRIES);
        } finally {
          setLocationLoading(prev => ({ ...prev, countries: false }));
        }

        // Attempt to auto-detect location using the loaded countries
        if (loadedCountries.length > 0) {
          navigator.geolocation.getCurrentPosition(async (position) => {
            try {
              const { latitude, longitude } = position.coords;
              const geo = await api.reverseGeocode(latitude, longitude);
              if (geo.countryCode && loadedCountries.some(c => c.code === geo.countryCode)) {
                setSelectedCountryCode(geo.countryCode);
                if (geo.city) setCityName(geo.city);
              }
            } catch (geoError) {
              console.warn("Could not auto-detect country:", geoError);
            }
          }, (error) => {
            console.warn("Geolocation permission denied or unavailable.", error.message);
          });
        }
      };
      fetchCountries();
    }
  }, [isOpen, mode, countries.length]);

  // Immediate password confirmation validation
  useEffect(() => {
    if (confirmPassword && password !== confirmPassword) {
      setFormErrors((prev) => ({ ...prev, confirmPassword: 'Passwords do not match.' }));
    } else {
      // Clear the error if they match or if the field is empty
      setFormErrors((prev) => {
        const { confirmPassword: _, ...rest } = prev;
        return rest;
      });
    }
  }, [password, confirmPassword]);


  // This effect now fetches states from our API when the country changes.
  // It ONLY runs if we have countries and a selected country code.
  useEffect(() => {
    if (isOpen && selectedCountryCode && countries.length > 0 && mode !== 'login') {
      const fetchStates = async () => {
        setLocationLoading((prev) => ({ ...prev, states: true, cities: false }));
        setAvailableStates([]);
        setAvailableCities([]);
        setStateName('');
        setCityName('');
        try {
          const states = await api.getStates(selectedCountryCode);
          setAvailableStates(states);
        } catch (error) {
          console.error("Failed to fetch states for " + selectedCountryCode, error);
        } finally {
          setLocationLoading((prev) => ({ ...prev, states: false }));
        }
      };
      fetchStates();
    }
  }, [selectedCountryCode, countries, isOpen, mode]);

  // This effect now fetches cities from our API when the state changes.
  // It ONLY runs if a valid state is selected.
  useEffect(() => {
    const selectedState = availableStates.find(s => s.name === stateName);
    if (isOpen && selectedState && mode !== 'login') {
      const fetchCities = async () => {
        setLocationLoading((prev) => ({ ...prev, cities: true }));
        setAvailableCities([]);
        setCityName('');
        try {
          const cities = await api.getCities(selectedCountryCode, selectedState.iso2); // Pass state ISO code
          setAvailableCities(cities);
        } catch (error) {
          console.error(`Failed to fetch cities for ${selectedCountryCode}/${selectedState.iso2}`, error);
        } finally {
          setLocationLoading((prev) => ({ ...prev, cities: false }));
        }
      };
      fetchCities();
    }
  }, [stateName, availableStates, selectedCountryCode, isOpen, mode]);

  if (!isOpen) return null;

  const filteredCountries = countrySearch
    ? countries.filter(c => c.name.toLowerCase().includes(countrySearch.toLowerCase()))
    : countries;

  const filteredStates = stateSearch
    ? availableStates.filter(s => s.name.toLowerCase().includes(stateSearch.toLowerCase()))
    : availableStates;

  const filteredCities = citySearch
    ? availableCities.filter(c => c.name.toLowerCase().includes(citySearch.toLowerCase()))
    : availableCities;

  const handleSelectCountry = (country: Country) => {
    setSelectedCountryCode(country.code);
    setCountrySearch('');
    setActiveDropdown(null);
  };

  // This effect now ONLY populates the available states when the country changes.

  const currentCountry = countries.find((c) => c.code === selectedCountryCode) ||
    (locationLoading.countries
      ? { name: 'Loading Countries...', code: '', dialCode: '+', flag: '' }
      : { name: 'Select Country', code: '', dialCode: '+', flag: '🌍' }
    );

  const handleLegalClick = (type: 'terms' | 'privacy') => {
    if (onOpenLegal) onOpenLegal(type);
  };

  const toggleSpecialty = (tag: string) => {
    if (selectedSpecialties.includes(tag)) {
      setSelectedSpecialties(selectedSpecialties.filter((s) => s !== tag));
    } else {
      setSelectedSpecialties([...selectedSpecialties, tag]);
    }
  };

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      setAvatarPreview(base64);
      try {
        const uploadRes = await api.uploadImage(base64, `avatar_${Date.now()}`, 'avatars');
        if (uploadRes.url) {
          setAvatarPreview(uploadRes.url);
        }
      } catch (err) {
        console.warn('Local preview used for avatar');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    setErrorMessage(null);

    if (mode !== 'login') {
      const errors: Record<string, string> = {};
      // Password validation
      const passwordValidation = validatePassword(password);
      if (!passwordValidation.valid) {
        errors.password = passwordValidation.message;
      }

      // Country-specific phone validation
      if (phoneRaw) {
        const phoneResult = validatePhoneNumber(phoneRaw, selectedCountryCode);
        if (!phoneResult.valid) {
          errors.phone = phoneResult.message;
        }
      }

      // Validate WhatsApp number if provided
      if (whatsappRaw) {
        const whatsappResult = validatePhoneNumber(whatsappRaw, selectedCountryCode);
        if (!whatsappResult.valid) {
          errors.whatsapp = whatsappResult.message;
        }
      }

      // Location validation
      if (!stateName) errors.state = 'State is required.';
      if (!cityName) errors.city = 'City is required.';

      if (!agreeTerms) {
        errors.terms = 'You must agree to the terms and privacy policy.';
      }

      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
        const firstError = Object.values(errors)[0];
        setErrorMessage(`Please fix the errors: ${firstError}`);
        return;
      }
    }



    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.login(email, password);
        if (res.user) {
          if (rememberMe) {
            localStorage.setItem('fabric_reality_user', JSON.stringify(res.user));
            localStorage.setItem('fabric_reality_token', res.token);
          }
          if (onSuccess) onSuccess(res.user, res.token);
          onClose();
        }
      } else {
        const role: UserRole = mode === 'register_tailor' ? 'tailor' : 'customer';

        // Format phone numbers with country dial code
        const cleanDialCode = currentCountry.dialCode;
        const formattedPhone = phoneRaw
          ? phoneRaw.startsWith('+')
            ? phoneRaw
            : `${cleanDialCode} ${phoneRaw.replace(/^0+/, '')}`
          : '';

        const formattedWhatsapp = whatsappRaw
          ? whatsappRaw.startsWith('+')
            ? whatsappRaw
            : `${cleanDialCode} ${whatsappRaw.replace(/^0+/, '')}`
          : formattedPhone;

        const finalAvatar = avatarPreview || generateAvatarUrl(name, role);

        const registerData = {
          email,
          password,
          name,
          role,
          country: currentCountry.name,
          countryCode: currentCountry.code,
          phone: formattedPhone,
          whatsappPhone: formattedWhatsapp,
          state: stateName || 'Lagos',
          city: cityName || 'Ikeja',
          streetAddress,
          specialties: selectedSpecialties,
          bio: bio || (role === 'tailor' ? 'Experienced artisan specializing in bespoke fits, ready-to-wear, streetwear and couture.' : 'Fashion enthusiast seeking authentic quality styles.'),
          avatarUrl: finalAvatar,
          availability,
        };

        const res = await api.register(registerData);
        if (res.user) {
          if (rememberMe) {
            localStorage.setItem('fabric_reality_user', JSON.stringify(res.user));
            localStorage.setItem('fabric_reality_token', res.token);
          }
          if (onSuccess) onSuccess(res.user, res.token);
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-xl my-8 bg-stone-900 text-stone-100 rounded-3xl border border-stone-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-stone-800 bg-stone-950/90">
          <Logo size="sm" />
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-100 hover:bg-stone-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="grid grid-cols-3 p-1.5 mx-6 mt-4 bg-stone-950 rounded-2xl border border-stone-800 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setMode('register_tailor');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${mode === 'register_tailor'
              ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
              : 'text-stone-400 hover:text-stone-200'
              }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            <span>Join as Tailor</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('register_customer');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${mode === 'register_customer'
              ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
              : 'text-stone-400 hover:text-stone-200'
              }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Join Customer</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('login');
              setErrorMessage(null);
            }}
            className={`py-2 px-2 rounded-xl flex items-center justify-center gap-1.5 transition-all ${mode === 'login'
              ? 'bg-amber-500 text-stone-950 shadow-md font-bold'
              : 'text-stone-400 hover:text-stone-200'
              }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Sign In</span>
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} method="POST" className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-sm font-sans">
          {(errorMessage || Object.keys(formErrors).length > 0) && (
            <div className="p-3 bg-red-950/60 border border-red-800/80 rounded-xl text-red-300 text-xs flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              {errorMessage}
            </div>
          )}

          {mode === 'login' ? (
            /* --- SIGN IN FORM --- */
            <div className="space-y-4 py-2">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">Email Address</label>
                <input
                  name="email"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="e.g. tailor@fabricreality.com or admin"
                  className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter your account password"
                    className="w-full px-4 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <label className="flex items-center gap-2 cursor-pointer text-stone-300">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span>Remember my session</span>
                </label>
              </div>
            </div>
          ) : (
            /* --- SIGN UP FORM (TAILOR / CUSTOMER) --- */
            <div className="space-y-4">
              {/* Profile Avatar Upload / Preview */}
              <div className="flex items-center gap-4 p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80">
                <div className="relative w-16 h-16 rounded-full overflow-hidden border-2 border-amber-500/50 bg-stone-800 shrink-0">
                  <img
                    src={avatarPreview || generateAvatarUrl(name || (mode === 'register_tailor' ? 'Master Tailor' : 'Customer'), mode === 'register_tailor' ? 'tailor' : 'customer')}
                    alt="Profile Avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-stone-200">Profile Picture / Avatar</p>
                  <p className="text-[11px] text-stone-400 truncate mb-2">Auto-generated initial avatar or upload your custom DP</p>
                  <label className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-medium cursor-pointer transition-colors">
                    <Upload className="w-3.5 h-3.5 text-amber-400" />
                    <span>Upload Image</span>
                    <input type="file" accept="image/*" onChange={handleAvatarFileChange} className="hidden" />
                  </label>
                </div>
              </div>

              {/* Full Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Full Name / Brand Name *</label>
                  <input
                    name="name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={mode === 'register_tailor' ? 'e.g. Royal Bespoke Tailors' : 'e.g. David Adeleke'}
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">Email Address *</label>
                  <input
                    name="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.com"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm"
                  />
                </div>
              </div>

              {/* Password & Confirm Password */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Password *</label>
                <div className="relative">
                  <input
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Create a strong password"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.password && <p className="text-red-400 text-[11px] mt-1">{formErrors.password}</p>}
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">Confirm Password *</label>
                <div className="relative">
                  <input
                    name="confirmPassword"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-sm pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-200"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {formErrors.confirmPassword && <p className="text-red-400 text-[11px] mt-1">{formErrors.confirmPassword}</p>}
              </div>

              {/* Country Selection with Auto Phone Dial Code */}
              <div className="p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80 space-y-3">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Globe className="w-4 h-4" />
                  <span>Location & Contact Verification</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">Country *</label>
                    <div className="relative">
                      <button type="button" disabled={locationLoading.countries} onClick={() => setActiveDropdown(activeDropdown === 'country' ? null : 'country')} className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-left text-xs flex items-center justify-between disabled:opacity-50">
                        <span className="flex items-center gap-2 truncate">
                          {currentCountry.flag ? <span className="text-base leading-none">{currentCountry.flag}</span> : <Globe className="w-4 h-4 text-stone-500" />}
                          <span className="truncate">{currentCountry.name}</span>
                        </span>
                        <span>▼</span>
                      </button>
                      {activeDropdown === 'country' && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2 sticky top-0 bg-stone-800">
                            <input type="text" placeholder="Search country..." value={countrySearch} onChange={e => setCountrySearch(e.target.value)} className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded-md text-xs" autoFocus />
                          </div>
                          {locationLoading.countries ? (
                            <div className="p-3 text-center text-xs text-stone-400">Loading countries...</div>
                          ) : countries.length === 0 ? (
                            <div className="p-3 text-center text-xs text-red-400">Failed to load countries.</div>
                          ) : filteredCountries.length > 0 ? (
                            filteredCountries.map(c => (
                              <button type="button" key={c.code} onClick={() => handleSelectCountry(c)} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-500/20 flex items-center gap-2">
                                <span className="text-base leading-none">{c.flag}</span>
                                <span>{c.name}</span>
                                <span className="ml-auto text-stone-500 font-mono text-[10px]">+{c.dialCode.replace('+', '')}</span>
                              </button>
                            ))
                          ) : (
                            <div className="p-3 text-center text-xs text-stone-400">No countries found for "{countrySearch}".</div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">State / Province *</label>
                    <div className="relative">
                      <button type="button" disabled={locationLoading.states || availableStates.length === 0} onClick={() => setActiveDropdown(activeDropdown === 'state' ? null : 'state')} className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-left text-xs flex items-center justify-between disabled:opacity-50">
                        <span className="truncate">{stateName || (locationLoading.states ? 'Loading states...' : 'Select State')}</span>
                        <span>▼</span>
                      </button>
                      {activeDropdown === 'state' && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2 sticky top-0 bg-stone-800">
                            <input type="text" placeholder="Search state..." value={stateSearch} onChange={e => setStateSearch(e.target.value)} className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded-md text-xs" />
                          </div>
                          {locationLoading.states ? (
                            <div className="p-3 text-center text-xs text-stone-400">Loading states...</div>
                          ) : availableStates.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-400">No states found for this country.</div>
                          ) : filteredStates.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-400">No states found for "{stateSearch}".</div>
                          ) : (
                            filteredStates.map(s => (
                              <button type="button" key={s.name} onClick={() => { setStateName(s.name); setActiveDropdown(null); setStateSearch(''); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-500/20">
                                {s.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.state && <p className="text-red-400 text-[11px] mt-1">{formErrors.state}</p>}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">City / District *</label>
                    <div className="relative">
                      <button type="button" disabled={locationLoading.cities || availableCities.length === 0} onClick={() => setActiveDropdown(activeDropdown === 'city' ? null : 'city')} className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 text-left text-xs flex items-center justify-between disabled:opacity-50">
                        <span className="truncate">{cityName || (locationLoading.cities ? 'Loading cities...' : 'Select City')}</span>
                        <span>▼</span>
                      </button>
                      {activeDropdown === 'city' && (
                        <div className="absolute z-20 top-full mt-1 w-full bg-stone-800 border border-stone-700 rounded-xl shadow-lg max-h-48 overflow-y-auto">
                          <div className="p-2 sticky top-0 bg-stone-800">
                            <input type="text" placeholder="Search city..." value={citySearch} onChange={e => setCitySearch(e.target.value)} className="w-full px-2 py-1 bg-stone-900 border border-stone-700 rounded-md text-xs" />
                          </div>
                          {locationLoading.cities ? (
                            <div className="p-3 text-center text-xs text-stone-400">Loading cities...</div>
                          ) : availableCities.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-400">No cities found for this state.</div>
                          ) : filteredCities.length === 0 ? (
                            <div className="p-3 text-center text-xs text-stone-400">No cities found for "{citySearch}".</div>
                          ) : (
                            filteredCities.map(c => (
                              <button type="button" key={c.name} onClick={() => { setCityName(c.name); setActiveDropdown(null); setCitySearch(''); }} className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-500/20">
                                {c.name}
                              </button>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                    {formErrors.city && <p className="text-red-400 text-[11px] mt-1">{formErrors.city}</p>}
                  </div>
                </div>

                {/* Street Address (Optional) */}
                <div>
                  <label className="block text-[11px] font-medium text-stone-300 mb-1">Street Address (Optional)</label>
                  <input
                    name="streetAddress"
                    type="text"
                    value={streetAddress}
                    onChange={(e) => setStreetAddress(sanitizeAddressInput(e.target.value))}
                    placeholder="e.g. 14 Fashion Boulevard, Suite 2B"
                    className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-xs"
                  />
                </div>

                {/* Phone Numbers with locked Country Code tracking */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      Primary Phone Number {mode === 'register_tailor' ? '*' : '(Optional)'}
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 bg-stone-800 border border-r-0 border-stone-700 rounded-l-xl text-amber-400 font-mono text-xs flex items-center gap-2">
                        {currentCountry.flag ? <span className="text-base leading-none">{currentCountry.flag}</span> : <Globe className="w-3 h-3" />} <span>{currentCountry.dialCode}</span>
                      </span>
                      <input
                        name="phone"
                        type="tel"
                        required={mode === 'register_tailor'}
                        value={sanitizePhoneInput(phoneRaw)}
                        onChange={(e) => setPhoneRaw(formatPhoneAsYouType(e.target.value, selectedCountryCode))}
                        onBlur={() => {
                          if (phoneRaw) {
                            const result = validatePhoneNumber(phoneRaw, selectedCountryCode);
                            if (!result.valid) {
                              setFormErrors(prev => ({ ...prev, phone: result.message }));
                            } else {
                              setFormErrors(prev => { const { phone: _, ...rest } = prev; return rest; });
                            }
                          } else {
                            setFormErrors(prev => { const { phone: _, ...rest } = prev; return rest; });
                          }
                        }}
                        placeholder={getPhoneHint(selectedCountryCode)?.split(' (')[0]?.replace('e.g. ', '') || '802 977 2375'}
                        className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-r-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    {formErrors.phone && <p className="text-red-400 text-[11px] mt-1">{formErrors.phone}</p>}
                    {getPhoneHint(selectedCountryCode) && !formErrors.phone && (
                      <p className="text-stone-500 text-[10px] mt-1 flex items-center gap-1">
                        <Phone className="w-2.5 h-2.5" />
                        {getPhoneHint(selectedCountryCode)}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">
                      WhatsApp Number (Optional 2nd Line)
                    </label>
                    <div className="flex items-center">
                      <span className="px-2.5 py-2 bg-emerald-950 border border-r-0 border-emerald-800 rounded-l-xl text-emerald-400 font-mono text-xs flex items-center gap-2">
                        {currentCountry.flag ? <span className="text-base leading-none">{currentCountry.flag}</span> : <Globe className="w-3 h-3" />} <span>{currentCountry.dialCode}</span>
                      </span>
                      <input
                        name="whatsappPhone"
                        type="tel"
                        value={sanitizePhoneInput(whatsappRaw)}
                        onChange={(e) => setWhatsappRaw(formatPhoneAsYouType(e.target.value, selectedCountryCode))}
                        onBlur={() => {
                          if (whatsappRaw) {
                            const result = validatePhoneNumber(whatsappRaw, selectedCountryCode);
                            if (!result.valid) {
                              setFormErrors(prev => ({ ...prev, whatsapp: result.message }));
                            } else {
                              setFormErrors(prev => { const { whatsapp: _, ...rest } = prev; return rest; });
                            }
                          } else {
                            setFormErrors(prev => { const { whatsapp: _, ...rest } = prev; return rest; });
                          }
                        }}
                        placeholder="For instant client chat"
                        className="flex-1 px-3 py-2 bg-stone-900 border border-stone-800 rounded-r-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-xs"
                      />
                    </div>
                    {formErrors.whatsapp && <p className="text-red-400 text-[11px] mt-1">{formErrors.whatsapp}</p>}
                  </div>
                </div>
              </div>

              {/* Tailor-specific fields: Specialties & Bio */}
              {mode === 'register_tailor' && (
                <div className="space-y-3 p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                    <Scissors className="w-4 h-4" />
                    <span>Tailor Specialties & Smart Search Tags</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {POPULAR_TAGS.map((tag) => {
                      const isSelected = selectedSpecialties.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button" // Important for forms
                          onClick={() => toggleSpecialty(tag)}
                          className={`capitalize px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${isSelected
                            ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-semibold'
                            : 'bg-stone-900 border-stone-800 text-stone-400 hover:border-stone-700'
                            }`}
                        >
                          {isSelected ? <CheckCircle2 className="w-3 h-3 mr-1 inline-block" /> : '+ '}
                          {tag}
                        </button>
                      );
                    })}
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">Tailoring Bio & Craft History</label>
                    <textarea
                      name="bio"
                      rows={2}
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Share your styling experience, bespoke tailoring, streetwear, or ready-to-wear specialties..."
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-xs resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-stone-300 mb-1">Studio Availability (e.g., hours)</label>
                    <input
                      name="availability"
                      type="text"
                      value={availability}
                      onChange={(e) => setAvailability(e.target.value)}
                      placeholder="e.g., Mon - Sat: 9:00 AM - 7:00 PM"
                      className="w-full px-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-stone-100 placeholder-stone-500 focus:outline-none focus:border-amber-500 text-xs"
                    />
                  </div>
                </div>
              )}

              {/* Agreement Radio and Terms */}
              <div className="space-y-2 pt-1 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer text-stone-300 leading-snug">
                  <input
                    type="radio"
                    checked={agreeTerms}
                    onChange={() => setAgreeTerms(true)}
                    className="mt-0.5 w-4 h-4 text-amber-500 focus:ring-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span>
                    I agree to the{' '}
                    <button
                      type="button"
                      onClick={() => handleLegalClick('terms')}
                      className="text-amber-400 hover:underline font-medium"
                    >
                      Terms of Service
                    </button>{' '}
                    and{' '}
                    <button
                      type="button"
                      onClick={() => handleLegalClick('privacy')}
                      className="text-amber-400 hover:underline font-medium"
                    >
                      Privacy Policy
                    </button>
                    .
                  </span>
                </label>
                {formErrors.terms && <p className="text-red-400 text-[11px] mt-1">{formErrors.terms}</p>}

                <label className="flex items-center gap-2 cursor-pointer text-stone-400">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500 bg-stone-950 border-stone-700"
                  />
                  <span>Remember me on this device</span>
                </label>
              </div>
            </div>
          )}

          {/* Action Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 text-stone-950 font-bold text-sm shadow-lg shadow-amber-500/20 hover:brightness-105 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-stone-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>
                    {mode === 'login'
                      ? 'Sign In to Fabric Reality'
                      : mode === 'register_customer'
                        ? 'Create Customer Account'
                        : 'Create Customer Account'}
                  </span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
