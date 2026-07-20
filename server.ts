/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

interface LocationItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface ChatMessage {
  id: string;
  sender: 'passenger' | 'driver';
  text: string;
  time: string;
}

interface Ride {
  id: string;
  passengerPhone: string;
  driverPhone: string | null;
  pickup: LocationItem;
  destination: LocationItem;
  distance: number;
  duration: number;
  fare: number;
  rideType: 'economy' | 'vip' | 'delivery';
  promoCode?: string;
  discount?: number;
  status: 'searching' | 'accepted' | 'arrived' | 'started' | 'completed' | 'canceled';
  chatMessages: ChatMessage[];
  driverName?: string;
  driverVehicle?: string;
  driverRating?: number;
  driverAvatar?: string;
  paymentMethod?: 'cash' | 'app_wallet';
  securePin?: string;
  isPaid?: boolean;
}

interface Complaint {
  id: string;
  type: 'complaint' | 'fault' | 'support'; // complaint = شكوى, fault = عطل توكتوك, support = دعم فني
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

// In-memory data store for live multi-client operations
const rides: Map<string, Ride> = new Map();

interface DriverProfile {
  phone: string;
  name: string;
  passwordPin: string;
  nationalId: string;
  vehicleType: 'tuktuk' | 'motorcycle' | 'scooter';
  personalPhoto: string | null;
  nationalIdPhoto: string | null;
  tukTukBackPhoto: string | null;
  status: 'pending' | 'approved' | 'blocked';
  isOnline: boolean;
  isPaid: boolean;
  trialDaysLeft: number;
}

interface PassengerProfile {
  phone: string;
  name: string;
  passwordPin: string;
  status: 'active' | 'blocked';
}

interface SponsorAd {
  id: string;
  title: string;
  sponsorName: string;
  imageUrl?: string;
  linkUrl?: string;
  text: string;
  isActive: boolean;
  city: string;
}

const drivers: Map<string, DriverProfile> = new Map();
const passengers: Map<string, PassengerProfile> = new Map();
const ads: SponsorAd[] = [
  {
    id: 'ad-1',
    title: 'سوبر ماركت الفايد - خدمة التوصيل السريع مجاناً 🛒',
    sponsorName: 'هايبر ماركت الفايد',
    text: 'اطلب جميع مستلزمات منزلك من سوبر ماركت الفايد لتصلك إلى باب البيت مع كباتن توصيلة بخصم خاص للعملاء النشطين ومجاناً للطلبات فوق ١٠٠ ج.م!',
    isActive: true,
    city: 'الجيزة / البحر الأعظم'
  },
  {
    id: 'ad-2',
    title: 'ورشة الفرسان المعتمدة لقطع غيار التوك توك والصيانة 🛺🔧',
    sponsorName: 'مركز الفرسان الميكانيكي',
    text: 'لكل كباتن توصيلة! خصم ٢٠٪ على تغيير زيت المحرك وصيانة الموتور وقطع الغيار الأصلية مع إمكانية الدفع بالتقسيط أو عبر محفظة التطبيق!',
    isActive: true,
    city: 'وسط البلد / المنيل'
  }
];

// Seed some initial accounts
drivers.set('01099887766', {
  phone: '01099887766',
  name: 'كابتن أبو أنس الجدع',
  passwordPin: '1234',
  nationalId: '29505122401234',
  vehicleType: 'tuktuk',
  personalPhoto: 'mock_personal',
  nationalIdPhoto: 'mock_national_id',
  tukTukBackPhoto: 'mock_tuktuk_back',
  status: 'approved',
  isOnline: true,
  isPaid: true,
  trialDaysLeft: 0
});

passengers.set('01223344551', {
  phone: '01223344551',
  name: 'محمد أحمد عاشور',
  passwordPin: '1234',
  status: 'active'
});

// Seeded complaints for the owner panel
const complaints: Complaint[] = [
  {
    id: 'ticket-1',
    type: 'complaint',
    senderRole: 'passenger',
    senderPhone: '01223344551',
    senderName: 'محمد أحمد عاشور',
    title: 'الكابتن طلب مبلغ إضافي عن تسعيرة التطبيق',
    description: 'المشوار كان محدد بـ 15 جنيهاً، ولكن الكابتن أصر على أخذ 20 جنيهاً بحجة زحمة الطريق ومطبات الشارع.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 2).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' اليوم',
    replies: []
  },
  {
    id: 'ticket-2',
    type: 'fault',
    senderRole: 'driver',
    senderPhone: '01099887766',
    senderName: 'كابتن أبو أنس الجدع',
    title: 'عطل مفاجئ في المحرك بشارع البحر الأعظم',
    description: 'أنا واقف حالياً بجوار مسجد الاستقامة، التوكتوك توقف فجأة عن العمل ويبدو أنها مشكلة في طلمبة البنزين. أرجو إرسال فريق الصيانة والدعم.',
    status: 'processing',
    createdAt: new Date(Date.now() - 3600000 * 4).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' اليوم',
    replies: [
      {
        id: 'rep-1',
        sender: 'owner',
        text: 'تم التواصل مع ورشة الصيانة المعتمدة الأقرب إليك وجارٍ إرسال فني للموقع فوراً.',
        time: 'منذ ساعتين'
      }
    ]
  },
  {
    id: 'ticket-3',
    type: 'support',
    senderRole: 'passenger',
    senderPhone: '01155667788',
    senderName: 'أمل محمود السويفي',
    title: 'واجهت مشكلة أثناء الدفع عبر المحفظة',
    description: 'حاولت الدفع بقيمة المشوار البالغ 12 جنيهاً عبر رصيد المحفظة ولكن ظهر لي خطأ بالاتصال، وتم خصم المبلغ مرتين. أرجو مراجعة الحساب.',
    status: 'pending',
    createdAt: new Date(Date.now() - 3600000 * 6).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' اليوم',
    replies: []
  },
  {
    id: 'ticket-4',
    type: 'complaint',
    senderRole: 'driver',
    senderPhone: '01511223344',
    senderName: 'كابتن جابر أبو سريع',
    title: 'الراكب ألغى الرحلة بعد الوصول إليه',
    description: 'ذهبت لموقع الركوب المحدد ووقفت لمدة 7 دقائق، وتواصلت مع الراكب ثم قام بإلغاء الرحلة دون سبب مما تسبب في ضياع الوقت والوقود.',
    status: 'resolved',
    createdAt: 'أمس الساعة 09:15 م',
    replies: [
      {
        id: 'rep-2',
        sender: 'owner',
        text: 'تم تعويضك بقيمة 5 جنيهات مصاريف انتقال في رصيد محفظتك، وتم توجيه إنذار للراكب بضرورة الالتزام.',
        time: 'أمس الساعة 10:00 م'
      }
    ]
  }
];

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware for parsing JSON requests (with custom limits for base64 driver document photos)
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // --- AUTHENTICATION & REGISTRATION ENDPOINTS ---

  // Register a new user (passenger or driver) with password
  app.post('/api/auth/register', (req, res) => {
    try {
      const { phone, password, name, role, nationalId, vehicleType, personalPhoto, nationalIdPhoto, tukTukBackPhoto } = req.body;
      if (!phone || !password || !name || !role) {
        return res.status(400).json({ error: 'جميع الحقول الأساسية مطلوبة' });
      }
      
      const cleanPhone = String(phone).trim();
      const cleanPassword = String(password);
      const cleanName = String(name).trim();
      const cleanRole = String(role);

      if (cleanRole === 'driver') {
        if (drivers.has(cleanPhone)) {
          return res.status(400).json({ error: 'هذا الرقم مسجل بالفعل ككابتن' });
        }
        const cleanVehicle = (vehicleType === 'motorcycle' || vehicleType === 'scooter') ? vehicleType : 'tuktuk';
        const cleanNationalId = nationalId ? String(nationalId).trim() : '29505122401234';
        const newDriver: DriverProfile = {
          phone: cleanPhone,
          name: cleanName,
          passwordPin: cleanPassword,
          nationalId: cleanNationalId,
          vehicleType: cleanVehicle,
          personalPhoto: personalPhoto || 'mock_personal',
          nationalIdPhoto: nationalIdPhoto || 'mock_national_id',
          tukTukBackPhoto: tukTukBackPhoto || 'mock_tuktuk_back',
          status: 'approved', // Auto approved for smooth operational testing
          isOnline: false,
          isPaid: false,
          trialDaysLeft: 15
        };
        drivers.set(cleanPhone, newDriver);
        console.log(`[Driver Registered] Phone: ${cleanPhone}, Name: ${newDriver.name}`);
        return res.json({ success: true, role: 'driver', user: newDriver });
      } else {
        if (passengers.has(cleanPhone)) {
          return res.status(400).json({ error: 'هذا الرقم مسجل بالفعل كراكب' });
        }
        const newPassenger: PassengerProfile = {
          phone: cleanPhone,
          name: cleanName,
          passwordPin: cleanPassword,
          status: 'active'
        };
        passengers.set(cleanPhone, newPassenger);
        console.log(`[Passenger Registered] Phone: ${cleanPhone}, Name: ${newPassenger.name}`);
        return res.json({ success: true, role: 'passenger', user: newPassenger });
      }
    } catch (err: any) {
      console.error('Error in /api/auth/register:', err);
      return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم أثناء معالجة التسجيل: ' + err.message });
    }
  });

  // Login a user with password
  app.post('/api/auth/login', (req, res) => {
    try {
      const { phone, password, role } = req.body;
      if (!phone || !password || !role) {
        return res.status(400).json({ error: 'الرقم السري ورقم الهاتف مطلوبان' });
      }

      const cleanPhone = String(phone).trim();
      const cleanPassword = String(password);
      const cleanRole = String(role);

      if (cleanRole === 'driver') {
        const driver = drivers.get(cleanPhone);
        if (!driver) {
          return res.status(404).json({ error: 'عذراً، هذا الرقم غير مسجل ككابتن' });
        }
        if (driver.passwordPin !== cleanPassword) {
          return res.status(400).json({ error: 'الرقم السري غير صحيح، يرجى المحاولة مرة أخرى' });
        }
        if (driver.status === 'blocked') {
          return res.status(403).json({ error: 'تم حظر حسابك من قبل الإدارة، يرجى التواصل مع الدعم الفني' });
        }
        return res.json({ success: true, role: 'driver', user: driver });
      } else {
        const passenger = passengers.get(cleanPhone);
        if (!passenger) {
          return res.status(404).json({ error: 'عذراً، هذا الرقم غير مسجل كراكب' });
        }
        if (passenger.passwordPin !== cleanPassword) {
          return res.status(400).json({ error: 'الرقم السري غير صحيح، يرجى المحاولة مرة أخرى' });
        }
        if (passenger.status === 'blocked') {
          return res.status(403).json({ error: 'تم حظر حسابك من قبل الإدارة' });
        }
        return res.json({ success: true, role: 'passenger', user: passenger });
      }
    } catch (err: any) {
      console.error('Error in /api/auth/login:', err);
      return res.status(500).json({ error: 'حدث خطأ داخلي في الخادم أثناء معالجة تسجيل الدخول: ' + err.message });
    }
  });

  // --- DRIVERS MANAGEMENT ENDPOINTS ---

  // Get all registered drivers
  app.get('/api/drivers', (req, res) => {
    res.json(Array.from(drivers.values()));
  });

  // Update a driver's status (approved, blocked, pending)
  app.post('/api/drivers/update-status', (req, res) => {
    const { phone, status } = req.body;
    const driver = drivers.get(phone);
    if (!driver) {
      return res.status(404).json({ error: 'الكابتن غير موجود' });
    }
    driver.status = status;
    console.log(`[Driver Status Updated] Phone: ${phone} to: ${status}`);
    res.json({ success: true, driver });
  });

  // Toggle a driver's subscription paid status
  app.post('/api/drivers/toggle-paid', (req, res) => {
    const { phone, isPaid, trialDaysLeft } = req.body;
    const driver = drivers.get(phone);
    if (!driver) {
      return res.status(404).json({ error: 'الكابتن غير موجود' });
    }
    if (isPaid !== undefined) {
      driver.isPaid = isPaid;
    }
    if (trialDaysLeft !== undefined) {
      driver.trialDaysLeft = trialDaysLeft;
    }
    console.log(`[Driver Subscription Updated] Phone: ${phone}, Paid: ${isPaid}, Trial Days: ${trialDaysLeft}`);
    res.json({ success: true, driver });
  });

  // Update/Edit a driver's full profile details
  app.post('/api/drivers/update', (req, res) => {
    try {
      const { phone, name, nationalId, vehicleType, status, isPaid, trialDaysLeft, passwordPin } = req.body;
      const driver = drivers.get(phone);
      if (!driver) {
        return res.status(404).json({ error: 'الكابتن غير موجود' });
      }
      
      if (name !== undefined) driver.name = String(name).trim();
      if (nationalId !== undefined) driver.nationalId = String(nationalId).trim();
      if (vehicleType !== undefined && (vehicleType === 'tuktuk' || vehicleType === 'motorcycle' || vehicleType === 'scooter')) {
        driver.vehicleType = vehicleType;
      }
      if (status !== undefined) driver.status = status;
      if (isPaid !== undefined) driver.isPaid = !!isPaid;
      if (trialDaysLeft !== undefined) driver.trialDaysLeft = Number(trialDaysLeft);
      if (passwordPin !== undefined) driver.passwordPin = String(passwordPin);

      console.log(`[Driver Updated by Owner] Phone: ${phone}, Name: ${driver.name}, Status: ${driver.status}`);
      res.json({ success: true, driver });
    } catch (err: any) {
      console.error('Error in /api/drivers/update:', err);
      res.status(500).json({ error: 'حدث خطأ أثناء تحديث بيانات السائق: ' + err.message });
    }
  });

  // --- SPONSORSHIP & ADVERTISEMENTS ENDPOINTS ---

  // Get all sponsor advertisements
  app.get('/api/ads', (req, res) => {
    res.json(ads);
  });

  // Create a new sponsor advertisement
  app.post('/api/ads/create', (req, res) => {
    const { title, sponsorName, text, city, linkUrl } = req.body;
    if (!title || !sponsorName || !text) {
      return res.status(400).json({ error: 'يرجى إدخال جميع الحقول الأساسية للإعلان' });
    }
    const newAd: SponsorAd = {
      id: 'ad-' + Date.now(),
      title: title.trim(),
      sponsorName: sponsorName.trim(),
      text: text.trim(),
      city: city ? city.trim() : 'جميع المناطق',
      linkUrl: linkUrl ? linkUrl.trim() : '',
      isActive: true
    };
    ads.unshift(newAd);
    console.log(`[Ad Created] ID: ${newAd.id}, Sponsor: ${sponsorName}`);
    res.json({ success: true, ad: newAd });
  });

  // Toggle active status of an advertisement
  app.post('/api/ads/toggle', (req, res) => {
    const { id } = req.body;
    const ad = ads.find(a => a.id === id);
    if (!ad) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    ad.isActive = !ad.isActive;
    console.log(`[Ad Toggle] ID: ${id}, New Active Status: ${ad.isActive}`);
    res.json({ success: true, ad });
  });

  // Delete an advertisement
  app.post('/api/ads/delete', (req, res) => {
    const { id } = req.body;
    const idx = ads.findIndex(a => a.id === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'الإعلان غير موجود' });
    }
    ads.splice(idx, 1);
    console.log(`[Ad Deleted] ID: ${id}`);
    res.json({ success: true });
  });


  // --- API ENDPOINTS ---

  // Create a new ride request (from Passenger)
  app.post('/api/rides/create', (req, res) => {
    const { passengerPhone, pickup, destination, distance, duration, fare, rideType, promoCode, discount, paymentMethod } = req.body;

    if (!passengerPhone || !pickup || !destination) {
      return res.status(400).json({ error: 'Missing required ride details' });
    }

    // Cancel any existing pending/active rides for this passenger first
    for (const [rideId, ride] of rides.entries()) {
      if (ride.passengerPhone === passengerPhone && (ride.status !== 'completed' && ride.status !== 'canceled')) {
        ride.status = 'canceled';
      }
    }

    const securePin = Math.floor(1000 + Math.random() * 9000).toString();
    const rideId = 'ride-' + Date.now();
    const newRide: Ride = {
      id: rideId,
      passengerPhone,
      driverPhone: null,
      pickup,
      destination,
      distance,
      duration,
      fare,
      rideType,
      promoCode,
      discount,
      status: 'searching',
      chatMessages: [],
      paymentMethod: paymentMethod || 'cash',
      securePin,
      isPaid: false
    };

    rides.set(rideId, newRide);
    console.log(`[Ride Created] ID: ${rideId}, Passenger: ${passengerPhone}, Payment: ${paymentMethod}, PIN: ${securePin}`);
    res.json(newRide);
  });

  // Get active ride for a passenger or a driver
  app.get('/api/rides/active', (req, res) => {
    const { phone, role } = req.query;

    if (!phone) {
      return res.status(400).json({ error: 'Phone is required' });
    }

    // Find any active ride involving this phone number
    let activeRide: Ride | null = null;
    for (const ride of rides.values()) {
      if (ride.status === 'completed' || ride.status === 'canceled') {
        continue;
      }

      if (role === 'passenger' && ride.passengerPhone === phone) {
        activeRide = ride;
        break;
      } else if (role === 'driver' && ride.driverPhone === phone) {
        activeRide = ride;
        break;
      }
    }

    if (activeRide) {
      res.json(activeRide);
    } else {
      res.json({ status: 'none' });
    }
  });

  // Cancel ride request
  app.post('/api/rides/cancel', (req, res) => {
    const { rideId } = req.body;
    const ride = rides.get(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    ride.status = 'canceled';
    console.log(`[Ride Canceled] ID: ${rideId}`);
    res.json(ride);
  });

  // Get all available nearby ride requests (for Drivers)
  app.get('/api/rides/nearby', (req, res) => {
    const availableRides = Array.from(rides.values()).filter(
      (ride) => ride.status === 'searching' && !ride.driverPhone
    );
    res.json(availableRides);
  });

  // Accept a ride request (by Driver)
  app.post('/api/rides/accept', (req, res) => {
    const { rideId, driverPhone, driverName, driverVehicle, driverRating, driverAvatar } = req.body;
    const ride = rides.get(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (ride.status !== 'searching' || ride.driverPhone) {
      return res.status(400).json({ error: 'Ride is already accepted or no longer available' });
    }

    ride.driverPhone = driverPhone;
    ride.status = 'accepted';
    ride.driverName = driverName || 'أبو أنس الجدع';
    ride.driverVehicle = driverVehicle || 'توك توك الـجـوكـر (لوحة: م ص ر ٢٨٤)';
    ride.driverRating = driverRating || 4.9;
    ride.driverAvatar = driverAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80';

    console.log(`[Ride Accepted] ID: ${rideId} by Driver: ${driverPhone}`);
    res.json(ride);
  });

  // Update ride status (accepted -> arrived -> started -> completed)
  app.post('/api/rides/update-status', (req, res) => {
    const { rideId, status, pin } = req.body;
    const ride = rides.get(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    if (status === 'completed') {
      if (ride.securePin && ride.securePin !== pin) {
        return res.status(400).json({ error: 'wrong_pin' });
      }
      ride.isPaid = true;
    }

    ride.status = status;
    console.log(`[Ride Status Updated] ID: ${rideId} to: ${status}`);
    res.json(ride);
  });

  // Send a chat message
  app.post('/api/rides/chat/send', (req, res) => {
    const { rideId, sender, text } = req.body;
    const ride = rides.get(rideId);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });

    const msg: ChatMessage = {
      id: 'msg-' + Date.now(),
      sender,
      text,
      time: timeStr
    };

    ride.chatMessages.push(msg);
    res.json(msg);
  });

  // Get messages for a ride
  app.get('/api/rides/chat/messages', (req, res) => {
    const { rideId } = req.query;
    const ride = rides.get(rideId as string);

    if (!ride) {
      return res.status(404).json({ error: 'Ride not found' });
    }

    res.json(ride.chatMessages);
  });

  // --- OWNER DASHBOARD ENDPOINTS ---
  
  // Get all rides (live and past)
  app.get('/api/owner/rides', (req, res) => {
    res.json(Array.from(rides.values()));
  });

  // Get all complaints/tickets
  app.get('/api/owner/complaints', (req, res) => {
    res.json(complaints);
  });

  // Create a new complaint/ticket
  app.post('/api/owner/complaints/create', (req, res) => {
    const { type, senderRole, senderPhone, senderName, title, description } = req.body;
    
    if (!title || !description || !senderName || !senderPhone) {
      return res.status(400).json({ error: 'Missing required ticket details' });
    }

    const newTicket: Complaint = {
      id: 'ticket-' + Date.now(),
      type: type || 'complaint',
      senderRole: senderRole || 'passenger',
      senderPhone,
      senderName,
      title,
      description,
      status: 'pending',
      createdAt: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }) + ' اليوم',
      replies: []
    };

    complaints.unshift(newTicket);
    console.log(`[Owner Ticket Created] ID: ${newTicket.id}, Name: ${senderName}`);
    res.json(newTicket);
  });

  // Reply to a complaint/ticket as Owner/Support
  app.post('/api/owner/complaints/reply', (req, res) => {
    const { ticketId, text, sender } = req.body;
    const ticket = complaints.find((c) => c.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    const reply = {
      id: 'rep-' + Date.now(),
      sender: sender || 'owner',
      text,
      time: 'الآن'
    };

    ticket.replies.push(reply);
    
    // Automatically change status to processing if replied by owner
    if (sender === 'owner' && ticket.status === 'pending') {
      ticket.status = 'processing';
    }

    console.log(`[Owner Ticket Reply] ID: ${ticketId}, Sender: ${sender}`);
    res.json(ticket);
  });

  // Change complaint/ticket status (e.g., resolve)
  app.post('/api/owner/complaints/resolve', (req, res) => {
    const { ticketId, status } = req.body;
    const ticket = complaints.find((c) => c.id === ticketId);

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket not found' });
    }

    ticket.status = status || 'resolved';
    console.log(`[Owner Ticket Status] ID: ${ticketId} to: ${ticket.status}`);
    res.json(ticket);
  });

  // Health check endpoint
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', activeRidesCount: rides.size });
  });

  // --- VITE MIDDLEWARE SETUP ---

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Tawseela Server] Running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
