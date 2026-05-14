import { ref, watch } from 'vue'

const STORAGE_KEY = 'coldmail_history'
const MAX_HISTORY = 20

export function useEmailHistory() {
  const history = ref([])

  // 从 localStorage 加载
  const loadHistory = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) history.value = JSON.parse(saved)
    } catch (e) {
      history.value = []
    }
  }

  // 保存到 localStorage
  const saveHistory = () => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value.slice(0, MAX_HISTORY)))
    } catch (e) {
      // localStorage 满了，清理旧记录
      history.value = history.value.slice(0, 5)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(history.value))
    }
  }

  // 添加记录
  const addRecord = (record) => {
    history.value.unshift({
      id: Date.now(),
      time: new Date().toLocaleString('zh-CN'),
      ...record
    })
    if (history.value.length > MAX_HISTORY) history.value.pop()
    saveHistory()
  }

  // 删除记录
  const deleteRecord = (id) => {
    history.value = history.value.filter(h => h.id !== id)
    saveHistory()
  }

  // 清空历史
  const clearHistory = () => {
    history.value = []
    localStorage.removeItem(STORAGE_KEY)
  }

  // 恢复记录到表单
  const restoreRecord = (record) => {
    return {
      chineseInput: record.input || '',
      industry: record.industry || '',
      targetRole: record.targetRole || '',
      targetLang: record.targetLang || 'en',
      stylePref: record.stylePref || 'balanced',
      messages: record.messages || []
    }
  }

  // 初始化
  loadHistory()

  return {
    history,
    addRecord,
    deleteRecord,
    clearHistory,
    restoreRecord
  }
}
