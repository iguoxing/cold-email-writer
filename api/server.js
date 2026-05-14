/**
 * ColdMail AI Backend API
 * 处理支付、订阅管理、激活码验证等功能
 */

import express from 'express'
import cors from 'cors'
import Stripe from 'stripe'
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

// 初始化 Stripe（替换为你的 Stripe Secret Key）
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_demo', {
  apiVersion: '2023-10-16'
})

// 初始化 Supabase（替换为你的 Supabase URL 和 Key）
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://your-project.supabase.co',
  process.env.SUPABASE_ANON_KEY || 'your-anon-key'
)

// 中间件
app.use(cors())
app.use(express.json())

// 激活码映射（实际应该存储在数据库中）
const ACTIVATION_CODES = {
  // 一次性码
  'COLDMAIL-PRO-2025': { type: 'monthly', days: 30, maxUses: 100, uses: 0 },
  'COLDMAIL-LAUNCH': { type: 'monthly', days: 30, maxUses: 50, uses: 0 },
  'COLDMAIL-BETA': { type: 'monthly', days: 30, maxUses: 30, uses: 0 },
  'COLDMAIL-YEAR': { type: 'annual', days: 365, maxUses: 20, uses: 0 },
  // 限时优惠码
  'EARLYBIRD': { type: 'annual', days: 365, maxUses: 100, uses: 0, discount: 0.5 },
  'NEWYEAR2025': { type: 'annual', days: 365, maxUses: 50, uses: 0, discount: 0.2 }
}

// 产品 ID 映射
// cold-email-writer month ¥49/月: price_1TWykjIUUdrFmAAWXxMusmMi
// cold-email-writer year  ¥399/年: price_1TWyleIUUdrFmAAWmC5dUzZB
const PRICE_IDS = {
  monthly: process.env.STRIPE_MONTHLY_PRICE_ID || 'price_1TWykjIUUdrFmAAWXxMusmMi',
  annual:  process.env.STRIPE_ANNUAL_PRICE_ID  || 'price_1TWyleIUUdrFmAAWmC5dUzZB'
}

// ==================== 激活码 API ====================

/**
 * POST /api/verify-code
 * 验证激活码
 */
app.post('/api/verify-code', async (req, res) => {
  try {
    const { code, userId } = req.body

    if (!code || !userId) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const normalizedCode = code.toUpperCase().trim()
    const codeConfig = ACTIVATION_CODES[normalizedCode]

    if (!codeConfig) {
      return res.json({ valid: false, error: '激活码无效' })
    }

    // 检查使用次数
    if (codeConfig.maxUses && codeConfig.uses >= codeConfig.maxUses) {
      return res.json({ valid: false, error: '此激活码已被用完' })
    }

    // 计算过期时间
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + codeConfig.days)

    // 创建订阅记录
    const subscription = {
      userId,
      type: codeConfig.type,
      plan: codeConfig.type === 'annual' ? 'annual' : 'monthly',
      activatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      code: normalizedCode,
      source: 'activation_code'
    }

    // 保存到数据库
    const { error } = await supabase
      .from('subscriptions')
      .upsert([subscription])

    if (error) {
      console.error('数据库错误:', error)
      // 如果数据库不可用，使用内存存储
      ACTIVATION_CODES[normalizedCode].uses++
      return res.json({
        valid: true,
        subscription: {
          type: codeConfig.type,
          expiresAt: expiresAt.toISOString(),
          days: codeConfig.days
        }
      })
    }

    // 增加使用计数
    ACTIVATION_CODES[normalizedCode].uses++

    res.json({
      valid: true,
      subscription: {
        type: codeConfig.type,
        expiresAt: expiresAt.toISOString(),
        days: codeConfig.days
      }
    })

  } catch (error) {
    console.error('验证激活码错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * POST /api/validate-subscription
 * 验证订阅状态
 */
app.post('/api/validate-subscription', async (req, res) => {
  try {
    const { userId } = req.body

    if (!userId) {
      return res.status(400).json({ error: '缺少 userId' })
    }

    // 从数据库获取订阅
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('userId', userId)
      .single()

    if (error || !data) {
      // 尝试内存查找
      return res.json({ isPro: false })
    }

    // 检查是否过期
    const expiresAt = new Date(data.expiresAt)
    if (expiresAt < new Date()) {
      return res.json({ isPro: false, expired: true })
    }

    res.json({
      isPro: true,
      subscription: data
    })

  } catch (error) {
    console.error('验证订阅错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// ==================== Stripe 支付 API ====================

/**
 * POST /api/create-checkout
 * 创建 Stripe Checkout Session
 */
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { plan, userId, referralCode } = req.body

    if (!plan || !userId) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const priceId = PRICE_IDS[plan]
    if (!priceId) {
      return res.status(400).json({ error: '无效的订阅方案' })
    }

    const successUrl = `${process.env.APP_URL || 'https://iguoxing.github.io/cold-email-writer'}/?checkout=success&session_id={CHECKOUT_SESSION_ID}`
    const cancelUrl = `${process.env.APP_URL || 'https://iguoxing.github.io/cold-email-writer'}/?checkout=cancelled`

    // 创建 Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [{
        price: priceId,
        quantity: 1
      }],
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId,
        plan,
        referralCode: referralCode || ''
      },
      subscription_data: {
        metadata: {
          userId,
          referralCode: referralCode || ''
        }
      }
    })

    res.json({
      sessionId: session.id,
      url: session.url
    })

  } catch (error) {
    console.error('创建 Checkout 错误:', error)
    res.status(500).json({ error: '创建支付会话失败' })
  }
})

/**
 * POST /api/create-portal
 * 创建 Stripe 客户门户 Session
 */
app.post('/api/create-portal', async (req, res) => {
  try {
    const { customerId, returnUrl } = req.body

    if (!customerId) {
      return res.status(400).json({ error: '缺少 customerId' })
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || process.env.APP_URL
    })

    res.json({ url: session.url })

  } catch (error) {
    console.error('创建 Portal 错误:', error)
    res.status(500).json({ error: '创建订阅管理页面失败' })
  }
})

/**
 * POST /api/webhook
 * Stripe Webhook 处理器
 */
app.post('/api/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature']
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event

  try {
    if (webhookSecret) {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
    } else {
      event = JSON.parse(req.body)
    }
  } catch (err) {
    console.error('Webhook 签名验证失败:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  // 处理事件
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object
      await handleCheckoutCompleted(session)
      break

    case 'customer.subscription.updated':
      const subscription = event.data.object
      await handleSubscriptionUpdated(subscription)
      break

    case 'customer.subscription.deleted':
      const deletedSub = event.data.object
      await handleSubscriptionDeleted(deletedSub)
      break

    case 'invoice.payment_failed':
      const invoice = event.data.object
      await handlePaymentFailed(invoice)
      break

    default:
      console.log(`未处理的事件类型: ${event.type}`)
  }

  res.json({ received: true })
})

// Webhook 处理函数
async function handleCheckoutCompleted(session) {
  const { userId, plan, referralCode } = session.metadata
  
  // 计算过期时间
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + (plan === 'annual' ? 365 : 30))

  // 保存订阅记录
  const subscription = {
    userId,
    type: plan,
    plan,
    customerId: session.customer,
    subscriptionId: session.subscription,
    activatedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    source: 'stripe'
  }

  await supabase.from('subscriptions').upsert([subscription])

  // 奖励推荐人
  if (referralCode) {
    await awardReferrer(referrerCode)
  }

  // 记录转化
  console.log('支付成功:', userId, plan)
}

async function handleSubscriptionUpdated(subscription) {
  // 更新订阅信息
  await supabase
    .from('subscriptions')
    .update({
      status: subscription.status,
      currentPeriodEnd: new Date(subscription.current_period_end * 1000).toISOString()
    })
    .eq('subscriptionId', subscription.id)
}

async function handleSubscriptionDeleted(subscription) {
  await supabase
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('subscriptionId', subscription.id)
}

async function handlePaymentFailed(invoice) {
  // 可以发送邮件提醒用户
  console.log('支付失败:', invoice.customer_email)
}

// 奖励推荐人
async function awardReferrer(referrerCode) {
  // 从推荐码获取推荐人用户 ID
  const { data: referrer } = await supabase
    .from('users')
    .select('id')
    .eq('referral_code', referrerCode)
    .single()

  if (referrer) {
    // 添加推荐奖励（1个月 Pro）
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    await supabase.from('subscriptions').upsert([{
      userId: referrer.id,
      type: 'referral_bonus',
      plan: 'monthly',
      expiresAt: expiresAt.toISOString(),
      source: 'referral_award'
    }])

    // 更新推荐统计
    const { data: stats } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('user_id', referrer.id)
      .single()

    if (stats) {
      await supabase
        .from('referral_stats')
        .update({ 
          paid_invited: stats.paid_invited + 1,
          earned_months: stats.earned_months + 1
        })
        .eq('user_id', referrer.id)
    } else {
      await supabase.from('referral_stats').insert([{
        user_id: referrer.id,
        invited: 0,
        paid_invited: 1,
        earned_months: 1
      }])
    }
  }
}

// ==================== 用户 API ====================

/**
 * POST /api/track-event
 * 追踪用户事件
 */
app.post('/api/track-event', async (req, res) => {
  try {
    const { event, userId, properties } = req.body

    await supabase.from('events').insert([{
      event,
      user_id: userId,
      properties,
      timestamp: new Date().toISOString()
    }])

    res.json({ success: true })
  } catch (error) {
    console.error('追踪事件错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * GET /api/referral-stats/:userId
 * 获取推荐统计
 */
app.get('/api/referral-stats/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    const { data, error } = await supabase
      .from('referral_stats')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (error || !data) {
      return res.json({
        invited: 0,
        paidInvited: 0,
        earnedMonths: 0
      })
    }

    res.json({
      invited: data.invited || 0,
      paidInvited: data.paid_invited || 0,
      earnedMonths: data.earned_months || 0
    })
  } catch (error) {
    console.error('获取推荐统计错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

/**
 * GET /api/generate-referral-code/:userId
 * 生成推荐码
 */
app.get('/api/generate-referral-code/:userId', async (req, res) => {
  try {
    const { userId } = req.params

    // 检查是否已有推荐码
    const { data: user } = await supabase
      .from('users')
      .select('referral_code')
      .eq('id', userId)
      .single()

    if (user?.referral_code) {
      return res.json({ referralCode: user.referral_code })
    }

    // 生成新推荐码
    const referralCode = 'CM' + Math.random().toString(36).substr(2, 6).toUpperCase()

    await supabase
      .from('users')
      .update({ referral_code: referralCode })
      .eq('id', userId)

    res.json({ referralCode })
  } catch (error) {
    console.error('生成推荐码错误:', error)
    res.status(500).json({ error: '服务器错误' })
  }
})

// ==================== 健康检查 ====================

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 ColdMail AI API 服务器运行在端口 ${PORT}`)
  console.log(`📝 Stripe 模式: ${process.env.STRIPE_SECRET_KEY ? '已配置' : '演示模式'}`)
  console.log(`📝 Supabase 模式: ${process.env.SUPABASE_URL ? '已配置' : '演示模式'}`)
})
