'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths } from 'date-fns';
import { 
  Wallet, 
  Category, 
  Transaction, 
  Budget, 
  Attribution,
  INITIAL_WALLETS, 
  INITIAL_CATEGORIES,
  INITIAL_ATTRIBUTIONS,
  FixedAccount,
  ImportRule
} from '../lib/types';
import { supabase } from '../lib/supabase';

interface FinanceContextType {
  wallets: Wallet[];
  categories: Category[];
  attributions: Attribution[];
  transactions: Transaction[];
  budgets: Budget[];
  fixedAccounts: FixedAccount[];
  importRules: ImportRule[];
  addTransaction: (data: Partial<Transaction> & { installments?: number }) => void;
  addTransactions: (dataArray: (Partial<Transaction> & { installments?: number })[]) => void;
  transferFunds: (data: { fromWalletId: string, toWalletId: string, amount: number, date: string, dueDate?: string, description: string }) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
  deleteTransactionGroup: (groupId: string, onlyUnpaid?: boolean) => void;
  deleteTransaction: (id: string) => void;
  updateTransactionGroup: (groupId: string, data: Partial<Transaction>) => void;
  payTransaction: (id: string, paidAmount?: number) => void;
  addWallet: (wallet: Omit<Wallet, 'id'>) => void;
  updateWallet: (id: string, data: Partial<Wallet>) => void;
  deleteWallet: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  updateCategory: (id: string, data: Partial<Category>) => void;
  deleteCategory: (id: string) => void;
  addAttribution: (attribution: Omit<Attribution, 'id'>) => void;
  updateAttribution: (id: string, data: Partial<Attribution>) => void;
  deleteAttribution: (id: string) => void;
  updateBudget: (categoryId: string, amount: number, month: string) => void;
  copyBudget: (fromMonth: string, targetMonths: string[]) => void;
  addFixedAccount: (account: Omit<FixedAccount, 'id'>) => void;
  updateFixedAccount: (id: string, data: Partial<FixedAccount>) => void;
  deleteFixedAccount: (id: string) => void;
  generateFixedTransactions: (month: string) => void;
  addImportRule: (rule: Omit<ImportRule, 'id'>) => void;
  updateImportRule: (id: string, data: Partial<ImportRule>) => void;
  deleteImportRule: (id: string) => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [walletsState, setWalletsState] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [fixedAccounts, setFixedAccounts] = useState<FixedAccount[]>([]);
  const [importRules, setImportRules] = useState<ImportRule[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from Supabase or localStorage on mount
  useEffect(() => {
    const fetchData = async () => {
      console.log('Finance Initialization: Checking storage options...');
      try {
        if (supabase) {
          console.log('Supabase detected: Attempting to fetch data...');
          const [
            { data: sbWallets, error: wErr },
            { data: sbCategories, error: cErr },
            { data: sbAttributions, error: aErr },
            { data: sbTransactions, error: tErr },
            { data: sbBudgets, error: bErr },
            { data: sbFixedAccounts, error: fErr },
            { data: sbImportRules, error: rErr }
          ] = await Promise.all([
            supabase.from('wallets').select('*'),
            supabase.from('categories').select('*'),
            supabase.from('attributions').select('*'),
            supabase.from('transactions').select('*'),
            supabase.from('budgets').select('*'),
            supabase.from('fixed_accounts').select('*'),
            supabase.from('import_rules').select('*')
          ]);

          if (wErr || cErr || aErr || tErr || bErr || fErr || rErr) {
            console.error('Supabase fetch error details:', { wErr, cErr, aErr, tErr, bErr, fErr, rErr });
          }

          if (!wErr && sbWallets && sbWallets.length > 0) {
            console.log('Data found in Supabase. Loading into application.');
            setWalletsState(sbWallets.map(w => ({
              id: w.id,
              name: w.name,
              type: w.type,
              initialBalance: Number(w.initial_balance),
              balance: Number(w.initial_balance),
              dueDay: w.due_day,
              currentDueDate: w.current_due_date
            })));
            setCategories(sbCategories?.map(c => ({
              id: c.id,
              name: c.name,
              color: c.color,
              type: c.type,
              excludeFromBudget: c.exclude_from_budget
            })) || INITIAL_CATEGORIES);
            setAttributions(sbAttributions?.map(a => ({ id: a.id, name: a.name })) || INITIAL_ATTRIBUTIONS);
            setTransactions(sbTransactions?.map(t => ({
              id: t.id,
              walletId: t.wallet_id,
              categoryId: t.category_id,
              attributionId: t.attribution_id,
              description: t.description,
              amount: Number(t.amount),
              date: t.date,
              dueDate: t.due_date,
              isPaid: t.is_paid,
              type: t.type,
              nature: t.nature,
              destinationWalletId: t.destination_wallet_id,
              transferId: t.transfer_id,
              groupId: t.group_id,
              installmentNumber: t.installment_number,
              totalInstallments: t.total_installments,
              expectedAmount: t.expected_amount ? Number(t.expected_amount) : undefined,
              fixedAccountId: t.fixed_account_id
            })) || []);
            setBudgets(sbBudgets?.map(b => ({
              id: b.id,
              categoryId: b.category_id,
              amount: Number(b.amount),
              month: b.month
            })) || []);
            setFixedAccounts(sbFixedAccounts?.map(a => ({
              id: a.id,
              name: a.name,
              amount: Number(a.amount),
              day: a.day,
              categoryId: a.category_id,
              walletId: a.wallet_id,
              nature: a.nature,
              attributionId: a.attribution_id
            })) || []);
            setImportRules(sbImportRules?.map(r => ({
              id: r.id,
              pattern: r.pattern,
              categoryId: r.category_id,
              attributionId: r.attribution_id
            })) || []);
            setIsLoaded(true);
            return;
          } else if (supabase && (!sbWallets || sbWallets.length === 0)) {
            console.log('Supabase is configured but wallet table is empty. Checking localStorage...');
          }
        }

        // Fallback to localStorage
        const savedWallets = localStorage.getItem('finantech_wallets');
        const savedCategories = localStorage.getItem('finantech_categories');
        const savedAttributions = localStorage.getItem('finantech_attributions');
        const savedTransactions = localStorage.getItem('finantech_transactions');
        const savedBudgets = localStorage.getItem('finantech_budgets');
        const savedFixedAccounts = localStorage.getItem('finantech_fixed_accounts');
        const savedImportRules = localStorage.getItem('finantech_import_rules');

        setWalletsState(savedWallets ? JSON.parse(savedWallets) : INITIAL_WALLETS);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setAttributions(savedAttributions ? JSON.parse(savedAttributions) : INITIAL_ATTRIBUTIONS);
        setTransactions(savedTransactions ? JSON.parse(savedTransactions) : []);
        setBudgets(savedBudgets ? JSON.parse(savedBudgets) : []);
        setFixedAccounts(savedFixedAccounts ? JSON.parse(savedFixedAccounts) : []);
        setImportRules(savedImportRules ? JSON.parse(savedImportRules) : []);
      } catch (e) {
        console.error('Error loading data', e);
        setWalletsState(INITIAL_WALLETS);
        setCategories(INITIAL_CATEGORIES);
        setAttributions(INITIAL_ATTRIBUTIONS);
      } finally {
        setIsLoaded(true);
      }
    };

    fetchData();
  }, []);

  const wallets = React.useMemo(() => {
    return walletsState.map(wallet => {
      let balance = wallet.initialBalance || 0;
      transactions.forEach(t => {
        if (!t.isPaid && !t.nature.startsWith('TRANSFER')) return;
        if (t.walletId === wallet.id) {
          if (t.nature === 'INCOME' || t.nature === 'TRANSFER_IN') balance += t.amount;
          else balance -= t.amount;
        }
      });
      return { ...wallet, balance };
    });
  }, [walletsState, transactions]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('finantech_wallets', JSON.stringify(walletsState));
      localStorage.setItem('finantech_categories', JSON.stringify(categories));
      localStorage.setItem('finantech_attributions', JSON.stringify(attributions));
      localStorage.setItem('finantech_transactions', JSON.stringify(transactions));
      localStorage.setItem('finantech_budgets', JSON.stringify(budgets));
      localStorage.setItem('finantech_fixed_accounts', JSON.stringify(fixedAccounts));
      localStorage.setItem('finantech_import_rules', JSON.stringify(importRules));

      const sb = supabase;
      if (sb) {
        const syncToSupabase = async () => {
          try {
            console.log('Syncing data to Supabase...');
            const results = await Promise.all([
              sb.from('wallets').upsert(walletsState.map(w => ({
                id: w.id, name: w.name, type: w.type, initial_balance: w.initialBalance, due_day: w.dueDay, current_due_date: w.currentDueDate
              }))),
              sb.from('categories').upsert(categories.map(c => ({
                id: c.id, name: c.name, color: c.color, type: c.type, exclude_from_budget: c.excludeFromBudget
              }))),
              sb.from('attributions').upsert(attributions.map(a => ({ id: a.id, name: a.name }))),
              sb.from('transactions').upsert(transactions.map(t => ({
                id: t.id, wallet_id: t.walletId, category_id: t.categoryId, attribution_id: t.attributionId, description: t.description, amount: t.amount, date: t.date, due_date: t.dueDate, is_paid: t.isPaid, type: t.type, nature: t.nature, destination_wallet_id: t.destinationWalletId, transfer_id: t.transferId, group_id: t.groupId, installment_number: t.installmentNumber, total_installments: t.totalInstallments, expected_amount: t.expectedAmount, fixed_account_id: t.fixedAccountId
              }))),
              sb.from('budgets').upsert(budgets.map(b => ({
                id: b.id, category_id: b.categoryId, amount: b.amount, month: b.month
              }))),
              sb.from('fixed_accounts').upsert(fixedAccounts.map(a => ({
                id: a.id, name: a.name, amount: a.amount, day: a.day, category_id: a.categoryId, wallet_id: a.walletId, nature: a.nature, attribution_id: a.attributionId
              }))),
              sb.from('import_rules').upsert(importRules.map(r => ({
                id: r.id, pattern: r.pattern, category_id: r.categoryId, attribution_id: r.attributionId
              })))
            ]);
            const syncErrors = results.map(r => r.error).filter(Boolean);
            if (syncErrors.length > 0) console.error('Supabase Sync Errors:', syncErrors);
            else console.log('Successfully synced to Supabase');
          } catch (error) {
            console.error('Supabase sync unexpected error:', error);
          }
        };
        syncToSupabase();
      }
    } catch (e) {
      console.error('Error saving data', e);
    }
  }, [walletsState, categories, attributions, transactions, budgets, fixedAccounts, isLoaded]);

  const addTransaction = useCallback((data: any) => {
    const { installments = 1, ...rest } = data;
    const newTransactions: any[] = [];
    const groupId = installments > 1 ? uuidv4() : undefined;
    
    const baseDate = new Date(rest.date || new Date());
    const baseDueDate = rest.dueDate ? new Date(rest.dueDate) : null;

    for (let i = 0; i < installments; i++) {
        newTransactions.push({
            id: uuidv4(),
            ...rest,
            date: addMonths(baseDate, i).toISOString(),
            dueDate: baseDueDate ? addMonths(baseDueDate, i).toISOString() : rest.dueDate,
            groupId,
            installmentNumber: i + 1,
            totalInstallments: installments
        });
    }
    setTransactions(prev => [...prev, ...newTransactions]);
  }, []);

  const addTransactions = useCallback((dataArray: any[]) => {
    const allNewTransactions: any[] = [];
    
    dataArray.forEach(data => {
      const { installments = 1, ...rest } = data;
      const groupId = installments > 1 ? uuidv4() : undefined;
      
      const baseDate = new Date(rest.date || new Date());
      const baseDueDate = rest.dueDate ? new Date(rest.dueDate) : null;

      for (let i = 0; i < installments; i++) {
        allNewTransactions.push({
          id: uuidv4(),
          ...rest,
          date: addMonths(baseDate, i).toISOString(),
          dueDate: baseDueDate ? addMonths(baseDueDate, i).toISOString() : rest.dueDate,
          groupId,
          installmentNumber: i + 1,
          totalInstallments: installments
        });
      }
    });

    setTransactions(prev => [...prev, ...allNewTransactions]);
  }, []);

  const transferFunds = useCallback((data: any) => {
    const transferId = uuidv4();
    const t1 = { id: uuidv4(), walletId: data.fromWalletId, categoryId: 'cat-transfer', amount: data.amount, nature: 'TRANSFER_OUT', date: data.date, description: data.description, isPaid: true, transferId, type: 'SINGLE' };
    const t2 = { id: uuidv4(), walletId: data.toWalletId, categoryId: 'cat-transfer', amount: data.amount, nature: 'TRANSFER_IN', date: data.date, description: data.description, isPaid: true, transferId, type: 'SINGLE' };
    setTransactions(prev => [...prev, t1 as Transaction, t2 as Transaction]);
  }, []);

  const updateTransaction = useCallback((id: string, data: any) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, ...data } : t)), []);
  const deleteTransaction = useCallback(async (id: string) => {
    setTransactions(prev => prev.filter(t => t.id !== id));
    if (supabase) {
      await supabase.from('transactions').delete().eq('id', id);
    }
  }, []);

  const deleteTransactionGroup = useCallback(async (groupId: string, onlyUnpaid: boolean = false) => {
    setTransactions(prev => prev.filter(t => {
      if (t.groupId !== groupId) return true;
      if (onlyUnpaid) return t.isPaid; // Keep paid ones
      return false; // Remove all
    }));

    if (supabase) {
      let query = supabase.from('transactions').delete().eq('group_id', groupId);
      if (onlyUnpaid) {
        query = query.eq('is_paid', false);
      }
      await query;
    }
  }, []);
  const updateTransactionGroup = useCallback((groupId: string, data: any) => setTransactions(prev => prev.map(t => t.groupId === groupId ? { ...t, ...data } : t)), []);
  const payTransaction = useCallback((id: string) => setTransactions(prev => prev.map(t => t.id === id ? { ...t, isPaid: true } : t)), []);
  const addWallet = useCallback((w: any) => setWalletsState(prev => [...prev, { ...w, id: uuidv4() }]), []);
  const updateWallet = useCallback((id: string, data: any) => setWalletsState(prev => prev.map(w => w.id === id ? { ...w, ...data } : w)), []);
  const deleteWallet = useCallback(async (id: string) => {
    setWalletsState(prev => prev.filter(w => w.id !== id));
    if (supabase) {
      await supabase.from('wallets').delete().eq('id', id);
    }
  }, []);
  const addCategory = useCallback((c: any) => setCategories(prev => [...prev, { ...c, id: uuidv4() }]), []);
  const updateCategory = useCallback((id: string, data: any) => setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c)), []);
  const deleteCategory = useCallback(async (id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
    if (supabase) {
      await supabase.from('categories').delete().eq('id', id);
    }
  }, []);
  const addAttribution = useCallback((a: any) => setAttributions(prev => [...prev, { ...a, id: uuidv4() }]), []);
  const updateAttribution = useCallback((id: string, data: any) => setAttributions(prev => prev.map(a => a.id === id ? { ...a, ...data } : a)), []);
  const deleteAttribution = useCallback(async (id: string) => {
    setAttributions(prev => prev.filter(a => a.id !== id));
    if (supabase) {
      await supabase.from('attributions').delete().eq('id', id);
    }
  }, []);
  const updateBudget = useCallback((cid: string, amt: number, m: string) => setBudgets(prev => {
    const idx = prev.findIndex(b => b.categoryId === cid && b.month === m);
    if (idx > -1) { const u = [...prev]; u[idx] = { ...u[idx], amount: amt }; return u; }
    return [...prev, { id: uuidv4(), categoryId: cid, amount: amt, month: m }];
  }), []);
  const copyBudget = useCallback((from: string, targets: string[]) => setBudgets(prev => {
    let result = [...prev];
    targets.forEach(t => {
        result = result.filter(b => b.month !== t);
        const source = prev.filter(b => b.month === from);
        result = [...result, ...source.map(s => ({ ...s, id: uuidv4(), month: t }))];
    });
    return result;
  }), []);
  const addFixedAccount = useCallback((a: any) => setFixedAccounts(prev => [...prev, { ...a, id: uuidv4() }]), []);
  const updateFixedAccount = useCallback((id: string, data: any) => setFixedAccounts(prev => prev.map(a => a.id === id ? { ...a, ...data } : a)), []);
  const deleteFixedAccount = useCallback(async (id: string) => {
    setFixedAccounts(prev => prev.filter(a => a.id !== id));
    if (supabase) {
      await supabase.from('fixed_accounts').delete().eq('id', id);
    }
  }, []);

  const addImportRule = useCallback((r: any) => setImportRules(prev => [...prev, { ...r, id: uuidv4() }]), []);
  const updateImportRule = useCallback((id: string, data: any) => setImportRules(prev => prev.map(r => r.id === id ? { ...r, ...data } : r)), []);
  const deleteImportRule = useCallback(async (id: string) => {
    setImportRules(prev => prev.filter(r => r.id !== id));
    if (supabase) {
      await supabase.from('import_rules').delete().eq('id', id);
    }
  }, []);

  const generateFixedTransactions = useCallback((my: string) => {
    setTransactions(prev => {
        const next = [...prev];
        fixedAccounts.forEach(a => {
            if (!prev.some(t => t.fixedAccountId === a.id && t.date.startsWith(my))) {
                next.push({ id: uuidv4(), walletId: a.walletId, categoryId: a.categoryId, description: a.name, amount: a.amount, date: `${my}-01T12:00:00Z`, isPaid: false, type: 'SINGLE', nature: a.nature, attributionId: a.attributionId, fixedAccountId: a.id });
            }
        });
        return next;
    });
  }, [fixedAccounts]);

  return (
    <FinanceContext.Provider value={{
      wallets, categories, attributions, transactions, budgets, fixedAccounts, importRules,
      addTransaction, addTransactions, updateTransaction, updateTransactionGroup, deleteTransactionGroup, deleteTransaction,
      payTransaction, transferFunds, addWallet, updateWallet, deleteWallet,
      addCategory, updateCategory, deleteCategory, addAttribution, updateAttribution, deleteAttribution,
      updateBudget, copyBudget, addFixedAccount, updateFixedAccount, deleteFixedAccount, generateFixedTransactions,
      addImportRule, updateImportRule, deleteImportRule
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) throw new Error('useFinance must be used within a FinanceProvider');
  return context;
}
