/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Users,
  Compass,
  MapPin,
  Clock,
  Sparkles,
  CheckCircle,
  X,
  Radio,
  Percent,
  Activity,
  Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface MarketLaunchDashboardProps {
  onClose: () => void;
}

interface LiveEvent {
  id: string;
  time: string;
  text: string;
  type: 'order' | 'captain' | 'rating' | 'system' | 'vip';
  location: string;
}

const INITIAL_EVENTS: LiveEvent[] = [
  { id: '1', time: '10:02 ص', text: 'كابتن محمد عاشور (البرنس) أكمل رحلة من الوقف (المركز) إلى السنابسة 🛺', type: 'order', location: 'السنابسة' },
  { id: '2', time: '10:01 ص', text: 'راكب طلب فئة "توك توك فيب" مع تشغيل مهرجانات شعبية صاخبة 🔊', type: 'vip', location: 'الوقف (المركز)' },
  { id: '3', time: '10:00 ص', text: 'تم التحقق من رخصة كابتن جديد بنجاح وتفعيل حسابه بالمنصة ✅', type: 'captain', location: 'جبل العماير' },
  { id: '4', time: '09:58 ص', text: 'تطبيق الخصم "TAWSEELA20" لراكب وفر له ٦ جنيهات مصري 💰', type: 'system', location: 'المراشدة' },
  { id: '5', time: '09:55 ص', text: 'راكب قيم الكابتن "سيد التوربيني" بـ ٥ نجوم: "أمين وسريع جداً" ⭐', type: 'rating', location: 'الوقف (المركز)' }
];

const LOCATIONS_LIST = [
  'الوقف (المركز)',
  'السنابسة',
  'البهايجة',
  'الدندراوية',
  'المداكير',
  'الرنان',
  'جبل العماير',
  'الخمسين',
  'جبل السنابسة',
  'الوشاحية',
  'المراشدة',
  'القلمينا',
  'المشوشة',
  'رنة',
  'العرب والنجاجرة',
  'المنشية',
  'المعادي',
  'المستشفى المركزي',
  'وحدة المطافي'
];
const CAPTAINS_LIST = ['أبو أنس الجدع', 'محمد عاشور', 'سيد التوربيني', 'حسين الكهربا', 'هاني الديزل', 'كريم المانسترلي'];
const EVENT_TEXTS = [
  'طلب مشوار توك توك اقتصادي من {loc1} إلى {loc2} 🛺',
  'كابتن {cap} بدأ بالتحرك الفوري لاستلام الزبون من {loc1} 🗺️',
  'مشوار VIP نشط الآن في {loc1} مع سماعات دي جي ديجيتال 🎵',
  'أكمل كابتن {cap} مشواره بنجاح واستلم الحساب نقداً {fare} ج.م 💰',
  'راكب سعيد كتب: "التوك توك مريح جداً ونظيف وصوت المهرجانات حكاية" 👍',
  'تم التحقق من مستندات كابتن جديد وانضمامه لأسطول توصيلة 🚀',
  'راكب قام بتقييم ٥ نجوم لكابتن {cap} مع عبارة "أمين وجدع" ⭐'
];

export default function MarketLaunchDashboard({ onClose }: MarketLaunchDashboardProps) {
  const [activeCaptains, setActiveCaptains] = useState(142);
  const [completedToday, setCompletedToday] = useState(2450);
  const [avgRating, setAvgRating] = useState(4.88);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(INITIAL_EVENTS);

  // Generate simulated events continuously to show live market activity
  useEffect(() => {
    const interval = setInterval(() => {
      // Slightly fluctuate metrics
      setActiveCaptains(prev => prev + (Math.random() > 0.5 ? 1 : -1));
      setCompletedToday(prev => prev + 1);
      
      // Random event generation
      const randomLoc1 = LOCATIONS_LIST[Math.floor(Math.random() * LOCATIONS_LIST.length)];
      let randomLoc2 = LOCATIONS_LIST[Math.floor(Math.random() * LOCATIONS_LIST.length)];
      while (randomLoc2 === randomLoc1) {
        randomLoc2 = LOCATIONS_LIST[Math.floor(Math.random() * LOCATIONS_LIST.length)];
      }
      const randomCap = CAPTAINS_LIST[Math.floor(Math.random() * CAPTAINS_LIST.length)];
      const randomFare = Math.floor(15 + Math.random() * 25);
      
      const textTemplate = EVENT_TEXTS[Math.floor(Math.random() * EVENT_TEXTS.length)];
      const eventText = textTemplate
        .replace('{loc1}', randomLoc1)
        .replace('{loc2}', randomLoc2)
        .replace('{cap}', randomCap)
        .replace('{fare}', randomFare.toString());

      const eventTypes: ('order' | 'captain' | 'rating' | 'system' | 'vip')[] = ['order', 'captain', 'vip', 'rating', 'system'];
      const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];

      const now = new Date();
      const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      const newEvent: LiveEvent = {
        id: Date.now().toString(),
        time: timeStr,
        text: eventText,
        type: randomType,
        location: randomLoc1
      };

      setLiveEvents(prev => [newEvent, ...prev.slice(0, 15)]);
    }, 4500);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-slate-900/85 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto" id="market-launch-dashboard-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="w-full max-w-4xl bg-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 flex flex-col max-h-[90vh]"
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-700 via-emerald-600 to-emerald-500 text-white px-6 py-5 shrink-0 flex items-center justify-between shadow-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-2xl flex items-center justify-center text-2xl animate-bounce">
              🚀
            </div>
            <div className="text-right">
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>توصيلة: بث السوق المباشر</span>
                <span className="bg-rose-500 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                  بث حي الآن
                </span>
              </h2>
              <p className="text-[11px] text-emerald-100 font-semibold">متابعة فورية لمؤشرات الإطلاق التجريبي ومبيعات التوك توك بمصر 🇪🇬</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all active:scale-90"
            id="close-market-dashboard-btn"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 bg-slate-50 text-right">
          
          {/* TOP CARDS: REAL-TIME KEY PERFORMANCE INDICATORS */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4" id="market-kpi-grid">
            
            {/* KPI 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Users className="w-5 h-5 text-emerald-600" />
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">نشط بالـ GPS</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 font-mono">{activeCaptains}</span>
                <p className="text-[10px] text-slate-400 font-bold mt-1">كابتن متصل على الطريق</p>
              </div>
            </div>

            {/* KPI 2 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full font-bold">مبيعات اليوم</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 font-mono">{completedToday}</span>
                <p className="text-[10px] text-slate-400 font-bold mt-1">رحلة مكتملة بنجاح</p>
              </div>
            </div>

            {/* KPI 3 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Sparkles className="w-5 h-5 text-amber-500" />
                <span className="text-[9px] text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full font-bold">تقييم الزبائن</span>
              </div>
              <div className="mt-2">
                <span className="text-2xl font-black text-slate-800 font-mono">{avgRating} / 5.0</span>
                <p className="text-[10px] text-slate-400 font-bold mt-1">متوسط تقييم الرحلات العام</p>
              </div>
            </div>

            {/* KPI 4 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <Radio className="w-5 h-5 text-emerald-600" />
                <span className="text-[9px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">الخوادم والـ GPS</span>
              </div>
              <div className="mt-2">
                <span className="text-lg font-black text-emerald-600">مستقر ١٠٠٪</span>
                <p className="text-[10px] text-slate-400 font-bold mt-1">حالة اتصال الأقمار الصناعية</p>
              </div>
            </div>

          </div>

          {/* TWO PANEL SECTION: HOT ZONES & LIVE STREAMS */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* LEFT COLUMN: CAIRO NEIGHBORHOOD DEMAND INDEX & CODES */}
            <div className="md:col-span-5 space-y-6">
              
              {/* Hot Demand Index */}
              <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-4">
                <h3 className="text-xs font-black text-slate-800 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="flex items-center gap-1.5">
                    <Activity className="w-4 h-4 text-emerald-600 animate-pulse" />
                    <span>مؤشر الطلب والأسعار المتغيرة</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-bold">محدث فورياً</span>
                </h3>

                <div className="space-y-3" id="demand-index-list">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="font-bold text-slate-800">الوقف (المركز) والمستشفى</span>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">زحام شديد (٢.٤x) 🔥</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-ping" />
                      <span className="font-bold text-slate-800">السنابسة والمنشية</span>
                    </div>
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">طلب مرتفع (٢.٠x) 🔥</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-amber-500 rounded-full" />
                      <span className="font-bold text-slate-800">جبل العماير والمراشدة</span>
                    </div>
                    <span className="font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-lg">زحام متوسط (١.٥x) ⚡</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full" />
                      <span className="font-bold text-slate-800">البهايجة والدندراوية</span>
                    </div>
                    <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">مستقر (١.٢x) 👍</span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-slate-400 rounded-full" />
                      <span className="font-bold text-slate-800">الوشاحية والمداكير</span>
                    </div>
                    <span className="font-bold text-slate-500 bg-slate-50 px-2 py-1 rounded-lg">طبيعي (١.٠x)</span>
                  </div>
                </div>
              </div>

              {/* Marketing Launch Coupons */}
              <div className="bg-gradient-to-tr from-slate-900 to-slate-800 text-white p-5 rounded-2xl shadow-md space-y-4">
                <div className="flex justify-between items-center border-b border-slate-700/60 pb-2.5">
                  <h4 className="text-xs font-black text-amber-400 flex items-center gap-1.5">
                    <Percent className="w-4 h-4 text-amber-400" />
                    <span>أكواد خصم إطلاق السوق</span>
                  </h4>
                  <span className="text-[9px] text-slate-400 font-bold">حملات تسويقية</span>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-100">كود الخصم الترحيبي</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">خصم ٢٠٪ لأول ٥ مشاوير</p>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg font-mono border border-slate-700 select-all">
                      TAWSEELA20
                    </span>
                  </div>

                  <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 flex justify-between items-center">
                    <div className="text-right">
                      <span className="text-xs font-black block text-slate-100">عرض المشوار المجاني</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">مشوار مجاني بالكامل للتجربة</p>
                    </div>
                    <span className="text-xs font-black text-amber-400 bg-slate-900 px-3 py-1.5 rounded-lg font-mono border border-slate-700 select-all">
                      FREE
                    </span>
                  </div>
                </div>

                <div className="pt-1 text-center">
                  <p className="text-[10px] text-slate-400 font-semibold flex items-center justify-center gap-1">
                    <span>صُنعت بكل حب وتفاني لخدمة أهلنا بمصر</span>
                    <Heart className="w-3 h-3 text-rose-500 fill-current shrink-0" />
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: LIVE REAL-TIME FEED (SCROLLS SMOOTHLY) */}
            <div className="md:col-span-7 flex flex-col bg-white rounded-2xl border border-slate-100 shadow-sm p-5 space-y-4">
              <div className="flex justify-between items-center border-b border-slate-100 pb-3">
                <h3 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                  </span>
                  <span>بث مباشر للعمليات (Live Activity Feed)</span>
                </h3>
                <span className="text-[9px] font-bold text-slate-400 font-mono">محدث منذ ثانية</span>
              </div>

              {/* Scroll Container */}
              <div className="flex-1 overflow-y-auto max-h-[350px] space-y-3 pr-1" id="live-events-scroller">
                <AnimatePresence initial={false}>
                  {liveEvents.map((event) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: 20, height: 0 }}
                      animate={{ opacity: 1, x: 0, height: 'auto' }}
                      exit={{ opacity: 0, x: -20, height: 0 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                      className="p-3 bg-slate-50 border border-slate-100/80 hover:bg-slate-100/50 rounded-xl flex justify-between items-start text-xs font-bold leading-relaxed transition-colors"
                    >
                      <div className="text-right flex-1 pl-3">
                        <p className="text-slate-700">{event.text}</p>
                        <div className="flex gap-2 items-center mt-1.5 text-[10px] text-slate-400 font-semibold">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{event.location}</span>
                          </span>
                          <span>•</span>
                          <span className="bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-500 text-[8px] font-mono">
                            {event.type.toUpperCase()}
                          </span>
                        </div>
                      </div>

                      <div className="text-left shrink-0 font-mono text-[10px] text-slate-400 pt-0.5">
                        {event.time}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              <div className="text-center pt-2 border-t border-slate-100 text-[10px] text-slate-400 font-semibold">
                مجموع الطلبات المعالجة بالبث الحي: {liveEvents.length} طلبات نشطة
              </div>
            </div>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-slate-50 px-6 py-4 shrink-0 flex justify-between items-center border-t border-slate-100">
          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-semibold">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>نظام الحماية من الاحتيال وتأكيد تراخيص السائقين مفعل</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md shadow-emerald-600/10 active:scale-95 transition-all cursor-pointer"
          >
            العودة للوحة القيادة ومواصلة التجربة
          </button>
        </div>

      </motion.div>
    </div>
  );
}
