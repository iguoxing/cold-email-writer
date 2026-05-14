// ColdMail AI - Options Page Script

document.addEventListener('DOMContentLoaded', () => {
  const els = {
    apiMode: document.getElementById('api-mode'),
    keyField: document.getElementById('key-field'),
    customField: document.getElementById('custom-field'),
    apiKey: document.getElementById('api-key'),
    apiEndpoint: document.getElementById('api-endpoint'),
    btnTest: document.getElementById('btn-test'),
    apiMsg: document.getElementById('api-msg'),
    proCode: document.getElementById('pro-code'),
    btnActivate: document.getElementById('btn-activate'),
    proStatus: document.getElementById('pro-status'),
  }

  // 加载已保存的配置
  chrome.storage.local.get(['coldmail_api_mode', 'coldmail_gemini_key', 'coldmail_api_endpoint', 'coldmail_pro_code'], (result) => {
    if (result.coldmail_api_mode) {
      els.apiMode.value = result.coldmail_api_mode
      toggleFields(result.coldmail_api_mode)
    }
    if (result.coldmail_gemini_key) els.apiKey.value = result.coldmail_gemini_key
    if (result.coldmail_api_endpoint) els.apiEndpoint.value = result.coldmail_api_endpoint

    // Pro 状态
    const validCodes = ['COLDMAIL-PRO-2025', 'COLDMAIL-LAUNCH', 'COLDMAIL-BETA']
    if (result.coldmail_pro_code && validCodes.includes(result.coldmail_pro_code)) {
      els.proStatus.textContent = '✅ 已激活 Pro'
      els.proStatus.className = 'msg success'
      els.proCode.value = result.coldmail_pro_code
    }
  })

  // API 模式切换
  els.apiMode.addEventListener('change', () => {
    const mode = els.apiMode.value
    toggleFields(mode)
    chrome.storage.local.set({ coldmail_api_mode: mode })
  })

  function toggleFields(mode) {
    els.keyField.style.display = (mode === 'free' || mode === 'custom') ? 'block' : 'none'
    els.customField.style.display = mode === 'custom' ? 'block' : 'none'
  }

  // 保存 API Key
  els.apiKey.addEventListener('input', () => {
    chrome.storage.local.set({ coldmail_gemini_key: els.apiKey.value })
  })

  // 保存 API Endpoint
  els.apiEndpoint.addEventListener('input', () => {
    chrome.storage.local.set({ coldmail_api_endpoint: els.apiEndpoint.value })
  })

  // 测试 API
  els.btnTest.addEventListener('click', async () => {
    els.apiMsg.textContent = '测试中...'
    els.apiMsg.className = 'msg'

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'TEST_API',
        config: {
          apiMode: els.apiMode.value,
          apiKey: els.apiKey.value,
          apiEndpoint: els.apiEndpoint.value
        }
      })

      if (response?.success && response.data?.success) {
        els.apiMsg.textContent = '✅ ' + response.data.msg
        els.apiMsg.className = 'msg success'
      } else {
        els.apiMsg.textContent = '❌ ' + (response?.data?.msg || '连接失败')
        els.apiMsg.className = 'msg error'
      }
    } catch (err) {
      els.apiMsg.textContent = '❌ ' + err.message
      els.apiMsg.className = 'msg error'
    }
  })

  // Pro 激活
  els.btnActivate.addEventListener('click', async () => {
    const code = els.proCode.value.trim()
    if (!code) {
      els.proStatus.textContent = '请输入激活码'
      els.proStatus.className = 'msg error'
      return
    }

    try {
      const response = await chrome.runtime.sendMessage({
        type: 'ACTIVATE_PRO',
        code
      })

      if (response?.success && response.data?.success) {
        els.proStatus.textContent = '✅ ' + response.data.msg
        els.proStatus.className = 'msg success'
      } else {
        els.proStatus.textContent = '❌ ' + (response?.data?.msg || '激活失败')
        els.proStatus.className = 'msg error'
      }
    } catch (err) {
      els.proStatus.textContent = '❌ ' + err.message
      els.proStatus.className = 'msg error'
    }
  })
})
