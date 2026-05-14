-- ColdMail AI 数据库表结构
-- 运行此 SQL 创建所需的数据表

-- 1. 用户表
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL, -- 前端生成的 user_id (u_xxx)
  email TEXT,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}'
);

CREATE INDEX idx_users_user_id ON users(user_id);
CREATE INDEX idx_users_referral_code ON users(referral_code);

-- 2. 订阅表
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  type TEXT NOT NULL, -- 'monthly', 'annual', 'trial', 'referral_bonus'
  plan TEXT NOT NULL, -- 'monthly', 'annual'
  status TEXT DEFAULT 'active', -- 'active', 'canceled', 'past_due'
  customer_id TEXT, -- Stripe customer ID
  subscription_id TEXT, -- Stripe subscription ID
  activated_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  source TEXT, -- 'activation_code', 'stripe', 'referral_award'
  code TEXT, -- 激活码
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_expires_at ON subscriptions(expires_at);

-- 3. 推荐统计表
CREATE TABLE referral_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT UNIQUE NOT NULL,
  invited INTEGER DEFAULT 0,
  paid_invited INTEGER DEFAULT 0,
  earned_months INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_referral_stats_user_id ON referral_stats(user_id);

-- 4. 事件追踪表
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  properties JSONB DEFAULT '{}',
  url TEXT,
  referrer TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_event ON events(event);
CREATE INDEX idx_events_created_at ON events(created_at);

-- 5. 激活码表（替代硬编码）
CREATE TABLE activation_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL, -- 'monthly', 'annual', 'trial'
  days INTEGER NOT NULL,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  discount DECIMAL(3,2), -- 0.5 = 50% 折扣
  starts_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ, -- 空值 = 永不过期
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activation_codes_code ON activation_codes(code);

-- 6. 推荐追踪表
CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_code TEXT NOT NULL,
  visitor_id TEXT, -- 访问者 ID
  clicked_at TIMESTAMPTZ DEFAULT NOW(),
  converted INTEGER DEFAULT 0 -- 是否转化
);

CREATE INDEX idx_referral_clicks_referrer ON referral_clicks(referrer_code);

-- 插入默认激活码
INSERT INTO activation_codes (code, type, days, max_uses) VALUES
  ('COLDMAIL-PRO-2025', 'monthly', 30, 100),
  ('COLDMAIL-LAUNCH', 'monthly', 30, 50),
  ('COLDMAIL-BETA', 'monthly', 30, 30),
  ('COLDMAIL-YEAR', 'annual', 365, 20),
  ('COLDMAIL-TEST', 'monthly', 7, 999),
  ('EARLYBIRD', 'annual', 365, 100),
  ('NEWYEAR2025', 'annual', 365, 50);

-- RLS 策略（Row Level Security）

-- 启用 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_stats ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (true);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (true);

CREATE POLICY "Users can view own subscriptions" ON subscriptions
  FOR SELECT USING (true);

CREATE POLICY "Users can view own referral stats" ON referral_stats
  FOR SELECT USING (true);

-- 服务端可以插入数据（用于 webhook）
CREATE POLICY "Service can insert events" ON events
  FOR INSERT WITH CHECK (true);

-- 视图：用户订阅状态
CREATE OR REPLACE VIEW user_subscription_status AS
SELECT 
  u.user_id,
  u.email,
  u.referral_code,
  s.type as subscription_type,
  s.plan as subscription_plan,
  s.status as subscription_status,
  s.expires_at,
  s.source,
  CASE 
    WHEN s.expires_at > NOW() THEN true 
    ELSE false 
  END as is_active
FROM users u
LEFT JOIN LATERAL (
  SELECT * FROM subscriptions 
  WHERE user_id = u.user_id 
  ORDER BY expires_at DESC 
  LIMIT 1
) s ON true;

-- 视图：每日统计
CREATE OR REPLACE VIEW daily_stats AS
SELECT 
  DATE(created_at) as date,
  COUNT(DISTINCT user_id) as active_users,
  COUNT(*) FILTER (WHERE event = 'email_generated') as emails_generated,
  COUNT(*) FILTER (WHERE event = 'payment_completed') as payments,
  COUNT(*) FILTER (WHERE event = 'signup') as signups
FROM events
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_referral_stats_updated_at
  BEFORE UPDATE ON referral_stats
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
