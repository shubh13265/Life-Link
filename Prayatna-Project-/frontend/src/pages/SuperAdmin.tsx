import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield, LayoutDashboard, Building2, Users, AlertTriangle,
  CalendarDays, Share2, Car, LogOut, RefreshCw, Eye, EyeOff,
  TrendingUp, Activity, CheckCircle, XCircle, Clock, Search, ChevronDown
} from 'lucide-react';

const API = 'http://localhost:5000';

// ─── Types ────────────────────────────────────────────────────────────────────
interface Stats {
  users: { total: number; patient: number; ambulance_driver: number; hospital_admin: number };
  entities: { hospitals: number; ambulanceDrivers: number; emergencies: number; appointments: number; ambulanceNotifications: number; resourceRequests: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (d: string | Date) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';
const token = () => sessionStorage.getItem('ll_admin_token') || '';
const authH = () => ({ Authorization: `Bearer ${token()}`, 'Content-Type': 'application/json' });

async function apiFetch(path: string) {
  const r = await fetch(`${API}/api/super-admin${path}`, { headers: authH() });
  return r.json();
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function Badge({ v }: { v: string }) {
  const color = v === 'pending' ? 'bg-amber-900/50 text-amber-300 border-amber-700/40'
    : v === 'approved' || v === 'agreed' || v === 'accepted' ? 'bg-emerald-900/50 text-emerald-300 border-emerald-700/40'
    : v === 'rejected' || v === 'denied' ? 'bg-rose-900/50 text-rose-300 border-rose-700/40'
    : 'bg-teal-900/40 text-teal-300 border-teal-700/30';
  return <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${color} uppercase`}>{v || '—'}</span>;
}

// ─── Data table ───────────────────────────────────────────────────────────────
function DataTable({ cols, rows, empty = 'No records' }: { cols: string[]; rows: (string | React.ReactNode)[][]; empty?: string }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-teal-800/30">
      <table className="w-full text-xs">
        <thead>
          <tr className="bg-[#0a2822] border-b border-teal-800/30">
            {cols.map(c => <th key={c} className="px-4 py-3 text-left text-teal-400/70 font-bold uppercase tracking-wider whitespace-nowrap">{c}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0
            ? <tr><td colSpan={cols.length} className="px-4 py-8 text-center text-teal-600/50">{empty}</td></tr>
            : rows.map((row, i) => (
              <tr key={i} className={`border-b border-teal-900/30 ${i % 2 === 0 ? 'bg-[#071e1a]' : 'bg-[#041512]'} hover:bg-teal-900/20 transition-colors`}>
                {row.map((cell, j) => <td key={j} className="px-4 py-3 text-teal-100/80 whitespace-nowrap max-w-[220px] truncate">{cell}</td>)}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
}

// ─── Login Screen ─────────────────────────────────────────────────────────────
function AdminLogin({ onLogin }: { onLogin: (tok: string) => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!username || !password) { setErr('Please fill in all fields'); return; }
    setLoading(true); setErr('');
    try {
      const r = await fetch(`${API}/api/super-admin/login`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const d = await r.json();
      if (!d.success) { setErr(d.message || 'Invalid credentials'); }
      else { sessionStorage.setItem('ll_admin_token', d.data.token); onLogin(d.data.token); }
    } catch { setErr('Cannot connect to server'); }
    finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#041512] flex items-center justify-center p-4 relative overflow-hidden">
      {/* BG glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-teal-500/5 rounded-full blur-3xl"/>
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-violet-500/5 rounded-full blur-3xl"/>
      </div>
      <div className="w-full max-w-sm relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center mx-auto mb-4 shadow-2xl shadow-teal-500/30">
            <Shield className="w-8 h-8 text-white"/>
          </div>
          <h1 className="text-2xl font-extrabold text-white">Super Admin</h1>
          <p className="text-teal-400/60 text-sm mt-1">LifeLink Platform Control Centre</p>
        </div>
        <div className="bg-[#0a2822]/90 backdrop-blur-xl border border-teal-700/30 rounded-2xl p-6 shadow-2xl space-y-4">
          <div>
            <label className="text-xs font-bold text-teal-400/60 uppercase tracking-wider mb-1.5 block">Username</label>
            <input value={username} onChange={e => setUsername(e.target.value)}
              placeholder="Enter admin username" onKeyDown={e => e.key === 'Enter' && submit()}
              className="w-full bg-[#041512] border border-teal-800/40 rounded-xl px-4 py-3 text-white text-sm placeholder-teal-700/50 outline-none focus:border-teal-500/70 transition-all"/>
          </div>
          <div>
            <label className="text-xs font-bold text-teal-400/60 uppercase tracking-wider mb-1.5 block">Password</label>
            <div className="relative">
              <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                placeholder="Enter password" onKeyDown={e => e.key === 'Enter' && submit()}
                className="w-full bg-[#041512] border border-teal-800/40 rounded-xl px-4 py-3 pr-10 text-white text-sm placeholder-teal-700/50 outline-none focus:border-teal-500/70 transition-all"/>
              <button type="button" onClick={() => setShowPw(s => !s)} className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-600 hover:text-teal-400">
                {showPw ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
              </button>
            </div>
          </div>
          {err && <p className="text-rose-400 text-xs bg-rose-950/30 border border-rose-800/30 rounded-lg px-3 py-2">{err}</p>}
          <button onClick={submit} disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-teal-500 to-violet-600 hover:from-teal-400 hover:to-violet-500 text-white font-bold text-sm transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
            {loading ? <RefreshCw className="w-4 h-4 animate-spin"/> : <><Shield className="w-4 h-4"/>Access Panel</>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon: Icon, color }: { label: string; value: number | string; icon: any; color: string }) {
  return (
    <div className="bg-gradient-to-br from-[#0a2822] to-[#071e1a] border border-teal-800/30 rounded-xl p-5 flex items-center gap-4">
      <div className={`w-12 h-12 rounded-xl ${color} flex items-center justify-center flex-shrink-0`}>
        <Icon className="w-6 h-6 text-white"/>
      </div>
      <div>
        <p className="text-2xl font-extrabold text-white">{value}</p>
        <p className="text-teal-400/60 text-xs uppercase tracking-wider mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function SuperAdmin() {
  const [adminToken, setAdminToken] = useState(() => sessionStorage.getItem('ll_admin_token') || '');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState<Stats | null>(null);
  const [hospitals, setHospitals] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [emergencies, setEmergencies] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [resourceReqs, setResourceReqs] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');

  const fetchAll = useCallback(async () => {
    if (!adminToken) return;
    setLoading(true);
    try {
      const [s, h, u, e, a, r, d] = await Promise.all([
        apiFetch('/stats'), apiFetch('/hospitals'), apiFetch('/users'),
        apiFetch('/emergencies'), apiFetch('/appointments'),
        apiFetch('/resource-requests'), apiFetch('/ambulance-drivers'),
      ]);
      if (s.success) setStats(s.data);
      if (h.success) setHospitals(h.data || []);
      if (u.success) setUsers(u.data || []);
      if (e.success) setEmergencies(e.data || []);
      if (a.success) setAppointments(a.data || []);
      if (r.success) setResourceReqs(r.data || []);
      if (d.success) setDrivers(d.data || []);
    } catch {}
    finally { setLoading(false); }
  }, [adminToken]);

  useEffect(() => { if (adminToken) fetchAll(); }, [adminToken, fetchAll]);

  const logout = () => { sessionStorage.removeItem('ll_admin_token'); setAdminToken(''); };

  if (!adminToken) return <AdminLogin onLogin={tok => setAdminToken(tok)} />;

  const NAV = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'hospitals', label: 'Hospitals', icon: Building2 },
    { id: 'users', label: 'Users', icon: Users },
    { id: 'emergencies', label: 'Emergencies', icon: AlertTriangle },
    { id: 'appointments', label: 'Appointments', icon: CalendarDays },
    { id: 'resource', label: 'Resource Sharing', icon: Share2 },
    { id: 'drivers', label: 'Ambulance Drivers', icon: Car },
  ];

  const filter = (arr: any[], keys: string[]) =>
    arr.filter(r => !search || keys.some(k => String(r[k] || '').toLowerCase().includes(search.toLowerCase())));

  const renderContent = () => {
    switch (activeTab) {

      case 'dashboard':
        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-extrabold text-white">Platform Overview</h2><p className="text-teal-400/50 text-sm">Live data from LifeLink database</p></div>
              <button onClick={fetchAll} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-teal-900/40 hover:bg-teal-800/50 border border-teal-700/40 rounded-xl text-teal-300 text-sm font-bold transition-all">
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}/> Refresh
              </button>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Total Users" value={stats?.users.total ?? '…'} icon={Users} color="bg-gradient-to-br from-teal-500 to-teal-700"/>
              <StatCard label="Hospitals" value={stats?.entities.hospitals ?? '…'} icon={Building2} color="bg-gradient-to-br from-violet-500 to-violet-700"/>
              <StatCard label="Emergencies" value={stats?.entities.emergencies ?? '…'} icon={AlertTriangle} color="bg-gradient-to-br from-rose-500 to-rose-700"/>
              <StatCard label="Appointments" value={stats?.entities.appointments ?? '…'} icon={CalendarDays} color="bg-gradient-to-br from-amber-500 to-orange-600"/>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label="Patients" value={stats?.users.patient ?? '…'} icon={Users} color="bg-gradient-to-br from-emerald-600 to-teal-700"/>
              <StatCard label="Ambulance Drivers" value={stats?.users.ambulance_driver ?? '…'} icon={Car} color="bg-gradient-to-br from-blue-600 to-blue-800"/>
              <StatCard label="Hospital Admins" value={stats?.users.hospital_admin ?? '…'} icon={Shield} color="bg-gradient-to-br from-purple-600 to-indigo-700"/>
              <StatCard label="Resource Requests" value={stats?.entities.resourceRequests ?? '…'} icon={Share2} color="bg-gradient-to-br from-pink-600 to-rose-700"/>
            </div>
            {/* Recent activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-[#0a2822]/60 border border-teal-800/30 rounded-xl p-5">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4 text-teal-400"/>Recent Emergencies</h3>
                <div className="space-y-2">
                  {emergencies.slice(0,5).map((e,i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-teal-900/30 last:border-0">
                      <div><p className="text-white text-xs font-bold">{e.title || e.patientName || 'Emergency'}</p><p className="text-teal-500/60 text-[10px]">{fmt(e.createdAt)}</p></div>
                      <Badge v={e.status}/>
                    </div>
                  ))}
                  {emergencies.length === 0 && <p className="text-teal-600/50 text-xs">No emergency records</p>}
                </div>
              </div>
              <div className="bg-[#0a2822]/60 border border-teal-800/30 rounded-xl p-5">
                <h3 className="text-white font-bold mb-3 flex items-center gap-2"><Share2 className="w-4 h-4 text-teal-400"/>Recent Resource Requests</h3>
                <div className="space-y-2">
                  {resourceReqs.slice(0,5).map((r,i) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-teal-900/30 last:border-0">
                      <div><p className="text-white text-xs font-bold">{r.resourceType} × {r.quantity}</p><p className="text-teal-500/60 text-[10px]">{fmt(r.createdAt)}</p></div>
                      <Badge v={r.status}/>
                    </div>
                  ))}
                  {resourceReqs.length === 0 && <p className="text-teal-600/50 text-xs">No resource requests</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 'hospitals':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">All Hospitals <span className="text-teal-500/60 text-base font-normal">({hospitals.length})</span></h2>
            <DataTable
              cols={['Name','City','Phone','Total Beds','ICU Beds','O₂ Cylinders','Ambulances','Status','Created']}
              rows={filter(hospitals,['name','city','phone']).map(h => [
                h.name, h.city || '—', h.phone || '—',
                h.totalBeds ?? '—', h.icu_beds_available ?? '—',
                h.oxygen_cylinders_available ?? '—', h.ambulances_available ?? '—',
                <Badge key="s" v={h.status || 'active'}/>, fmt(h.createdAt),
              ])}
            />
          </div>
        );

      case 'users':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">All Users <span className="text-teal-500/60 text-base font-normal">({users.length})</span></h2>
            <DataTable
              cols={['Name','Phone','Email','Role','Joined']}
              rows={filter(users,['name','phone','email','type']).map(u => [
                u.name, u.phone, u.email || '—',
                <Badge key="t" v={u.type}/>, fmt(u.createdAt),
              ])}
            />
          </div>
        );

      case 'emergencies':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">Emergency Requests <span className="text-teal-500/60 text-base font-normal">({emergencies.length})</span></h2>
            <DataTable
              cols={['Title / Patient','Phone','Type','Status','Location','Created']}
              rows={filter(emergencies,['title','patientName','phone','type']).map(e => [
                e.title || e.patientName || '—', e.phone || '—', e.type || e.title || '—',
                <Badge key="s" v={e.status}/>,
                e.latitude ? `${e.latitude}, ${e.longitude}` : '—',
                fmt(e.createdAt),
              ])}
            />
          </div>
        );

      case 'appointments':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">Appointments <span className="text-teal-500/60 text-base font-normal">({appointments.length})</span></h2>
            <DataTable
              cols={['Patient Name','Phone','Hospital','Doctor','Date','Status','Created']}
              rows={filter(appointments,['patientName','phone','hospitalName','doctorName']).map(a => [
                a.patientName || '—', a.patientPhone || '—',
                a.hospitalName || '—', a.doctorName || '—',
                a.appointmentDate ? fmt(a.appointmentDate) : '—',
                <Badge key="s" v={a.status}/>, fmt(a.createdAt),
              ])}
            />
          </div>
        );

      case 'resource':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">Resource Sharing Requests <span className="text-teal-500/60 text-base font-normal">({resourceReqs.length})</span></h2>
            <DataTable
              cols={['Resource','Qty','From Hospital','To Hospital','Note','Status','Response','Created']}
              rows={filter(resourceReqs,['resourceType','requestNote']).map(r => [
                r.resourceType || '—', r.quantity ?? '—',
                r.senderHospitalId?.slice(0,8) || '—',
                r.receiverHospitalId?.slice(0,8) || '—',
                r.requestNote || '—',
                <Badge key="s" v={r.status}/>,
                r.responseMessage || '—', fmt(r.createdAt),
              ])}
            />
          </div>
        );

      case 'drivers':
        return (
          <div className="space-y-4">
            <h2 className="text-xl font-extrabold text-white">Ambulance Drivers <span className="text-teal-500/60 text-base font-normal">({drivers.length})</span></h2>
            <DataTable
              cols={['Name','Phone','Vehicle No','License','Agency','Status','Registered']}
              rows={filter(drivers,['name','phone','vehicleNumber','agencyName']).map(d => [
                d.name || '—', d.phone || '—', d.vehicleNumber || '—',
                d.licenseNumber || '—', d.agencyName || '—',
                <Badge key="s" v={d.status || 'active'}/>, fmt(d.createdAt),
              ])}
            />
          </div>
        );

      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#041512] flex">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 bg-[#071e1a] border-r border-teal-800/30 flex flex-col">
        {/* Logo */}
        <div className="px-5 py-5 border-b border-teal-800/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center shadow-lg">
              <Shield className="w-4.5 h-4.5 text-white" style={{width:18,height:18}}/>
            </div>
            <div>
              <p className="text-white font-extrabold text-sm leading-tight">LifeLink</p>
              <p className="text-teal-400/50 text-[10px] uppercase tracking-wider">Super Admin</p>
            </div>
          </div>
        </div>
        {/* Nav */}
        <nav className="flex-1 py-4 px-3 space-y-1">
          {NAV.map(n => (
            <button key={n.id} onClick={() => { setActiveTab(n.id); setSearch(''); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === n.id ? 'bg-teal-500/20 text-teal-300 border border-teal-500/30' : 'text-teal-500/60 hover:text-teal-300 hover:bg-teal-900/30'}`}>
              <n.icon className="w-4 h-4 flex-shrink-0"/>
              {n.label}
            </button>
          ))}
        </nav>
        {/* Admin info + logout */}
        <div className="p-4 border-t border-teal-800/30">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-500 to-violet-600 flex items-center justify-center text-white font-bold text-xs">S</div>
            <div><p className="text-white text-xs font-bold">Sanjay</p><p className="text-teal-500/50 text-[10px]">Super Admin</p></div>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-rose-950/40 hover:bg-rose-900/50 border border-rose-800/30 text-rose-400 text-xs font-bold transition-all">
            <LogOut className="w-3.5 h-3.5"/>Logout
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-h-0 overflow-y-auto">
        {/* Top bar */}
        <div className="sticky top-0 z-10 bg-[#041512]/90 backdrop-blur border-b border-teal-800/20 px-6 py-4 flex items-center gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-teal-600"/>
            <input value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search current table…"
              className="w-full max-w-sm bg-[#071e1a] border border-teal-800/30 rounded-xl pl-9 pr-4 py-2 text-white text-sm placeholder-teal-700/50 outline-none focus:border-teal-500/50 transition-all"/>
          </div>
          <div className="flex items-center gap-2 text-teal-400/50 text-xs">
            <Activity className="w-3.5 h-3.5 text-emerald-400"/>
            <span className="text-emerald-400 font-bold">Live</span> · Last refreshed {new Date().toLocaleTimeString()}
          </div>
          <button onClick={fetchAll} disabled={loading}
            className="flex items-center gap-2 px-3 py-2 bg-teal-900/40 hover:bg-teal-800/50 border border-teal-700/40 rounded-xl text-teal-300 text-xs font-bold transition-all">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}/>
          </button>
        </div>
        <div className="p-6">{renderContent()}</div>
      </main>
    </div>
  );
}
