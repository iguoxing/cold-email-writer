import { ref, computed } from 'vue'

const USAGE_KEY = 'coldmail_usage'
const PRO_KEY = 'coldmail_pro_code'
const FREE_DAILY_LIMIT = 3

// 预设激活码（MVP 阶段，后续接入支付后替换为服务端验证）
const VALID_CODES = [
  'COLDMAIL-PRO-2025',
  'COLDMAIL-LAUNCH',
  'COLDMAIL-BETA'
]

export function useUsageLimit() {
  const isPro = ref(false)
  const todayUsage = ref(0)

  // 获取今日日期字符串
  const getToday = () => new Date().toISOString().split('T')[0]

  // 初始化：检查 Pro 状态和用量
  const initUsage = () => {
    // 检查 Pro 激活码
    const savedCode = localStorage.getItem(PRO_KEY)
    if (savedCode && VALID_CODES.includes(savedCode)) {
      isPro.value = true
    }

    // 加载今日用量
    try {
      const saved = JSON.parse(localStorage.getItem(USAGE_KEY) || '{}')
      const today = getToday()
      if (saved.date === today) {
        todayUsage.value = saved.count || 0
      } else {
        // 新的一天，重置
        todayUsage.value = 0
        localStorage.setItem(USAGE_KEY, JSON.stringify({ date: today, count: 0 }))
      }
    } catch {
      todayUsage.value = 0
    }
  }

  // 增加用量
  const incrementUsage = () => {
    todayUsage.value++
    localStorage.setItem(USAGE_KEY, JSON.stringify({ date: getToday(), count: todayUsage.value }))
  }

  // 检查是否可以生成
  const canGenerate = computed(() => {
    return isPro.value || todayUsage.value < FREE_DAILY_LIMIT
  })

  // 剩余免费次数
  const remainingFree = computed(() => {
    if (isPro.value) return Infinity
    return Math.max(0, FREE_DAILY_LIMIT - todayUsage.value)
  })

  // 激活 Pro
  const activatePro = (code) => {
    if (VALID_CODES.includes(code)) {
      isPro.value = true
      localStorage.setItem(PRO_KEY, code)
      return { success: true, msg: '激活成功！已解锁全部功能。' }
    }
    return { success: false, msg: '激活码无效，请检查后重试。' }
  }

  // 取消 Pro
  const deactivatePro = () => {
    isPro.value = false
    localStorage.removeItem(PRO_KEY)
  }

  // 初始化
  initUsage()

  return {
    isPro,
    todayUsage,
    canGenerate,
    remainingFree,
    freeLimit: FREE_DAILY_LIMIT,
    incrementUsage,
    activatePro,
    deactivatePro,
    initUsage
  }
}
