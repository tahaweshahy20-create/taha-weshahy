/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { LocationItem, PassengerStep, TripData, ChatMessage } from '../types';
import { POPULAR_LOCATIONS, CAPTAINS } from '../data';
import { getApiUrl, isLiveModeEnabled } from '../utils/api';
import {
  MapPin,
  Search,
  Check,
  Star,
  MessageCircle,
  Phone,
  Tag,
  CreditCard,
  Send,
  X,
  Compass,
  Sparkles,
  ArrowRight,
  UserCheck,
  ShieldCheck,
  Wallet,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface PassengerPanelProps {
  step: PassengerStep;
  setStep: (step: PassengerStep) => void;
  pickup: LocationItem | null;
  setPickup: (loc: LocationItem | null) => void;
  destination: LocationItem | null;
  setDestination: (loc: LocationItem | null) => void;
  tukTukProgress: number;
  setTukTukProgress: React.Dispatch<React.SetStateAction<number>>;
  userPhone?: string;
}

export default function PassengerPanel({
  step,
  setStep,
  pickup,
  setPickup,
  destination,
  setDestination,
  tukTukProgress,
  setTukTukProgress,
  userPhone,
}: PassengerPanelProps) {
  // Local booking state
  const [rideType, setRideType] = useState<'economy' | 'vip' | 'delivery'>('economy');
  const [promoInput, setPromoInput] = useState('');
  const [promoApplied, setPromoApplied] = useState(false);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [promoError, setPromoError] = useState('');
  const [showLocationsDropdown, setShowLocationsDropdown] = useState<'pickup' | 'dest' | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState(CAPTAINS[0]);

  // Payment states to prevent overcharging and fraud
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'app_wallet'>('cash');
  const [passengerWalletBalance, setPassengerWalletBalance] = useState(120);
  const [securePin, setSecurePin] = useState('');

  // Full-stack active ride state
  const [activeRideId, setActiveRideId] = useState<string | null>(null);

  // Negotiation and bargaining states
  const [customFare, setCustomFare] = useState<number | null>(null);
  const [negotiationOffers, setNegotiationOffers] = useState<{
    id: string;
    captain: typeof CAPTAINS[0];
    offeredFare: number;
    savingOrPremium: number;
  }[]>([]);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'driver', text: 'السلام عليكم يا فندم، أنا استقبلت طلبك وحالاً في السكة إليك.', time: '10:16 ص' }
  ]);
  const [messageText, setMessageText] = useState('');

  // Call state
  const [callActive, setCallActive] = useState(false);

  // Rating state
  const [rating, setRating] = useState(5);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [ratingComment, setRatingComment] = useState('');

  // VIP DJ Soundboard simulation states
  const [djPlaying, setDjPlaying] = useState(true);
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [bassBoost, setBassBoost] = useState(true);
  const [djVolume, setDjVolume] = useState(85);

  // Sponsor ads state
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    const fetchSponsorAds = async () => {
      try {
        const res = await fetch(getApiUrl('/api/ads'));
        if (res.ok) {
          const data = await res.json();
          // Filter only active ads
          setAds(data.filter((a: any) => a.isActive));
        }
      } catch (e) {
        console.warn("Could not fetch sponsor ads for passenger panel:", e);
      }
    };
    fetchSponsorAds();
  }, []);

  // Auto-fill a default pickup on mount so the user has immediate state
  useEffect(() => {
    if (!pickup) {
      setPickup(POPULAR_LOCATIONS[0]); // جامعة جنوب الوادي / بوابة قنا
    }
  }, [pickup, setPickup]);

  // Dynamic cost calculations
  const calculateDistance = () => {
    if (!pickup || !destination) return 2.3; // Default
    // Simple mock Euclidean distance with realistic range
    const dx = pickup.lng - destination.lng;
    const dy = pickup.lat - destination.lat;
    const dist = Math.sqrt(dx * dx + dy * dy) * 100; // factor to make it in kms
    return parseFloat(Math.max(0.8, Math.min(8.5, dist)).toFixed(1));
  };

  const distance = calculateDistance();
  const baseFares = {
    economy: 10 + distance * 4,
    vip: 18 + distance * 6,
    delivery: 12 + distance * 5
  };
  const originalFare = Math.round(baseFares[rideType]);
  const finalFare = promoApplied ? Math.max(5, Math.round(originalFare - discountAmount)) : originalFare;
  const actualFare = customFare !== null ? customFare : finalFare;
  const estimatedTime = Math.round(distance * 3); // 3 mins per km

  // Reset custom fare whenever travel parameters change
  useEffect(() => {
    setCustomFare(null);
  }, [rideType, pickup, destination, promoApplied]);

  // Generate simulated captain counter-offers when searching
  useEffect(() => {
    if (step !== 'searching') {
      setNegotiationOffers([]);
      return;
    }

    const timer1 = setTimeout(() => {
      const cap = CAPTAINS[Math.floor(Math.random() * CAPTAINS.length)];
      const currentPrice = actualFare;
      const offered = currentPrice + (Math.random() > 0.5 ? 5 : 3);
      setNegotiationOffers((prev) => [
        ...prev,
        {
          id: 'offer-1',
          captain: cap,
          offeredFare: offered,
          savingOrPremium: offered - currentPrice
        }
      ]);
    }, 3000);

    const timer2 = setTimeout(() => {
      if (CAPTAINS.length < 2) return;
      const cap = CAPTAINS[1];
      const currentPrice = actualFare;
      const offered = Math.max(5, currentPrice - 2);
      setNegotiationOffers((prev) => {
        if (prev.some(o => o.captain.name === cap.name)) return prev;
        return [
          ...prev,
          {
            id: 'offer-2',
            captain: cap,
            offeredFare: offered,
            savingOrPremium: offered - currentPrice
          }
        ];
      });
    }, 6500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, [step, actualFare]);

  // Apply promo codes
  const handleApplyPromo = () => {
    const code = promoInput.trim().toUpperCase();
    if (code === 'TAWSEELA20') {
      setPromoApplied(true);
      setDiscountAmount(originalFare * 0.2);
      setPromoError('');
    } else if (code === 'FREE') {
      setPromoApplied(true);
      setDiscountAmount(originalFare);
      setPromoError('');
    } else {
      setPromoError('كود الخصم غير صحيح');
      setPromoApplied(false);
      setDiscountAmount(0);
    }
  };

  // 1. Create ride on server on button click
  const handleOrderRide = async () => {
    setStep('searching');
    setTukTukProgress(0);
    const localPin = Math.floor(1000 + Math.random() * 9000).toString();
    setSecurePin(localPin);

    // If payment method is app wallet, deduct local balance for demonstration
    if (paymentMethod === 'app_wallet') {
      setPassengerWalletBalance((prev) => Math.max(0, prev - actualFare));
    }

    try {
      const phoneParam = userPhone || '01099887766';
      const response = await fetch(getApiUrl('/api/rides/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passengerPhone: phoneParam,
          pickup,
          destination,
          distance,
          duration: estimatedTime,
          fare: actualFare,
          rideType,
          promoCode: promoApplied ? promoInput : undefined,
          discount: promoApplied ? discountAmount : undefined,
          paymentMethod
        })
      });

      if (response.ok) {
        const data = await response.json();
        setActiveRideId(data.id);
        if (data.securePin) {
          setSecurePin(data.securePin);
        }
        console.log("Successfully created real live ride: " + data.id + " with PIN: " + (data.securePin || localPin));
      }
    } catch (e) {
      console.warn("Could not reach backend API for real ride matching, fallback to simulator:", e);
    }
  };

  // 2. Poll server for ride status (searching -> accepted -> arrived -> started -> completed)
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'searching' || step === 'trip_active') {
      const fetchRideStatus = async () => {
        try {
          const phoneParam = userPhone || '01099887766';
          const response = await fetch(getApiUrl(`/api/rides/active?phone=${phoneParam}&role=passenger`));
          if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
              setActiveRideId(data.id);
              if (data.status === 'searching') {
                setStep('searching');
              } else if (data.status === 'accepted' || data.status === 'arrived' || data.status === 'started') {
                setStep('trip_active');
                if (data.securePin) {
                  setSecurePin(data.securePin);
                }
                if (data.paymentMethod) {
                  setPaymentMethod(data.paymentMethod);
                }
                if (data.driverName) {
                  setSelectedCaptain({
                    name: data.driverName,
                    vehicleNumber: data.driverVehicle || 'توك توك الـجـوكـر (لوحة: م ص ر ٢٨٤)',
                    rating: data.driverRating || 4.9,
                    avatar: data.driverAvatar || 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80',
                    phone: data.driverPhone || '01023456789'
                  });
                }
                
                // Keep progress moving continuously when started
                if (data.status === 'started') {
                  setTukTukProgress((prev) => Math.min(99, prev + 1));
                }
              } else if (data.status === 'completed') {
                setStep('rating');
              }
            }
          }
        } catch (e) {
          console.warn("Live status poll error:", e);
        }
      };

      interval = setInterval(fetchRideStatus, 3000);
      fetchRideStatus();
    }
    return () => clearInterval(interval);
  }, [step, setStep, userPhone, setTukTukProgress]);

  // 3. Poll and Sync chat messages from the server
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'trip_active' && activeRideId) {
      const fetchMessages = async () => {
        try {
          const response = await fetch(getApiUrl(`/api/rides/chat/messages?rideId=${activeRideId}`));
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data) && data.length > 0) {
              setChatMessages(data);
            }
          }
        } catch (e) {
          console.warn("Live chat fetch error:", e);
        }
      };

      interval = setInterval(fetchMessages, 2500);
      fetchMessages();
    }
    return () => clearInterval(interval);
  }, [step, activeRideId]);

  // 4. Standalone Simulation Fallback: Matches after 12 seconds if no driver is online/active (Disabled in live mode)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'searching' && !activeRideId && !isLiveModeEnabled()) {
      timer = setTimeout(() => {
        // Mock captain acceptance
        const randCap = CAPTAINS[Math.floor(Math.random() * CAPTAINS.length)];
        setSelectedCaptain(randCap);
        setStep('trip_active');
        setTukTukProgress(0);
      }, 12000);
    }
    return () => clearTimeout(timer);
  }, [step, activeRideId, setStep, setTukTukProgress]);

  // 5. Standalone Simulation Fallback: Drives the trip if offline/simulated
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'trip_active' && !activeRideId && tukTukProgress < 100) {
      interval = setInterval(() => {
        setTukTukProgress((prev) => {
          const next = prev + 1;
          if (next >= 100) {
            clearInterval(interval);
            setStep('rating');
            return 100;
          }
          return next;
        });
      }, 1500);
    }
    return () => clearInterval(interval);
  }, [step, activeRideId, tukTukProgress, setTukTukProgress, setStep]);

  // Send a real or local chat message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: 'local-' + Date.now(),
      sender: 'passenger',
      text: messageText,
      time: timestamp
    };

    // Optimistically update
    setChatMessages((prev) => [...prev, userMsg]);
    const originalText = messageText;
    setMessageText('');

    if (activeRideId) {
      try {
        await fetch(getApiUrl('/api/rides/chat/send'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeRideId,
            sender: 'passenger',
            text: originalText
          })
        });
      } catch (err) {
        console.warn("Failed sending server chat, offline chat active");
      }
    } else {
      // Trigger driver mock response when offline
      setTimeout(() => {
        let driverReply = 'تمام يا فندم، أنا جاي في السكة ومسافة الطريق.';
        const txt = originalText;
        
        if (txt.includes('فين') || txt.includes('وين')) {
          driverReply = 'أنا عديت ميدان الساعة وحالاً داخل على شارعك، دقيقة وبكون عندك.';
        } else if (txt.includes('تأخر') || txt.includes('زحمة')) {
          driverReply = 'طريق الكورنيش فيه شوية زحمة، بس أنا مستخدم طريق فرعي عشان أصلك أسرع!';
        } else if (txt.includes('شكرا') || txt.includes('شكراً')) {
          driverReply = 'العفو يا فندم، الشرف لينا لخدمتك!';
        } else if (txt.includes('سماعات') || txt.includes('أغنية') || txt.includes('مهرجان')) {
          driverReply = 'جاهز بأجمد سماعات دي جي! مشغلين شعبي عالي يعجبك يا كابتن!';
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: 'mock-' + Date.now(),
            sender: 'driver',
            text: driverReply,
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 2000);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter((t) => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 relative" dir="rtl">
      
      {/* Dynamic Panel Content depending on Passenger Step */}
      <div className="flex-1 flex flex-col justify-between" id="passenger-flow-container">
        {step === 'home' && (
          // STEP 1: Route Setup & Ride Order
          <div className="flex flex-col flex-1 p-4 md:p-6 justify-between gap-6">
            <div className="space-y-4">
              <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <span>اطلب مشوارك الآن</span>
                <span className="text-sm px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">توك توك</span>
              </h2>

              {/* SPONSOR ADS BANNER */}
              {ads.length > 0 && (
                <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-3 rounded-2xl border border-amber-200/50 shadow-sm space-y-1.5 text-right relative overflow-hidden">
                  <div className="absolute -top-3 -left-3 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
                  <div className="flex items-center justify-between">
                    <span className="text-[8px] bg-amber-600 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Sparkles className="w-2.5 h-2.5 animate-spin" />
                      <span>راعي رسمي بالمدينة</span>
                    </span>
                    <span className="text-[9px] text-amber-800 font-bold">📍 عروض مميزة</span>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-xs font-black text-slate-800">{ads[0].title}</h4>
                    <p className="text-[10px] text-slate-600 leading-relaxed font-bold">{ads[0].text}</p>
                    <div className="flex justify-between items-center pt-1 border-t border-amber-200/40 text-[9px]">
                      <span className="text-amber-800 font-bold">🏬 {ads[0].sponsorName}</span>
                      {ads[0].linkUrl && (
                        <a 
                          href={ads[0].linkUrl} 
                          target="_blank" 
                          referrerPolicy="no-referrer"
                          className="text-emerald-700 hover:underline font-black flex items-center gap-0.5"
                        >
                          تواصل الآن 🔗
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ROUTE BOX */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative">
                {/* Visual Connector Line */}
                <div className="absolute top-[44px] right-[28px] bottom-[44px] w-0.5 bg-dashed border-r-2 border-emerald-300" />

                {/* Pickup Location */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 font-bold text-xs shrink-0">أ</div>
                    <div className="flex-1 relative">
                      <label className="block text-[10px] font-bold text-slate-400">موقع الركوب (الحالي)</label>
                      <button
                        onClick={() => setShowLocationsDropdown(showLocationsDropdown === 'pickup' ? null : 'pickup')}
                        className="w-full text-right font-medium text-slate-700 text-sm py-1 border-b border-slate-100 focus:outline-none flex justify-between items-center"
                        id="pickup-dropdown-btn"
                      >
                        <span className="truncate">{pickup?.name || 'تحديد موقع الركوب...'}</span>
                        <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Pickup Dropdown */}
                  <AnimatePresence>
                    {showLocationsDropdown === 'pickup' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-30 right-0 left-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-56 overflow-y-auto"
                      >
                        {POPULAR_LOCATIONS.map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              setPickup(loc);
                              setShowLocationsDropdown(null);
                            }}
                            className="w-full text-right px-4 py-3 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Destination Location */}
                <div className="relative">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold text-xs shrink-0">ب</div>
                    <div className="flex-1 relative">
                      <label className="block text-[10px] font-bold text-slate-400">وجهتك الحالية</label>
                      <button
                        onClick={() => setShowLocationsDropdown(showLocationsDropdown === 'dest' ? null : 'dest')}
                        className="w-full text-right font-medium text-slate-700 text-sm py-1 border-b border-slate-100 focus:outline-none flex justify-between items-center"
                        id="dest-dropdown-btn"
                      >
                        <span className="truncate">{destination?.name || 'اختر وجهتك من هنا أو انقر على الخريطة...'}</span>
                        <Search className="w-4 h-4 text-rose-400 shrink-0" />
                      </button>
                    </div>
                  </div>

                  {/* Destination Dropdown */}
                  <AnimatePresence>
                    {showLocationsDropdown === 'dest' && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute z-30 right-0 left-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl max-h-56 overflow-y-auto"
                      >
                        {POPULAR_LOCATIONS.filter(l => l.id !== pickup?.id).map((loc) => (
                          <button
                            key={loc.id}
                            onClick={() => {
                              setDestination(loc);
                              setShowLocationsDropdown(null);
                            }}
                            className="w-full text-right px-4 py-3 text-xs font-semibold hover:bg-slate-50 transition-colors flex items-center gap-2 border-b border-slate-50 last:border-0"
                          >
                            <MapPin className="w-3.5 h-3.5 text-slate-400" />
                            <span>{loc.name}</span>
                          </button>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* RIDE VEHICLE OPTIONS */}
              {destination && (
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-500 text-right">اختر فئة التوصيلة :</label>
                  <div className="grid grid-cols-3 gap-2" id="ride-type-selector">
                    
                    {/* Economy */}
                    <button
                      onClick={() => setRideType('economy')}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                        rideType === 'economy'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <span className="text-lg">🛺</span>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">توك توك اقتصادي</p>
                        <p className="text-[9px] text-slate-400">الأسرع والأوفر</p>
                      </div>
                      <span className="absolute top-2 left-2 text-xs font-bold text-emerald-600 font-mono">
                        {Math.round(baseFares.economy)} ج.م
                      </span>
                    </button>

                    {/* VIP */}
                    <button
                      onClick={() => setRideType('vip')}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                        rideType === 'vip'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <span className="text-lg">🔊🛺</span>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">توك توك فيب</p>
                        <p className="text-[9px] text-emerald-600 font-bold flex items-center gap-0.5">
                          <Sparkles className="w-2 h-2" /> دي جي ومقاعد مريحة
                        </p>
                      </div>
                      <span className="absolute top-2 left-2 text-xs font-bold text-emerald-600 font-mono">
                        {Math.round(baseFares.vip)} ج.m
                      </span>
                    </button>

                    {/* Delivery */}
                    <button
                      onClick={() => setRideType('delivery')}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-28 relative overflow-hidden ${
                        rideType === 'delivery'
                          ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200'
                      }`}
                    >
                      <span className="text-lg">📦</span>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">توصيلة دليفري</p>
                        <p className="text-[9px] text-slate-400">إرسال واستلام طرود</p>
                      </div>
                      <span className="absolute top-2 left-2 text-xs font-bold text-emerald-600 font-mono">
                        {Math.round(baseFares.delivery)} ج.م
                      </span>
                    </button>

                  </div>
                </div>
              )}

              {/* DISCOUNT / PROMO CODE SECTION */}
              {destination && (
                <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-2 justify-between">
                  <div className="flex items-center gap-2 flex-1">
                    <Tag className="w-4 h-4 text-amber-500 shrink-0" />
                    <input
                      type="text"
                      placeholder="كود الخصم (مثال: TAWSEELA20)"
                      value={promoInput}
                      onChange={(e) => setPromoInput(e.target.value)}
                      className="text-xs font-bold text-slate-700 bg-transparent focus:outline-none w-full"
                      disabled={promoApplied}
                    />
                  </div>
                  {promoApplied ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-bold bg-emerald-50 px-2.5 py-1 rounded-full">
                      <Check className="w-3.5 h-3.5" />
                      <span>تم تطبيق الخصم</span>
                      <button
                        onClick={() => {
                          setPromoApplied(false);
                          setDiscountAmount(0);
                          setPromoInput('');
                        }}
                        className="text-slate-400 hover:text-slate-600 ml-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleApplyPromo}
                      className="text-xs font-black text-emerald-600 hover:text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl transition-all"
                    >
                      تطبيق
                    </button>
                  )}
                </div>
              )}
              {promoError && <p className="text-[10px] text-rose-500 text-right font-bold mt-1 pr-2">{promoError}</p>}
            </div>

            {/* ORDER CONFIRMATION PANEL */}
            <div className="space-y-4">
              {destination && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                    <div className="text-right">
                      <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold">ميزة حرة</span>
                        <span>🤝 فاصِل ووفر (التفاوض على السعر)</span>
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">عدّل الأجرة المقترحة للرحلة للحصول على أفضل اتفاق مع الكباتن!</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-center gap-4 py-2">
                    <button
                      onClick={() => setCustomFare(Math.max(5, (customFare !== null ? customFare : finalFare) - 2))}
                      className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg transition-all active:scale-90 flex items-center justify-center shadow-sm cursor-pointer"
                      title="خصم 2 جنيه"
                    >
                      -
                    </button>

                    <div className="text-center min-w-[120px]">
                      <span className="text-2xl font-black text-slate-800 font-mono">
                        {actualFare}
                      </span>
                      <span className="text-xs text-slate-500 font-bold mr-1">ج.م</span>
                      
                      <div className="text-[9px] font-bold mt-1">
                        {customFare === null ? (
                          <span className="text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">الأجرة المقترحة القياسية</span>
                        ) : customFare < finalFare ? (
                          <span className="text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">خصمت {finalFare - customFare} ج.م عن القياسي! 📉</span>
                        ) : customFare > finalFare ? (
                          <span className="text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">زدت {customFare - finalFare} ج.م (جذب أسرع!) ⚡</span>
                        ) : (
                          <span className="text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">السعر القياسي</span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => setCustomFare((customFare !== null ? customFare : finalFare) + 2)}
                      className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-black text-lg transition-all active:scale-90 flex items-center justify-center shadow-sm cursor-pointer"
                      title="زيادة 2 جنيه"
                    >
                      +
                    </button>
                  </div>

                  {/* Quick Offers Tags */}
                  <div className="flex gap-1.5 justify-center flex-wrap">
                    <button
                      onClick={() => setCustomFare(Math.max(5, finalFare - 5))}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        customFare === finalFare - 5
                          ? 'bg-amber-600 text-white border-amber-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      ميزانية اقتصادية (-٥)
                    </button>
                    <button
                      onClick={() => setCustomFare(null)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        customFare === null
                          ? 'bg-emerald-600 text-white border-emerald-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      الأجرة المقترحة
                    </button>
                    <button
                      onClick={() => setCustomFare(finalFare + 5)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                        customFare === finalFare + 5
                          ? 'bg-purple-600 text-white border-purple-600'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      توصيلة سريعة (+٥) ⚡
                    </button>
                  </div>
                </div>
              )}

              {/* PAYMENT METHOD SELECTOR - ANTI-MANIPULATION & THEFT SHIELD */}
              {destination && (
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 text-right">
                  <div className="flex justify-between items-center pb-1">
                    <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-full font-black flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
                      <span>نظام حماية الأجرة والأمان 🛡️</span>
                    </span>
                    <h4 className="text-xs font-black text-slate-800">طريقة الدفع الآمنة</h4>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Option 1: Cash */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        paymentMethod === 'cash'
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-sm">💵</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'cash' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {paymentMethod === 'cash' && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">كاش نقداً</p>
                        <p className="text-[8px] text-slate-400">التزام تام بالسعر المحدد</p>
                      </div>
                    </button>

                    {/* Option 2: App Wallet */}
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('app_wallet')}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-20 cursor-pointer ${
                        paymentMethod === 'app_wallet'
                          ? 'border-emerald-500 bg-emerald-50/40 shadow-sm'
                          : 'border-slate-100 bg-slate-50/50 hover:border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <span className="text-xs font-bold text-slate-500">رصيدك: {passengerWalletBalance} ج.م</span>
                        <div className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                          paymentMethod === 'app_wallet' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-300'
                        }`}>
                          {paymentMethod === 'app_wallet' && <Check className="w-2.5 h-2.5 text-white stroke-[3px]" />}
                        </div>
                      </div>
                      <div>
                        <p className="text-[11px] font-black text-slate-800">محفظة التطبيق 📱</p>
                        <p className="text-[8px] text-emerald-600 font-bold">حسم تلقائي آمن من السرقة</p>
                      </div>
                    </button>
                  </div>

                  {paymentMethod === 'app_wallet' && (
                    <div className="bg-emerald-50/80 p-2.5 rounded-xl border border-emerald-100 flex items-center justify-between text-[10px] font-bold text-emerald-800 animate-fadeIn">
                      <div className="flex items-center gap-1.5">
                        <Wallet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>سيتم تجميد قيمة المشوار وتحويلها للكابتن بكود الأمان فقط!</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setPassengerWalletBalance(prev => prev + 50)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-2 py-1 rounded-md text-[9px] font-black transition-all cursor-pointer shadow-sm shrink-0"
                      >
                        + شحن رصيد ⚡
                      </button>
                    </div>
                  )}

                  {paymentMethod === 'cash' && (
                    <div className="bg-amber-50/80 p-2 rounded-xl border border-amber-100/60 text-[9px] font-bold text-amber-800 leading-relaxed">
                      💡 **تنبيه الأمان ضد الاستغلال:** السعر مغلق ومثبت على تطبيق الكابتن أيضاً؛ لا تدفع أي مبالغ إضافية تحت أي مسمى، وراجع الكود لمنع التلاعب.
                    </div>
                  )}
                </div>
              )}

              {destination ? (
                <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-lg" id="fare-summary-panel">
                  <div className="flex justify-between text-xs text-slate-400 font-medium">
                    <span>المسافة: {distance} كم</span>
                    <span>الوقت المقدر: {estimatedTime} دقيقة</span>
                  </div>
                  
                  <div className="border-t border-slate-800 my-2 pt-2 flex justify-between items-center">
                    <div className="flex items-center gap-1">
                      <span className="text-xl font-black font-mono text-emerald-400">{actualFare}</span>
                      <span className="text-xs font-bold">جنيه مصري</span>
                      {promoApplied && (
                        <span className="text-xs text-slate-500 line-through font-mono ml-2">
                          {originalFare} ج.م
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-300 font-bold bg-slate-800/80 px-2.5 py-1 rounded-full">
                      {paymentMethod === 'app_wallet' ? (
                        <>
                          <Wallet className="w-3.5 h-3.5 text-emerald-400" />
                          <span>رصيد محفظة التطبيق</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          <span>نقداً (كاش)</span>
                        </>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleOrderRide}
                    className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all shadow-md active:scale-[0.99] text-center text-sm flex items-center justify-center gap-2 cursor-pointer"
                    id="btn-order-ride"
                  >
                    <span>اطلب توصيلة توك توك الآن</span>
                    <ArrowRight className="w-4 h-4 rotate-180" />
                  </button>
                </div>
              ) : (
                <div className="bg-white p-6 rounded-2xl border border-slate-100 text-center space-y-2">
                  <span className="text-3xl animate-bounce inline-block">🗺️</span>
                  <p className="text-sm font-bold text-slate-700">يرجى تحديد وجهة المشوار</p>
                  <p className="text-xs text-slate-400">انقر على الخريطة أو اختر من شريط البحث لبدء حساب المسافة والأسعار</p>
                </div>
              )}
            </div>
          </div>
        )}

        {step === 'searching' && (
          // STEP 2: Searching Radar screen
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <div className="relative">
              {/* Radar Pulsing circle */}
              <div className="w-28 h-28 rounded-full border-4 border-emerald-500/20 flex items-center justify-center animate-pulse">
                <Compass className="w-12 h-12 text-emerald-600 animate-spin-slow" />
              </div>
              <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-500 rounded-full animate-ping" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-black text-slate-800">جاري عرض السعر المقترح ({actualFare} ج.م)...</h3>
              <p className="text-xs text-slate-500 px-4">
                نعرض طلبك الآن على كباتن التوك توك في محيطك لتلقي عروضهم للتفاوض على الرحلة.
              </p>
            </div>

            {/* Display Incoming Negotiation Counter Offers */}
            {negotiationOffers.length > 0 && (
              <div className="w-full max-w-sm space-y-2 mt-1 text-right">
                <h4 className="text-xs font-black text-amber-600 flex items-center gap-1.5 justify-end animate-pulse px-1">
                  <span>📬 عروض تفاوضية مستلمة حالاً من الكباتن</span>
                </h4>
                <div className="space-y-2">
                  {negotiationOffers.map((offer) => (
                    <div key={offer.id} className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 shadow-md flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCaptain(offer.captain);
                            setCustomFare(offer.offeredFare);
                            setStep('trip_active');
                            setTukTukProgress(0);
                          }}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black rounded-lg transition-all cursor-pointer active:scale-95"
                        >
                          قبول العرض
                        </button>
                        <button
                          onClick={() => {
                            setNegotiationOffers((prev) => prev.filter((o) => o.id !== offer.id));
                          }}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-400 text-[10px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          رفض
                        </button>
                      </div>
                      
                      <div className="text-right space-y-0.5">
                        <div className="flex items-center gap-1 justify-end">
                          <span className="text-[11px] text-slate-300 font-bold">{offer.captain.name}</span>
                          <span className="text-base">{offer.captain.avatar}</span>
                        </div>
                        <div className="flex items-center gap-1.5 justify-end font-mono">
                          <span className="text-emerald-400 font-black text-xs">{offer.offeredFare} ج.م</span>
                          {offer.savingOrPremium > 0 ? (
                            <span className="text-[8px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded-full font-sans font-bold">+{offer.savingOrPremium} ج.م ⚡</span>
                          ) : offer.savingOrPremium < 0 ? (
                            <span className="text-[8px] bg-amber-950 text-amber-300 px-1.5 py-0.5 rounded-full font-sans font-bold">-{Math.abs(offer.savingOrPremium)} ج.م 📉</span>
                          ) : (
                            <span className="text-[8px] bg-emerald-950 text-emerald-300 px-1.5 py-0.5 rounded-full font-sans font-bold">سعر طلبك</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="bg-emerald-50/50 border border-emerald-100 p-3 rounded-2xl w-full max-w-sm space-y-1 text-right">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>المسار التفاوضي نشط</span>
              </div>
              <p className="text-[9px] text-slate-400">
                موقع الركوب: {pickup?.name}
              </p>
              <p className="text-[9px] text-slate-400">
                الوجهة المطلوبة: {destination?.name}
              </p>
            </div>

            <button
              onClick={() => setStep('home')}
              className="px-6 py-2 bg-slate-200 hover:bg-slate-300 text-slate-600 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
            >
              إلغاء الطلب والتراجع
            </button>
          </div>
        )}

        {step === 'trip_active' && (
          // STEP 3: Active Trip Screen
          <div className="flex flex-col flex-1 justify-between p-4 md:p-6 gap-4">
            
            {/* Status bar */}
            <div className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>الكابتن في الطريق إليك</span>
              </div>
              <span className="font-mono text-slate-500">متبقي {Math.max(1, Math.round(estimatedTime * (1 - tukTukProgress/100)))} دقيقة</span>
            </div>

            {/* Simulated Live Route Progress */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 space-y-2">
              <div className="flex justify-between text-xs font-bold text-slate-500">
                <span>موقع الركوب</span>
                <span>الوجهة النهائية</span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-3.5 bg-slate-100 rounded-full overflow-hidden relative border border-slate-200/50">
                <div
                  className="h-full bg-emerald-500 transition-all duration-1000 ease-linear flex items-center justify-end pr-1"
                  style={{ width: `${tukTukProgress}%` }}
                >
                  <span className="text-[10px] font-bold text-white drop-shadow">🛺</span>
                </div>
              </div>
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                <span>تلقائي: {tukTukProgress}% من المشوار</span>
                <span>تحديث GPS كل ثانية</span>
              </div>
            </div>

            {/* VIP DJ SOUNDBOARD SIMULATOR */}
            {rideType === 'vip' && (
              <div className="bg-gradient-to-tr from-slate-900 via-slate-950 to-slate-900 text-white p-4 rounded-2xl border border-purple-900/40 shadow-xl space-y-3 relative overflow-hidden" id="vip-dj-soundboard">
                {/* Glowing decorative neon ring */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-purple-600/20 rounded-full blur-xl animate-pulse" />
                <div className="absolute -bottom-12 -left-12 w-24 h-24 bg-indigo-600/20 rounded-full blur-xl animate-pulse" />

                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2" dir="rtl">
                  <span className="flex items-center gap-1.5 text-xs font-black text-purple-400">
                    <span className="w-2 h-2 rounded-full bg-purple-500 animate-ping" />
                    توصيلة دي جي (مهرجانات VIP) 🔊
                  </span>
                  <span className="text-[9px] font-bold text-slate-400 font-mono">BASS BOOSTED</span>
                </div>

                <div className="flex items-center justify-between gap-3 text-right" dir="rtl">
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] text-slate-400 font-bold block">الأغنية الحالية:</span>
                    <p className="text-xs font-black text-slate-100 truncate mt-0.5">
                      {['مهرجان قنا دولة وأنا فرد فيها 🛺', 'مهرجان الغزالة رايقة 🦌', 'مهرجان يا سبايسي - كله ع الماشي 🌶️', 'مهرجان ملوك الجدعنة والرجولة 🦁'][currentSongIndex]}
                    </p>
                  </div>

                  {/* Play/pause button */}
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => setCurrentSongIndex((prev) => (prev + 1) % 4)}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition-all active:scale-95"
                      title="الأغنية التالية"
                    >
                      <span className="text-xs font-bold font-mono">NEXT ➔</span>
                    </button>
                    <button
                      onClick={() => setDjPlaying(!djPlaying)}
                      className={`p-2.5 rounded-xl transition-all active:scale-95 flex items-center justify-center ${
                        djPlaying ? 'bg-purple-600 text-white shadow-lg shadow-purple-600/30' : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {djPlaying ? '⏸️' : '▶️'}
                    </button>
                  </div>
                </div>

                {/* Simulated equalizer visualizer */}
                {djPlaying && (
                  <div className="flex items-end justify-center gap-1 h-8 bg-slate-950/80 p-2 rounded-xl border border-slate-800" id="audio-equalizer">
                    {[...Array(14)].map((_, i) => (
                      <span
                        key={i}
                        className={`w-1 rounded-t-sm transition-all duration-300 ${
                          bassBoost ? 'bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]' : 'bg-indigo-400'
                        }`}
                        style={{
                          height: `${Math.floor(20 + Math.random() * 80)}%`,
                          animation: djPlaying ? `pulse 0.6s ease-in-out infinite alternate` : 'none',
                          animationDelay: `${i * 0.05}s`
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Audio controls */}
                <div className="grid grid-cols-2 gap-2 text-xs font-bold pt-1" dir="rtl">
                  <button
                    onClick={() => setBassBoost(!bassBoost)}
                    className={`py-2 px-3 rounded-xl border transition-all text-[11px] ${
                      bassBoost
                        ? 'bg-purple-950/60 text-purple-300 border-purple-500/40 shadow-sm shadow-purple-500/10'
                        : 'bg-slate-900 text-slate-400 border-slate-800'
                    }`}
                  >
                    🚀 مضخم البيس (Bass): {bassBoost ? 'نشط 🔥' : 'مغلق'}
                  </button>

                  <div className="bg-slate-950/40 p-2 rounded-xl border border-slate-800/60 flex items-center justify-between gap-2">
                    <span className="text-[10px] text-slate-400 shrink-0">الصوت: {djVolume}%</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={djVolume}
                      onChange={(e) => setDjVolume(Number(e.target.value))}
                      className="w-full h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Captain Details Box */}
            <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-lg space-y-4 text-right">
              {/* Trust Badge Header */}
              <div className="bg-emerald-50 text-emerald-950 p-2.5 rounded-2xl border border-emerald-100/60 flex items-center justify-between text-[10px] font-bold">
                <div className="flex items-center gap-1.5">
                  <UserCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="text-emerald-900 font-black">كابتن موثق بالرقم القومي الآمن 🔒</span>
                </div>
                <span className="bg-emerald-600 text-white px-2 py-0.5 rounded-full font-black text-[9px] scale-95">مطابق ومؤمّن</span>
              </div>

              <div className="flex items-start gap-3">
                <div className="w-14 h-14 bg-gradient-to-tr from-emerald-100 to-emerald-50 rounded-full flex items-center justify-center text-3xl shrink-0 border border-emerald-200 shadow-inner">
                  {selectedCaptain.avatar}
                </div>
                <div className="flex-1 text-right space-y-1">
                  <h4 className="text-sm font-black text-slate-800 flex items-center gap-1 justify-end flex-wrap">
                    <span>{selectedCaptain.name}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded-md font-bold">الاسم الفعلي</span>
                  </h4>
                  
                  {/* Real Verified Identity Details */}
                  <div className="space-y-1 bg-slate-50 p-2 rounded-xl border border-slate-100 text-[10px] font-bold">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">الاسم بالبطاقة:</span>
                      <span className="text-slate-700 font-black">{selectedCaptain.name.split(' ')[0]} {selectedCaptain.name.split(' ')[1] || 'عاشور'} (موثق بالكامل)</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">رقم الهاتف:</span>
                      <span className="text-slate-700 font-mono" dir="ltr">{selectedCaptain.phone}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-slate-400">لوحة التوكتك:</span>
                      <span className="text-emerald-700 font-black">{selectedCaptain.vehicleNumber}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 mt-1 text-amber-500 justify-end">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span className="text-xs font-bold">{selectedCaptain.rating} / 5.0 (تقييم ممتاز)</span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1.5 shrink-0 bg-emerald-50/50 p-2 rounded-xl border border-emerald-100/30">
                  <span className="text-xs font-black text-emerald-700 font-mono">
                    {actualFare} ج.م
                  </span>
                  <span className="text-[8px] text-slate-400 font-black">
                    {paymentMethod === 'app_wallet' ? 'دفع بالمحفظة' : 'الدفع كاش'}
                  </span>
                </div>
              </div>

              {/* الدرع الأمني لمنع السرقة والتلاعب بالتسعيرة */}
              <div className="bg-slate-900 text-white p-4 rounded-3xl space-y-3 text-right shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -z-10" />
                
                <div className="flex justify-between items-center border-b border-slate-800 pb-2">
                  <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <Shield className="w-3 h-3 animate-pulse" />
                    <span>نشط وآمن ومؤمّن</span>
                  </span>
                  <h4 className="text-xs font-black text-slate-200">الدرع الأمني للتسعيرة والأمان 🛡️</h4>
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold mb-0.5">طريقة الدفع المثبتة</span>
                    <span className="text-xs font-black text-emerald-400">
                      {paymentMethod === 'app_wallet' ? '📱 رصيد المحفظة' : '💵 كاش نقداً'}
                    </span>
                  </div>

                  <div className="bg-slate-800/60 p-2.5 rounded-2xl border border-slate-700/50 text-center">
                    <span className="text-[9px] text-slate-400 block font-bold mb-0.5">حساب الرحلة مغلق</span>
                    <span className="text-xs font-black text-slate-100 font-mono">{actualFare} جنيه</span>
                  </div>
                </div>

                {/* Secure Pin verification */}
                <div className="bg-gradient-to-l from-slate-950 to-slate-900 border border-emerald-500/30 p-3 rounded-2xl flex items-center justify-between">
                  <div className="text-right">
                    <p className="text-[10px] text-slate-300 font-bold">كود أمان إنهاء الرحلة (PIN)</p>
                    <p className="text-[8px] text-slate-500 mt-0.5">أعطه للكابتن عند الوصول فقط لمنع التلاعب</p>
                  </div>
                  <div className="bg-emerald-600 hover:bg-emerald-500 text-white font-mono text-lg font-black px-4 py-1.5 rounded-xl tracking-widest shadow-md animate-pulse">
                    {securePin}
                  </div>
                </div>

                <p className="text-[9px] text-slate-400 text-center leading-relaxed">
                  ⚠️ **أمان الراكب أولاً:** الكابتن لا يستطيع إنهاء الرحلة أو تعديل التسعيرة دون إدخال هذا الكود بنجاح في هاتفه!
                </p>
              </div>

              {/* Action buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setCallActive(true)}
                  className="py-3 px-4 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>اتصال تلفوني</span>
                </button>

                <button
                  onClick={() => setChatOpen(true)}
                  className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 active:scale-95 relative"
                >
                  <MessageCircle className="w-4 h-4 shrink-0" />
                  <span>شات ومحادثة</span>
                  <span className="absolute top-2 left-6 w-2.5 h-2.5 bg-blue-500 rounded-full animate-ping" />
                </button>

                <button
                  onClick={() => setStep('rating')}
                  className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-xl font-bold text-xs transition-all flex flex-col items-center gap-1 active:scale-95"
                >
                  <X className="w-4 h-4 shrink-0" />
                  <span>إنهاء المشوار</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 'rating' && (
          // STEP 4: Rating Screen
          <div className="flex-1 flex flex-col justify-between p-4 md:p-6" id="rating-panel">
            <div className="space-y-6 my-auto text-center">
              <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center text-5xl mx-auto border border-emerald-100">
                🛺
              </div>

              <div className="space-y-1">
                <h3 className="text-xl font-black text-slate-800">الحمد لله على السلامة!</h3>
                <p className="text-xs text-slate-500 px-4">
                  تم إنهاء مشوارك بنجاح من {pickup?.name} إلى {destination?.name}. يرجى تقييم كابتن التوصيلة:
                </p>
              </div>

              {/* Captain review card */}
              <div className="bg-white p-4 rounded-2xl border border-slate-100 max-w-sm mx-auto shadow-sm space-y-3">
                <div className="flex items-center gap-3 justify-center">
                  <span className="text-3xl">{selectedCaptain.avatar}</span>
                  <div className="text-right">
                    <h4 className="text-xs font-bold text-slate-700">{selectedCaptain.name}</h4>
                    <p className="text-[10px] text-slate-400 font-semibold">{selectedCaptain.vehicleNumber}</p>
                  </div>
                </div>

                {/* Stars select */}
                <div className="flex justify-center gap-1.5" id="stars-row">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => setRating(s)}
                      className="transition-transform active:scale-125 focus:outline-none"
                    >
                      <Star
                        className={`w-8 h-8 ${
                          s <= rating ? 'text-amber-500 fill-current' : 'text-slate-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>

              {/* Tag selectors */}
              <div className="space-y-2 text-right max-w-sm mx-auto">
                <label className="block text-xs font-bold text-slate-500">اختر العبارات المناسبة لخدمته :</label>
                <div className="flex flex-wrap gap-1.5 justify-end" id="tags-container">
                  {['سائق محترم', 'وصول سريع', 'مركبة نظيفة', 'قيادة آمنة', 'سماعات قوية', 'أمين جداً'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-full border transition-all ${
                        selectedTags.includes(tag)
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                      }`}
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* Comment Box */}
              <div className="space-y-1.5 text-right max-w-sm mx-auto">
                <label className="block text-xs font-bold text-slate-500">اكتب تعليقاً إضافياً (اختياري) :</label>
                <textarea
                  placeholder="رأيك يساعدنا في تحسين جودة توصيلة..."
                  value={ratingComment}
                  onChange={(e) => setRatingComment(e.target.value)}
                  className="w-full text-xs font-bold p-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={2}
                />
              </div>
            </div>

            <button
              onClick={() => {
                setStep('home');
                setDestination(null);
                setPromoApplied(false);
                setPromoInput('');
                setDiscountAmount(0);
                setRatingComment('');
                setSelectedTags([]);
              }}
              className="w-full max-w-sm mx-auto py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-md active:scale-95 text-center text-sm"
              id="btn-submit-rating"
            >
              تقديم التقييم والعودة للرئيسية
            </button>
          </div>
        )}
      </div>

      {/* CALL DIALER SIMULATOR MODAL */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-40 flex flex-col justify-between p-8 text-center text-white rounded-3xl"
            id="call-dialer-modal"
          >
            <div className="space-y-2 mt-12">
              <span className="text-emerald-400 font-semibold text-xs animate-pulse block">اتصال جاري عبر تطبيق توصيلة...</span>
              <h3 className="text-2xl font-black">{selectedCaptain.name}</h3>
              <p className="text-sm text-slate-400 font-mono" dir="ltr">{selectedCaptain.phone}</p>
            </div>

            <div className="relative my-auto flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center animate-ping absolute" />
              <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-5xl relative shadow-lg shadow-emerald-500/20">
                {selectedCaptain.avatar}
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <p className="text-xs text-slate-400">مكالمتك مشفرة لحماية خصوصية بياناتك ورقم هاتفك.</p>
              <button
                onClick={() => setCallActive(false)}
                className="w-16 h-16 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center mx-auto text-white shadow-lg active:scale-90 transition-all focus:outline-none"
              >
                <Phone className="w-6 h-6 rotate-[135deg] fill-current" />
              </button>
              <span className="text-xs text-rose-400 font-bold block">إغلاق الخط</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ACTIVE CHAT BOX PANEL */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl shadow-2xl z-40 flex flex-col justify-between border-t border-slate-100"
            id="chat-panel"
          >
            {/* Chat header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{selectedCaptain.avatar}</span>
                <div className="text-right">
                  <h4 className="text-xs font-black text-slate-800">{selectedCaptain.name}</h4>
                  <span className="text-[9px] text-emerald-500 font-bold">متصل الآن بالـ GPS</span>
                </div>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="p-1.5 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Chat messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col bg-slate-50/50">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={`max-w-[80%] p-3 rounded-2xl text-xs font-semibold leading-relaxed ${
                    msg.sender === 'passenger'
                      ? 'bg-emerald-600 text-white self-end rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 self-start rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[8px] mt-1 text-left ${
                      msg.sender === 'passenger' ? 'text-emerald-200' : 'text-slate-400'
                    }`}
                  >
                    {msg.time}
                  </span>
                </div>
              ))}
            </div>

            {/* Chat input form */}
            <form onSubmit={handleSendMessage} className="p-3 border-t border-slate-100 flex gap-2 bg-white">
              <input
                type="text"
                placeholder="اكتب رسالتك للكابتن هنا..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                className="flex-1 px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs font-bold"
              />
              <button
                type="submit"
                className="p-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl active:scale-95 transition-all"
              >
                <Send className="w-4 h-4 rotate-180" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
