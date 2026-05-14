// ColdMail AI - Background Service Worker

// 监听来自 popup 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'GENERATE_EMAIL') {
    handleGenerateEmail(message.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true // 异步响应
  }

  if (message.type === 'CHECK_USAGE') {
    handleCheckUsage()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.type === 'INCREMENT_USAGE') {
    handleIncrementUsage()
      .then(count => sendResponse({ success: true, data: { count } }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.type === 'ACTIVATE_PRO') {
    handleActivatePro(message.code)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }

  if (message.type === 'TEST_API') {
    handleTestAPI(message.config)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(err => sendResponse({ success: false, error: err.message }))
    return true
  }
})

async function handleGenerateEmail(data) {
  const { style, input, industry, targetRole, targetLang, apiMode, apiKey, apiEndpoint } = data

  // 导入共享模块的函数（在 Service Worker 中通过 importScripts）
  const prompt = buildPromptLocal(style, input, industry, targetRole, targetLang)
  const output = await callAILocal(prompt, { apiMode, apiKey, apiEndpoint })
  const parsed = parseOutputLocal(output, industry)

  const fullText = parsed.subject + ' ' + parsed.body
  const spamResult = analyzeSpamLocal(fullText)

  return { ...parsed, spamResult, style }
}

async function handleCheckUsage() {
  const today = new Date().toISOString().split('T')[0]
  const result = await chrome.storage.local.get(['coldmail_usage', 'coldmail_pro_code'])
  const usage = result.coldmail_usage || { date: today, count: 0 }
  const isPro = !!(result.coldmail_pro_code && validateProCodeLocal(result.coldmail_pro_code))

  if (usage.date !== today) {
    usage.date = today
    usage.count = 0
    await chrome.storage.local.set({ coldmail_usage: usage })
  }

  return {
    isPro,
    count: usage.count,
    remaining: isPro ? 999 : Math.max(0, 3 - usage.count),
    canGenerate: isPro || usage.count < 3
  }
}

async function handleIncrementUsage() {
  const today = new Date().toISOString().split('T')[0]
  const result = await chrome.storage.local.get(['coldmail_usage'])
  const usage = result.coldmail_usage || { date: today, count: 0 }
  if (usage.date !== today) { usage.date = today; usage.count = 0 }
  usage.count++
  await chrome.storage.local.set({ coldmail_usage: usage })
  return usage.count
}

async function handleActivatePro(code) {
  if (validateProCodeLocal(code)) {
    await chrome.storage.local.set({ coldmail_pro_code: code })
    return { success: true, msg: '激活成功！' }
  }
  return { success: false, msg: '激活码无效' }
}

async function handleTestAPI(config) {
  const { apiMode, apiKey, apiEndpoint } = config
  try {
    if (apiMode === 'pollinations') {
      const res = await fetch('https://text.pollinations.ai/' + encodeURIComponent('Reply: OK') + '?model=openai')
      return { success: res.ok, msg: res.ok ? '连接成功' : `错误 ${res.status}` }
    }
    if (apiMode === 'free') {
      if (!apiKey) return { success: false, msg: '请填入 API Key' }
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: 'Reply: OK' }] }], generationConfig: { maxOutputTokens: 10 } })
      })
      return { success: res.ok, msg: res.ok ? 'Gemini 连接成功' : `错误 ${res.status}` }
    }
    return { success: false, msg: '未配置' }
  } catch (err) {
    return { success: false, msg: err.message }
  }
}

// === 本地函数（因为 Service Worker 无法 importScripts 远程文件）===

const VALID_CODES = ['COLDMAIL-PRO-2025', 'COLDMAIL-LAUNCH', 'COLDMAIL-BETA']
function validateProCodeLocal(code) { return VALID_CODES.includes(code) }

const SPAM_KEYWORDS = ['free','guaranteed','no obligation','act now','limited time','cash','money','income','earn extra','work from home','buy now','order now','click here','urgent','important','congratulations','winner','prize','!!!','best price','cheapest','discount','promotion','offer','100%','no risk','risk free','special offer','limited offer']

function analyzeSpamLocal(text) {
  const lower = text.toLowerCase()
  let score = 0
  const flags = []
  SPAM_KEYWORDS.forEach(w => { if (lower.includes(w)) { score += 8; flags.push(w) } })
  if ((text.match(/[A-Z]/g)||[]).length / Math.max(text.length,1) > 0.3) { score += 15; flags.push('CAPS') }
  const excl = (text.match(/!/g)||[]).length; if (excl > 2) { score += excl * 3; flags.push('excl') }
  if (text.length > 800) score += 10; if (text.length < 100) score += 5
  if (text.includes('http') || text.includes('www.')) { score += 20; flags.push('links') }
  score = Math.min(score, 100)
  return { score, riskLevel: score <= 20 ? 'low' : score <= 50 ? 'medium' : 'high', flags }
}

const LANG_NAMES = { en: 'English', fr: 'Français', ar: 'العربية', es: 'Español', ru: 'Русский', pt: 'Português' }

function buildPromptLocal(style, input, industry, role, lang) {
  const styles = {
    direct: '直接高效型：开门见山，快速说明价值，邮件长度控制在100词以内。',
    friendly: '友好亲和型：以共同话题或赞美开头，自然过渡到商业话题，语气温暖。',
    value: '价值驱动型：以对方痛点或行业趋势切入，展示专业知识，引导回复。'
  }
  const langInstr = lang === 'en' ? 'Use English.' : `Generate in ${LANG_NAMES[lang] || lang}.`
  return `You are a professional B2B cold email expert. Generate a high-conversion outreach message.\nTarget style: ${styles[style]}\n${langInstr}\nChinese requirement: ${input}\nTarget industry: ${industry || 'General'}\nTarget role: ${role || 'Business decision maker'}\n\nOutput format (output ONLY the following, no extra text):\nSUBJECT: [subject line, max 60 chars, avoid spam words]\nBODY:\n[body text, 3-5 sentences, personalized, with clear CTA]\n\nRequirements:\n1. No spam words\n2. Personalized\n3. Clear but soft CTA\n4. Max 150 words total`
}

function parseOutputLocal(output, industry) {
  const s = output.match(/SUBJECT:\s*(.+)/i)
  const b = output.match(/BODY:\s*([\s\S]+)/i)
  return {
    subject: s ? s[1].trim() : `Partnership - ${industry || 'Business'}`,
    body: b ? b[1].trim() : output.replace(/SUBJECT:.*\n?/i, '').trim()
  }
}

async function callAILocal(prompt, config) {
  const { apiMode, apiKey, apiEndpoint } = config
  if (apiMode === 'pollinations') {
    const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai'
    const res = await fetch(url)
    if (!res.ok) throw new Error(`API 错误 ${res.status}`)
    return await res.text()
  }
  if (apiMode === 'free') {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { temperature: 0.8, maxOutputTokens: 1024 } })
    })
    if (!res.ok) throw new Error(`Gemini 错误 ${res.status}`)
    const data = await res.json()
    return data.candidates?.[0]?.content?.parts?.[0]?.text || ''
  }
  // 默认回退
  const url = 'https://text.pollinations.ai/' + encodeURIComponent(prompt) + '?model=openai'
  const res = await fetch(url)
  if (!res.ok) throw new Error(`API 错误 ${res.status}`)
  return await res.text()
}
