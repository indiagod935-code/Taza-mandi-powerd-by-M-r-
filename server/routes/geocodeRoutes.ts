/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Server-side Reverse Geocoding Router
 * Calls Google Geocoding API (if key configured server-side) -> OpenStreetMap Nominatim -> BigDataCloud.
 * Keeps keys strictly on the server; client calls GET /api/geocode/reverse?lat=...&lng=...
 */
import { Router } from 'express';
import { SERVER_ENV } from '../config/env.ts';
import { ApiHttpError, asyncHandler } from '../middleware/errorHandler.ts';

const router = Router();

interface NormalizedAddress {
  provider: string;
  lat: number;
  lng: number;
  society: string;
  roadOrStreet: string;
  area: string;
  city: string;
  pincode: string;
  fullAddress: string;
}

async function fetchJsonWithTimeout(url: string, headers: Record<string, string> = {}, timeoutMs = 5000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { headers, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}

router.get(
  '/reverse',
  asyncHandler(async (req, res) => {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);

    if (!Number.isFinite(lat) || !Number.isFinite(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      throw new ApiHttpError(400, 'Valid latitude and longitude are required.', 'INVALID_COORDINATES');
    }

    // 1) Try Google Maps Geocoding API server-side if a valid non-placeholder key exists
    const gKey = SERVER_ENV.GOOGLE_MAPS_API_KEY;
    if (gKey && !gKey.includes('MY_GOOGLE_MAPS_API_KEY') && !gKey.includes('demo')) {
      try {
        const gData = await fetchJsonWithTimeout(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${encodeURIComponent(gKey)}`
        );
        const first = Array.isArray(gData?.results) ? gData.results[0] : null;
        if (first) {
          const comps: Array<{ long_name: string; types: string[] }> = first.address_components || [];
          const pick = (types: string[]) =>
            comps.find((c) => types.some((t) => c.types.includes(t)))?.long_name || '';

          const premise = pick(['premise', 'subpremise', 'point_of_interest', 'establishment']);
          const sublocality2 = pick(['sublocality_level_2', 'neighborhood']);
          const sublocality1 = pick(['sublocality_level_1', 'sublocality']);
          const streetNum = pick(['street_number']);
          const route = pick(['route']);
          const city = pick(['locality', 'administrative_area_level_2']);
          const pincode = pick(['postal_code']);

          const society = premise || sublocality2 || sublocality1;
          const streetPart = [streetNum, route].filter(Boolean).join(' ');
          const roadOrStreet =
            streetPart ||
            [sublocality2 !== society ? sublocality2 : '', sublocality1 !== society ? sublocality1 : '']
              .filter(Boolean)
              .join(', ') ||
            sublocality1 ||
            city;
          const area = sublocality1 || sublocality2;

          // Strip leading Google Plus Code (e.g. "3XGX+G7J, ") for cleaner human-readable doorstep address
          const cleanFormatted = String(first.formatted_address || '')
            .replace(/^[A-Z0-9]{4,8}\+[A-Z0-9]{2,4},?\s*/i, '')
            .trim();

          const out: NormalizedAddress = {
            provider: 'google-geocode',
            lat,
            lng,
            society: society || area,
            roadOrStreet: roadOrStreet || area,
            area,
            city,
            pincode,
            fullAddress:
              cleanFormatted || [society, roadOrStreet, area, city, pincode].filter(Boolean).join(', '),
          };
          return res.json({ success: true, ...out });
        }
      } catch {
        // Fall through smoothly to OSM Nominatim
      }
    }

    // 2) Try OpenStreetMap Nominatim (no API key needed)
    try {
      const osm = await fetchJsonWithTimeout(
        `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&addressdetails=1`,
        {
          'User-Agent': 'TazaMandiMarco100App/1.0 (contact@tazamandi.in)',
          'Accept-Language': 'en',
        },
        5500
      );

      if (osm && osm.address) {
        const a = osm.address;
        const society =
          a.building ||
          a.residential ||
          a.apartments ||
          a.neighbourhood ||
          a.suburb ||
          a.village ||
          '';
        const roadOrStreet = a.road || a.pedestrian || a.street || a.locality || '';
        const area = a.suburb || a.neighbourhood || a.city_district || a.town || '';
        const city = a.city || a.state_district || a.county || a.state || '';
        const pincode = a.postcode || '';

        const composed = [society, roadOrStreet, area !== society ? area : '', city, pincode]
          .filter(Boolean)
          .join(', ');

        const out: NormalizedAddress = {
          provider: 'openstreetmap-nominatim',
          lat,
          lng,
          society,
          roadOrStreet: roadOrStreet || area,
          area,
          city,
          pincode,
          fullAddress: composed || osm.display_name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        };
        return res.json({ success: true, ...out });
      }
    } catch {
      // Fall through to BigDataCloud free client/server reverse geocode
    }

    // 3) BigDataCloud fallback (fast, zero-key)
    try {
      const bdc = await fetchJsonWithTimeout(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        {},
        5000
      );
      if (bdc) {
        const society = bdc.locality || bdc.city || '';
        const area = bdc.localityInfo?.administrative?.[3]?.name || bdc.locality || '';
        const city = bdc.city || bdc.principalSubdivision || '';
        const pincode = bdc.postcode || '';
        const composed = [society, area !== society ? area : '', city, pincode]
          .filter(Boolean)
          .join(', ');

        return res.json({
          success: true,
          provider: 'bigdatacloud',
          lat,
          lng,
          society,
          roadOrStreet: area || city,
          area,
          city,
          pincode,
          fullAddress: composed || `${lat.toFixed(4)}, ${lng.toFixed(4)}`,
        });
      }
    } catch {
      // Fall through to clean coordinate summary
    }

    return res.json({
      success: true,
      provider: 'gps-coordinates',
      lat,
      lng,
      society: '',
      roadOrStreet: '',
      area: '',
      city: '',
      pincode: '',
      fullAddress: `GPS Lat ${lat.toFixed(4)}, Lng ${lng.toFixed(4)}`,
    });
  })
);

export default router;
