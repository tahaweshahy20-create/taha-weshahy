/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { LocationItem, CaptainProfile, EarningRecord } from './types';

export const POPULAR_LOCATIONS: LocationItem[] = [
  { id: '1', name: 'الوقف (المركز)', lat: 26.0285, lng: 32.5120 },
  { id: '2', name: 'السنابسة', lat: 26.0350, lng: 32.5080 },
  { id: '3', name: 'البهايجة', lat: 26.0220, lng: 32.5150 },
  { id: '4', name: 'الدندراوية', lat: 26.0420, lng: 32.4950 },
  { id: '5', name: 'المداكير', lat: 26.0150, lng: 32.5250 },
  { id: '6', name: 'الرنان', lat: 26.0380, lng: 32.5200 },
  { id: '7', name: 'جبل العماير', lat: 26.0500, lng: 32.4800 },
  { id: '8', name: 'الخمسين', lat: 26.0270, lng: 32.5350 },
  { id: '9', name: 'جبل السنابسة', lat: 26.0450, lng: 32.4700 },
  { id: '10', name: 'الوشاحية', lat: 26.0100, lng: 32.5400 },
  { id: '11', name: 'المراشدة', lat: 26.0650, lng: 32.4600 },
  { id: '12', name: 'القلمينا', lat: 25.9980, lng: 32.5550 },
  { id: '13', name: 'المشوشة', lat: 26.0550, lng: 32.5020 },
  { id: '14', name: 'رنة', lat: 26.0310, lng: 32.5280 },
  { id: '15', name: 'العرب والنجاجرة', lat: 26.0250, lng: 32.4900 },
  { id: '16', name: 'المنشية', lat: 26.0330, lng: 32.5180 },
  { id: '17', name: 'المعادي', lat: 26.0180, lng: 32.5050 },
  { id: '18', name: 'المستشفى المركزي', lat: 26.0305, lng: 32.5135 },
  { id: '19', name: 'وحدة المطافي', lat: 26.0290, lng: 32.5110 }
];

export const CAPTAINS: CaptainProfile[] = [
  {
    name: 'محمد عاشور (البرنس)',
    avatar: '👨‍✈️',
    rating: 4.9,
    vehicleNumber: 'ط ا ج ٩٨٣',
    phone: '+20 100 234 5678'
  },
  {
    name: 'سيد التوربيني',
    avatar: '🛺',
    rating: 4.8,
    vehicleNumber: 'د ر ل ٥٦٤',
    phone: '+20 111 876 5432'
  },
  {
    name: 'أبو أنس الجدع',
    avatar: '🧔',
    rating: 4.7,
    vehicleNumber: 'س ص ع ١٤٢',
    phone: '+20 122 345 6789'
  }
];

export const MOCK_EARNINGS: EarningRecord[] = [
  {
    id: 'TX-1004',
    passengerName: 'أحمد علي',
    pickup: 'السنابسة',
    destination: 'الوقف (المركز)',
    fare: 15,
    time: '10:15 ص',
    status: 'completed'
  },
  {
    id: 'TX-1003',
    passengerName: 'منى السيد',
    pickup: 'المستشفى المركزي',
    destination: 'المراشدة',
    fare: 25,
    time: '09:40 ص',
    status: 'completed'
  },
  {
    id: 'TX-1002',
    passengerName: 'محمود حسن',
    pickup: 'القلمينا',
    destination: 'العرب والنجاجرة',
    fare: 35,
    time: '08:10 ص',
    status: 'completed'
  },
  {
    id: 'TX-1001',
    passengerName: 'كريم خالد',
    pickup: 'وحدة المطافي',
    destination: 'المنشية',
    fare: 10,
    time: '07:30 ص',
    status: 'completed'
  }
];

export const DRIVER_DOCUMENTS = [
  {
    id: 'national_id',
    title: 'صورة بطاقة الرقم القومي',
    desc: 'صورة واضحة للوجهين والبطاقة سارية',
    required: true
  },
  {
    id: 'driver_license',
    title: 'صورة رخصة القيادة والتوك توك',
    desc: 'رخصة مهنية أو خاصة سارية المفعول',
    required: true
  },
  {
    id: 'vehicle_photo',
    title: 'صورة التوك توك حديثة واضحة',
    desc: 'صورة من الأمام تظهر لوحة الأرقام إن وجدت',
    required: false
  }
];
