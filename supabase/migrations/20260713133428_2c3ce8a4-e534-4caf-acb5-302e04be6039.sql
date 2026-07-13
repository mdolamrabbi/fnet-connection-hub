
-- Zones
CREATE TABLE public.zones (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.zones TO anon, authenticated;
GRANT ALL ON public.zones TO service_role;
ALTER TABLE public.zones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public zones access" ON public.zones FOR ALL USING (true) WITH CHECK (true);

-- Packages
CREATE TABLE public.packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  speed_mbps INTEGER NOT NULL,
  monthly_price NUMERIC(10,2) NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.packages TO anon, authenticated;
GRANT ALL ON public.packages TO service_role;
ALTER TABLE public.packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public packages access" ON public.packages FOR ALL USING (true) WITH CHECK (true);

-- Staff
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin','staff')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.staff TO anon, authenticated;
GRANT ALL ON public.staff TO service_role;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public staff access" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- Customers
CREATE TABLE public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  username TEXT,
  password TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  zone_id UUID REFERENCES public.zones(id) ON DELETE SET NULL,
  package_id UUID REFERENCES public.packages(id) ON DELETE SET NULL,
  monthly_bill NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_day INTEGER NOT NULL DEFAULT 1 CHECK (billing_day BETWEEN 1 AND 28),
  connection_date DATE,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive','suspended')),
  ip_address TEXT,
  mac_address TEXT,
  onu_mac TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.customers TO anon, authenticated;
GRANT ALL ON public.customers TO service_role;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public customers access" ON public.customers FOR ALL USING (true) WITH CHECK (true);

-- Invoices
CREATE TABLE public.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT NOT NULL UNIQUE,
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  due_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  billing_month TEXT NOT NULL,
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','paid','partial','overdue')),
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.invoices(customer_id);
CREATE INDEX ON public.invoices(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.invoices TO anon, authenticated;
GRANT ALL ON public.invoices TO service_role;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public invoices access" ON public.invoices FOR ALL USING (true) WITH CHECK (true);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  invoice_id UUID REFERENCES public.invoices(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  payment_date DATE NOT NULL DEFAULT CURRENT_DATE,
  payment_method TEXT NOT NULL DEFAULT 'cash',
  collector_name TEXT,
  transaction_id TEXT,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.payments(customer_id);
CREATE INDEX ON public.payments(payment_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO anon, authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public payments access" ON public.payments FOR ALL USING (true) WITH CHECK (true);

-- Activity logs
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX ON public.activity_logs(created_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO anon, authenticated;
GRANT ALL ON public.activity_logs TO service_role;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public activity access" ON public.activity_logs FOR ALL USING (true) WITH CHECK (true);

-- Settings (single row keyed by k)
CREATE TABLE public.settings (
  k TEXT PRIMARY KEY,
  v JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.settings TO anon, authenticated;
GRANT ALL ON public.settings TO service_role;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public settings access" ON public.settings FOR ALL USING (true) WITH CHECK (true);

-- updated_at trigger for customers
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
CREATE TRIGGER customers_updated_at BEFORE UPDATE ON public.customers
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Seed staff
INSERT INTO public.staff (username, password, full_name, role, status) VALUES
  ('Fnet', 'Fnet2580', 'FNET Admin', 'admin', 'active'),
  ('Nazmul', 'Nazmul1234', 'Nazmul', 'staff', 'active'),
  ('Arif', 'Arif12', 'Arif', 'staff', 'active');

-- Seed packages
INSERT INTO public.packages (name, speed_mbps, monthly_price, description) VALUES
  ('Basic', 10, 500, '10 Mbps home package'),
  ('Standard', 16, 700, '16 Mbps home package'),
  ('Premium', 25, 1000, '25 Mbps home package'),
  ('Ultra', 40, 1500, '40 Mbps premium package');

-- Seed zones
INSERT INTO public.zones (name, description) VALUES
  ('Zone A', 'North area'),
  ('Zone B', 'South area'),
  ('Zone C', 'East area');

-- Seed settings
INSERT INTO public.settings (k, v) VALUES
  ('company', '{"name":"FNET","address":"","phone":"","email":"","logo_url":""}'::jsonb);
