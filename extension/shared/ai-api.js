// ColdMail AI - Shared AI API Module (Chrome Extension compatible)

const POLLINATIONS_URL = 'https://text.pollinations.ai/'
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

// 调用 Pollinations.ai
async function callPollinations(prompt) {
  const url = POLLINATIONS_URL + encodeURIComponent(prompt) + '?model=openai'
  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 429) throw new Error('请求过于频繁，请稍等几秒后重试')
    throw new Error(`Pollinations API 错误 ${res.status}`)
  }
  return await res.text()
}

// 调用 Gemini API
async function callGemini(prompt, apiKey) {
  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`
  const body = {
    contents: [{ parts: [{ text: prompt }] }],
    generationConfig: { temperature: 0.8, maxOutputTokens: 1024 }
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}))
    const errMsg = JSON.stringify(errBody)
    if (errMsg.includes('quota') || errMsg.includes('Quota exceeded')) {
      throw new Error('Gemini API 额度已用完，请更换 API Key 或切换到免费模式。')
    }
    throw new Error(`Gemini API 错误 ${res.status}`)
  }

  const data = await res.json()
  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    throw new Error('Gemini 返回格式异常')
  }
  return data.candidates[0].content.parts[0].text
}

// 调用 OpenAI 兼容 API
async function callOpenAI(prompt, endpoint, apiKey) {
  const body = {
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.8,
  }
  const headers = { 'Content-Type': 'application/json' }
  if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`API 错误 ${res.status}`)
  const data = await res.json()
  return data.choices[0].message.content
}

// 统一调用入口
async function callAI(prompt, config) {
  const { apiMode, apiKey, apiEndpoint } = config
  if (apiMode === 'pollinations') return callPollinations(prompt)
  if (apiMode === 'free') {
    if (!apiKey) throw new Error('请先配置 Gemini API Key')
    return callGemini(prompt, apiKey)
  }
  if (apiMode === 'custom' && apiEndpoint) return callOpenAI(prompt, apiEndpoint, apiKey)
  return callPollinations(prompt) // 默认回退到免费模式
}

// 垃圾邮件检测
const SPAM_KEYWORDS = [
  'free', 'guaranteed', 'no obligation', 'act now', 'limited time',
  'cash', 'money', 'income', 'earn extra', 'work from home',
  'buy now', 'order now', 'click here', 'urgent', 'important',
  'congratulations', 'winner', 'prize', '!!!',
  'best price', 'cheapest', 'discount', 'promotion', 'offer',
  '100%', 'no risk', 'risk free', 'special offer', 'limited offer'
]

function analyzeSpam(text) {
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
  if (capsRatio > 0.3) { score += 15; flags.push('过多大写字母') }

  const exclCount = (text.match(/!/g) || []).length
  if (exclCount > 2) { score += exclCount * 3; flags.push(`过多感叹号 (${exclCount}个)`) }

  if (text.length > 800) { score += 10; flags.push('正文过长') }
  else if (text.length < 100) { score += 5; flags.push('正文过短') }

  if (text.includes('http') || text.includes('www.')) { score += 20; flags.push('包含链接') }

  score = Math.min(score, 100)

  let riskLevel
  if (score <= 20) riskLevel = 'low'
  else if (score <= 50) riskLevel = 'medium'
  else riskLevel = 'high'

  return { score, riskLevel, analysis: `风险${score}分`, flags }
}

// 语言名称映射
const LANG_NAMES = {
  en: 'English', fr: 'Français', ar: 'العربية', es: 'Español', ru: 'Русский', pt: 'Português'
}

// 生成邮件 prompt
function buildPrompt(style, input, industry, role, lang) {
  const stylePrompts = {
    direct: '直接高效型：开门见山，快速说明价值，尊重对方时间，邮件长度控制在100词以内。',
    friendly: '友好亲和型：以共同话题或赞美开头，建立人际关系，自然过渡到商业话题，语气温暖。',
    value: '价值驱动型：以对方痛点或行业趋势切入，展示专业知识，提供明确价值主张，引导回复。'
  }

  const langInstruction = lang === 'en'
    ? 'Use English.'
    : `Generate the email in ${LANG_NAMES[lang] || lang}.`
  const rtlNote = lang === 'ar' ? ' Note: Arabic is RTL, structure accordingly.' : ''

  return `You are a professional B2B cold email expert for international trade. Generate a high-conversion outreach message.

Target style: ${stylePrompts[style]}
${langInstruction}${rtlNote}

Chinese requirement: ${input}
Target industry: ${industry || 'General'}
Target role: ${role || 'Business decision maker'}

Output format (output ONLY the following, no extra text):
SUBJECT: [subject line, max 60 chars, avoid spam words]
BODY:
[body text, 3-5 sentences, personalized, with clear CTA]

Requirements:
1. No spam words (free, guarantee, !!!, etc.)
2. Personalized, mention their company or industry
3. Clear but soft CTA
4. Max 150 words total
5. Professional and respectful tone`
}

// 解析 AI 输出
function parseAIOutput(output, industry) {
  const subjectMatch = output.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = output.match(/BODY:\s*([\s\S]+)/i)

  let subject = subjectMatch ? subjectMatch[1].trim() : `Partnership Opportunity - ${industry || 'Business'}`
  let body = bodyMatch ? bodyMatch[1].trim() : output.replace(/SUBJECT:.*\n?/i, '').trim()

  return { subject, body }
}

// Pro 激活码验证
const VALID_CODES = ['COLDMAIL-PRO-2025', 'COLDMAIL-LAUNCH', 'COLDMAIL-BETA']

function validateProCode(code) {
  return VALID_CODES.includes(code)
}

// 用量管理
const FREE_DAILY_LIMIT = 3

function getTodayUsage() {
  return new Date().toISOString().split('T')[0]
}

async function checkUsage() {
  const today = getTodayUsage()
  const result = await chrome.storage.local.get(['coldmail_usage', 'coldmail_pro_code'])
  const usage = result.coldmail_usage || { date: today, count: 0 }
  const isPro = result.coldmail_pro_code && validateProCode(result.coldmail_pro_code)

  if (usage.date !== today) {
    usage.date = today
    usage.count = 0
    await chrome.storage.local.set({ coldmail_usage: usage })
  }

  return {
    isPro,
    count: usage.count,
    remaining: isPro ? Infinity : Math.max(0, FREE_DAILY_LIMIT - usage.count),
    canGenerate: isPro || usage.count < FREE_DAILY_LIMIT
  }
}

async function incrementUsage() {
  const today = getTodayUsage()
  const result = await chrome.storage.local.get(['coldmail_usage'])
  const usage = result.coldmail_usage || { date: today, count: 0 }
  if (usage.date !== today) { usage.date = today; usage.count = 0 }
  usage.count++
  await chrome.storage.local.set({ coldmail_usage: usage })
  return usage.count
}
