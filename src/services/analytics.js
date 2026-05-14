/**
 * 数据分析与追踪系统
 * 用于优化转化率和用户体验
 */

const ANALYTICS_CONFIG = {
  // 应用 ID
  appId: 'coldmail_ai',
  // API 地址（可选，用于发送到分析服务）
  apiEndpoint: null, // 'https://analytics.coldmail-ai.com/track'
}

// 事件类型
export const EVENTS = {
  // 用户行为
  PAGE_VIEW: 'page_view',
  FEATURE_USED: 'feature_used',
  EMAIL_GENERATED: 'email_generated',
  EMAIL_COPIED: 'email_copied',
  
  // 转化事件
  SIGNUP: 'signup',
  UPGRADE_CLICK: 'upgrade_click',
  PAYMENT_COMPLETED: 'payment_completed',
  PAYMENT_FAILED: 'payment_failed',
  
  // 分享事件
  SHARE_CLICK: 'share_click',
  REFERRAL_CLICK: 'referral_click',
  
  // 错误
  ERROR: 'error',
  API_ERROR: 'api_error'
}

// 用户属性
export const USER_PROPERTIES = {
  PLAN: 'plan',
  LANGUAGE: 'language',
  COUNTRY: 'country',
  INDUSTRY: 'industry',
  SIGNUP_DATE: 'signup_date',
  LAST_ACTIVE: 'last_active'
}

class Analytics {
  constructor() {
    this.sessionId = this.getOrCreateSessionId()
    this.userId = localStorage.getItem('coldmail_user_id') || null
    this.startTime = Date.now()
    this.events = []
  }

  // 获取/创建会话 ID
  getOrCreateSessionId() {
    let sessionId = sessionStorage.getItem('coldmail_session_id')
    if (!sessionId) {
      sessionId = 'sess_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
      sessionStorage.setItem('coldmail_session_id', sessionId)
    }
    return sessionId
  }

  // 追踪事件
  track(event, properties = {}) {
    const eventData = {
      event,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      userId: this.userId,
      appId: ANALYTICS_CONFIG.appId,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenWidth: window.screen.width,
        screenHeight: window.screen.height
      }
    }

    // 本地存储
    this.events.push(eventData)
    this.saveEvents()

    // 发送到服务器（异步，不阻塞）
    this.sendToServer(eventData)

    // 控制台输出（开发模式）
    if (import.meta.env.DEV) {
      console.log('📊 Track:', event, properties)
    }
  }

  // 追踪页面浏览
  trackPageView(page) {
    this.track(EVENTS.PAGE_VIEW, { page })
  }

  // 追踪用户属性
  setUserProperty(key, value) {
    const props = JSON.parse(localStorage.getItem('coldmail_user_props') || '{}')
    props[key] = value
    localStorage.setItem('coldmail_user_props', JSON.stringify(props))
    this.track('user_property_set', { key, value })
  }

  // 获取用户属性
  getUserProperty(key) {
    const props = JSON.parse(localStorage.getItem('coldmail_user_props') || '{}')
    return props[key]
  }

  // 追踪转化漏斗
  trackFunnel(step, value = null) {
    const funnels = JSON.parse(localStorage.getItem('coldmail_funnels') || '{}')
    funnels[step] = {
      timestamp: Date.now(),
      value
    }
    localStorage.setItem('coldmail_funnels', JSON.stringify(funnels))
    this.track('funnel_step', { step, value })
  }

  // 获取转化漏斗数据
  getFunnelData() {
    return JSON.parse(localStorage.getItem('coldmail_funnels') || '{}')
  }

  // 保存事件到本地
  saveEvents() {
    try {
      const saved = JSON.parse(localStorage.getItem('coldmail_events') || '[]')
      const merged = [...saved, ...this.events].slice(-100) // 保留最近 100 条
      localStorage.setItem('coldmail_events', JSON.stringify(merged))
      this.events = []
    } catch (e) {
      // 存储已满，清理旧数据
      localStorage.setItem('coldmail_events', '[]')
    }
  }

  // 发送到服务器
  async sendToServer(eventData) {
    if (!ANALYTICS_CONFIG.apiEndpoint) return

    try {
      await fetch(ANALYTICS_CONFIG.apiEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(eventData),
        keepalive: true // 确保页面关闭时也能发送
      })
    } catch (e) {
      // 静默失败
    }
  }

  // 获取统计数据
  getStats() {
    const events = JSON.parse(localStorage.getItem('coldmail_events') || '[]')
    const funnels = this.getFunnelData()
    const userProps = JSON.parse(localStorage.getItem('coldmail_user_props') || '{}')

    // 计算关键指标
    const stats = {
      totalEvents: events.length,
      emailGenerated: events.filter(e => e.event === EVENTS.EMAIL_GENERATED).length,
      upgradeClicks: events.filter(e => e.event === EVENTS.UPGRADE_CLICK).length,
      paymentsCompleted: events.filter(e => e.event === EVENTS.PAYMENT_COMPLETED).length,
      shares: events.filter(e => e.event === EVENTS.SHARE_CLICK).length,
      errors: events.filter(e => e.event === EVENTS.ERROR).length,
      
      // 转化率
      funnel: this.calculateFunnelConversion(funnels),
      
      // 用户属性
      userProperties: userProps,
      
      // 时间统计
      sessionDuration: Date.now() - this.startTime,
      
      // 今日统计
      today: this.getTodayStats(events)
    }

    return stats
  }

  // 计算漏斗转化率
  calculateFunnelConversion(funnels) {
    const steps = ['page_view', 'signup', 'email_generated', 'upgrade_click', 'payment_completed']
    const results = {}
    
    let lastCount = null
    for (const step of steps) {
      const stepData = funnels[step]
      const count = stepData ? 1 : 0
      
      if (lastCount !== null) {
        results[step] = {
          count,
          conversionRate: lastCount > 0 ? (count / lastCount * 100).toFixed(1) + '%' : '0%'
        }
      } else {
        results[step] = { count }
      }
      
      lastCount = count || lastCount
    }
    
    return results
  }

  // 获取今日统计
  getTodayStats(events) {
    const today = new Date().toISOString().split('T')[0]
    const todayEvents = events.filter(e => {
      const eventDate = new Date(e.timestamp).toISOString().split('T')[0]
      return eventDate === today
    })

    return {
      events: todayEvents.length,
      emailGenerated: todayEvents.filter(e => e.event === EVENTS.EMAIL_GENERATED).length,
      copies: todayEvents.filter(e => e.event === EVENTS.EMAIL_COPIED).length
    }
  }

  // 导出数据
  exportData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      events: JSON.parse(localStorage.getItem('coldmail_events') || '[]'),
      funnels: this.getFunnelData(),
      userProperties: JSON.parse(localStorage.getItem('coldmail_user_props') || '{}'),
      stats: this.getStats()
    }
  }

  // 清除数据（GDPR）
  clearData() {
    localStorage.removeItem('coldmail_events')
    localStorage.removeItem('coldmail_funnels')
    // 保留用户 ID 和属性
  }
}

// 创建单例
const analytics = new Analytics()

export function useAnalytics() {
  return analytics
}

export default analytics
