const SPAM_KEYWORDS = [
  'free', 'guaranteed', 'no obligation', 'act now', 'limited time',
  'cash', 'money', 'income', 'earn extra', 'work from home',
  'buy now', 'order now', 'click here', 'urgent', 'important',
  'congratulations', 'winner', 'prize', '!!!',
  'best price', 'cheapest', 'discount', 'promotion', 'offer',
  '100%', 'no risk', 'risk free', 'special offer', 'limited offer'
]

export function useSpamDetector() {
  // 垃圾邮件检测
  const analyzeSpam = (text) => {
    const lower = text.toLowerCase()
    let score = 0
    const flags = []

    SPAM_KEYWORDS.forEach(word => {
      if (lower.includes(word)) {
        score += 8
        flags.push(`含垃圾邮件词汇: "${word}"`)
      }
    })

    const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1)
    if (capsRatio > 0.3) {
      score += 15
      flags.push('过多大写字母')
    }

    const exclCount = (text.match(/!/g) || []).length
    if (exclCount > 2) {
      score += exclCount * 3
      flags.push(`过多感叹号 (${exclCount}个)`)
    }

    if (text.length > 800) {
      score += 10
      flags.push('正文过长（>800字符）')
    } else if (text.length < 100) {
      score += 5
      flags.push('正文过短（<100字符）')
    }

    if (text.includes('http') || text.includes('www.')) {
      score += 20
      flags.push('包含链接（开发信中建议避免）')
    }

    score = Math.min(score, 100)

    let riskLevel, analysis
    if (score <= 20) {
      riskLevel = 'low'
      analysis = `低风险（${score}分）：此邮件不太可能被标记为垃圾邮件。`
    } else if (score <= 50) {
      riskLevel = 'medium'
      analysis = `中风险（${score}分）：建议修改：${flags.join('; ')}`
    } else {
      riskLevel = 'high'
      analysis = `高风险（${score}分）：极易被标记为垃圾邮件！请修改：${flags.join('; ')}`
    }

    return { score, riskLevel, analysis, flags }
  }

  // 综合邮件评分（扩展版）
  const scoreEmail = (subject, body, { industry = '', targetRole = '', style = 'direct' } = {}) => {
    const fullText = subject + ' ' + body

    // 1. 垃圾邮件风险（0-100，越高越差）
    const spamResult = analyzeSpam(fullText)
    const spamScore = 100 - spamResult.score // 反转为正向分

    // 2. 个性化程度（0-100）
    let personalScore = 40 // 基础分
    const lowerBody = body.toLowerCase()
    const lowerSubject = subject.toLowerCase()

    // 包含行业关键词
    if (industry && (lowerBody.includes(industry.toLowerCase()) || lowerSubject.includes(industry.toLowerCase()))) {
      personalScore += 20
    }
    // 包含角色关键词
    if (targetRole && (lowerBody.includes(targetRole.toLowerCase()) || lowerSubject.includes(targetRole.toLowerCase()))) {
      personalScore += 15
    }
    // 包含占位符 [Name] 等
    if (lowerBody.includes('[name]') || lowerBody.includes('[company]')) {
      personalScore -= 10
    }
    // 包含具体数字/数据
    if (/\d+%/.test(body) || /\d+\+/.test(body)) {
      personalScore += 15
    }
    personalScore = Math.max(0, Math.min(100, personalScore))

    // 3. CTA 清晰度（0-100）
    let ctaScore = 30 // 基础分
    const ctaPatterns = [
      /would you (be )?(like|open|interested|available)/i,
      /can we (schedule|set up|arrange)/i,
      /let'?s (connect|chat|discuss|set up)/i,
      /i'?d love to (share|discuss|show|chat)/i,
      /feel free to/i,
      /looking forward to/i,
      /hope to (hear|connect|speak)/i,
    ]
    ctaPatterns.forEach(p => {
      if (p.test(body)) ctaScore += 15
    })
    // 问句结尾加分
    if (/\?\s*$/.test(body.trim())) ctaScore += 10
    ctaScore = Math.max(0, Math.min(100, ctaScore))

    // 4. 语气匹配度（0-100）
    let toneScore = 60
    if (style === 'direct') {
      // 直接型：短句多、少废话
      const sentences = body.split(/[.!?]+/).filter(s => s.trim())
      const avgLen = sentences.reduce((sum, s) => sum + s.trim().split(/\s+/).length, 0) / Math.max(sentences.length, 1)
      if (avgLen <= 15) toneScore += 20
      if (body.split('\n').length <= 5) toneScore += 10
    } else if (style === 'friendly') {
      // 友好型：问候、感叹
      if (/hope|great|wonderful|impressed/i.test(body)) toneScore += 20
      if (/warmly|best regards|cheers/i.test(body)) toneScore += 10
    } else if (style === 'value') {
      // 价值型：数据、痛点、方案
      if (/\d+%|\$\d+|\d+x/i.test(body)) toneScore += 20
      if (/challenge|pain point|solution|help/i.test(body)) toneScore += 10
    }
    toneScore = Math.max(0, Math.min(100, toneScore))

    // 5. 长度适宜度（0-100）
    const wordCount = body.split(/\s+/).length
    let lengthScore = 50
    if (wordCount >= 50 && wordCount <= 150) lengthScore = 90
    else if (wordCount >= 30 && wordCount <= 200) lengthScore = 70
    else if (wordCount < 30) lengthScore = 30
    else lengthScore = 40

    // 综合评分
    const totalScore = Math.round(
      spamScore * 0.25 +
      personalScore * 0.20 +
      ctaScore * 0.25 +
      toneScore * 0.15 +
      lengthScore * 0.15
    )

    return {
      total: totalScore,
      spam: spamScore,
      personal: personalScore,
      cta: ctaScore,
      tone: toneScore,
      length: lengthScore,
      spamDetails: spamResult,
      grade: totalScore >= 80 ? 'A' : totalScore >= 65 ? 'B' : totalScore >= 50 ? 'C' : 'D'
    }
  }

  return { analyzeSpam, scoreEmail, SPAM_KEYWORDS }
}
