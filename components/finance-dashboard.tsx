'use client';

import React, { useState, useMemo } from 'react';
import { useFinance } from '@/hooks/use-finance';
import { formatCurrency, formatDate } from '@/lib/utils';
import { TransactionNature, TransactionType } from '@/lib/types';
import { Plus, Wallet as WalletIcon, CreditCard, Banknote, Calendar, CheckCircle, AlertCircle, TrendingUp, TrendingDown, PieChart, MoreVertical, Filter, Search, User } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { startOfMonth, endOfMonth, isWithinInterval, parseISO, format, isAfter, isBefore, addDays, addMonths } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

// --- Components ---

const Card = ({ children, className = '', onClick, style }: { children: React.ReactNode, className?: string, onClick?: () => void, style?: React.CSSProperties }) => (
  <div 
    className={`bg-[#1e293b] rounded-2xl shadow-sm border border-slate-800 overflow-hidden ${className}`}
    onClick={onClick}
    style={style}
  >
    {children}
  </div>
);

const TransactionItem = ({ transaction, onPay, onClick }: { transaction: any, onPay: (id: string, amount: number) => void, onClick?: () => void }) => {
  const { categories, wallets, attributions } = useFinance();
  const category = categories.find(c => c.id === transaction.categoryId);
  const wallet = wallets.find(w => w.id === transaction.walletId);
  const attribution = attributions.find(a => a.id === (transaction.attributionId || 'attr-1'));
  const destinationWallet = wallets.find(w => w.id === transaction.destinationWalletId);
  const [isEditingAmount, setIsEditingAmount] = useState(false);
  const [amount, setAmount] = useState(transaction.amount);

  const isPositive = transaction.nature === 'INCOME' || transaction.nature === 'TRANSFER_IN';
  const isTransfer = transaction.nature === 'TRANSFER' || transaction.nature === 'TRANSFER_OUT' || transaction.nature === 'TRANSFER_IN';

  const getIcon = () => {
    if (transaction.nature === 'INCOME') return <TrendingUp className="text-emerald-500" size={18} />;
    if (isTransfer) return <CreditCard className={isPositive ? 'text-emerald-500' : 'text-blue-500'} size={18} />;
    return <TrendingDown className="text-rose-500" size={18} />;
  };

  return (
    <div 
      className="flex items-center justify-between p-4 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center text-white shrink-0" 
          style={{ backgroundColor: isTransfer ? '#3b82f6' : (category?.color || '#cbd5e1') }}
        >
          {isTransfer ? <CreditCard size={18} /> : (category?.name?.[0] || '?')}
        </div>
        <div>
          <h4 className="font-semibold text-slate-100">{transaction.description}</h4>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-400">
            <span className="font-bold text-slate-300">Venc: {formatDate(transaction.dueDate || transaction.date)}</span>
            <span>•</span>
            <span>Evento: {formatDate(transaction.date)}</span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <WalletIcon size={12} /> {wallet?.name}
              {isTransfer && destinationWallet && (
                 <>
                   <span className="mx-1 text-slate-500">{isPositive ? '←' : '→'}</span>
                   {destinationWallet.name}
                 </>
              )}
            </span>
            {transaction.totalInstallments && (
              <>
                <span>•</span>
                <span>{transaction.installmentNumber}/{transaction.totalInstallments}</span>
              </>
            )}
            {attribution && (
              <>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <User size={12} /> {attribution.name}
                </span>
              </>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex flex-col items-end gap-2" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2">
           {getIcon()}
           <span className={`font-bold ${transaction.isPaid ? 'text-slate-400' : (isPositive ? 'text-emerald-400' : 'text-rose-500')}`}>
             {isPositive ? '+' : '-'}{formatCurrency(transaction.amount)}
           </span>
        </div>
        
        {!transaction.isPaid && !isTransfer && (
          <div className="flex gap-2">
            {isEditingAmount ? (
              <div className="flex gap-1">
                <input 
                  type="number" 
                  value={amount} 
                  onChange={(e) => setAmount(Number(e.target.value))}
                  className="w-24 px-2 py-1 text-xs border rounded outline-none focus:ring-1 focus:ring-blue-500"
                />
                <button 
                  onClick={() => onPay(transaction.id, amount)}
                  className="px-2 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
                >
                  OK
                </button>
                <button 
                  onClick={() => setIsEditingAmount(false)}
                  className="px-2 py-1 bg-slate-200 text-slate-600 text-xs rounded hover:bg-slate-300"
                >
                  X
                </button>
              </div>
            ) : (
              <button 
                onClick={() => {
                  if (transaction.type === 'RECURRING' || transaction.type === 'CONTINUOUS') {
                    setIsEditingAmount(true);
                  } else {
                    onPay(transaction.id, transaction.amount);
                  }
                }}
                className="flex items-center gap-1 text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded-full hover:bg-blue-100 font-medium transition-colors"
              >
                <CheckCircle size={14} /> Baixar
              </button>
            )}
          </div>
        )}
        {transaction.isPaid && (
          <span className="text-[10px] uppercase font-bold text-emerald-500 flex items-center gap-1">
            <CheckCircle size={12} /> Pago
          </span>
        )}
      </div>
    </div>
  );
};

export default function FinanceDashboard() {
  const { wallets, transactions, budgets, categories, attributions, addTransaction, payTransaction, deleteTransaction, updateWallet, updateBudget } = useFinance();
  const [activeTab, setActiveTab] = useState<'overview' | 'transactions' | 'wallets' | 'categories' | 'budgets' | 'reports' | 'management' | 'attributions' | 'installments'>('overview');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showWalletForm, setShowWalletForm] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<any>(null);
  const [showCategoryTransactions, setShowCategoryTransactions] = useState(false);
  const [viewingCategory, setViewingCategory] = useState<any>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAttributionForm, setShowAttributionForm] = useState(false);
  const [showCopyBudgetModal, setShowCopyBudgetModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [selectedAttribution, setSelectedAttribution] = useState<any>(null);
  const [currentMonth, setCurrentMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [mounted, setMounted] = React.useState(false);

  // Set mounted on client
  React.useEffect(() => {
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Filter States
  const [filterMonth, setFilterMonth] = useState<string>(format(new Date(), 'yyyy-MM'));
  const [filterEventMonth, setFilterEventMonth] = useState<string>('ALL');
  const [filterWallet, setFilterWallet] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [mgmtSortBy, setMgmtSortBy] = useState<'name' | 'budget' | 'realized'>('name');
  const [mgmtFilterAttribution, setMgmtFilterAttribution] = useState('ALL');
  const [mgmtFilterWallet, setMgmtFilterWallet] = useState('ALL');
  const [hideTransfers, setHideTransfers] = useState(true);

  // Filtering Logic
  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      try {
        const primaryDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
        const eventDate = new Date(t.date);
        
        if (isNaN(primaryDate.getTime())) return false;
        
        const tMonth = format(primaryDate, 'yyyy-MM');
        const eMonth = format(eventDate, 'yyyy-MM');
        
        const matchesMonth = filterMonth === 'ALL' || tMonth === filterMonth;
        const matchesEventMonth = filterEventMonth === 'ALL' || eMonth === filterEventMonth;
        const matchesWallet = filterWallet === 'ALL' || t.walletId === filterWallet;
        const matchesCategory = filterCategory === 'ALL' || t.categoryId === filterCategory;
        const matchesSearch = !searchTerm || t.description.toLowerCase().includes(searchTerm.toLowerCase());
        
        const isTransfer = t.nature === 'TRANSFER' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER_IN';
        const matchesHideTransfers = !hideTransfers || !isTransfer;
        
        return matchesMonth && matchesEventMonth && matchesWallet && matchesCategory && matchesSearch && matchesHideTransfers;
      } catch (e) {
        console.error('Error filtering transaction:', e);
        return false;
      }
    }).sort((a, b) => {
      const dateA = new Date(a.dueDate || a.date).getTime();
      const dateB = new Date(b.dueDate || b.date).getTime();
      return dateB - dateA;
    });
  }, [transactions, filterMonth, filterEventMonth, filterWallet, filterCategory, searchTerm, hideTransfers]);

  // Totalizer for Filtered Transactions
  const filteredMetrics = useMemo(() => {
    const income = filteredTransactions
      .filter(t => t.nature === 'INCOME' || t.nature === 'TRANSFER_IN')
      .reduce((acc, t) => acc + t.amount, 0);
    const expenses = filteredTransactions
      .filter(t => t.nature === 'EXPENSE' || !t.nature || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER')
      .reduce((acc, t) => acc + t.amount, 0);
    const paid = filteredTransactions
      .filter(t => t.isPaid || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER_IN' || t.nature === 'TRANSFER')
      .reduce((acc, t) => acc + (t.nature === 'INCOME' || t.nature === 'TRANSFER_IN' ? -t.amount : t.amount), 0); // Net paid
    
    return { income, expenses, paid };
  }, [filteredTransactions]);

  // Metrics (scoped to currentMonth or filterMonth as appropriate)
  const metrics = useMemo(() => {
    try {
      const start = startOfMonth(parseISO(currentMonth + '-01'));
      const end = endOfMonth(parseISO(currentMonth + '-01'));
      
      const monthTransactions = transactions.filter(t => {
        try {
          const checkDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
          return isWithinInterval(checkDate, { start, end });
        } catch (e) {
          return false;
        }
      });

      const totalIncome = monthTransactions
        .filter(t => (t.nature === 'INCOME' || t.nature === 'TRANSFER_IN') && (t.isPaid || t.nature === 'TRANSFER_IN'))
        .reduce((acc, t) => acc + t.amount, 0);
      const totalSpent = monthTransactions
        .filter(t => (t.nature === 'EXPENSE' || !t.nature || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER') && (t.isPaid || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER'))
        .reduce((acc, t) => acc + t.amount, 0);
      const totalPending = monthTransactions
        .filter(t => !t.isPaid && (t.nature === 'EXPENSE' || !t.nature))
        .reduce((acc, t) => acc + t.amount, 0);
      const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

      return { totalIncome, totalSpent, totalPending, totalBalance, monthTransactions };
    } catch (e) {
      console.error('Error calculating metrics:', e);
      return { totalIncome: 0, totalSpent: 0, totalPending: 0, totalBalance: 0, monthTransactions: [] };
    }
  }, [transactions, wallets, currentMonth]);

  const budgetData = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cat => {
      const budget = budgets.find(b => b.categoryId === cat.id && b.month === currentMonth)?.amount || 0;
      const spent = metrics.monthTransactions
        .filter(t => t.categoryId === cat.id && 
          (t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature)
        )
        .reduce((acc, t) => acc + t.amount, 0);
      
      return {
        name: cat.name,
        Orçado: budget,
        Realizado: spent,
        color: cat.color
      };
    }).filter(d => d.Orçado > 0 || d.Realizado > 0);
  }, [categories, budgets, metrics.monthTransactions, currentMonth]);

  const categoryPieData = useMemo(() => {
    return [...categories]
      .sort((a, b) => a.name.localeCompare(b.name))
      .map(cat => {
      const spent = metrics.monthTransactions
        .filter(t => t.categoryId === cat.id && 
          (t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature)
        )
        .reduce((acc, t) => acc + t.amount, 0);
      return { name: cat.name, value: spent, color: cat.color };
    }).filter(d => d.value > 0);
  }, [categories, metrics.monthTransactions]);

  const navItems = [
    { id: 'overview', label: 'Início', icon: <PieChart size={20} /> },
    { id: 'transactions', label: 'Transações', icon: <Calendar size={20} /> },
    { id: 'wallets', label: 'Carteiras', icon: <CreditCard size={20} /> },
    { id: 'categories', label: 'Categorias', icon: <Plus size={20} /> },
    { id: 'budgets', label: 'Metas', icon: <TrendingDown size={20} /> },
    { id: 'installments', label: 'Parcelamentos', icon: <Banknote size={20} /> },
    { id: 'attributions', label: 'Atribuições', icon: <User size={20} /> },
    { id: 'management', label: 'Gestão de Categorias', icon: <Search size={20} /> },
    { id: 'reports', label: 'Relatórios', icon: <TrendingUp size={20} /> },
  ];

  return (
    <div className="min-h-screen bg-[#0f172a] text-slate-100 flex flex-col md:flex-row">
      {!mounted ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-[#1e293b] border-r border-slate-800 h-screen sticky top-0">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-8">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
            <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">Finantech</h1>
          </div>

          <nav className="space-y-2">
            {navItems.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/20 shadow-sm' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                }`}
              >
                {item.icon}
                {item.label}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6">
          <button 
            onClick={() => {
              setSelectedTransaction(null);
              setShowAddForm(true);
            }}
            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-4 rounded-2xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-900/20 transition-all active:scale-95"
          >
            <Plus size={20} /> Novo Registro
          </button>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="md:hidden bg-[#1e293b] border-b border-slate-800 px-4 h-16 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">F</div>
          <h1 className="text-lg font-bold">Finantech</h1>
        </div>
        <button 
          onClick={() => {
            setSelectedTransaction(null);
            setShowAddForm(true);
          }}
          className="p-2 bg-blue-600 text-white rounded-lg shadow-md"
        >
          <Plus size={20} />
        </button>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-24 md:pb-8">
        <div className="max-w-5xl mx-auto px-4 md:px-8 py-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'management' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h2 className="text-2xl font-black tracking-tight text-slate-100">Gestão de Categorias</h2>
                      <p className="text-slate-500 text-sm font-bold">Consolidado de transações e planejamento mensal</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 bg-slate-800/40 p-1 rounded-2xl border border-slate-800">
                       <div className="flex items-center gap-1 px-2 border-r border-slate-700">
                        <button 
                          onClick={() => setMgmtSortBy('name')}
                          className={`p-1.5 rounded-lg transition-all ${mgmtSortBy === 'name' ? 'bg-slate-700 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                          title="Ordenar por Nome"
                        >
                          <span className="text-[10px] font-black tracking-tighter block md:hidden">NOME</span>
                          <span className="hidden md:block"><Search size={14} /></span>
                        </button>
                        <button 
                          onClick={() => setMgmtSortBy('budget')}
                          className={`p-1.5 rounded-lg transition-all ${mgmtSortBy === 'budget' ? 'bg-slate-700 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                          title="Ordenar por Meta"
                        >
                          <span className="text-[10px] font-black tracking-tighter block md:hidden">ORÇ.</span>
                          <span className="hidden md:block"><TrendingDown size={14} /></span>
                        </button>
                        <button 
                          onClick={() => setMgmtSortBy('realized')}
                          className={`p-1.5 rounded-lg transition-all ${mgmtSortBy === 'realized' ? 'bg-slate-700 text-blue-400' : 'text-slate-500 hover:text-slate-300'}`}
                          title="Ordenar por Realizado"
                        >
                          <span className="text-[10px] font-black tracking-tighter block md:hidden">REAL.</span>
                          <span className="hidden md:block"><TrendingUp size={14} /></span>
                        </button>
                      </div>

                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <User size={14} className="text-amber-500" />
                        <select 
                          value={mgmtFilterAttribution}
                          onChange={e => setMgmtFilterAttribution(e.target.value)}
                          className="text-xs font-bold outline-none bg-transparent text-slate-200"
                        >
                          <option value="ALL">Todas Atrob.</option>
                          {attributions.map(attr => (
                            <option key={attr.id} value={attr.id}>{attr.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <WalletIcon size={14} className="text-emerald-500" />
                        <select 
                          value={mgmtFilterWallet}
                          onChange={e => setMgmtFilterWallet(e.target.value)}
                          className="text-xs font-bold outline-none bg-transparent text-slate-200"
                        >
                          <option value="ALL">Todas Kart.</option>
                          {wallets.map(w => (
                            <option key={w.id} value={w.id}>{w.name}</option>
                          ))}
                        </select>
                      </div>

                       <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <Calendar size={16} className="text-blue-400" />
                        <span className="text-[10px] font-bold text-slate-500 uppercase mr-1">Venc.</span>
                        <input 
                          type="month" 
                          value={currentMonth}
                          onChange={(e) => setCurrentMonth(e.target.value)}
                          className="text-sm font-bold outline-none bg-transparent text-slate-200"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-6">
                    {/* Simplified Budget Board */}
                    <div className="space-y-6">
                      <Card className="p-6 border-none bg-gradient-to-br from-slate-800/50 to-slate-900/50">
                        <div className="flex items-center justify-between mb-8">
                          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                             <PieChart size={16} className="text-blue-400" /> Comparativo de Metas
                          </h3>
                        </div>
                        <div className="space-y-6">
                          {(() => {
                            const mgmtCategories = categories
                              .filter(cat => {
                                const isBudgeted = !cat.excludeFromBudget;
                                const spent = transactions
                                  .filter(t => {
                                    const tDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
                                    const tMonth = format(tDate, 'yyyy-MM');
                                    const matchesMonth = tMonth === currentMonth;
                                    const matchesAttribution = mgmtFilterAttribution === 'ALL' || t.attributionId === mgmtFilterAttribution;
                                    const matchesWallet = mgmtFilterWallet === 'ALL' || t.walletId === mgmtFilterWallet;
                                    const isExpenseNature = t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature;
                                    return t.categoryId === cat.id && matchesMonth && matchesAttribution && matchesWallet && isExpenseNature;
                                  })
                                  .reduce((acc, t) => acc + t.amount, 0);
                                return isBudgeted || spent > 0;
                              })
                              .map(cat => {
                                const budget = budgets.find(b => b.categoryId === cat.id && b.month === currentMonth)?.amount || 0;
                                const spent = transactions
                                  .filter(t => {
                                    const tDate = t.dueDate ? new Date(t.dueDate) : new Date(t.date);
                                    const tMonth = format(tDate, 'yyyy-MM');
                                    const matchesMonth = tMonth === currentMonth;
                                    const matchesAttribution = mgmtFilterAttribution === 'ALL' || t.attributionId === mgmtFilterAttribution;
                                    const matchesWallet = mgmtFilterWallet === 'ALL' || t.walletId === mgmtFilterWallet;
                                    const isExpenseNature = t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature;
                                    return t.categoryId === cat.id && matchesMonth && matchesAttribution && matchesWallet && isExpenseNature;
                                  })
                                  .reduce((acc, t) => acc + t.amount, 0);
                                return { ...cat, budget, spent };
                              })
                              .sort((a, b) => {
                                // Always prioritize those with budget presence
                                const aHasBudget = a.budget > 0;
                                const bHasBudget = b.budget > 0;
                                if (aHasBudget && !bHasBudget) return -1;
                                if (!aHasBudget && bHasBudget) return 1;

                                if (mgmtSortBy === 'name') return a.name.localeCompare(b.name);
                                if (mgmtSortBy === 'budget') return b.budget - a.budget;
                                if (mgmtSortBy === 'realized') return b.spent - a.spent;
                                return 0;
                              });

                            const totalBudgeted = mgmtCategories.reduce((acc, cat) => acc + (cat.budget > 0 ? cat.budget : cat.spent), 0);
                            const totalRealized = mgmtCategories.reduce((acc, cat) => acc + cat.spent, 0);

                            return (
                              <>
                                <div className="space-y-6">
                                  {mgmtCategories.map(cat => {
                                    const percent = cat.budget > 0 ? Math.min((cat.spent / cat.budget) * 100, 100) : 0;
                                    const isOverBudget = cat.budget > 0 && cat.spent > cat.budget;

                                    return (
                                      <div 
                                        key={cat.id} 
                                        className="space-y-2 cursor-pointer hover:bg-slate-800/30 p-2 rounded-xl transition-colors"
                                        onClick={() => {
                                          setViewingCategory(cat);
                                          setShowCategoryTransactions(true);
                                        }}
                                      >
                                        <div className="flex justify-between items-end">
                                          <div className="flex items-center gap-2">
                                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: cat.color }} />
                                            <span className="font-bold text-slate-200 text-sm md:text-xl">{cat.name}</span>
                                          </div>
                                          <div className="text-right">
                                            <span className={`text-xs md:text-lg font-black block ${isOverBudget ? 'text-rose-400' : 'text-slate-100'}`}>
                                              {cat.budget > 0 && (
                                                <>
                                                  <span className="text-slate-400">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.budget)}</span>
                                                  <span className="text-slate-500 mx-1">/</span>
                                                </>
                                              )}
                                              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cat.spent)}
                                            </span>
                                          </div>
                                        </div>
                                        {cat.budget > 0 && (
                                          <div className="mt-4 pr-14">
                                            <div className="relative h-2 md:h-3.5 bg-slate-800/50 rounded-full shadow-inner">
                                              <motion.div 
                                                initial={{ width: 0 }}
                                                animate={{ width: cat.budget > 0 ? `${Math.min(percent, 100)}%` : '100%' }}
                                                className={`h-full rounded-full transition-all duration-1000 ${isOverBudget || (cat.budget === 0 && cat.spent > 0) ? 'bg-rose-500' : ''}`}
                                                style={(!isOverBudget && cat.budget > 0) ? { backgroundColor: cat.color } : { backgroundColor: cat.budget === 0 ? cat.color : undefined }}
                                              />
                                              <motion.span 
                                                initial={{ opacity: 0 }}
                                                animate={{ 
                                                  opacity: 1,
                                                  left: cat.budget > 0 ? `${Math.min(percent, 100)}%` : '100%'
                                                }}
                                                className={`absolute top-1/2 -translate-y-1/2 ml-2 text-[10px] md:text-lg font-black whitespace-nowrap pointer-events-none ${isOverBudget ? 'text-rose-400' : 'text-slate-400'}`}
                                                style={{ 
                                                  transition: 'left 1s cubic-bezier(0.4, 0, 0.2, 1)',
                                                  zIndex: 10
                                                }}
                                              >
                                                {cat.budget > 0 ? `${Math.round((cat.spent / cat.budget) * 100)}%` : (cat.spent > 0 ? '100%' : '0%')}
                                              </motion.span>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>

                                <div className="mt-10 pt-6 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/40 -mx-6 px-6 pb-2">
                                  <div>
                                    <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Total Planejado</span>
                                    <span className="text-lg md:text-xl font-black text-slate-100 tracking-tighter">
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalBudgeted)}
                                    </span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] md:text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Total Realizado</span>
                                    <span className={`text-xl md:text-2xl font-black tracking-tighter ${totalRealized > totalBudgeted ? 'text-rose-400' : 'text-emerald-400'}`}>
                                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalRealized)}
                                    </span>
                                  </div>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </Card>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'attributions' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight">Atribuições</h2>
                      <p className="text-slate-400 text-sm">Gerencie os donos das despesas e receitas</p>
                    </div>
                    <button 
                      onClick={() => {
                        setSelectedAttribution(null);
                        setShowAttributionForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2"
                    >
                      <Plus size={18} /> Nova Atribuição
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {attributions.map(attr => (
                      <Card key={attr.id} className="p-4 flex items-center justify-between hover:border-blue-500/50 transition-all cursor-pointer" onClick={() => {
                        setSelectedAttribution(attr);
                        setShowAttributionForm(true);
                      }}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-blue-400">
                            <User size={20} />
                          </div>
                          <span className="font-bold text-slate-200">{attr.name}</span>
                        </div>
                        <MoreVertical size={16} className="text-slate-600" />
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'installments' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-2xl font-bold tracking-tight text-slate-100">Gestão de Parcelamentos</h2>
                      <p className="text-slate-400 text-sm font-bold">Acompanhe todos os seus compromissos parcelados</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {(() => {
                      const installmentGroups = transactions
                        .filter(t => t.type === 'INSTALLMENT' && t.groupId)
                        .reduce((acc: any, t) => {
                          if (!acc[t.groupId!]) {
                            acc[t.groupId!] = {
                              id: t.groupId,
                              description: t.description,
                              totalAmount: 0,
                              paidAmount: 0,
                              count: 0,
                              paidCount: 0,
                              items: [],
                              walletId: t.walletId,
                              categoryId: t.categoryId,
                              nature: t.nature
                            };
                          }
                          acc[t.groupId!].totalAmount += t.amount;
                          acc[t.groupId!].count += 1;
                          if (t.isPaid) {
                            acc[t.groupId!].paidAmount += t.amount;
                            acc[t.groupId!].paidCount += 1;
                          }
                          acc[t.groupId!].items.push(t);
                          return acc;
                        }, {});

                      const groups = Object.values(installmentGroups).sort((a: any, b: any) => {
                        const dateA = new Date(a.items[0].date).getTime();
                        const dateB = new Date(b.items[0].date).getTime();
                        return dateB - dateA;
                      });

                      if (groups.length === 0) {
                        return (
                          <div className="text-center py-20 bg-slate-800/10 rounded-3xl border border-dashed border-slate-800">
                            <Banknote size={48} className="mx-auto text-slate-700 mb-4" />
                            <p className="text-slate-500 font-bold">Nenhum parcelamento encontrado.</p>
                          </div>
                        );
                      }

                      return groups.map((group: any) => {
                        const category = categories.find(c => c.id === group.categoryId);
                        const percent = Math.round((group.paidCount / group.count) * 100);
                        
                        return (
                          <Card key={group.id} className="p-0 overflow-hidden">
                            <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg" style={{ backgroundColor: category?.color || '#3b82f6' }}>
                                    <Calendar size={24} />
                                  </div>
                                  <div>
                                    <h3 className="text-lg font-black text-slate-100">{group.description}</h3>
                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mt-1">
                                      <span className="uppercase tracking-wider">{category?.name || 'Outros'}</span>
                                      <span>•</span>
                                      <span className="text-blue-400">{group.paidCount} de {group.count} parcelas</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8">
                                  <div className="text-right">
                                    <span className="text-[10px] font-black text-slate-500 uppercase block mb-1">Total Compromisso</span>
                                    <span className="text-base md:text-xl font-black text-slate-100">{formatCurrency(group.totalAmount)}</span>
                                  </div>
                                  <div className="text-right border-l border-slate-800 pl-4">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase block mb-1">Total Pago</span>
                                    <span className="text-sm md:text-base font-bold text-emerald-400">{formatCurrency(group.paidAmount)}</span>
                                  </div>
                                  <div className="text-right border-l border-slate-800 pl-4">
                                    <span className="text-[10px] font-black text-rose-500 uppercase block mb-1">Pendente</span>
                                    <span className="text-sm md:text-base font-bold text-rose-400">{formatCurrency(group.totalAmount - group.paidAmount)}</span>
                                  </div>
                                  <div className="flex flex-col items-end gap-2 pr-2">
                                     <div className={`text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest ${group.paidCount === group.count ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>
                                        {percent}%
                                     </div>
                                  </div>
                                </div>
                            </div>
                            
                            <div className="px-5 pb-5">
                                <div className="relative h-2 bg-slate-800 rounded-full overflow-hidden shadow-inner mb-4">
                                  <motion.div 
                                    className="absolute top-0 left-0 h-full bg-blue-500 rounded-full shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                    initial={{ width: 0 }}
                                    animate={{ width: `${percent}%` }}
                                    transition={{ duration: 1 }}
                                  />
                                </div>

                                <div className="bg-[#0f172a]/50 rounded-2xl overflow-hidden border border-slate-800/50">
                                   <div className="max-h-[300px] overflow-y-auto custom-scrollbar divide-y divide-slate-800/30">
                                      {group.items
                                        .sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                        .map((item: any) => (
                                        <div 
                                          key={item.id} 
                                          className="flex items-center justify-between p-4 hover:bg-slate-800/40 transition-colors"
                                          onClick={() => {
                                            setSelectedTransaction(item);
                                            setShowAddForm(true);
                                          }}
                                        >
                                          <div className="flex items-center gap-3">
                                            <span className="text-xs font-black text-slate-500 w-8">{item.installmentNumber}/{item.totalInstallments}</span>
                                            <div>
                                              <span className="text-sm font-bold text-slate-300 block">Vencimento: {formatDate(item.dueDate || item.date)}</span>
                                            </div>
                                          </div>
                                          <div className="flex items-center gap-4">
                                            <span className="text-sm font-black text-slate-100">{formatCurrency(item.amount)}</span>
                                            {item.isPaid ? (
                                              <span className="text-[10px] font-black uppercase text-emerald-500 flex items-center gap-1 bg-emerald-500/10 px-2 py-1 rounded-lg">
                                                <CheckCircle size={10} /> Pago
                                              </span>
                                            ) : (
                                              <button 
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  payTransaction(item.id);
                                                }}
                                                className="text-[10px] font-black uppercase text-blue-400 bg-blue-500/10 px-2 py-1 rounded-lg hover:bg-blue-500/20 transition-colors"
                                              >
                                                Pagar
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                   </div>
                                </div>
                            </div>
                          </Card>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              {activeTab === 'overview' && (
                <div className="space-y-8">
                  {/* Metric Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <Card className="p-6 bg-blue-600 text-white border-0">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-blue-100 text-sm font-medium mb-1">Saldo Total</p>
                          <h3 className="text-3xl font-bold">{formatCurrency(metrics.totalBalance)}</h3>
                        </div>
                        <div className="bg-white/20 p-2 rounded-lg"><WalletIcon size={20} /></div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-400 text-sm font-medium mb-1">Receitas pagas</p>
                          <h3 className="text-3xl font-bold text-emerald-400">{formatCurrency(metrics.totalIncome)}</h3>
                        </div>
                        <div className="bg-emerald-500/10 text-emerald-500 p-2 rounded-lg"><TrendingUp size={20} /></div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-400 text-sm font-medium mb-1">Despesas pagas</p>
                          <h3 className="text-3xl font-bold text-rose-400">{formatCurrency(metrics.totalSpent)}</h3>
                        </div>
                        <div className="bg-rose-500/10 text-rose-500 p-2 rounded-lg"><TrendingDown size={20} /></div>
                      </div>
                    </Card>

                    <Card className="p-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-slate-400 text-sm font-medium mb-1">Pendente</p>
                          <h3 className="text-3xl font-bold text-slate-100">{formatCurrency(metrics.totalPending)}</h3>
                        </div>
                        <div className="bg-amber-500/10 text-amber-500 p-2 rounded-lg"><Calendar size={20} /></div>
                      </div>
                    </Card>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                      <section>
                        <h2 className="text-lg font-bold mb-4">Próximos Vencimentos</h2>
                        <Card>
                          {metrics.monthTransactions.filter(t => !t.isPaid).length > 0 ? (
                            <div className="divide-y divide-slate-800">
                              {metrics.monthTransactions
                                .filter(t => !t.isPaid)
                                .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
                                .slice(0, 5)
                                .map(t => (
                                  <TransactionItem 
                                    key={t.id} 
                                    transaction={t} 
                                    onPay={payTransaction} 
                                    onClick={() => {
                                      setSelectedTransaction(t);
                                      setShowAddForm(true);
                                    }}
                                  />
                                ))
                              }
                            </div>
                          ) : (
                            <div className="p-8 text-center text-slate-500 text-sm">Sem pendências para o mês. 🎉</div>
                          )}
                        </Card>
                      </section>

                      <section>
                        <div className="flex items-center justify-between mb-4">
                          <h2 className="text-lg font-bold">Lançamentos Recentes</h2>
                          <button 
                            onClick={() => setActiveTab('transactions')}
                            className="text-xs font-bold text-blue-400 hover:text-blue-300 transition-colors"
                          >
                            Ver todos
                          </button>
                        </div>
                        <Card>
                          <div className="divide-y divide-slate-800">
                            {transactions
                              .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                              .slice(0, 5)
                              .map(t => (
                              <TransactionItem 
                                key={t.id} 
                                transaction={t} 
                                onPay={payTransaction} 
                                onClick={() => {
                                  setSelectedTransaction(t);
                                  setShowAddForm(true);
                                }}
                              />
                            ))}
                          </div>
                          {transactions.length === 0 && (
                            <div className="p-8 text-center text-slate-500 text-sm">Nenhum lançamento registrado.</div>
                          )}
                        </Card>
                      </section>

                      <section>
                        <h2 className="text-lg font-bold mb-4">Meta vs Realizado</h2>
                        <Card className="p-6">
                          <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={budgetData} layout="vertical">
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#334155" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={100} axisLine={false} tickLine={false} stroke="#94a3b8" fontSize={10} />
                                <Tooltip 
                                  contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #1e293b', borderRadius: '12px' }}
                                  itemStyle={{ color: '#f8fafc' }}
                                  formatter={(val) => formatCurrency(Number(val))} 
                                />
                                <Bar dataKey="Orçado" fill="#334155" radius={[0, 4, 4, 0]} barSize={12} />
                                <Bar dataKey="Realizado" radius={[0, 4, 4, 0]} barSize={12}>
                                  {budgetData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.Realizado > entry.Orçado ? '#ef4444' : '#60a5fa'} />
                                  ))}
                                </Bar>
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </Card>
                      </section>
                    </div>

                    <div className="space-y-8">
                      <section>
                        <h2 className="text-lg font-bold mb-4">Distribuição</h2>
                        <Card className="p-6">
                          <div className="h-[200px] w-full flex items-center justify-center">
                            {categoryPieData.length > 0 ? (
                              <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                  <Pie 
                                    data={categoryPieData} 
                                    innerRadius={60} 
                                    outerRadius={80} 
                                    paddingAngle={5} 
                                    dataKey="value"
                                    stroke="none"
                                  >
                                    {categoryPieData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.color} />))}
                                  </Pie>
                                  <Tooltip 
                                    contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #1e293b', borderRadius: '12px' }}
                                    itemStyle={{ color: '#f8fafc' }}
                                    formatter={(val) => formatCurrency(Number(val))} 
                                  />
                                </RePieChart>
                              </ResponsiveContainer>
                            ) : (
                              <div className="flex flex-col items-center gap-2 text-slate-500">
                                <PieChart size={40} className="opacity-20" />
                                <span className="text-xs font-medium">Sem dados no período</span>
                              </div>
                            )}
                          </div>
                          <div className="mt-4 space-y-2">
                            {categoryPieData.map((entry, index) => (
                              <div key={index} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                                  <span className="text-xs text-slate-400">{entry.name}</span>
                                </div>
                                <span className="text-xs font-bold text-slate-200">{formatCurrency(entry.value)}</span>
                              </div>
                            ))}
                          </div>
                        </Card>
                      </section>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'transactions' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Transações</h2>
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="relative flex-1 min-w-[200px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                        <input 
                          type="text" 
                          placeholder="Buscar transação..."
                          value={searchTerm}
                          onChange={e => setSearchTerm(e.target.value)}
                          className="w-full bg-[#1e293b] border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                      </div>
                      
                      <div className="flex items-center gap-2 bg-[#1e293b] border border-slate-800 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-blue-400 uppercase">Venc.</span>
                        <select 
                          value={filterMonth}
                          onChange={e => setFilterMonth(e.target.value)}
                          className="bg-transparent text-sm font-semibold outline-none text-slate-300"
                        >
                          <option value="ALL">Todo Período</option>
                          {Array.from(new Set(transactions.map(t => format(parseISO(t.dueDate || t.date), 'yyyy-MM'))))
                            .sort((a, b) => b.localeCompare(a))
                            .map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))
                          }
                          {!Array.from(new Set(transactions.map(t => format(parseISO(t.dueDate || t.date), 'yyyy-MM')))).includes(format(new Date(), 'yyyy-MM')) && (
                            <option value={format(new Date(), 'yyyy-MM')}>{format(new Date(), 'yyyy-MM')}</option>
                          )}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 bg-[#1e293b] border border-slate-800 px-3 py-2 rounded-xl">
                        <span className="text-[10px] font-bold text-amber-500 uppercase">Evento</span>
                        <select 
                          value={filterEventMonth}
                          onChange={e => setFilterEventMonth(e.target.value)}
                          className="bg-transparent text-sm font-semibold outline-none text-slate-300"
                        >
                          <option value="ALL">Qualquer Data</option>
                          {Array.from(new Set(transactions.map(t => format(parseISO(t.date), 'yyyy-MM'))))
                            .sort((a, b) => b.localeCompare(a))
                            .map(m => (
                              <option key={m} value={m}>{m}</option>
                            ))
                          }
                        </select>
                      </div>

                      {(filterMonth !== format(new Date(), 'yyyy-MM') || filterEventMonth !== 'ALL' || filterWallet !== 'ALL' || filterCategory !== 'ALL' || searchTerm || hideTransfers) && (
                        <button 
                          onClick={() => {
                            setFilterMonth(format(new Date(), 'yyyy-MM'));
                            setFilterEventMonth('ALL');
                            setFilterWallet('ALL');
                            setFilterCategory('ALL');
                            setSearchTerm('');
                            setHideTransfers(false);
                          }}
                          className="text-xs font-bold text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Limpar Filtros
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Filter bar */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Carteira</label>
                      <select 
                        value={filterWallet}
                        onChange={e => setFilterWallet(e.target.value)}
                        className="bg-[#1e293b] border border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold outline-none text-slate-300 w-full"
                      >
                        <option value="ALL">Todas as Carteiras</option>
                        {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Categoria</label>
                      <select 
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="bg-[#1e293b] border border-slate-800 rounded-xl px-4 py-2 text-sm font-semibold outline-none text-slate-300 w-full"
                      >
                        <option value="ALL">Todas as Categorias</option>
                        {[...categories].sort((a, b) => a.name.localeCompare(b.name)).map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    <div className="flex flex-col gap-1 justify-end">
                      <button
                        onClick={() => setHideTransfers(!hideTransfers)}
                        className={`flex items-center justify-between gap-3 px-4 py-2 rounded-xl border transition-all ${
                          hideTransfers 
                            ? 'bg-blue-600/10 border-blue-600 text-blue-400' 
                            : 'bg-[#1e293b] border-slate-800 text-slate-400 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                           <CreditCard size={14} className={hideTransfers ? 'text-blue-400' : 'text-slate-500'} />
                           <span className="text-sm font-semibold">Ocultar Transferências</span>
                        </div>
                        <div className={`w-8 h-4 rounded-full relative transition-colors ${hideTransfers ? 'bg-blue-600' : 'bg-slate-700'}`}>
                          <div className={`absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full transition-all ${hideTransfers ? 'left-4' : 'left-1'}`} />
                        </div>
                      </button>
                    </div>
                  </div>

                  <Card>
                    <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 border-b border-slate-800 bg-slate-800/20">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Total Receitas</span>
                        <span className="text-lg font-bold text-emerald-400">{formatCurrency(filteredMetrics.income)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-rose-500 uppercase tracking-widest">Total Despesas</span>
                        <span className="text-lg font-bold text-rose-400">{formatCurrency(filteredMetrics.expenses)}</span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Saldo do Período</span>
                        <span className={`text-lg font-bold ${filteredMetrics.income - filteredMetrics.expenses >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {formatCurrency(filteredMetrics.income - filteredMetrics.expenses)}
                        </span>
                      </div>
                    </div>
                    {filteredTransactions.length > 0 ? (
                      <div className="divide-y divide-slate-800">
                        {filteredTransactions
                          .map(t => (
                            <div key={t.id} className="group relative">
                              <TransactionItem 
                                transaction={t} 
                                onPay={payTransaction} 
                                onClick={() => {
                                  setSelectedTransaction(t);
                                  setShowAddForm(true);
                                }}
                              />
                              <button 
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteTransaction(t.id);
                                }}
                                className="absolute right-4 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-500/10 rounded-lg transition-all"
                              >
                                <TrendingDown size={18} className="rotate-45" />
                              </button>
                            </div>
                          ))
                        }
                      </div>
                    ) : (
                      <div className="p-16 text-center text-slate-500">
                        <div className="flex flex-col items-center gap-4">
                          <div className="w-16 h-16 bg-slate-800/50 rounded-full flex items-center justify-center mb-2">
                             <Search size={32} className="opacity-20" />
                          </div>
                          <div className="space-y-1">
                            <p className="font-bold text-slate-400">Nenhuma transação encontrada</p>
                            <p className="text-sm">Não encontramos registros com os filtros selecionados.</p>
                          </div>
                          <button 
                            onClick={() => {
                              setFilterMonth('ALL');
                              setFilterWallet('ALL');
                              setFilterCategory('ALL');
                              setSearchTerm('');
                            }}
                            className="mt-2 px-6 py-2 bg-slate-800 text-slate-300 rounded-xl text-xs font-bold hover:bg-slate-700 transition-all border border-slate-700 hover:border-slate-600"
                          >
                            Limpar todos os filtros
                          </button>
                        </div>
                      </div>
                    )}
                  </Card>
                </div>
              )}

              {activeTab === 'wallets' && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <h2 className="text-2xl font-bold tracking-tight">Carteiras</h2>
                    <div className="bg-blue-600/10 border border-blue-600/20 px-6 py-3 rounded-2xl flex flex-col items-end">
                      <span className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">Saldo Geral Concentrado</span>
                      <span className="text-2xl font-bold text-slate-100">{formatCurrency(metrics.totalBalance)}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {wallets.map(wallet => (
                      <Card 
                        key={wallet.id} 
                        className="p-6 cursor-pointer hover:border-blue-600/50 transition-all"
                        onClick={() => {
                          setSelectedWallet(wallet);
                          setShowWalletForm(true);
                        }}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div className={`p-3 rounded-2xl ${
                            wallet.type === 'CREDIT_CARD' ? 'bg-indigo-500/10 text-indigo-400' : 
                            wallet.type === 'BANK_ACCOUNT' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>
                            {wallet.type === 'CREDIT_CARD' ? <CreditCard size={24} /> : <WalletIcon size={24} />}
                          </div>
                          <span className={`text-xl font-bold ${wallet.balance < 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                            {formatCurrency(wallet.balance)}
                          </span>
                        </div>
                        <h3 className="font-bold text-slate-100 text-lg">{wallet.name}</h3>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">
                          {wallet.type === 'CREDIT_CARD' ? 'Cartão de Crédito' : wallet.type === 'BANK_ACCOUNT' ? 'Conta Bancária' : 'Dinheiro em Espécie'}
                        </p>
                      </Card>
                    ))}
                    <button 
                      onClick={() => {
                        setSelectedWallet(null);
                        setShowWalletForm(true);
                      }}
                      className="border-2 border-dashed border-slate-800 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-slate-500 hover:border-blue-900 hover:text-blue-400 hover:bg-blue-900/10 transition-all"
                    >
                      <Plus size={32} />
                      <span className="font-bold text-sm">Criar Nova Carteira</span>
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'categories' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight">Categorias</h2>
                    <button 
                      onClick={() => {
                        setSelectedCategory(null);
                        setShowCategoryForm(true);
                      }}
                      className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-blue-700 transition-all flex items-center gap-2"
                    >
                      <Plus size={18} /> Nova Categoria
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                    {[...categories]
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(category => (
                      <Card 
                        key={category.id} 
                        className="p-4 flex items-center justify-between cursor-pointer hover:border-blue-200 transition-all font-bold text-slate-100"
                        style={{ borderColor: category.color + '40' }}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowCategoryForm(true);
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shrink-0"
                            style={{ backgroundColor: category.color }}
                          >
                            {category.name[0]}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-200">{category.name}</h4>
                            <div className="flex items-center gap-1">
                              {category.type === 'INCOME' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-bold uppercase">Receita</span>}
                              {category.type === 'EXPENSE' && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-rose-500/10 text-rose-500 font-bold uppercase">Despesa</span>}
                              {(!category.type || category.type === 'BOTH') && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-slate-500/10 text-slate-400 font-bold uppercase">Ambos</span>}
                            </div>
                          </div>
                        </div>
                        <span className="text-[10px] text-blue-400 font-bold uppercase">Editar</span>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'budgets' && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h2 className="text-2xl font-bold tracking-tight text-slate-100">Planejamento de Metas</h2>
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => setShowCopyBudgetModal(true)}
                        className="bg-slate-800 text-slate-300 px-3 py-1.5 rounded-xl text-sm font-bold hover:bg-slate-700 transition-all flex items-center gap-2 border border-slate-700"
                        title="Copiar metas para outros meses"
                      >
                         <CreditCard size={16} /> Copiar
                      </button>
                      <div className="flex items-center gap-2 bg-[#1e293b] px-3 py-1.5 rounded-xl border border-slate-800">
                        <Calendar size={16} className="text-slate-500" />
                        <input 
                          type="month" 
                          value={currentMonth}
                          onChange={(e) => setCurrentMonth(e.target.value)}
                          className="text-sm font-semibold outline-none bg-transparent text-slate-200"
                        />
                      </div>
                    </div>
                  </div>
                  
                  <Card className="overflow-hidden bg-[#1e293b] border-slate-800">
                    <div className="bg-[#0f172a] p-4 border-b border-slate-800 grid grid-cols-3 gap-4 text-xs font-bold text-slate-500 uppercase tracking-wider">
                      <span className="col-span-1">Categoria</span>
                      <span>Orçado (Limite)</span>
                      <span>Realizado</span>
                    </div>
                    <div className="divide-y divide-slate-800">
                      {categories
                        .filter(cat => !cat.excludeFromBudget)
                        .sort((a, b) => a.name.localeCompare(b.name))
                        .map(cat => {
                        const budget = budgets.find(b => b.categoryId === cat.id && b.month === currentMonth);
                        const spent = metrics.monthTransactions
                          .filter(t => t.categoryId === cat.id && 
                            (t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature)
                          )
                          .reduce((acc, t) => acc + t.amount, 0);
                        
                        return (
                          <div 
                            key={cat.id} 
                            className="p-4 grid grid-cols-3 gap-4 items-center hover:bg-slate-800/30 transition-colors cursor-pointer"
                            onClick={() => {
                              setViewingCategory(cat);
                              setShowCategoryTransactions(true);
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: cat.color }} />
                              <span className="font-semibold text-slate-300">{cat.name}</span>
                            </div>
                            <div className="relative" onClick={(e) => e.stopPropagation()}>
                              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs font-bold">R$</span>
                              <input 
                                type="number"
                                className="w-full bg-[#0f172a] border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-sm font-bold focus:ring-1 focus:ring-blue-500 outline-none text-slate-100"
                                value={budget?.amount || ''}
                                onChange={(e) => updateBudget(cat.id, Number(e.target.value), currentMonth)}
                                placeholder="0,00"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className={`text-sm font-bold ${spent > (budget?.amount || 0) ? 'text-rose-500' : 'text-emerald-400'}`}>
                                {formatCurrency(spent)}
                              </span>
                              {budget?.amount ? (
                                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-1 overflow-hidden">
                                  <div 
                                    className={`h-full transition-all ${spent > budget.amount ? 'bg-rose-500' : 'bg-blue-500'}`}
                                    style={{ width: `${Math.min((spent / budget.amount) * 100, 100)}%` }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </div>
              )}

              {activeTab === 'reports' && (
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold tracking-tight">Relatórios Financeiros</h2>
                  <Card className="p-8 text-center bg-slate-50 border-dashed border-2">
                    <TrendingUp size={48} className="mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500">Módulo de inteligência de relatórios em desenvolvimento.</p>
                  </Card>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Bottom Nav - Mobile */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[#1e293b] border-t border-slate-800 px-6 h-16 flex items-center justify-between z-50">
        {navItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id as any)}
            className={`flex flex-col items-center gap-1 transition-all ${
              activeTab === item.id ? 'text-blue-400' : 'text-slate-500'
            }`}
          >
            {item.icon}
            <span className="text-[10px] font-bold">{item.label}</span>
          </button>
        ))}
      </nav>

      {/* Transaction Modal */}
      <AnimatePresence>
        {showAddForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAddForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-3xl bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <TransactionForm transaction={selectedTransaction} onClose={() => setShowAddForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWalletForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowWalletForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <WalletForm wallet={selectedWallet} onClose={() => setShowWalletForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCopyBudgetModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCopyBudgetModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <CopyBudgetModal sourceMonth={currentMonth} onClose={() => setShowCopyBudgetModal(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoryTransactions && viewingCategory && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCategoryTransactions(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <CategoryTransactionsModal 
                category={viewingCategory} 
                month={currentMonth} 
                transactions={transactions}
                wallets={wallets}
                attributionId={activeTab === 'management' ? mgmtFilterAttribution : 'ALL'}
                walletId={activeTab === 'management' ? mgmtFilterWallet : 'ALL'}
                onEdit={(t) => {
                  setSelectedTransaction(t);
                  setShowAddForm(true);
                  setShowCategoryTransactions(false);
                }}
                onClose={() => setShowCategoryTransactions(false)} 
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showCategoryForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowCategoryForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <CategoryForm category={selectedCategory} onClose={() => setShowCategoryForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAttributionForm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowAttributionForm(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }} className="relative w-full max-w-md bg-[#1e293b] rounded-3xl shadow-2xl overflow-hidden">
              <AttributionForm attribution={selectedAttribution} onClose={() => setShowAttributionForm(false)} />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-6 left-4 right-4 z-50">
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.95 }}
              className="absolute bottom-full mb-4 left-0 right-0 bg-[#1e293b]/95 backdrop-blur-md border border-slate-700/50 rounded-3xl p-4 shadow-2xl space-y-1"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id as any);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all ${
                      activeTab === item.id 
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="bg-[#1e293b]/80 backdrop-blur-lg border border-slate-700/50 rounded-3xl p-2 flex items-center justify-between shadow-xl">
          <button 
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-2xl font-black text-sm transition-all ${isMobileMenuOpen ? 'bg-slate-800 text-blue-400' : 'text-slate-300'}`}
          >
            {isMobileMenuOpen ? <Plus size={20} className="rotate-45" /> : <Filter size={20} />}
            MENU
          </button>
          
          <button 
            onClick={() => {
              setSelectedTransaction(null);
              setShowAddForm(true);
            }}
            className="flex-1 flex items-center justify-center gap-2 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm shadow-lg shadow-blue-900/20 active:scale-95 transition-all"
          >
            <Plus size={20} /> NOVO
          </button>
        </div>
      </div>
        </>
      )}
    </div>
  );
}

function CopyBudgetModal({ sourceMonth, onClose }: { sourceMonth: string, onClose: () => void }) {
  const { copyBudget } = useFinance();
  const [targetMonths, setTargetMonths] = useState<string[]>([]);
  
  // Generate next 12 months for selection
  const nextMonths = useMemo(() => {
    const months = [];
    let current = startOfMonth(new Date(sourceMonth + '-01'));
    for (let i = 1; i <= 12; i++) {
      const next = addMonths(current, i);
      months.push(format(next, 'yyyy-MM'));
    }
    return months;
  }, [sourceMonth]);

  const toggleMonth = (month: string) => {
    setTargetMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
  };

  const handleCopy = () => {
    if (targetMonths.length === 0) return;
    copyBudget(sourceMonth, targetMonths);
    onClose();
  };

  return (
    <div className="p-8 space-y-6 bg-[#1e293b] text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-bold text-slate-100">Copiar planejamento de metas</h2>
          <p className="text-xs text-slate-400">Origem: {sourceMonth}</p>
        </div>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="space-y-4">
        <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Selecione os meses de destino</label>
        <div className="grid grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1 custom-scrollbar">
          {nextMonths.map(month => (
            <button
              key={month}
              type="button"
              onClick={() => toggleMonth(month)}
              className={`p-3 rounded-xl border-2 text-sm font-bold transition-all text-center ${
                targetMonths.includes(month) 
                  ? 'border-blue-600 bg-blue-600/10 text-blue-400' 
                  : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              {month}
            </button>
          ))}
        </div>
      </div>

      <div className="flex gap-4 pt-4">
        <button 
          type="button"
          onClick={onClose}
          className="flex-1 py-3 px-4 rounded-xl font-bold text-slate-400 hover:bg-slate-800 transition-all border border-slate-700"
        >
          Cancelar
        </button>
        <button 
          type="button"
          onClick={handleCopy}
          disabled={targetMonths.length === 0}
          className="flex-1 py-3 px-4 rounded-xl font-bold bg-blue-600 text-white hover:bg-blue-700 transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Copiar Agora
        </button>
      </div>
    </div>
  );
}

function AttributionForm({ attribution, onClose }: { attribution?: any, onClose: () => void }) {
  const { addAttribution, updateAttribution, deleteAttribution } = useFinance();
  const [name, setName] = useState(attribution?.name || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (attribution) {
      updateAttribution(attribution.id, { name });
    } else {
      addAttribution({ name });
    }
    onClose();
  };

  const handleDelete = () => {
    if (attribution) {
      deleteAttribution(attribution.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#1e293b] text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-100">
          {attribution ? 'Editar Atribuição' : 'Nova Atribuição'}
        </h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Atribuição</label>
          <input 
            required 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-lg font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-4 outline-none text-slate-100 shadow-inner"
            placeholder="Ex: Casal, Fabio, Josi..."
          />
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          {attribution ? 'Salvar Alterações' : 'Criar Atribuição'}
        </button>
        {attribution && attribution.id !== 'attr-1' && (
          <button 
            type="button"
            onClick={handleDelete}
            className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-2xl font-bold hover:bg-rose-500/20 transition-all text-sm"
          >
            Excluir Atribuição
          </button>
        )}
      </div>
    </form>
  );
}

function CategoryTransactionsModal({ 
  category, 
  month, 
  transactions, 
  wallets, 
  onEdit, 
  onClose,
  attributionId = 'ALL',
  walletId = 'ALL'
}: { 
  category: any, 
  month: string, 
  transactions: any[], 
  wallets: any[], 
  onEdit: (t: any) => void, 
  onClose: () => void,
  attributionId?: string,
  walletId?: string
}) {
  const filtered = transactions.filter(t => 
    t.categoryId === category.id && 
    format(new Date(t.dueDate || t.date), 'yyyy-MM') === month &&
    (t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER' || !t.nature) &&
    (attributionId === 'ALL' || t.attributionId === attributionId) &&
    (walletId === 'ALL' || t.walletId === walletId)
  ).sort((a, b) => new Date(b.dueDate || b.date).getTime() - new Date(a.dueDate || a.date).getTime());

  return (
    <div className="p-8 space-y-6 bg-[#1e293b] text-slate-100 max-h-[90vh] flex flex-col">
      <div className="flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: category.color }} />
          <div>
            <h2 className="text-xl font-bold text-slate-100">{category.name}</h2>
            <p className="text-xs text-slate-400">{month}</p>
          </div>
        </div>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
           <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="overflow-y-auto custom-scrollbar flex-1 -mx-2 px-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10">
            <p className="text-slate-500 font-medium">Nenhuma transação encontrada.</p>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {filtered.map(t => {
              const wallet = wallets.find(w => w.id === t.walletId);
              return (
                <div 
                  key={t.id} 
                  onClick={() => onEdit(t)}
                  className="p-4 rounded-2xl bg-slate-800/40 border border-slate-700 flex justify-between items-center group hover:border-slate-500 hover:bg-slate-800/60 transition-all cursor-pointer"
                >
                  <div className="flex items-center gap-4 truncate">
                     <div className={`p-2.5 rounded-xl shrink-0 ${t.nature === 'INCOME' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                        {t.nature === 'INCOME' ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                     </div>
                     <div className="truncate">
                       <span className="text-sm font-bold block text-slate-200 truncate">{t.description}</span>
                       <div className="flex items-center gap-2 mt-0.5">
                         <span className="text-[10px] text-slate-300 font-bold uppercase">Venc: {format(new Date(t.dueDate || t.date), 'dd/MM/yyyy')}</span>
                          <span className="w-1 h-1 rounded-full bg-slate-700" />
                          <span className="text-[10px] text-slate-500 font-bold uppercase">Ev: {format(new Date(t.date), 'dd/MM/yyyy')}</span>
                         <span className="w-1 h-1 rounded-full bg-slate-700" />
                         <span className="text-[10px] text-blue-400/70 font-bold truncate">{wallet?.name || 'Carteira'}</span>
                       </div>
                     </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                     <span className={`text-sm font-black block ${t.nature === 'INCOME' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {t.nature === 'INCOME' ? '+' : '-'} {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(t.amount)}
                     </span>
                     {t.totalInstallments && t.totalInstallments > 1 && (
                       <span className="text-[8px] text-blue-400 font-bold block uppercase mt-0.5">
                         Parc. {t.installmentNumber}/{t.totalInstallments}
                       </span>
                     )}
                     {t.isPaid ? (
                       <span className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 justify-end uppercase mt-0.5">
                          <CheckCircle size={8} /> Pago
                       </span>
                     ) : (
                       <span className="text-[10px] text-amber-500 font-bold flex items-center gap-1 justify-end uppercase mt-0.5">
                          Pendente
                       </span>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="pt-4 border-t border-slate-800 shrink-0">
        <div className="flex justify-between items-center">
           <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Realizado</span>
           <span className="text-lg font-black text-slate-100">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(filtered.reduce((acc, t) => acc + t.amount, 0))}
           </span>
        </div>
      </div>
    </div>
  );
}

function CategoryForm({ category, onClose }: { category?: any, onClose: () => void }) {
  const { addCategory, updateCategory, deleteCategory } = useFinance();
  const [name, setName] = useState(category?.name || '');
  const [color, setColor] = useState(category?.color || '#3b82f6');
  const [type, setType] = useState<'INCOME' | 'EXPENSE' | 'BOTH'>(category?.type || 'BOTH');
  const [excludeFromBudget, setExcludeFromBudget] = useState(category?.excludeFromBudget || false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (category) {
      updateCategory(category.id, { name, color, type, excludeFromBudget });
    } else {
      addCategory({ name, color, type, excludeFromBudget });
    }
    onClose();
  };

  const handleDelete = () => {
    if (category) {
      deleteCategory(category.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#1e293b] text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-100">
          {category ? 'Editar Categoria' : 'Nova Categoria'}
        </h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <Plus size={24} className="rotate-45" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Categoria</label>
          <input 
            required 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-lg font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-4 outline-none text-slate-100 shadow-inner"
            placeholder="Ex: Alimentação, Transporte..."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo de Lançamento</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Receita', val: 'INCOME', icon: <TrendingUp size={16} /> },
              { label: 'Despesa', val: 'EXPENSE', icon: <TrendingDown size={16} /> },
              { label: 'Ambos', val: 'BOTH', icon: <PieChart size={16} /> },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setType(opt.val as any)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  type === opt.val ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-slate-800 hover:border-slate-700 text-slate-500'
                }`}
              >
                {opt.icon}
                <span className="text-[10px] font-bold uppercase">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block text-rose-400">Opções</label>
          <button
            type="button"
            onClick={() => setExcludeFromBudget(!excludeFromBudget)}
            className={`flex items-center justify-between w-full p-4 rounded-2xl border-2 transition-all ${
              excludeFromBudget ? 'border-amber-600 bg-amber-600/10 text-amber-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <PieChart size={18} />
              <div className="text-left">
                <span className="text-sm font-bold block">Sem Meta Mensal Definida</span>
                <span className="text-[10px] opacity-70">Esta categoria não aparecerá no planejamento</span>
              </div>
            </div>
            <div className={`w-10 h-5 rounded-full relative transition-colors ${excludeFromBudget ? 'bg-amber-600' : 'bg-slate-700'}`}>
              <div className={`absolute top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-white rounded-full transition-all ${excludeFromBudget ? 'left-5.5' : 'left-1'}`} />
            </div>
          </button>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Cor</label>
          <div className="flex gap-3 items-center">
            <input 
              type="color"
              value={color}
              onChange={e => setColor(e.target.value)}
              className="w-12 h-12 rounded-lg border-2 border-slate-700 cursor-pointer p-0 bg-transparent"
            />
            <span className="text-sm font-medium text-slate-400">{color}</span>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          {category ? 'Salvar Alterações' : 'Criar Categoria'}
        </button>
        {category && (
          <button 
            type="button"
            onClick={handleDelete}
            className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-2xl font-bold hover:bg-rose-500/20 transition-all text-sm"
          >
            Excluir Categoria
          </button>
        )}
      </div>
    </form>
  );
}

function WalletForm({ wallet, onClose }: { wallet?: any, onClose: () => void }) {
  const { addWallet, updateWallet, deleteWallet } = useFinance();
  const [name, setName] = useState(wallet?.name || '');
  const [initialBalance, setInitialBalance] = useState(wallet?.initialBalance?.toString() || wallet?.balance?.toString() || '0');
  const [type, setType] = useState(wallet?.type || 'BANK_ACCOUNT');
  const [dueDay, setDueDay] = useState(wallet?.dueDay?.toString() || '');
  const [currentDueDate, setCurrentDueDate] = useState(wallet?.currentDueDate || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = { 
      name, 
      initialBalance: Number(initialBalance), 
      balance: Number(initialBalance), 
      type, 
      dueDay: dueDay ? Number(dueDay) : undefined,
      currentDueDate: currentDueDate || undefined
    };
    if (wallet) {
      updateWallet(wallet.id, data);
    } else {
      addWallet(data as any);
    }
    onClose();
  };

  const handleDelete = () => {
    if (wallet) {
      deleteWallet(wallet.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-[#1e293b] text-slate-100">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-100">
          {wallet ? 'Editar Carteira' : 'Nova Carteira'}
        </h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <TrendingDown size={24} className="rotate-45" />
        </button>
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Nome da Carteira/Cartão</label>
          <input 
            required 
            value={name}
            onChange={e => setName(e.target.value)}
            className="w-full text-lg font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-4 outline-none text-slate-100 shadow-inner"
            placeholder="Ex: Nubank, Carteira Bradesco..."
          />
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Saldo Inicial / Limite</label>
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-bold">R$</span>
            <input 
              required 
              type="number"
              step="0.01"
              value={initialBalance}
              onChange={e => setInitialBalance(e.target.value)}
              className="w-full text-lg font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl pl-12 pr-4 py-4 outline-none text-slate-100 shadow-inner"
              placeholder="0,00"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Tipo de Conta</label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: 'Corrente', val: 'BANK_ACCOUNT', icon: <Banknote size={16} /> },
              { label: 'Cartão', val: 'CREDIT_CARD', icon: <CreditCard size={16} /> },
              { label: 'Dinheiro', val: 'CASH', icon: <Banknote size={16} /> },
            ].map(opt => (
              <button
                key={opt.val}
                type="button"
                onClick={() => setType(opt.val)}
                className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                  type === opt.val ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-slate-800 hover:border-slate-700 text-slate-500'
                }`}
              >
                {opt.icon}
                <span className="text-[10px] font-bold uppercase">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {type === 'CREDIT_CARD' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Dia do Vencimento</label>
              <input 
                type="number"
                min="1"
                max="31"
                value={dueDay}
                onChange={e => setDueDay(e.target.value)}
                className="w-full text-lg font-semibold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100"
                placeholder="Ex: 10"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimento Atual</label>
              <input 
                type="date"
                value={currentDueDate}
                onChange={e => setCurrentDueDate(e.target.value)}
                className="w-full text-lg font-semibold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100"
              />
            </div>
          </div>
        )}
      </div>

      <div className="pt-4 space-y-3">
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          {wallet ? 'Salvar Alterações' : 'Criar Carteira'}
        </button>
        {wallet && (
          <button 
            type="button"
            onClick={handleDelete}
            className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-2xl font-bold hover:bg-rose-500/20 transition-all text-sm"
          >
            Excluir Carteira
          </button>
        )}
      </div>
    </form>
  );
}

function TransactionForm({ transaction, onClose }: { transaction?: any, onClose: () => void }) {
  const { categories, wallets, attributions, addTransaction, updateTransaction, updateWallet, deleteTransaction, transferFunds } = useFinance();
  const [error, setError] = useState<string | null>(null);
  const [nature, setNature] = useState<TransactionNature>(transaction?.nature || 'EXPENSE');
  const [type, setType] = useState<TransactionType>(transaction?.type || 'SINGLE');
  const [description, setDescription] = useState(transaction?.description || '');
  const [amount, setAmount] = useState(transaction?.amount != null ? Number(transaction.amount).toFixed(2) : '');
  const [walletId, setWalletId] = useState(transaction?.walletId || (wallets.length > 0 ? wallets[0].id : ''));
  const [attributionId, setAttributionId] = useState(transaction?.attributionId || 'attr-1');
  const [destinationWalletId, setDestinationWalletId] = useState(transaction?.destinationWalletId || (wallets.length > 1 ? wallets[1].id : ''));
  const [categoryId, setCategoryId] = useState(transaction?.categoryId || (categories.length > 0 ? categories[0].id : ''));

  const [date, setDate] = useState(() => {
    if (transaction?.date) {
      try {
        return format(parseISO(transaction.date), 'yyyy-MM-dd');
      } catch (e) {
        console.error('Error formatting transaction date:', e);
      }
    }
    return format(new Date(), 'yyyy-MM-dd');
  });

  const [installments, setInstallments] = useState(transaction?.totalInstallments || 1);
  const [isPaid, setIsPaid] = useState(transaction?.isPaid || false);
  const [updateWalletDueDate, setUpdateWalletDueDate] = useState(false);

  const [dueDate, setDueDate] = useState(() => {
    if (transaction?.dueDate) {
      try {
        return format(parseISO(transaction.dueDate), 'yyyy-MM-dd');
      } catch (e) {
        console.error('Error formatting transaction due date:', e);
      }
    }
    const defaultWallet = wallets.find(w => w.id === walletId) || wallets[0];
    return defaultWallet?.currentDueDate || format(new Date(), 'yyyy-MM-dd');
  });

  const handleNatureChange = (newNature: TransactionNature) => {
    setNature(newNature);
    if (newNature !== 'TRANSFER') {
      const filtered = categories.filter(c => !c.type || c.type === 'BOTH' || c.type === newNature);
      if (filtered.length > 0 && !filtered.find(c => c.id === categoryId)) {
        setCategoryId(filtered[0].id);
      }
    }
  };

  const handleWalletChange = (id: string) => {
    setWalletId(id);
    const wallet = wallets.find(w => w.id === id);
    if (wallet?.currentDueDate && !transaction) {
      setDueDate(wallet.currentDueDate);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!walletId || (!categoryId && nature !== 'TRANSFER') || !amount || Number(amount) <= 0 || !description) {
      setError('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    if (nature === 'TRANSFER' && walletId === destinationWalletId) {
      setError('A carteira de destino deve ser diferente da de origem.');
      return;
    }

    if (updateWalletDueDate && walletId) {
      updateWallet(walletId, { currentDueDate: dueDate });
    }

    const isTransferNature = nature === 'TRANSFER' || nature === 'TRANSFER_OUT' || nature === 'TRANSFER_IN';

    if (isTransferNature) {
      const transferData = {
        amount: Number(amount),
        date: date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : undefined,
        description
      };

      if (transaction?.transferId) {
        updateTransaction(transaction.id, {
          ...transferData,
          walletId: (transaction.nature as string) === 'TRANSFER_IN' ? destinationWalletId : walletId,
          destinationWalletId: (transaction.nature as string) === 'TRANSFER_IN' ? walletId : destinationWalletId,
        });
      } else {
        transferFunds({
          fromWalletId: walletId,
          toWalletId: destinationWalletId,
          ...transferData
        });
      }
    } else {
      const data = {
        description,
        amount: Number(amount),
        date: date ? new Date(date + 'T12:00:00').toISOString() : new Date().toISOString(),
        dueDate: dueDate ? new Date(dueDate + 'T12:00:00').toISOString() : undefined,
        walletId,
        categoryId,
        attributionId,
        type,
        nature,
        installments,
        isPaid: type === 'SINGLE' ? isPaid : (transaction?.isPaid || false)
      };

      if (transaction) {
        updateTransaction(transaction.id, data);
      } else {
        addTransaction(data);
      }
    }
    
    onClose();
  };

  const handleDelete = () => {
    if (transaction) {
      deleteTransaction(transaction.id);
      onClose();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 md:p-8 space-y-6 bg-[#1e293b] text-slate-100 max-w-4xl mx-auto max-h-[90vh] overflow-y-auto custom-scrollbar">
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl font-bold text-slate-100">{transaction ? 'Editar Lançamento' : 'Novo Lançamento'}</h2>
        <button type="button" onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full transition-colors text-slate-400">
          <TrendingDown size={24} className="rotate-45" />
        </button>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="bg-rose-500/10 text-rose-500 p-4 rounded-xl text-sm font-semibold flex items-center gap-2">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Nature Selector */}
        <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleNatureChange('EXPENSE')}
              className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                nature === 'EXPENSE' ? 'border-rose-600 bg-rose-600/10 text-rose-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <TrendingDown size={16} />
              <span className="text-[9px] font-bold uppercase">Despesa</span>
            </button>
            <button
              type="button"
              onClick={() => handleNatureChange('INCOME')}
              className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                nature === 'INCOME' ? 'border-emerald-600 bg-emerald-600/10 text-emerald-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <TrendingUp size={16} />
              <span className="text-[9px] font-bold uppercase">Receita</span>
            </button>
            <button
              type="button"
              onClick={() => handleNatureChange('TRANSFER')}
              className={`p-2 rounded-xl border-2 transition-all flex flex-col items-center gap-1 ${
                (nature === 'TRANSFER' || nature === 'TRANSFER_OUT' || nature === 'TRANSFER_IN') ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-slate-800 text-slate-500 hover:border-slate-700'
              }`}
            >
              <CreditCard size={16} />
              <span className="text-[9px] font-bold uppercase">Transf</span>
            </button>
        </div>

        {nature !== 'TRANSFER' && (
          <div className="animate-in fade-in slide-in-from-top-1">
            <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Tipo de Pagamento</label>
            <div className="grid grid-cols-4 gap-1">
              {[
                { icon: <CheckCircle size={14}/>, label: 'Único', val: 'SINGLE' },
                { icon: <Calendar size={14}/>, label: 'Parcela', val: 'INSTALLMENT' },
                { icon: <TrendingUp size={14}/>, label: 'Variável', val: 'RECURRING' },
                { icon: <PieChart size={14}/>, label: 'Contínuo', val: 'CONTINUOUS' },
              ].map(opt => (
                <button
                  key={opt.val}
                  type="button"
                  onClick={() => setType(opt.val as TransactionType)}
                  className={`flex flex-col items-center gap-1 p-2 rounded-xl border transition-all ${
                    type === opt.val ? 'border-blue-600 bg-blue-600/10 text-blue-400' : 'border-slate-800 hover:border-slate-700 text-slate-500'
                  }`}
                >
                  {opt.icon}
                  <span className="text-[8px] font-bold uppercase tracking-tighter">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
          <div className="md:col-span-12 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">
                  {(nature === 'TRANSFER' || nature === 'TRANSFER_OUT' || nature === 'TRANSFER_IN') ? 'Carteira de Origem' : 'Carteira'}
                </label>
                <select 
                  value={walletId}
                  onChange={e => handleWalletChange(e.target.value)}
                  className="w-full font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none appearance-none text-slate-100 text-base shadow-inner"
                >
                  {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>

              {(nature === 'TRANSFER' || nature === 'TRANSFER_OUT' || nature === 'TRANSFER_IN') ? (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block text-blue-400">Carteira de Destino</label>
                  <select 
                    value={destinationWalletId}
                    onChange={e => setDestinationWalletId(e.target.value)}
                    className="w-full font-bold bg-[#0f172a] border-blue-600/30 ring-1 ring-blue-600/20 rounded-xl px-4 py-3 outline-none appearance-none text-slate-100 text-base shadow-inner"
                  >
                    {wallets.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data de Evento</label>
                    <input 
                      type="date"
                      value={date}
                      onChange={e => setDate(e.target.value)}
                      className="w-full text-base font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100 shadow-inner"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimento</label>
                    <input 
                      type="date"
                      value={dueDate}
                      onChange={e => setDueDate(e.target.value)}
                      className="w-full text-base font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100 shadow-inner"
                    />
                  </div>
                </div>
              )}
            </div>

            {nature === 'TRANSFER' && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Data de Evento</label>
                  <input 
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="w-full text-base font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100 shadow-inner"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Vencimento</label>
                  <input 
                    type="date"
                    value={dueDate}
                    onChange={e => setDueDate(e.target.value)}
                    className="w-full text-base font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100 shadow-inner"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Descrição</label>
              <input 
                required 
                value={description}
                onChange={e => setDescription(e.target.value)}
                className="w-full text-base font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none text-slate-100 shadow-inner"
                placeholder={nature === 'TRANSFER' ? "Ex: Transferência para reserva" : "Ex: Supermercado"}
              />
            </div>

            <div className="space-y-4">
              {nature !== 'TRANSFER' && (
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Categoria</label>
                  <select 
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full font-bold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-3 outline-none appearance-none text-slate-100 text-lg shadow-inner"
                  >
                    {categories
                      .filter(c => !c.type || c.type === 'BOTH' || c.type === nature)
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(c => <option key={c.id} value={c.id}>{c.name}</option>)
                    }
                  </select>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Valor</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black">R$</span>
                  <input 
                    required 
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={e => setAmount(e.target.value)}
                    onBlur={() => {
                        if (amount) {
                          setAmount(Number(amount).toFixed(2));
                        }
                    }}
                    className={`w-full text-xl font-black bg-[#0f172a] border-slate-800 focus:ring-2 rounded-xl pl-12 pr-4 py-3 outline-none text-slate-100 shadow-inner ${
                      nature === 'INCOME' ? 'focus:ring-emerald-500' : nature === 'EXPENSE' ? 'focus:ring-rose-500' : 'focus:ring-blue-500'
                    }`}
                    placeholder="0,00"
                  />
                </div>
              </div>
            </div>

            {nature !== 'TRANSFER' && type === 'INSTALLMENT' && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-2">
                 <label className="text-xs font-bold text-slate-500 uppercase mb-1 block">Número de Parcelas</label>
                 <input 
                    type="number" 
                    min="2" 
                    value={installments}
                    onChange={e => setInstallments(Number(e.target.value))}
                    className="w-full font-semibold bg-[#0f172a] border-slate-800 focus:ring-2 focus:ring-blue-500 rounded-xl px-4 py-2 outline-none text-slate-100"
                 />
              </motion.div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {nature !== 'TRANSFER' && (
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase mb-2 block">Atribuição</label>
                  <div className="grid grid-cols-3 gap-1">
                    {attributions.map(a => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setAttributionId(a.id)}
                        className={`p-2 rounded-xl border transition-all flex items-center justify-center gap-1 text-center ${
                          attributionId === a.id 
                            ? 'border-blue-600 bg-blue-600/10 text-blue-400' 
                            : 'border-slate-800 text-slate-500 hover:border-slate-700'
                        }`}
                      >
                        <User size={12} />
                        <span className="text-[9px] font-black uppercase text-center">{a.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {nature !== 'TRANSFER' && type === 'SINGLE' && (
                <div className="flex flex-col justify-end">
                   <div className="flex items-center gap-2 bg-[#0f172a]/50 p-2.5 rounded-xl cursor-pointer hover:bg-[#0f172a] transition-colors h-[42px]" onClick={() => setIsPaid(!isPaid)}>
                      <div className={`w-5 h-5 rounded flex items-center justify-center transition-all ${isPaid ? (nature === 'INCOME' ? 'bg-emerald-500' : 'bg-rose-500') + ' text-white border-transparent' : 'border-2 border-slate-700'}`}>
                         {isPaid && <CheckCircle size={12} />}
                      </div>
                      <span className="text-xs font-semibold text-slate-400">{nature === 'INCOME' ? 'Já foi recebido?' : 'Já está pago?'}</span>
                   </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4 space-y-3">
        <button 
          type="submit"
          className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95"
        >
          {transaction ? 'Salvar Alterações' : nature === 'TRANSFER' ? 'Confirmar Transferência' : 'Confirmar Lançamento'}
        </button>
        {transaction && (
          <button 
            type="button"
            onClick={handleDelete}
            className="w-full bg-rose-500/10 text-rose-500 py-3 rounded-2xl font-bold hover:bg-rose-500/20 transition-all text-sm"
          >
            Excluir Lançamento
          </button>
        )}
      </div>
    </form>
  );
}
