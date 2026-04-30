import type {Metadata} from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Finantech | Gestão Financeira Pessoal',
  description: 'Controle de despesas, orçamentos e carteiras em um só lugar.',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className} suppressHydrationWarning>{children}</body>
    </html>
  );
}
