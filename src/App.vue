<template>
  <div class="app" :class="{ 'has-nav': activePage !== 'pricing' && activePage !== 'landing' }">
    <!-- 导航栏（隐藏 LandingPage 时显示） -->
    <nav v-if="activePage !== 'landing'" class="nav">
      <div class="nav-inner">
        <span class="nav-logo" @click="activePage = 'writer'">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="#0a66c2"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
          ColdMail AI
        </span>
        <div class="nav-tabs">
          <button class="nav-tab" :class="{active: activePage==='writer'}" @click="activePage='writer'">✉️ 生成邮件</button>
          <button class="nav-tab" :class="{active: activePage==='history'}" @click="activePage='history'">📜 历史记录</button>
          <button class="nav-tab" :class="{active: activePage==='pricing'}" @click="activePage='pricing'">💎 定价</button>
        </div>
        <div class="nav-usage" v-if="activePage==='writer'">
          <span v-if="isPro" class="pro-badge">PRO</span>
          <span v-else class="free-badge">今日: {{ todayUsage }}/{{ freeLimit }}</span>
        </div>
      </div>
    </nav>

    <!-- LandingPage 落地页 -->
    <LandingPage
      v-if="activePage === 'landing'"
      @startFree="startWriting"
      @upgrade="activePage = 'pricing'"
    />

    <!-- 邮件生成页 -->
    <main v-if="activePage==='writer'" class="main">
      <div class="writer-container">
        <h1 class="page-title">AI 驱动的外贸开发信生成器</h1>
        <p class="page-subtitle">输入中文需求，AI 自动生成多语言高转化率开发信，附带评分和垃圾邮件检测</p>

        <!-- API 设置区 -->
        <details class="api-settings">
          <summary>⚙️ AI 接口设置（默认免费，开箱即用）</summary>
          <div class="api-panel-content">
            <div class="api-tabs">
              <button class="api-tab" :class="{active: apiMode==='pollinations'}" @click="apiMode='pollinations'">🤖 免费 AI</button>
              <button class="api-tab" :class="{active: apiMode==='free'}" @click="apiMode='free'">🔑 Gemini</button>
              <button class="api-tab" :class="{active: apiMode==='custom'}" @click="apiMode='custom'">⚙️ 自定义 API</button>
            </div>

            <div v-if="apiMode==='pollinations'" class="api-info success">
              ✅ 使用 Pollinations.ai 免费 AI，无需 API Key，开箱即用。
            </div>

            <div v-if="apiMode==='free'" class="api-config">
              <div class="api-row">
                <input v-model="apiKey" type="password" placeholder="粘贴 Gemini API Key（AIza...）" />
                <button class="btn-test" @click="testAPI">测试</button>
              </div>
              <p class="api-hint">免费获取：<a href="https://aistudio.google.com/apikey" target="_blank">Google AI Studio</a>，无需信用卡</p>
            </div>

            <div v-if="apiMode==='custom'" class="api-config">
              <div class="api-row">
                <input v-model="apiEndpoint" placeholder="API Endpoint（OpenAI 兼容格式）" />
                <input v-model="apiKey" type="password" placeholder="API Key（可选）" />
                <button class="btn-test" @click="testAPI">测试</button>
              </div>
            </div>

            <p v-if="apiStatus" :class="apiStatus.type" class="api-msg">{{ apiStatus.msg }}</p>
          </div>
        </details>

        <!-- 语言选择 -->
        <div class="form-section">
          <label>🌍 目标语言</label>
          <LanguageSelector v-model="targetLang" />
          <p v-if="!isPro && targetLang !== 'en'" class="lang-lock">
            🔒 多语言为 Pro 功能，<a href="#" @click.prevent="showPaywall=true">升级解锁</a>
          </p>
        </div>

        <!-- 输入区 -->
        <div class="form-section">
          <label>📝 中文开发信需求描述</label>
          <textarea v-model="chineseInput" placeholder="例：我是做机械出口的，想联系美国的大型分销商，介绍我们的产品和价格优势，希望他们回复..." rows="5"></textarea>

          <div class="options-row">
            <div class="option-group">
              <label>🎯 目标行业</label>
              <input v-model="industry" placeholder="如：机械设备、电子、纺织" />
            </div>
            <div class="option-group">
              <label>👤 目标角色</label>
              <input v-model="targetRole" placeholder="如：采购经理、CEO" />
            </div>
            <div class="option-group">
              <label>🎨 风格偏好</label>
              <select v-model="stylePref">
                <option value="balanced">均衡（3种风格）</option>
                <option value="direct">直接高效型为主</option>
                <option value="friendly">友好亲和型为主</option>
                <option value="value">价值驱动型为主</option>
              </select>
            </div>
          </div>

          <button class="btn-generate" @click="generateMessages" :disabled="!chineseInput.trim() || generating">
            <span v-if="generating" class="spinner"></span>
            {{ generating ? 'AI 生成中...' : '🚀 生成开发信' }}
          </button>
          <div class="usage-hint" v-if="!isPro">
            今日剩余: {{ remainingFree }}/{{ freeLimit }}
          </div>
        </div>

        <!-- 结果区 -->
        <div v-if="messages.length" class="results-section">
          <div class="results-header">
            <h3>📧 生成的开发信（{{ messages.length }} 种风格）</h3>
            <button class="btn-action btn-regen-all" @click="generateMessages" :disabled="generating">🔄 全部重新生成</button>
          </div>

          <div v-for="(msg, idx) in messages" :key="idx" class="message-card" :class="msg.riskLevel">
            <div class="card-header">
              <span class="style-badge" :class="msg.style">{{ styleLabel(msg.style) }}</span>
              <span class="risk-badge" :class="msg.spamResult.riskLevel">
                {{ riskLabel(msg.spamResult.riskLevel) }} · 垃圾风险 {{ msg.spamResult.score }}%
              </span>
            </div>

            <div class="message-content" :class="{ rtl: targetLang === 'ar' }">
              <div class="field">
                <label>主题行：</label>
                <div class="text-block">{{ msg.subject }}</div>
              </div>
              <div class="field">
                <label>正文：</label>
                <div class="text-block" v-html="formatBody(msg.body)"></div>
              </div>
            </div>

            <!-- 评分系统 -->
            <EmailScorer v-if="isPro || msg.emailScore" :score="msg.emailScore" />

            <div class="card-actions">
              <button class="btn-action" @click="copyMessage(msg)">📋 复制</button>
              <button class="btn-action" @click="regenerateOne(idx)">🔄 重新生成</button>
            </div>
          </div>
        </div>
      </div>
    </main>

    <!-- 历史记录页 -->
    <main v-if="activePage==='history'" class="main">
      <div class="history-container">
        <div class="history-header">
          <h2>📜 历史记录</h2>
          <button v-if="history.length" class="btn-clear" @click="clearHistory">清空</button>
        </div>
        <div v-if="!history.length" class="empty-state">
          <p>还没有生成记录，去生成第一封开发信吧！</p>
        </div>
        <div v-for="h in history" :key="h.id" class="history-item" @click="loadFromHistory(h)">
          <div class="history-main">
            <span class="history-preview">{{ h.input.slice(0, 80) }}{{ h.input.length > 80 ? '...' : '' }}</span>
            <div class="history-meta">
              <span class="history-lang">{{ h.targetLang?.toUpperCase() || 'EN' }}</span>
              <span class="history-style">{{ styleLabel(h.stylePref) }}</span>
            </div>
          </div>
          <div class="history-right">
            <span class="history-time">{{ h.time }}</span>
            <button class="btn-delete" @click.stop="deleteHistory(h.id)">🗑</button>
          </div>
        </div>
      </div>
    </main>

    <!-- 定价页 -->
    <main v-if="activePage==='pricing'" class="main">
      <PricingPage @showPaywall="showPaywall=true" />
    </main>

    <!-- 付费墙弹窗 -->
    <PaywallModal :show="showPaywall" @close="showPaywall=false" @activated="handleActivate" />

    <!-- Toast 提示 -->
    <div class="toast" v-if="showToast">{{ toastMsg }}</div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import LanguageSelector from './components/LanguageSelector.vue'
import EmailScorer from './components/EmailScorer.vue'
import PricingPage from './components/PricingPage.vue'
import PaywallModal from './components/PaywallModal.vue'
import LandingPage from './components/LandingPage.vue'
import { useAI } from './composables/useAI.js'
import { useSpamDetector } from './composables/useSpamDetector.js'
import { useEmailHistory } from './composables/useEmailHistory.js'
import { useUsageLimit } from './composables/useUsageLimit.js'
import analytics from './services/analytics.js'

// 页面状态
const activePage = ref('landing') // 默认显示落地页
const showPaywall = ref(false)
const toastMsg = ref('')
const showToast = ref(false)

// AI 配置
const { apiMode, apiKey, apiEndpoint, apiStatus, initAPIConfig, callAI, testAPI } = useAI()

// 评分
const { analyzeSpam, scoreEmail } = useSpamDetector()

// 历史记录
const { history, addRecord, deleteRecord: deleteHistory, clearHistory, restoreRecord } = useEmailHistory()

// 用量限制
const { isPro, todayUsage, canGenerate, remainingFree, freeLimit, incrementUsage, activatePro } = useUsageLimit()

// 表单数据
const chineseInput = ref('')
const industry = ref('')
const targetRole = ref('')
const targetLang = ref('en')
const stylePref = ref('balanced')
const generating = ref(false)
const messages = ref([])

// 初始化
onMounted(() => {
  initAPIConfig()
  // 页面浏览统计
  if (activePage.value === 'landing') {
    analytics.track('page_view', { page: 'landing' })
  }
})

const startWriting = () => {
  activePage.value = 'writer'
  analytics.track('cta_click', { cta: 'start_free' })
}

const styleLabel = (style) => {
  const map = { direct: '🎯 直接高效型', friendly: '🤝 友好亲和型', value: '💡 价值驱动型', balanced: '⚖️ 均衡' }
  return map[style] || style
}

const riskLabel = (level) => {
  const map = { low: '✅ 低风险', medium: '⚠️ 中风险', high: '🚨 高风险' }
  return map[level] || level
}

const escapeHtml = (str) => str
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')

const formatBody = (body) => {
  return escapeHtml(body)
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\n/g, '<br>')
}

// 语言名称映射
const langNames = {
  en: 'English', fr: 'Français', ar: 'العربية', es: 'Español', ru: 'Русский', pt: 'Português'
}

// 生成单条消息
const generateSingle = async (style, input, industryVal, roleVal, lang) => {
  const stylePrompt = {
    direct: '直接高效型：开门见山，快速说明价值，尊重对方时间，邮件长度控制在100词以内。',
    friendly: '友好亲和型：以共同话题或赞美开头，建立人际关系，自然过渡到商业话题，语气温暖。',
    value: '价值驱动型：以对方痛点或行业趋势切入，展示专业知识，提供明确价值主张，引导回复。'
  }

  const langInstruction = lang === 'en'
    ? 'Use English.'
    : `Generate the email in ${langNames[lang] || lang}. The email content must be in ${langNames[lang] || lang} language.`

  const rtlNote = lang === 'ar' ? ' Note: Arabic is RTL, structure accordingly.' : ''

  const prompt = `You are a professional B2B cold email expert for international trade. Generate a high-conversion outreach message.

Target style: ${stylePrompt[style]}
${langInstruction}${rtlNote}

Chinese requirement: ${input}
Target industry: ${industryVal || 'General'}
Target role: ${roleVal || 'Business decision maker'}

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

  const output = await callAI(prompt)

  const subjectMatch = output.match(/SUBJECT:\s*(.+)/i)
  const bodyMatch = output.match(/BODY:\s*([\s\S]+)/i)

  let subject = subjectMatch ? subjectMatch[1].trim() : `Partnership Opportunity - ${industryVal || 'Business'}`
  let body = bodyMatch ? bodyMatch[1].trim() : output.replace(/SUBJECT:.*\n?/i, '').trim()

  const fullText = subject + ' ' + body
  const spamResult = analyzeSpam(fullText)
  const emailScore = scoreEmail(subject, body, { industry: industryVal, targetRole: roleVal, style })

  return { style, subject, body, spamResult, emailScore }
}

// 主生成函数
const generateMessages = async () => {
  // 检查免费用户语言限制
  if (!isPro.value && targetLang.value !== 'en') {
    analytics.track('upgrade_trigger', { reason: 'multi_lang' })
    showPaywall.value = true
    return
  }

  // 检查用量
  if (!canGenerate.value) {
    analytics.track('upgrade_trigger', { reason: 'usage_limit' })
    showPaywall.value = true
    return
  }

  generating.value = true
  messages.value = []
  analytics.track('generate_start', { lang: targetLang.value, style: stylePref.value })

  try {
    let styles = []
    if (stylePref.value === 'balanced') {
      styles = ['direct', 'friendly', 'value']
    } else {
      styles = [stylePref.value, 'direct', 'friendly'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)
    }

    for (const style of styles) {
      const msg = await generateSingle(style, chineseInput.value, industry.value, targetRole.value, targetLang.value)
      messages.value.push(msg)
    }

    // 增加用量
    incrementUsage()

    // 保存历史
    addRecord({
      input: chineseInput.value,
      industry: industry.value,
      targetRole: targetRole.value,
      targetLang: targetLang.value,
      stylePref: stylePref.value,
      messages: JSON.parse(JSON.stringify(messages.value))
    })

    analytics.track('generate_success', {
      lang: targetLang.value,
      count: messages.value.length,
      styles: messages.value.map(m => m.style)
    })

  } catch (err) {
    analytics.track('generate_error', { error: err.message })
    toastMsg.value = '生成失败：' + err.message
    showToast.value = true
    setTimeout(() => showToast.value = false, 4000)
  } finally {
    generating.value = false
  }
}

// 重新生成单条
const regenerateOne = async (idx) => {
  if (!canGenerate.value) {
    analytics.track('upgrade_trigger', { reason: 'regenerate_limit' })
    showPaywall.value = true
    return
  }
  const msg = messages.value[idx]
  try {
    messages.value[idx] = await generateSingle(msg.style, chineseInput.value, industry.value, targetRole.value, targetLang.value)
    incrementUsage()
  } catch (err) {
    toastMsg.value = '重新生成失败：' + err.message
    showToast.value = true
    setTimeout(() => showToast.value = false, 4000)
  }
}

// 复制
const copyMessage = (msg) => {
  const text = `Subject: ${msg.subject}\n\n${msg.body}`
  navigator.clipboard.writeText(text).then(() => {
    toastMsg.value = '已复制到剪贴板'
    showToast.value = true
    setTimeout(() => showToast.value = false, 2000)
  })
}

// 从历史加载
const loadFromHistory = (h) => {
  const restored = restoreRecord(h)
  chineseInput.value = restored.chineseInput
  industry.value = restored.industry
  targetRole.value = restored.targetRole
  targetLang.value = restored.targetLang
  stylePref.value = restored.stylePref
  messages.value = restored.messages
  activePage.value = 'writer'
}

// 激活处理
const handleActivate = (code) => {
  const result = activatePro(code)
  if (result.success) {
    showPaywall.value = false
    toastMsg.value = result.msg
    showToast.value = true
    setTimeout(() => showToast.value = false, 3000)
  } else {
    toastMsg.value = result.msg
    showToast.value = true
    setTimeout(() => showToast.value = false, 3000)
  }
}
</script>

<style scoped>
/* === 全局布局 === */
.app {
  min-height: 100vh;
  background: #f5f7fa;
}

/* === 导航栏 === */
.nav {
  background: white;
  box-shadow: 0 1px 4px rgba(0,0,0,0.08);
  position: sticky;
  top: 0;
  z-index: 100;
}
.nav-inner {
  max-width: 960px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  padding: 0 20px;
  height: 56px;
  gap: 16px;
}
.nav-logo {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
  font-size: 16px;
  color: #0a66c2;
  cursor: pointer;
  white-space: nowrap;
}
.nav-tabs {
  display: flex;
  gap: 4px;
}
.nav-tab {
  background: none;
  border: none;
  padding: 8px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  color: #666;
  transition: all 0.2s;
}
.nav-tab.active {
  background: #e8f0fe;
  color: #0a66c2;
}
.nav-tab:hover {
  background: #f0f0f0;
}
.nav-usage {
  margin-left: auto;
  font-size: 12px;
}
.pro-badge {
  background: linear-gradient(135deg, #0a66c2, #004182);
  color: white;
  padding: 3px 10px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 11px;
}
.free-badge {
  color: #666;
  background: #f0f0f0;
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
}

/* === 主内容 === */
.main {
  max-width: 960px;
  margin: 0 auto;
  padding: 24px 20px;
}

.page-title {
  color: #0a66c2;
  font-size: 24px;
  margin: 0 0 4px;
}
.page-subtitle {
  color: #666;
  font-size: 14px;
  margin: 0 0 24px;
}

/* === API 设置 === */
.api-settings {
  background: white;
  border-radius: 12px;
  margin-bottom: 20px;
  border: 1px solid #e0e0e0;
  overflow: hidden;
}
.api-settings summary {
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
  color: #666;
}
.api-panel-content {
  padding: 0 16px 16px;
}
.api-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 12px;
}
.api-tab {
  background: #f0f0f0;
  border: none;
  padding: 6px 14px;
  border-radius: 16px;
  cursor: pointer;
  font-size: 12px;
  font-weight: 600;
  color: #666;
}
.api-tab.active {
  background: #0a66c2;
  color: white;
}
.api-info {
  padding: 10px 14px;
  border-radius: 8px;
  font-size: 13px;
  line-height: 1.5;
}
.api-info.success {
  background: #e8f5e9;
  color: #2e7d32;
}
.api-config {
  display: flex;
  flex-direction: column;
  gap: 8px;
}
.api-row {
  display: flex;
  gap: 8px;
}
.api-row input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 6px;
  font-size: 13px;
}
.api-row input:focus {
  border-color: #0a66c2;
  outline: none;
}
.btn-test {
  background: #0a66c2;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  white-space: nowrap;
}
.api-hint {
  font-size: 12px;
  color: #666;
  margin: 4px 0 0;
}
.api-hint a {
  color: #0a66c2;
  text-decoration: none;
  font-weight: 600;
}
.api-msg {
  font-size: 13px;
  margin-top: 8px;
}
.api-msg.success { color: #2e7d32; }
.api-msg.error { color: #d93025; }
.api-msg.info { color: #666; }

/* === 表单区 === */
.form-section {
  background: white;
  padding: 24px;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 24px;
}
.form-section > label {
  font-weight: 600;
  display: block;
  margin-bottom: 8px;
  font-size: 14px;
  color: #333;
}

textarea {
  width: 100%;
  padding: 12px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
  resize: vertical;
  box-sizing: border-box;
  font-family: inherit;
  transition: border-color 0.2s;
}
textarea:focus {
  outline: none;
  border-color: #0a66c2;
}

.lang-lock {
  font-size: 12px;
  color: #f57f17;
  margin-top: 6px;
}
.lang-lock a {
  color: #0a66c2;
  text-decoration: none;
  font-weight: 600;
}

.options-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.option-group label {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}
.option-group input, .option-group select {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  box-sizing: border-box;
}

.btn-generate {
  background: linear-gradient(135deg, #0a66c2, #004182);
  color: white;
  border: none;
  padding: 14px 32px;
  border-radius: 8px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  width: 100%;
  transition: opacity 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}
.btn-generate:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid rgba(255,255,255,0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin {
  to { transform: rotate(360deg); }
}
.usage-hint {
  text-align: center;
  font-size: 12px;
  color: #999;
  margin-top: 8px;
}

/* === 结果区 === */
.results-section {
  margin-bottom: 24px;
}
.results-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 8px;
}
.results-header h3 {
  margin: 0;
  color: #333;
}
.btn-regen-all {
  font-size: 12px;
  padding: 4px 12px;
}
.btn-regen-all:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.message-card {
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
  margin-bottom: 16px;
  overflow: hidden;
  border-left: 4px solid #0a66c2;
}
.message-card.medium { border-left-color: #f0a500; }
.message-card.high { border-left-color: #d93025; }

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  background: #f8f9fa;
  flex-wrap: wrap;
  gap: 8px;
}
.style-badge {
  font-weight: 700;
  font-size: 14px;
  color: #0a66c2;
}
.risk-badge {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: 12px;
  font-weight: 600;
}
.risk-badge.low { background: #e8f5e9; color: #2e7d32; }
.risk-badge.medium { background: #fff8e1; color: #f57f17; }
.risk-badge.high { background: #ffebee; color: #d93025; }

.message-content {
  padding: 16px;
}
.message-content.rtl {
  direction: rtl;
  text-align: right;
}
.field {
  margin-bottom: 12px;
}
.field label {
  font-weight: 600;
  font-size: 12px;
  color: #666;
  display: block;
  margin-bottom: 4px;
}
.text-block {
  background: #f8f9fa;
  padding: 12px;
  border-radius: 6px;
  font-size: 14px;
  line-height: 1.6;
  white-space: pre-wrap;
  border: 1px solid #eee;
}

.card-actions {
  padding: 12px 16px;
  background: #f8f9fa;
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}
.btn-action {
  background: white;
  border: 1px solid #0a66c2;
  color: #0a66c2;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 13px;
  font-weight: 600;
  transition: all 0.2s;
}
.btn-action:hover {
  background: #0a66c2;
  color: white;
}

/* === 历史记录 === */
.history-container {
  max-width: 800px;
  margin: 0 auto;
}
.history-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}
.history-header h2 {
  margin: 0;
  color: #0a66c2;
}
.btn-clear {
  background: none;
  border: 1px solid #d93025;
  color: #d93025;
  padding: 6px 14px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
}
.empty-state {
  text-align: center;
  padding: 40px;
  color: #999;
}
.history-item {
  background: white;
  padding: 14px 16px;
  border-radius: 10px;
  margin-bottom: 8px;
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  align-items: center;
  border: 1px solid #eee;
  transition: all 0.2s;
}
.history-item:hover {
  background: #f0f7ff;
  border-color: #0a66c2;
}
.history-main {
  flex: 1;
  min-width: 0;
}
.history-preview {
  font-size: 13px;
  color: #333;
  display: block;
  margin-bottom: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.history-meta {
  display: flex;
  gap: 6px;
}
.history-meta span {
  font-size: 11px;
  background: #f0f0f0;
  padding: 2px 8px;
  border-radius: 8px;
  color: #666;
}
.history-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
.history-time {
  font-size: 12px;
  color: #999;
}
.btn-delete {
  background: none;
  border: none;
  cursor: pointer;
  font-size: 14px;
  opacity: 0.4;
}
.btn-delete:hover {
  opacity: 1;
}

/* === Toast 提示 === */
.toast {
  position: fixed;
  bottom: 40px;
  left: 50%;
  transform: translateX(-50%);
  background: #333;
  color: white;
  padding: 10px 24px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  z-index: 2000;
  animation: toastIn 0.3s ease;
  box-shadow: 0 4px 12px rgba(0,0,0,0.2);
}
@keyframes toastIn {
  from { opacity: 0; transform: translateX(-50%) translateY(10px); }
  to { opacity: 1; transform: translateX(-50%) translateY(0); }
}

/* === 响应式 === */
@media (max-width: 640px) {
  .nav-inner {
    flex-wrap: wrap;
    height: auto;
    padding: 10px 16px;
    gap: 8px;
  }
  .nav-logo {
    font-size: 14px;
  }
  .nav-tabs {
    order: 3;
    width: 100%;
    overflow-x: auto;
  }
  .nav-tab {
    padding: 6px 10px;
    font-size: 12px;
    white-space: nowrap;
  }
  .nav-usage {
    margin-left: auto;
  }
  .page-title {
    font-size: 20px;
  }
  .page-subtitle {
    font-size: 13px;
  }
  .form-section {
    padding: 16px;
  }
  .options-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  .btn-generate {
    padding: 12px 24px;
    font-size: 15px;
  }
  .card-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }
  .main {
    padding: 16px 12px;
  }
  .api-row {
    flex-direction: column;
  }
  .api-row input {
    width: 100%;
  }
  .btn-test {
    width: 100%;
  }
}
</style>
