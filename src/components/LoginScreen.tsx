/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { UserRole } from '../types';
import { 
  Phone, 
  CheckCircle, 
  ShieldCheck, 
  AlertCircle, 
  Camera, 
  Sparkles, 
  UserCheck, 
  Image as ImageIcon, 
  Lock, 
  User as UserIcon,
  LogIn,
  UserPlus,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { motion } from 'motion/react';
import { getApiUrl } from '../utils/api';

interface LoginScreenProps {
  onLoginSuccess: (role: UserRole, phone: string, driverData?: {
    name: string;
    nationalId: string;
    personalPhoto: string | null;
    nationalIdPhoto: string | null;
    tukTukBackPhoto: string | null;
    vehicleType?: 'tuktuk' | 'motorcycle' | 'scooter';
  }) => void;
}

export default function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  // Common states
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [fullName, setFullName] = useState('');
  const [userRole, setUserRole] = useState<UserRole>('passenger');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Driver-specific registration states
  const [driverNationalId, setDriverNationalId] = useState('');
  const [vehicleType, setVehicleType] = useState<'tuktuk' | 'motorcycle' | 'scooter'>('tuktuk');
  const [personalPhoto, setPersonalPhoto] = useState<string | null>(null);
  const [nationalIdPhoto, setNationalIdPhoto] = useState<string | null>(null);
  const [tukTukBackPhoto, setTukTukBackPhoto] = useState<string | null>(null);

  // Password validation & strength calculation
  const getPasswordStrength = (pass: string) => {
    if (!pass) return { score: 0, text: 'لم يتم الإدخال بعد ⚪', color: 'text-slate-400 bg-slate-100 border-slate-100', width: 'w-0', progressColor: 'bg-slate-200' };
    if (pass.length < 4) return { score: 1, text: 'ضعيف جداً 🔴 (قصير للغاية)', color: 'text-rose-700 bg-rose-50 border-rose-200', width: 'w-1/4', progressColor: 'bg-rose-500' };
    
    // Check if it has both letters and numbers (English or Arabic characters)
    const hasLetters = /[a-zA-Z\u0600-\u06FF]/.test(pass);
    const hasNumbers = /[0-9]/.test(pass);
    
    if (pass.length >= 6 && hasLetters && hasNumbers) {
      return { score: 3, text: 'قوي جداً ومؤمن 🟢', color: 'text-emerald-700 bg-emerald-50 border-emerald-200', width: 'w-full', progressColor: 'bg-emerald-500' };
    }
    if (pass.length >= 5) {
      return { score: 2, text: 'متوسط الأمان 🟡 (أضف أرقاماً وحروفاً لتقويته)', color: 'text-amber-700 bg-amber-50 border-amber-200', width: 'w-2/3', progressColor: 'bg-amber-500' };
    }
    return { score: 1, text: 'ضعيف الأمان 🟠 (استخدم 5 خانات أو أكثر)', color: 'text-orange-700 bg-orange-50 border-orange-200', width: 'w-1/3', progressColor: 'bg-orange-500' };
  };

  const strength = getPasswordStrength(password);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string | null) => void) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleQuickFill = () => {
    setFullName('كابتن أبو أنس الجدع');
    setPhoneNumber('01099887766');
    setPassword('1234');
    setConfirmPassword('1234');
    setDriverNationalId('29505122401234');
    setVehicleType('tuktuk');
    setPersonalPhoto('mock_personal');
    setNationalIdPhoto('mock_national_id');
    setTukTukBackPhoto('mock_tuktuk_back');
    setErrorMsg('');
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    // Normalize Egyptian phone numbers (convert Arabic digits, strip non-digits, remove country code, fix leading zero)
    const normalizePhoneNumber = (num: string): string => {
      const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
      let clean = num.split('').map(char => {
        const idx = arabicDigits.indexOf(char);
        return idx !== -1 ? idx.toString() : char;
      }).join('');

      clean = clean.replace(/\D/g, '');

      if (clean.startsWith('20') && clean.length > 10) {
        clean = clean.substring(2);
      }

      if (clean.length === 10 && (clean.startsWith('10') || clean.startsWith('11') || clean.startsWith('12') || clean.startsWith('15') || clean.startsWith('1'))) {
        clean = '0' + clean;
      }

      return clean;
    };

    const cleanPhone = normalizePhoneNumber(phoneNumber);

    // Egyptian phone style validation: 010, 011, 012, 015 + 8 digits
    const phoneRegex = /^(010|011|012|015)[0-9]{8}$/;
    if (!phoneRegex.test(cleanPhone)) {
      setErrorMsg('يرجى إدخال رقم هاتف مصري صحيح مكون من ١١ رقماً (مثال: 01012345678)');
      return;
    }

    if (password.length < 4) {
      setErrorMsg('الرقم السري يجب ألا يقل عن 4 رموز أو أرقام للأمان');
      return;
    }

    if (isRegisterMode) {
      if (password !== confirmPassword) {
        setErrorMsg('الرقم السري وتأكيده غير متطابقين! يرجى مراجعة الرقم السري والتأكد من مطابقته تماماً.');
        return;
      }

      if (!fullName.trim()) {
        setErrorMsg('يرجى إدخال الاسم الكامل للتسجيل');
        return;
      }

      if (userRole === 'driver') {
        if (driverNationalId && !/^[0-9]{14}$/.test(driverNationalId)) {
          setErrorMsg('الرقم القومي غير صحيح! يجب أن يتكون من ١٤ رقماً بالكامل في حال إدخاله');
          return;
        }
      }
    }

    setLoading(true);

    try {
      if (isRegisterMode) {
        // Register Call
        const response = await fetch(getApiUrl('/api/auth/register'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            password: password,
            name: fullName,
            role: userRole,
            nationalId: userRole === 'driver' ? driverNationalId : undefined,
            vehicleType: userRole === 'driver' ? vehicleType : undefined,
            personalPhoto,
            nationalIdPhoto,
            tukTukBackPhoto
          })
        });

        let data: any = {};
        const responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse register response JSON:', responseText);
            data = { error: 'استجابة غير صالحة من الخادم' };
          }
        }

        if (!response.ok) {
          throw new Error(data.error || `فشلت عملية التسجيل بطلب خاطئ من الخادم (كود: ${response.status})`);
        }

        setSuccessMsg('تم إنشاء الحساب وتفعيله بنجاح! جاري الدخول... 🎉');
        setTimeout(() => {
          onLoginSuccess(userRole, cleanPhone, userRole === 'driver' ? data.user : undefined);
        }, 1500);

      } else {
        // Login Call
        const response = await fetch(getApiUrl('/api/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: cleanPhone,
            password: password,
            role: userRole
          })
        });

        let data: any = {};
        const responseText = await response.text();
        if (responseText) {
          try {
            data = JSON.parse(responseText);
          } catch (e) {
            console.error('Failed to parse login response JSON:', responseText);
            data = { error: 'استجابة غير صالحة من الخادم' };
          }
        }

        if (!response.ok) {
          throw new Error(data.error || `فشل تسجيل الدخول من الخادم (كود: ${response.status})`);
        }

        setSuccessMsg('تم التحقق بنجاح! أهلاً بك مجدداً... 🟢');
        setTimeout(() => {
          onLoginSuccess(userRole, cleanPhone, userRole === 'driver' ? data.user : undefined);
        }, 1200);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'حدث خطأ في الاتصال بالخادم، يرجى التحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  };

  const renderPhotoUploader = (
    label: string,
    value: string | null,
    setter: (val: string | null) => void,
    icon: React.ReactNode
  ) => {
    return (
      <div className="space-y-1 text-right">
        <label className="block text-xs font-black text-slate-700">{label}</label>
        <div className="relative border border-dashed border-slate-200 hover:border-emerald-500 rounded-xl p-3 text-center transition-all bg-slate-50/50 flex flex-col items-center justify-center min-h-[85px]">
          {value ? (
            <div className="w-full flex items-center justify-between gap-1 bg-emerald-50 text-emerald-800 p-2 rounded-lg text-xs">
              <div className="flex items-center gap-1.5 text-right">
                <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="truncate max-w-[110px]">
                  <span className="font-bold block text-[10px]">تم بنجاح ✅</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setter(null)}
                className="text-[10px] font-bold text-rose-500 hover:underline cursor-pointer"
              >
                حذف
              </button>
            </div>
          ) : (
            <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer py-1">
              <input
                type="file"
                accept="image/*"
                onChange={(e) => handleFileChange(e, setter)}
                className="hidden"
              />
              {icon}
              <span className="text-[9px] text-slate-500 font-bold mt-1">اضغط للرفع</span>
            </label>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col flex-1 max-w-md mx-auto w-full bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-100 min-h-[600px] justify-between relative p-6 md:p-8" dir="rtl">
      
      {/* Brand Header */}
      <div className="flex flex-col items-center text-center mt-2">
        <motion.div
          initial={{ scale: 0.8, rotate: -10 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 10 }}
          className="w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20 text-white text-3xl mb-3 relative overflow-hidden"
          id="brand-logo"
        >
          <span className="relative z-10 font-bold">🛺</span>
          <div className="absolute inset-0 bg-gradient-to-tr from-emerald-700 to-emerald-500 opacity-50" />
        </motion.div>

        <h1 className="text-xl font-black text-slate-800" id="brand-title">توصيلة</h1>
        <p className="text-[11px] text-slate-500 font-medium mt-0.5">تطبيق حجز وسائل النقل الأسرع والأكثر أماناً بالمدينة 🏙️</p>
      </div>

      {/* Mode Switch (Login vs Register) */}
      <div className="bg-slate-100 p-1 rounded-xl grid grid-cols-2 gap-1 my-4 shrink-0">
        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(false);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`py-2 rounded-lg text-xs font-black transition-all ${
            !isRegisterMode 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <LogIn className="w-3.5 h-3.5" />
            <span>تسجيل دخول</span>
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setIsRegisterMode(true);
            setErrorMsg('');
            setSuccessMsg('');
          }}
          className={`py-2 rounded-lg text-xs font-black transition-all ${
            isRegisterMode 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span className="flex items-center justify-center gap-1.5">
            <UserPlus className="w-3.5 h-3.5" />
            <span>حساب جديد</span>
          </span>
        </button>
      </div>

      {/* Main Authentication Form */}
      <form onSubmit={handleAuthSubmit} className="space-y-4 flex-1 flex flex-col justify-center">
        
        {/* Role Selector (Rider vs Driver) */}
        <div className="space-y-1.5">
          <label className="block text-right text-xs font-black text-slate-700">دخول كـ :</label>
          <div className="grid grid-cols-2 gap-2" id="role-selector">
            <button
              type="button"
              onClick={() => setUserRole('passenger')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                userRole === 'passenger'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-sm">🙋‍♂️</span>
              <span>أنا راكب</span>
            </button>

            <button
              type="button"
              onClick={() => setUserRole('driver')}
              className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                userRole === 'driver'
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-800 shadow-sm'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              <span className="text-sm">🛺</span>
              <span>أنا كابتن (سائق)</span>
            </button>
          </div>
        </div>

        {/* Name input (Only in registration mode) */}
        {isRegisterMode && (
          <div className="space-y-1 text-right">
            <label className="block text-xs font-black text-slate-700">الاسم الكامل</label>
            <div className="relative flex items-center">
              <input
                type="text"
                placeholder="مثال: محمد أحمد عاشور"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full text-right py-2.5 px-4 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                required
              />
              <UserIcon className="w-4 h-4 text-slate-400 absolute right-3 shrink-0" />
            </div>
          </div>
        )}

        {/* Phone number input */}
        <div className="space-y-1 text-right">
          <label className="block text-xs font-black text-slate-700">رقم الهاتف المحمول</label>
          <div className="relative flex items-center">
            <input
              type="tel"
              placeholder="01012345678"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              className="w-full text-left font-mono tracking-wider pl-12 pr-10 py-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all text-xs font-bold"
              dir="ltr"
              maxLength={11}
              required
            />
            <Phone className="w-4 h-4 text-slate-400 absolute right-3 shrink-0" />
            <div className="absolute left-3 pl-2 border-r border-slate-200 text-slate-400 flex items-center gap-0.5">
              <span className="text-[10px] font-mono font-bold text-slate-500">+20</span>
            </div>
          </div>
        </div>

        {/* Password input */}
        <div className="space-y-1.5 text-right">
          <div className="flex justify-between items-center">
            <label className="block text-xs font-black text-slate-700">الرقم السري الخاص بك (الباسورد)</label>
            {isRegisterMode && password && (
              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full border ${strength.color}`}>
                {strength.text}
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="أدخل كلمة المرور السرية"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full text-right py-2.5 pl-10 pr-10 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
              required
            />
            <Lock className="w-4 h-4 text-slate-400 absolute right-3 shrink-0" />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute left-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 shrink-0 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {/* Password strength bar indicator */}
          {isRegisterMode && password && (
            <div className="w-full bg-slate-100 rounded-full h-1 mt-1 overflow-hidden">
              <div className={`h-full transition-all duration-300 ${strength.width} ${strength.progressColor}`} />
            </div>
          )}
        </div>

        {/* Confirm Password input (Only in register mode) */}
        {isRegisterMode && (
          <div className="space-y-1.5 text-right">
            <div className="flex justify-between items-center">
              <label className="block text-xs font-black text-slate-700">تأكيد الرقم السري</label>
              {confirmPassword && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                  password === confirmPassword 
                    ? 'text-emerald-700 bg-emerald-50' 
                    : 'text-rose-700 bg-rose-50'
                }`}>
                  {password === confirmPassword ? 'متطابق بنجاح ✅' : 'غير متطابق بعد ⚠️'}
                </span>
              )}
            </div>
            <div className="relative flex items-center">
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="أعد كتابة الرقم السري للتأكيد"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className={`w-full text-right py-2.5 pl-10 pr-10 border rounded-xl focus:outline-none focus:ring-2 text-xs font-bold transition-all ${
                  confirmPassword
                    ? password === confirmPassword
                      ? 'border-emerald-200 focus:ring-emerald-500'
                      : 'border-rose-200 focus:ring-rose-500'
                    : 'border-slate-200 focus:ring-emerald-500'
                }`}
                required
              />
              <Lock className="w-4 h-4 text-slate-400 absolute right-3 shrink-0" />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute left-3 text-slate-400 hover:text-slate-600 focus:outline-none p-1 shrink-0 cursor-pointer"
              >
                {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
        )}

        {/* Onboarding fields for Driver (Only in Register Mode) */}
        {isRegisterMode && userRole === 'driver' && (
          <div className="space-y-4 pt-1 border-t border-slate-100">
            {/* Vehicle Type Selection */}
            <div className="space-y-1.5 text-right">
              <label className="block text-xs font-black text-slate-700">نوع المركبة</label>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setVehicleType('tuktuk')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    vehicleType === 'tuktuk'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/20 font-black'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="text-base">🛺</span>
                  <span className="text-[10px] font-black">توك توك</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    vehicleType === 'motorcycle'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/20 font-black'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="text-base">🏍️</span>
                  <span className="text-[10px] font-black">موتوسيكل</span>
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('scooter')}
                  className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                    vehicleType === 'scooter'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-500/20 font-black'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <span className="text-base">🛵</span>
                  <span className="text-[10px] font-black">سكوتر</span>
                </button>
              </div>
            </div>

            {/* Collapsible Section for advanced files/national ID */}
            <details className="group border border-slate-200 rounded-xl bg-slate-50/50 overflow-hidden">
              <summary className="p-3 text-[11px] font-black text-slate-600 hover:text-slate-900 flex justify-between items-center cursor-pointer select-none">
                <span className="flex items-center gap-1">
                  <span>🛡️ إضافة بيانات التوثيق والبطاقة</span>
                  <span className="text-[9px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md font-bold">(اختياري تماماً للتسهيل)</span>
                </span>
                <ChevronDown className="w-3.5 h-3.5 transition-transform duration-300 group-open:rotate-180 text-slate-400" />
              </summary>

              <div className="p-3 border-t border-slate-200/60 bg-white space-y-4">
                {/* Quick pre-fill simulator */}
                <button
                  type="button"
                  onClick={handleQuickFill}
                  className="w-full py-2 px-3 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-black flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-[0.98]"
                >
                  <Sparkles className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>⚡ ملء سريع ببيانات تجريبية كاملة تلقائياً</span>
                </button>

                {/* National ID Input */}
                <div className="space-y-1 text-right">
                  <label className="block text-xs font-black text-slate-700">الرقم القومي للبطاقة (اختياري)</label>
                  <input
                    type="text"
                    placeholder="29505122401234"
                    value={driverNationalId}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (/^[0-9]*$/.test(val) && val.length <= 14) {
                        setDriverNationalId(val);
                      }
                    }}
                    className="w-full text-left font-mono tracking-wider py-2 px-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                    dir="ltr"
                  />
                  <span className="text-[9px] text-slate-400 font-bold block">
                    تم كتابة {driverNationalId.length}/14 رقماً
                  </span>
                </div>

                {/* Optional Image Uploaders */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black text-slate-700 text-right">أوراق وصور إضافية (اختياري)</label>
                  <div className="grid grid-cols-3 gap-2">
                    {renderPhotoUploader('الشخصية 👤', personalPhoto, setPersonalPhoto, <Camera className="w-4 h-4 text-slate-400" />)}
                    {renderPhotoUploader('البطاقة 💳', nationalIdPhoto, setNationalIdPhoto, <ImageIcon className="w-4 h-4 text-slate-400" />)}
                    {renderPhotoUploader('المركبة 🛺', tukTukBackPhoto, setTukTukBackPhoto, <Camera className="w-4 h-4 text-slate-400" />)}
                  </div>
                </div>
              </div>
            </details>
          </div>
        )}

        {/* Error / Success Notifications */}
        {errorMsg && (
          <div className="flex flex-col gap-2 bg-rose-50 border border-rose-100 text-rose-600 p-3 rounded-xl text-[11px] text-right animate-fadeIn" id="error-alert">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span className="font-semibold leading-normal">{errorMsg}</span>
            </div>
            {localStorage.getItem('TAWSEELA_API_BASE_URL') && (
              <div className="mt-1 pt-2 border-t border-rose-100/60 text-right">
                <p className="text-[10px] text-rose-500 font-bold mb-1">💡 تنبيه: يبدو أنك تستخدم رابط خادم اتصال مخصص. إذا كان هذا هو سبب الخطأ (كود 404):</p>
                <button
                  type="button"
                  onClick={() => {
                    localStorage.removeItem('TAWSEELA_API_BASE_URL');
                    window.location.reload();
                  }}
                  className="text-[10px] text-emerald-700 hover:text-emerald-900 font-black cursor-pointer bg-emerald-50 hover:bg-emerald-100 px-2.5 py-1.5 rounded-lg border border-emerald-200 transition-all inline-block"
                >
                  🔄 إعادة تعيين الاتصال بالخادم المدمج والافتراضي للتطبيق
                </button>
              </div>
            )}
          </div>
        )}

        {successMsg && (
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-100 text-emerald-700 p-2.5 rounded-xl text-[11px] text-right">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span className="font-black">{successMsg}</span>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl font-bold shadow-md transition-all active:scale-[0.98] text-xs flex items-center justify-center gap-1.5 cursor-pointer mt-2"
        >
          {loading ? (
            <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : isRegisterMode ? (
            <>
              <UserCheck className="w-4 h-4" />
              <span>تسجيل وإنشاء حساب جديد</span>
            </>
          ) : (
            <>
              <ShieldCheck className="w-4 h-4" />
              <span>تأكيد الدخول الآمن</span>
            </>
          )}
        </button>
      </form>

      {/* Safety Badge */}
      <div className="flex items-center justify-center gap-1 text-[9px] text-slate-400 border-t border-slate-100 pt-3 mt-4">
        <span>توصيلة بنسخة تشغيلية مؤمنة ومشفرة تماماً</span>
        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
      </div>
    </div>
  );
}
