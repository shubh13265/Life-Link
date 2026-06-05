import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import { AlertTriangle, MapPin, Navigation, Phone, CheckCircle, Clock, User, Power, BellRing, Building2, Bed, Wind, Droplets, Star, X, Save, Car, Crosshair } from 'lucide-react';
import 'leaflet/dist/leaflet.css';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const API_URL = 'http://localhost:5000';
const DEMO_DRIVER_ID = '00000000-0000-0000-0000-000000000002';

// Fallback hospitals if API is unreachable
const FALLBACK_HOSPITALS = [
  { id: 'h1', name: 'AIIMS New Delhi', distance: '2.1 km', eta: '5 mins', beds: 45, icuBeds: 12, oxygen: 30, bloodBank: true, doctors: 120, rating: 4.9, specializations: ['Cardiology','Neurology','Trauma'], address: 'Sri Aurobindo Marg, Ansari Nagar', phone: '011-26588500', lat: 28.5672, lng: 77.2100 },
  { id: 'h2', name: 'Safdarjung Hospital', distance: '3.4 km', eta: '8 mins', beds: 12, icuBeds: 4, oxygen: 15, bloodBank: true, doctors: 80, rating: 4.5, specializations: ['Emergency','Surgery','Orthopedics'], address: 'Sri Aurobindo Marg, New Delhi', phone: '011-26707444', lat: 28.5694, lng: 77.2090 },
];

const ambulanceIcon = L.divIcon({ className:'', html:`<div style="background:#2563eb;border-radius:50%;padding:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4);animation:pulse 2s infinite"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/></svg></div>`, iconSize:[36,36], iconAnchor:[18,18] });
const patientIcon = L.divIcon({ className:'', html:`<div style="background:#e11d48;border-radius:50%;padding:8px;border:2px solid white;box-shadow:0 2px 8px rgba(0,0,0,0.4)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>`, iconSize:[36,36], iconAnchor:[18,18] });

function MapUpdater({ bounds }: { bounds: L.LatLngBoundsExpression }) {
  const map = useMap();
  useEffect(() => { if (bounds) map.fitBounds(bounds, { padding:[50,50] }); }, [bounds, map]);
  return null;
}

export default function AmbulancePortal() {
  const [isOnDuty, setIsOnDuty] = useState(false);
  const [missionState, setMissionState] = useState<'IDLE'|'DISPATCHED'|'ACCEPTED'|'EN_ROUTE'|'ON_SCENE'|'TRANSPORTING'|'COMPLETED'>('IDLE');
  const [informedHospitals, setInformedHospitals] = useState<Record<string,string>>({});
  const [activeDispatch, setActiveDispatch] = useState<any>(null);
  const [navigatingTo, setNavigatingTo] = useState<{name:string;lat:number;lng:number}|null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [driver, setDriver] = useState({ name:'Rajesh Kumar', phone:'+91-9876543210', vehicle:'DL-1AB-4321', association:'Government Hospital', licenseNo:'DL-2019-0012345' });
  const [draftDriver, setDraftDriver] = useState(driver);
  const [driverLoc, setDriverLoc] = useState<{lat:number;lng:number}>({ lat: 28.6143, lng: 77.2023 });
  const [locating, setLocating] = useState(true);
  const [locPermDenied, setLocPermDenied] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number,number][]>([]);
  const [navRoutePoints, setNavRoutePoints] = useState<[number,number][]>([]);
  const arrivedTimer = useRef<ReturnType<typeof setTimeout>|null>(null);

  // Real hospital data from API
  const [hospitals, setHospitals] = useState<any[]>(FALLBACK_HOSPITALS);

  useEffect(() => {
    fetch(`${API_URL}/api/hospitals`)
      .then(r => r.json())
      .then(data => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          setHospitals(data.data.map((h: any) => ({
            id: h.id,
            name: h.name,
            distance: '—',
            eta: '—',
            beds: Number(h.totalBeds ?? 0),
            icuBeds: Number(h.icu_beds_available ?? h.icuBeds ?? 0),
            oxygen: Number(h.oxygen_cylinders_available ?? 0),
            bloodBank: true,
            doctors: Number(h.doctors ?? 0),
            rating: 4.5,
            specializations: h.specializations || [],
            address: [h.address, h.city].filter(Boolean).join(', '),
            phone: h.phone || h.contactPhone || '',
            lat: Number(h.latitude) || 28.6139,
            lng: Number(h.longitude) || 77.2090,
          })));
        }
      })
      .catch(() => { /* keep fallback */ });

    // Live inventory updates from Hospital Portal
    socket.on('hospital_inventory_update', (data: any) => {
      if (!data?.hospitalId || !data?.resources) return;
      setHospitals(prev => prev.map(h =>
        h.id === data.hospitalId
          ? { ...h,
              beds: data.resources.generalBeds ?? h.beds,
              icuBeds: data.resources.icuBeds ?? h.icuBeds,
              oxygen: data.resources.oxygenCylinders ?? h.oxygen,
            }
          : h
      ));
    });
    return () => { socket.off('hospital_inventory_update'); };
  }, []);

  // Get real driver GPS location (required for tracking)
  useEffect(() => {
    if (!navigator.geolocation) { setLocating(false); setLocPermDenied(true); return; }
    const watcher = navigator.geolocation.watchPosition(
      (pos) => { setDriverLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); setLocPermDenied(false); },
      (err) => { setLocating(false); if (err.code === 1) setLocPermDenied(true); },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 3000 }
    );
    return () => navigator.geolocation.clearWatch(watcher);
  }, []);

  // Fetch hospital nav route when navigatingTo changes
  useEffect(() => {
    if (!navigatingTo) { setNavRoutePoints([]); return; }
    fetch(`https://router.project-osrm.org/route/v1/driving/${driverLoc.lng},${driverLoc.lat};${navigatingTo.lng},${navigatingTo.lat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) setNavRoutePoints(data.routes[0].geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng] as [number,number]));
        else setNavRoutePoints([[driverLoc.lat,driverLoc.lng],[navigatingTo.lat,navigatingTo.lng]]);
      })
      .catch(() => setNavRoutePoints([[driverLoc.lat,driverLoc.lng],[navigatingTo.lat,navigatingTo.lng]]));
  }, [navigatingTo, driverLoc]);

  // Fetch OSRM patient route only when driver and patient are far apart (>200m)
  useEffect(() => {
    const activeStates = ['ACCEPTED','EN_ROUTE','ON_SCENE'];
    if (!activeStates.includes(missionState) || !activeDispatch) { setRoutePoints([]); return; }
    const { lat: pLat, lng: pLng } = activeDispatch.loc;
    // Haversine distance check
    const R = 6371000;
    const dLat = (pLat - driverLoc.lat) * Math.PI / 180;
    const dLng = (pLng - driverLoc.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(driverLoc.lat*Math.PI/180)*Math.cos(pLat*Math.PI/180)*Math.sin(dLng/2)**2;
    const distMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    // Only draw route if distance > 200m (otherwise same-device = already arrived)
    if (distMeters < 200) { setRoutePoints([]); return; }
    fetch(`https://router.project-osrm.org/route/v1/driving/${driverLoc.lng},${driverLoc.lat};${pLng},${pLat}?overview=full&geometries=geojson`)
      .then(r => r.json())
      .then(data => {
        if (data.routes?.[0]) setRoutePoints(data.routes[0].geometry.coordinates.map(([lng,lat]:[number,number])=>[lat,lng] as [number,number]));
        else setRoutePoints([[driverLoc.lat,driverLoc.lng],[pLat,pLng]]);
      })
      .catch(() => setRoutePoints([[driverLoc.lat,driverLoc.lng],[pLat,pLng]]));
  }, [missionState, activeDispatch, driverLoc]);

  // Emit live location every 3s when EN_ROUTE; detect arrival by real Haversine distance
  useEffect(() => {
    if (missionState !== 'EN_ROUTE' || !activeDispatch) return;
    const interval = setInterval(() => {
      socket.emit('driver_location_update', {
        dispatchId: activeDispatch.id,
        lat: driverLoc.lat,
        lng: driverLoc.lng,
        driverInfo: { name: driver.name, phone: driver.phone, vehicle: driver.vehicle },
      });
      const R = 6371000;
      const dLat = (activeDispatch.loc.lat - driverLoc.lat) * Math.PI / 180;
      const dLng = (activeDispatch.loc.lng - driverLoc.lng) * Math.PI / 180;
      const a = Math.sin(dLat/2)**2 + Math.cos(driverLoc.lat*Math.PI/180)*Math.cos(activeDispatch.loc.lat*Math.PI/180)*Math.sin(dLng/2)**2;
      const distMeters = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      if (distMeters < 200) {
        if (arrivedTimer.current) return;
        arrivedTimer.current = setTimeout(() => {
          socket.emit('ambulance_arrived', { dispatchId: activeDispatch.id, driverInfo: { name: driver.name, phone: driver.phone, vehicle: driver.vehicle } });
          setMissionState('ON_SCENE');
          arrivedTimer.current = null;
        }, 5000);
      } else {
        if (arrivedTimer.current) { clearTimeout(arrivedTimer.current); arrivedTimer.current = null; }
      }
    }, 3000);
    // If already at same location when entering EN_ROUTE, fire immediately
    const R0 = 6371000;
    const dLat0 = (activeDispatch.loc.lat - driverLoc.lat) * Math.PI / 180;
    const dLng0 = (activeDispatch.loc.lng - driverLoc.lng) * Math.PI / 180;
    const a0 = Math.sin(dLat0/2)**2 + Math.cos(driverLoc.lat*Math.PI/180)*Math.cos(activeDispatch.loc.lat*Math.PI/180)*Math.sin(dLng0/2)**2;
    const initDist = R0 * 2 * Math.atan2(Math.sqrt(a0), Math.sqrt(1-a0));
    if (initDist < 200 && !arrivedTimer.current) {
      arrivedTimer.current = setTimeout(() => {
        const arrivedPayload = { dispatchId: activeDispatch.id, driverInfo: { name: driver.name, phone: driver.phone, vehicle: driver.vehicle } };
        socket.emit('ambulance_arrived', arrivedPayload);
        // Also notify same-browser tabs via localStorage
        localStorage.setItem('lifelink_ambulance_arrived', JSON.stringify(arrivedPayload));
        window.dispatchEvent(new Event('storage'));
        setMissionState('ON_SCENE');
        arrivedTimer.current = null;
      }, 5000);
    }
    return () => { clearInterval(interval); if (arrivedTimer.current) { clearTimeout(arrivedTimer.current); arrivedTimer.current = null; } };
  }, [missionState, activeDispatch, driverLoc, driver]);

  useEffect(() => { if(missionState==='IDLE'){ setInformedHospitals({}); setNavigatingTo(null); } }, [missionState]);

  useEffect(() => {
    const onResponse = (data:any) => { if(data?.status) setInformedHospitals(prev=>({...prev,[data.hospital_id]:data.status})); };
    socket.on('notification_response', onResponse);
    return () => { socket.off('notification_response', onResponse); };
  }, []);

  useEffect(() => {
    const handle = (parsed:any) => {
      if(parsed?.status==='PENDING' && missionState==='IDLE' && isOnDuty) {
        setActiveDispatch({ id:parsed.id, patientName:parsed.patientInfo?.name||'Unknown', age:35, condition:parsed.patientInfo?.condition||'Emergency', bloodGroup:'O+', distance:'2.5 km', eta:'8 mins', loc:parsed.patientInfo?.loc||{lat:28.621,lng:77.21}, phone:'+91-UNKNOWN', timestamp:parsed.timestamp });
        setMissionState('DISPATCHED');
      }
    };
    const checkLocal = () => { const d=localStorage.getItem('lifelink_sos_dispatch'); if(d) handle(JSON.parse(d)); };
    if(isOnDuty && missionState==='IDLE') checkLocal();
    window.addEventListener('storage', checkLocal);
    socket.on('sos_dispatch', handle);
    return () => { window.removeEventListener('storage', checkLocal); socket.off('sos_dispatch', handle); };
  }, [isOnDuty, missionState]);

  const getMapBounds = () => {
    if ((missionState==='IDLE'||missionState==='COMPLETED'||!activeDispatch)) return L.latLngBounds([driverLoc]);
    return L.latLngBounds([driverLoc, activeDispatch.loc]);
  };

  const handleAction = () => {
    switch(missionState) {
      case 'DISPATCHED': {
        setMissionState('ACCEPTED');
        const payload = { id:activeDispatch.id, status:'ACCEPTED', driverInfo:{ name:driver.name, phone:driver.phone, vehicle:driver.vehicle, eta:activeDispatch.eta, loc:driverLoc }, patientInfo:activeDispatch };
        localStorage.setItem('lifelink_sos_dispatch', JSON.stringify(payload));
        window.dispatchEvent(new Event('storage'));
        socket.emit('sos_accepted', payload);
        setTimeout(() => setMissionState('EN_ROUTE'), 1500);
        break;
      }
      // EN_ROUTE auto-transitions to ON_SCENE via location detection; manual override below
      case 'EN_ROUTE': {
        socket.emit('ambulance_arrived', { dispatchId: activeDispatch.id, driverInfo: { name: driver.name, phone: driver.phone, vehicle: driver.vehicle } });
        setMissionState('ON_SCENE');
        break;
      }
      case 'ON_SCENE': setMissionState('TRANSPORTING'); break;
      case 'TRANSPORTING': setMissionState('COMPLETED'); setTimeout(()=>{ setMissionState('IDLE'); setActiveDispatch(null); setRoutePoints([]); },4000); break;
    }
  };

  const missionBtnLabel: Record<string,string> = { DISPATCHED:'Accept SOS', EN_ROUTE:'Arrived (Manual)', ON_SCENE:'Patient Picked Up', TRANSPORTING:'Handover Complete' };
  const missionBtnColor: Record<string,string> = { DISPATCHED:'bg-rose-600 hover:bg-rose-500 shadow-rose-900', EN_ROUTE:'bg-teal-700 hover:bg-teal-500', ON_SCENE:'bg-blue-600 hover:bg-blue-500', TRANSPORTING:'bg-emerald-600 hover:bg-emerald-500' };

  return (
    <div className="h-screen flex flex-col bg-[#071E1A] font-sans overflow-hidden">

      {/* ── Location Permission Gate ── */}
      {locPermDenied && (
        <div className="absolute inset-0 z-[99999] bg-[#041512] flex flex-col items-center justify-center p-8 text-center">
          <div className="w-20 h-20 bg-rose-900/30 rounded-full flex items-center justify-center mb-6 border-2 border-rose-600">
            <Crosshair className="w-10 h-10 text-rose-400"/>
          </div>
          <h2 className="text-2xl font-extrabold text-white mb-3">Location Access Required</h2>
          <p className="text-teal-300/70 max-w-sm mb-6">LifeLink needs your real-time GPS location to track your position, show your route to the patient, and detect arrival automatically — just like Rapido or food delivery apps.</p>
          <div className="bg-[#0C322C] border border-teal-800/40 rounded-xl p-4 text-left text-sm text-teal-300 mb-6 max-w-sm w-full">
            <div className="font-bold text-white mb-2">How to enable:</div>
            <ol className="space-y-1 list-decimal list-inside text-teal-400/80">
              <li>Click the 🔒 lock icon in your browser address bar</li>
              <li>Set <strong className="text-white">Location</strong> to <strong className="text-emerald-400">Allow</strong></li>
              <li>Refresh this page</li>
            </ol>
          </div>
          <button onClick={() => window.location.reload()} className="px-8 py-3 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl transition-all">
            Retry after allowing location
          </button>
        </div>
      )}

      {/* ── Navbar ── */}
      <nav className="flex items-center justify-between px-5 py-2.5 bg-[#0A2924] border-b border-teal-900/50 shadow-md shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="bg-blue-500/20 p-1.5 rounded-lg"><Car className="text-blue-400 w-5 h-5"/></div>
          <span className="text-xl font-extrabold text-white tracking-tight">LifeLink</span>
          <span className="text-[10px] font-bold text-teal-500/70 uppercase tracking-widest ml-1 border border-teal-800/50 px-1.5 py-0.5 rounded">Driver</span>
        </div>
        <div className="flex items-center gap-3">
          <button onClick={()=>{setIsOnDuty(v=>!v);}} disabled={missionState!=='IDLE'&&missionState!=='COMPLETED'} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-all disabled:opacity-40 disabled:cursor-not-allowed ${isOnDuty?'bg-rose-500/20 border-rose-500 text-rose-300':'bg-teal-500/20 border-teal-500 text-teal-300'}`}>
            <Power className="w-3.5 h-3.5"/>{isOnDuty?'On Duty':'Go On Duty'}
          </button>
          <button onClick={()=>{setDraftDriver(driver);setProfileOpen(true);}} className="flex items-center gap-2 px-3 py-1.5 bg-[#0C322C] hover:bg-teal-900/50 border border-teal-800/40 rounded-lg text-teal-300 text-xs font-semibold transition-all">
            <User className="w-3.5 h-3.5"/>{driver.name.split(' ')[0]}
          </button>
          <button onClick={() => (window as any).__lifeLinkLogout?.()} className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/30 rounded-lg text-rose-400 hover:text-rose-300 text-xs font-semibold transition-all">
            <Power className="w-3.5 h-3.5"/>Sign Out
          </button>
        </div>
      </nav>

      {/* ── Mission Banner ── */}
      {missionState!=='IDLE' && missionState!=='COMPLETED' && activeDispatch && (
        <div className={`shrink-0 px-4 py-3 border-b flex items-center justify-between gap-4 ${missionState==='DISPATCHED'?'bg-rose-950/60 border-rose-800/60 animate-pulse':'bg-[#0A2924] border-teal-800/40'}`}>
          <div className="flex items-center gap-3">
            <AlertTriangle className={`w-5 h-5 ${missionState==='DISPATCHED'?'text-rose-400':'text-teal-400'}`}/>
            <div>
              <div className="font-extrabold text-white text-sm">{missionState==='DISPATCHED'?'⚠️ URGENT SOS — ':''}{activeDispatch.patientName} · {activeDispatch.condition}</div>
              <div className="text-[10px] text-teal-400/70 uppercase tracking-widest font-bold">{missionState} · ETA {activeDispatch.eta} · {activeDispatch.distance}</div>
            </div>
          </div>
          {missionBtnLabel[missionState] && (
            <button onClick={handleAction} className={`px-5 py-2 rounded-lg text-white text-xs font-bold uppercase tracking-wider shadow-lg transition-all flex items-center gap-2 ${missionBtnColor[missionState]}`}>
              <CheckCircle className="w-4 h-4"/>{missionBtnLabel[missionState]}
            </button>
          )}
          {missionState==='ACCEPTED' && <button onClick={handleAction} className="px-5 py-2 bg-teal-800/50 text-teal-200 text-xs font-bold uppercase tracking-wider rounded-lg border border-teal-600 animate-pulse">Processing…</button>}
        </div>
      )}
      {missionState==='COMPLETED' && (
        <div className="shrink-0 px-4 py-3 bg-emerald-950/40 border-b border-emerald-800/40 flex items-center gap-3 text-emerald-400">
          <CheckCircle className="w-5 h-5"/><span className="font-bold text-sm">Mission Accomplished — Syncing logs…</span>
        </div>
      )}

      {/* ── Main Body ── */}
      <main className="flex-1 flex flex-col lg:flex-row p-3 gap-3 min-h-0 overflow-hidden">

        {/* Left — Map */}
        <div className="w-full lg:w-[62%] flex flex-col gap-3 h-full min-h-0 overflow-hidden">
          <div className="flex-1 min-h-0 rounded-xl border border-teal-800/40 relative shadow-2xl bg-[#09221E] overflow-hidden">
            <MapContainer center={driverLoc} zoom={14} className="w-full h-full z-0" zoomControl={false}>
              <TileLayer attribution="© Google Maps" url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"/>
              {isOnDuty && <Marker position={driverLoc} icon={ambulanceIcon}><Popup closeButton={false}>{driver.name} · {driver.vehicle}</Popup></Marker>}
              {activeDispatch && missionState!=='IDLE' && missionState!=='COMPLETED' && (
                <Marker position={activeDispatch.loc} icon={patientIcon}>
                  <Tooltip permanent interactive={false}><div className="font-bold text-rose-600">{activeDispatch.patientName}</div></Tooltip>
                </Marker>
              )}
              {routePoints.length > 1 && (
                <Polyline positions={routePoints} pathOptions={{color:'#14b8a6',weight:5,opacity:0.85,dashArray:'8 4'}}/>
              )}
              {/* Hospital navigation route (amber) */}
              {navRoutePoints.length > 1 && (
                <Polyline positions={navRoutePoints} pathOptions={{color:'#f59e0b',weight:4,opacity:0.8,dashArray:'6 3'}}/>
              )}
              <MapUpdater bounds={getMapBounds()}/>
            </MapContainer>
            {!isOnDuty && (
              <div className="absolute inset-0 bg-[#041512]/80 backdrop-blur-sm flex flex-col items-center justify-center z-10">
                <Power className="w-12 h-12 text-teal-700 mb-3"/>
                <p className="text-teal-300 font-bold text-lg">You are Off Duty</p>
                <p className="text-teal-500/70 text-sm mt-1">Go On Duty to receive SOS dispatches</p>
              </div>
            )}
            {locating && isOnDuty && (
              <div className="absolute top-3 left-3 z-[1000] bg-[#071E1A]/90 border border-teal-700/50 rounded-lg px-3 py-2 flex items-center gap-2 text-teal-300 text-xs font-bold">
                <Crosshair className="w-3.5 h-3.5 animate-spin"/>Acquiring GPS...
              </div>
            )}
            {missionState==='EN_ROUTE' && routePoints.length > 1 && (
              <div className="absolute top-3 right-3 z-[1000] bg-teal-900/90 border border-teal-600/50 rounded-lg px-3 py-2 text-teal-200 text-[10px] font-bold uppercase tracking-wider">
                🧭 Routing to Patient
              </div>
            )}
            {navigatingTo && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[1000]">
                <div className="bg-[#071E1A]/95 backdrop-blur-sm border border-teal-600/60 rounded-2xl px-4 py-2.5 shadow-2xl flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-teal-400 shrink-0"/>
                  <div><div className="text-[9px] text-teal-400/60 uppercase tracking-widest font-bold">Navigating to</div><div className="text-white font-bold text-sm">{navigatingTo.name}</div></div>
                  <button onClick={()=>window.open(`https://www.google.com/maps/dir/?api=1&origin=${driverLoc.lat},${driverLoc.lng}&destination=${navigatingTo.lat},${navigatingTo.lng}&travelmode=driving`,'_blank')} className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-[10px] font-bold uppercase tracking-wider rounded-lg ml-1 flex items-center gap-1"><Navigation className="w-3 h-3"/>Open Maps</button>
                  <button onClick={()=>setNavigatingTo(null)} className="text-teal-500/60 hover:text-white text-lg leading-none ml-1">×</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right — Hospital List */}
        <div className="w-full lg:w-[38%] flex flex-col min-h-0 overflow-hidden">
          <div className="mb-2 flex items-center justify-between px-1">
            <h2 className="text-white font-bold text-base">Nearest Facilities</h2>
            <span className="text-[10px] text-teal-500/60 uppercase tracking-widest">{hospitals.length} found</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {hospitals.map(h => {
              const informStatus = informedHospitals[h.id];
              return (
                <div key={h.id} className="bg-gradient-to-br from-[#0c322c] to-[#08221d] border border-teal-800/40 rounded-xl p-4 shadow-lg hover:border-teal-600/50 transition-all">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-base font-extrabold text-white truncate">{h.name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <div className="flex items-center gap-0.5">{[...Array(5)].map((_,i)=><Star key={i} className={`w-2.5 h-2.5 ${i<Math.floor(h.rating)?'text-amber-400 fill-amber-400':'text-gray-600'}`}/>)}</div>
                        <span className="text-[10px] text-teal-400/60">{h.rating}</span>
                        <span className="text-[10px] text-teal-500/50">· {h.doctors} doctors</span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0 ml-2">
                      <div className="px-2 py-1 bg-teal-950/50 rounded border border-teal-900 flex items-center gap-1 font-mono text-[10px] text-teal-300 font-bold"><Clock className="w-2.5 h-2.5"/>{h.eta}</div>
                      <span className="text-[10px] text-teal-500/60">{h.distance}</span>
                    </div>
                  </div>
                  {/* Address */}
                  <div className="flex items-center gap-1 text-[10px] text-teal-500/60 mb-2"><MapPin className="w-2.5 h-2.5 shrink-0"/><span className="truncate">{h.address}</span></div>
                  {/* Specializations */}
                  <div className="flex flex-wrap gap-1 mb-3">
                    {h.specializations.map((s: string)=><span key={s} className="text-[9px] font-bold bg-teal-900/30 border border-teal-800/30 text-teal-400 px-1.5 py-0.5 rounded-full">{s}</span>)}
                  </div>
                  {/* Resources */}
                  <div className="grid grid-cols-4 gap-1.5 mb-3">
                    {[
                      {label:'General', val:h.beds, icon:<Bed className="w-2.5 h-2.5"/>},
                      {label:'ICU', val:h.icuBeds, icon:<AlertTriangle className="w-2.5 h-2.5"/>},
                      {label:'O₂', val:h.oxygen, icon:<Wind className="w-2.5 h-2.5"/>},
                      {label:'Blood', val:h.bloodBank?'✓':'✗', icon:<Droplets className="w-2.5 h-2.5"/>},
                    ].map(r=>(
                      <div key={r.label} className="bg-[#041512] rounded p-1.5 border border-teal-900/30 flex flex-col items-center gap-0.5">
                        <span className={`${typeof r.val==='number'&&r.val>0||r.val==='✓'?'text-teal-400':'text-rose-500'}`}>{r.icon}</span>
                        <span className={`text-[11px] font-extrabold ${typeof r.val==='number'&&r.val>0||r.val==='✓'?'text-teal-300':'text-rose-400'}`}>{r.val}</span>
                        <span className="text-[8px] text-teal-600 uppercase tracking-wider">{r.label}</span>
                      </div>
                    ))}
                  </div>
                  {/* Actions */}
                  <div className="flex gap-2">
                    <a href={`tel:${h.phone}`} className="flex-1 py-2 bg-[#071E1A] hover:bg-teal-900/40 border border-teal-700/40 hover:border-teal-500 text-teal-300 text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all"><Phone className="w-3 h-3"/>Call</a>
                    <button onClick={()=>{
                      setNavigatingTo({name:h.name,lat:h.lat,lng:h.lng});
                      window.open(`https://www.google.com/maps/dir/?api=1&origin=${driverLoc.lat},${driverLoc.lng}&destination=${h.lat},${h.lng}&travelmode=driving`,'_blank');
                    }} className={`flex-1 py-2 border text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all ${navigatingTo?.name===h.name?'bg-teal-900/60 border-teal-500 text-teal-300':'bg-[#071E1A] hover:bg-teal-900/40 border-teal-700/40 hover:border-teal-500 text-teal-300'}`}><Navigation className="w-3 h-3"/>{navigatingTo?.name===h.name?'Active ✓':'Nav'}</button>
                    <button disabled={!!informStatus} onClick={async()=>{
                      try {
                        await fetch(`${API_URL}/api/ambulance/notify-hospital`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ambulance_driver_id:DEMO_DRIVER_ID,hospital_id:h.id,patient_type:activeDispatch?.condition||'Emergency',patient_condition:activeDispatch?.condition||'Critical',number_of_patients:1,eta_minutes:parseInt(h.eta)||10,driver_contact:driver.phone})});
                        setInformedHospitals(prev=>({...prev,[h.id]:'pending'}));
                      } catch(e){console.error(e);}
                    }} className={`flex-[1.5] py-2 border text-[10px] font-bold uppercase tracking-wider rounded flex items-center justify-center gap-1 transition-all ${informStatus==='accepted'?'bg-emerald-900/40 border-emerald-700 text-emerald-400 cursor-not-allowed':informStatus==='rejected'?'bg-rose-900/40 border-rose-700 text-rose-400 cursor-not-allowed':informStatus==='pending'?'bg-amber-900/40 border-amber-700 text-amber-400 cursor-not-allowed animate-pulse':'bg-rose-950/40 hover:bg-rose-900/40 border-rose-800/50 hover:border-rose-500 text-rose-300'}`}>
                      {informStatus==='accepted'?<><CheckCircle className="w-3 h-3"/>Accepted</>:informStatus==='rejected'?<>✗ Rejected</>:informStatus==='pending'?<><Clock className="w-3 h-3"/>Waiting…</>:<><BellRing className="w-3 h-3"/>Inform</>}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </main>

      {/* ── Profile Modal ── */}
      {profileOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-[#071E1A]/85 backdrop-blur-sm p-4">
          <div className="bg-[#0C322C] border border-teal-700/50 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-teal-800/40 bg-[#0A2924]">
              <h2 className="text-white font-bold text-lg flex items-center gap-2"><User className="w-5 h-5 text-teal-400"/>Driver Profile</h2>
              <button onClick={()=>setProfileOpen(false)} className="text-teal-400 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
            <div className="p-6 space-y-3">
              {[
                {label:'Full Name', key:'name', placeholder:'Your full name'},
                {label:'Phone Number', key:'phone', placeholder:'+91-XXXXXXXXXX'},
                {label:'Vehicle Number', key:'vehicle', placeholder:'DL-XX-AB-XXXX'},
                {label:'License Number', key:'licenseNo', placeholder:'License number'},
                {label:'Associated With', key:'association', placeholder:'Hospital / Agency / Private'},
              ].map(f=>(
                <div key={f.key}>
                  <label className="text-teal-400/70 text-[10px] uppercase tracking-widest font-bold mb-1 block">{f.label}</label>
                  <input value={(draftDriver as any)[f.key]} onChange={e=>setDraftDriver(prev=>({...prev,[f.key]:e.target.value}))} placeholder={f.placeholder} className="w-full bg-[#071E1A] border border-teal-800/60 rounded-lg px-3 py-2.5 text-white text-sm outline-none focus:border-teal-500 placeholder:text-teal-800"/>
                </div>
              ))}
              <button onClick={()=>{setDriver(draftDriver);setProfileOpen(false);}} className="w-full py-3 mt-2 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all">
                <Save className="w-4 h-4"/>Save Profile
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}