import { v4 as uuidv4 } from 'uuid';

export type WalletType = 'CREDIT_CARD' | 'BANK_ACCOUNT' | 'CASH';

export interface Wallet {
  id: string;
  name: string;
  type: WalletType;
  initialBalance: number;
  balance: number;
  dueDay?: number; // e.g. 10
  currentDueDate?: string; // e.g. '2026-05-10'
}

export interface Category {
  id: string;
  name: string;
  color: string;
  type?: 'INCOME' | 'EXPENSE' | 'BOTH';
  excludeFromBudget?: boolean;
}

export interface Attribution {
  id: string;
  name: string;
}

export type TransactionType = 
  | 'SINGLE'        // Pagamento único
  | 'INSTALLMENT'   // Parcelado
  | 'RECURRING'     // Recorrente variável
  | 'CONTINUOUS';   // Contínuo (Meta)

export type TransactionNature = 'INCOME' | 'EXPENSE' | 'TRANSFER_OUT' | 'TRANSFER_IN' | 'TRANSFER';

export interface Transaction {
  id: string;
  walletId: string;
  categoryId: string;
  description: string;
  amount: number;
  date: string;
  dueDate?: string;
  isPaid: boolean;
  type: TransactionType;
  nature: TransactionNature;
  attributionId?: string;
  destinationWalletId?: string; // For transfers (legacy/reference)
  transferId?: string; // To link paired transfer transactions
  groupId?: string; // Para parcelas
  installmentNumber?: number;
  totalInstallments?: number;
  expectedAmount?: number; // Para recorrente variável ou contínuo
  fixedAccountId?: string; // Para identificar transações geradas de contas fixas
}

export interface Budget {
  id: string;
  categoryId: string;
  amount: number;
  month: string; // YYYY-MM
}

export interface FixedAccount {
  id: string;
  name: string;
  amount: number;
  day: number;
  categoryId: string;
  walletId: string;
  nature: TransactionNature;
  attributionId?: string;
}

export const INITIAL_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Mercado', color: '#ef4444', type: 'EXPENSE' },
  { id: 'cat-2', name: 'Energia', color: '#eab308', type: 'EXPENSE' },
  { id: 'cat-3', name: 'Lazer', color: '#3b82f6', type: 'EXPENSE' },
  { id: 'cat-4', name: 'Aluguel', color: '#8b5cf6', type: 'EXPENSE' },
  { id: 'cat-5', name: 'Transporte', color: '#10b981', type: 'EXPENSE' },
  { id: 'cat-6', name: 'Salário', color: '#10b981', type: 'INCOME' },
  { id: 'cat-transfer', name: 'Transferência', color: '#3b82f6', type: 'BOTH' },
];

export const INITIAL_WALLETS: Wallet[] = [
  { id: 'wal-1', name: 'Conta Corrente', type: 'BANK_ACCOUNT', initialBalance: 5000, balance: 5000 },
  { id: 'wal-2', name: 'Cartão Master', type: 'CREDIT_CARD', initialBalance: 0, balance: 0, dueDay: 10 },
  { id: 'wal-3', name: 'Dinheiro', type: 'CASH', initialBalance: 200, balance: 200 },
];

export const INITIAL_ATTRIBUTIONS: Attribution[] = [
  { id: 'attr-1', name: 'Casal' },
  { id: 'attr-2', name: 'Fabio' },
  { id: 'attr-3', name: 'Grasi' },
];
