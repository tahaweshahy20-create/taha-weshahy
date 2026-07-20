/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AppState, UserRole, PassengerStep, DriverStep, LocationItem } from './types';
import { POPULAR_LOCATIONS, CAPTAINS } from './data';
import LoginScreen from './components/LoginScreen';
import MapSimulator from './components/MapSimulator';
import PassengerPanel from './components/PassengerPanel';
import DriverPanel from './components/DriverPanel';
import MarketLaunchDashboard from './components/MarketLaunchDashboard';
import OwnerDashboard from './components/OwnerDashboard';
import SupportModal from './components/SupportModal';
import ServerSettingsModal from './components/ServerSettingsModal';
import { isLiveModeEnabled, getCustomApiBase } from './utils/api';
import {
  Compass,
  LogOut,
  User,
  ArrowLeftRight,
  Info,
  Radio,
  MapPin,
  Sparkles,
  HelpCircle,
  Menu,
  Shield,
  Sun,
  Moon,
  Wifi,
  Smartphone,
  Star,
  RefreshCw,
  Award,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Navigation & Authentication states
  const [appState, setAppState] = useState<AppState>('splash');
  const [userRole, setUserRole] = useState<UserRole>('passenger');
  const [userPhone, setUserPhone] = useState('');
  const [registeredDriverData, setRegisteredDriverData] = useState<any>(() => {
    const saved = localStorage.getItem('TAWSEELA_REGISTERED_DRIVER');
    return saved ? JSON.parse(saved) : null;
  });
  const [profileOpen, setProfileOpen] = useState(false);
  const [marketDashboardOpen, setMarketDashboardOpen] = useState(false);
  const [ownerDashboardOpen, setOwnerDashboardOpen] = useState(false);
  const [supportModalOpen, setSupportModalOpen] = useState(false);
  const [serverSettingsOpen, setServerSettingsOpen] = useState(false);

  // Common interactive simulation values
  const [pickup, setPickup] = useState<LocationItem | null>(POPULAR_LOCATIONS[0]);
  const [destination, setDestination] = useState<LocationItem | null>(null);
  const [tukTukProgress, setTukTukProgress] = useState(0);

  // Passenger-specific steps
  const [passengerStep, setPassengerStep] = useState<PassengerStep>('home');

  // Driver-specific steps
  const [driverStep, setDriverStep] = useState<DriverStep>('idle');
  const [driverOnline, setDriverOnline] = useState(false);

  // Night Mode and Android support guide states
  const [nightMode, setNightMode] = useState<boolean>(false);
  const [showAndroidGuide, setShowAndroidGuide] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Admin secure verification states
  const [isAdminModalOpen, setIsAdminModalOpen] = useState<boolean>(false);
  const [adminPinInput, setAdminPinInput] = useState<string>('');
  const [adminError, setAdminError] = useState<string>('');

  // Interactive full simulation flow states
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simulationStatus, setSimulationStatus] = useState<string>('');

  // Start a completely automatic demonstration flow
  const handleStartAutoDemo = () => {
    if (isSimulating) return;
    setIsSimulating(true);
    setAppState('passenger_home');
    setUserRole('passenger');
    setPassengerStep('home');
    setPickup(POPULAR_LOCATIONS[0]);
    setDestination(POPULAR_LOCATIONS[1]);
    setTukTukProgress(0);
    setSimulationStatus('بدء تجربة محاكاة كاملة للرحلة آلياً... 🚀');

    // Step 1: Requesting a Ride
    setTimeout(() => {
      setPassengerStep('searching');
      setSimulationStatus('الراكب يبحث عن أقرب توك توك/موتوسيكل متاح... 🔍');
    }, 2500);

    // Step 2: Driver Side Alert (Switching View and state)
    setTimeout(() => {
      setUserRole('driver');
      setAppState('driver_home');
      setDriverOnline(true);
      setDriverStep('incoming');
      setSimulationStatus('وصل الطلب لكابتن التوك توك! جاري قبول الطلب... 🛺');
    }, 5500);

    // Step 3: Accept Ride
    setTimeout(() => {
      setDriverStep('on_trip');
      setPassengerStep('trip_active');
      setSimulationStatus('تم قبول الطلب! الكابتن يبدأ التحرك بالراكب... 🟢');
    }, 8500);

    // Step 4: Show passenger side tracking
    setTimeout(() => {
      setUserRole('passenger');
      setAppState('passenger_home');
      setSimulationStatus('تتبع الرحلة مباشرة على الخريطة! الكابتن متوجه للوجهة... 🗺️');
      
      // Animate progress bar
      let progress = 0;
      const progressInterval = setInterval(() => {
        progress += 10;
        setTukTukProgress(progress);
        if (progress >= 100) {
          clearInterval(progressInterval);
        }
      }, 400);
    }, 11500);

    // Step 5: Arrived & Rating
    setTimeout(() => {
      setPassengerStep('rating');
      setSimulationStatus('وصلنا بسلامة الله! يرجى تقييم الكابتن بـ 5 نجوم... ⭐');
    }, 16500);

    // Step 6: Complete
    setTimeout(() => {
      setPassengerStep('home');
      setDestination(null);
      setTukTukProgress(0);
      setIsSimulating(false);
      setSimulationStatus('تم إنهاء المحاكاة الآلية للرحلة بنجاح! جربها بنفسك الآن 🚀');
    }, 20500);
  };

  // Admin Verification
  const handleAdminVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPinInput === '2026' || adminPinInput === '1234') {
      setUserRole('owner');
      setAppState('passenger_home');
      setOwnerDashboardOpen(true);
      setIsAdminModalOpen(false);
      setAdminPinInput('');
      setAdminError('');
    } else {
      setAdminError('رمز المرور السري غير صحيح! يرجى المحاولة مرة أخرى.');
    }
  };

  // Splash Screen automatic navigation timer
  useEffect(() => {
    if (appState === 'splash') {
      const timer = setTimeout(() => {
        setAppState('login');
      }, 3500); // 3.5 seconds of brand presentation
      return () => clearTimeout(timer);
    }
  }, [appState]);

  // Handle successful phone login
  const handleLoginSuccess = (role: UserRole, phone: string, driverData?: any) => {
    setUserRole(role);
    setUserPhone(phone);
    if (driverData) {
      setRegisteredDriverData(driverData);
      localStorage.setItem('TAWSEELA_REGISTERED_DRIVER', JSON.stringify(driverData));
    } else {
      // Keep existing registered driver if switching role, don't wipe it out!
      const saved = localStorage.getItem('TAWSEELA_REGISTERED_DRIVER');
      if (saved) {
        setRegisteredDriverData(JSON.parse(saved));
      } else {
        setRegisteredDriverData(null);
      }
    }
    if (role === 'passenger') {
      setAppState('passenger_home');
      setPassengerStep('home');
      setPickup(POPULAR_LOCATIONS[0]);
      setDestination(null);
    } else if (role === 'owner') {
      setAppState('passenger_home');
      setPassengerStep('home');
      setPickup(POPULAR_LOCATIONS[0]);
      setDestination(null);
      setOwnerDashboardOpen(true);
    } else {
      setAppState('driver_home');
      setDriverStep('idle');
      setDriverOnline(false);
    }
  };

  // Toggle/switch roles on the fly for premium developer testing
  const handleQuickSwitchRole = () => {
    setProfileOpen(false);
    if (userRole === 'passenger') {
      setUserRole('driver');
      setAppState('driver_home');
      setDriverStep('idle');
      setDriverOnline(false);
    } else {
      setUserRole('passenger');
      setAppState('passenger_home');
      setPassengerStep('home');
      setPickup(POPULAR_LOCATIONS[0]);
      setDestination(null);
    }
  };

  const handleLogout = () => {
    setProfileOpen(false);
    setAppState('login');
    setUserPhone('');
  };

  // When clicking on the map, set coordinates
  const handleMapClick = (lat: number, lng: number, streetName: string) => {
    if (appState === 'passenger_home' && passengerStep === 'home') {
      const customLocation: LocationItem = {
        id: 'custom-' + Date.now(),
        name: streetName,
        lat,
        lng,
      };
      setDestination(customLocation);
    }
  };

  const currentAppUrl = typeof window !== 'undefined' ? window.location.origin : 'https://service-8351.ai.studio';

  return (
    <div id="tawseela_root_wrapper" className={`min-h-screen transition-colors duration-300 ${nightMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-800'} flex flex-col font-sans select-none antialiased`} dir="rtl">
      
      {/* Top Testing utility & role switcher bar */}
      <div className="bg-slate-900 border-b border-slate-800 text-white py-3 px-4 shadow-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-3">
          
          {/* Quick theme switcher and automatic simulator */}
          <div className="flex items-center gap-2">
            <button
              id="theme_toggle_btn"
              type="button"
              onClick={() => setNightMode(!nightMode)}
              title="تغيير مظهر التطبيق"
              className="bg-slate-800 hover:bg-slate-700 p-2 rounded-xl transition-all border border-slate-700 cursor-pointer"
            >
              {nightMode ? <Sun className="w-4 h-4 text-yellow-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
            </button>

            <button
              id="connection_settings_btn"
              type="button"
              onClick={() => setServerSettingsOpen(true)}
              title="إعدادات الربط والتحكم بالخادم"
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-3.5 py-2 rounded-xl transition-all shadow flex items-center gap-1.5 border border-emerald-500 cursor-pointer"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-100" />
              <span>إعدادات الربط 🔌</span>
            </button>
          </div>

          {/* Role selection tab */}
          <div className="flex bg-slate-800 rounded-2xl p-1 border border-slate-700">
            <button
              id="role_driver_tab"
              type="button"
              onClick={() => {
                setUserRole('driver');
                setAppState('driver_home');
                setDriverStep('idle');
                setDriverOnline(true);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                userRole === 'driver' ? 'bg-slate-100 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              سائق التوك توك 🛺
            </button>
            <button
              id="role_rider_tab"
              type="button"
              onClick={() => {
                setUserRole('passenger');
                setAppState('passenger_home');
                setPassengerStep('home');
                setPickup(POPULAR_LOCATIONS[0]);
                setDestination(null);
              }}
              className={`px-4 py-2 rounded-xl text-xs font-black transition-all cursor-pointer ${
                userRole === 'passenger' ? 'bg-slate-100 text-slate-900 shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              راغب التوصيلة (راكب) 👤
            </button>
          </div>

          {/* Small badge */}
          <div className="hidden lg:flex items-center gap-2">
            <span className="text-[10px] bg-green-950 text-green-400 font-bold px-2.5 py-1 rounded-full border border-green-600/30">
              مظهر أوبر للتوك توك بالكامل باللغة العربية
            </span>
          </div>

        </div>
      </div>
      
      {/* 1. SPLASH SCREEN */}
      {appState === 'splash' && (
        <div className="flex-1 flex flex-col items-center justify-center bg-white p-6 relative overflow-hidden" id="splash-viewport">
          {/* Subtle background circles */}
          <div className="absolute w-[500px] h-[500px] rounded-full bg-emerald-500/5 -top-32 -right-32 animate-pulse" />
          <div className="absolute w-[300px] h-[300px] rounded-full bg-emerald-500/5 -bottom-16 -left-16 animate-pulse" />

          <div className="text-center space-y-6 z-10">
            {/* Animated Ring Logo */}
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: [0.5, 1.1, 1], opacity: 1 }}
              transition={{ duration: 1.2, ease: 'easeOut' }}
              className="w-28 h-28 bg-emerald-600 rounded-[38px] mx-auto flex items-center justify-center text-5xl text-white shadow-2xl shadow-emerald-600/30 relative"
            >
              <span className="relative z-10 select-none animate-bounce">🛺</span>
              <div className="absolute inset-0 bg-gradient-to-tr from-emerald-700 to-emerald-500 rounded-[38px] opacity-40" />
              
              {/* Spinning visual compass around icon */}
              <div className="absolute inset-0 rounded-[38px] border-4 border-dashed border-emerald-300/30 animate-spin-slow" />
            </motion.div>

            <div className="space-y-2">
              <motion.h1
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="text-4xl font-black text-slate-900 tracking-tight"
              >
                توصيلة
              </motion.h1>
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.7, duration: 0.8 }}
                className="text-sm text-slate-500 font-bold"
              >
                تطبيق طلب التوك توك الأول بمصر 🇪🇬
              </motion.p>
            </div>

            {/* Custom interactive progress loader */}
            <div className="w-48 h-1.5 bg-slate-100 rounded-full mx-auto overflow-hidden relative">
              <div className="absolute h-full bg-emerald-600 rounded-full animate-progress" style={{ width: '80%' }} />
            </div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              transition={{ delay: 1.5 }}
              className="text-[10px] text-slate-400 font-bold"
            >
              تحميل الخرائط وتأكيد الـ GPS...
            </motion.p>

            <button
              onClick={() => setAppState('login')}
              className="mt-4 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition-transform active:scale-95 z-20 relative cursor-pointer"
            >
              تخطي العرض والبدء فوراً
            </button>
          </div>

          <div className="absolute bottom-6 text-[10px] text-slate-400 font-bold">
            نسخة تجريبية تفاعلية متميزة
          </div>
        </div>
      )}

      {/* 2. LOGIN SCREEN */}
      {appState === 'login' && (
        <div className="flex-1 flex items-center justify-center p-4 bg-slate-50 relative" id="login-viewport">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
      )}

      {/* 3. CORE PASSENGER & DRIVER DASHBOARD */}
      {(appState === 'passenger_home' || appState === 'driver_home') && (
        <div className="flex-1 flex flex-col h-screen overflow-hidden" id="dashboard-viewport">
          
          {/* HEADER NAV */}
          <header className={`${nightMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200/80 text-slate-800'} border-b px-4 py-3 shrink-0 flex items-center justify-between z-20 shadow-sm`}>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 bg-emerald-600 rounded-xl flex items-center justify-center text-lg text-white shadow-md shadow-emerald-600/10">
                🛺
              </div>
              <div>
                <h1 className="text-base font-black tracking-tight leading-none">توصيلة</h1>
                <div className="flex items-center gap-1 mt-0.5">
                  <span className="text-[9px] text-slate-400 font-bold">تطبيق طلب التوك توك</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${isLiveModeEnabled() ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                  <span className="text-[8px] text-slate-400 font-bold">
                    {isLiveModeEnabled() ? 'الربط حي 🔌' : 'محاكاة 📴'}
                  </span>
                </div>
              </div>
            </div>

            {/* Middle Quick switch notification/helper (shows current view) */}
            <div className={`hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${nightMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>
              <Radio className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
              <span>
                {userRole === 'passenger' ? 'لوحة الراكب: تصفح واطلب' : 'لوحة الكابتن: متصل بالـ GPS'}
              </span>
            </div>

            {/* Market live stream button */}
            <button
              onClick={() => setMarketDashboardOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-full text-xs font-black text-rose-700 animate-pulse cursor-pointer transition-all active:scale-95 shadow-sm"
              id="header-market-stream-btn"
            >
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <span>بث السوق المباشر 🔴</span>
            </button>

            {/* Server Connection Settings button */}
            <button
              onClick={() => setServerSettingsOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-full text-xs font-black text-emerald-700 cursor-pointer transition-all active:scale-95 shadow-sm"
              id="header-server-settings-btn"
            >
              <span>إعدادات الربط 🔌</span>
            </button>

            {/* Support ticket submission button */}
            <button
              onClick={() => setSupportModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-full text-xs font-black text-amber-700 cursor-pointer transition-all active:scale-95 shadow-sm"
              id="header-support-ticket-btn"
            >
              <span>تقديم بلاغ/شكوى 🛠️</span>
            </button>

            {/* Profile Dropdown controls */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className={`flex items-center gap-2 p-1.5 rounded-xl transition-all cursor-pointer focus:outline-none border ${nightMode ? 'hover:bg-slate-800 border-slate-800 bg-slate-900 text-slate-200' : 'hover:bg-slate-100 border-slate-100 bg-emerald-50 text-slate-800'}`}
                id="profile-dropdown-btn"
              >
                <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center text-emerald-600 shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="text-right hidden sm:block leading-none">
                  <p className="text-xs font-black">
                    {userRole === 'passenger' 
                      ? 'الراكب الكريم' 
                      : (registeredDriverData?.name || 'الكابتن المحترم')}
                  </p>
                  <span className="text-[8px] text-slate-400 font-mono" dir="ltr">
                    {userPhone ? `+20 ${userPhone.slice(0, 3)}***${userPhone.slice(-3)}` : 'تجربة سريعة'}
                  </span>
                </div>
              </button>

              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className={`absolute left-0 mt-2 w-52 rounded-2xl shadow-xl border z-30 p-2 space-y-1 ${nightMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-100 text-slate-800'}`}
                    id="profile-dropdown-menu"
                  >
                    {/* Switch role on the fly */}
                    <button
                      onClick={handleQuickSwitchRole}
                      className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-xs font-bold text-emerald-700 flex items-center justify-between"
                    >
                      <span>تبديل الحساب (راكب ⇄ سائق)</span>
                      <ArrowLeftRight className="w-4 h-4 shrink-0 text-emerald-600" />
                    </button>

                    <div className="border-t border-slate-100 my-1" />

                    <button
                      onClick={handleLogout}
                      className="w-full text-right px-3 py-2.5 rounded-xl hover:bg-rose-50 text-rose-600 transition-colors text-xs font-bold flex items-center justify-between"
                    >
                      <span>تسجيل الخروج</span>
                      <LogOut className="w-4 h-4 shrink-0 text-rose-500" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </header>

          {/* MAIN DUAL-COLUMN BENTO GRID VIEW */}
          <main className="flex-1 flex flex-col md:flex-row overflow-hidden relative">
            
            {/* COLUMN 1: LIVE INTERACTIVE GPS MAP */}
            <section className="flex-1 h-[40%] md:h-full relative overflow-hidden" id="map-column">
              <MapSimulator
                pickup={pickup}
                destination={destination}
                step={userRole === 'passenger' ? passengerStep : driverStep}
                userRole={userRole}
                onMapClick={handleMapClick}
                tukTukProgress={tukTukProgress}
                driverStepType={
                  driverStep === 'on_trip'
                    ? (passengerStep === 'trip_active' ? 'destination' : 'pickup')
                    : 'pickup'
                }
              />
            </section>

            {/* COLUMN 2: BOOKING / WORKFLOW PANEL SHEET */}
            <section className={`w-full md:w-[380px] lg:w-[420px] h-[60%] md:h-full border-r md:border-r-0 md:border-l shadow-2xl flex flex-col z-10 shrink-0 overflow-y-auto ${nightMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-white border-slate-200 text-slate-800'}`} id="control-panel-column">
              
              {/* Quick switch tabs for testing in container environment */}
              <div className={`p-2 text-center text-[10px] font-bold shrink-0 border-b flex justify-between items-center px-4 ${nightMode ? 'bg-slate-800 border-slate-700 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500'}`}>
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  <span>لتسجيل المراجعة السريعة:</span>
                </span>
                <button
                  onClick={handleQuickSwitchRole}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-[9px] font-black px-2 py-1 rounded-md shadow-sm transition-all active:scale-95 cursor-pointer"
                >
                  اضغط للتحويل الفوري لـ {userRole === 'passenger' ? 'سائق' : 'راكب'}
                </button>
              </div>

              {/* Collapsible Mobile/Android Support & QR Code Banner */}
              {showAndroidGuide && (
                <div className={`p-4 border-b text-right relative overflow-hidden ${nightMode ? 'bg-slate-950/60 border-slate-800' : 'bg-gradient-to-r from-emerald-50/50 to-teal-50/50 border-emerald-100'}`}>
                  <button
                    onClick={() => setShowAndroidGuide(false)}
                    className="absolute top-3 left-3 text-slate-400 hover:text-rose-500 text-sm font-bold w-5 h-5 rounded-full flex items-center justify-center transition-all bg-slate-100/80 hover:bg-slate-200/80 cursor-pointer"
                    title="إغلاق الإرشاد"
                  >
                    ×
                  </button>
                  
                  <div className="flex flex-col gap-3.5">
                    <div className="flex items-center gap-2 justify-end">
                      <span className="text-[9px] bg-emerald-500/15 text-emerald-600 font-extrabold px-2 py-0.5 rounded-full border border-emerald-500/20">رابط المشاركة العام 🟢</span>
                      <h3 className={`text-xs font-black flex items-center gap-1.5 ${nightMode ? 'text-slate-200' : 'text-slate-900'}`}>
                        📱 تشغيل التطبيق على الهاتف المحمول
                      </h3>
                    </div>
                    
                    <p className={`text-[11px] leading-relaxed ${nightMode ? 'text-slate-400' : 'text-slate-600'}`}>
                      لتجربة التتبع الحي والـ GPS على هاتفك دون مشاكل، يرجى مسح الكود المرفق أو استخدام رابط المشاركة:
                    </p>

                    <div className="flex items-center gap-3 bg-white p-2.5 rounded-2xl border border-slate-100 shadow-sm">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(currentAppUrl)}`}
                        alt="موقع التطبيق للهاتف"
                        className="w-[75px] h-[75px] select-all pointer-events-auto shrink-0 border border-slate-100 rounded-lg"
                      />
                      <div className="text-right space-y-1 flex-1">
                        <span className="text-[9px] text-slate-850 font-black block">امسح الكود بكاميرا الهاتف 📷</span>
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(currentAppUrl);
                              setCopiedLink(true);
                              setTimeout(() => setCopiedLink(false), 3000);
                            }}
                            className="bg-slate-800 hover:bg-slate-900 text-white font-black text-[9px] px-2 py-1 rounded-lg transition-all flex-1 cursor-pointer"
                          >
                            {copiedLink ? "تم النسخ! ✓" : "نسخ الرابط 📋"}
                          </button>
                          <a
                            href={currentAppUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[9px] px-2 py-1 rounded-lg text-center transition-all flex-1"
                          >
                            فتح 🚀
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

               {userRole === 'passenger' ? (
                <PassengerPanel
                  step={passengerStep}
                  setStep={setPassengerStep}
                  pickup={pickup}
                  setPickup={setPickup}
                  destination={destination}
                  setDestination={setDestination}
                  tukTukProgress={tukTukProgress}
                  setTukTukProgress={setTukTukProgress}
                  userPhone={userPhone}
                />
              ) : (
                <DriverPanel
                  step={driverStep}
                  setStep={setDriverStep}
                  isOnline={driverOnline}
                  setIsOnline={setDriverOnline}
                  tukTukProgress={tukTukProgress}
                  setTukTukProgress={setTukTukProgress}
                  userPhone={userPhone}
                  registeredDriverData={registeredDriverData}
                  onRegisterDriver={(driverData) => {
                    setRegisteredDriverData(driverData);
                    localStorage.setItem('TAWSEELA_REGISTERED_DRIVER', JSON.stringify(driverData));
                  }}
                  onAcceptRide={() => {
                    // Sync passenger states if they are testing both
                    setPassengerStep('trip_active');
                  }}
                />
              )}
            </section>

          </main>

        </div>
      )}

      {marketDashboardOpen && (
        <MarketLaunchDashboard onClose={() => setMarketDashboardOpen(false)} />
      )}

      {ownerDashboardOpen && (
        <OwnerDashboard onClose={() => setOwnerDashboardOpen(false)} userPhone={userPhone} />
      )}

      {supportModalOpen && (
        <SupportModal
          onClose={() => setSupportModalOpen(false)}
          userPhone={userPhone}
          userRole={userRole}
        />
      )}

      <ServerSettingsModal
        isOpen={serverSettingsOpen}
        onClose={() => setServerSettingsOpen(false)}
      />

      {/* Aesthetic bottom footer credits */}
      <footer className={`text-center text-xs ${nightMode ? 'text-slate-500' : 'text-slate-400'} font-medium mt-16 max-w-sm mx-auto space-y-2 pb-8`}>
        <p>توصيلة © {new Date().getFullYear()} - جميع الحقوق محفوظة</p>
        <p className="text-[10px] text-slate-500">تم تطويره كنسخة أندرويد تفاعلية متكاملة لأجهزة الويب المتقدمة</p>
        <div className="pt-1">
          <button
            type="button"
            onClick={() => {
              setAdminError('');
              setAdminPinInput('');
              setIsAdminModalOpen(true);
            }}
            className="text-[10px] text-slate-500 hover:text-emerald-500 hover:underline transition-all bg-transparent border-0 cursor-pointer font-bold focus:outline-none"
          >
            🔒 تسجيل دخول إدارة المنصة
          </button>
        </div>
      </footer>

      {/* Admin Login PIN Modal */}
      {isAdminModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn text-slate-100">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 w-full max-w-md text-right shadow-2xl relative space-y-5">
            <button
              type="button"
              onClick={() => setIsAdminModalOpen(false)}
              className="absolute top-4 left-4 text-slate-400 hover:text-white text-sm font-bold bg-slate-800 hover:bg-slate-700 w-7 h-7 rounded-full flex items-center justify-center transition-all cursor-pointer"
            >
              ×
            </button>

            <div className="flex items-center gap-2 justify-end pt-2">
              <h3 className="text-base font-black text-white">بوابة الإدارة الآمنة 🏛️</h3>
              <Shield className="w-5 h-5 text-emerald-400" />
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              هذا القسم مخصص لإدارة تطبيق توصيلة وتجديد اشتراكات الكباتن ومتابعة الأرباح بالمنطقة. يرجى إدخال رمز المرور السري للمسؤول:
            </p>

            <form onSubmit={handleAdminVerify} className="space-y-4">
              <div className="space-y-1.5">
                <input
                  type="password"
                  required
                  autoFocus
                  placeholder="••••"
                  value={adminPinInput}
                  onChange={(e) => {
                    setAdminPinInput(e.target.value);
                    setAdminError('');
                  }}
                  className="w-full text-center tracking-widest font-mono text-lg bg-slate-950 border border-slate-800 text-white rounded-xl p-3 focus:outline-none focus:border-emerald-500 placeholder-slate-800"
                />
                {adminError && (
                  <p className="text-[10px] text-rose-400 font-bold">{adminError}</p>
                )}
                <p className="text-[9px] text-slate-500 text-center font-bold">تلميح للتجربة: الرمز الافتراضي هو 2026 أو 1234</p>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs py-3 rounded-xl transition-all shadow-md shadow-emerald-950/40 active:scale-95 cursor-pointer"
                >
                  تأكيد الدخول والتحقق 🔑
                </button>
                <button
                  type="button"
                  onClick={() => setIsAdminModalOpen(false)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-extrabold text-xs px-4 rounded-xl transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
