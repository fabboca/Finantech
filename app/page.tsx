'use client';

import FinanceDashboard from '@/components/finance-dashboard';
import { FinanceProvider } from '@/hooks/use-finance';

export default function Home() {
  return (
    <FinanceProvider>
      <FinanceDashboard />
    </FinanceProvider>
  );
}
