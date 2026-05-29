import React, { useState, useMemo, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, ZoomControl, useMap, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { 
  Building2, 
  MapPin, 
  Car, 
  Phone, 
  Navigation, 
  CalendarCheck, 
  BedDouble,
  RefreshCw,
  Search,
  AlertTriangle,
  LogOut,
  Activity,
  Crosshair,
  Star,
  Stethoscope,
  Wind,
  Droplets,
  X,
  Clock,
  ChevronRight,
  Users,
  Zap,
  ShieldCheck,
  Info,
  CheckCircle2,
  XCircle,
  HeartPulse,
  MonitorSmartphone,
  CheckCircle,
  User,
} from 'lucide-react';
import { Hospital } from '../data/hospitals';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000'); // Backend runs on 5000

// Haversine formula to calculate actual distance between two coordinates in km
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2); 
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
  return R * c; 
}

// Component to dynamically center map when user location or focus changes
function MapController({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { animate: true });
  }, [center, zoom, map]);
  return null;
}

// Custom Leaflet icon for the user's location
const customPulseIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Custom Leaflet icon for hospitals
const hospitalIcon = new L.DivIcon({
  html: `<div style="background-color: #e11d48; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M5 12h14"/></svg></div>`,
  className: '',
  iconSize: [28, 28],
  iconAnchor: [14, 14],
  popupAnchor: [0, -14]
});

// Custom Leaflet icon for live ambulance tracking
const liveAmbulanceIcon = new L.DivIcon({
  html: `<div style="background:#2563eb;border-radius:50%;width:36px;height:36px;display:flex;align-items:center;justify-content:center;border:3px solid white;box-shadow:0 0 16px rgba(37,99,235,0.7);animation:pulse 1.5s infinite">🚑</div>`,
  className: '',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function DoctorAvatar({ initials, status }: { initials: string; status: 'on-duty' | 'off-duty' }) {
  const colors = ['#0d9488', '#6366f1', '#f59e0b', '#ec4899', '#8b5cf6', '#10b981'];
  const colorIndex = initials.charCodeAt(0) % colors.length;
  return (
    <div className="relative inline-block">
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-md"
        style={{ backgroundColor: colors[colorIndex] }}
      >
        {initials.slice(0, 2)}
      </div>
      <span
        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-[#0a2924] ${
          status === 'on-duty' ? 'bg-emerald-400' : 'bg-gray-500'
        }`}
      />
    </div>
  );
}

// ─── Phase 3: Full-Screen Know More Modal ───────────────────────────────────
function KnowMoreModal({
  hospital,
  userLoc,
  onClose,
  onNavigate,
  onCall,
  onBook,
}: {
  hospital: Hospital;
  userLoc: { lat: number; lng: number } | null;
  onClose: () => void;
  onNavigate: (h: Hospital) => void;
  onCall: (h: Hospital) => void;
  onBook: (type: 'Appt' | 'Bed', h: Hospital) => void;
}) {
  const onDuty = hospital.doctors.filter((d) => d.status === 'on-duty');
  const offDuty = hospital.doctors.filter((d) => d.status === 'off-duty');

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-[#020d0b]/85 backdrop-blur-md p-4"
      onClick={onClose}
    >
      <div
        className="relative bg-gradient-to-b from-[#0b2e28] to-[#071e1a] border border-teal-700/40 rounded-2xl w-full max-w-3xl max-h-[92vh] overflow-y-auto shadow-[0_0_80px_rgba(20,184,166,0.18)] customized-scrollbar"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-[#0b2e28]/95 backdrop-blur-sm border-b border-teal-800/40 px-6 py-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest text-teal-400 bg-teal-900/40 px-2 py-0.5 rounded-full border border-teal-700/40">
                {hospital.type}
              </span>
              {hospital.emergency && (
                <span className="text-[10px] font-bold uppercase tracking-widest text-rose-400 bg-rose-950/40 px-2 py-0.5 rounded-full border border-rose-800/40 flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" /> Emergency
                </span>
              )}
            </div>
            <h2 className="text-xl font-extrabold text-white leading-tight">{hospital.name}</h2>
            <p className="text-teal-300/70 text-xs mt-0.5 flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {hospital.address}
            </p>
          </div>
          <button
            onClick={onClose}
            className="mt-1 ml-4 shrink-0 w-8 h-8 rounded-full bg-teal-900/50 hover:bg-rose-900/60 border border-teal-700/30 flex items-center justify-center text-teal-300 hover:text-white transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6 space-y-6">

          {/* Key Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Rating', value: `★ ${hospital.rating}/5`, color: 'text-amber-400', bg: 'bg-amber-950/30 border-amber-800/30' },
              { label: 'Total Beds', value: hospital.totalBeds.toLocaleString(), color: 'text-teal-300', bg: 'bg-teal-950/30 border-teal-800/30' },
              { label: 'Est.', value: hospital.established, color: 'text-indigo-300', bg: 'bg-indigo-950/30 border-indigo-800/30' },
              { label: 'Doctors', value: hospital.doctors.length, color: 'text-pink-300', bg: 'bg-pink-950/30 border-pink-800/30' },
            ].map((s) => (
              <div key={s.label} className={`rounded-xl border p-3 text-center ${s.bg}`}>
                <div className={`text-lg font-extrabold ${s.color}`}>{s.value}</div>
                <div className="text-[10px] text-teal-400/60 uppercase tracking-wider mt-0.5">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Resources */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400/70 mb-3 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" /> Live Resources
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label: 'ICU Beds', value: hospital.resources.icuBeds, icon: <BedDouble className="w-4 h-4" />, good: hospital.resources.icuBeds > 0 },
                { label: 'Gen. Beds', value: hospital.resources.generalBeds, icon: <BedDouble className="w-4 h-4" />, good: hospital.resources.generalBeds > 0 },
                { label: 'Oxygen', value: hospital.resources.oxygenCylinders, icon: <Wind className="w-4 h-4" />, good: hospital.resources.oxygenCylinders > 0 },
                { label: 'Ventilators', value: hospital.resources.ventilators, icon: <MonitorSmartphone className="w-4 h-4" />, good: hospital.resources.ventilators > 0 },
                { label: 'Ambulances', value: hospital.resources.ambulances, icon: <Car className="w-4 h-4" />, good: hospital.resources.ambulances > 0 },
                { label: 'Blood', value: hospital.resources.bloodAvailable !== 'None' ? hospital.resources.bloodAvailable : '—', icon: <Droplets className="w-4 h-4" />, good: hospital.resources.bloodAvailable !== 'None' },
              ].map((r) => (
                <div key={r.label} className={`rounded-xl border p-2.5 flex flex-col items-center gap-1 ${r.good ? 'bg-teal-950/40 border-teal-800/30' : 'bg-rose-950/20 border-rose-900/20'}`}>
                  <span className={r.good ? 'text-teal-400' : 'text-rose-400'}>{r.icon}</span>
                  <span className={`text-sm font-extrabold ${r.good ? 'text-teal-200' : 'text-rose-400'}`}>{r.good ? r.value : (typeof r.value === 'number' ? 'NONE' : r.value)}</span>
                  <span className="text-[9px] text-teal-500/60 uppercase tracking-wider text-center">{r.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Specializations */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-teal-400/70 mb-3 flex items-center gap-2">
              <ShieldCheck className="w-3.5 h-3.5" /> Specializations
            </h3>
            <div className="flex flex-wrap gap-2">
              {hospital.specializations.map((sp) => (
                <span key={sp} className="text-[11px] font-semibold px-3 py-1 rounded-full bg-indigo-950/40 border border-indigo-800/30 text-indigo-300">
                  {sp}
                </span>
              ))}
            </div>
          </div>

          {/* Doctors on Duty */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400/70 mb-3 flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              On Duty ({onDuty.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {onDuty.map((doc) => (
                <DoctorCard key={doc.name} doc={doc} />
              ))}
            </div>
          </div>

          {/* Doctors off Duty */}
          {offDuty.length > 0 && (
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-gray-500/70 mb-3 flex items-center gap-2">
                <XCircle className="w-3.5 h-3.5 text-gray-500" />
                Off Duty ({offDuty.length})
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 opacity-60">
                {offDuty.map((doc) => (
                  <DoctorCard key={doc.name} doc={doc} />
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-teal-800/30">
            <button
              onClick={() => onNavigate(hospital)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold text-xs transition-all shadow-lg hover:shadow-blue-500/30 hover:scale-[1.03]"
            >
              <Navigation className="w-4 h-4" />
              Navigate
            </button>
            <button
              onClick={() => onCall(hospital)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-br from-emerald-600 to-green-700 hover:from-emerald-500 hover:to-green-600 text-white font-bold text-xs transition-all shadow-lg hover:shadow-emerald-500/30 hover:scale-[1.03]"
            >
              <Phone className="w-4 h-4" />
              Call Now
            </button>
            <button
              onClick={() => onBook('Appt', hospital)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 hover:from-violet-500 hover:to-purple-600 text-white font-bold text-xs transition-all shadow-lg hover:shadow-violet-500/30 hover:scale-[1.03]"
            >
              <CalendarCheck className="w-4 h-4" />
              Book Appt
            </button>
            <button
              onClick={() => onBook('Bed', hospital)}
              className="flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl bg-gradient-to-br from-rose-600 to-pink-700 hover:from-rose-500 hover:to-pink-600 text-white font-bold text-xs transition-all shadow-lg hover:shadow-rose-500/30 hover:scale-[1.03]"
            >
              <BedDouble className="w-4 h-4" />
              Reserve Bed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Doctor Card (used inside Know More modal) ───────────────────────────────
function DoctorCard({ doc }: { doc: Doctor }) {
  return (
    <div className={`flex items-center gap-3 bg-[#08211d] border rounded-xl p-3 transition-all ${doc.status === 'on-duty' ? 'border-emerald-800/30' : 'border-gray-800/40'}`}>
      <DoctorAvatar initials={doc.avatarInitials} status={doc.status} />
      <div className="min-w-0 flex-1">
        <p className="text-white text-sm font-bold leading-tight truncate">{doc.name}</p>
        <p className="text-teal-400 text-[11px] font-semibold truncate">{doc.specialization}</p>
        <p className="text-teal-600/70 text-[10px] mt-0.5 truncate">{doc.qualification} · {doc.experience}y exp</p>
      </div>
      <span className={`shrink-0 text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
        doc.status === 'on-duty'
          ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40'
          : 'text-gray-500 bg-gray-900/40 border-gray-700/40'
      }`}>
        {doc.status === 'on-duty' ? 'On Duty' : 'Off Duty'}
      </span>
    </div>
  );
}

// ─── Phase 2: Expanded Card ──────────────────────────────────────────────────
function ExpandedHospitalCard({
  hospital,
  onClose,
  onNavigate,
  onCall,
  onBook,
  onKnowMore,
}: {
  hospital: Hospital;
  onClose: () => void;
  onNavigate: (h: Hospital) => void;
  onCall: (h: Hospital) => void;
  onBook: (type: 'Appt' | 'Bed', h: Hospital) => void;
  onKnowMore: (h: Hospital) => void;
}) {
  return (
    <div className="bg-gradient-to-br from-[#0e3530] to-[#0a2822] border border-teal-500/40 rounded-xl p-4 shadow-[0_0_24px_rgba(20,184,166,0.18)] transition-all">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-300 bg-indigo-950/40 px-2 py-0.5 rounded-full border border-indigo-800/30">
              {hospital.type}
            </span>
            {hospital.emergency && (
              <span className="text-[9px] font-bold uppercase tracking-widest text-rose-400 bg-rose-950/30 px-2 py-0.5 rounded-full border border-rose-800/30 flex items-center gap-1">
                <Zap className="w-2.5 h-2.5" /> 24h Emergency
              </span>
            )}
          </div>
          <h3 className="text-base font-extrabold text-white leading-snug">{hospital.name}</h3>
          <p className="text-teal-400/70 text-[10px] mt-0.5 flex items-center gap-1 truncate">
            <MapPin className="w-2.5 h-2.5 shrink-0" />
            {hospital.address}
          </p>
        </div>
        <button
          onClick={onClose}
          className="ml-2 shrink-0 w-6 h-6 rounded-full bg-teal-900/40 hover:bg-rose-900/50 border border-teal-800/30 flex items-center justify-center text-teal-400 hover:text-white transition-all"
        >
          <X className="w-3 h-3" />
        </button>
      </div>

      {/* Rating + Distance */}
      <div className="flex items-center gap-2 mb-3">
        <div className="flex items-center gap-1 bg-amber-950/30 border border-amber-800/30 text-amber-400 px-2 py-1 rounded-lg text-xs font-bold">
          <Star className="w-3 h-3" /> {hospital.rating}/5
        </div>
        <div className="flex items-center gap-1 bg-rose-950/30 border border-rose-900/30 text-rose-300 px-2 py-1 rounded-lg text-xs font-bold">
          <MapPin className="w-3 h-3" /> {hospital.distance} km
        </div>
        <div className="flex items-center gap-1 bg-cyan-950/30 border border-cyan-900/30 text-cyan-300 px-2 py-1 rounded-lg text-xs font-bold">
          <Car className="w-3 h-3" /> ~{hospital.driveTime} min
        </div>
        <div className="flex items-center gap-1 bg-teal-950/30 border border-teal-900/30 text-teal-300 px-2 py-1 rounded-lg text-xs font-bold ml-auto">
          <Users className="w-3 h-3" /> {hospital.doctors.length} Doctors
        </div>
      </div>

      {/* Resources Grid */}
      <div className="grid grid-cols-3 gap-1.5 mb-3">
        {[
          { label: 'ICU', value: hospital.resources.icuBeds, good: hospital.resources.icuBeds > 0 },
          { label: 'Gen Beds', value: hospital.resources.generalBeds, good: hospital.resources.generalBeds > 0 },
          { label: 'Oxygen', value: hospital.resources.oxygenCylinders, good: hospital.resources.oxygenCylinders > 0 },
          { label: 'Ventilators', value: hospital.resources.ventilators, good: hospital.resources.ventilators > 0 },
          { label: 'Ambulance', value: hospital.resources.ambulances, good: hospital.resources.ambulances > 0 },
          { label: 'Blood', value: hospital.resources.bloodAvailable !== 'None' ? hospital.resources.bloodAvailable : '—', good: hospital.resources.bloodAvailable !== 'None' },
        ].map((r) => (
          <div key={r.label} className={`rounded-lg p-1.5 flex items-center justify-between border ${r.good ? 'bg-[#041512] border-teal-900/30' : 'bg-rose-950/10 border-rose-900/20'}`}>
            <span className="text-[9px] text-teal-500/70 uppercase tracking-wider font-bold">{r.label}</span>
            <span className={`text-[10px] font-extrabold ${r.good ? 'text-teal-300' : 'text-rose-400'}`}>
              {r.good ? r.value : (typeof r.value === 'number' ? 'NONE' : r.value)}
            </span>
          </div>
        ))}
      </div>

      {/* Specializations chips */}
      <div className="flex flex-wrap gap-1 mb-3">
        {hospital.specializations.slice(0, 3).map((sp) => (
          <span key={sp} className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-indigo-950/30 border border-indigo-800/20 text-indigo-300">
            {sp}
          </span>
        ))}
        {hospital.specializations.length > 3 && (
          <span className="text-[9px] font-semibold px-2 py-0.5 rounded-full bg-teal-900/20 border border-teal-800/20 text-teal-400">
            +{hospital.specializations.length - 3} more
          </span>
        )}
      </div>

      {/* Phone */}
      <div className="flex items-center gap-2 mb-3 text-xs text-teal-300/60">
        <Phone className="w-3 h-3" />
        <span className="font-mono">{hospital.phone}</span>
      </div>

      {/* Action Buttons — different colors */}
      <div className="grid grid-cols-2 gap-2 mb-2">
        <button
          onClick={() => onNavigate(hospital)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold text-xs transition-all shadow shadow-blue-900/40 hover:shadow-blue-500/30 hover:scale-[1.02]"
        >
          <Navigation className="w-3.5 h-3.5" /> Navigate
        </button>
        <button
          onClick={() => onCall(hospital)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-emerald-600 to-green-500 hover:from-emerald-500 hover:to-green-400 text-white font-bold text-xs transition-all shadow shadow-emerald-900/40 hover:shadow-emerald-500/30 hover:scale-[1.02]"
        >
          <Phone className="w-3.5 h-3.5" /> Call Now
        </button>
        <button
          onClick={() => onBook('Appt', hospital)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-violet-600 to-purple-500 hover:from-violet-500 hover:to-purple-400 text-white font-bold text-xs transition-all shadow shadow-violet-900/40 hover:shadow-violet-500/30 hover:scale-[1.02]"
        >
          <CalendarCheck className="w-3.5 h-3.5" /> Book Appt
        </button>
        <button
          onClick={() => onBook('Bed', hospital)}
          className="flex items-center justify-center gap-1.5 py-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-500 hover:from-rose-500 hover:to-pink-400 text-white font-bold text-xs transition-all shadow shadow-rose-900/40 hover:shadow-rose-500/30 hover:scale-[1.02]"
        >
          <BedDouble className="w-3.5 h-3.5" /> Reserve Bed
        </button>
      </div>

      {/* Know More Button */}
      <button
        onClick={() => onKnowMore(hospital)}
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 via-teal-500 to-emerald-500 hover:from-teal-500 hover:via-teal-400 hover:to-emerald-400 text-white font-extrabold text-sm tracking-wide transition-all shadow-lg shadow-teal-900/50 hover:shadow-teal-500/40 hover:scale-[1.02]"
      >
        <Info className="w-4 h-4" />
        Know More
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// ─── Phase 1: Collapsed Card ────────────────────────────────────────────────
function CollapsedHospitalCard({
  hospital,
  isSelected,
  onClick,
  onNavigate,
  onCall,
  onBook,
}: {
  hospital: Hospital;
  isSelected: boolean;
  onClick: () => void;
  onNavigate: (h: Hospital) => void;
  onCall: (h: Hospital) => void;
  onBook: (type: 'Appt' | 'Bed', h: Hospital) => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-gradient-to-br from-[#0c322c] to-[#08221d] border ${isSelected ? 'border-rose-500 shadow-[0_0_15px_rgba(244,63,94,0.2)]' : 'border-teal-800/40 hover:border-teal-500/60'} rounded-xl p-4 shadow-lg transition-all cursor-pointer group`}
    >
      <div className="flex justify-between items-start mb-3">
        <h3 className="text-base font-extrabold text-[#E2F1E7] group-hover:text-teal-200 transition-colors line-clamp-1">{hospital.name}</h3>
      </div>
      
      <div className="flex items-center justify-between text-[11px] text-teal-200/80 mb-3 pb-3 border-b border-teal-800/40 font-medium">
        <div className="flex bg-rose-950/40 text-rose-300 px-2 py-1 rounded-md border border-rose-900/30 items-center gap-1.5 shadow-sm">
          <MapPin className="w-3 h-3" />
          <span>{hospital.distance} km</span>
        </div>
        <div className="flex bg-cyan-950/40 text-cyan-300 px-2 py-1 rounded-md border border-cyan-900/30 items-center gap-1.5 shadow-sm">
          <Car className="w-3 h-3" />
          <span>~{hospital.driveTime} min drive</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-y-2 gap-x-2 text-[10px] font-bold mb-4">
        <div className="bg-[#041512] rounded p-1.5 flex items-center justify-between border border-teal-900/30 shadow-inner">
          <span className="text-teal-500/70 tracking-wider">ICU BEDS</span>
          <span className={`text-xs ${hospital.resources.icuBeds > 0 ? "text-teal-400" : "text-rose-400"}`}>{hospital.resources.icuBeds > 0 ? hospital.resources.icuBeds : "FULL"}</span>
        </div>
        <div className="bg-[#041512] rounded p-1.5 flex items-center justify-between border border-teal-900/30 shadow-inner">
          <span className="text-teal-500/70 tracking-wider">OXYGEN</span>
          <span className={`text-xs ${hospital.resources.oxygenCylinders > 0 ? "text-teal-400" : "text-rose-400"}`}>{hospital.resources.oxygenCylinders > 0 ? hospital.resources.oxygenCylinders : "OUT"}</span>
        </div>
        <div className="bg-[#041512] rounded p-1.5 flex items-center justify-between border border-teal-900/30 shadow-inner">
          <span className="text-teal-500/70 tracking-wider">BLOOD</span>
          <span className={`text-xs ${hospital.resources.bloodAvailable !== "None" ? "text-rose-400" : "text-red-500/50"}`}>{hospital.resources.bloodAvailable !== "None" ? hospital.resources.bloodAvailable : "NONE"}</span>
        </div>
        <div className="bg-[#041512] rounded p-1.5 flex items-center justify-between border border-teal-900/30 shadow-inner">
          <span className="text-teal-500/70 tracking-wider">AMBULANCE</span>
          <span className={`text-xs ${hospital.resources.ambulances > 0 ? "text-teal-400" : "text-rose-400"}`}>{hospital.resources.ambulances > 0 ? hospital.resources.ambulances : "BUSY"}</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mt-4">
        <button onClick={(e) => { e.stopPropagation(); onNavigate(hospital); }} className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-[#071E1A] hover:bg-teal-900 border border-teal-800/40 hover:border-teal-500/40 transition-all text-teal-300">
          <Navigation className="w-3.5 h-3.5 hover:text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Nav</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onCall(hospital); }} className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-[#071E1A] hover:bg-teal-900 border border-teal-800/40 hover:border-teal-500/40 transition-all text-teal-300">
          <Phone className="w-3.5 h-3.5 hover:text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Call</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onBook('Appt', hospital); }} className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-[#071E1A] hover:bg-teal-900 border border-teal-800/40 hover:border-teal-500/40 transition-all text-teal-300">
          <CalendarCheck className="w-3.5 h-3.5 hover:text-white" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Appt</span>
        </button>
        <button onClick={(e) => { e.stopPropagation(); onBook('Bed', hospital); }} className="flex flex-col items-center justify-center gap-1 p-1.5 rounded-lg bg-teal-950/40 hover:bg-emerald-900/40 border border-emerald-900/30 hover:border-emerald-500/50 transition-all text-emerald-400 relative overflow-hidden">
          <BedDouble className="w-3.5 h-3.5" />
          <span className="text-[9px] font-bold uppercase tracking-wider">Bed</span>
        </button>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function PublicPortal() {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  
  const [userLoc, setUserLoc] = useState<{lat: number, lng: number} | null>(null);
  const [locating, setLocating] = useState<boolean>(true);
  const [locError, setLocError] = useState<string | null>(null);

  // Phase state: 'collapsed' | 'expanded' | 'fullscreen'
  const [expandedHospitalId, setExpandedHospitalId] = useState<string | null>(null);
  const [knowMoreHospital, setKnowMoreHospital] = useState<Hospital | null>(null);

  const [bookingModal, setBookingModal] = useState<{isOpen: boolean, type: 'Appt' | 'Bed' | null, hospital: Hospital | null}>({ isOpen: false, type: null, hospital: null });
  const [bookingStatus, setBookingStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [bookingForm, setBookingForm] = useState({ patientName: '', patientPhone: '', reason: '' });

  const [sosModalOpen, setSosModalOpen] = useState(false);
  const [sosStatus, setSosStatus] = useState<'idle' | 'pending' | 'accepted'>('idle');
  const [sosDriverInfo, setSosDriverInfo] = useState<{name: string, phone: string, vehicle: string, eta: string} | null>(null);

  const [sosForm, setSosForm] = useState({ name: '', condition: '', severity: 'critical', isAccident: false });

  const API_URL = 'http://localhost:5000';
  const filters = ['ICU Bed', 'Oxygen', 'Blood Bank', 'Ambulance'];

  // Helper: map DB hospital record → Hospital UI type
  const mapDbHospital = (h: any): Hospital => ({
    id: h.id,
    name: h.name,
    type: h.specializations?.length ? h.specializations[0] : 'General',
    address: [h.address, h.city].filter(Boolean).join(', ') || 'Address not available',
    phone: h.phone || h.contactPhone || '',
    lat: Number(h.latitude) || 0,
    lng: Number(h.longitude) || 0,
    distance: 0,
    driveTime: 0,
    rating: 4.5,
    totalBeds: Number(h.totalBeds) || 0,
    established: '2000',
    emergency: true,
    doctors: [],
    specializations: h.specializations || [],
    resources: {
      icuBeds: Number(h.icu_beds_available ?? h.icuBeds ?? 0),
      generalBeds: Number(h.totalBeds ?? 0),
      oxygenCylinders: Number(h.oxygen_cylinders_available ?? 0),
      ventilators: Number(h.ventilators ?? 0),
      ambulances: Number(h.ambulances_available ?? h.ambulances ?? 0),
      bloodAvailable: 'B+, O+',
    },
  });

  // Fetch all hospitals from the real backend API
  const fetchHospitals = async () => {
    try {
      const res = await fetch(`${API_URL}/api/hospitals`);
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setHospitals(data.data.map(mapDbHospital));
      }
    } catch (err) {
      console.warn('Could not load hospitals from API:', err);
    }
  };

  useEffect(() => { fetchHospitals(); }, []);

  const submitSosRequest = async () => {
    setSosStatus('pending');
    const loc = userLoc || { lat: 28.6139, lng: 77.2090 };
    const newDispatch = {
      id: `REQ-${Math.floor(1000 + Math.random() * 9000)}`,
      status: 'PENDING',
      patientInfo: {
        name: sosForm.name || 'Unknown Patient',
        condition: sosForm.condition || 'Emergency',
        severity: sosForm.severity,
        isAccident: sosForm.isAccident,
        loc,
      },
      timestamp: new Date().toISOString()
    };
    
    // Local flow 
    localStorage.setItem('lifelink_sos_dispatch', JSON.stringify(newDispatch));
    
    // Broadcast via global backend WebSockets
    socket.emit('sos_dispatch', newDispatch);

    // Also persist to backend API
    try {
      await fetch(`${API_URL}/api/emergency/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: sosForm.name || 'Unknown Patient',
          emergencyType: sosForm.condition || 'Emergency',
          severity: sosForm.severity,
          latitude: loc.lat,
          longitude: loc.lng,
          patientPhone: '',
        }),
      });
    } catch (err) {
      console.error('Failed to persist SOS to API:', err);
    }
  };

  const [driverTrackingLoc, setDriverTrackingLoc] = useState<{lat:number;lng:number}|null>(null);

  // Listen to SOS localStorage changes
  useEffect(() => {
    const handleStorage = (parsed: any) => {
        if (parsed?.status === 'ACCEPTED' && sosStatus !== 'accepted') {
          setSosStatus('accepted');
          setSosDriverInfo(parsed.driverInfo);
        }
    };
    const localHandle = () => {
      const data = localStorage.getItem('lifelink_sos_dispatch');
      if (data) handleStorage(JSON.parse(data));
    };
    const handleArrived = (data: any) => { setSosStatus('arrived' as any); setSosDriverInfo(prev => prev || data?.driverInfo || null); setSosModalOpen(true); };
    const handleDriverLoc = (data: any) => {
      if (!data?.lat || !data?.lng) return;
      setDriverTrackingLoc({ lat: data.lat, lng: data.lng });
      setSosStatus(prev => prev === 'accepted' ? ('enroute' as any) : prev);
      if (userLoc) {
        const R = 6371000;
        const dLat = (userLoc.lat - data.lat) * Math.PI / 180;
        const dLng = (userLoc.lng - data.lng) * Math.PI / 180;
        const a = Math.sin(dLat/2)**2 + Math.cos(userLoc.lat*Math.PI/180)*Math.cos(data.lat*Math.PI/180)*Math.sin(dLng/2)**2;
        const dist = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        if (dist < 200) { setSosStatus('arrived' as any); setSosDriverInfo(prev => prev || data?.driverInfo || null); setSosModalOpen(true); }
      }
    };
    // Cross-tab localStorage listener for same-browser arrived notification
    const localStorageHandle = () => {
      const arrivedData = localStorage.getItem('lifelink_ambulance_arrived');
      if (arrivedData) {
        const parsed = JSON.parse(arrivedData);
        setSosStatus('arrived' as any);
        setSosDriverInfo(prev => prev || parsed?.driverInfo || null);
        setSosModalOpen(true);
      }
    };

    // Cross-tab localStorage listener for same-browser arrived notification
    const localStorageArrivedHandle = () => {
      const arrivedData = localStorage.getItem('lifelink_ambulance_arrived');
      if (arrivedData) {
        const parsed = JSON.parse(arrivedData);
        setSosStatus('arrived' as any);
        setSosDriverInfo(prev => prev || parsed?.driverInfo || null);
        setSosModalOpen(true);
      }
    };

    window.addEventListener('storage', localHandle);
    window.addEventListener('storage', localStorageArrivedHandle);
    socket.on('sos_accepted', handleStorage);
    socket.on('ambulance_arrived', handleArrived);
    socket.on('driver_location_update', handleDriverLoc);
    
    return () => {
        window.removeEventListener('storage', localHandle);
        window.removeEventListener('storage', localStorageArrivedHandle);
        socket.off('sos_accepted', handleStorage);
        socket.off('ambulance_arrived', handleArrived);
        socket.off('driver_location_update', handleDriverLoc);
    };
  }, [sosStatus, userLoc]);

  // Ref to automatically scroll the card list to the top
  const scrollRef = useRef<HTMLDivElement>(null);
  const scrollToTop = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLoc({ lat: position.coords.latitude, lng: position.coords.longitude });
          setLocating(false);
        },
        (error) => {
          console.error("Location error:", error);
          setLocError("Location access denied. Using default Delhi center.");
          setUserLoc({ lat: 28.6139, lng: 77.2090 });
          setLocating(false);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLocError("Geolocation not supported by browser.");
      setUserLoc({ lat: 28.6139, lng: 77.2090 });
      setLocating(false);
    }
  }, []);

  // Listen for hospital inventory updates (from Hospital Portal admin)
  useEffect(() => {
    const handleInventoryUpdate = (data: any) => {
      if (!data?.hospitalId || !data?.resources) return;
      setHospitals(prev => prev.map(h =>
        h.id === data.hospitalId
          ? { ...h, resources: {
              icuBeds: data.resources.icuBeds ?? h.resources.icuBeds,
              generalBeds: data.resources.generalBeds ?? h.resources.generalBeds,
              oxygenCylinders: data.resources.oxygenCylinders ?? h.resources.oxygenCylinders,
              ventilators: data.resources.ventilators ?? h.resources.ventilators,
              ambulances: data.resources.ambulances ?? h.resources.ambulances,
              bloodAvailable: data.resources.bloodAvailable ?? h.resources.bloodAvailable,
            }}
          : h
      ));
    };
    const handleLocalInventory = () => {
      const raw = sessionStorage.getItem('lifelink_inventory_update');
      if (raw) { try { handleInventoryUpdate(JSON.parse(raw)); } catch {} }
    };
    socket.on('hospital_inventory_update', handleInventoryUpdate);
    window.addEventListener('storage', handleLocalInventory);
    return () => {
      socket.off('hospital_inventory_update', handleInventoryUpdate);
      window.removeEventListener('storage', handleLocalInventory);
    };
  }, []);

  const handleNavigate = (hospital: Hospital) => {
    if (userLoc) {
      window.open(`https://www.google.com/maps/dir/?api=1&origin=${userLoc.lat},${userLoc.lng}&destination=${hospital.lat},${hospital.lng}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/dir/?api=1&destination=${hospital.lat},${hospital.lng}`, '_blank');
    }
  };

  const handleCall = (hospital: Hospital) => {
    window.location.href = `tel:${hospital.phone}`;
  };

  const handleBook = (type: 'Appt' | 'Bed', hospital: Hospital) => {
    setBookingModal({ isOpen: true, type, hospital });
    setBookingStatus('idle');
    setBookingForm({ patientName: '', patientPhone: '', reason: '' });
  };

  const confirmBooking = async () => {
    if (!bookingForm.patientName.trim()) return;
    setBookingStatus('loading');
    try {
      const hospital = bookingModal.hospital!;
      if (bookingModal.type === 'Appt') {
        // Book appointment via API
        await fetch(`${API_URL}/api/appointments`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId: hospital.id,
            patientId: '00000000-0000-0000-0000-000000000001',
            patientName: bookingForm.patientName,
            patientPhone: bookingForm.patientPhone,
            reason: bookingForm.reason || `Appointment at ${hospital.name}`,
            appointmentType: 'consultation',
            appointmentDate: new Date().toISOString(),
            appointmentTime: new Date().toLocaleTimeString(),
          }),
        });
      } else {
        // Book bed via API
        await fetch(`${API_URL}/api/bed-bookings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            hospitalId: hospital.id,
            patientId: '00000000-0000-0000-0000-000000000001',
            patientName: bookingForm.patientName,
            patientPhone: bookingForm.patientPhone,
            reason: bookingForm.reason || `Bed booking at ${hospital.name}`,
            bedType: 'general',
          }),
        });
      }
      setBookingStatus('success');
      setTimeout(() => setBookingModal({ isOpen: false, type: null, hospital: null }), 2500);
    } catch (err) {
      console.error('Booking failed:', err);
      setBookingStatus('error');
      setTimeout(() => setBookingStatus('idle'), 3000);
    }
  };

  const filteredHospitals = useMemo(() => {
    let result = [...hospitals];
    
    if (activeFilter === 'ICU Bed') result = result.filter(h => h.resources.icuBeds > 0);
    else if (activeFilter === 'Oxygen') result = result.filter(h => h.resources.oxygenCylinders > 0);
    else if (activeFilter === 'Blood Bank') result = result.filter(h => h.resources.bloodAvailable !== 'None');
    else if (activeFilter === 'Ambulance') result = result.filter(h => h.resources.ambulances > 0);
    
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(h => h.name.toLowerCase().includes(q));
    }

    if (userLoc) {
      result = result.map(h => {
        const distKm = calculateDistance(userLoc.lat, userLoc.lng, h.lat, h.lng);
        return {
          ...h,
          distance: Number(distKm.toFixed(1)),
          driveTime: Math.ceil(distKm * 2.5) + 2
        };
      });
      result.sort((a, b) => a.distance - b.distance);
    }

    return result;
  }, [activeFilter, searchQuery, userLoc, hospitals]);

  const selectedHospital = filteredHospitals.find(h => h.id === expandedHospitalId) || null;

  const handleCardClick = (hospital: Hospital) => {
    setExpandedHospitalId(prev => prev === hospital.id ? null : hospital.id);
  };

  return (
    <div className="h-screen overflow-hidden bg-[#071E1A] text-gray-100 flex flex-col font-sans">
      {/* Top Navbar */}
      <nav className="flex items-center justify-between px-4 py-2.5 bg-[#0A2924] border-b border-teal-900/50 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-pink-500/20 p-1.5 rounded-lg">
            <Building2 className="text-pink-400 w-5 h-5" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">LifeLink</span>
        </div>

        <div className="hidden md:flex items-center gap-2">
          {filters.map((f) => (
            <button
               key={f}
              onClick={() => {
                setActiveFilter(activeFilter === f ? null : f);
                scrollToTop();
              }}
              className={`px-3 py-1.5 rounded-full text-[13px] font-medium transition-all ${
                activeFilter === f 
                  ? 'bg-teal-500 text-white shadow-[0_0_15px_rgba(20,184,166,0.5)]' 
                  : 'bg-teal-900/40 text-teal-100 hover:bg-teal-800/60 border border-teal-700/50'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800/50 rounded-full text-emerald-400 text-xs font-semibold shadow-[0_0_10px_rgba(16,185,129,0.2)]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            System Live
          </div>
          <button onClick={() => (window as any).__lifeLinkLogout?.()} className="flex items-center gap-1.5 px-3 py-1.5 text-rose-400 hover:text-rose-300 hover:bg-rose-950/30 rounded-lg transition-colors border border-rose-900/30">
            <LogOut className="w-3.5 h-3.5" />
            <span className="text-xs font-semibold">Logout</span>
          </button>
        </div>
      </nav>

      <main className="flex-1 flex flex-col lg:flex-row p-4 gap-4 min-h-0 overflow-hidden">
        {/* Left: Map */}
        <div className="w-full lg:w-[65%] flex flex-col gap-4 h-full min-h-0 overflow-hidden">
          {/* Header Banner */}
          <div className="flex items-center justify-between bg-[#0C322C] p-4 rounded-xl border border-teal-800/40 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-48 h-48 bg-teal-500/5 blur-[80px] rounded-full pointer-events-none"></div>
            <div className="z-10">
              <h1 className="text-2xl font-extrabold text-white mb-1">Public Portal</h1>
              <p className="text-teal-200/80 text-xs">Locate nearby facilities and request instant help.</p>
            </div>
            {sosStatus === 'idle' || !sosStatus ? (
              <button
                onClick={() => { setSosModalOpen(true); setSosStatus('idle'); setSosForm({ name: '', condition: '', severity: 'critical', isAccident: false }); }}
                className="z-10 flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-500 hover:to-rose-400 text-white rounded-lg font-bold text-sm shadow-[0_0_20px_rgba(225,29,72,0.4)] transition-all hover:scale-[1.02] animate-pulse"
              >
                <AlertTriangle className="w-4 h-4" />
                EMERGENCY SOS
              </button>
            ) : (
              <button
                onClick={() => setSosModalOpen(true)}
                className={`z-10 flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all hover:scale-[1.02] ${
                  (sosStatus as any) === 'arrived'
                    ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-[0_0_20px_rgba(16,185,129,0.5)]'
                    : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-[0_0_20px_rgba(217,119,6,0.5)] animate-pulse'
                }`}
              >
                {(sosStatus as any) === 'arrived'
                  ? <><CheckCircle className="w-4 h-4" />🚑 Arrived</>
                  : <><Activity className="w-4 h-4" />Track SOS</>
                }
              </button>
            )}
          </div>

          {/* Map */}
          <div className="flex-1 min-h-0 rounded-xl border border-teal-800/40 relative shadow-2xl bg-[#09221E] overflow-hidden">
            {locating ? (
              <div className="absolute inset-0 z-50 bg-[#0C322C]/90 backdrop-blur-md flex flex-col items-center justify-center text-teal-300">
                <Crosshair className="w-10 h-10 mb-4 animate-spin-slow" />
                <h2 className="text-xl font-bold text-white mb-2">Acquiring GPS Location...</h2>
                <p className="text-sm">For accurate emergency dispatch route calculation.</p>
              </div>
            ) : userLoc && (
              <MapContainer 
                center={[userLoc.lat, userLoc.lng]} 
                zoom={11} 
                style={{ height: '100%', width: '100%', zIndex: 10 }}
                zoomControl={false}
              >
                <MapController 
                  center={selectedHospital ? [selectedHospital.lat, selectedHospital.lng] : [userLoc.lat, userLoc.lng]} 
                  zoom={selectedHospital ? 14 : 11} 
                />
                <TileLayer
                  attribution='&copy; <a href="https://www.google.com/maps">Google Maps</a>'
                  url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
                />
                <ZoomControl position="topleft" />
                <Marker position={[userLoc.lat, userLoc.lng]} icon={customPulseIcon}>
                  <Popup className="dark-popup">
                    <div className="font-bold text-emerald-600">Current Location</div>
                  </Popup>
                </Marker>
                {/* Live ambulance tracking marker */}
                {driverTrackingLoc && (
                  <Marker position={[driverTrackingLoc.lat, driverTrackingLoc.lng]} icon={liveAmbulanceIcon}>
                    <Tooltip permanent interactive={false} direction="top">
                      <div className="font-bold text-blue-700">🚑 Ambulance En Route</div>
                    </Tooltip>
                  </Marker>
                )}
                {filteredHospitals.map(hospital => (
                  <Marker key={hospital.id} position={[hospital.lat, hospital.lng]} icon={hospitalIcon}>
                    <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent className="custom-map-tooltip">
                      {hospital.name}
                    </Tooltip>
                    <Popup className="dark-popup">
                      <div className="font-bold text-white mb-1">{hospital.name}</div>
                      <div className="text-xs font-semibold text-teal-300 mb-0.5">~{hospital.distance} km away</div>
                      <div className="text-xs text-rose-400 font-bold mb-2">Drive Time: {hospital.driveTime} min</div>
                      <button 
                         onClick={() => handleNavigate(hospital)}
                         className="w-full py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs transition-colors"
                      >
                        Start Navigation
                      </button>
                    </Popup>
                  </Marker>
                ))}
              </MapContainer>
            )}

            {locError && (
              <div className="absolute top-4 right-4 bg-rose-950/90 border border-rose-800 text-rose-200 px-4 py-2 rounded-lg text-xs z-[2000] shadow-lg flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5" />
                {locError}
              </div>
            )}

            <div className="absolute bottom-4 right-4 px-3 py-1.5 bg-[#071E1A]/90 backdrop-blur-sm text-xs font-semibold text-teal-400/80 rounded-full shadow border border-teal-800/50 z-[1000] drop-shadow-xl">
              Live Map Area Active
            </div>
          </div>
        </div>

        {/* Right: Hospital List */}
        <div className="w-full lg:w-[420px] lg:flex-1 shrink-0 pb-2 flex flex-col h-full rounded-xl min-h-0">
          <div className="flex items-center justify-between mb-2 px-1">
            <h2 className="text-lg font-bold text-white">Facilities Near You</h2>
            <button 
              onClick={() => {
                setSearchQuery('');
                setActiveFilter(null);
                setExpandedHospitalId(null);
                setTimeout(() => scrollToTop(), 50);
              }}
              className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-teal-300 hover:text-teal-100 transition-colors bg-teal-900/30 px-2 py-1 rounded-md border border-teal-800/30 shadow-sm active:scale-95"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh
            </button>
          </div>

          <div className="mb-3 relative shrink-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-500/80" />
            <input 
              type="text" 
              placeholder="Search hospitals..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#0C322C] border border-teal-800/40 text-teal-50 px-9 py-2.5 rounded-lg outline-none focus:border-teal-500/60 focus:ring-1 focus:ring-teal-500/60 transition-all placeholder:text-teal-600 shadow-inner text-sm"
            />
          </div>

          {/* Hospital Cards */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pr-2 customized-scrollbar pb-2 block">
            {filteredHospitals.map(hospital => (
              <div key={hospital.id}>
                {expandedHospitalId === hospital.id ? (
                  <ExpandedHospitalCard
                    hospital={hospital}
                    onClose={() => setExpandedHospitalId(null)}
                    onNavigate={handleNavigate}
                    onCall={handleCall}
                    onBook={handleBook}
                    onKnowMore={(h) => setKnowMoreHospital(h)}
                  />
                ) : (
                  <CollapsedHospitalCard
                    hospital={hospital}
                    isSelected={expandedHospitalId === hospital.id}
                    onClick={() => handleCardClick(hospital)}
                    onNavigate={handleNavigate}
                    onCall={handleCall}
                    onBook={handleBook}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* SOS Modal */}
      {sosModalOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071E1A]/90 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-gradient-to-br from-rose-950 to-[#0A1A17] border border-rose-800 shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden shadow-[0_0_50px_rgba(225,29,72,0.2)]">
            <div className="bg-rose-600 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-white tracking-widest uppercase flex items-center gap-2">
                <AlertTriangle className="w-5 h-5"/> Emergency SOS
              </h2>
              <button onClick={() => setSosModalOpen(false)} className="text-rose-200 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            
            <div className="p-6 space-y-4">

              {/* SOS Status Progress Bar — shown during pending/accepted/arrived */}
              {(sosStatus === 'pending' || sosStatus === 'accepted' || (sosStatus as any) === 'arrived') && (
                <div className="mb-2">
                  {/* Stage labels */}
                  <div className="flex justify-between mb-2">
                    {[
                      { key: 'pending',  label: 'SOS Sent',     icon: '📡' },
                      { key: 'accepted', label: 'Driver Found',  icon: '🚑' },
                      { key: 'enroute',  label: 'En Route',      icon: '🛣️' },
                      { key: 'arrived',  label: 'Arrived',       icon: '✅' },
                    ].map((stage, idx) => {
                      const stageOrder = ['pending','accepted','enroute','arrived'];
                      const currentOrder = sosStatus === 'pending' ? 0 : sosStatus === 'accepted' ? 1 : (sosStatus as any) === 'enroute' ? 2 : (sosStatus as any) === 'arrived' ? 3 : 0;
                      const isActive = idx <= currentOrder;
                      return (
                        <div key={stage.key} className="flex flex-col items-center gap-1 flex-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base border-2 transition-all duration-500 ${isActive ? 'border-rose-500 bg-rose-900/60 shadow-[0_0_12px_rgba(225,29,72,0.4)]' : 'border-gray-700 bg-gray-900 opacity-40'}`}>
                            {stage.icon}
                          </div>
                          <span className={`text-[9px] font-bold uppercase tracking-wider ${isActive ? 'text-rose-300' : 'text-gray-600'}`}>{stage.label}</span>
                        </div>
                      );
                    })}
                  </div>
                  {/* Progress bar track */}
                  <div className="relative h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700 ease-out"
                      style={{
                        width: sosStatus === 'pending' ? '12%' : sosStatus === 'accepted' ? '40%' : (sosStatus as any) === 'enroute' ? '72%' : (sosStatus as any) === 'arrived' ? '100%' : '12%',
                        background: (sosStatus as any) === 'arrived'
                          ? 'linear-gradient(90deg, #10b981, #34d399)'
                          : 'linear-gradient(90deg, #e11d48, #f43f5e, #fb7185)',
                        boxShadow: (sosStatus as any) === 'arrived' ? '0 0 12px rgba(16,185,129,0.6)' : '0 0 12px rgba(225,29,72,0.5)',
                      }}
                    />
                    {/* Moving ambulance dot */}
                    {sosStatus !== ('arrived' as any) && (
                      <div
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white rounded-full shadow-lg text-[8px] flex items-center justify-center animate-pulse transition-all duration-700"
                        style={{ left: sosStatus === 'pending' ? '12%' : sosStatus === 'accepted' ? '40%' : (sosStatus as any) === 'enroute' ? '72%' : '12%' }}
                      >🚑</div>
                    )}
                  </div>
                  <div className="text-center mt-2">
                    <span className={`text-xs font-bold ${(sosStatus as any) === 'arrived' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {sosStatus === 'pending' && '🔴 Broadcasting SOS — Finding nearest driver…'}
                      {sosStatus === 'accepted' && '🚑 Driver accepted — Ambulance is on the way!'}
                      {(sosStatus as any) === 'enroute' && '📍 Tracking live — Ambulance approaching your location…'}
                      {(sosStatus as any) === 'arrived' && '✅ Ambulance has arrived at your location!'}
                    </span>
                  </div>
                </div>
              )}

              {sosStatus === 'idle' && (
                <>
                  <div>
                    <label className="block text-rose-200 text-xs font-bold uppercase tracking-wider mb-2">Patient Name</label>
                    <input 
                      type="text" 
                      value={sosForm.name}
                      onChange={e => setSosForm(prev => ({...prev, name: e.target.value}))}
                      className="w-full bg-[#05110E] border border-rose-900/50 rounded-lg px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                      placeholder="e.g. Rahul Verma"
                    />
                  </div>
                  <div>
                    <label className="block text-rose-200 text-xs font-bold uppercase tracking-wider mb-2">Health Issue</label>
                    <input 
                      type="text" 
                      value={sosForm.condition}
                      onChange={e => setSosForm(prev => ({...prev, condition: e.target.value}))}
                      className="w-full bg-[#05110E] border border-rose-900/50 rounded-lg px-4 py-3 text-white focus:border-rose-500 focus:outline-none"
                      placeholder="e.g. Cardiac Arrest, Severe Bleeding"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-rose-200 text-xs font-bold uppercase tracking-wider mb-2">Severity</label>
                      <select 
                        value={sosForm.severity}
                        onChange={e => setSosForm(prev => ({...prev, severity: e.target.value}))}
                        className="w-full bg-[#05110E] border border-rose-900/50 rounded-lg px-4 py-3 text-white focus:border-rose-500 focus:outline-none appearance-none"
                      >
                        <option value="low">Low</option>
                        <option value="moderate">Moderate</option>
                        <option value="critical">Critical</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-rose-200 text-xs font-bold uppercase tracking-wider mb-2">Type</label>
                      <div className="h-[46px] flex items-center gap-3 bg-[#05110E] border border-rose-900/50 rounded-lg px-4">
                        <input 
                          type="checkbox" 
                          id="accident"
                          checked={sosForm.isAccident}
                          onChange={e => setSosForm(prev => ({...prev, isAccident: e.target.checked}))}
                          className="w-4 h-4 accent-rose-500 rounded border-gray-700 bg-gray-900"
                        />
                        <label htmlFor="accident" className="text-sm font-semibold text-rose-100 cursor-pointer">Road Accident</label>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={submitSosRequest}
                    className="w-full mt-4 bg-rose-600 hover:bg-rose-500 text-white font-extrabold uppercase tracking-widest py-4 rounded-xl shadow-lg shadow-rose-900/50 transition-all flex items-center justify-center gap-2 text-lg active:scale-95"
                  >
                    Broadcast SOS
                  </button>
                </>
              )}
              
              {sosStatus === 'pending' && (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-full border-4 border-t-rose-500 border-rose-950 animate-spin mx-auto mb-6"></div>
                  <h3 className="text-2xl font-extrabold text-white mb-2">SOS Broadcasted!</h3>
                  <p className="text-rose-200 font-medium">Scanning for the nearest available ambulance line... Please hold on.</p>
                </div>
              )}
              
              {sosStatus === 'accepted' && sosDriverInfo && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-teal-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border border-teal-500 shadow-[0_0_30px_rgba(20,184,166,0.3)]">
                    <CheckCircle className="w-10 h-10 text-teal-400" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2">Ambulance Dispatched!</h3>
                  <p className="text-teal-200 font-medium mb-6">An emergency vehicle is en route to your location.</p>
                  
                  <div className="bg-[#05110E] p-4 rounded-xl border border-teal-900 text-left">
                    <div className="flex items-center gap-3 mb-4 break-all">
                      <div className="bg-teal-900/50 p-2 rounded-lg"><User className="text-teal-400 w-5 h-5"/></div>
                      <div>
                        <div className="text-[10px] text-teal-400 uppercase font-bold tracking-widest">Responder</div>
                        <div className="font-bold text-white text-lg">{sosDriverInfo.name}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div>
                        <div className="text-[10px] text-teal-400 uppercase font-bold tracking-widest mb-1">Vehicle</div>
                        <div className="font-bold text-gray-200 flex items-center gap-2"><Car className="w-4 h-4"/> {sosDriverInfo.vehicle}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-teal-400 uppercase font-bold tracking-widest mb-1">ETA</div>
                        <div className="font-bold text-gray-200 flex items-center gap-2"><Clock className="w-4 h-4"/> {sosDriverInfo.eta}</div>
                      </div>
                    </div>
                    <a href={`tel:${sosDriverInfo.phone}`} className="flex items-center justify-center w-full py-3 bg-teal-500 hover:bg-teal-400 text-white rounded-lg font-bold transition-all shadow-lg gap-2 cursor-pointer">
                      <Phone className="w-4 h-4" />
                      Contact Driver
                    </a>
                  </div>
                  
                  <button onClick={() => setSosModalOpen(false)} className="w-full py-3 mt-4 bg-transparent border border-gray-600 text-gray-400 rounded-xl hover:bg-gray-800 hover:text-white transition-all font-bold">
                     Hide Tracker
                   </button>
                  <button onClick={() => {setSosModalOpen(false); setSosStatus('idle');}} className="w-full py-3 mt-2 bg-transparent text-gray-500 hover:text-rose-400 transition-all font-bold text-sm">
                    Done (Reset)
                  </button>
                </div>
              )}

              {/* Arrived Screen */}
              {(sosStatus as any) === 'arrived' && (
                <div className="text-center py-6">
                  <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 border-2 border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.4)] animate-pulse">
                    <CheckCircle className="w-10 h-10 text-emerald-400" />
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-2">🚑 Ambulance Arrived!</h3>
                  <p className="text-emerald-300 font-medium mb-6">Your ambulance is here. Please prepare to be assisted.</p>
                  {sosDriverInfo && (
                    <div className="bg-[#05110E] p-4 rounded-xl border border-emerald-900/60 text-left mb-4">
                      <div className="text-[10px] text-emerald-500 uppercase tracking-widest font-bold mb-1">Driver</div>
                      <div className="font-bold text-white">{sosDriverInfo.name} · {sosDriverInfo.vehicle}</div>
                      <div className="text-sm text-teal-300 mt-1">{sosDriverInfo.phone}</div>
                    </div>
                  )}
                  <button onClick={() => {
                    setSosModalOpen(false);
                    setSosStatus('idle');
                    setSosDriverInfo(null);
                    setDriverTrackingLoc(null);
                    localStorage.removeItem('lifelink_ambulance_arrived');
                    localStorage.removeItem('lifelink_sos_dispatch');
                  }} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-bold transition-all">
                    ✓ Okay — Reset SOS
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Phase 3: Know More Full-Screen Modal */}
      {knowMoreHospital && (
        <KnowMoreModal
          hospital={knowMoreHospital}
          userLoc={userLoc}
          onClose={() => setKnowMoreHospital(null)}
          onNavigate={handleNavigate}
          onCall={handleCall}
          onBook={(type, h) => {
            setKnowMoreHospital(null);
            handleBook(type, h);
          }}
        />
      )}

      {/* Booking Modal */}
      {bookingModal.isOpen && bookingModal.hospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071E1A]/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-[#0C322C] border border-teal-700/50 shadow-2xl rounded-2xl w-full max-w-md overflow-hidden shadow-[0_0_50px_rgba(20,184,166,0.15)] relative">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h3 className="text-xl font-bold text-white">
                  {bookingModal.type === 'Appt' ? 'Book Clinical Appointment' : 'Reserve Emergency Bed'}
                </h3>
                <button 
                  onClick={() => setBookingModal({ isOpen: false, type: null, hospital: null })}
                  className="text-teal-400 hover:text-white transition-colors"
                >×</button>
              </div>

              <div className="bg-[#09221E] rounded-xl p-4 mb-6 border border-teal-800/40">
                <p className="text-teal-200 text-sm mb-1">Target Facility</p>
                <p className="text-white font-semibold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-teal-400" />
                  {bookingModal.hospital.name}
                </p>
                <div className="mt-4 pt-4 border-t border-teal-800/30 flex justify-between text-xs text-teal-300">
                  <span>Distance: {bookingModal.hospital.distance} km</span>
                  <span>{bookingModal.type === 'Bed' ? `Available ICU: ${bookingModal.hospital.resources.icuBeds}` : 'General OPD Open'}</span>
                </div>
              </div>

              {bookingStatus === 'success' ? (
                <div className="text-center py-4 text-emerald-400 animate-in zoom-in slide-in-from-bottom-2">
                  <div className="mx-auto w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center mb-3">
                    ✔
                  </div>
                  <p className="font-bold text-lg text-white">Booking Confirmed!</p>
                  <p className="text-sm mt-1">Notification sent to hospital administration.</p>
                </div>
              ) : bookingStatus === 'error' ? (
                <div className="text-center py-4 text-rose-400">
                  <div className="mx-auto w-12 h-12 bg-rose-500/20 rounded-full flex items-center justify-center mb-3">
                    ✗
                  </div>
                  <p className="font-bold text-lg text-white">Booking Failed</p>
                  <p className="text-sm mt-1">Please try again. Server may be offline.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <label className="text-teal-100 text-sm font-medium">Patient Details</label>
                  <input 
                    type="text" 
                    placeholder="Full Name *" 
                    value={bookingForm.patientName}
                    onChange={(e) => setBookingForm(prev => ({...prev, patientName: e.target.value}))}
                    className="w-full bg-[#071E1A] border border-teal-800/60 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-500 placeholder:text-teal-700"
                  />
                  <input 
                    type="tel" 
                    placeholder="Phone Number" 
                    value={bookingForm.patientPhone}
                    onChange={(e) => setBookingForm(prev => ({...prev, patientPhone: e.target.value}))}
                    className="w-full bg-[#071E1A] border border-teal-800/60 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-500 placeholder:text-teal-700"
                  />
                  <textarea 
                    placeholder={bookingModal.type === 'Appt' ? 'Reason for visit' : 'Medical condition / notes'}
                    value={bookingForm.reason}
                    onChange={(e) => setBookingForm(prev => ({...prev, reason: e.target.value}))}
                    className="w-full bg-[#071E1A] border border-teal-800/60 rounded-lg px-4 py-2.5 text-white outline-none focus:border-teal-500 placeholder:text-teal-700 resize-none h-20"
                  />
                  
                  <button 
                    onClick={confirmBooking}
                    disabled={!bookingForm.patientName.trim() || bookingStatus === 'loading'}
                    className={`w-full py-3 rounded-xl font-bold transition-all shadow-lg mt-2 flex justify-center items-center gap-2 ${
                      bookingStatus === 'loading' 
                        ? 'bg-teal-700 text-teal-100 cursor-wait' 
                        : !bookingForm.patientName.trim()
                          ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                          : bookingModal.type === 'Bed' 
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                            : 'bg-teal-500 hover:bg-teal-400 text-white'
                    }`}
                  >
                    {bookingStatus === 'loading' ? (
                      <span className="animate-pulse">Processing Request...</span>
                    ) : (
                      <>{bookingModal.type === 'Appt' ? <CalendarCheck className="w-5 h-5"/> : <BedDouble className="w-5 h-5"/>} Confirm {bookingModal.type === 'Appt' ? 'Appointment' : 'Reservation'}</>
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scrollbar styles */}
      <style>{`
        .customized-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .customized-scrollbar::-webkit-scrollbar-track {
          background: #0C322C;
          border-radius: 8px;
        }
        .customized-scrollbar::-webkit-scrollbar-thumb {
          background: #14B8A6;
          border-radius: 8px;
        }
        .customized-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0D9488;
        }
      `}</style>
    </div>
  );
}