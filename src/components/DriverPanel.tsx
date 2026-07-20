/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { DriverStep, EarningRecord, ChatMessage } from '../types';
import { MOCK_EARNINGS, DRIVER_DOCUMENTS } from '../data';
import { getApiUrl, isLiveModeEnabled } from '../utils/api';
import {
  ShieldAlert,
  ToggleLeft,
  ToggleRight,
  TrendingUp,
  FileText,
  CheckCircle,
  Clock,
  MapPin,
  X,
  Play,
  Check,
  MessageSquare,
  Phone,
  Send,
  UploadCloud,
  ChevronLeft,
  Star,
  Calendar,
  CreditCard,
  AlertCircle,
  Info,
  Lock,
  Unlock,
  Sparkles,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface DriverPanelProps {
  step: DriverStep;
  setStep: (step: DriverStep) => void;
  isOnline: boolean;
  setIsOnline: (online: boolean) => void;
  tukTukProgress: number;
  setTukTukProgress: React.Dispatch<React.SetStateAction<number>>;
  onAcceptRide?: () => void;
  userPhone?: string;
  registeredDriverData?: {
    name: string;
    nationalId: string;
    vehicleType?: 'tuktuk' | 'motorcycle' | 'scooter';
    personalPhoto: string | null;
    nationalIdPhoto: string | null;
    tukTukBackPhoto: string | null;
  } | null;
  onRegisterDriver?: (driverData: any) => void;
}

export default function DriverPanel({
  step,
  setStep,
  isOnline,
  setIsOnline,
  tukTukProgress,
  setTukTukProgress,
  onAcceptRide,
  userPhone,
  registeredDriverData,
  onRegisterDriver,
}: DriverPanelProps) {
  // Stats & earnings
  const [earningsTab, setEarningsTab] = useState<'today' | 'week' | 'month'>('today');
  const [todayTotal, setTodayTotal] = useState(95);
  const [weeklyTotal, setWeeklyTotal] = useState(680);
  const [monthlyTotal, setMonthlyTotal] = useState(2900);
  const [earningsList, setEarningsList] = useState<EarningRecord[]>(MOCK_EARNINGS);

  // Local inline onboarding/registration states
  const [localDriverName, setLocalDriverName] = useState('');
  const [localNationalId, setLocalNationalId] = useState('');
  const [localVehicleType, setLocalVehicleType] = useState<'tuktuk' | 'motorcycle' | 'scooter'>('tuktuk');
  const [localError, setLocalError] = useState('');

  // Driver Subscription Trial State
  const [trialDaysLeft, setTrialDaysLeft] = useState<number>(() => {
    const saved = localStorage.getItem('tuk_driver_trial_days');
    return saved !== null ? parseInt(saved, 10) : 15;
  });
  const [isPaidUser, setIsPaidUser] = useState<boolean>(() => {
    return localStorage.getItem('tuk_driver_is_paid') === 'true';
  });
  const [showSubscriptionAlert, setShowSubscriptionAlert] = useState<boolean>(false);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [selectedPlan, setSelectedPlan] = useState<'weekly' | 'monthly'>('monthly');
  const [paymentMethod, setPaymentMethod] = useState<'vodafone' | 'fawry' | 'card'>('vodafone');
  const [mobileNumber, setMobileNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Sponsor ads state
  const [ads, setAds] = useState<any[]>([]);

  useEffect(() => {
    const fetchSponsorAds = async () => {
      try {
        const res = await fetch(getApiUrl('/api/ads'));
        if (res.ok) {
          const data = await res.json();
          setAds(data.filter((a: any) => a.isActive));
        }
      } catch (e) {
        console.warn("Could not fetch sponsor ads for driver panel:", e);
      }
    };
    fetchSponsorAds();
  }, []);

  useEffect(() => {
    localStorage.setItem('tuk_driver_trial_days', trialDaysLeft.toString());
  }, [trialDaysLeft]);

  useEffect(() => {
    localStorage.setItem('tuk_driver_is_paid', isPaidUser ? 'true' : 'false');
  }, [isPaidUser]);

  const handleToggleOnline = () => {
    const isTrialExpired = trialDaysLeft <= 0 && !isPaidUser;
    if (isTrialExpired) {
      setShowSubscriptionAlert(true);
      setIsOnline(false);
      return;
    }
    const nextOnlineState = !isOnline;
    setIsOnline(nextOnlineState);
    if (nextOnlineState) {
      setStep('idle');
    }
  };

  // Documents checklist upload mocks
  const [uploadedDocs, setUploadedDocs] = useState<string[]>(() => {
    if (registeredDriverData) {
      return ['national_id', 'vehicle_photo'];
    }
    return ['national_id', 'driver_license'];
  });
  const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Live and simulated incoming ride state
  const [activeRideId, setActiveRideId] = useState<string | null>(null);
  const [activeServerRide, setActiveServerRide] = useState<any | null>(null);
  const [incomingTimeLeft, setIncomingTimeLeft] = useState(20);
  const [simulatedPassenger, setSimulatedPassenger] = useState({
    id: '',
    name: 'أحمد علي (الزبون)',
    pickup: 'السنابسة',
    destination: 'الوقف (المركز)',
    distance: '١.٥ كم',
    fare: 15
  });

  // Dual chat during ride
  const [chatOpen, setChatOpen] = useState(false);
  const [callActive, setCallActive] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    { id: '1', sender: 'passenger', text: 'يا كابتن أنا واقف جنب سوبر ماركت خير زمان، التوك توك لونه أحمر؟', time: '10:45 ص' }
  ]);
  const [messageText, setMessageText] = useState('');

  // Safety PIN verification to prevent fraud and theft
  const [enteredPin, setEnteredPin] = useState('');
  const [pinError, setPinError] = useState('');
  const [showPinPrompt, setShowPinPrompt] = useState(false);

  // Inside-trip step: 'go_to_pickup' | 'arrived' | 'driving' | 'completed'
  const [tripSubStep, setTripSubStep] = useState<'go_to_pickup' | 'arrived' | 'driving'>('go_to_pickup');

  // 1. Live server available rides poll for Drivers
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOnline && step === 'idle') {
      const checkAvailableRides = async () => {
        try {
          const response = await fetch(getApiUrl('/api/rides/nearby'));
          if (response.ok) {
            const ridesList = await response.json();
            if (Array.isArray(ridesList) && ridesList.length > 0) {
              const liveRide = ridesList[0]; // grab first available passenger
              setActiveServerRide(liveRide);
              setSimulatedPassenger({
                id: liveRide.id,
                name: 'عميل كريم تكيلا (' + liveRide.passengerPhone.slice(-4) + ')',
                pickup: liveRide.pickup.name,
                destination: liveRide.destination.name,
                distance: liveRide.distance + ' كم',
                fare: liveRide.fare
              });
              setStep('incoming');
              setIncomingTimeLeft(25);
            }
          }
        } catch (e) {
          console.warn("Nearby API is quiet, using offline simulated jobs:", e);
        }
      };

      interval = setInterval(checkAvailableRides, 3000);
      checkAvailableRides();
    }
    return () => clearInterval(interval);
  }, [isOnline, step, setStep]);

  // 2. Poll and Sync chat messages from the server during trip
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'on_trip' && activeRideId) {
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
          console.warn("Driver live chat fetch error:", e);
        }
      };

      interval = setInterval(fetchMessages, 2500);
      fetchMessages();
    }
    return () => clearInterval(interval);
  }, [step, activeRideId]);

  // Poll active ride status for the driver to keep in sync with passenger's status changes
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (step === 'on_trip' && activeRideId) {
      const fetchRideStatus = async () => {
        try {
          const phoneParam = userPhone || '01011223344';
          const response = await fetch(getApiUrl(`/api/rides/active?phone=${phoneParam}&role=driver`));
          if (response.ok) {
            const data = await response.json();
            if (data && data.id) {
              if (data.status === 'canceled') {
                // Passenger canceled the ride
                setStep('idle');
                setActiveRideId(null);
                setActiveServerRide(null);
                alert('قام الراكب بإلغاء الرحلة!');
              } else if (data.status === 'completed') {
                // Trip completed
                setStep('idle');
                setActiveRideId(null);
                setActiveServerRide(null);
              }
            } else {
              // Ride no longer exists or is inactive
              setStep('idle');
              setActiveRideId(null);
              setActiveServerRide(null);
            }
          }
        } catch (e) {
          console.warn("Driver live status poll error:", e);
        }
      };

      interval = setInterval(fetchRideStatus, 3000);
      fetchRideStatus();
    }
    return () => clearInterval(interval);
  }, [step, activeRideId, userPhone]);

  // Standalone Fallback: Trigger auto simulated incoming request when toggling online (if no live rides exist) (Disabled in live mode)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isOnline && step === 'idle' && !activeServerRide && !isLiveModeEnabled()) {
      timer = setTimeout(() => {
        // Customize based on vehicle type (motorcycle/scooter = delivery, tuktuk = passenger)
        const isDelivery = registeredDriverData?.vehicleType === 'motorcycle' || registeredDriverData?.vehicleType === 'scooter';
        
        const requests = isDelivery ? [
          { name: 'مطعم البركة (توصيل وجبة غداء)', pickup: 'شارع المنشية الرئيسي', destination: 'عمارة المهندسين - شقة ٤', distance: '٢.٨ كم', fare: 25 },
          { name: 'مكتبة الرسالة (طرد مستندات عاجل)', pickup: 'الوقف (المركز)', destination: 'المستشفى المركزي - خدمة العملاء', distance: '١.٥ كم', fare: 20 },
          { name: 'سوبرماركت الهلال (طلب بقالة منزلية)', pickup: 'ميدان السنابسة', destination: 'جبل العماير - فيلا ٢', distance: '٣.٢ كم', fare: 35 }
        ] : [
          { name: 'كريم خالد', pickup: 'المراشدة', destination: 'البهايجة', distance: '٣.٥ كم', fare: 30 },
          { name: 'أميرة أحمد', pickup: 'المنشية', destination: 'الوقف (المركز)', distance: '١.٢ كم', fare: 15 },
          { name: 'محمود حسن', pickup: 'المستشفى المركزي', destination: 'جبل العماير', distance: '٤ كم', fare: 35 }
        ];

        const selectedReq = requests[Math.floor(Math.random() * requests.length)];
        setSimulatedPassenger({
          id: '',
          name: selectedReq.name,
          pickup: selectedReq.pickup,
          destination: selectedReq.destination,
          distance: selectedReq.distance,
          fare: selectedReq.fare
        });
        setStep('incoming');
        setIncomingTimeLeft(20);
      }, 9000); // Wait 9 seconds of quiet before showing mock client
    }
    return () => clearTimeout(timer);
  }, [isOnline, step, activeServerRide, setStep, registeredDriverData]);

  // Incoming countdown
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'incoming' && incomingTimeLeft > 0) {
      timer = setTimeout(() => {
        setIncomingTimeLeft(incomingTimeLeft - 1);
      }, 1000);
    } else if (step === 'incoming' && incomingTimeLeft === 0) {
      setStep('idle'); // Expired
      setActiveServerRide(null);
    }
    return () => clearTimeout(timer);
  }, [step, incomingTimeLeft, setStep]);

  // Simulate progress of driving from pickup to destination (if simulated)
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'on_trip' && tripSubStep === 'driving' && !activeRideId && tukTukProgress < 100) {
      timer = setTimeout(() => {
        setTukTukProgress(tukTukProgress + 2);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [step, tripSubStep, tukTukProgress, activeRideId, setTukTukProgress]);

  // POST ride accepted status to server
  const handleAcceptRide = async () => {
    if (activeServerRide) {
      try {
        const response = await fetch(getApiUrl('/api/rides/accept'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeServerRide.id,
            driverPhone: userPhone || '01011223344',
            driverName: 'الكابتن المحترم أبو أنس',
            driverVehicle: 'توك توك الـجـوكـر (لوحة: م ص ر ٢٨٤)',
            driverRating: 4.9
          })
        });

        if (response.ok) {
          const updatedRide = await response.json();
          setActiveRideId(updatedRide.id);
          setStep('on_trip');
          setTripSubStep('go_to_pickup');
          setTukTukProgress(0);
          if (onAcceptRide) onAcceptRide();
          return;
        }
      } catch (err) {
        console.warn("Could not accept ride on server, using simulation fallback:", err);
      }
    }

    // Offline mode accept
    setStep('on_trip');
    setTripSubStep('go_to_pickup');
    setTukTukProgress(0);
    if (onAcceptRide) onAcceptRide();
  };

  // Helper to push status updates to backend during the active ride
  const updateServerStatus = async (newStatus: string) => {
    if (activeRideId) {
      try {
        await fetch(getApiUrl('/api/rides/update-status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeRideId,
            status: newStatus
          })
        });
      } catch (err) {
        console.warn("Could not update status on server:", err);
      }
    }
  };

  // Send driver chat message to passenger
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageText.trim()) return;

    const timestamp = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const driverMsg: ChatMessage = {
      id: 'local-drv-' + Date.now(),
      sender: 'driver',
      text: messageText,
      time: timestamp
    };

    setChatMessages((prev) => [...prev, driverMsg]);
    const originalText = messageText;
    setMessageText('');

    if (activeRideId) {
      try {
        await fetch(getApiUrl('/api/rides/chat/send'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeRideId,
            sender: 'driver',
            text: originalText
          })
        });
      } catch (err) {
        console.warn("Failed sending server chat from driver");
      }
    } else {
      // Offline fallback: chat reply
      setTimeout(() => {
        let passengerReply = 'تمام مستنيك يا كابتن، الله ينور عليك.';
        const text = originalText;
        
        if (text.includes('وصلت') || text.includes('عندك') || text.includes('برة')) {
          passengerReply = 'تمام يا كابتن أنا شايفك أهو، لابس قميص كحلي وواقف على الرصيف.';
        } else if (text.includes('فين') || text.includes('علامة')) {
          passengerReply = 'أنا أمام صيدلية العزبي مباشرة، التوك توك بتاعك فيه كشاف أزرق؟';
        } else if (text.includes('حساب') || text.includes('كاش')) {
          passengerReply = 'معايا فكة يا كابتن، الحساب جاهز كاش.';
        }

        setChatMessages((prev) => [
          ...prev,
          {
            id: 'mock-pass-' + Date.now(),
            sender: 'passenger',
            text: passengerReply,
            time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }, 2000);
    }
  };

  // Mock upload document process
  const startMockUpload = (docId: string) => {
    if (uploadedDocs.includes(docId)) return;
    setUploadingDocId(docId);
    setUploadProgress(0);

    const interval = setInterval(() => {
      setUploadProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setUploadedDocs((docs) => [...docs, docId]);
          setUploadingDocId(null);
          return 100;
        }
        return p + 20;
      });
    }, 300);
  };

  // Verify safety PIN and finalize the trip
  const submitPinCompletion = async (pinValue: string) => {
    setPinError('');
    
    // Check PIN against server or simulated ride
    const expectedPin = activeServerRide?.securePin || '4892'; // fallback mock PIN
    if (pinValue !== expectedPin) {
      setPinError('رمز الأمان المالي غير صحيح! يرجى مراجعة الراكب للتأكيد ومنع الاحتيال.');
      return;
    }

    // Sync with server if live
    if (activeRideId) {
      try {
        const response = await fetch(getApiUrl('/api/rides/update-status'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            rideId: activeRideId,
            status: 'completed',
            pin: pinValue
          })
        });

        if (!response.ok) {
          const errData = await response.json();
          if (errData.error === 'wrong_pin') {
            setPinError('رمز الأمان المدخل غير مطابق للعميل على الخادم!');
            return;
          }
        }
      } catch (err) {
        console.warn("Could not sync complete status on server, fallback to local:", err);
      }
    }

    // Add to stats
    setTodayTotal((prev) => prev + simulatedPassenger.fare);
    setWeeklyTotal((prev) => prev + simulatedPassenger.fare);
    setMonthlyTotal((prev) => prev + simulatedPassenger.fare);

    // Save transaction
    const record: EarningRecord = {
      id: `TX-${1000 + earningsList.length + 5}`,
      passengerName: simulatedPassenger.name,
      pickup: simulatedPassenger.pickup,
      destination: simulatedPassenger.destination,
      fare: simulatedPassenger.fare,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      status: 'completed'
    };
    setEarningsList([record, ...earningsList]);

    setStep('idle');
    setTukTukProgress(0);
    setTripSubStep('go_to_pickup');
    setActiveRideId(null);
    setActiveServerRide(null);
    setShowPinPrompt(false);
    setEnteredPin('');
    setPinError('');
  };

  // Complete ride from driver perspective
  const handleFinishRide = () => {
    setShowPinPrompt(true);
  };

  if (!registeredDriverData) {
    const handleRegisterSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      setLocalError('');

      if (!localNationalId || !/^[0-9]{14}$/.test(localNationalId)) {
        setLocalError('يرجى إدخال الرقم القومي المكون من ١٤ رقماً بالكامل!');
        return;
      }

      const resolvedName = localDriverName.trim() || `كابتن توصيلة ${userPhone ? userPhone.slice(-4) : 'جديد'}`;
      
      if (onRegisterDriver) {
        onRegisterDriver({
          name: resolvedName,
          nationalId: localNationalId,
          vehicleType: localVehicleType,
          personalPhoto: 'mock_personal',
          nationalIdPhoto: 'mock_national_id',
          tukTukBackPhoto: 'mock_tuktuk_back'
        });
      }
    };

    const handleFillDemo = () => {
      setLocalDriverName('كابتن أحمد الورداني');
      setLocalNationalId('29801152401234');
      setLocalVehicleType('motorcycle');
    };

    return (
      <div className="flex flex-col flex-1 w-full bg-slate-50 p-6 overflow-y-auto text-right justify-between min-h-[500px]" dir="rtl">
        <div className="space-y-5">
          {/* Header Shield Alert */}
          <div className="text-center space-y-2 py-4">
            <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 text-3xl mx-auto shadow-sm border border-rose-100 animate-pulse">
              🔒
            </div>
            <h1 className="text-lg font-black text-slate-800">شاشة السائق مؤمنة ومغلقة</h1>
            <p className="text-[10px] text-slate-400 font-bold px-4 leading-relaxed">
              لحماية مجتمعنا وأمن الركاب والطرود، يُمنع تماماً استخدام لوحة تحكم السائق قبل إتمام التسجيل وتحديد وسيلة النقل المناسبة.
            </p>
          </div>

          <form onSubmit={handleRegisterSubmit} className="space-y-4">
            {/* Quick Demo Pre-Fill */}
            <button
              type="button"
              onClick={handleFillDemo}
              className="w-full py-2.5 px-4 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-black flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-600 shrink-0" />
              <span>⚡ تسجيل فوري سريع ببيانات تجريبية (موتوسيكل)</span>
            </button>

            {/* Name Input */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700">الاسم الكامل للكابتن</label>
              <input
                type="text"
                placeholder="مثال: كابتن أحمد الورداني"
                value={localDriverName}
                onChange={(e) => setLocalDriverName(e.target.value)}
                className="w-full text-right py-2.5 px-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold bg-white"
              />
            </div>

            {/* National ID Input */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700">
                الرقم القومي (١٤ رقماً بالبطاقة) <span className="text-rose-500">*مطلوب</span>
              </label>
              <input
                type="text"
                placeholder="مثال: 29801152401234"
                value={localNationalId}
                onChange={(e) => {
                  const val = e.target.value;
                  if (/^[0-9]*$/.test(val) && val.length <= 14) {
                    setLocalNationalId(val);
                  }
                }}
                className="w-full text-left font-mono tracking-wider py-2.5 px-4 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold bg-white"
                dir="ltr"
                required
              />
              <span className="text-[9px] text-slate-400 font-bold block">
                {localNationalId.length}/14 رقماً
              </span>
            </div>

            {/* Vehicle Selection cards */}
            <div className="space-y-2">
              <label className="block text-xs font-black text-slate-700">
                نوع المركبة ومجال الخدمة <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setLocalVehicleType('tuktuk')}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    localVehicleType === 'tuktuk'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <span className="text-lg">🛺</span>
                  <span className="text-[10px] font-black">توك توك</span>
                  <span className="text-[8px] text-slate-400 font-bold">نقل ركاب</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocalVehicleType('motorcycle')}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    localVehicleType === 'motorcycle'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <span className="text-lg">🏍️</span>
                  <span className="text-[10px] font-black">موتوسيكل</span>
                  <span className="text-[8px] text-emerald-600 font-bold">موصل طلبات</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLocalVehicleType('scooter')}
                  className={`p-2 rounded-2xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    localVehicleType === 'scooter'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20'
                      : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-white'
                  }`}
                >
                  <span className="text-lg">🛵</span>
                  <span className="text-[10px] font-black">سكوتر</span>
                  <span className="text-[8px] text-emerald-600 font-bold">موصل طلبات</span>
                </button>
              </div>
              <div className="bg-slate-100 p-2.5 rounded-xl border border-slate-200 mt-2 text-[9px] font-bold text-slate-600 leading-relaxed text-right">
                💡 <span className="text-emerald-700">تنبيه ذكي:</span> كابتن توصيل الطرود والطلبات (<span className="font-mono text-emerald-800">موتوسيكل</span> أو <span className="font-mono text-emerald-800">سكوتر</span>) تظهر له طلبات لوجستية وتوصيل طرود وأطعمة من المحلات التجارية. بينما كابتن الـ <span className="font-mono text-emerald-850">توك توك</span> تظهر له طلبات الركاب العادية.
              </div>
            </div>

            {localError && (
              <div className="flex items-center gap-2 bg-red-50 text-red-600 p-2.5 rounded-xl text-[10px]">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span className="font-semibold">{localError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 px-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-2 cursor-pointer mt-2"
            >
              <span>إرسال البيانات وتفعيل لوحة السائق 🔓</span>
            </button>
          </form>
        </div>

        <div className="pt-4 text-center text-[9px] text-slate-400 font-bold border-t border-slate-150 mt-6">
          تطبيق توصيلة للخدمات الذكية والحلول اللوجستية المتطورة بمصر
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 w-full bg-slate-50 relative" dir="rtl">
      
      {/* Driver Step Switcher */}
      <div className="flex-1 flex flex-col justify-between" id="driver-flow-container">
        {step === 'idle' && (
          // STEP 1: Driver Dashboard Home
          <div className="flex flex-col flex-1 p-4 md:p-6 gap-6 overflow-y-auto">
            
            {/* Online Status Card */}
            <div
              className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                isOnline
                  ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-500/15'
                  : 'bg-white text-slate-800 border-slate-100 shadow-sm'
              }`}
              id="online-toggle-card"
            >
              <div className="text-right">
                <h3 className="font-black text-sm">
                  {isOnline ? 'أنت متصل بالإنترنت الآن' : 'أنت غير متصل بالإنترنت'}
                </h3>
                <p className={`text-[10px] mt-0.5 font-bold ${isOnline ? 'text-emerald-100' : 'text-slate-400'}`}>
                  {isOnline 
                    ? (registeredDriverData?.vehicleType === 'motorcycle' || registeredDriverData?.vehicleType === 'scooter'
                      ? 'جاهز لتوصيل طلبات الأكل والطرود فوراً 📦'
                      : 'جاهز لاستقبال طلبات الركاب فوراً 🛺')
                    : 'افتح زر الاتصال للبدء في جني الأرباح'}
                </p>
              </div>

              <button
                onClick={handleToggleOnline}
                className="focus:outline-none transition-transform active:scale-95 cursor-pointer"
                id="online-status-switch"
              >
                {isOnline ? (
                  <ToggleRight className="w-14 h-14 text-white fill-current" />
                ) : (
                  <ToggleLeft className="w-14 h-14 text-slate-300" />
                )}
              </button>
            </div>

            {/* SPONSOR ADS BANNER FOR DRIVERS */}
            {ads.length > 0 && (
              <div className="bg-gradient-to-r from-amber-50 to-amber-100/50 p-4 rounded-2xl border border-amber-200/50 shadow-sm space-y-2 text-right relative overflow-hidden">
                <div className="absolute -top-3 -left-3 w-12 h-12 bg-amber-500/10 rounded-full blur-xl" />
                <div className="flex items-center justify-between">
                  <span className="text-[8px] bg-amber-600 text-white font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Sparkles className="w-2.5 h-2.5 animate-spin" />
                    <span>عرض خاص لكباتن توصيلة</span>
                  </span>
                  <span className="text-[9px] text-amber-800 font-black">🌟 عروض الرعاة</span>
                </div>
                
                <div className="space-y-1">
                  <h4 className="text-xs font-black text-slate-800">{ads[0].title}</h4>
                  <p className="text-[10px] text-slate-600 leading-relaxed font-bold">{ads[0].text}</p>
                  <div className="flex justify-between items-center pt-1.5 border-t border-amber-200/40 text-[9px]">
                    <span className="text-amber-800 font-bold">🏬 الجهة الراعية: {ads[0].sponsorName}</span>
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

            {/* Subscription / Trial Banner */}
            <div className={`p-4 rounded-2xl border ${
              isPaidUser 
                ? 'bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200 shadow-sm' 
                : trialDaysLeft <= 0 
                  ? 'bg-rose-50 border-rose-200 text-rose-900 shadow-sm' 
                  : 'bg-amber-50/70 border-amber-200 text-amber-900 shadow-sm'
            } space-y-3 text-right`} id="subscription-status-card">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {isPaidUser ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-purple-500 animate-pulse shrink-0" />
                        <h4 className="text-xs font-black text-purple-950 flex items-center gap-1">
                          <Unlock className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                          <span>الاشتراك المدفوع مفعّل ✅</span>
                        </h4>
                      </>
                    ) : trialDaysLeft <= 0 ? (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse shrink-0" />
                        <h4 className="text-xs font-black text-rose-950 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                          <span>انتهت الفترة التجريبية المجانية (١٥ يوم) ⚠️</span>
                        </h4>
                      </>
                    ) : (
                      <>
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                        <h4 className="text-xs font-black text-amber-950 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>الفترة التجريبية المجانية نشطة (أول ١٥ يوماً مجاناً)</span>
                        </h4>
                      </>
                    )}
                  </div>
                  <p className="text-[10px] text-slate-500 font-bold leading-relaxed">
                    {isPaidUser 
                      ? 'باقة التشغيل غير المحدودة نشطة الآن! استمتع بجميع طلبات التوصيل دون انقطاع.' 
                      : trialDaysLeft <= 0 
                        ? 'يرجى سداد الاشتراك لمتابعة استقبال طلبات التوصيل كابتن والربح اليومي.' 
                        : `توصيلة مجاني بالكامل للسائقين لأول ١٥ يوماً كدعم لبدايتك معنا. متبقي لك ${trialDaysLeft} يوم تجريبي.`}
                  </p>
                </div>

                {isPaidUser ? (
                  <span className="text-[10px] bg-purple-100 text-purple-800 px-2.5 py-1 rounded-lg font-black shrink-0 font-sans">
                    حساب بريميوم
                  </span>
                ) : trialDaysLeft <= 0 ? (
                  <span className="text-[10px] bg-rose-100 text-rose-800 px-2.5 py-1 rounded-lg font-black shrink-0 font-sans">
                    متوقف مؤقتاً
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-100 text-amber-800 px-2.5 py-1 rounded-lg font-black shrink-0 font-sans">
                    متبقي {trialDaysLeft} يوم
                  </span>
                )}
              </div>

              {/* Progress bar or Quick payment action button */}
              <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-slate-100/60">
                {!isPaidUser && trialDaysLeft > 0 && (
                  <>
                    <div className="flex-1">
                      <div className="h-1.5 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-amber-500 transition-all duration-500" 
                          style={{ width: `${(trialDaysLeft / 15) * 100}%` }}
                        />
                      </div>
                      <span className="text-[8px] text-slate-400 font-bold block mt-1">اكتمال الفترة التجريبية: {15 - trialDaysLeft} من ١٥ يوماً</span>
                    </div>
                    <button
                      onClick={() => {
                        setPaymentSuccess(false);
                        setShowPaymentModal(true);
                      }}
                      className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-[10px] font-black rounded-lg shrink-0 transition-all active:scale-95 cursor-pointer"
                    >
                      اشترك مبكراً ووفر 🌟
                    </button>
                  </>
                )}

                {trialDaysLeft <= 0 && !isPaidUser && (
                  <button
                    onClick={() => {
                      setPaymentSuccess(false);
                      setShowPaymentModal(true);
                    }}
                    className="w-full py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-black rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>اشترك الآن لتفعيل حساب التوكتك فوراً</span>
                  </button>
                )}

                {isPaidUser && (
                  <div className="w-full flex items-center justify-between text-[10px] text-purple-900 font-bold">
                    <span>تاريخ انتهاء الباقة: {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString('ar-EG')}</span>
                    <span className="bg-purple-100 text-purple-800 px-2.5 py-0.5 rounded-full text-[9px]">نشط ومؤمّن 🔒</span>
                  </div>
                )}
              </div>
            </div>

            {/* INTERACTIVE SIMULATOR PANEL FOR THE VISITOR */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl border border-slate-800 space-y-3 text-right" id="trial-simulator-panel">
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <h4 className="text-xs font-black text-slate-100 font-sans">لوحة تحكم تجربة الاشتراك للسائق (المحاكي)</h4>
                </div>
                <span className="text-[9px] bg-slate-800 text-amber-300 px-2 py-0.5 rounded-full font-bold">للمراجعة والتجريب</span>
              </div>

              <p className="text-[9px] text-slate-400 leading-relaxed font-semibold">
                استخدم هذه الأزرار السريعة لتغيير حالة السائق وملاحظة كيف تمنع المنظومة السائق من استقبال رحلات بمجرد انتهاء فترة التجربة وتطالبه بالاشتراك:
              </p>

              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => {
                    setTrialDaysLeft(15);
                    setIsPaidUser(false);
                  }}
                  className="p-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-center space-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm block">📅</span>
                  <span className="text-[9px] font-bold block text-slate-300">إعادة تجريبي ١٥ يوم</span>
                </button>

                <button
                  onClick={() => {
                    setTrialDaysLeft(0);
                    setIsPaidUser(false);
                    setIsOnline(false);
                  }}
                  className="p-2 bg-rose-950/40 hover:bg-rose-950/60 border border-rose-900/50 rounded-xl text-center space-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm block">⚠️</span>
                  <span className="text-[9px] font-bold block text-rose-300">إنهاء التجربة (صفر يوم)</span>
                </button>

                <button
                  onClick={() => {
                    setIsPaidUser(true);
                  }}
                  className="p-2 bg-purple-950/40 hover:bg-purple-950/60 border border-purple-900/50 rounded-xl text-center space-y-1 transition-all active:scale-95 cursor-pointer"
                >
                  <span className="text-sm block">👑</span>
                  <span className="text-[9px] font-bold block text-purple-300">تفعيل كمدفوع مباشرة</span>
                </button>
              </div>
            </div>

            {/* Quick manual simulation button for testing */}
            {isOnline && (
              <div className="bg-emerald-50 border border-emerald-100 p-3 rounded-xl flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">تنبيه: سيصلك طلب تلقائي بعد 5 ثوانٍ، أو اضغط:</span>
                <button
                  onClick={() => {
                    setStep('incoming');
                    setIncomingTimeLeft(20);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black px-3 py-1.5 rounded-lg shadow-sm"
                >
                  محاكاة طلب الآن
                </button>
              </div>
            )}

            {/* Earnings Section */}
            <div className="space-y-3" id="earnings-section">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                  <span>لوحة الأرباح والدخل</span>
                </h3>
                
                {/* Stats Tabs */}
                <div className="flex bg-slate-200/60 p-1 rounded-xl text-xs font-bold">
                  {(['today', 'week', 'month'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setEarningsTab(tab)}
                      className={`px-3 py-1 rounded-lg transition-all ${
                        earningsTab === tab ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-500'
                      }`}
                    >
                      {tab === 'today' ? 'اليوم' : tab === 'week' ? 'الأسبوع' : 'الشهر'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Stat card output */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400">إجمالي الدخل</span>
                  <p className="text-base font-black text-emerald-600 font-mono mt-1">
                    {earningsTab === 'today' ? todayTotal : earningsTab === 'week' ? weeklyTotal : monthlyTotal} ج.م
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400">عدد الرحلات</span>
                  <p className="text-base font-black text-slate-700 font-mono mt-1">
                    {earningsTab === 'today' ? '4' : earningsTab === 'week' ? '28' : '114'}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-xl border border-slate-100 text-center shadow-sm">
                  <span className="text-[10px] font-bold text-slate-400">التقييم العام</span>
                  <p className="text-base font-black text-amber-500 font-mono mt-1 flex items-center justify-center gap-0.5">
                    <Star className="w-3.5 h-3.5 fill-current shrink-0" />
                    <span>4.9</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Documents Verification Status (مستندات التوك توك) */}
            {registeredDriverData ? (
              <div className="bg-gradient-to-br from-emerald-50 to-white p-4 rounded-2xl border border-emerald-100 shadow-sm space-y-3 text-right">
                <div className="flex items-center justify-between border-b border-emerald-100/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    <h4 className="text-xs font-black text-slate-800 font-sans">مستندات كابتن مفعل وموثق</h4>
                  </div>
                  <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">نشط ومؤهل للعمل</span>
                </div>

                <div className="space-y-2.5">
                  <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-bold">اسم الكابتن المسجل:</span>
                    <span className="font-black text-slate-800">{registeredDriverData.name}</span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-b border-dashed border-slate-100 pb-1.5">
                    <span className="text-slate-400 font-bold">الرقم القومي المدقق:</span>
                    <span className="font-mono font-bold text-slate-800">{registeredDriverData.nationalId}</span>
                  </div>

                  {/* Registered Photos Previews */}
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[10px] text-slate-400 font-black block">المستندات والصور المرفقة:</span>
                    <div className="grid grid-cols-3 gap-2" id="onboarding-photos-grid">
                      <div className="border border-slate-100 bg-white p-1 rounded-lg text-center space-y-1">
                        <span className="text-[8px] text-slate-500 font-bold block">الصورة الشخصية</span>
                        <div className="w-full h-12 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center">
                          {registeredDriverData.personalPhoto && registeredDriverData.personalPhoto.startsWith('data:') ? (
                            <img src={registeredDriverData.personalPhoto} alt="Personal" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">👤</span>
                          )}
                        </div>
                      </div>

                      <div className="border border-slate-100 bg-white p-1 rounded-lg text-center space-y-1">
                        <span className="text-[8px] text-slate-500 font-bold block">الرقم القومي</span>
                        <div className="w-full h-12 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center">
                          {registeredDriverData.nationalIdPhoto && registeredDriverData.nationalIdPhoto.startsWith('data:') ? (
                            <img src={registeredDriverData.nationalIdPhoto} alt="ID" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">💳</span>
                          )}
                        </div>
                      </div>

                      <div className="border border-slate-100 bg-white p-1 rounded-lg text-center space-y-1">
                        <span className="text-[8px] text-slate-500 font-bold block">خلفية التوكتك</span>
                        <div className="w-full h-12 bg-slate-50 rounded-md overflow-hidden flex items-center justify-center">
                          {registeredDriverData.tukTukBackPhoto && registeredDriverData.tukTukBackPhoto.startsWith('data:') ? (
                            <img src={registeredDriverData.tukTukBackPhoto} alt="TukTuk" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-lg">🛺</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                <div className="flex items-center gap-1.5 border-b border-slate-100 pb-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <h4 className="text-xs font-black text-slate-700">مستندات التوك توك والتحقق</h4>
                </div>

                <div className="space-y-2" id="docs-list">
                  {DRIVER_DOCUMENTS.map((doc) => {
                    const isUploaded = uploadedDocs.includes(doc.id);
                    const isUploading = uploadingDocId === doc.id;

                    return (
                      <div
                        key={doc.id}
                        className="flex items-center justify-between p-2.5 rounded-xl border border-slate-50 bg-slate-50/40 hover:bg-slate-50 transition-colors"
                      >
                        <div className="text-right">
                          <p className="text-xs font-bold text-slate-800">{doc.title}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{doc.desc}</p>
                        </div>

                        <div className="shrink-0">
                          {isUploaded ? (
                            <div className="flex items-center gap-1 text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full text-[10px] font-bold">
                              <CheckCircle className="w-3.5 h-3.5" />
                              <span>مقبول</span>
                            </div>
                          ) : isUploading ? (
                            <div className="flex items-center gap-1.5 text-xs">
                              <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${uploadProgress}%` }} />
                              </div>
                              <span className="text-[10px] font-mono text-slate-500">{uploadProgress}%</span>
                            </div>
                          ) : (
                            <button
                              onClick={() => startMockUpload(doc.id)}
                              className="flex items-center gap-1 text-slate-500 bg-slate-200/50 hover:bg-slate-200 px-2.5 py-1 rounded-full text-[10px] font-bold transition-colors active:scale-95"
                            >
                              <UploadCloud className="w-3.5 h-3.5" />
                              <span>تحميل</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Historical transaction logs */}
            <div className="space-y-2">
              <h4 className="text-xs font-black text-slate-500 text-right">أحدث الرحلات المكتملة :</h4>
              <div className="space-y-2" id="historical-rides">
                {earningsList.map((rec) => (
                  <div key={rec.id} className="bg-white p-3 rounded-xl border border-slate-100 flex justify-between items-center text-xs">
                    <div className="text-right space-y-1">
                      <span className="font-bold text-slate-700 block">{rec.passengerName}</span>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        من: <span className="text-slate-600">{rec.pickup}</span> إلى: <span className="text-slate-600">{rec.destination}</span>
                      </p>
                    </div>

                    <div className="text-left shrink-0">
                      <span className="font-mono font-bold text-slate-700 block">{rec.fare} ج.م</span>
                      <span className="text-[9px] text-slate-400 font-medium block">{rec.time}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* STEP 2: INCOMING REQUEST SHEET */}
        <AnimatePresence>
          {step === 'incoming' && (
            <motion.div
              initial={{ opacity: 0, y: 150 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 150 }}
              className="absolute inset-x-0 bottom-0 top-12 bg-slate-900 text-white rounded-t-3xl shadow-2xl z-40 p-6 md:p-8 flex flex-col justify-between"
              id="incoming-request-modal"
            >
              <div className="space-y-6 text-center">
                <div className="space-y-1">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-widest animate-pulse block">
                    طلب توصيل قادم لمركبتك!
                  </span>
                  <h3 className="text-xl font-black">جاهز للبدء فوراً؟</h3>
                </div>

                {/* Countdown Timer with Radial Effect */}
                <div className="relative w-24 h-24 mx-auto flex items-center justify-center">
                  <svg className="w-24 h-24 transform -rotate-90">
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#1e293b"
                      strokeWidth="6"
                    />
                    <circle
                      cx="48"
                      cy="48"
                      r="40"
                      fill="none"
                      stroke="#10b981"
                      strokeWidth="6"
                      strokeDasharray={251.2}
                      strokeDashoffset={251.2 - (251.2 * incomingTimeLeft) / 20}
                      className="transition-all duration-1000 ease-linear"
                    />
                  </svg>
                  <span className="absolute text-2xl font-black font-mono text-white">{incomingTimeLeft}</span>
                </div>

                {/* Ride details card */}
                <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl text-right space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-700/60 pb-2.5">
                    <div>
                      <h4 className="text-sm font-black text-slate-200">{simulatedPassenger.name}</h4>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">مسافة التوصيلة: {simulatedPassenger.distance}</p>
                    </div>
                    <span className="text-lg font-black text-emerald-400 font-mono">
                      {simulatedPassenger.fare} ج.م
                    </span>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-start gap-2 text-xs font-semibold">
                      <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0 mt-1" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">الركوب</span>
                        <p className="text-slate-200">{simulatedPassenger.pickup}</p>
                      </div>
                    </div>

                    <div className="flex items-start gap-2 text-xs font-semibold">
                      <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0 mt-1" />
                      <div>
                        <span className="text-[10px] text-slate-400 block font-bold">الوجهة</span>
                        <p className="text-slate-200">{simulatedPassenger.destination}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action buttons row */}
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setStep('idle')}
                  className="py-4 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-2xl font-bold transition-all text-sm active:scale-95"
                >
                  رفض وتجاهل
                </button>

                <button
                  onClick={handleAcceptRide}
                  className="py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold shadow-lg shadow-emerald-500/10 transition-all text-sm active:scale-95 flex items-center justify-center gap-1"
                >
                  <Check className="w-4 h-4" />
                  <span>قبول وبدء التوصيلة</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* STEP 3: ACTIVE NAVIGATION ON TRIP */}
        {step === 'on_trip' && (
          <div className="flex flex-col flex-1 justify-between p-4 md:p-6 gap-4">
            
            {/* Nav Header */}
            <div className="bg-slate-900 text-white p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs shadow">
              <div className="flex items-center gap-1.5 font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span>
                  {tripSubStep === 'go_to_pickup' && 'توجه لموقع الراكب'}
                  {tripSubStep === 'arrived' && 'الراكب في التوك توك'}
                  {tripSubStep === 'driving' && 'المشوار نشط الآن'}
                </span>
              </div>
              <span className="font-mono text-emerald-400 font-bold">
                {tripSubStep === 'driving' ? `متبقي ${Math.max(1, Math.round(8 * (1 - tukTukProgress/100)))} دقيقة` : 'مسافة قصيرة'}
              </span>
            </div>

            {/* GPS progress in transit */}
            {tripSubStep === 'driving' && (
              <div className="bg-white p-4 rounded-xl border border-slate-100 space-y-1.5 shadow-sm">
                <div className="flex justify-between text-xs font-bold text-slate-400">
                  <span>{simulatedPassenger.pickup}</span>
                  <span>{simulatedPassenger.destination}</span>
                </div>
                <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${tukTukProgress}%` }} />
                </div>
                <div className="flex justify-between text-[9px] text-slate-400 font-bold">
                  <span>تم قطع {tukTukProgress}% من الطريق</span>
                  <span>توصيل حي بالـ GPS</span>
                </div>
              </div>
            )}

            {/* Passenger Profile details inside ride */}
            <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-md space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-2xl border shrink-0">
                  🙋‍♂️
                </div>
                <div className="flex-1 text-right">
                  <span className="text-[9px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">الراكب</span>
                  <h4 className="text-sm font-black text-slate-800 mt-1">{simulatedPassenger.name}</h4>
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    الوجهة: {simulatedPassenger.destination}
                  </p>
                </div>
                <div className="text-left shrink-0">
                  <span className="text-[10px] font-black text-slate-500 block">
                    {activeServerRide?.paymentMethod === 'app_wallet' ? '📱 دفع بالمحفظة' : '💵 الأجرة كاش'}
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono block mt-0.5">{simulatedPassenger.fare} ج.م</span>
                </div>
              </div>

              {/* In-Trip control buttons */}
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setChatOpen(true)}
                  className="py-3 px-4 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95 relative"
                >
                  <MessageSquare className="w-4 h-4 shrink-0" />
                  <span>محادثة الراكب</span>
                  <span className="absolute top-1 left-4 w-2.5 h-2.5 bg-blue-500 rounded-full animate-pulse" />
                </button>

                <button
                  onClick={() => setCallActive(true)}
                  className="py-3 px-4 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-1.5 active:scale-95"
                >
                  <Phone className="w-4 h-4 shrink-0" />
                  <span>اتصال تلفوني</span>
                </button>
              </div>

              {/* Sub-step action trigger */}
              <div className="border-t border-slate-100 pt-3">
                {tripSubStep === 'go_to_pickup' && (
                  <button
                    onClick={() => {
                      setTripSubStep('arrived');
                      updateServerStatus('arrived');
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    <Check className="w-4 h-4" />
                    <span>وصلت لموقع الركوب (الزبون جاهز)</span>
                  </button>
                )}

                {tripSubStep === 'arrived' && (
                  <button
                    onClick={() => {
                      setTripSubStep('driving');
                      setTukTukProgress(0);
                      updateServerStatus('started');
                    }}
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/10 active:scale-95"
                  >
                    <Play className="w-4 h-4" />
                    <span>بدء المشوار والتحرك للوجهة</span>
                  </button>
                )}

                {tripSubStep === 'driving' && (
                  <button
                    onClick={handleFinishRide}
                    className="w-full py-3.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold transition-all text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 active:scale-95"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>إنهاء الرحلة وإدخال كود الأمان للراكب ({simulatedPassenger.fare} ج.م)</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ACTIVE CHAT BOX PANEL FOR DRIVER */}
      <AnimatePresence>
        {chatOpen && (
          <motion.div
            initial={{ opacity: 0, y: 150 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 150 }}
            className="absolute inset-x-0 bottom-0 top-12 bg-white rounded-t-3xl shadow-2xl z-40 flex flex-col justify-between border-t border-slate-100"
            id="driver-chat-panel"
          >
            {/* Chat header */}
            <div className="flex justify-between items-center px-4 py-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🙋‍♂️</span>
                <div className="text-right">
                  <h4 className="text-xs font-black text-slate-800">{simulatedPassenger.name}</h4>
                  <span className="text-[9px] text-emerald-500 font-bold">الزبون ينتظر بالخريطة</span>
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
                    msg.sender === 'driver'
                      ? 'bg-emerald-600 text-white self-end rounded-br-none'
                      : 'bg-white text-slate-700 border border-slate-100 self-start rounded-bl-none shadow-sm'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[8px] mt-1 text-left ${
                      msg.sender === 'driver' ? 'text-emerald-200' : 'text-slate-400'
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
                placeholder="اكتب رسالة سريعة للزبون..."
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

      {/* PIN Verification Sheet to prevent fraud and theft */}
      <AnimatePresence>
        {showPinPrompt && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="driver-pin-modal"
          >
            <motion.div
              initial={{ scale: 0.95, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 30 }}
              className="bg-white w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-100 text-right space-y-4"
            >
              <div className="flex justify-between items-center border-b pb-3 border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinPrompt(false);
                    setPinError('');
                    setEnteredPin('');
                  }}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-50 transition-all"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="flex items-center gap-2">
                  <span className="text-lg">🛡️</span>
                  <h3 className="text-md font-black text-slate-800">تأكيد أمان إنهاء الرحلة</h3>
                </div>
              </div>

              <div className="space-y-2">
                <div className="bg-emerald-50 text-emerald-800 p-3 rounded-2xl border border-emerald-100/50 text-xs leading-relaxed font-bold">
                  🔔 **نظام حماية الأجرة ضد التلاعب والسرقة:**
                  <br />
                  لتأكيد تحصيل المبلغ من العميل بأمان، يرجى طلب **كود أمان الراكب (PIN)** المكون من 4 أرقام الظاهر على شاشة هاتفه وإدخاله أدناه.
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-2.5">
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>قيمة المشوار المعتمدة:</span>
                    <span className="text-emerald-700 font-black">{simulatedPassenger.fare} جنيه مصري</span>
                  </div>
                  <div className="flex justify-between text-xs font-bold text-slate-600">
                    <span>طريقة الدفع المعتمدة:</span>
                    <span className="text-blue-700 font-black">
                      {activeServerRide?.paymentMethod === 'app_wallet' ? '📱 رصيد محفظة العميل' : '💵 كاش نقداً'}
                    </span>
                  </div>
                </div>
              </div>

              {/* PIN input box */}
              <div className="space-y-2">
                <label className="text-xs font-black text-slate-600 block">كود الأمان المكون من 4 أرقام:</label>
                <input
                  type="text"
                  maxLength={4}
                  value={enteredPin}
                  onChange={(e) => {
                    setEnteredPin(e.target.value.replace(/\D/g, ''));
                    setPinError('');
                  }}
                  placeholder="مثال: ٤٨٩٢"
                  className="w-full py-4 text-center text-2xl font-black font-mono tracking-[1rem] border border-slate-200 rounded-2xl bg-slate-50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:bg-white transition-all"
                  dir="ltr"
                />
                
                {pinError && (
                  <p className="text-[10px] text-rose-600 font-black text-center animate-shake">
                    ⚠️ {pinError}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPinPrompt(false);
                    setPinError('');
                    setEnteredPin('');
                  }}
                  className="py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all"
                >
                  تراجع وإلغاء
                </button>

                <button
                  type="button"
                  onClick={() => submitPinCompletion(enteredPin)}
                  className="py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black text-xs transition-all shadow-md shadow-emerald-500/10"
                >
                  تأكيد وإنهاء الرحلة 🔒
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CALL DIALER SIMULATOR MODAL */}
      <AnimatePresence>
        {callActive && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/95 backdrop-blur-md z-40 flex flex-col justify-between p-8 text-center text-white rounded-3xl"
            id="driver-call-dialer-modal"
          >
            <div className="space-y-2 mt-12" dir="rtl">
              <span className="text-emerald-400 font-semibold text-xs animate-pulse block">اتصال جاري بالزبون عبر تطبيق توصيلة...</span>
              <h3 className="text-2xl font-black">{simulatedPassenger.name}</h3>
              <p className="text-xs text-slate-400">موقع ركوب الزبون: {simulatedPassenger.pickup}</p>
            </div>

            <div className="relative my-auto flex items-center justify-center">
              <div className="w-32 h-32 rounded-full bg-emerald-500/10 flex items-center justify-center animate-ping absolute" />
              <div className="w-24 h-24 rounded-full bg-emerald-600 flex items-center justify-center text-5xl relative shadow-lg shadow-emerald-500/20">
                🙋‍♂️
              </div>
            </div>

            <div className="space-y-4 mb-8" dir="rtl">
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

      {/* SUBSCRIPTION ALERT POPUP (FOR EXPIRED TRIAL) */}
      <AnimatePresence>
        {showSubscriptionAlert && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            id="subscription-expired-alert-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-6 max-w-sm w-full text-right shadow-2xl border border-slate-100 space-y-4"
            >
              <div className="w-12 h-12 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-600 mx-auto">
                <ShieldAlert className="w-6 h-6" />
              </div>

              <div className="text-center space-y-1">
                <h3 className="text-base font-black text-slate-800">انتهت الفترة التجريبية المجانية! ⚠️</h3>
                <p className="text-xs text-slate-500 font-bold">عذراً يا كابتن، لقد انتهت فترة الـ ١٥ يوماً التجريبية المجانية لحسابك.</p>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed font-semibold">
                لمتابعة العمل على تطبيق توصيلة واستلام طلبات الركاب الحقيقية وجني الأرباح اليومية، يرجى تفعيل الاشتراك المدفوع الآن. نوفر باقات مرنة جداً تبدأ من ١٥ ج.م فقط!
              </p>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    setShowSubscriptionAlert(false);
                    setPaymentSuccess(false);
                    setShowPaymentModal(true);
                  }}
                  className="w-full py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-rose-500/10 transition-all active:scale-95 cursor-pointer"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>اشترك الآن لتفعيل التوكتك فوراً</span>
                </button>
                <button
                  onClick={() => setShowSubscriptionAlert(false)}
                  className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl font-bold text-xs transition-all active:scale-95 cursor-pointer"
                >
                  إغلاق وتصفح لوحة التحكم
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SUBSCRIPTION PAYMENT CHECKOUT MODAL */}
      <AnimatePresence>
        {showPaymentModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto"
            id="subscription-payment-checkout-modal"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-white rounded-3xl p-5 max-w-sm w-full text-right shadow-2xl border border-slate-100 space-y-4 max-h-[92%] overflow-y-auto"
            >
              <div className="flex justify-between items-center border-b border-slate-100 pb-2">
                <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  <span>سداد اشتراك الكابتن</span>
                </h3>
                <button
                  onClick={() => {
                    if (!isProcessingPayment) {
                      setShowPaymentModal(false);
                    }
                  }}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-400"
                  disabled={isProcessingPayment}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {paymentSuccess ? (
                // SUCCESS STATE
                <div className="text-center py-6 space-y-4 animate-fade-in">
                  <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto shadow-md">
                    🎉
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-sm font-black text-slate-800">تم السداد والتفعيل بنجاح!</h4>
                    <p className="text-xs text-emerald-600 font-bold">مبروك يا كابتن، حسابك نشط ومدفوع الآن لمدة ٣٠ يوماً</p>
                  </div>
                  <p className="text-[10px] text-slate-400 font-semibold px-4">
                    تم استلام اشتراكك بنجاح. يمكنك الآن فتح زر الاتصال بالإنترنت فوراً وبدء استقبال طلبات الركاب وتحقيق الدخل اليومي.
                  </p>
                  <button
                    onClick={() => {
                      setIsPaidUser(true);
                      setTrialDaysLeft(15); // reset days counter to test
                      setShowPaymentModal(false);
                      setIsOnline(true);
                      setStep('idle');
                    }}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-[0.98] cursor-pointer"
                  >
                    بدء استقبال الركاب والربح الآن! 🚀
                  </button>
                </div>
              ) : (
                // CHECKOUT FORM STATE
                <div className="space-y-4">
                  {/* Select Plan */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700">اختر باقة الاشتراك المناسبة لك:</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setSelectedPlan('weekly')}
                        className={`p-2.5 rounded-xl border-2 text-right transition-all ${
                          selectedPlan === 'weekly'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950'
                            : 'border-slate-100 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black block">باقة أسبوعية</span>
                        <span className="text-[10px] font-mono font-bold block mt-0.5 text-emerald-600">١٥ ج.م / أسبوع</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedPlan('monthly')}
                        className={`p-2.5 rounded-xl border-2 text-right transition-all ${
                          selectedPlan === 'monthly'
                            ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950'
                            : 'border-slate-100 hover:border-slate-200 text-slate-700'
                        }`}
                      >
                        <span className="text-xs font-black block">باقة شهرية (الأفضل)</span>
                        <span className="text-[10px] font-mono font-bold block mt-0.5 text-emerald-600">٥٠ ج.م / شهر</span>
                      </button>
                    </div>
                  </div>

                  {/* Select Payment Method */}
                  <div className="space-y-2">
                    <label className="block text-xs font-black text-slate-700">طريقة الدفع في مصر:</label>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod('vodafone')}
                        className={`py-2 px-1 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'vodafone'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-100 text-slate-500 hover:border-slate-250'
                        }`}
                      >
                        <span className="text-lg">📱</span>
                        <span className="text-[8px] font-black leading-none">كاش محفظة</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('fawry')}
                        className={`py-2 px-1 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'fawry'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-100 text-slate-500 hover:border-slate-250'
                        }`}
                      >
                        <span className="text-lg">🏪</span>
                        <span className="text-[8px] font-black leading-none">فوري كود</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`py-2 px-1 rounded-lg border-2 text-center transition-all flex flex-col items-center justify-center gap-1 ${
                          paymentMethod === 'card'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                            : 'border-slate-100 text-slate-500 hover:border-slate-250'
                        }`}
                      >
                        <span className="text-lg">💳</span>
                        <span className="text-[8px] font-black leading-none">بطاقة بنكية</span>
                      </button>
                    </div>
                  </div>

                  {/* Dynamic inputs based on payment method */}
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 space-y-3 text-right">
                    {paymentMethod === 'vodafone' && (
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-600">رقم محفظة كاش (فودافون/اتصالات/أورنج):</label>
                        <input
                          type="tel"
                          placeholder="مثال: 01012345678"
                          value={mobileNumber}
                          onChange={(e) => setMobileNumber(e.target.value)}
                          className="w-full text-left font-mono py-2 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-bold"
                          required
                        />
                        <span className="text-[8px] text-slate-400 font-bold block">سيتم إرسال طلب سداد فوري لهاتفك للتأكيد</span>
                      </div>
                    )}

                    {paymentMethod === 'fawry' && (
                      <div className="space-y-1.5 text-right">
                        <span className="text-[10px] text-slate-500 font-bold block">سيتم إصدار كود دفع فوري مكون من ٩ أرقام فور تأكيد الطلب.</span>
                        <div className="bg-amber-50 text-amber-900 border border-amber-150 p-2 rounded-lg text-[9px] font-black leading-relaxed">
                          كود فوري المرجعي المؤقت: <span className="font-mono text-xs bg-white px-1.5 py-0.5 rounded border border-amber-250 tracking-wider">٩٨٤٤٠١٢٨٤</span>
                        </div>
                      </div>
                    )}

                    {paymentMethod === 'card' && (
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <label className="block text-[10px] font-black text-slate-600">رقم البطاقة البنكية (الفيزا):</label>
                          <input
                            type="text"
                            placeholder="**** **** **** ****"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full text-left font-mono py-2 px-3 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-bold"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-600">الانتهاء (MM/YY):</label>
                            <input
                              type="text"
                              placeholder="12/28"
                              value={cardExpiry}
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full text-center font-mono py-2 px-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-bold"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="block text-[10px] font-black text-slate-600">الرمز السري (CVV):</label>
                            <input
                              type="password"
                              placeholder="***"
                              value={cardCvv}
                              onChange={(e) => setCardCvv(e.target.value)}
                              className="w-full text-center font-mono py-2 px-2 border border-slate-200 rounded-lg text-xs focus:ring-1 focus:ring-emerald-500 outline-none bg-white font-bold"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Summary */}
                  <div className="flex justify-between items-center text-xs font-black border-t border-dashed border-slate-200 pt-3">
                    <span className="text-slate-500">القيمة الإجمالية المطلوبة:</span>
                    <span className="text-base text-emerald-600 font-mono">
                      {selectedPlan === 'weekly' ? '١٥ ج.م' : '٥٠ ج.م'}
                    </span>
                  </div>

                  {/* Action */}
                  <button
                    onClick={() => {
                      setIsProcessingPayment(true);
                      setTimeout(() => {
                        setIsProcessingPayment(false);
                        setPaymentSuccess(true);
                      }, 1800);
                    }}
                    disabled={isProcessingPayment}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer disabled:bg-slate-300 animate-pulse"
                  >
                    {isProcessingPayment ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin shrink-0" />
                        <span>جاري معالجة الدفع الآمن...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle className="w-4 h-4 shrink-0" />
                        <span>تأكيد وسداد الاشتراك المدفوع</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
