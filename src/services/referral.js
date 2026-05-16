/**
 * 自动化获客系统
 * 包含分享奖励、推荐追踪、用户激活等功能
 */

// 推荐奖励配置
const REFERRAL_REWARDS = {
  INVITE_1: { freeMonths: 1, description: '邀请1人付费，得1个月Pro' },
  INVITE_5: { freeMonths: 12, description: '邀请5人付费，得1年Pro' },
  INVITE_10: { freeMonths: 24, description: '邀请10人付费，得2年Pro' }
}

export function useReferralSystem() {
  const userId = getOrCreateUserId()
  const storageKey = `referral_${userId}`

  // 获取/创建用户ID
  function getOrCreateUserId() {
    let id = localStorage.getItem('coldmail_user_id')
    if (!id) {
      id = 'u_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
      localStorage.setItem('coldmail_user_id', id)
    }
    return id
  }

  // 生成推荐链接
  function getReferralLink(baseUrl = 'https://mail.zhaoguoxing.com/') {
    return `${baseUrl}?ref=${userId}`
  }

  // 获取推荐统计
  function getStats() {
    const data = localStorage.getItem(storageKey)
    if (!data) {
      return {
        invited: 0,
        paidInvited: 0,
        earnedMonths: 0,
        history: []
      }
    }
    return JSON.parse(data)
  }

  // 保存推荐统计
  function saveStats(stats) {
    localStorage.setItem(storageKey, JSON.stringify(stats))
  }

  // 增加推荐计数
  function addInvite(isPaid = false) {
    const stats = getStats()
    stats.invited++
    if (isPaid) {
      stats.paidInvited++
      stats.earnedMonths++
    }
    stats.history.push({
      timestamp: Date.now(),
      isPaid,
      code: generateInviteCode()
    })
    saveStats(stats)
    return stats
  }

  // 生成邀请码
  function generateInviteCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
    let code = 'CM'
    for (let i = 0; i < 4; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return code
  }

  // 检查是否满足奖励条件
  function checkRewards() {
    const stats = getStats()
    const rewards = []
    
    if (stats.paidInvited >= 1) {
      rewards.push({
        ...REFERRAL_REWARDS.INVITE_1,
        earned: true
      })
    }
    if (stats.paidInvited >= 5) {
      rewards.push({
        ...REFERRAL_REWARDS.INVITE_5,
        earned: true
      })
    }
    if (stats.paidInvited >= 10) {
      rewards.push({
        ...REFERRAL_REWARDS.INVITE_10,
        earned: true
      })
    }
    
    // 计算下一个奖励
    const nextMilestone = stats.paidInvited < 1 ? 1 
      : stats.paidInvited < 5 ? 5 
      : stats.paidInvited < 10 ? 10 
      : null
    
    return {
      rewards,
      stats,
      nextMilestone,
      nextReward: nextMilestone ? REFERRAL_REWARDS[`INVITE_${nextMilestone}`] : null
    }
  }

  // 获取分享文案
  function getShareText(productName = 'ColdMail AI') {
    return {
      wechat: `🤖 发现了这个超好用的外贸开发信AI工具！\n\n输入中文需求，自动生成多语言高转化邮件，还有垃圾邮件检测功能！\n\n${getReferralLink()}\n\n#外贸 #AI工具 #ColdMail`,
      
      email: {
        subject: `推荐给你：${productName}`,
        body: `你好！\n\n我发现了一个很实用的外贸开发信AI工具 - ${productName}。\n\n它可以帮你：\n✅ 输入中文需求，自动生成多语言开发信\n✅ AI 评分优化，提升打开率和回复率\n✅ 垃圾邮件检测，避免进垃圾箱\n✅ 支持英语、法语、阿拉伯语等6种语言\n\n用我的推荐链接注册，你我都可以获得额外福利：\n${getReferralLink()}\n\n试试看！`
      },
      
      linkedin: `发现了一个超好用的 #外贸 开发信 AI 工具！🤖\n\n输入中文需求，自动生成多语言高转化邮件，还有垃圾邮件风险检测功能。\n\n支持英语、法语、阿拉伯语、西班牙语、俄语、葡萄牙语，覆盖全球主要市场。\n\n用我的推荐链接试试：${getReferralLink()}\n\n#外贸拓客 #AI工具 #B2B销售`,
      
      twitter: `Found this amazing AI tool for cold emails! 🚀\n\nInput in Chinese, get high-converting emails in multiple languages. Perfect for #B2B #export\n\n${getReferralLink()}`
    }
  }

  // 分享到微信（复制文案）
  function shareToWechat() {
    const text = getShareText().wechat
    navigator.clipboard.writeText(text)
    trackShare('wechat')
    return text
  }

  // 分享到 LinkedIn
  function shareToLinkedIn() {
    const text = encodeURIComponent(getShareText().linkedin)
    const url = encodeURIComponent(getReferralLink())
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${url}`, '_blank')
    trackShare('linkedin')
  }

  // 分享到 Twitter
  function shareToTwitter() {
    const text = encodeURIComponent(getShareText().twitter)
    window.open(`https://twitter.com/intent/tweet?text=${text}`, '_blank')
    trackShare('twitter')
  }

  // 发送邮件分享
  function shareViaEmail() {
    const { subject, body } = getShareText().email
    const subjectEncoded = encodeURIComponent(subject)
    const bodyEncoded = encodeURIComponent(body)
    window.location.href = `mailto:?subject=${subjectEncoded}&body=${bodyEncoded}`
    trackShare('email')
  }

  // 追踪分享
  function trackShare(platform) {
    try {
      // 实际项目中发送到分析服务
      // fetch('/api/track', { method: 'POST', body: JSON.stringify({ type: 'share', platform }) })
      console.log('Share tracked:', platform)
    } catch (e) {
      // 静默失败
    }
  }

  // 处理推荐点击（当用户通过推荐链接访问时）
  function processReferralClick() {
    const params = new URLSearchParams(window.location.search)
    const ref = params.get('ref')
    
    if (ref && ref !== userId) {
      // 保存推荐来源
      localStorage.setItem('referred_by', ref)
      localStorage.setItem('referred_at', Date.now().toString())
      
      // 增加推荐人的点击数
      const clickKey = `referral_clicks_${ref}`
      const clicks = parseInt(localStorage.getItem(clickKey) || '0') + 1
      localStorage.setItem(clickKey, clicks.toString())
      
      // 追踪
      trackEvent('referral_click', { referrer: ref })
    }
  }

  // 获取推荐来源信息
  function getReferralSource() {
    const referredBy = localStorage.getItem('referred_by')
    const referredAt = localStorage.getItem('referred_at')
    
    if (!referredBy) return null
    
    return {
      referrer: referredBy,
      timestamp: referredAt ? parseInt(referredAt) : null,
      isRecent: referredAt && (Date.now() - parseInt(referredAt)) < 7 * 24 * 60 * 60 * 1000 // 7天内
    }
  }

  // 追踪事件
  function trackEvent(event, data = {}) {
    try {
      // 实际项目中发送到分析服务
      console.log('Track event:', event, data)
    } catch (e) {
      // 静默失败
    }
  }

  // 生成推广素材（图片/二维码）
  function generatePromoAssets() {
    return {
      banner: '/promo-banner.png',
      qrcode: '/qrcode.png',
      shareImages: [
        '/share-wechat.jpg',
        '/share-linkedin.jpg'
      ]
    }
  }

  return {
    userId,
    getReferralLink,
    getStats,
    addInvite,
    checkRewards,
    getShareText,
    shareToWechat,
    shareToLinkedIn,
    shareToTwitter,
    shareViaEmail,
    processReferralClick,
    getReferralSource,
    generatePromoAssets,
    REFERRAL_REWARDS
  }
}

export default useReferralSystem
