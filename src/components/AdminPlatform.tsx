import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  Users,
  Shirt,
  Star,
  Crown,
  Trash2,
  Lock,
  Unlock,
  PlusCircle,
  Megaphone,
  Mail,
  Search,
  CheckCircle2,
  DollarSign,
  Activity,
  FileText,
  Send,
  AlertTriangle,
  UserPlus
} from 'lucide-react';
import { User, Garment, PromotionPlan, AdminLog } from '../types';
import { api } from '../services/api';
import confetti from 'canvas-confetti';

interface AdminPlatformProps {
  currentUser: User;
  onOpenChatWithUser: (user: any) => void;
}

export const AdminPlatform: React.FC<AdminPlatformProps> = ({
  currentUser,
  onOpenChatWithUser,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'tailors' | 'garments' | 'promotions' | 'broadcast' | 'admins' | 'logs'>('overview');
  const [stats, setStats] = useState<any>({});
  const [users, setUsers] = useState<User[]>([]);
  const [garments, setGarments] = useState<Garment[]>([]);
  const [logs, setLogs] = useState<AdminLog[]>([]);
  const [plans, setPlans] = useState<PromotionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Search in tables
  const [userSearch, setUserSearch] = useState('');
  const [garmentSearch, setGarmentSearch] = useState('');

  // Create Promotion Plan form
  const [newPlanName, setNewPlanName] = useState('');
  const [newPlanPrice, setNewPlanPrice] = useState('');
  const [newPlanDays, setNewPlanDays] = useState('30');
  const [newPlanDesc, setNewPlanDesc] = useState('');
  const [newPlanPerks, setNewPlanPerks] = useState('');
  const [newPlanBadge, setNewPlanBadge] = useState('FEATURED');

  // Broadcast Message form
  const [broadcastText, setBroadcastText] = useState('');
  const [broadcastTarget, setBroadcastTarget] = useState<'all' | 'tailors' | 'customers'>('all');
  const [isSendingBroadcast, setIsSendingBroadcast] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState(false);

  // Add Co-Admin form
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [newAdminName, setNewAdminName] = useState('');
  const [newAdminPassword, setNewAdminPassword] = useState('');

  useEffect(() => {
    fetchAdminData();
  }, []);

  const fetchAdminData = async () => {
    setIsLoading(true);
    try {
      const res = await api.getAdminDashboard();
      if (res && res.stats) {
        setStats(res.stats);
        setUsers(res.users || []);
        setGarments(res.garments || []);
        setLogs(res.logs || []);
        setPlans(res.plans || []);
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleBlock = async (tailor: User) => {
    const action = tailor.isBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} tailor "${tailor.name}"?`)) return;

    try {
      const res = await api.adminBlockTailor(tailor.id, !tailor.isBlocked, currentUser.email);
      if (res.success) {
        setUsers(users.map((u) => (u.id === tailor.id ? { ...u, isBlocked: res.isBlocked } : u)));
        alert(`Tailor ${tailor.name} ${res.isBlocked ? 'blocked' : 'unblocked'}.`);
      }
    } catch (err: any) {
      alert(err.message || 'Block action failed');
    }
  };

  const handleDeleteTailor = async (tailor: User) => {
    if (!window.confirm(`WARNING: Deleting "${tailor.name}" will permanently erase their account and all uploaded garments. Proceed?`)) return;

    try {
      const res = await api.adminDeleteTailor(tailor.id, currentUser.email);
      if (res.success) {
        setUsers(users.filter((u) => u.id !== tailor.id));
        setGarments(garments.filter((g) => g.tailorId !== tailor.id));
        alert('Tailor account and garments deleted.');
      }
    } catch (err: any) {
      alert(err.message || 'Delete tailor failed');
    }
  };

  const handleTogglePromote = async (tailor: User) => {
    const isPromoting = !tailor.isPromoted;
    try {
      const res = await api.adminPromoteTailor(
        tailor.id,
        isPromoting,
        isPromoting ? 'Spotlight Gold Tier' : '',
        currentUser.email
      );
      if (res.success) {
        setUsers(users.map((u) => (u.id === tailor.id ? { ...u, isPromoted: res.isPromoted } : u)));
        setGarments(garments.map((g) => (g.tailorId === tailor.id ? { ...g, tailorIsPromoted: res.isPromoted } : g)));
        if (isPromoting) confetti({ particleCount: 70, spread: 60 });
      }
    } catch (err: any) {
      alert(err.message || 'Promote update failed');
    }
  };

  const handleDeleteGarment = async (garment: Garment) => {
    if (!window.confirm(`Delete garment "${garment.title}" permanently?`)) return;
    try {
      await api.deleteGarment(garment.id, currentUser.id, 'admin');
      setGarments(garments.filter((g) => g.id !== garment.id));
      alert('Garment removed.');
    } catch (err: any) {
      alert(err.message || 'Failed to delete garment');
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminCreatePromotionPlan({
        name: newPlanName,
        price: newPlanPrice,
        durationDays: Number(newPlanDays) || 30,
        description: newPlanDesc,
        perks: newPlanPerks.split('\n').filter(Boolean),
        badgeLabel: newPlanBadge,
        adminEmail: currentUser.email,
      });

      if (res.plan) {
        setPlans([res.plan, ...plans]);
        setNewPlanName('');
        setNewPlanPrice('');
        setNewPlanDesc('');
        setNewPlanPerks('');
        alert('New Promotion Plan published to Tailors Studio!');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create plan');
    }
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastText.trim()) return;

    setIsSendingBroadcast(true);
    try {
      await api.sendMessage({
        senderId: currentUser.id,
        senderName: 'Fabric Reality Administration',
        senderRole: 'admin',
        recipientId: broadcastTarget,
        text: broadcastText,
        isAnnouncement: true,
        targetAudience: broadcastTarget,
      });

      setBroadcastSuccess(true);
      setBroadcastText('');
      setTimeout(() => setBroadcastSuccess(false), 4000);
    } catch (err: any) {
      alert(err.message || 'Broadcast failed');
    } finally {
      setIsSendingBroadcast(false);
    }
  };

  const handleAddAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.adminAddAdmin(
        newAdminEmail,
        newAdminName,
        newAdminPassword,
        currentUser.email
      );
      if (res.success) {
        alert(res.message);
        setNewAdminEmail('');
        setNewAdminName('');
        setNewAdminPassword('');
        fetchAdminData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to add admin');
    }
  };

  const tailorsList = users.filter((u) => u.role === 'tailor');
  const filteredTailors = tailorsList.filter(
    (t) =>
      t.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      t.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      t.city.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredGarments = garments.filter(
    (g) =>
      g.title.toLowerCase().includes(garmentSearch.toLowerCase()) ||
      g.tailorName.toLowerCase().includes(garmentSearch.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Admin Crown Header */}
      <div className="rounded-3xl bg-gradient-to-r from-red-950/80 via-stone-900 to-amber-950/80 p-6 sm:p-8 border border-red-900/60 shadow-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-950 border border-red-700 text-red-300 text-xs font-bold uppercase tracking-wider mb-2">
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>Master Administration Platform</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-serif font-black text-stone-100">
            Fabric Reality Executive Control Center
          </h1>
          <p className="text-xs text-stone-400 mt-1 font-mono">
            Authenticated Admin: <span className="text-amber-400 font-bold">{currentUser.email}</span> • Desk Phone: 08029772375
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('broadcast')}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
          >
            <Megaphone className="w-4 h-4" />
            <span>Post Broadcast</span>
          </button>
          <button
            onClick={() => setActiveTab('promotions')}
            className="px-4 py-2.5 rounded-xl bg-stone-900 hover:bg-stone-800 text-amber-300 border border-amber-500/40 font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Crown className="w-4 h-4 text-amber-400" />
            <span>Plans & Invoices</span>
          </button>
        </div>
      </div>

      {/* Admin Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center">
          <div className="text-2xl font-black font-serif text-amber-400">{stats.totalTailors || tailorsList.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Active Tailors</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center">
          <div className="text-2xl font-black font-serif text-amber-400">{stats.totalCustomers || 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Fashion Customers</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center">
          <div className="text-2xl font-black font-serif text-amber-400">{garments.length}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">S3 Garments</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center">
          <div className="text-2xl font-black font-serif text-amber-400">{stats.totalPromotedTailors || 0}</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Promoted Artisans</div>
        </div>
        <div className="p-4 rounded-2xl bg-stone-900/90 border border-stone-800 text-center">
          <div className="text-2xl font-black font-serif text-emerald-400">AWS eu-north-1</div>
          <div className="text-[11px] text-stone-400 mt-0.5">Storage Status</div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none text-xs font-bold border-b border-stone-800">
        {[
          { key: 'tailors', label: `Tailors Directory (${tailorsList.length})`, icon: Users },
          { key: 'garments', label: `Garment Moderation (${garments.length})`, icon: Shirt },
          { key: 'promotions', label: 'Promotion Plans & Invoicing', icon: Crown },
          { key: 'broadcast', label: 'Broadcast Messaging', icon: Megaphone },
          { key: 'admins', label: 'Appoint Co-Admins', icon: UserPlus },
          { key: 'logs', label: 'Audit Security Logs', icon: Activity },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key as any)}
              className={`px-4 py-2 rounded-xl flex items-center gap-2 transition-all whitespace-nowrap ${
                isActive ? 'bg-amber-500 text-stone-950 font-black shadow' : 'text-stone-400 hover:text-stone-200'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: TAILORS MANAGEMENT --- */}
      {activeTab === 'tailors' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              Registered Master Tailors & Studio Accounts
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Search tailor by name, email, city..."
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/80">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3.5">Tailor & Brand</th>
                  <th className="p-3.5">Contact / WhatsApp</th>
                  <th className="p-3.5">Location</th>
                  <th className="p-3.5">Rating & Status</th>
                  <th className="p-3.5">Promotion Rank</th>
                  <th className="p-3.5 text-right">Admin Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-sans">
                {filteredTailors.map((tailor) => (
                  <tr key={tailor.id} className="hover:bg-stone-950/50 transition-colors">
                    <td className="p-3.5 flex items-center gap-3">
                      <img
                        src={tailor.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${tailor.name}`}
                        alt={tailor.name}
                        className="w-10 h-10 rounded-full object-cover border border-stone-700"
                      />
                      <div>
                        <div className="font-bold text-stone-100">{tailor.name}</div>
                        <div className="text-[11px] text-stone-400 font-mono">{tailor.email}</div>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono text-[11px]">
                      <div>📞 {tailor.phone || 'N/A'}</div>
                      <div className="text-emerald-400">💬 {tailor.whatsappPhone || tailor.phone}</div>
                    </td>

                    <td className="p-3.5">
                      <div>{tailor.city}, {tailor.state}</div>
                      <div className="text-stone-500 text-[10px]">{tailor.country}</div>
                    </td>

                    <td className="p-3.5">
                      <div className="flex items-center gap-1 text-amber-400 font-bold">
                        <Star className="w-3 h-3 fill-amber-400" />
                        {tailor.ratingAverage.toFixed(1)} ({tailor.ratingCount})
                      </div>
                      <span
                        className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          tailor.isBlocked
                            ? 'bg-red-950 text-red-300 border border-red-800'
                            : 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        }`}
                      >
                        {tailor.isBlocked ? 'SUSPENDED' : 'ACTIVE'}
                      </span>
                    </td>

                    <td className="p-3.5">
                      <button
                        onClick={() => handleTogglePromote(tailor)}
                        className={`px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
                          tailor.isPromoted
                            ? 'bg-amber-500 text-stone-950 shadow'
                            : 'bg-stone-950 text-stone-400 border border-stone-800 hover:border-amber-500/40'
                        }`}
                      >
                        <Crown className="w-3.5 h-3.5" />
                        <span>{tailor.isPromoted ? 'Promoted ✓' : 'Promote Tailor'}</span>
                      </button>
                    </td>

                    <td className="p-3.5 text-right space-x-1.5">
                      <button
                        onClick={() => onOpenChatWithUser(tailor)}
                        className="p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-amber-400"
                        title="Send Private Message"
                      >
                        <Mail className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleToggleBlock(tailor)}
                        className={`p-1.5 rounded-lg ${
                          tailor.isBlocked ? 'bg-emerald-900 text-emerald-200' : 'bg-stone-800 text-amber-400'
                        }`}
                        title={tailor.isBlocked ? 'Unblock Tailor' : 'Block Tailor'}
                      >
                        {tailor.isBlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => handleDeleteTailor(tailor)}
                        className="p-1.5 rounded-lg bg-red-950/80 hover:bg-red-800 text-red-300"
                        title="Delete Tailor Permanently"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: GARMENT MODERATION --- */}
      {activeTab === 'garments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <h2 className="text-lg font-serif font-bold text-stone-100">
              Garments & Photos Published to S3 ({garments.length})
            </h2>
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
              <input
                type="text"
                value={garmentSearch}
                onChange={(e) => setGarmentSearch(e.target.value)}
                placeholder="Search by cloth title or tailor..."
                className="w-full pl-9 pr-3 py-2 bg-stone-900 border border-stone-800 rounded-xl text-xs text-stone-100 placeholder-stone-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {filteredGarments.map((g) => (
              <div key={g.id} className="p-3 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="relative aspect-[4/5] bg-stone-950 rounded-xl overflow-hidden">
                  <img src={g.imageUrl} alt={g.title} className="w-full h-full object-cover" />
                  <button
                    onClick={() => handleDeleteGarment(g)}
                    className="absolute top-1.5 right-1.5 p-1 rounded-md bg-red-950/80 hover:bg-red-800 text-red-300"
                    title="Delete Inappropriate Garment"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div>
                  <h3 className="text-xs font-bold text-stone-100 truncate">{g.title}</h3>
                  <p className="text-[11px] text-amber-400 truncate">By {g.tailorName}</p>
                  <span className="text-[10px] text-stone-400 font-mono">
                    {g.currency}{g.price.toLocaleString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 3: PROMOTION PLANS & INVOICING SETUP --- */}
      {activeTab === 'promotions' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Create Plan Form */}
          <div className="bg-stone-900 rounded-3xl p-6 border border-stone-800 space-y-4">
            <div className="flex items-center gap-2 text-amber-400">
              <Crown className="w-5 h-5" />
              <h2 className="text-base font-bold text-stone-100">Create & Post Tailor Promotion Plan</h2>
            </div>
            <p className="text-xs text-stone-400">
              This will create a visible plan card in the Tailors' Promotion Center. When tailors select it, they will be routed to WhatsApp <strong>08029772375</strong> with the plan details.
            </p>

            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-stone-300 mb-1">Plan Name *</label>
                <input
                  type="text"
                  required
                  value={newPlanName}
                  onChange={(e) => setNewPlanName(e.target.value)}
                  placeholder="e.g. Master Gold Carousel Booster"
                  className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Price / Invoice Rate *</label>
                  <input
                    type="text"
                    required
                    value={newPlanPrice}
                    onChange={(e) => setNewPlanPrice(e.target.value)}
                    placeholder="₦45,000 / $45 (30 Days)"
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-300 mb-1">Duration (Days)</label>
                  <input
                    type="number"
                    value={newPlanDays}
                    onChange={(e) => setNewPlanDays(e.target.value)}
                    className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-300 mb-1">Perks & Deliverables (One per line)</label>
                <textarea
                  rows={3}
                  value={newPlanPerks}
                  onChange={(e) => setNewPlanPerks(e.target.value)}
                  placeholder="Top Homepage Hero Carousel Feature&#10;5x Search Algorithm Boost in Area&#10;Promoted Gold Ribbon on all clothes"
                  className="w-full px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 resize-none"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow"
              >
                Post Promotion Plan to Marketplace
              </button>
            </form>
          </div>

          {/* Active Plans List */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-stone-200">Active Marketplace Packages ({plans.length})</h3>
            {plans.map((p) => (
              <div key={p.id} className="p-4 rounded-2xl bg-stone-900 border border-stone-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-stone-100">{p.name}</h4>
                  <span className="text-xs font-black font-serif text-amber-400">{p.price}</span>
                </div>
                <p className="text-xs text-stone-400">{p.description}</p>
                <div className="text-[11px] text-amber-300 font-mono">Inquiries routed to: 08029772375</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- TAB 4: BROADCAST MESSAGING --- */}
      {activeTab === 'broadcast' && (
        <div className="max-w-2xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <Megaphone className="w-5 h-5" />
            <h2 className="text-lg font-bold text-stone-100">Send Global Broadcast Announcement</h2>
          </div>
          <p className="text-xs text-stone-400">
            Publish public alerts, fashion festival announcements, platform updates, or promotional notices directly to users' in-app inbox and live notification bars.
          </p>

          {broadcastSuccess && (
            <div className="p-3 bg-emerald-950 border border-emerald-800 rounded-xl text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Broadcast successfully sent to selected audience!</span>
            </div>
          )}

          <form onSubmit={handleSendBroadcast} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">Target Audience</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'all', label: 'Everyone (All)' },
                  { id: 'tailors', label: 'Tailors Only' },
                  { id: 'customers', label: 'Customers Only' },
                ].map((aud) => (
                  <button
                    key={aud.id}
                    type="button"
                    onClick={() => setBroadcastTarget(aud.id as any)}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                      broadcastTarget === aud.id
                        ? 'bg-amber-500 text-stone-950 border-amber-400'
                        : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                    }`}
                  >
                    {aud.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Announcement Message Body</label>
              <textarea
                rows={4}
                required
                value={broadcastText}
                onChange={(e) => setBroadcastText(e.target.value)}
                placeholder="Type your official announcement here..."
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100 resize-none focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              type="submit"
              disabled={isSendingBroadcast}
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              <span>{isSendingBroadcast ? 'Broadcasting...' : 'Publish Official Broadcast'}</span>
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 5: APPOINT CO-ADMINS --- */}
      {activeTab === 'admins' && (
        <div className="max-w-xl mx-auto bg-stone-900 rounded-3xl p-6 sm:p-8 border border-stone-800 space-y-4">
          <div className="flex items-center gap-2 text-amber-400">
            <UserPlus className="w-5 h-5" />
            <h2 className="text-lg font-bold text-stone-100">Appoint Trusted Co-Administrator</h2>
          </div>
          <p className="text-xs text-stone-400">
            Appointed administrators have complete access to moderate garments, block tailors, send broadcasts, and manage promotion plans.
          </p>

          <form onSubmit={handleAddAdmin} className="space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-stone-300 mb-1">Admin Full Name</label>
              <input
                type="text"
                required
                value={newAdminName}
                onChange={(e) => setNewAdminName(e.target.value)}
                placeholder="e.g. Obamhi Co-Director"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Admin Email Address</label>
              <input
                type="email"
                required
                value={newAdminEmail}
                onChange={(e) => setNewAdminEmail(e.target.value)}
                placeholder="admin2@fabricreality.com"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
              />
            </div>

            <div>
              <label className="block font-semibold text-stone-300 mb-1">Admin Password</label>
              <input
                type="password"
                required
                value={newAdminPassword}
                onChange={(e) => setNewAdminPassword(e.target.value)}
                placeholder="Set secure password"
                className="w-full px-3.5 py-2.5 bg-stone-950 border border-stone-800 rounded-xl text-stone-100"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold text-xs rounded-xl shadow"
            >
              Authorize & Create Co-Admin Account
            </button>
          </form>
        </div>
      )}

      {/* --- TAB 6: AUDIT SECURITY LOGS --- */}
      {activeTab === 'logs' && (
        <div className="space-y-4">
          <h2 className="text-lg font-serif font-bold text-stone-100">
            System Security & Action Logs ({logs.length})
          </h2>
          <div className="overflow-x-auto rounded-2xl border border-stone-800 bg-stone-900/80">
            <table className="w-full text-left text-xs text-stone-300">
              <thead className="bg-stone-950 text-stone-400 font-semibold border-b border-stone-800">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Admin</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-800 font-mono text-[11px]">
                {logs.map((l) => (
                  <tr key={l.id} className="hover:bg-stone-950/40">
                    <td className="p-3 text-stone-500">{new Date(l.timestamp).toLocaleString()}</td>
                    <td className="p-3 text-amber-400">{l.adminEmail}</td>
                    <td className="p-3 font-bold text-stone-200">{l.action}</td>
                    <td className="p-3 text-stone-300">{l.target}</td>
                    <td className="p-3 text-stone-400">{l.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
