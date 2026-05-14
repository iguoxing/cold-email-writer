/**
 * 订阅管理系统
 * 处理 Pro 状态、激活码验证、订阅续期逻辑
 */

const STORAGE_KEYS = {
  PRO: 'coldmail_pro',
  USER_ID: 'coldmail_user_id',
  REFERRAL: 'coldmail_referral',
  REFERRAL_STATS: 'coldmail_referral_stats'
}

// 激活码映射（实际项目中这些应该存放在服务端）
const ACTIVATION_CODES = {
  // 一次性码
  'COLDMAIL-PRO-2025': { type: 'monthly', days: 30, uses: 100 },
  'COLDMAIL-LAUNCH': { type: 'monthly', days: 30, uses: 50 },
  'COLDMAIL-BETA': { type: 'monthly', days: 30, uses: 30 },
  'COLDMAIL-YEAR': { type: 'annual', days: 365, uses: 20 },
  'COLDMAIL-TEST': { type: 'monthly', days: 7, uses: 999 },
  'COLDMAIL-FREE7': { type: 'trial', days: 7, uses: 999 },
  // 限时优惠码
  'EARLYBIRD': { type: 'annual', days: 365, uses: 10, discount: 0.5 },
  'NEWYEAR2025': { type: 'annual', days: 365, uses: 50, discount: 0.2 },
  // 联盟奖励码（自动生成）
}

// API 配置
const API_BASE = 'https://api.coldmail-ai.com' // 替换为实际 API 地址

export function useSubscription() {
  const userId = getOrCreateUserId()

  // 获取用户ID
  function getOrCreateUserId() {
    let id = localStorage.getItem(STORAGE_KEYS.USER_ID)
    if (!id) {
      id = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
      localStorage.setItem(STORAGE_KEYS.USER_ID, id)
    }
    return id
  }

  // 获取推荐码
  function getReferralCode() {
    return localStorage.getItem(STORAGE_KEYS.REFERRAL) || null
  }

  // 设置推荐来源
  function setReferralFrom(urlParams) {
    const ref = urlParams.get('ref')
    if (ref && ref !== userId) {
      localStorage.setItem(STORAGE_KEYS.REFERRAL, ref)
      // 记录推荐点击（异步）
      trackReferralClick(ref)
    }
  }

  // 追踪推荐点击
  async function trackReferralClick(refCode) {
    try {
      // await fetch(`${API_BASE}/track/click`, {
      //   method: 'POST',
      //   body: JSON.stringify({ refCode, userId, timestamp: Date.now() })
      // })
      console.log('Referral click tracked:', refCode)
    } catch (e) {
      // 静默失败
    }
  }

  // 验证激活码
  async function verifyActivationCode(code) {
    const normalizedCode = code.toUpperCase().trim()
    
    // 本地验证
    const localCode = ACTIVATION_CODES[normalizedCode]
    if (localCode) {
      return validateLocalCode(normalizedCode, localCode)
    }

    // 远程验证（推荐用于生产环境）
    try {
      // const response = await fetch(`${API_BASE}/verify`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ code: normalizedCode, userId })
      // })
      // return await response.json()
      
      // 模拟远程验证
      return await mockRemoteVerify(normalizedCode)
    } catch (e) {
      return { valid: false, error: '验证服务暂时不可用' }
    }
  }

  // 本地激活码验证
  function validateLocalCode(code, config) {
    if (config.uses !== undefined && config.uses <= 0) {
      return { valid: false, error: '此激活码已被用完' }
    }

    // 计算过期时间
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + config.days)

    // 获取已有订阅
    const existing = getSubscription()
    
    // 计算新的过期时间
    let newExpiresAt = expiresAt
    if (existing && existing.expiresAt) {
      const existingExpiry = new Date(existing.expiresAt)
      if (existingExpiry > new Date()) {
        // 累加时间
        newExpiresAt = existingExpiry
        newExpiresAt.setDate(newExpiresAt.getDate() + config.days)
      }
    }

    const subscription = {
      type: config.type,
      plan: config.type === 'annual' ? 'annual' : 'monthly',
      activatedAt: new Date().toISOString(),
      expiresAt: newExpiresAt.toISOString(),
      code: code,
      userId: userId,
      referralFrom: getReferralCode()
    }

    localStorage.setItem(STORAGE_KEYS.PRO, JSON.stringify(subscription))

    // 追踪激活（实际需服务端扣减使用次数）
    trackActivation(code, config.type)

    return {
      valid: true,
      subscription: {
        type: config.type,
        expiresAt: newExpiresAt.toISOString(),
        days: config.days
      }
    }
  }

  // 模拟远程验证
  async function mockRemoteVerify(code) {
    await new Promise(resolve => setTimeout(resolve, 500))
    
    // 模拟一些随机激活码
    const mockCodes = ['REMOTE-TEST-001', 'API-VALIDATED']
    if (mockCodes.includes(code)) {
      return validateLocalCode(code, { type: 'monthly', days: 30 })
    }
    
    return { valid: false, error: '激活码无效' }
  }

  // 获取订阅状态
  function getSubscription() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.PRO)
      if (!data) return null
      
      const sub = JSON.parse(data)
      
      // 检查是否过期
      if (sub.expiresAt && new Date(sub.expiresAt) < new Date()) {
        // 订阅已过期，降级为免费
        localStorage.removeItem(STORAGE_KEYS.PRO)
        return null
      }
      
      return sub
    } catch {
      return null
    }
  }

  // 检查是否为 Pro
  function isPro() {
    return getSubscription() !== null
  }

  // 取消订阅
  function cancelSubscription() {
    localStorage.removeItem(STORAGE_KEYS.PRO)
    trackEvent('subscription_cancelled')
  }

  // 追踪事件
  function trackEvent(event, data = {}) {
    try {
      // 实际项目中发送到分析服务
      // fetch(`${API_BASE}/track/event`, {
      //   method: 'POST',
      //   body: JSON.stringify({ event, userId, ...data, timestamp: Date.now() })
      // })
      console.log('Track event:', event, data)
    } catch (e) {
      // 静默失败
    }
  }

  // 追踪激活
  function trackActivation(code, type) {
    // 追踪转化
    trackEvent('activation', { code: code.substring(0, 4) + '***', type })
    
    // 奖励推荐人（如果是推荐来的）
    const referrer = getReferralCode()
    if (referrer) {
      awardReferrer(referrer)
    }
  }

  // 奖励推荐人
  async function awardReferrer(referrerCode) {
    try {
      // await fetch(`${API_BASE}/referral/award`, {
      //   method: 'POST',
      //   body: JSON.stringify({ referrerCode, newUserId: userId })
      // })
      
      // 模拟：增加推荐人统计
      const statsKey = `referral_stats_${referrerCode}`
      const stats = JSON.parse(localStorage.getItem(statsKey) || '{"invited":0,"earned":0}')
      stats.invited++
      stats.earned++ // 每邀请1人得1个月
      localStorage.setItem(statsKey, JSON.stringify(stats))
      
      trackEvent('referral_awarded', { referrer: referrerCode })
    } catch (e) {
      // 静默失败
    }
  }

  // 获取推荐统计
  function getReferralStats() {
    const statsKey = `referral_stats_${userId}`
    return JSON.parse(localStorage.getItem(statsKey) || '{"invited":0,"earned":0}')
  }

  // 创建 Stripe Checkout Session
  async function createCheckoutSession(plan, successUrl, cancelUrl) {
    try {
      // 实际项目中调用后端
      // const response = await fetch(`${API_BASE}/create-checkout`, {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ 
      //     plan, 
      //     userId,
      //     referralCode: getReferralCode(),
      //     successUrl,
      //     cancelUrl
      //   })
      // })
      // const { sessionId, url } = await response.json()
      // return url
      
      // 模拟返回 Stripe Checkout URL
      return `https://checkout.stripe.com/pay/demo_${plan}_${userId}`
    } catch (e) {
      throw new Error('无法创建支付会话')
    }
  }

  // 创建客户订阅门户链接（用于管理订阅）
  async function createPortalSession(returnUrl) {
    try {
      // const response = await fetch(`${API_BASE}/create-portal`, {
      //   method: 'POST',
      //   body: JSON.stringify({ userId, returnUrl })
      // })
      // const { url } = await response.json()
      // return url
      
      return `https://billing.stripe.com/session/demo_portal`
    } catch (e) {
      throw new Error('无法打开订阅管理页面')
    }
  }

  // Webhook 处理（用于 Stripe 回调）
  function handleWebhook(event, data) {
    switch (event) {
      case 'checkout.session.completed':
        // 支付成功，激活订阅
        activateFromPayment(data)
        break
      case 'customer.subscription.updated':
        // 订阅更新
        updateSubscription(data)
        break
      case 'customer.subscription.deleted':
        // 订阅取消
        cancelSubscription()
        break
      case 'invoice.payment_failed':
        // 支付失败
        handlePaymentFailed(data)
        break
    }
  }

  // 从支付激活订阅
  function activateFromPayment(paymentData) {
    const { userId: paymentUserId, plan, customerId, subscriptionId } = paymentData
    
    const days = plan === 'annual' ? 365 : 30
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + days)

    const subscription = {
      type: plan,
      plan: plan,
      activatedAt: new Date().toISOString(),
      expiresAt: expiresAt.toISOString(),
      customerId,
      subscriptionId,
      userId: paymentUserId || userId
    }

    localStorage.setItem(STORAGE_KEYS.PRO, JSON.stringify(subscription))
    trackEvent('payment_success', { plan })
  }

  // 处理支付失败
  function handlePaymentFailed(data) {
    trackEvent('payment_failed', data)
    // 可以发送邮件提醒用户
  }

  return {
    userId,
    getSubscription,
    isPro,
    verifyActivationCode,
    cancelSubscription,
    setReferralFrom,
    getReferralCode,
    getReferralStats,
    createCheckoutSession,
    createPortalSession,
    handleWebhook,
    trackEvent
  }
}

// 导出默认订阅实例
export default useSubscription
