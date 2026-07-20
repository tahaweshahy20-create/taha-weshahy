import React, { useState, useEffect } from 'react';
import { getApiUrl } from '../utils/api';
import {
  Shield,
  Search,
  MessageSquare,
  Phone,
  CheckCircle,
  AlertCircle,
  Wrench,
  Clock,
  User,
  MapPin,
  TrendingUp,
  Filter,
  CheckSquare,
  ArrowLeft,
  Users,
  AlertTriangle,
  Send,
  Sparkles,
  ExternalLink,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface OwnerDashboardProps {
  onClose: () => void;
  userPhone: string;
}

interface Complaint {
  id: string;
  type: 'complaint' | 'fault' | 'support';
  senderRole: 'passenger' | 'driver';
  senderPhone: string;
  senderName: string;
  title: string;
  description: string;
  status: 'pending' | 'resolved' | 'processing';
  createdAt: string;
  replies: {
    id: string;
    sender: 'owner' | 'user';
    text: string;
    time: string;
  }[];
}

interface LiveRide {
  id: string;
  passengerPhone: string;
  driverPhone: string | null;
  pickup: { name: string };
  destination: { name: string };
  fare: number;
  status: string;
  paymentMethod?: string;
  securePin?: string;
  driverName?: string;
}

export default function OwnerDashboard({ onClose, userPhone }: OwnerDashboardProps) {
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [liveRides, setLiveRides] = useState<LiveRide[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'tickets' | 'rides' | 'drivers' | 'sponsors'>('overview');
  
  // New States for Drivers & Ads Management
  const [driversList, setDriversList] = useState<any[]>([]);
  const [adsList, setAdsList] = useState<any[]>([]);
  const [isSubmittingAd, setIsSubmittingAd] = useState(false);

  // Edit Driver States
  const [editingDriver, setEditingDriver] = useState<any | null>(null);
  const [editDriverName, setEditDriverName] = useState('');
  const [editDriverNationalId, setEditDriverNationalId] = useState('');
  const [editDriverVehicle, setEditDriverVehicle] = useState<'tuktuk' | 'motorcycle' | 'scooter'>('tuktuk');
  const [editDriverStatus, setEditDriverStatus] = useState<'approved' | 'blocked' | 'pending'>('approved');
  const [editDriverIsPaid, setEditDriverIsPaid] = useState(false);
  const [editDriverTrialDays, setEditDriverTrialDays] = useState(15);
  const [editDriverPassword, setEditDriverPassword] = useState('');
  const [isSavingDriver, setIsSavingDriver] = useState(false);
  
  // Ad form states
  const [sponsorName, setSponsorName] = useState('');
  const [adTitle, setAdTitle] = useState('');
  const [adText, setAdText] = useState('');
  const [adCity, setAdCity] = useState('');
  const [adLink, setAdLink] = useState('');

  // Filtering and search states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'processing' | 'resolved'>('all');
  const [typeFilter, setTypeFilter] = useState<'all' | 'complaint' | 'fault' | 'support'>('all');
  
  // Selected ticket for interaction
  const [selectedTicket, setSelectedTicket] = useState<Complaint | null>(null);
  const [replyText, setReplyText] = useState('');
  const [isSubmittingReply, setIsSubmittingReply] = useState(false);
  const [successToast, setSuccessToast] = useState('');

  // Fetch complaints and live rides
  const fetchDashboardData = async () => {
    try {
      const compRes = await fetch(getApiUrl('/api/owner/complaints'));
      if (compRes.ok) {
        const compData = await compRes.json();
        setComplaints(compData);
        // If a ticket is currently selected, update its reference
        if (selectedTicket) {
          const updated = compData.find((c: Complaint) => c.id === selectedTicket.id);
          if (updated) setSelectedTicket(updated);
        }
      }

      const rideRes = await fetch(getApiUrl('/api/owner/rides'));
      if (rideRes.ok) {
        const rideData = await rideRes.json();
        setLiveRides(rideData);
      }

      // Fetch drivers
      const driversRes = await fetch(getApiUrl('/api/drivers'));
      if (driversRes.ok) {
        const driversData = await driversRes.json();
        setDriversList(driversData);
      }

      // Fetch ads
      const adsRes = await fetch(getApiUrl('/api/ads'));
      if (adsRes.ok) {
        const adsData = await adsRes.json();
        setAdsList(adsData);
      }
    } catch (e) {
      console.warn("Could not fetch owner dashboard data:", e);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // Poll data every 5 seconds for real-time monitoring
    const interval = setInterval(fetchDashboardData, 5000);
    return () => clearInterval(interval);
  }, [selectedTicket]);

  const handleResolveTicket = async (ticketId: string, status: 'resolved' | 'processing') => {
    try {
      const res = await fetch(getApiUrl('/api/owner/complaints/resolve'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ticketId, status })
      });

      if (res.ok) {
        setSuccessToast(status === 'resolved' ? 'تم حل المشكلة وإغلاق التذكرة بنجاح ✅' : 'تم تغيير حالة التذكرة إلى قيد المتابعة 🛠️');
        setTimeout(() => setSuccessToast(''), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSendReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedTicket) return;

    setIsSubmittingReply(true);
    try {
      const res = await fetch(getApiUrl('/api/owner/complaints/reply'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          text: replyText,
          sender: 'owner'
        })
      });

      if (res.ok) {
        setReplyText('');
        setSuccessToast('تم إرسال رد الدعم الفني للراكب/الكابتن بنجاح 💬');
        setTimeout(() => setSuccessToast(''), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingReply(false);
    }
  };

  // Driver management handlers
  const handleUpdateDriverStatus = async (phone: string, status: 'approved' | 'blocked' | 'pending') => {
    try {
      const res = await fetch(getApiUrl('/api/drivers/update-status'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, status })
      });
      if (res.ok) {
        setSuccessToast(`تم تحديث حالة السائق بنجاح إلى: ${status === 'approved' ? 'معتمد' : status === 'blocked' ? 'محظور' : 'قيد الانتظار'} ✅`);
        setTimeout(() => setSuccessToast(''), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTogglePaidStatus = async (phone: string, isPaid: boolean, trialDaysLeft?: number) => {
    try {
      const res = await fetch(getApiUrl('/api/drivers/toggle-paid'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, isPaid, trialDaysLeft })
      });
      if (res.ok) {
        setSuccessToast(isPaid ? 'تم تفعيل الاشتراك المدفوع للكابتن بنجاح! 💳' : 'تم تحويل الاشتراك إلى نظام الفترات التجريبية ⏱️');
        setTimeout(() => setSuccessToast(''), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleStartEditDriver = (driver: any) => {
    setEditingDriver(driver);
    setEditDriverName(driver.name || '');
    setEditDriverNationalId(driver.nationalId || '');
    setEditDriverVehicle(driver.vehicleType || 'tuktuk');
    setEditDriverStatus(driver.status || 'approved');
    setEditDriverIsPaid(!!driver.isPaid);
    setEditDriverTrialDays(driver.trialDaysLeft !== undefined ? driver.trialDaysLeft : 15);
    setEditDriverPassword(driver.passwordPin || '');
  };

  const handleSaveDriverDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDriver) return;
    setIsSavingDriver(true);
    try {
      const res = await fetch(getApiUrl('/api/drivers/update'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: editingDriver.phone,
          name: editDriverName,
          nationalId: editDriverNationalId,
          vehicleType: editDriverVehicle,
          status: editDriverStatus,
          isPaid: editDriverIsPaid,
          trialDaysLeft: editDriverTrialDays,
          passwordPin: editDriverPassword
        })
      });

      if (res.ok) {
        setSuccessToast('تم تحديث وحفظ بيانات الكابتن بنجاح! 💾');
        setTimeout(() => setSuccessToast(''), 3000);
        setEditingDriver(null);
        fetchDashboardData();
      } else {
        const d = await res.json();
        alert(d.error || 'حدث خطأ أثناء حفظ التعديلات');
      }
    } catch (err: any) {
      console.error(err);
      alert('فشلت عملية الحفظ بسبب عطل في الاتصال بالخادم');
    } finally {
      setIsSavingDriver(false);
    }
  };

  // Sponsor/Ads management handlers
  const handleCreateAd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adTitle.trim() || !sponsorName.trim() || !adText.trim()) return;

    setIsSubmittingAd(true);
    try {
      const res = await fetch(getApiUrl('/api/ads/create'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: adTitle,
          sponsorName,
          text: adText,
          city: adCity,
          linkUrl: adLink
        })
      });
      if (res.ok) {
        setAdTitle('');
        setSponsorName('');
        setAdText('');
        setAdCity('');
        setAdLink('');
        setSuccessToast('تم نشر إعلان الراعي الرسمي الجديد بالمدينة بنجاح! 🌟');
        setTimeout(() => setSuccessToast(''), 3000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsSubmittingAd(false);
    }
  };

  const handleToggleAd = async (id: string) => {
    try {
      const res = await fetch(getApiUrl('/api/ads/toggle'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setSuccessToast('تم تغيير حالة نشاط الإعلان بنجاح 🔄');
        setTimeout(() => setSuccessToast(''), 2000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteAd = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا الراعي/الإعلان نهائياً من التطبيق؟')) return;
    try {
      const res = await fetch(getApiUrl('/api/ads/delete'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      if (res.ok) {
        setSuccessToast('تم حذف الراعي المالي بنجاح 🗑️');
        setTimeout(() => setSuccessToast(''), 2000);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Filter tickets based on selection
  const filteredTickets = complaints.filter(ticket => {
    const matchesSearch = 
      ticket.senderName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket.senderPhone.includes(searchTerm);
    
    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.type === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Count tickets by status/type
  const pendingCount = complaints.filter(c => c.status === 'pending').length;
  const processingCount = complaints.filter(c => c.status === 'processing').length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const faultsCount = complaints.filter(c => c.type === 'fault').length;

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" dir="rtl">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-slate-50 w-full max-w-5xl h-[90vh] rounded-[32px] overflow-hidden shadow-2xl flex flex-col border border-slate-100"
      >
        {/* TOAST SUCCESS BANNER */}
        <AnimatePresence>
          {successToast && (
            <motion.div
              initial={{ y: -50, opacity: 0 }}
              animate={{ y: 20, opacity: 1 }}
              exit={{ y: -50, opacity: 0 }}
              className="absolute top-4 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-600 text-white px-6 py-3 rounded-2xl shadow-xl text-xs font-black"
            >
              {successToast}
            </motion.div>
          )}
        </AnimatePresence>

        {/* OWNER HEADER NAVBAR */}
        <header className="bg-slate-900 text-white px-6 py-4 flex flex-col sm:flex-row justify-between items-center shrink-0 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-2xl shadow-md">
              👑
            </div>
            <div className="text-right">
              <h1 className="text-lg font-black tracking-tight flex items-center gap-2">
                <span>لوحة تحكم وإدارة توصيلة (المالك)</span>
                <span className="text-[10px] bg-emerald-500 text-emerald-950 px-2 py-0.5 rounded-full font-bold">الوضع الإداري 💼</span>
              </h1>
              <p className="text-xs text-slate-400">متابعة الأعطال، الشكاوى، وتقديم الدعم المباشر للسائقين والركاب</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-black rounded-xl border border-slate-700 transition-all cursor-pointer"
            >
              الخروج والعودة للتطبيق 🚪
            </button>
          </div>
        </header>

        {/* BENTO DASHBOARD COLUMNS */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          
          {/* SIDEBAR TABS */}
          <aside className="w-full md:w-56 bg-white border-l border-slate-200 p-4 shrink-0 flex md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
            <button
              onClick={() => { setActiveTab('overview'); setSelectedTicket(null); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center gap-2.5 shrink-0 ${
                activeTab === 'overview'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              <span>نظرة عامة وإحصائيات</span>
            </button>

            <button
              onClick={() => { setActiveTab('tickets'); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between shrink-0 ${
                activeTab === 'tickets'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Wrench className="w-4 h-4" />
                <span>الشكاوى والأعطال</span>
              </div>
              {pendingCount > 0 && (
                <span className="bg-rose-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
                  {pendingCount}
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('rides'); setSelectedTicket(null); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between shrink-0 ${
                activeTab === 'rides'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <MapPin className="w-4 h-4" />
                <span>الرحلات المباشرة</span>
              </div>
              {liveRides.filter(r => r.status !== 'completed' && r.status !== 'canceled').length > 0 && (
                <span className="bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {liveRides.filter(r => r.status !== 'completed' && r.status !== 'canceled').length} نشط
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('drivers'); setSelectedTicket(null); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between shrink-0 ${
                activeTab === 'drivers'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4" />
                <span>إدارة كباتن المدينة</span>
              </div>
              {driversList.length > 0 && (
                <span className="bg-slate-200 text-slate-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {driversList.length} سائق
                </span>
              )}
            </button>

            <button
              onClick={() => { setActiveTab('sponsors'); setSelectedTicket(null); }}
              className={`w-full text-right px-4 py-3 rounded-xl text-xs font-black transition-all flex items-center justify-between shrink-0 ${
                activeTab === 'sponsors'
                  ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/10'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4" />
                <span>الرعاة والإعلانات الممولة</span>
              </div>
              {adsList.length > 0 && (
                <span className="bg-amber-100 text-amber-800 text-[9px] font-black px-1.5 py-0.5 rounded-full">
                  {adsList.length} راعي
                </span>
              )}
            </button>

            <div className="hidden md:block border-t border-slate-100 my-4" />

            <div className="hidden md:flex flex-col gap-2.5 bg-slate-50 p-3.5 rounded-2xl border border-slate-100 text-right mt-auto">
              <span className="text-[10px] text-slate-400 font-bold block">مراقبة الأمان والنزاهة 🛡️</span>
              <p className="text-[9px] text-slate-500 leading-relaxed font-semibold">
                يقوم النظام بالتحقق التلقائي من كود الأمان PIN لكل رحلة لضمان عدم حدوث تلاعب في الأسعار أو تهرب مالي.
              </p>
            </div>
          </aside>

          {/* MAIN CONTENT AREA */}
          <main className="flex-1 overflow-y-auto p-6 text-right">
            
            {/* TAB 1: OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                
                {/* IN-DEPTH METRICS GRID */}
                <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
                  {/* Card 1: Pending */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">⏳</span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-black px-2.5 py-0.5 rounded-full">معلق</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{pendingCount}</p>
                    <h4 className="text-xs font-black text-slate-400">شكاوى قيد الانتظار</h4>
                  </div>

                  {/* Card 2: Faults */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">🛺🛠️</span>
                      <span className="text-[10px] bg-rose-50 text-rose-700 font-black px-2.5 py-0.5 rounded-full">عاجل</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{faultsCount}</p>
                    <h4 className="text-xs font-black text-slate-400">أعطال التوكتوك المبلغ عنها</h4>
                  </div>

                  {/* Card 3: Processing */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">🛠️</span>
                      <span className="text-[10px] bg-blue-50 text-blue-700 font-black px-2.5 py-0.5 rounded-full">جارٍ العمل</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{processingCount}</p>
                    <h4 className="text-xs font-black text-slate-400">تذاكر قيد المعالجة</h4>
                  </div>

                  {/* Card 4: Resolved */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-2xl">✅</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full">تم الحل</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{resolvedCount}</p>
                    <h4 className="text-xs font-black text-slate-400">المشاكل المحلولة</h4>
                  </div>

                  {/* Card 5: City Drivers */}
                  <button
                    onClick={() => setActiveTab('drivers')}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 text-right hover:border-emerald-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl group-hover:scale-110 transition-transform">🛺👤</span>
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 font-black px-2.5 py-0.5 rounded-full">الكباتن</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{driversList.length}</p>
                    <h4 className="text-xs font-black text-slate-400 group-hover:text-emerald-600 transition-colors">كباتن المدينة 🔗</h4>
                  </button>

                  {/* Card 6: Sponsors & Ads */}
                  <button
                    onClick={() => setActiveTab('sponsors')}
                    className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm space-y-2 text-right hover:border-amber-500 hover:shadow-md transition-all cursor-pointer group"
                  >
                    <div className="flex justify-between items-center">
                      <span className="text-2xl group-hover:scale-110 transition-transform">✨📢</span>
                      <span className="text-[10px] bg-amber-50 text-amber-700 font-black px-2.5 py-0.5 rounded-full">الرعاة</span>
                    </div>
                    <p className="text-2xl font-black text-slate-800 font-mono">{adsList.length}</p>
                    <h4 className="text-xs font-black text-slate-400 group-hover:text-amber-600 transition-colors">الإعلانات والممولين 🔗</h4>
                  </button>
                </div>

                {/* GENERAL STATS & REVENUE SHIELD */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* QUICK START TO ACTION */}
                  <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-3xl relative overflow-hidden space-y-4 shadow-lg">
                    <div className="absolute top-0 left-0 w-36 h-36 bg-emerald-500/10 rounded-full blur-3xl" />
                    
                    <div className="space-y-1.5 relative">
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-3 py-1 rounded-full font-bold inline-flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>نظام الدعم الفني الذكي متصل ومستعد</span>
                      </span>
                      <h3 className="text-md font-black">أهلاً بك يا مالك التطبيق في مركز القيادة والتحكم 🛡️</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        من هنا يمكنك السيطرة التامة على التطبيق والعمليات اليومية. تابع شكاوى العملاء لحظر السائقين المخالفين، وحافظ على سلامة الركاب، وقدّم المساعدة للسائقين الذين تواجههم أعطال ميكانيكية في الطرقات لضمان بقائهم في الخدمة.
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-2 relative">
                      <button
                        onClick={() => setActiveTab('tickets')}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                      >
                        إدارة الشكاوى والأعطال الساخنة 🔥
                      </button>
                      <button
                        onClick={() => setActiveTab('rides')}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-100 rounded-xl text-xs font-black transition-all cursor-pointer"
                      >
                        عرض الرحلات المباشرة ومواقعها 🗺️
                      </button>
                      <button
                        onClick={() => setActiveTab('drivers')}
                        className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                      >
                        تحكم وإدارة كباتن المدينة 🛺
                      </button>
                      <button
                        onClick={() => setActiveTab('sponsors')}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black transition-all cursor-pointer shadow-md"
                      >
                        إدارة الإعلانات والرعاة الممولين 📢
                      </button>
                    </div>
                  </div>

                  {/* CUSTOMER SUPPORT COMPACT POLICY */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-3">
                    <h4 className="text-xs font-black text-slate-800 pb-2 border-b">📜 سياسة الأمان والتعامل مع الخلافات</h4>
                    <ul className="space-y-2 text-[10px] text-slate-500 font-bold leading-relaxed">
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 shrink-0">◀</span>
                        <span>**الالتزام بالأجرة:** يتم إنذار الكابتن فوراً إذا ثبت طلبه لأي مبالغ زائدة عن أجرة التطبيق المحددة بالجي بي إس.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 shrink-0">◀</span>
                        <span>**الأعطال الفنية:** السائق معذور في حال تلف الإطارات أو عطل المحرك، نوجه له الصيانة ونعوض الراكب برحلة بديلة.</span>
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-emerald-600 shrink-0">◀</span>
                        <span>**التحقق من الكود (PIN):** يمنع الكابتن من إنهاء الرحلة إلا بإدخال كود الراكب لمنع السرقة والتلاعب بالتسعيرات.</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* EMERGENCY FAULTS LISTING (HIGHLIGHTED) */}
                <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                  <div className="flex justify-between items-center border-b pb-3">
                    <span className="text-[10px] bg-red-50 text-red-600 font-black px-3 py-1 rounded-full">أولوية أولى 🚨</span>
                    <h3 className="text-xs font-black text-slate-800">أعطال عاجلة وحوادث الطرق التي تحتاج تواصل إداري</h3>
                  </div>

                  <div className="space-y-2.5">
                    {complaints.filter(c => c.type === 'fault' && c.status !== 'resolved').length === 0 ? (
                      <p className="text-center py-6 text-xs text-slate-400 font-medium">✅ لا توجد أعطال فنية نشطة حالياً بالطرقات.</p>
                    ) : (
                      complaints.filter(c => c.type === 'fault' && c.status !== 'resolved').map(ticket => (
                        <div
                          key={ticket.id}
                          onClick={() => {
                            setActiveTab('tickets');
                            setSelectedTicket(ticket);
                          }}
                          className="bg-rose-50/50 hover:bg-rose-50 p-4 rounded-2xl border border-rose-100/60 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 cursor-pointer"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-black text-rose-800">{ticket.title}</span>
                              <span className="text-[9px] bg-rose-200 text-rose-800 font-bold px-2 py-0.5 rounded-full">عطل توكتوك 🔧</span>
                            </div>
                            <p className="text-[10px] text-slate-600 line-clamp-1">{ticket.description}</p>
                            <div className="flex items-center gap-3 text-[9px] text-slate-400 pt-1 font-bold">
                              <span>المبلغ: {ticket.senderName} ({ticket.senderRole === 'driver' ? 'سائق' : 'راكب'})</span>
                              <span>•</span>
                              <span>تلفون: {ticket.senderPhone}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            <span className="text-[10px] text-slate-400 font-mono font-bold">{ticket.createdAt}</span>
                            <ChevronLeft className="w-4 h-4 text-slate-400" />
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            )}

            {/* TAB 2: COMPLAINTS & FAULTS TICKETS */}
            {activeTab === 'tickets' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-full items-start">
                
                {/* TICKETS LIST (LEFT/RIGHT COLUMN depending on layout) */}
                <div className={`space-y-4 ${selectedTicket ? 'lg:col-span-5' : 'lg:col-span-12'}`}>
                  
                  {/* SEARCH AND FILTER BAR */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3">
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="البحث باسم الشاكي، العنوان، التلفون..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full text-right py-2.5 pl-4 pr-10 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <Search className="w-4 h-4 text-slate-400 absolute top-3.5 right-3" />
                    </div>

                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {/* Status filters */}
                      <span className="text-[10px] font-black text-slate-400 self-center ml-1">الحالة:</span>
                      <button
                        onClick={() => setStatusFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          statusFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => setStatusFilter('pending')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          statusFilter === 'pending' ? 'bg-amber-500 text-white' : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                        }`}
                      >
                        ⏳ معلق
                      </button>
                      <button
                        onClick={() => setStatusFilter('processing')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          statusFilter === 'processing' ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                        }`}
                      >
                        🛠️ قيد المعالجة
                      </button>
                      <button
                        onClick={() => setStatusFilter('resolved')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          statusFilter === 'resolved' ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                        }`}
                      >
                        ✅ تم الحل
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-1.5 border-t pt-2.5 border-slate-100">
                      {/* Type filters */}
                      <span className="text-[10px] font-black text-slate-400 self-center ml-1">النوع:</span>
                      <button
                        onClick={() => setTypeFilter('all')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          typeFilter === 'all' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        الكل
                      </button>
                      <button
                        onClick={() => setTypeFilter('complaint')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          typeFilter === 'complaint' ? 'bg-rose-600 text-white' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        🛑 شكاوى
                      </button>
                      <button
                        onClick={() => setTypeFilter('fault')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          typeFilter === 'fault' ? 'bg-orange-600 text-white' : 'bg-orange-50 text-orange-700 hover:bg-orange-100'
                        }`}
                      >
                        🔧 أعطال توكتوك
                      </button>
                      <button
                        onClick={() => setTypeFilter('support')}
                        className={`px-2.5 py-1 rounded-lg text-[9px] font-black cursor-pointer ${
                          typeFilter === 'support' ? 'bg-indigo-600 text-white' : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100'
                        }`}
                      >
                        📱 دعم فني
                      </button>
                    </div>
                  </div>

                  {/* COMPLAINTS RENDERED LIST */}
                  <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
                    {filteredTickets.length === 0 ? (
                      <div className="bg-white p-8 text-center rounded-2xl border border-slate-100">
                        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                        <p className="text-xs text-slate-400 font-black">لا توجد شكاوى أو بلاغات مطابقة لبحثك.</p>
                      </div>
                    ) : (
                      filteredTickets.map(ticket => {
                        const isSelected = selectedTicket?.id === ticket.id;
                        return (
                          <div
                            key={ticket.id}
                            onClick={() => setSelectedTicket(ticket)}
                            className={`p-4 rounded-2xl border text-right transition-all cursor-pointer relative overflow-hidden ${
                              isSelected
                                ? 'bg-emerald-50/50 border-emerald-400 shadow-sm'
                                : 'bg-white border-slate-100 hover:border-slate-200'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <span className={`text-[8px] px-2 py-0.5 rounded-full font-black ${
                                ticket.status === 'pending'
                                  ? 'bg-amber-100 text-amber-800'
                                  : ticket.status === 'processing'
                                  ? 'bg-blue-100 text-blue-800 animate-pulse'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}>
                                {ticket.status === 'pending' ? 'قيد الانتظار' : ticket.status === 'processing' ? 'قيد المعالجة' : 'تم الحل ✅'}
                              </span>
                              <span className="text-[10px] text-slate-400 font-mono font-semibold">{ticket.createdAt}</span>
                            </div>

                            <div className="space-y-1 mt-2">
                              <h4 className="text-xs font-black text-slate-800 line-clamp-1">{ticket.title}</h4>
                              <p className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{ticket.description}</p>
                            </div>

                            <div className="flex justify-between items-center border-t border-slate-50/80 pt-2 mt-2.5 text-[9px] font-bold text-slate-400">
                              <div className="flex items-center gap-1.5">
                                <span className="text-xs">
                                  {ticket.senderRole === 'passenger' ? '🙋‍♂️' : '🛺'}
                                </span>
                                <span className="text-slate-600 font-black">{ticket.senderName}</span>
                              </div>
                              <span className={`text-[8px] px-2 py-0.5 rounded-md ${
                                ticket.type === 'complaint'
                                  ? 'bg-rose-50 text-rose-700'
                                  : ticket.type === 'fault'
                                  ? 'bg-orange-50 text-orange-700'
                                  : 'bg-indigo-50 text-indigo-700'
                              }`}>
                                {ticket.type === 'complaint' ? 'شكوى سلوك' : ticket.type === 'fault' ? 'عطل ميكانيكي' : 'دعم تقني'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                </div>

                {/* TICKET DETAILS & SUPPORT ACTION CHAT (RIGHT/LEFT COLUMN) */}
                {selectedTicket && (
                  <div className="lg:col-span-7 bg-white p-5 rounded-3xl border border-slate-100 shadow-md space-y-4 text-right flex flex-col h-[70vh]">
                    
                    {/* Header info */}
                    <div className="flex justify-between items-start border-b pb-3 border-slate-100 shrink-0">
                      <div>
                        <span className={`text-[9px] font-black px-2.5 py-1 rounded-full ${
                          selectedTicket.type === 'complaint'
                            ? 'bg-rose-50 text-rose-700'
                            : selectedTicket.type === 'fault'
                            ? 'bg-orange-50 text-orange-700'
                            : 'bg-indigo-50 text-indigo-700'
                        }`}>
                          {selectedTicket.type === 'complaint' ? '🛑 شكوى راكب/سائق' : selectedTicket.type === 'fault' ? '🔧 بلاغ عطل فني بالطريق' : '📱 استفسار دعم تقني'}
                        </span>
                        <h3 className="text-xs font-black text-slate-800 mt-2 leading-snug">{selectedTicket.title}</h3>
                      </div>
                      
                      <button
                        onClick={() => setSelectedTicket(null)}
                        className="p-1.5 hover:bg-slate-50 rounded-xl text-slate-400 hover:text-slate-600 transition-all cursor-pointer"
                      >
                        إغلاق التفاصيل ×
                      </button>
                    </div>

                    {/* Sender Profile card */}
                    <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 shrink-0 flex justify-between items-center text-xs">
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 bg-slate-200 rounded-full flex items-center justify-center text-md shrink-0">
                          {selectedTicket.senderRole === 'passenger' ? '🙋‍♂️' : '🛺'}
                        </div>
                        <div>
                          <p className="font-black text-slate-800">{selectedTicket.senderName}</p>
                          <p className="text-[9px] text-slate-400 font-mono" dir="ltr">{selectedTicket.senderPhone}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <a
                          href={`tel:${selectedTicket.senderPhone}`}
                          className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl transition-all cursor-pointer border border-emerald-100 flex items-center gap-1"
                          id="owner-call-btn"
                        >
                          <Phone className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black">اتصال تلفوني 📞</span>
                        </a>
                      </div>
                    </div>

                    {/* Ticket description */}
                    <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/60 leading-relaxed shrink-0">
                      <h4 className="text-[10px] font-black text-slate-400 block mb-1">تفاصيل البلاغ والشكوى:</h4>
                      <p className="text-[11px] text-slate-700 font-medium font-sans whitespace-pre-line">{selectedTicket.description}</p>
                    </div>

                    {/* Replies thread */}
                    <div className="flex-1 overflow-y-auto space-y-2 bg-slate-50/30 p-3 rounded-2xl border border-slate-100 border-dashed max-h-[22vh]">
                      <span className="text-[9px] font-black text-slate-400 block mb-1 text-center">سجل الردود والحلول الإدارية</span>
                      {selectedTicket.replies.length === 0 ? (
                        <p className="text-center text-[9px] text-slate-400 py-4">لم يتم إرسال أي ردود على هذه التذكرة بعد.</p>
                      ) : (
                        selectedTicket.replies.map((reply) => {
                          const isOwner = reply.sender === 'owner';
                          return (
                            <div
                              key={reply.id}
                              className={`p-2.5 rounded-xl max-w-[85%] text-xs ${
                                isOwner
                                  ? 'bg-slate-800 text-white mr-auto'
                                  : 'bg-white border border-slate-100 ml-auto text-slate-800 shadow-sm'
                              }`}
                            >
                              <div className="flex justify-between items-center gap-4 border-b border-white/10 pb-1 mb-1">
                                <span className="text-[8px] font-black text-emerald-400">
                                  {isOwner ? 'الدعم الفني (أنت)' : selectedTicket.senderName}
                                </span>
                                <span className="text-[8px] text-slate-400 font-mono">{reply.time}</span>
                              </div>
                              <p className="text-[10px] font-bold leading-relaxed">{reply.text}</p>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Write Response Form */}
                    <form onSubmit={handleSendReply} className="space-y-3 shrink-0 pt-2 border-t">
                      <div className="relative">
                        <textarea
                          placeholder="اكتب رد الدعم الفني أو الإجراء المتخذ هنا..."
                          rows={2}
                          value={replyText}
                          onChange={(e) => setReplyText(e.target.value)}
                          className="w-full text-right py-2 px-3 border border-slate-200 rounded-xl text-[10px] font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                          required
                        />
                      </div>

                      <div className="flex justify-between gap-2 flex-wrap">
                        {/* Change status buttons */}
                        <div className="flex gap-1">
                          {selectedTicket.status !== 'resolved' ? (
                            <button
                              type="button"
                              onClick={() => handleResolveTicket(selectedTicket.id, 'resolved')}
                              className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <CheckSquare className="w-3.5 h-3.5" />
                              <span>حل المشكلة وإغلاق 🔒</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => handleResolveTicket(selectedTicket.id, 'processing')}
                              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl text-[10px] font-black transition-all cursor-pointer flex items-center gap-1"
                            >
                              <Clock className="w-3.5 h-3.5" />
                              <span>إعادة فتح التذكرة 🔓</span>
                            </button>
                          )}
                        </div>

                        <button
                          type="submit"
                          disabled={isSubmittingReply || !replyText.trim()}
                          className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[10px] font-black transition-all cursor-pointer disabled:opacity-40 flex items-center gap-1"
                        >
                          <span>إرسال الرد للعميل</span>
                          <Send className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </form>

                  </div>
                )}

              </div>
            )}

            {/* TAB 3: LIVE RIDES MONITORING */}
            {activeTab === 'rides' && (
              <div className="space-y-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-right">
                    <h3 className="text-xs font-black text-slate-800">مراقبة الـ GPS والرحلات النشطة</h3>
                    <p className="text-[10px] text-slate-400">تابع مسارات التوكتوك في الوقت الفعلي وتأكد من الالتزام المالي لكابتن التوصيلة</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-100/50 text-xs">
                    🚘 إجمالي الرحلات على الخادم: <span className="font-black font-mono">{liveRides.length} رحلة</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {liveRides.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 col-span-full">
                      <MapPin className="w-8 h-8 text-slate-300 mx-auto mb-2 animate-bounce" />
                      <p className="text-xs text-slate-400 font-black">لا توجد رحلات نشطة أو معلنة على الخادم الآن.</p>
                      <p className="text-[10px] text-slate-400 mt-1">قم بإنشاء مشوار من لوحة الراكب لمتابعته هنا فوراً!</p>
                    </div>
                  ) : (
                    liveRides.map(ride => (
                      <div
                        key={ride.id}
                        className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative overflow-hidden"
                      >
                        <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
                        
                        <div className="flex justify-between items-center">
                          <span className="text-[10px] font-mono text-slate-400 font-bold">{ride.id}</span>
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                            ride.status === 'searching'
                              ? 'bg-amber-100 text-amber-800 animate-pulse'
                              : ride.status === 'accepted' || ride.status === 'arrived'
                              ? 'bg-blue-100 text-blue-800'
                              : ride.status === 'started'
                              ? 'bg-indigo-100 text-indigo-800 animate-pulse'
                              : ride.status === 'completed'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-rose-100 text-rose-800'
                          }`}>
                            {ride.status === 'searching' && '🔍 جاري البحث'}
                            {ride.status === 'accepted' && '🤝 تم القبول'}
                            {ride.status === 'arrived' && '🛬 الكابتن وصل'}
                            {ride.status === 'started' && '🏎️ في الطريق'}
                            {ride.status === 'completed' && '✅ تم التوصيل'}
                            {ride.status === 'canceled' && '❌ ملغاة'}
                          </span>
                        </div>

                        <div className="space-y-2 pt-1">
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span className="truncate">من: {ride.pickup.name}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-700 font-bold">
                            <MapPin className="w-3.5 h-3.5 text-rose-500" />
                            <span className="truncate">إلى: {ride.destination.name}</span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-[10px] font-bold">
                          <div>
                            <span className="text-slate-400 block text-[9px]">الراكب:</span>
                            <span className="text-slate-700">{ride.passengerPhone}</span>
                          </div>
                          <div>
                            <span className="text-slate-400 block text-[9px]">الكابتن:</span>
                            <span className="text-slate-700">{ride.driverName || 'لم يقبل أحد بعد'}</span>
                          </div>
                        </div>

                        <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-100">
                          <div className="text-right">
                            <span className="text-[9px] text-slate-400 block font-bold">التسعيرة وطريقة الدفع:</span>
                            <span className="font-black text-slate-800">{ride.fare} ج.م</span>
                            <span className="text-[9px] text-slate-400 font-bold mr-1">({ride.paymentMethod === 'app_wallet' ? 'محفظة' : 'كاش'})</span>
                          </div>

                          <div className="text-left">
                            <span className="text-[9px] text-slate-400 block font-bold">كود أمان التحقق (PIN):</span>
                            <span className="font-mono font-black text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md text-sm border border-emerald-100">
                              {ride.securePin || '----'}
                            </span>
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>

              </div>
            )}

            {/* TAB 4: DRIVERS MANAGEMENT */}
            {activeTab === 'drivers' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-right">
                    <h3 className="text-xs font-black text-slate-800">إدارة كباتن المدينة النشطين والاشتراكات</h3>
                    <p className="text-[10px] text-slate-400">مراجعة بيانات السائقين، تفعيل الاشتراكات المدفوعة، أو حظر المتلاعبين بالأسعار</p>
                  </div>
                  <div className="bg-emerald-50 text-emerald-800 font-bold px-3 py-1.5 rounded-xl border border-emerald-100/50 text-xs">
                    🛺 إجمالي الكباتن المسجلين: <span className="font-black font-mono">{driversList.length} سائق</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {driversList.length === 0 ? (
                    <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 col-span-full">
                      <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs text-slate-400 font-black">لا يوجد سائقين مسجلين حالياً على الخادم.</p>
                    </div>
                  ) : (
                    driversList.map(driver => (
                      <div key={driver.phone} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 text-right relative">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-lg shadow-inner">
                              {driver.vehicleType === 'tuktuk' ? '🛺' : driver.vehicleType === 'motorcycle' ? '🏍️' : '🛵'}
                            </div>
                            <div>
                              <h4 className="text-xs font-black text-slate-800">{driver.name}</h4>
                              <span className="text-[10px] font-mono text-slate-400">{driver.phone}</span>
                            </div>
                          </div>
                          
                          <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full ${
                            driver.status === 'approved'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                              : driver.status === 'blocked'
                              ? 'bg-rose-50 text-rose-700 border border-rose-100 animate-pulse'
                              : 'bg-amber-50 text-amber-700 border border-amber-100'
                          }`}>
                            {driver.status === 'approved' ? '🟢 معتمد ونشط' : driver.status === 'blocked' ? '🔴 محظور من العمل' : '🟡 قيد الانتظار'}
                          </span>
                        </div>

                        {/* Driver credentials & Subscriptions */}
                        <div className="bg-slate-50/50 p-3 rounded-xl border border-slate-100 text-[10px] space-y-1.5 font-bold">
                          <div className="flex justify-between">
                            <span className="text-slate-400">الرقم القومي للتوثيق:</span>
                            <span className="text-slate-700 font-mono">{driver.nationalId}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-400">نوع المركبة بالرخصة:</span>
                            <span className="text-slate-700">
                              {driver.vehicleType === 'tuktuk' ? 'توك توك مرخص' : driver.vehicleType === 'motorcycle' ? 'موتوسيكل توصيل' : 'سكوتر ذكي'}
                            </span>
                          </div>
                          <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                            <span className="text-slate-400">حالة الاشتراك المالي للمطور:</span>
                            <span className={`px-2 py-0.5 rounded text-[9px] font-black ${driver.isPaid ? 'bg-emerald-600 text-white' : 'bg-amber-500 text-white'}`}>
                              {driver.isPaid ? '💳 عضوية سنوية مدفوعة' : `⏱️ تجريبي (متبقي ${driver.trialDaysLeft} يوم)`}
                            </span>
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">
                          {driver.status === 'pending' && (
                            <button
                              onClick={() => handleUpdateDriverStatus(driver.phone, 'approved')}
                              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[9px] font-black transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                            >
                              <span>قبول واعتماد الكابتن ✅</span>
                            </button>
                          )}

                          {driver.status === 'blocked' ? (
                            <button
                              onClick={() => handleUpdateDriverStatus(driver.phone, 'approved')}
                              className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-lg text-[9px] font-black transition-all cursor-pointer"
                            >
                              إلغاء الحظر والاعتماد
                            </button>
                          ) : (
                            <button
                              onClick={() => handleUpdateDriverStatus(driver.phone, 'blocked')}
                              className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-lg text-[9px] font-black transition-all cursor-pointer"
                            >
                              حظر السائق 🛑
                            </button>
                          )}

                          <button
                            onClick={() => handleTogglePaidStatus(driver.phone, !driver.isPaid, driver.isPaid ? 15 : 0)}
                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black border transition-all cursor-pointer ${
                              driver.isPaid
                                ? 'bg-amber-50 border-amber-200 text-amber-800 hover:bg-amber-100'
                                : 'bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700'
                            }`}
                          >
                            {driver.isPaid ? 'تحويل لعضوية تجريبية' : 'تفعيل الاشتراك السنوي المدفوع 💳'}
                          </button>

                          <button
                            onClick={() => handleStartEditDriver(driver)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[9px] font-black transition-all cursor-pointer"
                          >
                            تعديل البيانات ✏️
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 5: SPONSORS & ADVERTISEMENTS */}
            {activeTab === 'sponsors' && (
              <div className="space-y-6 animate-fadeIn text-right">
                
                {/* Header info */}
                <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex flex-col sm:flex-row justify-between items-center gap-3">
                  <div className="text-right">
                    <h3 className="text-xs font-black text-slate-800">إدارة الإعلانات والرعاة الماليين بالمنطقة</h3>
                    <p className="text-[10px] text-slate-400">أضف رعاة محليين (ميكانيكي، محلات قطع غيار، سوبرماركت) لزيادة أرباح التطبيق والتسويق للمشروع</p>
                  </div>
                  <div className="bg-amber-50 text-amber-800 font-bold px-3 py-1.5 rounded-xl border border-amber-100/50 text-xs">
                    ✨ الرعاة النشطين: <span className="font-black font-mono">{adsList.length} جهة</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Create New Ad Form */}
                  <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5 justify-end">
                      <span>إضافة راعي رسمي أو إعلان جديد</span>
                      <Sparkles className="w-4 h-4 text-amber-500 shrink-0" />
                    </h4>

                    <form onSubmit={handleCreateAd} className="space-y-3">
                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500">اسم الجهة الراعية/الشركة</label>
                        <input
                          type="text"
                          required
                          placeholder="مثال: ورشة الفرسان للميكانيكا"
                          value={sponsorName}
                          onChange={(e) => setSponsorName(e.target.value)}
                          className="w-full text-right p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500">عنوان الإعلان الرئيسي</label>
                        <input
                          type="text"
                          required
                          placeholder="خصم خاص ٢٠٪ لجميع السائقين 🛠️"
                          value={adTitle}
                          onChange={(e) => setAdTitle(e.target.value)}
                          className="w-full text-right p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500">منطقة التغطية بالمدينة</label>
                        <input
                          type="text"
                          placeholder="مثال: الجيزة / البحر الأعظم"
                          value={adCity}
                          onChange={(e) => setAdCity(e.target.value)}
                          className="w-full text-right p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500">نص الإعلان الترويجي</label>
                        <textarea
                          required
                          rows={3}
                          placeholder="اكتب تفاصيل العرض الترويجي وكيفية الاستفادة منه بالتفصيل لزيادة التفاعل..."
                          value={adText}
                          onChange={(e) => setAdText(e.target.value)}
                          className="w-full text-right p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="block text-[10px] font-black text-slate-500">رابط الإعلان أو هاتف التواصل (اختياري)</label>
                        <input
                          type="text"
                          placeholder="مثال: https://wa.me/20102345678"
                          value={adLink}
                          onChange={(e) => setAdLink(e.target.value)}
                          className="w-full text-left p-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold font-mono"
                          dir="ltr"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmittingAd}
                        className="w-full py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-[0.98] flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        {isSubmittingAd ? 'جاري النشر...' : 'نشر الإعلان فوراً بالتطبيق 🚀'}
                      </button>
                    </form>
                  </div>

                  {/* Ads List display */}
                  <div className="lg:col-span-2 space-y-4">
                    <h4 className="text-xs font-black text-slate-800">العروض والجهات الراعية المنشورة حالياً بالبرنامج</h4>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {adsList.length === 0 ? (
                        <div className="bg-white p-8 text-center rounded-2xl border border-slate-100 col-span-full">
                          <p className="text-xs text-slate-400 font-bold">لا يوجد أي إعلانات منشورة الآن.</p>
                        </div>
                      ) : (
                        adsList.map(ad => (
                          <div key={ad.id} className={`bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative transition-all ${!ad.isActive ? 'opacity-60 bg-slate-50/50' : ''}`}>
                            <div className="flex justify-between items-start">
                              <span className="text-[8px] font-mono text-slate-400 font-bold">{ad.id}</span>
                              <span className={`text-[9px] font-black px-2 py-0.5 rounded-full ${ad.isActive ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' : 'bg-slate-100 text-slate-600 border border-slate-200'}`}>
                                {ad.isActive ? '🟢 نشط ويظهر للمستخدمين' : '⚪ غير نشط (مخفي)'}
                              </span>
                            </div>

                            <div className="space-y-1">
                              <span className="text-[9px] bg-slate-100 text-slate-600 font-black px-2 py-0.5 rounded-full inline-block">
                                🏬 {ad.sponsorName}
                              </span>
                              <h5 className="text-xs font-black text-slate-950">{ad.title}</h5>
                              <p className="text-[10px] text-slate-500 leading-relaxed font-bold">{ad.text}</p>
                              <span className="text-[9px] text-slate-400 block font-semibold">📍 منطقة التغطية: {ad.city}</span>
                            </div>

                            {/* Actions on Ad */}
                            <div className="flex gap-2 pt-2 border-t border-slate-100 justify-end">
                              <button
                                onClick={() => handleToggleAd(ad.id)}
                                className={`px-2.5 py-1 rounded-md text-[9px] font-black border transition-all cursor-pointer ${
                                  ad.isActive
                                    ? 'bg-slate-50 border-slate-200 text-slate-700'
                                    : 'bg-emerald-50 border-emerald-200 text-emerald-800'
                                }`}
                              >
                                {ad.isActive ? 'إخفاء مؤقت' : 'تفعيل العرض'}
                              </button>
                              <button
                                onClick={() => handleDeleteAd(ad.id)}
                                className="px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-800 border border-rose-200 rounded-md text-[9px] font-black transition-all cursor-pointer"
                              >
                                حذف نهائياً 🗑️
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                  </div>

                </div>

              </div>
            )}

          </main>

        </div>

      </motion.div>

      {/* Edit Driver Modal Overlay */}
      {editingDriver && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 text-right" id="edit-driver-modal" dir="rtl">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
          >
            {/* Modal Header */}
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-2">
                <span>✏️ تعديل بيانات الكابتن:</span>
                <span className="text-emerald-700 font-mono">{editingDriver.phone}</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingDriver(null)}
                className="w-8 h-8 rounded-full hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all cursor-pointer text-sm font-bold animate-fadeIn"
              >
                ✕
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveDriverDetails} className="p-6 overflow-y-auto space-y-4 flex-1">
              {/* Name field */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-600">الاسم الكامل للسائق</label>
                <input
                  type="text"
                  required
                  value={editDriverName}
                  onChange={(e) => setEditDriverName(e.target.value)}
                  className="w-full text-right p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                />
              </div>

              {/* National ID field */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-600">الرقم القومي (١٤ رقم بالكامل)</label>
                <input
                  type="text"
                  value={editDriverNationalId}
                  onChange={(e) => setEditDriverNationalId(e.target.value)}
                  className="w-full text-right font-mono p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                />
              </div>

              {/* Password PIN field */}
              <div className="space-y-1">
                <label className="block text-xs font-black text-slate-600">الرقم السري الخاص بالدخول (PIN)</label>
                <input
                  type="text"
                  placeholder="إذا أردت تغييره للكابتن"
                  value={editDriverPassword}
                  onChange={(e) => setEditDriverPassword(e.target.value)}
                  className="w-full text-left font-mono p-2.5 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-bold"
                  dir="ltr"
                />
              </div>

              {/* Vehicle Type Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-600">نوع المركبة</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDriverVehicle('tuktuk')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverVehicle === 'tuktuk'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-sm">🛺</div>
                    <div className="text-[10px]">توك توك</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDriverVehicle('motorcycle')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverVehicle === 'motorcycle'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-sm">🏍️</div>
                    <div className="text-[10px]">موتوسيكل</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDriverVehicle('scooter')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverVehicle === 'scooter'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-sm">🛵</div>
                    <div className="text-[10px]">سكوتر</div>
                  </button>
                </div>
              </div>

              {/* Account Status Selection */}
              <div className="space-y-1.5">
                <label className="block text-xs font-black text-slate-600">حالة اعتماد الحساب</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setEditDriverStatus('approved')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverStatus === 'approved'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] font-black">🟢 معتمد</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDriverStatus('pending')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverStatus === 'pending'
                        ? 'border-amber-500 bg-amber-50 text-amber-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] font-black">🟡 الانتظار</div>
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditDriverStatus('blocked')}
                    className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                      editDriverStatus === 'blocked'
                        ? 'border-rose-500 bg-rose-50 text-rose-950 font-black'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    <div className="text-[10px] font-black">🛑 محظور</div>
                  </button>
                </div>
              </div>

              {/* Financial Membership Info */}
              <div className="p-4 bg-slate-50 border border-slate-100 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-black text-slate-700 flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={editDriverIsPaid}
                      onChange={(e) => setEditDriverIsPaid(e.target.checked)}
                      className="w-4 h-4 text-emerald-600 accent-emerald-600"
                    />
                    <span>عضوية مدفوعة نشطة (سارية المفعول) 💳</span>
                  </label>
                </div>

                {!editDriverIsPaid && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold text-slate-500">أيام الفترة التجريبية المتبقية للكابتن</label>
                    <input
                      type="number"
                      min={0}
                      max={365}
                      value={editDriverTrialDays}
                      onChange={(e) => setEditDriverTrialDays(Number(e.target.value))}
                      className="w-full text-right p-2 border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={isSavingDriver}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-black shadow-md shadow-emerald-500/10 transition-all active:scale-[0.98] cursor-pointer"
                >
                  {isSavingDriver ? 'جاري حفظ التعديلات...' : 'حفظ التعديلات فوراً 💾'}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingDriver(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-black transition-all cursor-pointer"
                >
                  إلغاء التعديل
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
