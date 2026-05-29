import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard, FileText, ClipboardList, Bell, BedDouble, Activity,
  Wind, Droplets, Car, CheckCircle, XCircle, Clock, AlertTriangle,
  Phone, User, Stethoscope, RefreshCw, ChevronRight, X, Ambulance,
  HeartPulse, CalendarCheck, Building2, LogOut, Users, Package,
  Save, Edit3, TrendingUp, Minus, Plus, Share2, Send, Inbox, ArrowLeftRight,
  UserCircle2, Upload, Download, FileSpreadsheet, Pencil, MapPin, Mail, Globe
} from 'lucide-react';
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000');
const API_URL = 'http://localhost:5000';

// ─── Types ───────────────────────────────────────────────────────────────────
interface EmergencyReq {
  id: string; title: string; description: string; priority: string;
  patientName: string; patientPhone?: string; status: string;
  location: string; createdAt: string; hospitalId?: string;
}
interface AppointmentReq {
  id: string; patientName: string; patientPhone?: string; reason: string;
  appointmentType: string; status: string; createdAt: string; hospitalId?: string;
}
interface AmbulanceNotif {
  id: string; ambulance_driver_id: string; hospital_id: string;
  patient_type: string; patient_condition: string; number_of_patients: number;
  driver_contact: string; eta_minutes: number; status: string;
  hospital_response?: string; createdAt: string;
}
interface ResourceShareReq {
  id: string;
  fromHospitalId: string; fromHospitalName: string;
  toHospitalId: string; toHospitalName: string;
  resourceType: string; quantity: number;
  message: string; status: 'pending' | 'agreed' | 'denied';
  responseMessage: string | null;
  createdAt: string;
}

// ─── Stat Card ───────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color }: { label: string; value: string | number; icon: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-xl border p-4 ${color} transition-all hover:scale-[1.02]`}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-teal-400/70">{icon}</span>
        <span className="text-2xl font-extrabold text-white">{value}</span>
      </div>
      <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400/60">{label}</p>
    </div>
  );
}

// ─── Request Row ─────────────────────────────────────────────────────────────
function RequestRow({ type, name, phone, detail, status, time, onAccept, onReject }: {
  type: string; name: string; phone?: string; detail: string; status: string;
  time: string; onAccept: () => void; onReject: () => void;
}) {
  const isPending = status === 'pending';
  return (
    <div className="bg-[#0a2822] border border-teal-800/30 rounded-xl p-4 flex items-center gap-4 transition-all hover:border-teal-600/40">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
        type === 'emergency' ? 'bg-rose-900/40 text-rose-400' :
        type === 'bed' ? 'bg-emerald-900/40 text-emerald-400' :
        'bg-violet-900/40 text-violet-400'
      }`}>
        {type === 'emergency' ? <AlertTriangle className="w-5 h-5" /> :
         type === 'bed' ? <BedDouble className="w-5 h-5" /> :
         <CalendarCheck className="w-5 h-5" />}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-bold text-white text-sm truncate">{name}</span>
          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
            type === 'emergency' ? 'text-rose-400 bg-rose-950/40 border-rose-800/40' :
            type === 'bed' ? 'text-emerald-400 bg-emerald-950/40 border-emerald-800/40' :
            'text-violet-400 bg-violet-950/40 border-violet-800/40'
          }`}>{type === 'emergency' ? 'Emergency' : type === 'bed' ? 'Bed Booking' : 'Appointment'}</span>
        </div>
        <p className="text-teal-400/70 text-xs truncate">{detail}</p>
        {phone && <p className="text-teal-500/50 text-[10px] mt-0.5 flex items-center gap-1"><Phone className="w-2.5 h-2.5" />{phone}</p>}
      </div>
      <div className="text-right shrink-0 flex flex-col items-end gap-2">
        <span className="text-[10px] text-teal-500/50">{new Date(time).toLocaleTimeString()}</span>
        {isPending ? (
          <div className="flex gap-1.5">
            <button onClick={onAccept} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all">Accept</button>
            <button onClick={onReject} className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg border border-rose-800/40 transition-all">Reject</button>
          </div>
        ) : (
          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
            status === 'confirmed' || status === 'assigned' || status === 'completed' ? 'text-emerald-400 bg-emerald-950/40' :
            status === 'cancelled' ? 'text-rose-400 bg-rose-950/40' : 'text-amber-400 bg-amber-950/40'
          }`}>{status}</span>
        )}
      </div>
    </div>
  );
}

// ─── Ambulance Alert Row ─────────────────────────────────────────────────────
function AmbulanceAlertRow({ notif, onAccept, onReject }: { notif: AmbulanceNotif; onAccept: () => void; onReject: () => void }) {
  const isPending = notif.status === 'pending';
  return (
    <div className={`border rounded-xl p-4 transition-all ${isPending ? 'bg-gradient-to-r from-rose-950/30 to-[#0a2822] border-rose-800/40 animate-pulse-slow' : 'bg-[#0a2822] border-teal-800/30'}`}>
      <div className="flex items-start gap-4">
        <div className="w-10 h-10 rounded-full bg-rose-900/40 flex items-center justify-center shrink-0">
          <Car className="w-5 h-5 text-rose-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-white text-sm">Ambulance Alert</span>
            {isPending && <span className="text-[9px] font-bold uppercase tracking-wider text-rose-400 bg-rose-950/50 px-2 py-0.5 rounded-full border border-rose-800/40 animate-pulse">URGENT</span>}
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs mt-2">
            <div><span className="text-teal-500/60">Patient Type:</span> <span className="text-teal-200 font-semibold">{notif.patient_type}</span></div>
            <div><span className="text-teal-500/60">Patients:</span> <span className="text-teal-200 font-semibold">{notif.number_of_patients}</span></div>
            <div><span className="text-teal-500/60">Condition:</span> <span className="text-teal-200 font-semibold">{notif.patient_condition || 'Not specified'}</span></div>
            <div><span className="text-teal-500/60">ETA:</span> <span className="text-amber-400 font-bold">{notif.eta_minutes} min</span></div>
            {notif.driver_contact && <div><span className="text-teal-500/60">Driver:</span> <span className="text-teal-200 font-semibold">{notif.driver_contact}</span></div>}
          </div>
        </div>
        <div className="shrink-0 flex flex-col items-end gap-2">
          <span className="text-[10px] text-teal-500/50">{new Date(notif.createdAt).toLocaleTimeString()}</span>
          {isPending ? (
            <div className="flex gap-1.5">
              <button onClick={onAccept} className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-all shadow-lg shadow-emerald-900/30">Accept</button>
              <button onClick={onReject} className="px-4 py-2 text-xs font-bold uppercase tracking-wider bg-rose-900/60 hover:bg-rose-800 text-rose-300 rounded-lg border border-rose-800/40 transition-all">Reject</button>
            </div>
          ) : (
            <span className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
              notif.status === 'accepted' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' : 'text-rose-400 bg-rose-950/40 border border-rose-800/40'
            }`}>{notif.status}</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Hospital Portal ────────────────────────────────────────────────────
export default function HospitalPortal() {
  const [activeTab, setActiveTab] = useState('Dashboard');
  const [emergencies, setEmergencies] = useState<EmergencyReq[]>([]);
  const [appointments, setAppointments] = useState<AppointmentReq[]>([]);
  const [ambulanceNotifs, setAmbulanceNotifs] = useState<AmbulanceNotif[]>([]);
  const [loading, setLoading] = useState(true);

  // Dynamic hospital info from JWT
  // Dynamic hospital info from JWT
  const [hospitalInfo, setHospitalInfo] = useState<{
    name: string; id: string; city?: string;
    address?: string; state?: string; zipCode?: string;
    phone?: string; email?: string;
    latitude?: number; longitude?: number;
    specializations?: string[] | string;
    totalBeds?: number; icu_beds_available?: number;
    oxygen_cylinders_available?: number; ambulances_available?: number;
    ventilators?: number; openingTime?: string; closingTime?: string;
  } | null>(null);
  const [profileError, setProfileError] = useState('');

  const [inventory, setInventory] = useState({
    generalBeds: 0, icuBeds: 0, oxygenCylinders: 0, bloodAvailable: 'Not set',
    ambulances: 0, ventilators: 0,
  });
  const [editingInventory, setEditingInventory] = useState(false);

  // Load hospital profile from JWT on mount
  useEffect(() => {
    const token = sessionStorage.getItem('lifelink_token');
    if (!token) { setProfileError('Not authenticated'); setLoading(false); return; }

    fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => r.json())
      .then(d => {
        if (d.success && d.data.hospital) {
          const h = d.data.hospital;
          setHospitalInfo({
            name: h.name, id: h.id, city: h.city,
            address: h.address, state: h.state, zipCode: h.zipCode,
            phone: h.phone, email: h.email,
            latitude: h.latitude, longitude: h.longitude,
            specializations: h.specializations,
            totalBeds: h.totalBeds,
            icu_beds_available: h.icu_beds_available ?? h.icuBeds,
            oxygen_cylinders_available: h.oxygen_cylinders_available,
            ambulances_available: h.ambulances_available ?? h.ambulances,
            ventilators: h.ventilators,
          });
          // Pre-populate inventory from DB if AIIMS (pre-loaded data)
          setInventory({
            generalBeds: h.totalBeds || 0,
            icuBeds: h.icu_beds_available ?? h.icuBeds ?? 0,
            oxygenCylinders: h.oxygen_cylinders_available ?? 0,
            bloodAvailable: 'Not set',
            ambulances: h.ambulances_available ?? h.ambulances ?? 0,
            ventilators: h.ventilators ?? 0,
          });
        } else {
          setProfileError('Hospital profile not found. Please contact support.');
        }
      })
      .catch(() => setProfileError('Could not load hospital profile.'))
      .finally(() => setLoading(false));
  }, []);

  // Fetch all requests scoped to this hospital
  const fetchData = useCallback(async () => {
    if (!hospitalInfo?.id) return;
    setLoading(true);
    try {
      const [emerRes, apptRes, notifRes] = await Promise.all([
        fetch(`${API_URL}/api/emergency`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/api/appointments/all`).then(r => r.json()).catch(() => ({ data: [] })),
        fetch(`${API_URL}/api/ambulance/all-hospital-notifications`).then(r => r.json()).catch(() => ({ data: [] })),
      ]);

      // Filter to only this hospital's data
      const hId = hospitalInfo.id;
      const allEmerg: EmergencyReq[] = emerRes.data || [];
      const allAppt: AppointmentReq[] = apptRes.data || [];
      const allNotif: AmbulanceNotif[] = notifRes.data || [];

      setEmergencies(allEmerg.filter((e: any) =>
        (!e.hospitalId || e.hospitalId === hId) &&
        (e.title || '').toLowerCase().startsWith('bed booking')
      ));
      setAppointments(allAppt.filter((a: any) => !a.hospitalId || a.hospitalId === hId));
      setAmbulanceNotifs(allNotif.filter((n: any) => !n.hospital_id || n.hospital_id === hId));
    } catch (err) {
      console.error('Failed to fetch hospital data:', err);
    }
    setLoading(false);
  }, [hospitalInfo?.id]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Socket.IO real-time listeners
  useEffect(() => {
    // bed_booking_created → hospital only (SOS emergencies go to ambulance only)
    const onBedBooking = (data: any) => setEmergencies(prev => [data, ...prev]);
    const onAppointment = (data: any) => setAppointments(prev => [data, ...prev]);
    const onAmbulanceNotif = (data: any) => setAmbulanceNotifs(prev => [data, ...prev]);

    socket.on('bed_booking_created', onBedBooking);
    socket.on('appointment_created', onAppointment);
    socket.on('ambulance_notification_created', onAmbulanceNotif);

    return () => {
      socket.off('bed_booking_created', onBedBooking);
      socket.off('appointment_created', onAppointment);
      socket.off('ambulance_notification_created', onAmbulanceNotif);
    };
  }, []);

  // ─── Resource Sharing State ────────────────────────────────────────────────
  const [incomingRequests, setIncomingRequests] = useState<ResourceShareReq[]>([]);
  const [outgoingRequests, setOutgoingRequests] = useState<ResourceShareReq[]>([]);
  const [allHospitals, setAllHospitals] = useState<any[]>([]);
  const [sharingView, setSharingView] = useState<'browse' | 'incoming' | 'outgoing'>('browse');
  const [requestModal, setRequestModal] = useState<{ open: boolean; hospital: any | null }>({ open: false, hospital: null });
  const [requestForm, setRequestForm] = useState({ resourceType: 'oxygen', quantity: '10', message: '' });
  const [respondModal, setRespondModal] = useState<{ open: boolean; req: ResourceShareReq | null }>({ open: false, req: null });
  const [respondNote, setRespondNote] = useState('');
  const [sharingLoading, setSharingLoading] = useState(false);
  const RESOURCE_LABELS: Record<string, string> = { oxygen: 'Oxygen Cylinders', icuBeds: 'ICU Beds', generalBeds: 'General Beds', ambulances: 'Ambulances', ventilators: 'Ventilators' };
  const fetchSharingData = useCallback(async () => {
    if (!hospitalInfo?.id) return;
    const [receivedRes, sentRes, hospitalsRes] = await Promise.all([
      fetch(`${API_URL}/api/resource-requests/received/${hospitalInfo.id}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}/api/resource-requests/sent/${hospitalInfo.id}`).then(r => r.json()).catch(() => ({ data: [] })),
      fetch(`${API_URL}/api/resource-requests/hospitals`).then(r => r.json()).catch(() => ({ data: [] })),
    ]);
    setIncomingRequests(receivedRes.data || []);
    setOutgoingRequests(sentRes.data || []);
    setAllHospitals((hospitalsRes.data || []).filter((h: any) => h.id !== hospitalInfo.id));
  }, [hospitalInfo?.id]);
  useEffect(() => { fetchSharingData(); }, [fetchSharingData]);
  useEffect(() => {
    const onNew = (data: any) => { if (data?.toHospitalId === hospitalInfo?.id) setIncomingRequests(prev => [data.request, ...prev]); };
    const onResp = (data: any) => { if (data?.toHospitalId === hospitalInfo?.id) setOutgoingRequests(prev => prev.map(r => r.id === data.request.id ? data.request : r)); };
    socket.on('resource_request_new', onNew);
    socket.on('resource_request_response', onResp);
    return () => { socket.off('resource_request_new', onNew); socket.off('resource_request_response', onResp); };
  }, [hospitalInfo?.id]);
  const sendResourceRequest = async () => {
    if (!requestModal.hospital || !hospitalInfo) return;
    setSharingLoading(true);
    try {
      await fetch(`${API_URL}/api/resource-requests`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ fromHospitalId: hospitalInfo.id, fromHospitalName: hospitalInfo.name, toHospitalId: requestModal.hospital.id, toHospitalName: requestModal.hospital.name, resourceType: requestForm.resourceType, quantity: Number(requestForm.quantity), message: requestForm.message }) });
      setRequestModal({ open: false, hospital: null });
      setRequestForm({ resourceType: 'oxygen', quantity: '10', message: '' });
      setSharingView('outgoing');
      await fetchSharingData();
    } catch (e) { console.error(e); }
    setSharingLoading(false);
  };
  const respondToRequest = async (status: 'agreed' | 'denied') => {
    if (!respondModal.req) return;
    setSharingLoading(true);
    try {
      await fetch(`${API_URL}/api/resource-requests/${respondModal.req.id}/respond`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status, responseMessage: respondNote }) });
      setRespondModal({ open: false, req: null });
      setRespondNote('');
      await fetchSharingData();
    } catch (e) { console.error(e); }
    setSharingLoading(false);
  };

  // ─── Hospital Profile State ───────────────────────────────────────────
  const [profilePanelOpen, setProfilePanelOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);
  const [profileLoading, setProfileLoading] = useState(false);
  const [csvView, setCsvView] = useState<'none' | 'preview' | 'uploading' | 'done'>('none');
  const [profileForm, setProfileForm] = useState({
    name: '', address: '', city: '', state: '', zipCode: '',
    phone: '', email: '', latitude: '', longitude: '',
    specializations: '', openingTime: '08:00', closingTime: '20:00',
    totalBeds: '', icu_beds_available: '', oxygen_cylinders_available: '',
    ambulances_available: '', ventilators: '',
  });

  // Fetch full hospital profile from DB whenever the panel opens
  useEffect(() => {
    if (!profilePanelOpen || !hospitalInfo?.id) return;
    setProfileLoading(true);
    fetch(`${API_URL}/api/hospitals`)
      .then(r => r.json())
      .then(data => {
        const list: any[] = data.data || data || [];
        const h = list.find((x: any) => x.id === hospitalInfo.id);
        if (!h) return;
        setProfileForm({
          name: h.name || '',
          address: h.address || '',
          city: h.city || '',
          state: h.state || '',
          zipCode: h.zipCode || '',
          phone: h.phone || '',
          email: h.email || '',
          latitude: String(h.latitude || ''),
          longitude: String(h.longitude || ''),
          specializations: Array.isArray(h.specializations)
            ? h.specializations.join(', ')
            : (h.specializations || ''),
          openingTime: h.openingTime || '08:00',
          closingTime: h.closingTime || '20:00',
          totalBeds: String(h.totalBeds ?? h.total_beds ?? ''),
          icu_beds_available: String(h.icu_beds_available ?? h.icuBeds ?? ''),
          oxygen_cylinders_available: String(h.oxygen_cylinders_available ?? ''),
          ambulances_available: String(h.ambulances_available ?? h.ambulances ?? ''),
          ventilators: String(h.ventilators ?? ''),
        });
      })
      .catch(err => console.error('Profile fetch error:', err))
      .finally(() => setProfileLoading(false));
  }, [profilePanelOpen, hospitalInfo?.id]);

  const saveProfile = async () => {
    if (!hospitalInfo?.id) return;
    setProfileSaving(true);
    try {
      await fetch(`${API_URL}/api/hospitals/${hospitalInfo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: profileForm.name,
          address: profileForm.address,
          city: profileForm.city,
          state: profileForm.state,
          zipCode: profileForm.zipCode,
          phone: profileForm.phone,
          email: profileForm.email,
          latitude: Number(profileForm.latitude) || undefined,
          longitude: Number(profileForm.longitude) || undefined,
          specializations: profileForm.specializations.split(',').map(s => s.trim()).filter(Boolean),
          openingTime: profileForm.openingTime,
          closingTime: profileForm.closingTime,
          totalBeds: Number(profileForm.totalBeds) || 0,
          icu_beds_available: Number(profileForm.icu_beds_available) || 0,
          oxygen_cylinders_available: Number(profileForm.oxygen_cylinders_available) || 0,
          ambulances_available: Number(profileForm.ambulances_available) || 0,
          ventilators: Number(profileForm.ventilators) || 0,
        }),
      });
      setEditingProfile(false);
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
    } catch (e) { console.error(e); }
    setProfileSaving(false);
  };

  const generateExampleCsv = () => {
    const headers = 'name,address,city,state,zipCode,phone,email,latitude,longitude,specializations,openingTime,closingTime,totalBeds,icuBedsAvailable,oxygenCylindersAvailable,ambulancesAvailable,ventilators';
    const values = [
      profileForm.name || 'My Hospital',
      profileForm.address || '123 Health Street',
      profileForm.city || 'New Delhi',
      profileForm.state || 'Delhi',
      profileForm.zipCode || '110001',
      profileForm.phone || '9000000001',
      profileForm.email || 'admin@myhospital.com',
      profileForm.latitude || '28.6139',
      profileForm.longitude || '77.2090',
      profileForm.specializations || 'Cardiology, Neurology',
      profileForm.openingTime || '08:00',
      profileForm.closingTime || '20:00',
      profileForm.totalBeds || '100',
      profileForm.icu_beds_available || '10',
      profileForm.oxygen_cylinders_available || '20',
      profileForm.ambulances_available || '5',
      profileForm.ventilators || '8',
    ].map(v => `"${String(v).replace(/"/g, '""')}"`);
    return headers + '\n' + values.join(',');
  };

  const downloadExampleCsv = () => {
    const csv = generateExampleCsv();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'hospital_profile_template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const handleCsvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvView('uploading');
    const reader = new FileReader();
    reader.onload = async (ev) => {
      try {
        const text = ev.target?.result as string;
        const lines = text.trim().split('\n');
        const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
        const values = lines[1].split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = values[i] || ''; });
        const updated = {
          name: row.name || profileForm.name,
          address: row.address || profileForm.address,
          city: row.city || profileForm.city,
          state: row.state || profileForm.state,
          zipCode: row.zipCode || profileForm.zipCode,
          phone: row.phone || profileForm.phone,
          email: row.email || profileForm.email,
          latitude: row.latitude || profileForm.latitude,
          longitude: row.longitude || profileForm.longitude,
          specializations: row.specializations || profileForm.specializations,
          openingTime: row.openingTime || profileForm.openingTime,
          closingTime: row.closingTime || profileForm.closingTime,
          totalBeds: row.totalBeds || profileForm.totalBeds,
          icu_beds_available: row.icuBedsAvailable || profileForm.icu_beds_available,
          oxygen_cylinders_available: row.oxygenCylindersAvailable || profileForm.oxygen_cylinders_available,
          ambulances_available: row.ambulancesAvailable || profileForm.ambulances_available,
          ventilators: row.ventilators || profileForm.ventilators,
        };
        setProfileForm(updated);
        // Auto-save after 500ms to give the feel of 'instant' update
        setTimeout(async () => {
          if (hospitalInfo?.id) {
            await fetch(`${API_URL}/api/hospitals/${hospitalInfo.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: updated.name, address: updated.address, city: updated.city,
                state: updated.state, zipCode: updated.zipCode, phone: updated.phone,
                email: updated.email, latitude: Number(updated.latitude) || undefined,
                longitude: Number(updated.longitude) || undefined,
                specializations: updated.specializations.split(',').map((s: string) => s.trim()).filter(Boolean),
                openingTime: updated.openingTime, closingTime: updated.closingTime,
                totalBeds: Number(updated.totalBeds) || 0,
                icu_beds_available: Number(updated.icu_beds_available) || 0,
                oxygen_cylinders_available: Number(updated.oxygen_cylinders_available) || 0,
                ambulances_available: Number(updated.ambulances_available) || 0,
                ventilators: Number(updated.ventilators) || 0,
              }),
            });
          }
          setCsvView('done');
          setTimeout(() => setCsvView('none'), 3000);
        }, 500);
      } catch (err) {
        console.error('CSV parse error:', err);
        setCsvView('none');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Action handlers
  const handleRequestAction = async (id: string, type: 'emergency' | 'bed' | 'appointment', action: 'accept' | 'reject') => {
    const status = action === 'accept' ? (type === 'appointment' ? 'confirmed' : 'assigned') : 'cancelled';
    try {
      if (type === 'appointment') {
        await fetch(`${API_URL}/api/appointments/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
      } else {
        const endpoint = type === 'emergency' ? 'emergency' : 'bed-bookings';
        await fetch(`${API_URL}/api/${endpoint}/${id}/status`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
        setEmergencies(prev => prev.map(e => e.id === id ? { ...e, status } : e));
      }
    } catch (err) { console.error('Action failed:', err); }
  };

  const handleAmbulanceResponse = async (notifId: string, action: 'accepted' | 'rejected') => {
    try {
      await fetch(`${API_URL}/api/webhooks/hospital/${hospitalInfo?.id}/ambulance-response`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notification_id: notifId, status: action, response_message: action === 'accepted' ? 'Hospital ready for patient' : 'Cannot accommodate at this time' }),
      });
      setAmbulanceNotifs(prev => prev.map(n => n.id === notifId ? { ...n, status: action } : n));
    } catch (err) { console.error('Ambulance response failed:', err); }
  };

  // Computed stats
  const pendingEmergencies = emergencies.filter(e => e.status === 'pending').length;
  const pendingAppointments = appointments.filter(a => a.status === 'pending').length;
  const pendingAmbulance = ambulanceNotifs.filter(n => n.status === 'pending').length;
  const totalPending = pendingEmergencies + pendingAppointments + pendingAmbulance;

  const tabs = [
    { name: 'Dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { name: 'Requests', icon: <FileText className="w-5 h-5" />, badge: pendingEmergencies + pendingAppointments },
    { name: 'Inventory', icon: <Package className="w-5 h-5" /> },
    { name: 'Ambulance Alerts', icon: <Car className="w-5 h-5" />, badge: pendingAmbulance },
    { name: 'Resource Sharing', icon: <ArrowLeftRight className="w-5 h-5" />, badge: incomingRequests.filter(r => r.status === 'pending').length },
  ];

  const updateInventoryField = (field: string, delta: number) => {
    setInventory(prev => ({ ...prev, [field]: Math.max(0, (prev as any)[field] + delta) }));
  };

  const saveInventory = async () => {
    setEditingInventory(false);
    const payload = {
      hospitalId: hospitalInfo?.id || '',
      resources: {
        generalBeds: inventory.generalBeds,
        icuBeds: inventory.icuBeds,
        oxygenCylinders: inventory.oxygenCylinders,
        bloodAvailable: inventory.bloodAvailable,
        ambulances: inventory.ambulances,
        ventilators: inventory.ventilators,
      },
    };

    // 1. Persist to DB via REST API
    if (hospitalInfo?.id) {
      try {
        await fetch(`${API_URL}/api/hospitals/${hospitalInfo.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            totalBeds: inventory.generalBeds,
            icu_beds_available: inventory.icuBeds,
            icu_beds_total: inventory.icuBeds,
            oxygen_cylinders_available: inventory.oxygenCylinders,
            oxygen_cylinders_total: inventory.oxygenCylinders,
            ambulances_available: inventory.ambulances,
            ambulances: inventory.ambulances,
            ventilators: inventory.ventilators,
          }),
        });
        console.log('✅ Inventory saved to DB');
      } catch (e) {
        console.warn('⚠️ DB save failed:', e);
      }
    }

    // 2. Broadcast via Socket so open portals update instantly
    socket.emit('hospital_inventory_update', payload);
    // 3. sessionStorage for same-tab sync
    sessionStorage.setItem('lifelink_inventory_update', JSON.stringify({ ...payload, timestamp: Date.now() }));
    window.dispatchEvent(new Event('storage'));
  };

  // Show profile error screen
  if (profileError) {
    return (
      <div className="flex h-screen bg-[#041512] items-center justify-center">
        <div className="text-center p-8 bg-[#0b2e28] border border-rose-700/40 rounded-2xl max-w-md">
          <Building2 className="w-12 h-12 text-rose-400 mx-auto mb-4" />
          <h2 className="text-white font-bold text-xl mb-2">Hospital Profile Not Found</h2>
          <p className="text-teal-400/70 text-sm mb-4">{profileError}</p>
          <button onClick={() => (window as any).__lifeLinkLogout?.()} className="px-6 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-xl font-semibold text-sm transition-all">Sign Out</button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-[#041512] font-sans overflow-hidden">
      {/* Left Sidebar */}
      <div className="w-64 bg-[#071E1A] border-r border-teal-900/40 flex flex-col shrink-0">
        <div className="p-5 border-b border-teal-900/40">
          <div className="flex items-center gap-3 mb-1">
            <div className="bg-pink-500/20 p-2 rounded-lg"><Building2 className="text-pink-400 w-5 h-5" /></div>
            <span className="text-lg font-bold text-white tracking-tight">LifeLink</span>
          </div>
          <p className="text-teal-500/60 text-[10px] uppercase tracking-widest font-bold mt-2">Hospital Admin</p>
        </div>
        <nav className="flex-1 mt-2 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.name}
              onClick={() => setActiveTab(tab.name)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all text-sm font-semibold ${
                activeTab === tab.name
                  ? 'bg-teal-900/50 text-teal-200 border border-teal-700/40 shadow-lg shadow-teal-900/20'
                  : 'text-teal-400/70 hover:bg-teal-900/20 hover:text-teal-300'
              }`}
            >
              {tab.icon}
              <span className="flex-1">{tab.name}</span>
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center animate-pulse">{tab.badge}</span>
              )}
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-teal-900/40 space-y-3">
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>System Live
          </div>
          <button
            onClick={() => (window as any).__lifeLinkLogout?.()}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-rose-950/30 border border-rose-800/30 text-rose-400 hover:bg-rose-900/40 hover:text-rose-300 transition-all text-xs font-semibold"
          >
            <LogOut className="w-4 h-4" />
            Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-[#0A2924] border-b border-teal-900/40 px-6 py-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-bold text-white">{hospitalInfo?.name || 'Hospital Dashboard'}</h1>
            <p className="text-teal-400/60 text-xs mt-0.5">{hospitalInfo?.city ? `${hospitalInfo.city} · ` : ''}Hospital Administration Dashboard</p>
          </div>
          <div className="flex items-center gap-3">
            {totalPending > 0 && (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-rose-950/40 border border-rose-800/40 rounded-full text-rose-400 text-xs font-bold animate-pulse">
                <Bell className="w-3.5 h-3.5" />{totalPending} Pending
              </div>
            )}
            <button onClick={fetchData} className="p-2 rounded-lg bg-teal-900/30 border border-teal-800/30 text-teal-400 hover:text-white hover:bg-teal-800/40 transition-all">
              <RefreshCw className="w-4 h-4" />
            </button>
            {/* Profile Icon */}
            <button
              onClick={() => setProfilePanelOpen(true)}
              title="Hospital Profile"
              className="p-2 rounded-lg bg-teal-900/30 border border-teal-800/30 text-teal-400 hover:text-white hover:bg-teal-800/40 transition-all"
            >
              <UserCircle2 className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-t-teal-500 border-teal-900 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-teal-400">Loading hospital data...</p>
              </div>
            </div>
          ) : activeTab === 'Dashboard' ? (
            /* ── Dashboard Tab ── */
            <div className="space-y-6">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Pending Requests" value={pendingEmergencies + pendingAppointments} icon={<ClipboardList className="w-5 h-5" />} color="bg-rose-950/30 border-rose-800/30" />
                <StatCard label="Ambulance Alerts" value={pendingAmbulance} icon={<Car className="w-5 h-5" />} color="bg-amber-950/30 border-amber-800/30" />
                <StatCard label="Total Emergencies" value={emergencies.length} icon={<AlertTriangle className="w-5 h-5" />} color="bg-teal-950/30 border-teal-800/30" />
                <StatCard label="Total Appointments" value={appointments.length} icon={<CalendarCheck className="w-5 h-5" />} color="bg-violet-950/30 border-violet-800/30" />
              </div>

              {/* Recent activity */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-widest text-teal-400/70 mb-3 flex items-center gap-2">
                  <Activity className="w-4 h-4" /> Recent Activity
                </h3>
                <div className="space-y-3">
                  {[...emergencies, ...appointments.map(a => ({ ...a, title: a.reason, description: a.appointmentType, patientName: a.patientName, priority: 'low' }))]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .slice(0, 5)
                    .map((item: any) => (
                      <div key={item.id} className="bg-[#0a2822] border border-teal-800/30 rounded-lg p-3 flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${item.status === 'pending' ? 'bg-amber-400 animate-pulse' : item.status === 'cancelled' ? 'bg-rose-400' : 'bg-emerald-400'}`}></div>
                        <span className="text-white text-sm font-semibold flex-1 truncate">{item.patientName} — {item.title || item.reason}</span>
                        <span className="text-teal-500/50 text-[10px]">{new Date(item.createdAt).toLocaleString()}</span>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${item.status === 'pending' ? 'text-amber-400 bg-amber-950/40' : item.status === 'cancelled' ? 'text-rose-400 bg-rose-950/40' : 'text-emerald-400 bg-emerald-950/40'}`}>{item.status}</span>
                      </div>
                    ))}
                  {emergencies.length === 0 && appointments.length === 0 && (
                    <div className="text-center py-12 text-teal-500/50">
                      <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p className="font-semibold">No activity yet</p>
                      <p className="text-xs mt-1">Incoming requests will appear here in real-time</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeTab === 'Inventory' ? (
            /* ── Inventory Tab ── */
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white">Resource Inventory</h2>
                  <p className="text-teal-400/60 text-xs mt-0.5">Update counts here — changes sync live to Public & Ambulance portals</p>
                </div>
                {editingInventory ? (
                  <button onClick={saveInventory} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-lg shadow-emerald-900/30">
                    <Save className="w-4 h-4" /> Save & Publish
                  </button>
                ) : (
                  <button onClick={() => setEditingInventory(true)} className="flex items-center gap-2 px-5 py-2.5 bg-teal-800/50 hover:bg-teal-700/60 text-teal-200 rounded-xl text-xs font-bold uppercase tracking-wider border border-teal-700/40 transition-all">
                    <Edit3 className="w-4 h-4" /> Edit Inventory
                  </button>
                )}
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { key: 'generalBeds', label: 'General Beds', icon: <BedDouble className="w-6 h-6" />, color: 'from-teal-900/60 to-teal-950/40 border-teal-700/40', iconColor: 'text-teal-400' },
                  { key: 'icuBeds', label: 'ICU Beds', icon: <HeartPulse className="w-6 h-6" />, color: 'from-rose-900/40 to-rose-950/30 border-rose-700/40', iconColor: 'text-rose-400' },
                  { key: 'oxygenCylinders', label: 'Oxygen Cylinders', icon: <Wind className="w-6 h-6" />, color: 'from-sky-900/40 to-sky-950/30 border-sky-700/40', iconColor: 'text-sky-400' },
                  { key: 'ventilators', label: 'Ventilators', icon: <Activity className="w-6 h-6" />, color: 'from-violet-900/40 to-violet-950/30 border-violet-700/40', iconColor: 'text-violet-400' },
                  { key: 'ambulances', label: 'Ambulances', icon: <Car className="w-6 h-6" />, color: 'from-amber-900/40 to-amber-950/30 border-amber-700/40', iconColor: 'text-amber-400' },
                ].map(item => (
                  <div key={item.key} className={`bg-gradient-to-br ${item.color} border rounded-2xl p-5 transition-all hover:scale-[1.01]`}>
                    <div className="flex items-center justify-between mb-4">
                      <span className={item.iconColor}>{item.icon}</span>
                      {editingInventory && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/40">Editing</span>
                      )}
                    </div>
                    <div className="text-3xl font-extrabold text-white mb-1">{(inventory as any)[item.key]}</div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400/60 mb-3">{item.label}</p>
                    {editingInventory && (
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => updateInventoryField(item.key, -1)} className="w-8 h-8 rounded-lg bg-rose-900/40 border border-rose-800/40 text-rose-300 flex items-center justify-center hover:bg-rose-800/50 transition-all">
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={(inventory as any)[item.key]}
                          onChange={e => setInventory(prev => ({ ...prev, [item.key]: Math.max(0, parseInt(e.target.value) || 0) }))}
                          className="flex-1 bg-[#05110E] border border-teal-800/40 rounded-lg px-3 py-1.5 text-white text-center text-sm font-bold focus:border-teal-500 focus:outline-none"
                        />
                        <button onClick={() => updateInventoryField(item.key, 1)} className="w-8 h-8 rounded-lg bg-emerald-900/40 border border-emerald-800/40 text-emerald-300 flex items-center justify-center hover:bg-emerald-800/50 transition-all">
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}

                {/* Blood Bank — special string field */}
                <div className="bg-gradient-to-br from-red-900/40 to-red-950/30 border-red-700/40 border rounded-2xl p-5 transition-all hover:scale-[1.01]">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-red-400"><Droplets className="w-6 h-6" /></span>
                    {editingInventory && (
                      <span className="text-[9px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-800/40">Editing</span>
                    )}
                  </div>
                  <div className="text-xl font-extrabold text-white mb-1">{inventory.bloodAvailable}</div>
                  <p className="text-[11px] font-bold uppercase tracking-widest text-teal-400/60 mb-3">Blood Bank</p>
                  {editingInventory && (
                    <input
                      type="text"
                      value={inventory.bloodAvailable}
                      onChange={e => setInventory(prev => ({ ...prev, bloodAvailable: e.target.value }))}
                      className="w-full bg-[#05110E] border border-teal-800/40 rounded-lg px-3 py-1.5 text-white text-sm font-bold focus:border-teal-500 focus:outline-none mt-2"
                      placeholder="e.g. A+, B+, O-"
                    />
                  )}
                </div>
              </div>

              {/* Last Updated indicator */}
              <div className="flex items-center justify-center gap-2 text-teal-500/50 text-xs">
                <TrendingUp className="w-3.5 h-3.5" />
                Changes are broadcast to all connected portals in real-time
              </div>
            </div>
          ) : activeTab === 'Requests' ? (
            /* ── Requests Tab ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">Incoming Requests</h2>
                <span className="text-xs text-teal-500/60">{emergencies.length + appointments.length} total</span>
              </div>
              {/* Emergencies & Bed Bookings */}
              {emergencies.map(e => (
                <RequestRow
                  key={e.id}
                  type={e.title?.toLowerCase().includes('bed booking') ? 'bed' : 'emergency'}
                  name={e.patientName}
                  phone={e.patientPhone}
                  detail={e.title + (e.description ? ` — ${e.description}` : '')}
                  status={e.status}
                  time={e.createdAt}
                  onAccept={() => handleRequestAction(e.id, e.title?.toLowerCase().includes('bed booking') ? 'bed' : 'emergency', 'accept')}
                  onReject={() => handleRequestAction(e.id, e.title?.toLowerCase().includes('bed booking') ? 'bed' : 'emergency', 'reject')}
                />
              ))}
              {/* Appointments */}
              {appointments.map(a => (
                <RequestRow
                  key={a.id}
                  type="appointment"
                  name={a.patientName}
                  phone={a.patientPhone}
                  detail={`${a.appointmentType} — ${a.reason}`}
                  status={a.status}
                  time={a.createdAt}
                  onAccept={() => handleRequestAction(a.id, 'appointment', 'accept')}
                  onReject={() => handleRequestAction(a.id, 'appointment', 'reject')}
                />
              ))}
              {emergencies.length === 0 && appointments.length === 0 && (
                <div className="text-center py-16 text-teal-500/50">
                  <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">No requests yet</p>
                  <p className="text-xs mt-1">Bed bookings and appointments from the Public Portal will appear here in real-time</p>
                </div>
              )}
            </div>
          ) : activeTab === 'Ambulance Alerts' ? (
            /* ── Ambulance Alerts Tab ── */
            <div className="space-y-4">
              <div className="flex items-center justify-between mb-2">
                <h2 className="text-lg font-bold text-white">Ambulance Notifications</h2>
                <span className="text-xs text-teal-500/60">{ambulanceNotifs.length} total</span>
              </div>
              {ambulanceNotifs.map(n => (
                <AmbulanceAlertRow
                  key={n.id}
                  notif={n}
                  onAccept={() => handleAmbulanceResponse(n.id, 'accepted')}
                  onReject={() => handleAmbulanceResponse(n.id, 'rejected')}
                />
              ))}
              {ambulanceNotifs.length === 0 && (
                <div className="text-center py-16 text-teal-500/50">
                  <Car className="w-16 h-16 mx-auto mb-4 opacity-20" />
                  <p className="font-bold text-lg">No ambulance alerts</p>
                  <p className="text-xs mt-1">When an ambulance driver sends an alert, it will appear here instantly</p>
                </div>
              )}
            </div>
          ) : (
            /* ── Resource Sharing Tab ── */
            <div className="space-y-4">
              {/* Sub-nav */}
              <div className="flex items-center gap-2 mb-4">
                {(['browse', 'incoming', 'outgoing'] as const).map(v => (
                  <button key={v} onClick={() => setSharingView(v)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-all ${
                      sharingView === v ? 'bg-teal-500 text-white shadow-lg' : 'bg-teal-900/30 text-teal-400 hover:bg-teal-900/60 border border-teal-800/40'
                    }`}>
                    {v === 'browse' ? <><Share2 className="w-3.5 h-3.5" />Browse</> :
                     v === 'incoming' ? <><Inbox className="w-3.5 h-3.5" />Incoming {incomingRequests.filter(r => r.status === 'pending').length > 0 && <span className="ml-1 bg-rose-500 text-white rounded-full text-[9px] px-1.5">{incomingRequests.filter(r => r.status === 'pending').length}</span>}</> :
                     <><Send className="w-3.5 h-3.5" />Outgoing</>}
                  </button>
                ))}
              </div>

              {/* BROWSE VIEW */}
              {sharingView === 'browse' && (
                <div className="space-y-3">
                  <p className="text-xs text-teal-400/70 mb-3">Select a hospital to request resources from them. Only hospitals with available units are shown as requestable.</p>
                  {allHospitals.map(h => (
                    <div key={h.id} className="bg-[#0a2822] border border-teal-800/30 rounded-xl p-4 hover:border-teal-600/40 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h3 className="font-bold text-white text-sm">{h.name}</h3>
                          <p className="text-teal-500/60 text-xs mt-0.5">{h.city}</p>
                        </div>
                        <button
                          onClick={() => { setRequestModal({ open: true, hospital: h }); setRequestForm({ resourceType: 'oxygen', quantity: '10', message: '' }); }}
                          className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-white text-xs font-bold rounded-lg transition-all flex items-center gap-1"
                        >
                          <Send className="w-3 h-3" /> Request
                        </button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: 'ICU Beds', val: h.icu_beds_available, color: h.icu_beds_available > 0 ? 'text-teal-300' : 'text-rose-400' },
                          { label: 'O₂ Cylinders', val: h.oxygen_cylinders_available, color: h.oxygen_cylinders_available > 0 ? 'text-teal-300' : 'text-rose-400' },
                          { label: 'Ambulances', val: h.ambulances_available, color: h.ambulances_available > 0 ? 'text-teal-300' : 'text-rose-400' },
                          { label: 'Gen. Beds', val: h.totalBeds, color: h.totalBeds > 0 ? 'text-teal-300' : 'text-rose-400' },
                          { label: 'Ventilators', val: h.ventilators, color: h.ventilators > 0 ? 'text-teal-300' : 'text-rose-400' },
                        ].map(stat => (
                          <div key={stat.label} className="bg-[#071e1a] rounded-lg p-2 border border-teal-900/30 text-center">
                            <div className={`font-extrabold text-base ${stat.color}`}>{stat.val ?? 0}</div>
                            <div className="text-[9px] text-teal-500/50 uppercase tracking-wider mt-0.5">{stat.label}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {allHospitals.length === 0 && <div className="text-center py-12 text-teal-500/40"><Building2 className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No other hospitals in system</p></div>}
                </div>
              )}

              {/* INCOMING VIEW */}
              {sharingView === 'incoming' && (
                <div className="space-y-3">
                  {incomingRequests.map(req => (
                    <div key={req.id} className={`border rounded-xl p-4 transition-all ${
                      req.status === 'pending' ? 'bg-gradient-to-r from-amber-950/20 to-[#0a2822] border-amber-700/40' :
                      req.status === 'agreed' ? 'bg-[#0a2822] border-emerald-800/30' : 'bg-[#0a2822] border-rose-900/30'
                    }`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-white text-sm">{req.fromHospitalName}</span>
                            <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                              req.status === 'pending' ? 'text-amber-400 bg-amber-950/50 border border-amber-800/40' :
                              req.status === 'agreed' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' :
                              'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                            }`}>{req.status}</span>
                          </div>
                          <p className="text-teal-300 text-xs font-semibold">Requesting: <span className="text-white">{req.quantity} × {RESOURCE_LABELS[req.resourceType] || req.resourceType}</span></p>
                          {req.message && <p className="text-teal-400/70 text-xs mt-1 italic">"{req.message}"</p>}
                          {req.responseMessage && <p className="text-teal-300/60 text-xs mt-1">Your reply: <span className="italic">"{req.responseMessage}"</span></p>}
                          <p className="text-teal-500/40 text-[10px] mt-2">{new Date(req.createdAt).toLocaleString()}</p>
                        </div>
                        {req.status === 'pending' && (
                          <button onClick={() => { setRespondModal({ open: true, req }); setRespondNote(''); }}
                            className="ml-3 shrink-0 px-3 py-1.5 bg-teal-700 hover:bg-teal-500 text-white text-xs font-bold rounded-lg transition-all">
                            Respond
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                  {incomingRequests.length === 0 && <div className="text-center py-12 text-teal-500/40"><Inbox className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No incoming resource requests</p></div>}
                </div>
              )}

              {/* OUTGOING VIEW */}
              {sharingView === 'outgoing' && (
                <div className="space-y-3">
                  {outgoingRequests.map(req => (
                    <div key={req.id} className={`border rounded-xl p-4 transition-all ${
                      req.status === 'pending' ? 'bg-[#0a2822] border-teal-800/30' :
                      req.status === 'agreed' ? 'bg-gradient-to-r from-emerald-950/20 to-[#0a2822] border-emerald-800/40' :
                      'bg-gradient-to-r from-rose-950/10 to-[#0a2822] border-rose-900/30'
                    }`}>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-white text-sm">{req.toHospitalName}</span>
                        <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          req.status === 'pending' ? 'text-amber-400 bg-amber-950/50 border border-amber-800/40 animate-pulse' :
                          req.status === 'agreed' ? 'text-emerald-400 bg-emerald-950/40 border border-emerald-800/40' :
                          'text-rose-400 bg-rose-950/40 border border-rose-800/40'
                        }`}>{req.status === 'pending' ? '⏳ Awaiting' : req.status === 'agreed' ? '✅ Agreed' : '❌ Denied'}</span>
                      </div>
                      <p className="text-teal-300 text-xs font-semibold">Requested: <span className="text-white">{req.quantity} × {RESOURCE_LABELS[req.resourceType] || req.resourceType}</span></p>
                      {req.message && <p className="text-teal-400/70 text-xs mt-1 italic">Your note: "{req.message}"</p>}
                      {req.responseMessage && (
                        <div className={`mt-2 p-2 rounded-lg border text-xs ${
                          req.status === 'agreed' ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-300' : 'bg-rose-950/20 border-rose-900/30 text-rose-300'
                        }`}>
                          <span className="font-bold uppercase tracking-wider text-[9px] opacity-70">Their response: </span>"{req.responseMessage}"
                        </div>
                      )}
                      <p className="text-teal-500/40 text-[10px] mt-2">{new Date(req.createdAt).toLocaleString()}</p>
                    </div>
                  ))}
                  {outgoingRequests.length === 0 && <div className="text-center py-12 text-teal-500/40"><Send className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>No outgoing requests yet</p><p className="text-xs mt-1">Go to Browse to request resources from another hospital</p></div>}
                </div>
              )}

              {/* Send Request Modal */}
              {requestModal.open && requestModal.hospital && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071e1a]/90 backdrop-blur-sm p-4">
                  <div className="bg-[#0c2e28] border border-teal-700/50 rounded-2xl w-full max-w-md shadow-2xl">
                    <div className="p-5 border-b border-teal-800/40 flex items-center justify-between">
                      <h3 className="text-white font-bold">Request Resources</h3>
                      <button onClick={() => setRequestModal({ open: false, hospital: null })} className="text-teal-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-800/30">
                        <p className="text-teal-400/60 text-[10px] uppercase tracking-wider">Requesting from</p>
                        <p className="text-white font-bold">{requestModal.hospital.name}</p>
                      </div>
                      <div>
                        <label className="block text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">Resource Type</label>
                        <select value={requestForm.resourceType} onChange={e => setRequestForm(p => ({ ...p, resourceType: e.target.value }))}
                          className="w-full bg-[#071e1a] border border-teal-800/50 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 outline-none">
                          {Object.entries(RESOURCE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">Quantity Needed</label>
                        <input type="number" min="1" value={requestForm.quantity} onChange={e => setRequestForm(p => ({ ...p, quantity: e.target.value }))}
                          className="w-full bg-[#071e1a] border border-teal-800/50 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 outline-none" />
                      </div>
                      <div>
                        <label className="block text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">Note / Reason (optional)</label>
                        <textarea value={requestForm.message} onChange={e => setRequestForm(p => ({ ...p, message: e.target.value }))} rows={3} placeholder="e.g. Critical patient needs oxygen immediately"
                          className="w-full bg-[#071e1a] border border-teal-800/50 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 outline-none resize-none placeholder:text-teal-700" />
                      </div>
                      <button onClick={sendResourceRequest} disabled={sharingLoading}
                        className="w-full py-3 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                        {sharingLoading ? 'Sending...' : <><Send className="w-4 h-4" /> Send Request</>}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Respond Modal */}
              {respondModal.open && respondModal.req && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#071e1a]/90 backdrop-blur-sm p-4">
                  <div className="bg-[#0c2e28] border border-teal-700/50 rounded-2xl w-full max-w-md shadow-2xl">
                    <div className="p-5 border-b border-teal-800/40 flex items-center justify-between">
                      <h3 className="text-white font-bold">Respond to Request</h3>
                      <button onClick={() => setRespondModal({ open: false, req: null })} className="text-teal-400 hover:text-white"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="p-5 space-y-4">
                      <div className="bg-teal-900/20 rounded-lg p-3 border border-teal-800/30">
                        <p className="text-teal-400/60 text-[10px] uppercase tracking-wider">From</p>
                        <p className="text-white font-bold">{respondModal.req.fromHospitalName}</p>
                        <p className="text-teal-300 text-sm mt-1">Needs: <strong>{respondModal.req.quantity} × {RESOURCE_LABELS[respondModal.req.resourceType] || respondModal.req.resourceType}</strong></p>
                        {respondModal.req.message && <p className="text-teal-400/70 text-xs italic mt-1">"{respondModal.req.message}"</p>}
                      </div>
                      <div>
                        <label className="block text-teal-200 text-xs font-bold uppercase tracking-wider mb-2">Your Message / Reason</label>
                        <textarea value={respondNote} onChange={e => setRespondNote(e.target.value)} rows={3} placeholder="e.g. We can provide 5 cylinders by tomorrow morning"
                          className="w-full bg-[#071e1a] border border-teal-800/50 rounded-lg px-4 py-2.5 text-white focus:border-teal-500 outline-none resize-none placeholder:text-teal-700" />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <button onClick={() => respondToRequest('agreed')} disabled={sharingLoading}
                          className="py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" /> Agree
                        </button>
                        <button onClick={() => respondToRequest('denied')} disabled={sharingLoading}
                          className="py-3 bg-rose-700 hover:bg-rose-600 disabled:opacity-50 text-white font-bold rounded-xl transition-all flex items-center justify-center gap-2">
                          <XCircle className="w-4 h-4" /> Deny
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </main>
      </div>

      {/* ─── Hospital Profile Slide-Over Panel ────────────────────────────────── */}
      {profilePanelOpen && (
        <div className="fixed inset-0 z-[200] flex justify-end">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => { setProfilePanelOpen(false); setEditingProfile(false); setCsvView('none'); }} />
          {/* Panel */}
          <div className="relative w-full max-w-lg bg-[#071e1a] border-l border-teal-800/50 h-full overflow-y-auto shadow-2xl flex flex-col">
            {/* Panel Header */}
            <div className="sticky top-0 z-10 bg-[#0a2822]/95 backdrop-blur-sm border-b border-teal-800/40 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-teal-900/60 border border-teal-700/40 flex items-center justify-center">
                  <UserCircle2 className="w-5 h-5 text-teal-400" />
                </div>
                <div>
                  <h2 className="text-white font-bold text-base">Hospital Profile</h2>
                  <p className="text-teal-500/60 text-[10px] uppercase tracking-wider">Manage your hospital information</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {!editingProfile && (
                  <button onClick={() => setEditingProfile(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-900/40 hover:bg-teal-800/60 border border-teal-700/40 text-teal-300 rounded-lg text-xs font-bold transition-all">
                    <Pencil className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                <button onClick={() => { setProfilePanelOpen(false); setEditingProfile(false); setCsvView('none'); }}
                  className="w-8 h-8 rounded-full bg-teal-900/40 hover:bg-rose-900/50 border border-teal-700/30 flex items-center justify-center text-teal-400 hover:text-white transition-all">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 p-6 space-y-6">
              {profileLoading && (
                <div className="flex items-center justify-center py-12 gap-3 text-teal-400">
                  <div className="w-5 h-5 border-2 border-t-teal-400 border-teal-800 rounded-full animate-spin" />
                  <span className="text-sm">Loading profile from database...</span>
                </div>
              )}
              {!profileLoading && (<>

              {/* CSV Upload Section */}
              <div className="bg-gradient-to-br from-teal-950/40 to-[#041512] border border-teal-800/40 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <FileSpreadsheet className="w-4 h-4 text-teal-400" />
                  <h3 className="text-white font-bold text-sm">Bulk Import via CSV</h3>
                </div>
                <p className="text-teal-400/70 text-xs mb-4">Download the template pre-filled with your current data, update it, and re-upload to apply all changes instantly.</p>

                {csvView === 'done' ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-400 font-bold text-sm">
                    <CheckCircle className="w-4 h-4" /> Profile updated from CSV!
                  </div>
                ) : csvView === 'uploading' ? (
                  <div className="flex items-center gap-2 px-4 py-3 bg-teal-950/40 border border-teal-800/40 rounded-xl text-teal-300 text-sm">
                    <div className="w-4 h-4 border-2 border-t-teal-400 border-teal-800 rounded-full animate-spin" />
                    Processing CSV...
                  </div>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={downloadExampleCsv}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-900/40 hover:bg-teal-800/50 border border-teal-700/40 text-teal-300 rounded-xl text-xs font-bold transition-all">
                      <Download className="w-3.5 h-3.5" /> Download Template
                    </button>
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-teal-500 hover:bg-teal-400 text-white rounded-xl text-xs font-bold cursor-pointer transition-all">
                      <Upload className="w-3.5 h-3.5" /> Upload CSV
                      <input type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
                    </label>
                  </div>
                )}

                {/* CSV preview table */}
                <div className="mt-4 rounded-lg overflow-x-auto border border-teal-900/40">
                  <table className="w-full text-[9px] text-left">
                    <thead className="bg-teal-950/50">
                      <tr>{['name','address','city','phone','openingTime','closingTime','totalBeds','icuBeds','oxygen'].map(h => <th key={h} className="px-2 py-1.5 text-teal-500/70 uppercase tracking-wider font-bold whitespace-nowrap">{h}</th>)}</tr>
                    </thead>
                    <tbody>
                      <tr className="border-t border-teal-900/30">
                        {[profileForm.name, profileForm.address, profileForm.city, profileForm.phone, profileForm.openingTime, profileForm.closingTime, profileForm.totalBeds, profileForm.icu_beds_available, profileForm.oxygen_cylinders_available]
                          .map((v, i) => <td key={i} className="px-2 py-1.5 text-teal-200/80 whitespace-nowrap max-w-[80px] overflow-hidden text-ellipsis">{v || '—'}</td>)}
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Profile Fields */}
              {profileSaved && (
                <div className="flex items-center gap-2 px-4 py-3 bg-emerald-950/40 border border-emerald-800/40 rounded-xl text-emerald-400 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" /> Profile saved successfully!
                </div>
              )}

              {/* Basic Info */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-teal-500/60 uppercase tracking-widest font-bold flex items-center gap-2"><Building2 className="w-3.5 h-3.5" />Basic Information</h3>
                {([
                  { label: 'Hospital Name', key: 'name', icon: <Building2 className="w-3.5 h-3.5" />, type: 'text' },
                  { label: 'Phone', key: 'phone', icon: <Phone className="w-3.5 h-3.5" />, type: 'text' },
                  { label: 'Email', key: 'email', icon: <Mail className="w-3.5 h-3.5" />, type: 'email' },
                ] as const).map(({ label, key, icon, type }) => (
                  <div key={key} className="flex items-center gap-3 bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                    <span className="text-teal-500/60 shrink-0">{icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">{label}</p>
                      {editingProfile
                        ? <input type={type} value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" />
                        : <p className="text-white text-sm font-semibold mt-0.5 truncate">{(profileForm as any)[key] || <span className="text-teal-500/40 italic">Not set</span>}</p>
                      }
                    </div>
                  </div>
                ))}
              </div>

              {/* Address */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-teal-500/60 uppercase tracking-widest font-bold flex items-center gap-2"><MapPin className="w-3.5 h-3.5" />Location</h3>
                {([
                  { label: 'Address', key: 'address' },
                  { label: 'City', key: 'city' },
                  { label: 'State', key: 'state' },
                  { label: 'Zip Code', key: 'zipCode' },
                ] as const).map(({ label, key }) => (
                  <div key={key} className="flex items-center gap-3 bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">{label}</p>
                      {editingProfile
                        ? <input value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" />
                        : <p className="text-white text-sm font-semibold mt-0.5">{(profileForm as any)[key] || <span className="text-teal-500/40 italic">Not set</span>}</p>
                      }
                    </div>
                  </div>
                ))}
                {editingProfile && (
                  <div className="grid grid-cols-2 gap-2">
                    {([{ label: 'Latitude', key: 'latitude' }, { label: 'Longitude', key: 'longitude' }] as const).map(({ label, key }) => (
                      <div key={key} className="bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                        <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">{label}</p>
                        <input value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                          className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Hours & Specializations */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-teal-500/60 uppercase tracking-widest font-bold flex items-center gap-2"><Clock className="w-3.5 h-3.5" />Operations</h3>
                <div className="grid grid-cols-2 gap-2">
                  {([{ label: 'Opening Time', key: 'openingTime' }, { label: 'Closing Time', key: 'closingTime' }] as const).map(({ label, key }) => (
                    <div key={key} className="bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                      <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">{label}</p>
                      {editingProfile
                        ? <input type="time" value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" />
                        : <p className="text-white text-sm font-bold mt-0.5">{(profileForm as any)[key] || '—'}</p>
                      }
                    </div>
                  ))}
                </div>
                <div className="bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                  <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">Specializations <span className="text-teal-600/60">(comma separated)</span></p>
                  {editingProfile
                    ? <input value={profileForm.specializations} onChange={e => setProfileForm(p => ({ ...p, specializations: e.target.value }))}
                        className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" placeholder="e.g. Cardiology, Neurology" />
                    : <p className="text-white text-sm mt-0.5">{profileForm.specializations || <span className="text-teal-500/40 italic">Not set</span>}</p>
                  }
                </div>
              </div>

              {/* Resources */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-teal-500/60 uppercase tracking-widest font-bold flex items-center gap-2"><Activity className="w-3.5 h-3.5" />Resources</h3>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { label: 'Total Beds', key: 'totalBeds' },
                    { label: 'ICU Beds', key: 'icu_beds_available' },
                    { label: 'Oxygen Cylinders', key: 'oxygen_cylinders_available' },
                    { label: 'Ambulances', key: 'ambulances_available' },
                    { label: 'Ventilators', key: 'ventilators' },
                  ] as const).map(({ label, key }) => (
                    <div key={key} className="bg-[#0a2822] border border-teal-800/30 rounded-xl px-4 py-3">
                      <p className="text-teal-500/50 text-[9px] uppercase tracking-wider">{label}</p>
                      {editingProfile
                        ? <input type="number" min="0" value={(profileForm as any)[key]} onChange={e => setProfileForm(p => ({ ...p, [key]: e.target.value }))}
                            className="w-full bg-transparent text-white text-sm outline-none border-b border-teal-700/40 focus:border-teal-400 mt-0.5 py-0.5" />
                        : <p className="text-white text-lg font-extrabold mt-0.5">{(profileForm as any)[key] || '0'}</p>
                      }
                    </div>
                  ))}
                </div>
              </div>

              {/* Save Button */}
              {editingProfile && (
                <div className="flex gap-3 pt-2 pb-6">
                  <button onClick={() => setEditingProfile(false)}
                    className="flex-1 py-3 rounded-xl border border-teal-800/40 text-teal-400 hover:bg-teal-900/30 font-bold text-sm transition-all">
                    Cancel
                  </button>
                  <button onClick={saveProfile} disabled={profileSaving}
                    className="flex-1 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-white font-bold text-sm transition-all flex items-center justify-center gap-2">
                    {profileSaving ? <><div className="w-4 h-4 border-2 border-t-white border-white/30 rounded-full animate-spin" />Saving...</> : <><Save className="w-4 h-4" />Save Profile</>}
                  </button>
                </div>
              )}
              </>)}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}