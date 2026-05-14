/**
 * 自动化邮件序列系统
 * 用户生命周期自动化：注册 → 激活 → 留存 → 推荐
 */

// 邮件序列配置
const EMAIL_SEQUENCES = {
  // 新用户引导序列（注册后）
  welcome: {
    id: 'welcome',
    name: '新用户引导',
    emails: [
      {
        delay: 0, // 注册后立即发送
        subject: '欢迎使用 ColdMail AI！🚀 3步开始你的第一封开发信',
        template: 'welcome_day0'
      },
      {
        delay: 1, // 1天后
        subject: '💡 一个小技巧，让你的邮件回复率提升 3 倍',
        template: 'welcome_day1'
      },
      {
        delay: 3, // 3天后
        subject: 'Pro 用户的 5 个最佳实践，送给你',
        template: 'welcome_day3'
      },
      {
        delay: 7, // 7天后
        subject: '你的第一周使用情况 & 隐藏功能揭秘',
        template: 'welcome_day7'
      }
    ]
  },

  // 免费用户升级序列
  upgrade: {
    id: 'upgrade',
    name: '升级引导',
    trigger: 'free_user', // 触发条件：免费用户
    emails: [
      {
        delay: 0,
        subject: '🔒 发现你还没解锁的功能',
        template: 'upgrade_day0'
      },
      {
        delay: 2,
        subject: '【限时】为什么 1000+ 外贸人选择升级 Pro',
        template: 'upgrade_day2'
      },
      {
        delay: 5,
        subject: '多语言功能让你的市场扩大 6 倍',
        template: 'upgrade_day5'
      },
      {
        delay: 10,
        subject: '🎁 专属优惠：给你的最后机会',
        template: 'upgrade_day10'
      }
    ]
  },

  // 试用到期提醒序列
  trialEnding: {
    id: 'trial_ending',
    name: '试用到期提醒',
    trigger: 'trial_expiring',
    emails: [
      {
        delay: -3, // 到期前3天
        subject: '⏰ 你的 Pro 体验即将结束',
        template: 'trial_ending_3d'
      },
      {
        delay: -1, // 到期前1天
        subject: '🔥 最后机会：保存你的 Pro 设置',
        template: 'trial_ending_1d'
      },
      {
        delay: 0, // 到期当天
        subject: '你的 Pro 已到期，但机会还在',
        template: 'trial_expired'
      }
    ]
  },

  // 续费提醒序列
  renewal: {
    id: 'renewal',
    name: '续费提醒',
    trigger: 'subscription_expiring',
    emails: [
      {
        delay: -7, // 到期前7天
        subject: '📅 续费提醒：你的订阅将于一周后到期',
        template: 'renewal_7d'
      },
      {
        delay: -3, // 到期前3天
        subject: '⏳ 订阅即将到期，别丢失这些功能',
        template: 'renewal_3d'
      },
      {
        delay: -1, // 到期前1天
        subject: '🔥 最后 24 小时：续费立享 9 折',
        template: 'renewal_1d'
      }
    ]
  },

  // 沉睡用户唤醒序列
  reEngage: {
    id: 're_engage',
    name: '沉睡唤醒',
    trigger: 'inactive_days', // 触发条件：超过N天未使用
    condition: { inactiveDays: 14 },
    emails: [
      {
        delay: 0,
        subject: '👋 我们想你了，有新功能你想试试吗？',
        template: 'reengage_day0'
      },
      {
        delay: 3,
        subject: '🎁 送你一个专属优惠，回来看看吧',
        template: 'reengage_day3'
      },
      {
        delay: 7,
        subject: '重要更新 | 这些新功能可能会改变你的工作方式',
        template: 'reengage_day7'
      }
    ]
  },

  // 推荐奖励序列
  referral: {
    id: 'referral',
    name: '推荐奖励',
    trigger: 'new_referral', // 触发条件：新推荐
    emails: [
      {
        delay: 0,
        subject: '🎉 有人使用了你的推荐链接！',
        template: 'referral_signup'
      },
      {
        delay: 14, // 推荐人付费后14天
        subject: '🎁 恭喜！你获得了 {{months}} 个月 Pro 会员',
        template: 'referral_converted'
      }
    ]
  }
}

// 邮件模板
const EMAIL_TEMPLATES = {
  welcome_day0: {
    subject: '欢迎使用 ColdMail AI！🚀 3步开始你的第一封开发信',
    body: `
      <h2>你好！</h2>
      <p>欢迎加入 ColdMail AI！🎉</p>
      <p>3 步开始你的第一封开发信：</p>
      <ol>
        <li>📝 在输入框描述你的产品和市场</li>
        <li>🌍 选择目标语言（英语、法语等）</li>
        <li>🚀 点击生成，获取多封专业开发信</li>
      </ol>
      <p><strong>小贴士：</strong>免费版每天可生成 3 封英文邮件，建议先体验不同风格。</p>
      <p>有问题？回复这封邮件即可联系我们。</p>
      <p>祝开发信大卖！<br>ColdMail AI 团队</p>
    `
  },

  welcome_day1: {
    subject: '💡 一个小技巧，让你的邮件回复率提升 3 倍',
    body: `
      <h2>昨天的技巧还记得吗？</h2>
      <p>今天分享一个实战技巧：</p>
      <blockquote>
        <strong>在描述需求时，越具体越好。</strong><br>
        ❌ "我想联系美国客户"<br>
        ✅ "我是做机械出口的，想联系美国德州的大型分销商，介绍我们的挖掘机产品"
      </blockquote>
      <p>越具体的描述，AI 生成的邮件越个性化，回复率越高。</p>
      <p>试试看？ → <a href="{{app_url}}">开始生成</a></p>
    `
  },

  upgrade_day0: {
    subject: '🔒 发现你还没解锁的功能',
    body: `
      <h2>嗨，升级后解锁这些功能</h2>
      <p>作为 Pro 用户，你可以：</p>
      <ul>
        <li>✅ <strong>无限量生成</strong> - 不再限制每天 3 封</li>
        <li>✅ <strong>6 种语言</strong> - 法语、阿拉伯语、西班牙语、俄语、葡萄牙语</li>
        <li>✅ <strong>邮件评分系统</strong> - 5 维度分析，提升转化</li>
        <li>✅ <strong>Chrome 扩展</strong> - 直接在 LinkedIn 上使用</li>
      </ul>
      <p>只需 ¥49/月（年付更优惠，仅 ¥33/月）</p>
      <p><a href="{{upgrade_url}}">立即升级 →</a></p>
    `
  },

  trial_ending_3d: {
    subject: '⏰ 你的 Pro 体验即将结束',
    body: `
      <h2>还有 3 天，你的 Pro 到期</h2>
      <p>到期后，你的设置和历史记录会保留，但以下功能将受限：</p>
      <ul>
        <li>每天只能生成 3 封邮件</li>
        <li>仅支持英语</li>
        <li>无法使用邮件评分功能</li>
      </ul>
      <p>继续享受无限量和多语言？</p>
      <p><a href="{{upgrade_url}}">续费 Pro →</a></p>
    `
  },

  reengage_day0: {
    subject: '👋 我们想你了，有新功能你想试试吗？',
    body: `
      <h2>嗨，好久不见！</h2>
      <p>注意到你已经有一段时间没用 ColdMail AI 了。</p>
      <p>最近我们更新了：</p>
      <ul>
        <li>✨ 新的邮件评分系统</li>
        <li>✨ 阿拉伯语支持（RTTL）</li>
        <li>✨ Chrome 扩展 Beta</li>
      </ul>
      <p>回来看看？这次我们准备了一份小礼物。</p>
      <p><a href="{{app_url}}">打开 ColdMail AI</a></p>
    `
  },

  referral_signup: {
    subject: '🎉 有人使用了你的推荐链接！',
    body: `
      <h2>太棒了！</h2>
      <p>有人刚使用了你的推荐链接注册了 ColdMail AI。</p>
      <p>当他们付费时，你将获得 <strong>1 个月 Pro 会员</strong>！</p>
      <p>继续分享，增加收益：</p>
      <p><a href="{{referral_url}}">查看推荐链接</a></p>
    `
  },

  referral_converted: {
    subject: '🎁 恭喜！你获得了 {{months}} 个月 Pro 会员',
    body: `
      <h2>太棒了！</h2>
      <p>你推荐的好友已成功升级 Pro，你获得了 <strong>{{months}} 个月</strong> Pro 会员奖励！</p>
      <p>奖励已自动添加到你的账户。</p>
      <p>继续分享，还有更多奖励：</p>
      <ul>
        <li>邀请 5 人付费 → 获得 1 年 Pro</li>
        <li>邀请 10 人付费 → 获得 2 年 Pro</li>
      </ul>
      <p><a href="{{referral_url}}">查看推荐状态</a></p>
    `
  }
}

export function useEmailAutomation() {
  const STORAGE_KEY = 'coldmail_email_sequence'
  const USER_KEY = 'coldmail_user_email'

  // 初始化邮件追踪
  function initTracking(email) {
    if (!email) return
    
    localStorage.setItem(USER_KEY, email)
    const tracking = getTrackingData()
    
    if (!tracking.email) {
      tracking.email = email
      tracking.subscribedAt = Date.now()
      tracking.sequences = {}
      saveTrackingData(tracking)
      
      // 触发欢迎序列
      enrollInSequence('welcome')
    }
  }

  // 获取追踪数据
  function getTrackingData() {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      return data ? JSON.parse(data) : {}
    } catch {
      return {}
    }
  }

  // 保存追踪数据
  function saveTrackingData(data) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
  }

  // 注册序列
  function enrollInSequence(sequenceId) {
    const sequence = EMAIL_SEQUENCES[sequenceId]
    if (!sequence) return

    const tracking = getTrackingData()
    if (!tracking.sequences) tracking.sequences = {}
    
    const now = Date.now()
    
    tracking.sequences[sequenceId] = {
      enrolledAt: now,
      lastEmailAt: null,
      emails: sequence.emails.map(email => ({
        ...email,
        scheduledAt: now + email.delay * 24 * 60 * 60 * 1000,
        sent: false
      }))
    }
    
    saveTrackingData(tracking)
    return tracking.sequences[sequenceId]
  }

  // 检查并触发序列
  function checkAndTriggerSequences(userState) {
    const tracking = getTrackingData()
    const now = Date.now()

    // 检查沉睡用户唤醒序列
    if (userState.lastActive) {
      const inactiveDays = (now - userState.lastActive) / (24 * 60 * 60 * 1000)
      if (inactiveDays >= 14 && !tracking.sequences.re_engage) {
        enrollInSequence('re_engage')
      }
    }

    // 检查试用/订阅到期
    if (userState.expiresAt) {
      const daysUntilExpiry = (userState.expiresAt - now) / (24 * 60 * 60 * 1000)
      
      if (userState.isTrial && daysUntilExpiry <= 3 && daysUntilExpiry > 0) {
        enrollInSequence('trialEnding')
      }
      
      if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
        enrollInSequence('renewal')
      }
    }

    // 检查免费用户
    if (userState.isFree && !tracking.sequences.upgrade) {
      enrollInSequence('upgrade')
    }
  }

  // 获取待发送邮件
  function getPendingEmails() {
    const tracking = getTrackingData()
    const now = Date.now()
    const pending = []

    if (!tracking.sequences) return pending

    for (const [seqId, sequence] of Object.entries(tracking.sequences)) {
      for (const email of sequence.emails) {
        if (!email.sent && email.scheduledAt <= now) {
          pending.push({
            ...email,
            sequenceId: seqId
          })
        }
      }
    }

    return pending
  }

  // 标记邮件已发送
  function markEmailSent(sequenceId, emailIndex) {
    const tracking = getTrackingData()
    if (tracking.sequences && tracking.sequences[sequenceId]) {
      tracking.sequences[sequenceId].emails[emailIndex].sent = true
      tracking.sequences[sequenceId].lastEmailAt = Date.now()
      saveTrackingData(tracking)
    }
  }

  // 生成邮件内容
  function generateEmailContent(templateId, vars = {}) {
    const template = EMAIL_TEMPLATES[templateId]
    if (!template) return null

    let subject = template.subject
    let body = template.body

    // 替换变量
    for (const [key, value] of Object.entries(vars)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value)
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    // 替换通用变量
    const replacements = {
      app_url: 'https://iguoxing.github.io/cold-email-writer/',
      upgrade_url: 'https://iguoxing.github.io/cold-email-writer/?tab=pricing',
      referral_url: 'https://iguoxing.github.io/cold-email-writer/?tab=referral'
    }

    for (const [key, value] of Object.entries(replacements)) {
      subject = subject.replace(new RegExp(`{{${key}}}`, 'g'), value)
      body = body.replace(new RegExp(`{{${key}}}`, 'g'), value)
    }

    return { subject, body }
  }

  // 追踪邮件打开
  function trackEmailOpen(sequenceId, emailIndex) {
    // 实际项目中，这里会调用 API 记录打开
    console.log('Email opened:', sequenceId, emailIndex)
  }

  // 追踪邮件点击
  function trackEmailClick(sequenceId, emailIndex, linkId) {
    console.log('Email clicked:', sequenceId, emailIndex, linkId)
  }

  return {
    initTracking,
    enrollInSequence,
    checkAndTriggerSequences,
    getPendingEmails,
    markEmailSent,
    generateEmailContent,
    trackEmailOpen,
    trackEmailClick,
    EMAIL_SEQUENCES,
    EMAIL_TEMPLATES
  }
}

export default useEmailAutomation
