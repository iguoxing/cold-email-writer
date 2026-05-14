// ColdMail AI - Popup Script

document.addEventListener('DOMContentLoaded', () => {
  let targetLang = 'en'
  let stylePref = 'balanced'
  let isPro = false
  let apiMode = 'pollinations'
  let apiKey = ''

  const els = {
    input: document.getElementById('input'),
    industry: document.getElementById('industry'),
    role: document.getElementById('role'),
    btnGenerate: document.getElementById('btn-generate'),
    btnSettings: document.getElementById('btn-settings'),
    results: document.getElementById('results'),
    resultCards: document.getElementById('result-cards'),
    loading: document.getElementById('loading'),
    paywall: document.getElementById('paywall'),
    usageBadge: document.getElementById('usage-badge'),
    activateCode: document.getElementById('activate-code'),
    btnActivate: document.getElementById('btn-activate'),
    activateMsg: document.getElementById('activate-msg'),
  }

  // 初始化：加载配置和用量
  chrome.storage.local.get(['coldmail_api_mode', 'coldmail_gemini_key', 'coldmail_pro_code'], (result) => {
    apiMode = result.coldmail_api_mode || 'pollinations'
    apiKey = result.coldmail_gemini_key || ''
    isPro = !!(result.coldmail_pro_code && ['COLDMAIL-PRO-2025', 'COLDMAIL-LAUNCH', 'COLDMAIL-BETA'].includes(result.coldmail_pro_code))
    updateUsageBadge()
  })

  // 语言选择
  document.querySelectorAll('.lang-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      targetLang = btn.dataset.lang
      // 非英语且非Pro，提示
      if (targetLang !== 'en' && !isPro) {
        alert('多语言为 Pro 功能，请在设置中输入激活码升级')
        // 切回英语
        document.querySelectorAll('.lang-btn').forEach(b => b.classList.remove('active'))
        document.querySelector('[data-lang="en"]').classList.add('active')
        targetLang = 'en'
      }
    })
  })

  // 风格选择
  document.querySelectorAll('.style-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.style-btn').forEach(b => b.classList.remove('active'))
      btn.classList.add('active')
      stylePref = btn.dataset.style
    })
  })

  // 生成邮件
  els.btnGenerate.addEventListener('click', async () => {
    const input = els.input.value.trim()
    if (!input) return

    // 检查用量
    const usageResult = await sendMessage({ type: 'CHECK_USAGE' })
    if (!usageResult.canGenerate) {
      els.paywall.style.display = 'block'
      return
    }

    // 显示加载
    els.loading.style.display = 'flex'
    els.results.style.display = 'none'
    els.paywall.style.display = 'none'
    els.btnGenerate.disabled = true

    try {
      let styles = stylePref === 'balanced' ? ['direct', 'friendly', 'value']
        : [stylePref, 'direct', 'friendly'].filter((v, i, a) => a.indexOf(v) === i).slice(0, 3)

      const cards = []
      for (const style of styles) {
        const result = await sendMessage({
          type: 'GENERATE_EMAIL',
          data: {
            style,
            input,
            industry: els.industry.value,
            targetRole: els.role.value,
            targetLang,
            apiMode,
            apiKey,
            apiEndpoint: ''
          }
        })
        cards.push(result)

        // 增加用量
        await sendMessage({ type: 'INCREMENT_USAGE' })
      }

      // 渲染结果
      renderResults(cards)
      updateUsageBadge()
    } catch (err) {
      els.resultCards.innerHTML = `<div class="result-card"><div class="result-body" style="color:#d93025">生成失败：${err.message}</div></div>`
      els.results.style.display = 'block'
    } finally {
      els.loading.style.display = 'none'
      els.btnGenerate.disabled = false
    }
  })

  // 设置按钮
  els.btnSettings.addEventListener('click', () => {
    chrome.runtime.openOptionsPage()
  })

  // Pro 激活
  els.btnActivate.addEventListener('click', async () => {
    const code = els.activateCode.value.trim()
    if (!code) return
    const result = await sendMessage({ type: 'ACTIVATE_PRO', code })
    els.activateMsg.textContent = result.msg
    els.activateMsg.className = 'activate-msg ' + (result.success ? 'success' : 'error')
    if (result.success) {
      isPro = true
      updateUsageBadge()
      els.paywall.style.display = 'none'
    }
  })

  // 渲染结果
  function renderResults(cards) {
    const styleLabels = {
      direct: '🎯 直接高效型',
      friendly: '🤝 友好亲和型',
      value: '💡 价值驱动型'
    }
    const riskLabels = { low: '✅ 低风险', medium: '⚠️ 中风险', high: '🚨 高风险' }

    els.resultCards.innerHTML = cards.map(card => `
      <div class="result-card ${card.spamResult?.riskLevel || 'low'}">
        <div class="result-header">
          <span class="result-style">${styleLabels[card.style] || card.style}</span>
          <span class="result-risk ${card.spamResult?.riskLevel || 'low'}">
            ${riskLabels[card.spamResult?.riskLevel || 'low']} · ${card.spamResult?.score || 0}%
          </span>
        </div>
        <div class="result-body">
          <div class="result-subject">Subject: ${escapeHtml(card.subject)}</div>
          <div class="result-text">${escapeHtml(card.body)}</div>
        </div>
        <div class="result-actions">
          <button class="btn-copy" data-subject="${escapeAttr(card.subject)}" data-body="${escapeAttr(card.body)}">📋 复制</button>
        </div>
      </div>
    `).join('')

    // 绑定复制按钮
    els.resultCards.querySelectorAll('.btn-copy').forEach(btn => {
      btn.addEventListener('click', () => {
        const text = `Subject: ${btn.dataset.subject}\n\n${btn.dataset.body}`
        navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '✅ 已复制'
          setTimeout(() => btn.textContent = '📋 复制', 2000)
        })
      })
    })

    els.results.style.display = 'block'
  }

  // 更新用量标签
  async function updateUsageBadge() {
    try {
      const usage = await sendMessage({ type: 'CHECK_USAGE' })
      if (usage.isPro) {
        els.usageBadge.textContent = 'PRO'
        els.usageBadge.classList.add('pro')
      } else {
        els.usageBadge.textContent = `今日: ${usage.count}/${3}`
        els.usageBadge.classList.remove('pro')
      }
    } catch {
      els.usageBadge.textContent = '--'
    }
  }

  // 发送消息到 background
  function sendMessage(msg) {
    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(msg, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message))
          return
        }
        if (response?.success) {
          resolve(response.data)
        } else {
          reject(new Error(response?.error || '未知错误'))
        }
      })
    })
  }

  function escapeHtml(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;')
  }
  function escapeAttr(str) {
    return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')
  }
})
