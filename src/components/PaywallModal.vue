<template>
  <div class="paywall-modal" @click.self="$emit('close')">
    <div class="modal-content">
      <button class="close-btn" @click="$emit('close')">×</button>
      
      <h2>解锁全部功能</h2>
      <p class="subtitle">升级 Pro，解锁无限生成和多语言支持</p>

      <!-- 订阅方案选择 -->
      <div class="plans">
        <div class="plan" :class="{ selected: selectedPlan === 'monthly' }" @click="selectedPlan = 'monthly'">
          <div class="plan-badge">推荐</div>
          <div class="plan-name">月付</div>
          <div class="plan-price">¥49<span>/月</span></div>
          <div class="plan-desc">随时取消</div>
        </div>
        <div class="plan annual" :class="{ selected: selectedPlan === 'annual' }" @click="selectedPlan = 'annual'">
          <div class="plan-save">省 ¥189</div>
          <div class="plan-name">年付</div>
          <div class="plan-price">¥399<span>/年</span></div>
          <div class="plan-desc">≈ ¥33/月</div>
        </div>
      </div>

      <!-- 激活码兑换 -->
      <div class="activation-section">
        <h3>已有激活码？</h3>
        <div class="activation-form">
          <input 
            v-model="activationCode" 
            placeholder="输入激活码"
            @keyup.enter="activateCode"
          />
          <button @click="activateCode" :disabled="!activationCode.trim() || activating">
            {{ activating ? '验证中...' : '激活' }}
          </button>
        </div>
        <p v-if="activationMsg" :class="activationSuccess ? 'success' : 'error'">{{ activationMsg }}</p>
      </div>

      <!-- 分隔线 -->
      <div class="divider">
        <span>或</span>
      </div>

      <!-- 在线支付 -->
      <div class="payment-section">
        <p class="payment-hint">安全支付，由 Stripe 提供保障</p>
        <div class="payment-methods">
          <span class="payment-icon">💳</span>
          <span class="payment-icon">🔒</span>
          <span class="payment-method-text">支持 Visa, Mastercard, 支付宝, 微信</span>
        </div>
        <button class="btn-checkout" @click="handleCheckout" :disabled="processing">
          <span v-if="processing" class="spinner"></span>
          {{ processing ? '跳转支付...' : `立即升级 ¥${selectedPlan === 'monthly' ? '49' : '399'}` }}
        </button>
        <p class="guarantee">🛡️ 7天无理由退款保证</p>
      </div>

      <!-- 分享奖励提示 -->
      <div class="referral-hint">
        <p>💡 <strong>邀请好友</strong>，双方都可获得奖励！</p>
        <button class="btn-referral" @click="showReferral = true">获取推荐链接</button>
      </div>

      <!-- 推荐弹窗 -->
      <div v-if="showReferral" class="referral-modal" @click.self="showReferral = false">
        <div class="referral-content">
          <button class="close-btn" @click="showReferral = false">×</button>
          <h3>邀请好友计划</h3>
          <p>每成功邀请 1 位好友付费，您将获得 <strong>1 个月 Pro 会员</strong></p>
          
          <div class="referral-link-box">
            <input :value="referralLink" readonly />
            <button @click="copyReferralLink">复制</button>
          </div>
          
          <div class="referral-stats">
            <div class="stat">
              <span class="stat-num">{{ referralStats.invited }}</span>
              <span class="stat-label">已邀请</span>
            </div>
            <div class="stat">
              <span class="stat-num">{{ referralStats.earned }}</span>
              <span class="stat-label">已获得月数</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const emit = defineEmits(['close', 'activated'])

// ===== Stripe Price ID 配置 =====
// cold-email-writer Month ¥49/月
// cold-email-writer Year  ¥399/年
const STRIPE_PRICES = {
  monthly: 'price_1TWykjIUUdrFmAAWXxMusmMi',
  annual:  'price_1TWyleIUUdrFmAAWmC5dUzZB'
}

// ===== 后端 API 地址（部署后替换） =====
// 本地开发: http://localhost:3001
// 生产环境: 填入你的 Railway/Render API 地址
const API_BASE = import.meta.env.VITE_API_BASE || null

// 状态
const selectedPlan = ref('monthly')
const activationCode = ref('')
const activationMsg = ref('')
const activationSuccess = ref(false)
const activating = ref(false)
const processing = ref(false)
const showReferral = ref(false)

// 推荐链接（基于用户ID生成）
const userId = ref(localStorage.getItem('coldmail_user_id') || generateUserId())
const referralLink = computed(() => {
  return `https://iguoxing.github.io/cold-email-writer/?ref=${userId.value}`
})

// 推荐统计（本地模拟）
const referralStats = ref({
  invited: parseInt(localStorage.getItem('coldmail_invited') || '0'),
  earned: parseInt(localStorage.getItem('coldmail_earned') || '0')
})

// 生成用户ID
function generateUserId() {
  const id = 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 8)
  localStorage.setItem('coldmail_user_id', id)
  return id
}

// 激活码验证（这里连接后端API）
const activateCode = async () => {
  if (!activationCode.value.trim()) return
  
  activating.value = true
  activationMsg.value = ''
  
  try {
    // 实际项目中，这里应该调用后端API验证
    // const response = await fetch('https://your-api.com/verify', {
    //   method: 'POST',
    //   body: JSON.stringify({ code: activationCode.value, userId: userId.value })
    // })
    
    // 模拟验证过程
    await new Promise(resolve => setTimeout(resolve, 800))
    
    // 硬编码的激活码验证（仅用于演示）
    const validCodes = {
      'COLDMAIL-PRO-2025': { type: 'monthly', days: 30 },
      'COLDMAIL-LAUNCH': { type: 'monthly', days: 30 },
      'COLDMAIL-BETA': { type: 'monthly', days: 30 },
      'COLDMAIL-YEAR': { type: 'annual', days: 365 },
      'COLDMAIL-TEST': { type: 'monthly', days: 7 }
    }
    
    const code = activationCode.value.toUpperCase().trim()
    if (validCodes[code]) {
      const valid = validCodes[code]
      const expiry = new Date()
      expiry.setDate(expiry.getDate() + valid.days)
      
      localStorage.setItem('coldmail_pro', JSON.stringify({
        type: valid.type,
        activatedAt: new Date().toISOString(),
        expiresAt: expiry.toISOString(),
        code: code
      }))
      
      activationSuccess.value = true
      activationMsg.value = `激活成功！${valid.type === 'annual' ? '年' : '月'}费版已激活，有效期至 ${expiry.toLocaleDateString('zh-CN')}`
      
      setTimeout(() => {
        emit('activated', code)
        emit('close')
      }, 1500)
    } else {
      activationSuccess.value = false
      activationMsg.value = '激活码无效，请检查后重试'
    }
  } catch (err) {
    activationSuccess.value = false
    activationMsg.value = '验证失败，请稍后重试'
  } finally {
    activating.value = false
  }
}

// Stripe Checkout
const handleCheckout = async () => {
  processing.value = true
  
  try {
    // 有后端 API 时：调用后端创建 Checkout Session
    if (API_BASE) {
      const response = await fetch(`${API_BASE}/api/create-checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          plan: selectedPlan.value,
          priceId: STRIPE_PRICES[selectedPlan.value],
          userId: userId.value,
          referralCode: new URLSearchParams(window.location.search).get('ref') || ''
        })
      })
      const data = await response.json()
      if (data.url) {
        window.location.href = data.url
        return
      }
      throw new Error(data.error || '创建支付链接失败')
    }

    // 无后端时：直接用 Stripe Payment Links（需要在 Stripe 控制台创建）
    // 格式: https://buy.stripe.com/xxxx
    // 在 Stripe Dashboard → Payment Links 创建，填入下方链接
    const STRIPE_PAYMENT_LINKS = {
      monthly: 'https://buy.stripe.com/test_monthly', // ← 替换为你的 Stripe Payment Link
      annual:  'https://buy.stripe.com/test_annual'   // ← 替换为你的 Stripe Payment Link
    }

    const link = STRIPE_PAYMENT_LINKS[selectedPlan.value]
    if (link && !link.includes('test_')) {
      // 附加用户 ID 用于 webhook 识别
      window.location.href = `${link}?client_reference_id=${userId.value}`
      return
    }

    // 最终 fallback：模拟支付成功（演示用）
    await new Promise(resolve => setTimeout(resolve, 1500))
    const expiry = new Date()
    expiry.setDate(expiry.getDate() + (selectedPlan.value === 'annual' ? 365 : 30))
    localStorage.setItem('coldmail_pro', JSON.stringify({
      type: selectedPlan.value,
      activatedAt: new Date().toISOString(),
      expiresAt: expiry.toISOString(),
      priceId: STRIPE_PRICES[selectedPlan.value],
      paymentId: 'demo_' + Date.now()
    }))
    alert(`✅ 演示模式：Pro 已激活，有效期至 ${expiry.toLocaleDateString('zh-CN')}\n\n正式上线请配置 Stripe Payment Link 或后端 API。`)
    emit('activated', 'payment')
    emit('close')

  } catch (err) {
    alert('支付失败：' + (err.message || '请稍后重试'))
  } finally {
    processing.value = false
  }
}

// 复制推荐链接
const copyReferralLink = () => {
  navigator.clipboard.writeText(referralLink.value)
  alert('推荐链接已复制！')
}
</script>

<style scoped>
.paywall-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

.modal-content {
  background: white;
  border-radius: 20px;
  padding: 32px;
  max-width: 480px;
  width: 100%;
  position: relative;
  max-height: 90vh;
  overflow-y: auto;
}

.close-btn {
  position: absolute;
  top: 16px;
  right: 16px;
  background: none;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #999;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
}

.close-btn:hover {
  background: #f0f0f0;
  color: #333;
}

h2 {
  text-align: center;
  color: #0a66c2;
  margin: 0 0 4px;
  font-size: 24px;
}

.subtitle {
  text-align: center;
  color: #666;
  margin: 0 0 24px;
  font-size: 14px;
}

/* 订阅方案 */
.plans {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin-bottom: 24px;
}

.plan {
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
}

.plan.selected {
  border-color: #0a66c2;
  background: #f0f7ff;
}

.plan-badge {
  position: absolute;
  top: -10px;
  left: 50%;
  transform: translateX(-50%);
  background: #0a66c2;
  color: white;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 10px;
  font-weight: 600;
}

.plan-save {
  position: absolute;
  top: -10px;
  right: 10px;
  background: #e8f5e9;
  color: #2e7d32;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.plan-name {
  font-weight: 600;
  color: #333;
  margin-bottom: 4px;
}

.plan-price {
  font-size: 28px;
  font-weight: 800;
  color: #0a66c2;
}

.plan-price span {
  font-size: 14px;
  font-weight: 400;
  color: #666;
}

.plan-desc {
  font-size: 12px;
  color: #999;
}

/* 激活码 */
.activation-section {
  margin-bottom: 20px;
}

.activation-section h3 {
  font-size: 14px;
  color: #666;
  margin: 0 0 10px;
  text-align: center;
}

.activation-form {
  display: flex;
  gap: 8px;
}

.activation-form input {
  flex: 1;
  padding: 10px 14px;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-size: 14px;
}

.activation-form input:focus {
  border-color: #0a66c2;
  outline: none;
}

.activation-form button {
  background: #0a66c2;
  color: white;
  border: none;
  padding: 10px 20px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
}

.activation-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.activation-msg {
  text-align: center;
  font-size: 13px;
  margin-top: 8px;
}

.success { color: #2e7d32; }
.error { color: #d93025; }

/* 分隔线 */
.divider {
  display: flex;
  align-items: center;
  margin: 20px 0;
}

.divider::before, .divider::after {
  content: '';
  flex: 1;
  height: 1px;
  background: #e0e0e0;
}

.divider span {
  padding: 0 16px;
  color: #999;
  font-size: 13px;
}

/* 支付 */
.payment-section {
  text-align: center;
}

.payment-hint {
  font-size: 12px;
  color: #999;
  margin: 0 0 12px;
}

.payment-methods {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  margin-bottom: 16px;
}

.payment-icon {
  font-size: 20px;
}

.payment-method-text {
  font-size: 12px;
  color: #666;
}

.btn-checkout {
  width: 100%;
  background: linear-gradient(135deg, #0a66c2, #004182);
  color: white;
  border: none;
  padding: 14px;
  border-radius: 10px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-checkout:disabled {
  opacity: 0.7;
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

.guarantee {
  font-size: 12px;
  color: #666;
  margin: 12px 0 0;
}

/* 推荐 */
.referral-hint {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #eee;
  text-align: center;
}

.referral-hint p {
  font-size: 13px;
  color: #666;
  margin: 0 0 10px;
}

.btn-referral {
  background: none;
  border: 1px solid #0a66c2;
  color: #0a66c2;
  padding: 8px 16px;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-referral:hover {
  background: #f0f7ff;
}

/* 推荐弹窗 */
.referral-modal {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1100;
  padding: 20px;
}

.referral-content {
  background: white;
  border-radius: 16px;
  padding: 28px;
  max-width: 400px;
  width: 100%;
  position: relative;
}

.referral-content h3 {
  text-align: center;
  color: #0a66c2;
  margin: 0 0 12px;
}

.referral-content p {
  text-align: center;
  color: #666;
  font-size: 14px;
  margin: 0 0 20px;
  line-height: 1.6;
}

.referral-link-box {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
}

.referral-link-box input {
  flex: 1;
  padding: 10px 12px;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 13px;
  background: #f8f9fa;
}

.referral-link-box button {
  background: #0a66c2;
  color: white;
  border: none;
  padding: 10px 16px;
  border-radius: 6px;
  font-weight: 600;
  cursor: pointer;
}

.referral-stats {
  display: flex;
  justify-content: center;
  gap: 40px;
}

.stat {
  text-align: center;
}

.stat-num {
  display: block;
  font-size: 28px;
  font-weight: 800;
  color: #0a66c2;
}

.stat-label {
  font-size: 12px;
  color: #666;
}
</style>
