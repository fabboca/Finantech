-- Supabase Schema for Finantech

-- Wallets
CREATE TABLE wallets (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  initial_balance NUMERIC NOT NULL DEFAULT 0,
  due_day INTEGER,
  current_due_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Categories
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  type TEXT,
  exclude_from_budget BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attributions
CREATE TABLE attributions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transactions
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  wallet_id TEXT REFERENCES wallets(id) ON DELETE CASCADE,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  attribution_id TEXT REFERENCES attributions(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  due_date TIMESTAMP WITH TIME ZONE,
  is_paid BOOLEAN NOT NULL DEFAULT FALSE,
  type TEXT NOT NULL,
  nature TEXT NOT NULL,
  destination_wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
  transfer_id TEXT,
  group_id TEXT,
  installment_number INTEGER,
  total_installments INTEGER,
  expected_amount NUMERIC,
  fixed_account_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Budgets
CREATE TABLE budgets (
  id TEXT PRIMARY KEY,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  amount NUMERIC NOT NULL,
  month TEXT NOT NULL, -- YYYY-MM
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Fixed Accounts
CREATE TABLE fixed_accounts (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  day INTEGER NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE SET NULL,
  wallet_id TEXT REFERENCES wallets(id) ON DELETE SET NULL,
  nature TEXT NOT NULL,
  attribution_id TEXT REFERENCES attributions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE attributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE fixed_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies for public access (For prototyping/development)
-- NOTE: In production, you should restrict this to authenticated users only.
CREATE POLICY "Public access for wallets" ON wallets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for categories" ON categories FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for attributions" ON attributions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for transactions" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for budgets" ON budgets FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Public access for fixed_accounts" ON fixed_accounts FOR ALL USING (true) WITH CHECK (true);

-- Import Rules
CREATE TABLE import_rules (
  id TEXT PRIMARY KEY,
  pattern TEXT NOT NULL,
  category_id TEXT REFERENCES categories(id) ON DELETE CASCADE,
  attribution_id TEXT REFERENCES attributions(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
ALTER TABLE import_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public access for import_rules" ON import_rules FOR ALL USING (true) WITH CHECK (true);
