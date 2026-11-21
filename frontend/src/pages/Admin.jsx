import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { asMoney } from '../lib/format';

export default function Admin() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'withdrawals'
  
  // Users state
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [editBalance, setEditBalance] = useState('');
  const [editSignals, setEditSignals] = useState(false);
  const [saving, setSaving] = useState(false);

  const [kycData, setKycData] = useState(null);
  const [kycLoading, setKycLoading] = useState(false);

  // Withdrawals state
  const [withdrawals, setWithdrawals] = useState([]);
  const [wStatusFilter, setWStatusFilter] = useState('Pending');
  const [wLoading, setWLoading] = useState(false);

  // Settings state
  const [settings, setSettings] = useState({ referral_deposit_threshold: 500 });
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);

  const openUserModal = (user) => {
    setSelectedUser(user);
    setEditBalance(user.balance);
    setEditSignals(user.has_signals_access);
    fetchUserKyc(user.id);
  };

  const fetchUserKyc = async (userId) => {
    setKycLoading(true);
    setKycData(null);
    try {
      const res = await fetch(`/api/admin/users/${userId}/kyc`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setKycData(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setKycLoading(false);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: 10,
        ...(search && { search }),
        ...(statusFilter !== 'All' && { status: statusFilter })
      });
      const res = await fetch(`/api/admin/users?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
        setTotalPages(data.total_pages);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchWithdrawals = async () => {
    setWLoading(true);
    try {
      const query = new URLSearchParams({
        ...(wStatusFilter !== 'All' && { status: wStatusFilter })
      });
      const res = await fetch(`/api/admin/withdrawals?${query}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWithdrawals(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWLoading(false);
    }
  };

  const fetchSettings = async () => {
    setSettingsLoading(true);
    try {
      const res = await fetch(`/api/admin/settings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSettingsLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'withdrawals') fetchWithdrawals();
    else if (activeTab === 'settings') fetchSettings();
  }, [activeTab, page, search, statusFilter, wStatusFilter]);

  const handleStatusChange = async (userId, newStatus) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveDetails = async () => {
    setSaving(true);
    try {
        const parsedBalance = parseFloat(editBalance);
        if (isNaN(parsedBalance) || parsedBalance < 0) {
            alert("Некоректний баланс");
            setSaving(false);
            return;
        }

      const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          balance: parsedBalance,
          has_signals_access: editSignals
        })
      });
      if (res.ok) {
        setUsers(users.map(u => u.id === selectedUser.id ? { ...u, balance: editBalance, has_signals_access: editSignals } : u));
        setSelectedUser(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleImpersonate = async () => {
    if (!window.confirm(`Ви впевнені, що хочете увійти як ${selectedUser.display_name}?`)) return;
    try {
      const res = await fetch(`/api/admin/users/${selectedUser.id}/impersonate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('token', data.access_token);
        window.location.href = '/app';
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawAction = async (id, action) => {
    if (!window.confirm(`Ви впевнені, що хочете ${action === 'approve' ? 'СХВАЛИТИ' : 'ВІДХИЛИТИ'} цей вивід?`)) return;
    try {
      const res = await fetch(`/api/admin/withdrawals/${id}/${action}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        fetchWithdrawals();
      } else {
        const err = await res.json();
        alert(err.detail);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    try {
      const res = await fetch(`/api/admin/settings`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ referral_deposit_threshold: settings.referral_deposit_threshold })
      });
      if (res.ok) {
        alert("Налаштування збережено!");
      } else {
        alert("Помилка збереження налаштувань");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingSettings(false);
    }
  };

  return (
    <div className="min-h-screen bg-app-bg text-app-text p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-[#cfff04]">Панель Адміністратора</h1>
          <button onClick={() => window.location.href = '/app'} className="text-sm underline text-app-muted/60 hover:text-app-text">Повернутися в додаток</button>
        </div>

        <div className="flex space-x-4 mb-8 border-b border-app-border/10">
          <button 
            className={`pb-2 px-2 text-lg font-bold transition-colors ${activeTab === 'users' ? 'text-[#cfff04] border-b-2 border-[#cfff04]' : 'text-app-muted/50 hover:text-app-muted/80'}`}
            onClick={() => setActiveTab('users')}
          >
            Користувачі
          </button>
          <button 
            className={`pb-2 px-2 text-lg font-bold transition-colors ${activeTab === 'withdrawals' ? 'text-[#cfff04] border-b-2 border-[#cfff04]' : 'text-app-muted/50 hover:text-app-muted/80'}`}
            onClick={() => setActiveTab('withdrawals')}
          >
            Запити на вивід
          </button>
          <button 
            className={`pb-2 px-2 text-lg font-bold transition-colors ${activeTab === 'settings' ? 'text-[#cfff04] border-b-2 border-[#cfff04]' : 'text-app-muted/50 hover:text-app-muted/80'}`}
            onClick={() => setActiveTab('settings')}
          >
            Налаштування
          </button>
        </div>
        
        {activeTab === 'users' && (
          <>
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
              <input 
                type="text" 
                placeholder="Пошук (email/ім'я)..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 bg-app-panel border border-app-border/20 rounded-md focus:outline-none focus:border-[#cfff04]"
              />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 bg-app-panel border border-app-border/20 rounded-md focus:outline-none focus:border-[#cfff04]"
              >
                <option value="All">Всі статуси</option>
                <option value="Pending">Pending</option>
                <option value="Verified">Verified</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div className="bg-app-surface rounded-lg overflow-hidden border border-app-border/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-app-panel">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Користувач</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Роль</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-app-muted/60 uppercase tracking-wider">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {loading ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-app-muted/50">Завантаження...</td></tr>
                    ) : users.length === 0 ? (
                      <tr><td colSpan="4" className="px-6 py-8 text-center text-app-muted/50">Користувачів не знайдено</td></tr>
                    ) : (
                      users.map(user => (
                        <tr key={user.id} className="hover:bg-app-panel transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{user.display_name}</div>
                            <div className="text-sm text-app-muted/50">{user.email || 'No email'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {user.is_admin ? <span className="text-purple-400">Admin</span> : 'User'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border
                              ${user.status === 'Verified' ? 'bg-green-900/30 text-green-400 border-green-800' : 
                                user.status === 'Rejected' ? 'bg-red-900/30 text-red-400 border-red-800' : 
                                'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {user.status === 'Pending' && (
                              <div className="flex justify-end items-center space-x-2">
                                <button onClick={() => handleStatusChange(user.id, 'Verified')} className="text-[#111] bg-[#cfff04] hover:bg-opacity-80 px-3 py-1.5 rounded transition font-semibold">Verify</button>
                                <button onClick={() => handleStatusChange(user.id, 'Rejected')} className="text-app-text bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition font-semibold">Reject</button>
                                <button onClick={() => openUserModal(user)} className="text-blue-400 hover:text-blue-300 ml-2 px-2 py-1 underline">Деталі</button>
                              </div>
                            )}
                            {user.status !== 'Pending' && (
                              <div className="flex justify-end items-center space-x-2">
                                 <span className="text-gray-600">Опрацьовано</span>
                                 <button onClick={() => openUserModal(user)} className="text-blue-400 hover:text-blue-300 ml-2 px-2 py-1 underline">Деталі</button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="bg-app-panel px-6 py-3 border-t border-app-border/10 flex items-center justify-between">
                <button disabled={page === 1} onClick={() => setPage(p => p - 1)} className="px-3 py-1 bg-app-panel border border-app-border/10 text-app-muted/80 rounded disabled:opacity-50 hover:bg-[#444] transition">Попередня</button>
                <span className="text-sm text-app-muted/60">Сторінка {page} з {totalPages || 1}</span>
                <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="px-3 py-1 bg-app-panel border border-app-border/10 text-app-muted/80 rounded disabled:opacity-50 hover:bg-[#444] transition">Наступна</button>
              </div>
            </div>
          </>
        )}

        {activeTab === 'withdrawals' && (
          <>
            <div className="flex space-x-4 mb-6">
              <select 
                value={wStatusFilter} 
                onChange={(e) => setWStatusFilter(e.target.value)}
                className="px-4 py-2 bg-app-panel border border-app-border/20 rounded-md focus:outline-none focus:border-[#cfff04]"
              >
                <option value="All">Всі статуси</option>
                <option value="Pending">Очікують</option>
                <option value="Completed">Схвалено</option>
                <option value="Rejected">Відхилено</option>
              </select>
            </div>

            <div className="bg-app-surface rounded-lg overflow-hidden border border-app-border/10">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-800">
                  <thead className="bg-app-panel">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Користувач / UID</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Сума (USDT)</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">До виплати</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Адреса гаманця (TRC20)</th>
                      <th className="px-6 py-4 text-left text-xs font-medium text-app-muted/60 uppercase tracking-wider">Статус</th>
                      <th className="px-6 py-4 text-right text-xs font-medium text-app-muted/60 uppercase tracking-wider">Дії</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800">
                    {wLoading ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-app-muted/50">Завантаження...</td></tr>
                    ) : withdrawals.length === 0 ? (
                      <tr><td colSpan="5" className="px-6 py-8 text-center text-app-muted/50">Запитів не знайдено</td></tr>
                    ) : (
                      withdrawals.map(w => (
                        <tr key={w.id} className="hover:bg-app-panel transition-colors">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="font-medium">{w.user_email}</div>
                            <div className="text-sm text-app-muted/50">UID: {w.user_uid}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-app-text">
                            {asMoney(w.amount)}
                            <div className="text-xs text-nx-loss font-normal">Комісія: {asMoney(w.fee || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-bold text-nx-lime">
                            {asMoney(w.amount - (w.fee || 0))}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-app-muted">
                            {w.wallet_address}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded border
                              ${w.status === 'Completed' ? 'bg-green-900/30 text-green-400 border-green-800' : 
                                w.status === 'Rejected' ? 'bg-red-900/30 text-red-400 border-red-800' : 
                                'bg-yellow-900/30 text-yellow-400 border-yellow-800'}`}>
                              {w.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            {w.status === 'Pending' ? (
                              <div className="flex justify-end space-x-2">
                                <button onClick={() => handleWithdrawAction(w.id, 'approve')} className="text-[#111] bg-[#cfff04] hover:bg-opacity-80 px-3 py-1.5 rounded transition font-semibold">Схвалити</button>
                                <button onClick={() => handleWithdrawAction(w.id, 'reject')} className="text-app-text bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded transition font-semibold">Відхилити</button>
                              </div>
                            ) : (
                              <span className="text-gray-600">Опрацьовано</span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
        {activeTab === 'settings' && (
          <div className="bg-app-surface rounded-lg p-6 border border-app-border/10 max-w-lg">
            <h2 className="text-xl font-bold mb-4 text-[#cfff04]">Глобальні Налаштування</h2>
            {settingsLoading ? (
               <div className="text-app-muted">Завантаження...</div>
            ) : (
               <div className="space-y-6">
                 <div>
                   <label className="block text-sm font-medium text-app-muted mb-2">
                     Мінімальна сума депозиту реферала для розблокування 3-го сигналу (USDT)
                   </label>
                   <input 
                     type="number"
                     step="0.01"
                     value={settings.referral_deposit_threshold}
                     onChange={(e) => setSettings({ ...settings, referral_deposit_threshold: parseFloat(e.target.value) })}
                     className="w-full px-4 py-2 bg-app-panel border border-app-border/20 rounded-md focus:outline-none focus:border-[#cfff04]"
                   />
                 </div>
                 <button 
                   onClick={handleSaveSettings}
                   disabled={savingSettings}
                   className="w-full bg-[#cfff04] text-[#111] font-bold py-3 rounded-md hover:bg-opacity-90 transition disabled:opacity-50"
                 >
                   {savingSettings ? 'Збереження...' : 'Зберегти'}
                 </button>
               </div>
            )}
          </div>
        )}
        
        {/* User Details Modal */}
        {selectedUser && (
          <div className="fixed inset-0 bg-app-bg/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
            <div className="bg-app-surface border border-app-border/10 rounded-xl p-6 max-w-2xl w-full relative my-auto">
              <button onClick={() => setSelectedUser(null)} className="absolute top-4 right-4 text-app-muted/60 hover:text-app-text">✕</button>
              <h2 className="text-xl font-bold text-app-text mb-4">Деталі користувача</h2>
              
              <div className="space-y-4 text-sm">
                <div><span className="text-app-muted/50">ID:</span> {selectedUser.id}</div>
                <div><span className="text-app-muted/50">Email:</span> {selectedUser.email || 'N/A'}</div>
                <div><span className="text-app-muted/50">Реф. код:</span> {selectedUser.referral_code || 'N/A'}</div>
                <div><span className="text-app-muted/50">Запрошений кодом:</span> {selectedUser.referred_by_code || 'Немає'}</div>
                <div><span className="text-app-muted/50">Зареєстрований:</span> {new Date(selectedUser.created_at).toLocaleString()}</div>
                
                <hr className="border-app-border/10" />
                
                <div>
                  <label className="block text-app-muted/60 mb-1">Баланс ($)</label>
                  <input 
                    type="number" 
                    step="0.01"
                    value={editBalance} 
                    onChange={e => setEditBalance(e.target.value)}
                    className="w-full bg-app-panel border border-app-border/20 rounded px-3 py-2 text-app-text focus:outline-none focus:border-[#cfff04]"
                  />
                </div>
                
                <label className="flex items-center space-x-2 cursor-pointer pt-2">
                  <input 
                    type="checkbox" 
                    checked={editSignals}
                    onChange={e => setEditSignals(e.target.checked)}
                    className="w-4 h-4 accent-[#cfff04]"
                  />
                  <span className="text-app-muted/80">Доступ до сигналів (has_signals_access)</span>
                </label>
                
                {/* KYC Section */}
                <hr className="border-app-border/10 my-4" />
                <h3 className="text-lg font-bold text-nx-lime">Дані KYC</h3>
                {kycLoading ? (
                  <div className="text-sm text-app-muted/50">Завантаження...</div>
                ) : kycData ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div><span className="text-app-muted/50">Громадянство:</span> {kycData.citizenship}</div>
                      <div><span className="text-app-muted/50">Документ:</span> {kycData.document_number}</div>
                      <div className="col-span-2"><span className="text-app-muted/50">Повне ім'я:</span> {kycData.full_name}</div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-app-muted/50 mb-1">Передня сторона</span>
                        <img src={kycData.front_image} alt="Front" className="w-full h-24 object-cover rounded border border-app-border/20 cursor-pointer hover:opacity-80" onClick={() => window.open(kycData.front_image)} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-app-muted/50 mb-1">Зворотна сторона</span>
                        <img src={kycData.back_image} alt="Back" className="w-full h-24 object-cover rounded border border-app-border/20 cursor-pointer hover:opacity-80" onClick={() => window.open(kycData.back_image)} />
                      </div>
                      <div className="flex flex-col items-center">
                        <span className="text-xs text-app-muted/50 mb-1">Селфі з док.</span>
                        <img src={kycData.selfie_image} alt="Selfie" className="w-full h-24 object-cover rounded border border-app-border/20 cursor-pointer hover:opacity-80" onClick={() => window.open(kycData.selfie_image)} />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-app-muted/50">Користувач ще не подав документи.</div>
                )}
              </div>

              <div className="mt-6 flex flex-col space-y-4">
                <div className="flex justify-end space-x-3">
                  <button onClick={() => setSelectedUser(null)} className="px-4 py-2 text-app-muted/60 hover:text-app-text transition">Скасувати</button>
                  <button 
                    onClick={handleSaveDetails} 
                    disabled={saving}
                    className="px-4 py-2 bg-[#cfff04] text-[#111] font-semibold rounded hover:bg-opacity-80 transition disabled:opacity-50"
                  >
                    {saving ? 'Збереження...' : 'Зберегти зміни'}
                  </button>
                </div>
                <hr className="border-app-border/10" />
                <button onClick={handleImpersonate} className="w-full px-4 py-2 flex justify-center items-center space-x-2 bg-transparent text-app-text border border-app-border/20 hover:border-blue-500 hover:text-blue-400 rounded transition">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clipRule="evenodd" />
                  </svg>
                  <span>Увійти як {selectedUser.display_name}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
