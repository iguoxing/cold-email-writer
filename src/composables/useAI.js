import { ref, watch } from 'vue'

const POLLINATIONS_URL = 'https://text.pollinations.ai/'
const GEMINI_ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent'

const apiMode = ref('pollinations')
const apiKey = ref('')
const apiEndpoint = ref('')
const apiStatus = ref(null)

export function useAI() {
  const initAPIConfig = () => {
    const savedKey = localStorage.getItem('coldmail_gemini_key')
    if (savedKey) apiKey.value = savedKey
    const savedEndpoint = localStorage.getItem('coldmail_api_endpoint')
    if (savedEndpoint) apiEndpoint.value = savedEndpoint
    const savedMode = localStorage.getItem('coldmail_api_mode')
    if (savedMode) apiMode.value = savedMode
  }

  // 自动保存配置
  watch(apiKey, (val) => {
    if (val) localStorage.setItem('coldmail_gemini_key', val)
    else localStorage.removeItem('coldmail_gemini_key')
  })

  watch(apiEndpoint, (val) => {
    if (val) localStorage.setItem('coldmail_api_endpoint', val)
    else localStorage.removeItem('coldmail_api_endpoint')
  })

  watch(apiMode, (val) => {
    localStorage.setItem('coldmail_api_mode', val)
  })

  // Pollinations.ai 免费 AI 调用（无需 API Key）
  const callPollinations = async (prompt) => {
    const url = POLLINATIONS_URL + encodeURIComponent(prompt) + '?model=openai'
    const res = await fetch(url)
    if (!res.ok) {
      if (res.status === 429) throw new Error('请求过于频繁，请稍等几秒后重试')
      throw new Error(`Pollinations API 错误 ${res.status}`)
    }
    return await res.text()
  }

  // Gemini API 调用
  const callGemini = async (prompt) => {
    const url = `${GEMINI_ENDPOINT}?key=${apiKey.value}`
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
      if (errMsg.includes('quota') || errMsg.includes('Quota exceeded') || errMsg.includes('exceeded your current quota')) {
        throw new Error('Gemini API 额度已用完。请更换 API Key，或切换到 Pollinations 免费模式。')
      }
      throw new Error(`Gemini API 错误 ${res.status}: ${errMsg}`)
    }

    const data = await res.json()
    if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
      throw new Error('Gemini 返回格式异常：' + JSON.stringify(data))
    }
    return data.candidates[0].content.parts[0].text
  }

  // OpenAI 兼容格式调用
  const callOpenAI = async (prompt) => {
    const body = {
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.8,
    }

    const headers = { 'Content-Type': 'application/json' }
    if (apiKey.value) headers['Authorization'] = `Bearer ${apiKey.value}`

    const res = await fetch(apiEndpoint.value, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    if (!res.ok) throw new Error(`API 错误 ${res.status}: ${await res.text()}`)
    const data = await res.json()
    return data.choices[0].message.content
  }

  // 模拟 AI 生成
  const simulateAI = async (prompt) => {
    await new Promise(r => setTimeout(r, 1200))
    return `[模拟模式] 当前为模拟模式，请切换到免费 AI 模式获取真实生成效果。`
  }

  // 统一调用入口
  const callAI = async (prompt) => {
    if (apiMode.value === 'mock') return simulateAI(prompt)
    if (apiMode.value === 'pollinations') return callPollinations(prompt)
    if (apiMode.value === 'free') {
      if (!apiKey.value) throw new Error('请先填入 Gemini API Key（免费获取）')
      return callGemini(prompt)
    }
    if (!apiEndpoint.value) return simulateAI(prompt)
    return callOpenAI(prompt)
  }

  // 测试 API 连接
  const testAPI = async () => {
    try {
      apiStatus.value = { type: 'info', msg: '测试中...' }

      if (apiMode.value === 'mock') {
        apiStatus.value = { type: 'info', msg: '模拟模式无需测试，直接生成即可。' }
        return
      }

      if (apiMode.value === 'pollinations') {
        const res = await fetch(POLLINATIONS_URL + encodeURIComponent('Reply with just: OK') + '?model=openai')
        apiStatus.value = res.ok
          ? { type: 'success', msg: 'Pollinations AI 连接成功！无需 API Key。' }
          : { type: 'error', msg: `连接失败：${res.status}` }
        return
      }

      if (apiMode.value === 'free') {
        if (!apiKey.value) {
          apiStatus.value = { type: 'error', msg: '请先填入 Gemini API Key' }
          return
        }
        const url = `${GEMINI_ENDPOINT}?key=${apiKey.value}`
        const body = {
          contents: [{ parts: [{ text: 'Reply with just: OK' }] }],
          generationConfig: { maxOutputTokens: 10 }
        }
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        })
        apiStatus.value = res.ok
          ? { type: 'success', msg: 'Gemini API 连接成功！' }
          : { type: 'error', msg: `连接失败：${(await res.json().catch(() => ({}))).error?.message || res.status}` }
        return
      }

      // 自定义模式
      if (!apiEndpoint.value) {
        apiStatus.value = { type: 'info', msg: '未配置 API Endpoint，将使用模拟模式。' }
        return
      }
      const body = {
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: 'Reply with just: OK' }],
        max_tokens: 5,
      }
      const headers = { 'Content-Type': 'application/json' }
      if (apiKey.value) headers['Authorization'] = `Bearer ${apiKey.value}`
      const res = await fetch(apiEndpoint.value, { method: 'POST', headers, body: JSON.stringify(body) })
      apiStatus.value = res.ok
        ? { type: 'success', msg: 'API 连接成功！' }
        : { type: 'error', msg: `连接失败：${res.status}` }
    } catch (err) {
      apiStatus.value = { type: 'error', msg: `连接失败：${err.message}` }
    }
  }

  return {
    apiMode, apiKey, apiEndpoint, apiStatus,
    initAPIConfig, callAI, testAPI,
    POLLINATIONS_URL, GEMINI_ENDPOINT
  }
}
