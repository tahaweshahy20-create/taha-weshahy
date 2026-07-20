import React, { useState } from 'react';
import { getApiUrl } from '../utils/api';
import {
  Wrench,
  AlertCircle,
  MessageSquare,
  User,
  Phone,
  Send,
  X,
  CheckCircle,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface SupportModalProps {
  onClose: () => void;
  userPhone: string;
  userRole: 'passenger' | 'driver' | 'owner';
}

export default function SupportModal({ onClose, userPhone, userRole }: SupportModalProps) {
  const [ticketType, setTicketType] = useState<'complaint' | 'fault' | 'support'>('complaint');
  const [senderName, setSenderName] = useState('');
  const [senderPhone, setSenderPhone] = useState(userPhone || '');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim() || !senderName.trim() || !senderPhone.trim()) {
      setErrorMessage('الرجاء ملء جميع الحقول المطلوبة.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    try {
      const response = await fetch(getApiUrl('/api/owner/complaints/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: ticketType,
          senderRole: userRole === 'owner' ? 'passenger' : userRole, // map owner helper to passenger
          senderPhone,
          senderName,
          title,
          description
        })
      });

      if (response.ok) {
        setIsSuccess(true);
      } else {
        const data = await response.json();
        setErrorMessage(data.error || 'حدث خطأ أثناء إرسال البلاغ.');
      }
    } catch (err) {
      setErrorMessage('تعذر الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 text-right" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col p-6 space-y-4 relative"
      >
        <button
          onClick={onClose}
          className="absolute top-4 left-4 p-1.5 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b pb-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center text-amber-600">
            <Wrench className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-800">مركز تقديم البلاغات والشكاوى الآمن 🛡️</h3>
            <p className="text-[10px] text-slate-400">تواصل مباشر مع مالك التطبيق والمدير العام لضمان حقك وحل مشكلتك</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-4">
            <div className="w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 mx-auto border border-emerald-100">
              <CheckCircle className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-black text-slate-800">تم إرسال بلاغك بنجاح للمالك! 📨</h4>
              <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                لقد استلمت الإدارة بلاغك الآن. سيقوم مالك التطبيق بمراجعته والتواصل معك تلفونياً أو إرسال رد عبر مركز المساعدة في أقرب وقت. شكراً لحرصك على نظام وأمان توصيلة!
              </p>
            </div>
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer"
            >
              حسناً، فهمت
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorMessage && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-xs font-bold text-red-600 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Step 1: Type selection */}
            <div className="space-y-1.5">
              <label className="block text-xs font-black text-slate-700">نوع البلاغ/الشكوى:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTicketType('complaint')}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    ticketType === 'complaint'
                      ? 'border-rose-500 bg-rose-50 text-rose-700 shadow-xs'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <AlertTriangle className="w-4 h-4 text-rose-600" />
                  <span>شكوى سلوك/تلاعب</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketType('fault')}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    ticketType === 'fault'
                      ? 'border-orange-500 bg-orange-50 text-orange-700 shadow-xs'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <Wrench className="w-4 h-4 text-orange-600" />
                  <span>عطل توكتوك بالطريق</span>
                </button>

                <button
                  type="button"
                  onClick={() => setTicketType('support')}
                  className={`py-2 px-2 rounded-xl border text-[10px] font-black transition-all flex flex-col items-center gap-1 cursor-pointer ${
                    ticketType === 'support'
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 shadow-xs'
                      : 'border-slate-100 bg-slate-50 hover:border-slate-200 text-slate-600'
                  }`}
                >
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>دعم فني واستفسار</span>
                </button>
              </div>
            </div>

            {/* Sender Info fields */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700">الاسم الكريم :</label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    placeholder="مثال: أحمد مصطفى"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                    className="w-full text-right py-2 pl-3 pr-8 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                  <User className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-2.5" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-700">رقم الهاتف :</label>
                <div className="relative">
                  <input
                    type="tel"
                    required
                    placeholder="مثال: 01012345678"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                    className="w-full text-left py-2 pl-3 pr-8 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                    dir="ltr"
                  />
                  <Phone className="w-3.5 h-3.5 text-slate-400 absolute top-3 right-2.5" />
                </div>
              </div>
            </div>

            {/* Ticket Subject */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700">عنوان البلاغ (موضوع المشكلة):</label>
              <input
                type="text"
                required
                placeholder="مثال: السائق طلب أجرة زائدة عن السعر المحدد"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-right py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            {/* Ticket Description */}
            <div className="space-y-1">
              <label className="block text-xs font-black text-slate-700">تفاصيل ما حدث بالتفصيل :</label>
              <textarea
                required
                rows={3}
                placeholder="اكتب تفاصيل مشكلتك هنا بوضوح لكي يتمكن المالك من اتخاذ الإجراء المناسب ومساعدتك فوراً..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full text-right py-2 px-3 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
              />
            </div>

            {/* Antitheft Notice */}
            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-500 leading-relaxed font-semibold">
                **سرية تامة:** يتم إرسال البلاغ مباشرةً لمالك المنصة والمدير الفني دون علم السائق المشكو في حقه لضمان خصوصيتك وحريتك الكاملة.
              </p>
            </div>

            {/* Form Actions */}
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-black rounded-xl cursor-pointer"
              >
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white text-xs font-black rounded-xl cursor-pointer disabled:opacity-40 flex items-center gap-1.5 shadow-md"
              >
                <span>إرسال البلاغ الآن</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        )}
      </motion.div>
    </div>
  );
}
