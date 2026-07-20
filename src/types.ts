/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type UserRole = 'passenger' | 'driver' | 'owner';

export type AppState = 'splash' | 'login' | 'passenger_home' | 'driver_home' | 'owner_home';

export type PassengerStep = 'home' | 'searching' | 'trip_active' | 'rating';

export type DriverStep = 'idle' | 'incoming' | 'on_trip' | 'earnings';

export interface LocationItem {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

export interface CaptainProfile {
  name: string;
  avatar: string;
  rating: number;
  vehicleNumber: string;
  phone: string;
}

export interface TripData {
  pickup: LocationItem;
  destination: LocationItem;
  distance: number; // in km
  duration: number; // in mins
  fare: number; // in EGP
  rideType: 'economy' | 'vip' | 'delivery';
  captain: CaptainProfile;
  promoCode?: string;
  discount?: number;
}

export interface ChatMessage {
  id: string;
  sender: 'passenger' | 'driver';
  text: string;
  time: string;
}

export interface EarningRecord {
  id: string;
  passengerName: string;
  pickup: string;
  destination: string;
  fare: number;
  time: string;
  status: 'completed' | 'canceled';
}
