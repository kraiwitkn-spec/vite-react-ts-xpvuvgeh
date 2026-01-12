import React, { useState, useMemo, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  History, 
  CheckCircle, 
  LogOut, 
  Search, 
  Plus,
  QrCode,
  AlertTriangle,
  ArrowRightLeft,
  Settings,
  Menu,
  X,
  Sparkles,
  UserCheck,
  ClipboardList,
  RefreshCw,
  Lock,
  Save,
  RotateCcw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

import { AuthProvider, useAuth } from './contexts/AuthContext';
import { InventoryProvider, useInventory } from './contexts/InventoryContext';
import { USERS, STORE_LAYOUT } from './constants';
import { UserRole, TransactionType, TransactionStatus, Transaction, SparePart } from './types';
import { StoreLayout } from './components/StoreLayout';
import { QRScanner } from './components/QRScanner';
import { PartModal } from './components/PartModal';
import { analyzeStockData } from './services/geminiService';

// --- Sub-components for pages ---

const RecentActivityFeed = ({ transactions, parts }: { transactions: Transaction[], parts: SparePart[] }) => {
    // Sort by timestamp desc
    const sorted = [...transactions].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

    if (sorted.length === 0) return <div className="text-gray-400 text-sm text-center py-4">No recent activity</div>;

    return (
        <div className="space-y-3">
            {sorted.map(tx => {
                const part = parts.find(p => p.id === tx.partId) || tx.partData;
                const isPending = tx.status === TransactionStatus.PENDING;
                
                // Special rendering for Approval Logs
                if (tx.type === TransactionType.APPROVAL) {
                    return (
                        <div key={tx.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                            <div className="mt-1.5 w-2 h-2 rounded-full flex-shrink-0 bg-purple-500" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800">
                                    <span className="text-purple-700 font-bold">DECISION</span> 
                                    <span className="mx-1 text-gray-400">|</span> 
                                    {tx.userName}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    {tx.note}
                                </p>
                                <span className="text-[10px] text-gray-400">
                                    {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                        </div>
                    );
                }

                return (
                    <div key={tx.id} className="flex gap-3 pb-3 border-b border-gray-50 last:border-0 last:pb-0">
                        <div className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${
                            tx.status === TransactionStatus.APPROVED || tx.status === TransactionStatus.COMPLETED ? 'bg-green-500' :
                            tx.status === TransactionStatus.REJECTED ? 'bg-red-500' :
                            'bg-amber-400 animate-pulse'
                        }`} />
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                    <span className={`font-bold ${
                                        tx.type === TransactionType.IN ? 'text-green-700' : 
                                        tx.type === TransactionType.OUT ? 'text-red-700' : 
                                        tx.type === TransactionType.CREATE ? 'text-blue-700' :
                                        'text-gray-700'
                                    }`}>
                                        {tx.type}
                                    </span> 
                                    <span className="mx-1 text-gray-400">|</span>
                                    {part?.name || tx.partId}
                                </p>
                                <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                    {new Date(tx.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                </span>
                            </div>
                            <div className="flex justify-between items-center mt-0.5">
                                <p className="text-xs text-gray-500 truncate">
                                    {tx.quantity} units by {tx.userName}
                                </p>
                                <span className={`text-[10px] px-1.5 rounded font-medium ${
                                    isPending ? 'bg-amber-100 text-amber-700 border border-amber-200' :
                                    tx.status === TransactionStatus.REJECTED ? 'bg-red-50 text-red-600' :
                                    'bg-green-50 text-green-600'
                                }`}>
                                    {tx.status}
                                </span>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
};

const LoginPage = () => {
  const { login } = useAuth();
  const [selectedUser, setSelectedUser] = useState(USERS[0].id);
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = USERS.find(u => u.id === selectedUser);
    
    // Check password
    if (user && user.password === password) {
        login(selectedUser);
    } else {
        setError('Invalid password. Default is "123"');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
        <div className="text-center mb-8">
            <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Package className="w-8 h-8 text-brand-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-800">Slop Store</h1>
            <p className="text-gray-500">Warehouse Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Select User Profile</label>
                <div className="relative">
                    <select 
                        value={selectedUser} 
                        onChange={(e) => {
                            setSelectedUser(e.target.value);
                            setError('');
                            setPassword('');
                        }}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none appearance-none bg-white"
                    >
                        {USERS.map(user => (
                            <option key={user.id} value={user.id}>
                                {user.name} ({user.role})
                            </option>
                        ))}
                    </select>
                    <UserCheck className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <div className="relative">
                    <input 
                        type="password"
                        value={password}
                        onChange={(e) => {
                            setPassword(e.target.value);
                            setError('');
                        }}
                        className="w-full p-3 pl-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none"
                        placeholder="Enter password"
                    />
                    <Lock className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
                </div>
                {error && <p className="text-red-500 text-xs mt-1 ml-1">{error}</p>}
            </div>

            <button 
                type="submit"
                className="w-full bg-brand-600 hover:bg-brand-700 text-white font-semibold py-3 rounded-lg transition-all shadow-md hover:shadow-lg mt-2"
            >
                Login to System
            </button>
            
            <p className="text-center text-xs text-gray-400 mt-4">
                Default password for all users is <strong>123</strong>
            </p>
        </form>
      </div>
    </div>
  );
};

const ApprovalsPage = () => {
    const { transactions, updateTransactionStatus, parts } = useInventory();
    const { currentUser } = useAuth();
    const pending = transactions.filter(t => t.status === TransactionStatus.PENDING);

    const handleAction = (txId: string, status: TransactionStatus) => {
        if (currentUser) {
            updateTransactionStatus(txId, status, currentUser);
        }
    };

    if (pending.length === 0) return (
        <div className="flex flex-col items-center justify-center h-96 text-gray-500 bg-white rounded-xl border border-gray-100 shadow-sm">
            <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800">All Caught Up!</h3>
            <p className="text-sm">There are no pending approval requests at this time.</p>
        </div>
    );

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
                <UserCheck className="text-brand-600" />
                Approval Queue
                <span className="bg-red-100 text-red-700 text-sm font-bold px-3 py-1 rounded-full border border-red-200">
                    {pending.length} Pending
                </span>
            </h2>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-gray-50 text-gray-600 text-xs uppercase font-semibold border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Time</th>
                                <th className="px-6 py-4">Requestor</th>
                                <th className="px-6 py-4">Transaction</th>
                                <th className="px-6 py-4">Part Details</th>
                                <th className="px-6 py-4 text-center">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {pending.map(tx => {
                                // For CREATE transactions, the part might not exist in 'parts' yet.
                                // Use tx.partData if available.
                                const part = parts.find(p => p.id === tx.partId) || tx.partData;
                                
                                return (
                                    <tr key={tx.id} className="hover:bg-amber-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            {new Date(tx.timestamp).toLocaleString()}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{tx.userName}</div>
                                            <div className="text-xs text-gray-500">Operator</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold border ${
                                                tx.type === TransactionType.IN 
                                                ? 'bg-green-50 text-green-700 border-green-200' 
                                                : tx.type === TransactionType.OUT 
                                                ? 'bg-red-50 text-red-700 border-red-200'
                                                : 'bg-blue-50 text-blue-700 border-blue-200'
                                            }`}>
                                                {tx.type === TransactionType.IN ? <ArrowRightLeft size={12} /> : 
                                                 tx.type === TransactionType.OUT ? <LogOut size={12} /> : 
                                                 <Plus size={12} />}
                                                {tx.type}
                                            </span>
                                            <div className="mt-1 font-bold text-lg text-gray-800">
                                                {tx.quantity} <span className="text-xs font-normal text-gray-500">units</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-mono text-xs text-gray-500 mb-1">ID: {tx.partId}</div>
                                            <div className="font-medium text-gray-800">{part?.name || 'Unknown Part'}</div>
                                            <div className="text-xs text-gray-400">Area: {part?.area}</div>
                                            {tx.type === TransactionType.CREATE && (
                                                <div className="text-[10px] text-blue-600 font-bold mt-1 bg-blue-50 inline-block px-1 rounded">
                                                    NEW PART REQUEST
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center justify-center gap-3">
                                                <button 
                                                    onClick={() => handleAction(tx.id, TransactionStatus.REJECTED)}
                                                    className="flex items-center gap-1 px-4 py-2 text-sm font-medium text-red-600 bg-white border border-red-200 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all shadow-sm"
                                                >
                                                    <X size={16} /> Reject
                                                </button>
                                                <button 
                                                    onClick={() => handleAction(tx.id, TransactionStatus.APPROVED)}
                                                    className="flex items-center gap-1 px-4 py-2 text-sm font-bold text-white bg-green-600 border border-green-600 rounded-lg hover:bg-green-700 hover:shadow-md transition-all shadow-sm"
                                                >
                                                    <CheckCircle size={16} /> Approve
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

const Dashboard = ({ setActiveTab }: { setActiveTab: (tab: any) => void }) => {
  const { parts, transactions, updateTransactionStatus } = useInventory(); // Destructure updateTransactionStatus
  const { currentUser } = useAuth();
  const [aiInsight, setAiInsight] = useState<string | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);

  // Stats
  const lowStockCount = parts.filter(p => p.quantity <= p.minLevel).length;
  const pendingApprovals = transactions.filter(t => t.status === TransactionStatus.PENDING).length;
  const totalItems = parts.reduce((acc, curr) => acc + curr.quantity, 0);
  
  // Chart Data: Stock by Area
  const chartData = STORE_LAYOUT.map(area => ({
    name: area.id,
    count: parts.filter(p => p.area === area.id).reduce((acc, p) => acc + p.quantity, 0)
  }));

  const handleGenerateInsight = async () => {
    setLoadingAi(true);
    const insight = await analyzeStockData(parts, transactions);
    setAiInsight(insight);
    setLoadingAi(false);
  };

  return (
    <div className="space-y-6">
       {/* Approval Widget - Redirects to proper tab */}
       {currentUser?.canApprove && pendingApprovals > 0 && (
           <div 
             onClick={() => setActiveTab('approvals')}
             className="bg-amber-50 rounded-xl shadow-md border-2 border-amber-200 overflow-hidden mb-6 cursor-pointer hover:shadow-lg transition-all group"
           >
              <div className="p-5 flex items-center justify-between">
                  <div>
                      <h3 className="text-lg font-bold text-amber-900 flex items-center gap-2">
                          <UserCheck size={24} className="text-amber-700" /> 
                          {pendingApprovals} Pending Requests
                      </h3>
                      <p className="text-amber-700 text-sm mt-1">
                          You have pending transactions waiting for your approval.
                      </p>
                  </div>
                  <button className="bg-amber-600 text-white px-6 py-2 rounded-lg font-bold shadow-sm group-hover:bg-amber-700 transition-colors">
                      Review Now
                  </button>
              </div>
           </div>
       )}

       <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Total Parts</p>
                   <h3 className="text-2xl font-bold text-gray-800">{parts.length}</h3>
                </div>
                <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                   <Package size={24} />
                </div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Low Stock Alerts</p>
                   <h3 className="text-2xl font-bold text-red-600">{lowStockCount}</h3>
                </div>
                <div className="p-3 bg-red-50 text-red-600 rounded-lg">
                   <AlertTriangle size={24} />
                </div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Total Quantity</p>
                   <h3 className="text-2xl font-bold text-gray-800">{totalItems}</h3>
                </div>
                <div className="p-3 bg-green-50 text-green-600 rounded-lg">
                   <Package size={24} />
                </div>
             </div>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             <div className="flex items-center justify-between">
                <div>
                   <p className="text-sm text-gray-500 font-medium">Pending Approvals</p>
                   <h3 className="text-2xl font-bold text-amber-600">{pendingApprovals}</h3>
                </div>
                <div className="p-3 bg-amber-50 text-amber-600 rounded-lg">
                   <CheckCircle size={24} />
                </div>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Chart */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-6">Stock Distribution by Area</h3>
                <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip 
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="count" fill="#0284c7" radius={[4, 4, 0, 0]} />
                    </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
          </div>

          {/* Right Column: AI & Recent */}
          <div className="space-y-6">
            {/* AI Insights Panel */}
            <div className="bg-gradient-to-br from-brand-600 to-brand-800 text-white p-6 rounded-xl shadow-lg relative overflow-hidden">
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-4">
                        <Sparkles className="w-5 h-5 text-yellow-300" />
                        <h3 className="text-lg font-bold">AI Stock Analyst</h3>
                    </div>
                    
                    {!aiInsight ? (
                        <div className="text-center py-8">
                            <p className="text-brand-100 mb-4 text-sm">Use Gemini AI to analyze your inventory health and transaction patterns.</p>
                            <button 
                                onClick={handleGenerateInsight}
                                disabled={loadingAi}
                                className="bg-white text-brand-700 px-4 py-2 rounded-lg font-semibold text-sm hover:bg-brand-50 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
                            >
                                {loadingAi ? 'Analyzing...' : 'Generate Insights'}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="bg-white/10 p-4 rounded-lg text-sm text-brand-50 leading-relaxed whitespace-pre-line">
                                {aiInsight}
                            </div>
                            <button 
                                onClick={() => setAiInsight(null)}
                                className="text-xs text-brand-200 hover:text-white underline"
                            >
                                Clear Analysis
                            </button>
                        </div>
                    )}
                </div>
                {/* Decorative */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl transform translate-x-10 -translate-y-10"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-black/10 rounded-full blur-xl transform -translate-x-5 translate-y-5"></div>
            </div>

            {/* Recent Activity for Everyone */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                   <History size={20} /> System Activity
                </h3>
                <RecentActivityFeed transactions={transactions} parts={parts} />
            </div>
          </div>
       </div>
    </div>
  );
};

const InventoryPage = () => {
  const { parts, transactions, addTransaction } = useInventory();
  const { currentUser } = useAuth();
  
  const [search, setSearch] = useState('');
  const [selectedArea, setSelectedArea] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPart, setEditingPart] = useState<any>(undefined);
  const [showScanner, setShowScanner] = useState(false);
  const [transactionPartId, setTransactionPartId] = useState<string | null>(null);
  const [isReadOnlyView, setIsReadOnlyView] = useState(false);

  // Transaction specific state
  const [showTxModal, setShowTxModal] = useState(false);
  const [txType, setTxType] = useState<TransactionType>(TransactionType.OUT);
  const [txQty, setTxQty] = useState(1);

  const filteredParts = parts.filter(p => {
    const matchesSearch = 
        p.name.toLowerCase().includes(search.toLowerCase()) || 
        p.model.toLowerCase().includes(search.toLowerCase()) ||
        p.id.toLowerCase().includes(search.toLowerCase()) ||
        p.spec.toLowerCase().includes(search.toLowerCase());
    
    const matchesArea = selectedArea ? p.area === selectedArea : true;
    
    return matchesSearch && matchesArea;
  });

  const handleEdit = (part: any) => {
    // Enable edit/delete for Admin AND Approvers (KraiwitN) to manage the system better
    if (currentUser?.role === UserRole.ADMIN || currentUser?.role === UserRole.APPROVER) {
        setEditingPart(part);
        setIsReadOnlyView(false);
        setIsModalOpen(true);
    } else {
        setEditingPart(part);
        setIsReadOnlyView(true);
        setIsModalOpen(true);
    }
  };

  const handleAddNew = () => {
    setEditingPart(undefined);
    setIsReadOnlyView(false);
    setIsModalOpen(true);
  };

  const initiateTransaction = (partId: string) => {
    setTransactionPartId(partId);
    setShowScanner(false);
    setShowTxModal(true);
  };

  const handleTransactionSubmit = () => {
     if (!transactionPartId || !currentUser) return;

     // Enforce approval for BOTH IN and OUT transactions for regular operators
     const status = currentUser.canApprove ? TransactionStatus.COMPLETED : TransactionStatus.PENDING;

     addTransaction({
        partId: transactionPartId,
        userId: currentUser.id,
        userName: currentUser.name,
        type: txType,
        quantity: txQty,
        status: status
     });

     setShowTxModal(false);
     setTxQty(1);
     
     if (status === TransactionStatus.PENDING) {
        alert("Request sent to KraiwitN for approval. Stock will update after approval.");
     } else {
        alert("Transaction completed successfully.");
     }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: List & Search */}
        <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row gap-4 items-center justify-between sticky top-0 z-20">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input 
                        type="text" 
                        placeholder="Search parts, specs, models..." 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <button 
                        onClick={() => setShowScanner(true)}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 text-white px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors"
                    >
                        <QrCode size={18} /> <span className="hidden md:inline">Scan</span>
                    </button>
                    <button 
                        onClick={handleAddNew}
                        className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-brand-600 text-white px-4 py-2 rounded-lg hover:bg-brand-700 transition-colors"
                    >
                        <Plus size={18} /> <span className="hidden md:inline">Add Part</span>
                    </button>
                </div>
            </div>

            {selectedArea && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-lg flex items-center justify-between">
                    <span className="text-blue-800 font-medium text-sm">Filtering by Zone: <strong>{selectedArea}</strong></span>
                    <button onClick={() => setSelectedArea(null)} className="text-blue-600 hover:text-blue-800 text-sm font-bold">Clear Filter</button>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredParts.map(part => (
                    <div key={part.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
                        <div className="h-40 overflow-hidden relative group cursor-pointer" onClick={() => handleEdit(part)}>
                            <img src={part.imageUrl} alt={part.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                            <div className="absolute top-2 right-2 bg-white/90 px-2 py-1 rounded text-xs font-bold text-gray-700 shadow-sm">
                                Area: {part.area}
                            </div>
                            {part.quantity <= part.minLevel && (
                                <div className="absolute bottom-2 left-2 bg-red-500 text-white px-2 py-1 rounded text-xs font-bold shadow-sm animate-pulse">
                                    Low Stock
                                </div>
                            )}
                        </div>
                        <div className="p-4 flex-1 flex flex-col">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h3 className="font-bold text-gray-800 truncate" title={part.name}>{part.name}</h3>
                                    <p className="text-xs text-gray-500 font-mono">{part.model}</p>
                                </div>
                                <span className={`text-lg font-bold ${part.quantity <= part.minLevel ? 'text-red-600' : 'text-brand-600'}`}>
                                    {part.quantity}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 line-clamp-2 mb-4 flex-1">{part.spec}</p>
                            
                            <div className="flex gap-2 mt-auto">
                                <button 
                                    onClick={() => initiateTransaction(part.id)}
                                    className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 py-2 rounded-lg text-sm font-medium border border-gray-200 transition-colors"
                                >
                                    Transact
                                </button>
                                <button 
                                    onClick={() => handleEdit(part)}
                                    className="px-3 bg-brand-50 text-brand-600 rounded-lg hover:bg-brand-100 transition-colors"
                                >
                                    Details
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filteredParts.length === 0 && (
                    <div className="col-span-full py-12 text-center text-gray-400">
                        <Package className="w-12 h-12 mx-auto mb-3 opacity-20" />
                        <p>No parts found matching your criteria.</p>
                    </div>
                )}
            </div>
        </div>

        {/* Right Column: Map & Tools */}
        <div className="space-y-6">
            <StoreLayout onSelectArea={setSelectedArea} selectedArea={selectedArea} />
            
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                <h3 className="font-bold text-gray-800 mb-4 flex items-center gap-2">
                    <History className="w-5 h-5" /> Recent Activity
                </h3>
                <RecentActivityFeed transactions={transactions} parts={parts} />
            </div>
        </div>

        {/* Modals */}
        <PartModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)} 
            part={editingPart} 
            isReadOnly={isReadOnlyView}
        />

        {showScanner && (
            <QRScanner 
                onScan={initiateTransaction} 
                onClose={() => setShowScanner(false)} 
            />
        )}

        {/* Transaction Modal (Simple inline implementation for brevity) */}
        {showTxModal && transactionPartId && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">
                        {parts.find(p => p.id === transactionPartId)?.name}
                    </h3>
                    
                    <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
                        <button 
                            onClick={() => setTxType(TransactionType.OUT)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txType === TransactionType.OUT ? 'bg-white shadow text-red-600' : 'text-gray-500'}`}
                        >
                            TAKE OUT
                        </button>
                        <button 
                            onClick={() => setTxType(TransactionType.IN)}
                            className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${txType === TransactionType.IN ? 'bg-white shadow text-green-600' : 'text-gray-500'}`}
                        >
                            PUT IN
                        </button>
                    </div>

                    <div className="mb-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Quantity</label>
                        <div className="flex items-center gap-4">
                            <button onClick={() => setTxQty(Math.max(1, txQty - 1))} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">-</button>
                            <input 
                                type="number" 
                                value={txQty}
                                onChange={(e) => setTxQty(Math.max(1, parseInt(e.target.value) || 1))}
                                className="w-20 text-center font-bold text-xl border-b-2 border-brand-500 focus:outline-none"
                            />
                            <button onClick={() => setTxQty(txQty + 1)} className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50">+</button>
                        </div>
                    </div>
                    
                    {/* User feedback about approval */}
                    {!currentUser?.canApprove && (
                         <div className="mb-4 bg-amber-50 border border-amber-200 p-3 rounded-lg flex items-start gap-2">
                             <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                             <p className="text-xs text-amber-700">
                                 Your request will be sent to <strong>KraiwitN</strong> for approval before stock is updated.
                             </p>
                         </div>
                    )}

                    <div className="flex gap-3">
                        <button 
                            onClick={() => setShowTxModal(false)}
                            className="flex-1 py-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleTransactionSubmit}
                            className={`flex-1 py-2 text-white rounded-lg shadow-sm transition-colors ${txType === TransactionType.OUT ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                        >
                            {currentUser?.canApprove ? 'Confirm' : 'Request'}
                        </button>
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};

const HistoryPage = () => {
    const { transactions } = useInventory();
    
    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-800">Transaction Log</h2>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-gray-600">
                        <thead className="bg-gray-50 text-gray-700 font-semibold uppercase text-xs">
                            <tr>
                                <th className="px-6 py-4">Date</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Type</th>
                                <th className="px-6 py-4">Part ID</th>
                                <th className="px-6 py-4">Qty</th>
                                <th className="px-6 py-4">Status / Approver</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.map((tx) => (
                                <tr key={tx.id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap">{new Date(tx.timestamp).toLocaleString()}</td>
                                    <td className="px-6 py-4 font-medium">{tx.userName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium 
                                            ${tx.type === TransactionType.IN ? 'bg-green-100 text-green-800' : ''}
                                            ${tx.type === TransactionType.OUT ? 'bg-red-100 text-red-800' : ''}
                                            ${tx.type === TransactionType.CREATE ? 'bg-blue-100 text-blue-800' : ''}
                                            ${tx.type === TransactionType.UPDATE ? 'bg-yellow-100 text-yellow-800' : ''}
                                            ${tx.type === TransactionType.DELETE ? 'bg-gray-100 text-gray-800' : ''}
                                            ${tx.type === TransactionType.APPROVAL ? 'bg-purple-100 text-purple-800' : ''}
                                        `}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-mono">{tx.partId}</td>
                                    <td className="px-6 py-4 font-bold">{tx.quantity > 0 ? tx.quantity : '-'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col">
                                            <span className={`
                                                inline-flex w-fit items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium
                                                ${tx.status === TransactionStatus.APPROVED || tx.status === TransactionStatus.COMPLETED ? 'bg-green-50 text-green-700' : ''}
                                                ${tx.status === TransactionStatus.PENDING ? 'bg-yellow-50 text-yellow-700' : ''}
                                                ${tx.status === TransactionStatus.REJECTED ? 'bg-red-50 text-red-700' : ''}
                                            `}>
                                                {tx.status}
                                            </span>
                                            {tx.approverName && (
                                                <span className="text-[10px] text-gray-400 mt-1">
                                                    by {tx.approverName}
                                                </span>
                                            )}
                                            {tx.type === TransactionType.APPROVAL && (
                                                <span className="text-[10px] text-gray-400 mt-1">
                                                    {tx.note}
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {transactions.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                        No transaction history yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

// --- Main App Shell ---

const MainLayout = () => {
    const { currentUser, logout } = useAuth();
    const { transactions, resetData, saveSnapshot, restoreSnapshot } = useInventory(); // Destructure snapshot functions
    const [activeTab, setActiveTab] = useState<'dashboard' | 'inventory' | 'history' | 'approvals'>('dashboard');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Calculate pending approvals for the badge
    const pendingCount = transactions.filter(t => t.status === TransactionStatus.PENDING).length;

    if (!currentUser) return <LoginPage />;

    const renderContent = () => {
        switch (activeTab) {
            case 'dashboard': return <Dashboard setActiveTab={setActiveTab} />;
            case 'inventory': return <InventoryPage />;
            case 'history': return <HistoryPage />;
            case 'approvals': return <ApprovalsPage />;
            default: return <Dashboard setActiveTab={setActiveTab} />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Sidebar Navigation */}
            <aside className={`
                fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-gray-200 shadow-sm transform transition-transform duration-300 ease-in-out md:translate-x-0 md:static
                ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
            `}>
                <div className="h-full flex flex-col">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                                <Package size={20} />
                            </div>
                            <div>
                                <h1 className="font-bold text-gray-800 text-lg leading-tight">Slop Store</h1>
                                <p className="text-xs text-gray-500">Manager Pro</p>
                            </div>
                        </div>
                    </div>
                    
                    <nav className="p-4 space-y-2 flex-1">
                        <button 
                            onClick={() => { setActiveTab('dashboard'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <LayoutDashboard size={20} /> Dashboard
                        </button>
                        <button 
                            onClick={() => { setActiveTab('inventory'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'inventory' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <Package size={20} /> Inventory & Parts
                        </button>
                        
                        {/* Approval Menu Item - Only visible to approvers */}
                        {currentUser.canApprove && (
                            <button 
                                onClick={() => { setActiveTab('approvals'); setIsMobileMenuOpen(false); }}
                                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'approvals' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <ClipboardList size={20} /> Approvals
                                </div>
                                {pendingCount > 0 && (
                                    <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                                        {pendingCount}
                                    </span>
                                )}
                            </button>
                        )}

                        <button 
                            onClick={() => { setActiveTab('history'); setIsMobileMenuOpen(false); }}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'history' ? 'bg-brand-50 text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
                        >
                            <History size={20} /> Logs & History
                        </button>
                    </nav>

                    <div className="p-4 border-t border-gray-100 space-y-3">
                        {/* Admin Tools for Saving Defaults */}
                        {currentUser.role === UserRole.ADMIN && (
                            <div className="mb-2 pb-2 border-b border-gray-100 space-y-2">
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2">System Config</p>
                                <button 
                                     onClick={saveSnapshot}
                                     className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors text-xs font-medium"
                                >
                                    <Save size={14} /> Save State
                                </button>
                                <button 
                                     onClick={restoreSnapshot}
                                     className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-brand-700 hover:bg-brand-50 rounded-lg transition-colors text-xs font-medium"
                                >
                                    <RotateCcw size={14} /> Restore State
                                </button>
                            </div>
                        )}

                        <button 
                             onClick={() => resetData(true)}
                             className="w-full flex items-center gap-2 px-4 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors text-xs font-medium"
                             title="Restore factory defaults"
                        >
                            <RefreshCw size={14} /> Factory Reset
                        </button>

                        <div className="bg-gray-50 rounded-xl p-4">
                            <p className="text-xs text-gray-500 mb-1">Logged in as</p>
                            <p className="font-bold text-gray-800 truncate">{currentUser.name}</p>
                            <p className="text-xs text-brand-600 font-medium bg-brand-50 inline-block px-2 py-0.5 rounded mt-1 border border-brand-100">
                                {currentUser.role}
                            </p>
                        </div>
                        <button 
                            onClick={logout}
                            className="w-full flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors text-sm"
                        >
                            <LogOut size={18} /> Sign Out
                        </button>
                    </div>
                </div>
            </aside>
            
            {/* Mobile Header */}
            <div className="md:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-20">
                 <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white">
                        <Package size={16} />
                    </div>
                    <span className="font-bold text-gray-800">Slop Store</span>
                 </div>
                 <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="p-2 text-gray-600">
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                 </button>
            </div>
            
            {/* Backdrop for mobile menu */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 bg-black/50 z-20 md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* Main Content Area */}
            <main className="flex-1 p-4 md:p-8 overflow-y-auto h-[calc(100vh-64px)] md:h-screen">
                <div className="max-w-7xl mx-auto">
                    <header className="mb-8 hidden md:block">
                        <h2 className="text-2xl font-bold text-gray-900 capitalize">
                            {activeTab === 'inventory' ? 'Inventory Management' : activeTab}
                        </h2>
                        <p className="text-gray-500 text-sm">Welcome back, here is what's happening today.</p>
                    </header>
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

const App = () => {
  return (
    <AuthProvider>
      <InventoryProvider>
        <MainLayout />
      </InventoryProvider>
    </AuthProvider>
  );
};

export default App;