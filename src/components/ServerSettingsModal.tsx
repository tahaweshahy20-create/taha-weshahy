/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Link,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  X,
  Server,
  Network,
  HelpCircle,
  Compass
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  getCustomApiBase,
  setCustomApiBase,
  isLiveModeEnabled,
  setLiveModeEnabled,
  getApiUrl
} from '../utils/api';

interface ServerSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ServerSettingsModal({ isOpen, onClose }: ServerSettingsModalProps) {
  const [apiBase, setApiBase] = useState('');
  const [liveMode, setLiveMode] = useState(true);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'connected' | 'failed'>('checking');
  const [latency, setLatency] = useState<number | null>(null);

  // Initialize values
  useEffect(() => {
    if (isOpen) {
      setApiBase(getCustomApiBase());
      setLiveMode(isLiveModeEnabled());
      checkHealth();
    }
  }, [isOpen]);

  const checkHealth = async () => {
    setHealthStatus('checking');
    const startTime = Date.now();
    try {
      // Use configured API base or default to empty
      const target = getApiUrl('/api/health');
      const response = await fetch(target, { method: 'GET', cache: 'no-store' });
      if (response.ok) {
        const duration = Date.now() - startTime;
        setLatency(duration);
        setHealthStatus('connected');
      } else {
        setHealthStatus('failed');
      }
    } catch (e) {
      setHealthStatus('failed');
    }
  };

  const handleSave = () => {
    setCustomApiBase(apiBase);
    setLiveModeEnabled(liveMode);
    checkHealth();
    // Refresh page or trigger app-wide reload to apply changes instantly
    setTimeout(() => {
      onClose();
      window.location.reload();
    }, 800);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm" id="server-settings-modal">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-right font-sans"
        dir="rtl"
      >
        {/* Header */}
        <div className="bg-gradient-to-l from-emerald-700 to-emerald-600 text-white px-6 py-5 relative">
          <button
            onClick={onClose}
            className="absolute left-4 top-5 text-white/80 hover:text-white hover:bg-white/10 p-1.5 rounded-full transition-all cursor-pointer"
            title="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-xl">
              🔌
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight leading-none">إعدادات الربط بالخادم (الـ API)</h2>
              <p className="text-[10px] text-emerald-100/80 font-bold mt-1">حل جذري للمزامنة والربط المباشر مع النطاقات المخصصة</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Status Panel */}
          <div className="p-4 rounded-2xl border flex items-center justify-between gap-4 bg-slate-50 border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-white shadow-sm">
                <Network className="w-5 h-5 text-slate-600 animate-pulse" />
              </div>
              <div>
                <p className="text-xs font-black text-slate-800">حالة الاتصال الفعلي بالخادم</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {healthStatus === 'checking' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping" />
                      <span className="text-[10px] text-amber-600 font-bold">جاري فحص الاتصال...</span>
                    </>
                  )}
                  {healthStatus === 'connected' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                      <span className="text-[10px] text-emerald-600 font-bold">متصل بالخادم ({latency}ms)</span>
                    </>
                  )}
                  {healthStatus === 'failed' && (
                    <>
                      <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] text-rose-600 font-bold">غير قادر على الاتصال (محاكاة محلية)</span>
                    </>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={checkHealth}
              className="p-2 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-800 transition-colors shadow-sm cursor-pointer"
              title="تحديث الاتصال"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {/* Setup Information */}
          <div className="text-xs text-slate-600 leading-relaxed space-y-1">
            <p className="font-bold text-slate-800">💡 تعليمات الربط الناجح:</p>
            <p>• إذا كان تطبيقك يعمل بالكامل على خادم متكامل، اترك الحقل فارغاً لاستخدام نفس خادم الاستضافة.</p>
            <p>• إذا قمت بفصل الواجهة الأمامية عن الخلفية، أدخل رابط خادم الخلفية (مثال: <code className="bg-slate-100 px-1 py-0.5 rounded text-rose-600 font-mono text-[10px]">https://my-backend-app.ai.studio</code>).</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-700 mb-2">رابط خادم الـ API (Base URL)</label>
              <div className="relative">
                <input
                  type="url"
                  placeholder="رابط الخادم (اتركه فارغاً للاستخدام الافتراضي المدمج)"
                  value={apiBase}
                  onChange={(e) => setApiBase(e.target.value)}
                  className="w-full border border-slate-200 rounded-2xl px-4 py-3 text-left font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-slate-50 focus:bg-white transition-all pl-12"
                  dir="ltr"
                />
                <Server className="w-5 h-5 text-slate-400 absolute left-4 top-3.5" />
              </div>
            </div>

            {/* Toggle Switch */}
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="space-y-0.5">
                <span className="text-xs font-black text-slate-800">تفعيل الربط المباشر المزامر للركاب والكباتن</span>
                <p className="text-[10px] text-slate-400">عند تعطيله، سيعتمد التطبيق على المحاكاة التجريبية الفورية.</p>
              </div>
              <button
                type="button"
                onClick={() => setLiveMode(!liveMode)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  liveMode ? 'bg-emerald-600' : 'bg-slate-300'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    liveMode ? '-translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Warning banner if not connected */}
          {healthStatus === 'failed' && liveMode && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[10px] text-amber-700 font-bold leading-normal">
                تنبيه: لقد قمت بتفعيل الربط المباشر ولكن لا يمكن الاتصال بالخادم المدخل حالياً. سيقوم التطبيق بطلب الركاب/الكباتن من الخادم ولكن قد يعود إلى المحاكاة المحلية إذا فشلت الطلبات.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 rounded-xl transition-all cursor-pointer"
          >
            إلغاء
          </button>
          <button
            onClick={handleSave}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-600/15 transition-all cursor-pointer flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            حفظ وتحديث التطبيق
          </button>
        </div>
      </motion.div>
    </div>
  );
}
