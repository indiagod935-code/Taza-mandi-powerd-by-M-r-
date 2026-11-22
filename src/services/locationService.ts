/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Location & Reverse Geocode Business Service
 * Captures device GPS with high-accuracy -> network fallback, then resolves human-readable
 * building/street/city/pincode strictly via server-side /api/geocode/reverse.
 */
import { geocodeApi } from '../api/endpoints';
import { ENV_CONFIG } from '../config/env';

export interface ResolvedLocationResult {
  lat: number;
  lng: number;
  society: string;
  roadOrStreet: string;
  area: string;
  city: string;
  pincode: string;
  fullAddress: string;
  provider: string;
  accuracyMeters?: number;
}

function requestBrowserPosition(highAccuracy: boolean, timeoutMs: number): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      reject(new Error('GPS_UNSUPPORTED'));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: highAccuracy,
      timeout: timeoutMs,
      maximumAge: highAccuracy ? 15_000 : 120_000,
    });
  });
}

export const locationService = {
  async detectAndReverseGeocode(): Promise<ResolvedLocationResult> {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      throw new Error('GPS_UNSUPPORTED');
    }

    let pos: GeolocationPosition;
    try {
      pos = await requestBrowserPosition(true, 9000);
    } catch (firstErr: any) {
      // Permission explicitly denied -> do not retry
      if (firstErr?.code === 1) {
        throw new Error('PERMISSION_DENIED');
      }
      // Retry quickly using Wi-Fi / cell network location
      try {
        pos = await requestBrowserPosition(false, 9000);
      } catch (secondErr: any) {
        if (secondErr?.code === 1) throw new Error('PERMISSION_DENIED');
        throw new Error('POSITION_UNAVAILABLE');
      }
    }

    const lat = Number(pos.coords.latitude.toFixed(6));
    const lng = Number(pos.coords.longitude.toFixed(6));

    try {
      const geo = await geocodeApi.reverse(lat, lng);
      const roadCombined = [geo.roadOrStreet, geo.area !== geo.roadOrStreet ? geo.area : '', geo.city, geo.pincode]
        .filter(Boolean)
        .join(', ');
      return {
        lat,
        lng,
        society: geo.society || geo.area || geo.city || '',
        roadOrStreet: geo.roadOrStreet || roadCombined || '',
        area: geo.area || '',
        city: geo.city || '',
        pincode: geo.pincode || '',
        fullAddress: geo.fullAddress || `Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`,
        provider: geo.provider || 'reverse-geocode',
        accuracyMeters: Math.round(pos.coords.accuracy || 0),
      };
    } catch {
      // Clean coordinate fallback only if reverse geocode server unreachable
      return {
        lat,
        lng,
        society: '',
        roadOrStreet: '',
        area: '',
        city: '',
        pincode: '',
        fullAddress: `GPS Coordinates: ${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        provider: 'coordinates-only',
        accuracyMeters: Math.round(pos.coords.accuracy || 0),
      };
    }
  },

  getDefaultMandiCoordinates() {
    return ENV_CONFIG.DEFAULT_MANDI_COORDS;
  },
};
