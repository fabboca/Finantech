'use client';

import FinanceDashboard from '@/components/finance-dashboard';
import { FinanceProvider } from '@/hooks/use-finance';
import { AuthProvider, useAuth } from '@/components/auth-provider';
import LoginPage from '@/components/login-page';

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-pulse shadow-lg shadow-blue-600/20">
          <span className="text-3xl font-black text-white">F</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <FinanceProvider>
      <FinanceDashboard />
    </FinanceProvider>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
