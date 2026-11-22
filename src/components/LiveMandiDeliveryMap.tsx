import React, { useState, useMemo } from 'react';
import { APIProvider, Map, AdvancedMarker, Pin, InfoWindow } from '@vis.gl/react-google-maps';
import { useApp } from '../context/AppContext';
import { Truck, MapPin, Building, ShieldCheck, Compass, Thermometer, Navigation, RefreshCw } from 'lucide-react';

interface LiveMandiDeliveryMapProps {
  transitProgressPercent?: number;
  deliveryStage?: string;
  orderId?: string;
}

interface CorridorLocation {
  id: string;
  name: string;
  nameHi: string;
  type: 'origin' | 'checkpoint' | 'destination';
  position: { lat: number; lng: number };
  description: string;
  badge: string;
  icon: string;
}

const CORRIDOR_LOCATIONS: CorridorLocation[] = [
  {
    id: 'mandi',
    name: 'APMC Vashi Wholesale Market Yard 2',
    nameHi: 'वाशी एपीएमसी थोक फल व सब्ज़ी मंडी (यार्ड 2)',
    type: 'origin',
    position: { lat: 19.0760, lng: 73.0033 },
    description: 'Fresh dawn farmer trucks lot sourcing · 4:00 AM auction yard',
    badge: '4:00 AM Dawn Auction',
    icon: '🥦',
  },
  {
    id: 'transit_hub',
    name: 'Palm Beach Road Transit Corridor',
    nameHi: 'पाम बीच एक्सप्रेसवे ट्रांजिट कॉरिडोर',
    type: 'checkpoint',
    position: { lat: 19.0430, lng: 73.0180 },
    description: 'Express zero-emission temperature controlled transit',
    badge: 'Direct Green Corridor',
    icon: '⚡',
  },
  {
    id: 'sorting_hub',
    name: 'Nerul - Seawoods Community Micro-Hub',
    nameHi: 'नेरुल - सीवुड्स कम्युनिटी माइक्रो हब',
    type: 'checkpoint',
    position: { lat: 19.0280, lng: 73.0190 },
    description: 'Digital calibrated weighing & hygienic jute bag sealing',
    badge: '7:30 AM Bagged Lot',
    icon: '⚖️',
  },
  {
    id: 'society',
    name: 'Green Valley Residency Gate (Customer Drop)',
    nameHi: 'ग्रीन वैली रेसीडेंसी मुख्य गेट (फ्लैट डिलीवरी)',
    type: 'destination',
    position: { lat: 19.0180, lng: 73.0290 },
    description: 'Society gate entry verified · Tower A & B flat doorstep drop',
    badge: '10:00 AM Flat Doorstep',
    icon: '🏢',
  },
];

export const LiveMandiDeliveryMap: React.FC<LiveMandiDeliveryMapProps> = ({
  transitProgressPercent = 65,
  deliveryStage = 'out_for_delivery',
  orderId,
}) => {
  const { brand, lang } = useApp();
  const [selectedLocation, setSelectedLocation] = useState<CorridorLocation | null>(null);
  const [isVanInfoOpen, setIsVanInfoOpen] = useState(true);

  // Dynamic locations using active society configuration
  const corridorLocations: CorridorLocation[] = useMemo(() => [
    {
      id: 'mandi',
      name: 'APMC Vashi Wholesale Market Yard 2',
      nameHi: 'वाशी एपीएमसी थोक फल व सब्ज़ी मंडी (यार्ड 2)',
      type: 'origin',
      position: { lat: 19.0760, lng: 73.0033 },
      description: 'Fresh dawn farmer trucks lot sourcing · 4:00 AM auction yard',
      badge: '4:00 AM Dawn Auction',
      icon: '🥦',
    },
    {
      id: 'transit_hub',
      name: 'Palm Beach Road Transit Corridor',
      nameHi: 'पाम बीच एक्सप्रेसवे ट्रांजिट कॉरिडोर',
      type: 'checkpoint',
      position: { lat: 19.0430, lng: 73.0180 },
      description: 'Express zero-emission temperature controlled transit',
      badge: 'Direct Green Corridor',
      icon: '⚡',
    },
    {
      id: 'sorting_hub',
      name: 'Nerul - Seawoods Community Micro-Hub',
      nameHi: 'नेरुल - सीवुड्स कम्युनिटी माइक्रो हब',
      type: 'checkpoint',
      position: { lat: 19.0280, lng: 73.0190 },
      description: 'Digital calibrated weighing & hygienic jute bag sealing',
      badge: '7:30 AM Bagged Lot',
      icon: '⚖️',
    },
    {
      id: 'society',
      name: `${brand.societyName || 'आपकी सोसायटी'} मुख्य गेट`,
      nameHi: `${brand.societyName || 'सोसायटी'} मुख्य गेट (डोरस्टेप डिलीवरी)`,
      type: 'destination',
      position: { lat: 19.0180, lng: 73.0290 },
      description: 'Society gate entry verified · Doorstep delivery',
      badge: '10:00 AM Doorstep Drop',
      icon: '🏢',
    },
  ], [brand.societyName]);

  // Compute live van position along the corridor polyline based on progress percentage
  const vanPosition = useMemo(() => {
    const fraction = Math.min(100, Math.max(0, transitProgressPercent)) / 100;
    const p1 = corridorLocations[0].position; // Mandi
    const p2 = corridorLocations[1].position; // Palm Beach
    const p3 = corridorLocations[2].position; // Sorting
    const p4 = corridorLocations[3].position; // Society

    if (fraction <= 0.33) {
      const segF = fraction / 0.33;
      return {
        lat: p1.lat + (p2.lat - p1.lat) * segF,
        lng: p1.lng + (p2.lng - p1.lng) * segF,
      };
    } else if (fraction <= 0.66) {
      const segF = (fraction - 0.33) / 0.33;
      return {
        lat: p2.lat + (p3.lat - p2.lat) * segF,
        lng: p2.lng + (p3.lng - p2.lng) * segF,
      };
    } else {
      const segF = (fraction - 0.66) / 0.34;
      return {
        lat: p3.lat + (p4.lat - p3.lat) * segF,
        lng: p3.lng + (p4.lng - p3.lng) * segF,
      };
    }
  }, [transitProgressPercent, corridorLocations]);

  // Center between APMC Vashi and Society
  const mapCenter = useMemo(() => ({ lat: 19.0470, lng: 73.0180 }), []);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || 'AIzaSyCs1fwoEziaiZcJfoj7TNKqhy4DqiJOO-Y';

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
      {/* Header Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/70 dark:bg-slate-850">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider">
            <span className="flex h-2 w-2 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Google Maps Live Transit Track</span>
            <span>·</span>
            <span>{brand.societyName}</span>
          </div>
          <h3 className="text-base sm:text-lg font-display font-black text-slate-900 dark:text-slate-100 mt-0.5">
            {lang === 'hi'
              ? 'एपीएमसी वाशी मंडी ➔ सोसायटी लाइव रूट ट्रैकर'
              : lang === 'mr'
              ? 'वाशी एपीएमसी ➔ सोसायटी थेट वितरण नकाशा'
              : 'APMC Vashi to Society Live Delivery Route'}
          </h3>
        </div>

        {/* Live Van Metrics */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
            <Thermometer className="w-3.5 h-3.5 text-blue-500" />
            <span className="text-slate-500">कोल्ड-चेन:</span>
            <strong className="text-blue-700 dark:text-blue-400 font-mono">4.2°C Fresh</strong>
          </div>

          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-2xs">
            <Navigation className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-slate-500">स्पीड:</span>
            <strong className="text-emerald-700 dark:text-emerald-400 font-mono">34 km/h</strong>
          </div>

          <div className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/60 rounded-lg border border-emerald-300 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300">
            <span>रूट पूर्ण: {transitProgressPercent}%</span>
          </div>
        </div>
      </div>

      {/* Google Maps Container */}
      <div className="relative w-full h-[380px] sm:h-[460px] bg-slate-100 dark:bg-slate-950">
        <APIProvider apiKey={apiKey} libraries={['marker']}>
          <Map
            mapId="DEMO_MAP_ID"
            defaultCenter={mapCenter}
            defaultZoom={12}
            gestureHandling="greedy"
            disableDefaultUI={false}
            internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
            style={{ width: '100%', height: '100%' }}
          >
            {/* Origin & Milestones Advanced Markers */}
            {corridorLocations.map((loc) => (
              <AdvancedMarker
                key={loc.id}
                position={loc.position}
                title={loc.name}
                onClick={() => setSelectedLocation(loc)}
              >
                <div className="flex flex-col items-center group cursor-pointer">
                  <div
                    className={`px-2 py-0.5 rounded-full text-[10px] font-black shadow-md border whitespace-nowrap mb-1 transition-transform group-hover:scale-105 ${
                      loc.type === 'origin'
                        ? 'bg-emerald-800 text-white border-emerald-600'
                        : loc.type === 'destination'
                        ? 'bg-amber-600 text-white border-amber-500'
                        : 'bg-slate-900 text-white border-slate-700'
                    }`}
                  >
                    <span>{loc.icon} </span>
                    <span>{loc.id === 'mandi' ? 'APMC Mandi' : loc.id === 'society' ? 'Society Gate' : loc.name.split(' ')[0]}</span>
                  </div>

                  {loc.type === 'origin' && (
                    <Pin background="#047857" glyphColor="#ffffff" borderColor="#065f46" />
                  )}
                  {loc.type === 'destination' && (
                    <Pin background="#d97706" glyphColor="#ffffff" borderColor="#b45309" />
                  )}
                  {loc.type === 'checkpoint' && (
                    <Pin background="#1e293b" glyphColor="#38bdf8" borderColor="#0f172a" />
                  )}
                </div>
              </AdvancedMarker>
            ))}

            {/* Live Moving Van Marker */}
            <AdvancedMarker
              position={vanPosition}
              title={`Live Electric Delivery Van · ${orderId || 'Active Order'}`}
              onClick={() => setIsVanInfoOpen(true)}
              zIndex={100}
            >
              <div className="relative cursor-pointer group">
                {/* Pulse Ring */}
                <div className="absolute -inset-2 bg-emerald-500/30 rounded-full animate-ping pointer-events-none" />

                {/* Van Badge */}
                <div className="relative bg-emerald-600 hover:bg-emerald-500 text-white p-2 rounded-2xl shadow-xl border-2 border-white flex items-center gap-1.5 transition-transform group-hover:scale-110">
                  <Truck className="w-5 h-5 text-white animate-bounce" />
                  <span className="text-[10px] font-black pr-1 hidden sm:inline">LIVE VAN</span>
                </div>
              </div>
            </AdvancedMarker>

            {/* InfoWindow for Clicked Milestone */}
            {selectedLocation && (
              <InfoWindow
                position={selectedLocation.position}
                onCloseClick={() => setSelectedLocation(null)}
              >
                <div className="p-2 max-w-[240px] text-slate-900">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <span>{selectedLocation.icon}</span>
                    <span>{selectedLocation.badge}</span>
                  </div>
                  <h4 className="font-bold text-sm mt-1 text-slate-900">
                    {lang === 'hi' ? selectedLocation.nameHi : selectedLocation.name}
                  </h4>
                  <p className="text-xs text-slate-600 mt-1">{selectedLocation.description}</p>
                </div>
              </InfoWindow>
            )}

            {/* InfoWindow for Van */}
            {isVanInfoOpen && (
              <InfoWindow
                position={vanPosition}
                onCloseClick={() => setIsVanInfoOpen(false)}
              >
                <div className="p-2 max-w-[240px] text-slate-900">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-800">
                    <Truck className="w-4 h-4 text-emerald-600" />
                    <span>ताज़ाMandi Express EV Van</span>
                  </div>
                  <div className="font-black text-sm text-slate-900 mt-1">
                    {lang === 'hi' ? 'सोसायटी गेट की ओर गतिशील' : 'Heading to Society Gate'}
                  </div>
                  <div className="text-[11px] text-slate-600 mt-1">
                    📍 पाम बीच रोड ➔ {brand.societyName}
                  </div>
                  <div className="mt-2 pt-2 border-t border-slate-200 flex items-center justify-between text-[10px] font-mono">
                    <span className="text-emerald-700 font-bold">4.2°C Cold Sealed</span>
                    <span className="text-slate-500">ETA: ~18 mins</span>
                  </div>
                </div>
              </InfoWindow>
            )}
          </Map>
        </APIProvider>

        {/* Floating Quick Action Overlay on Map */}
        <div className="absolute bottom-3 left-3 right-3 sm:left-auto sm:right-3 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-lg text-xs space-y-1.5 max-w-sm pointer-events-auto">
          <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
            <span className="flex items-center gap-1.5">
              <Compass className="w-4 h-4 text-emerald-600" />
              <span>प्रोक्योरमेंट व डिलीवरी कॉरिडोर</span>
            </span>
            <span className="text-emerald-700 dark:text-emerald-400 font-mono text-[11px]">
              APMC ➔ {brand.societyName}
            </span>
          </div>
          <div className="text-[11px] text-slate-500 leading-tight">
            मंडी के थोक यार्ड से किसान खेप सीधे सोसायटी के गेट तक Google Maps पर लाइव ट्रैक की जा सकती है।
          </div>
        </div>
      </div>
    </div>
  );
};
