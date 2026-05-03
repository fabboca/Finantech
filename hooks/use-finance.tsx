'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addMonths, format, startOfMonth } from 'date-fns';
import { 
  Wallet, 
  Category, 
  Transaction, 
  Budget, 
  Attribution,
  INITIAL_WALLETS, 
  INITIAL_CATEGORIES,
  INITIAL_ATTRIBUTIONS,
  TransactionType
} from '../lib/types';

interface FinanceContextType {
  wallets: Wallet[];
  categories: Category[];
  attributions: Attribution[];
  transactions: Transaction[];
  budgets: Budget[];
  addTransaction: (data: Partial<Transaction> & { installments?: number }) => void;
  transferFunds: (data: { fromWalletId: string, toWalletId: string, amount: number, date: string, dueDate?: string, description: string }) => void;
  updateTransaction: (id: string, data: Partial<Transaction>) => void;
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
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: React.ReactNode }) {
  const [walletsState, setWalletsState] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [attributions, setAttributions] = useState<Attribution[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);

  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      try {
        const savedWallets = localStorage.getItem('finantech_wallets');
        const savedCategories = localStorage.getItem('finantech_categories');
        const savedAttributions = localStorage.getItem('finantech_attributions');
        const savedTransactions = localStorage.getItem('finantech_transactions');
        const savedBudgets = localStorage.getItem('finantech_budgets');

        const parsedAttributions = savedAttributions ? JSON.parse(savedAttributions) : INITIAL_ATTRIBUTIONS;
        
        // Migrate "Josi" to "Grasi" if found in attributions
        const migratedAttributions = (parsedAttributions as Attribution[]).map(a => 
          a.name === 'Josi' ? { ...a, name: 'Grasi' } : a
        );

        const parsedTransactions = savedTransactions ? JSON.parse(savedTransactions) : [];
        // Migrate legacy transactions
        const migratedTransactions = parsedTransactions.map((t: any) => ({
          ...t,
          nature: t.nature || 'EXPENSE',
          attributionId: t.attributionId || 'attr-1' // Default to "Casal"
        }));

        setWalletsState(savedWallets ? JSON.parse(savedWallets) : INITIAL_WALLETS);
        setCategories(savedCategories ? JSON.parse(savedCategories) : INITIAL_CATEGORIES);
        setAttributions(migratedAttributions);
        setTransactions(migratedTransactions);
        setBudgets(savedBudgets ? JSON.parse(savedBudgets) : []);
      } catch (e) {
        console.error('Error loading data from localStorage', e);
        setWalletsState(INITIAL_WALLETS);
        setCategories(INITIAL_CATEGORIES);
        setAttributions(INITIAL_ATTRIBUTIONS);
      } finally {
        setIsLoaded(true);
      }
    });

    return () => cancelAnimationFrame(frame);
  }, []);

  // Compute balances dynamically
  const wallets = React.useMemo(() => {
    return walletsState.map(wallet => {
      let balance = wallet.initialBalance || 0;
      
      transactions.forEach(t => {
        if (!t.isPaid && t.nature !== 'TRANSFER_OUT' && t.nature !== 'TRANSFER_IN' && t.nature !== 'TRANSFER') return; // Transfers are always "paid" in this system

        if (t.walletId === wallet.id) {
          if (t.nature === 'INCOME' || t.nature === 'TRANSFER_IN') {
            balance += t.amount;
          } else if (t.nature === 'EXPENSE' || t.nature === 'TRANSFER_OUT' || t.nature === 'TRANSFER') {
            balance -= t.amount;
          }
        }
        
        // Legacy support
        if (t.nature === 'TRANSFER' && t.destinationWalletId === wallet.id) {
          balance += t.amount;
        }
      });
      
      return { ...wallet, balance };
    });
  }, [walletsState, transactions]);

  // Save to localStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem('finantech_wallets', JSON.stringify(walletsState));
      localStorage.setItem('finantech_categories', JSON.stringify(categories));
      localStorage.setItem('finantech_attributions', JSON.stringify(attributions));
      localStorage.setItem('finantech_transactions', JSON.stringify(transactions));
      localStorage.setItem('finantech_budgets', JSON.stringify(budgets));
    } catch (e) {
      console.error('Error saving data to localStorage', e);
    }
  }, [walletsState, categories, attributions, transactions, budgets, isLoaded]);

  const addTransaction = useCallback((data: any) => {
    try {
      const { type, installments = 1, amount = 0, date = new Date().toISOString(), dueDate, ...rest } = data;
      const newTransactions: Transaction[] = [];
      const groupId = installments > 1 ? uuidv4() : undefined;

      if (type === 'INSTALLMENT') {
        for (let i = 0; i < installments; i++) {
          newTransactions.push({
            id: uuidv4(),
            type,
            nature: rest.nature || 'EXPENSE',
            amount: amount,
            date: addMonths(new Date(date), i).toISOString(),
            dueDate: dueDate ? addMonths(new Date(dueDate), i).toISOString() : undefined,
            isPaid: false,
            groupId,
            installmentNumber: i + 1,
            totalInstallments: installments,
            ...rest
          });
        }
      } else {
        newTransactions.push({
          id: uuidv4(),
          type,
          nature: rest.nature || 'EXPENSE',
          amount,
          date,
          dueDate,
          isPaid: rest.isPaid || false,
          ...rest
        });
      }

      setTransactions(prev => [...prev, ...newTransactions]);
    } catch (e) {
      console.error('Error adding transaction', e);
    }
  }, []);

  const transferFunds = useCallback((data: { fromWalletId: string, toWalletId: string, amount: number, date: string, dueDate?: string, description: string }) => {
    try {
      const { fromWalletId, toWalletId, amount, date, dueDate, description } = data;
      const transferId = uuidv4();

      const debitTransaction: Transaction = {
        id: uuidv4(),
        walletId: fromWalletId,
        destinationWalletId: toWalletId,
        categoryId: 'cat-transfer', // Special category for transfers
        description,
        amount,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isPaid: true,
        type: 'SINGLE',
        nature: 'TRANSFER_OUT',
        transferId
      };

      const creditTransaction: Transaction = {
        id: uuidv4(),
        walletId: toWalletId,
        destinationWalletId: fromWalletId,
        categoryId: 'cat-transfer',
        description,
        amount,
        date: new Date(date).toISOString(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
        isPaid: true,
        type: 'SINGLE',
        nature: 'TRANSFER_IN',
        transferId
      };

      setTransactions(prev => [...prev, debitTransaction, creditTransaction]);
    } catch (e) {
      console.error('Error transferring funds', e);
    }
  }, []);

  const updateTransaction = useCallback((id: string, data: Partial<Transaction>) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (target?.transferId) {
        // Sync shared fields for both sides of the transfer, but keep unique ones
        return prev.map(t => {
          if (t.transferId === target.transferId) {
            const { walletId, destinationWalletId, nature, id: tid, ...sharedData } = data;
            return { ...t, ...sharedData };
          }
          return t;
        });
      }
      return prev.map(t => t.id === id ? { ...t, ...data } : t);
    });
  }, []);

  const deleteTransaction = useCallback((id: string) => {
    setTransactions(prev => {
      const target = prev.find(t => t.id === id);
      if (target?.transferId) {
        return prev.filter(t => t.transferId !== target.transferId);
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const updateTransactionGroup = useCallback((groupId: string, data: Partial<Transaction>) => {
    setTransactions(prev => prev.map(t => {
      if (t.groupId === groupId) {
        // When updating a group, we typically want to update category, description, nature, maybe amount
        // But we must NOT update id, installmentsNumber, totalInstallments, date, etc.
        const { id, installmentNumber, totalInstallments, date, dueDate, ...validData } = data as any;
        return { ...t, ...validData };
      }
      return t;
    }));
  }, []);

  const payTransaction = useCallback((id: string, paidAmount?: number) => {
    setTransactions(prev => prev.map(t => {
      if (t.id === id) {
        const finalAmount = paidAmount !== undefined ? paidAmount : t.amount;
        return { ...t, isPaid: true, amount: finalAmount };
      }
      return t;
    }));
  }, []);

  const addWallet = useCallback((wallet: Omit<Wallet, 'id'>) => {
    setWalletsState(prev => [...prev, { ...wallet, id: uuidv4() }]);
  }, []);

  const updateWallet = useCallback((id: string, data: Partial<Wallet>) => {
    setWalletsState(prev => prev.map(w => w.id === id ? { ...w, ...data } : w));
  }, []);

  const deleteWallet = useCallback((id: string) => {
    setWalletsState(prev => prev.filter(w => w.id !== id));
  }, []);

  const addCategory = useCallback((category: Omit<Category, 'id'>) => {
    setCategories(prev => [...prev, { ...category, id: uuidv4() }]);
  }, []);

  const updateCategory = useCallback((id: string, data: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setCategories(prev => prev.filter(c => c.id !== id));
  }, []);

  const addAttribution = useCallback((attribution: Omit<Attribution, 'id'>) => {
    setAttributions(prev => [...prev, { ...attribution, id: uuidv4() }]);
  }, []);

  const updateAttribution = useCallback((id: string, data: Partial<Attribution>) => {
    setAttributions(prev => prev.map(a => a.id === id ? { ...a, ...data } : a));
  }, []);

  const deleteAttribution = useCallback((id: string) => {
    setAttributions(prev => prev.filter(a => a.id !== id));
  }, []);

  const updateBudget = useCallback((categoryId: string, amount: number, month: string) => {
    setBudgets(prev => {
      const existingIndex = prev.findIndex(b => b.categoryId === categoryId && b.month === month);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = { ...updated[existingIndex], amount };
        return updated;
      }
      return [...prev, { id: uuidv4(), categoryId, amount, month }];
    });
  }, []);

  const copyBudget = useCallback((fromMonth: string, targetMonths: string[]) => {
    setBudgets(prev => {
      const sourceBudgets = prev.filter(b => b.month === fromMonth);
      let newBudgets = [...prev];

      targetMonths.forEach(month => {
        // Remove existing budgets for the target month to avoid duplicates
        newBudgets = newBudgets.filter(b => b.month !== month);
        
        // Copy the source budgets
        const copied = sourceBudgets.map(b => ({
          ...b,
          id: uuidv4(),
          month
        }));
        
        newBudgets = [...newBudgets, ...copied];
      });

      return newBudgets;
    });
  }, []);

  return (
    <FinanceContext.Provider value={{
      wallets,
      categories,
      attributions,
      transactions,
      budgets,
      addTransaction,
      updateTransaction,
      updateTransactionGroup,
      deleteTransaction,
      payTransaction,
      transferFunds,
      addWallet,
      updateWallet,
      deleteWallet,
      addCategory,
      updateCategory,
      deleteCategory,
      addAttribution,
      updateAttribution,
      deleteAttribution,
      updateBudget,
      copyBudget
    }}>
      {children}
    </FinanceContext.Provider>
  );
}

export function useFinance() {
  const context = useContext(FinanceContext);
  if (context === undefined) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
