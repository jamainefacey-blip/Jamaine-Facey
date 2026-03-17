-- Pain Commerce Database Schema
-- Compatible with PostgreSQL / Supabase

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255),
  stripe_customer_id VARCHAR(255) UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_customers_email ON customers (email);
CREATE INDEX idx_customers_stripe ON customers (stripe_customer_id);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
  subscription_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  customer_id UUID NOT NULL REFERENCES customers(customer_id),
  stripe_subscription_id VARCHAR(255) UNIQUE,
  stripe_price_id VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  canceled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_customer ON subscriptions (customer_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions (stripe_subscription_id);
CREATE INDEX idx_subscriptions_status ON subscriptions (status);

-- Licenses table
CREATE TABLE IF NOT EXISTS licenses (
  license_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product_id VARCHAR(255) NOT NULL,
  customer_id UUID NOT NULL REFERENCES customers(customer_id),
  issue_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expiry TIMESTAMPTZ,
  status VARCHAR(50) NOT NULL DEFAULT 'active'
);

CREATE INDEX idx_licenses_customer ON licenses (customer_id);
CREATE INDEX idx_licenses_product ON licenses (product_id);
CREATE INDEX idx_licenses_status ON licenses (status);

-- Spider Strategy Ledger
CREATE TABLE IF NOT EXISTS spider_ledger (
  transaction_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  product VARCHAR(255) NOT NULL,
  revenue NUMERIC(12, 2) NOT NULL,
  fee NUMERIC(12, 2) NOT NULL DEFAULT 0,
  net_revenue NUMERIC(12, 2) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_spider_ledger_product ON spider_ledger (product);
CREATE INDEX idx_spider_ledger_timestamp ON spider_ledger (timestamp);
