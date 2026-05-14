<template>
  <div class="paywall-modal" v-if="show" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="modal-close" @click="$emit('close')">&times;</button>
      <div class="modal-icon">🔒</div>
      <h3>今日免费额度已用完</h3>
      <p class="modal-desc">升级 Pro 解锁无限生成 + 多语言 + 邮件评分</p>

      <div class="plans">
        <div class="plan free-plan">
          <div class="plan-badge">免费版</div>
          <div class="plan-price">¥0</div>
          <ul class="plan-features">
            <li>✅ 每天 3 封邮件</li>
            <li>✅ 英语生成</li>
            <li>✅ 垃圾邮件检测</li>
            <li>❌ 多语言支持</li>
            <li>❌ 邮件评分系统</li>
            <li>❌ 对话式优化</li>
          </ul>
        </div>
        <div class="plan pro-plan">
          <div class="plan-badge hot">🔥 Pro</div>
          <div class="plan-price">¥49<span>/月</span></div>
          <ul class="plan-features">
            <li>✅ 无限量生成</li>
            <li>✅ 6 种语言</li>
            <li>✅ 邮件评分系统</li>
            <li>✅ 对话式优化</li>
            <li>✅ 模板库</li>
            <li>✅ 优先客服</li>
          </ul>
        </div>
      </div>

      <div class="activate-section">
        <p class="activate-label">已有激活码？</p>
        <div class="activate-row">
          <input v-model="activationCode" placeholder="输入 Pro 激活码" />
          <button class="btn-activate" @click="handleActivate">激活</button>
        </div>
        <p v-if="activateMsg" :class="activateMsg.type" class="activate-msg">{{ activateMsg.text }}</p>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'

const props = defineProps({
  show: { type: Boolean, default: false }
})
const emit = defineEmits(['close', 'activated'])

const activationCode = ref('')
const activateMsg = ref(null)

const handleActivate = () => {
  if (!activationCode.value.trim()) {
    activateMsg.value = { type: 'error', text: '请输入激活码' }
    return
  }
  // 调用父组件传入的 activatePro 方法
  emit('activated', activationCode.value.trim())
  activateMsg.value = null
}
</script>

<style scoped>
.paywall-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}
.modal-content {
  background: white;
  border-radius: 16px;
  padding: 32px;
  max-width: 600px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}
.modal-close {
  position: absolute;
  top: 12px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
}
.modal-icon {
  text-align: center;
  font-size: 48px;
  margin-bottom: 8px;
}
h3 {
  text-align: center;
  margin: 0 0 4px;
  font-size: 20px;
}
.modal-desc {
  text-align: center;
  color: #666;
  margin-bottom: 24px;
  font-size: 14px;
}
.plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 24px;
}
.plan {
  border-radius: 12px;
  padding: 20px;
  border: 2px solid #e0e0e0;
}
.pro-plan {
  border-color: #0a66c2;
  background: linear-gradient(135deg, #f0f7ff, #e8f0fe);
  position: relative;
}
.plan-badge {
  font-size: 13px;
  font-weight: 700;
  color: #666;
  margin-bottom: 8px;
}
.plan-badge.hot {
  color: #0a66c2;
}
.plan-price {
  font-size: 32px;
  font-weight: 800;
  color: #0a66c2;
  margin-bottom: 12px;
}
.plan-price span {
  font-size: 14px;
  font-weight: 400;
  color: #666;
}
.plan-features {
  list-style: none;
  padding: 0;
  margin: 0;
  font-size: 13px;
  line-height: 2;
}
.activate-section {
  border-top: 1px solid #e0e0e0;
  padding-top: 16px;
}
.activate-label {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
}
.activate-row {
  display: flex;
  gap: 8px;
}
.activate-row input {
  flex: 1;
  padding: 8px 12px;
  border: 2px solid #0a66c2;
  border-radius: 6px;
  font-size: 13px;
}
.btn-activate {
  background: #0a66c2;
  color: white;
  border: none;
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}
.activate-msg {
  font-size: 13px;
  margin-top: 8px;
}
.activate-msg.error { color: #d93025; }
.activate-msg.success { color: #2e7d32; }

@media (max-width: 500px) {
  .plans {
    grid-template-columns: 1fr;
  }
}
</style>
