<template>
  <div class="pricing-page">
    <h2>选择适合你的方案</h2>
    <p class="pricing-sub">外贸开发信 AI 生成器 — 从免费开始，按需升级</p>

    <div class="pricing-cards">
      <div class="pricing-card free">
        <div class="card-icon">🆓</div>
        <h3>免费版</h3>
        <div class="price">¥0<span>/月</span></div>
        <ul>
          <li>✅ 每天 3 封 AI 开发信</li>
          <li>✅ 英语生成</li>
          <li>✅ 3 种风格（直接/友好/价值）</li>
          <li>✅ 垃圾邮件风险检测</li>
          <li>❌ 多语言支持</li>
          <li>❌ 邮件评分系统</li>
          <li>❌ 对话式优化</li>
          <li>❌ 模板库</li>
        </ul>
        <button class="btn-plan btn-free" disabled>当前方案</button>
      </div>

      <div class="pricing-card pro">
        <div class="card-popular">最受欢迎</div>
        <div class="card-icon">🔥</div>
        <h3>Pro 专业版</h3>
        <div class="price">¥49<span>/月</span></div>
        <ul>
          <li>✅ 无限量 AI 生成</li>
          <li>✅ 6 种语言（英/法/阿/西/俄/葡）</li>
          <li>✅ 3 种风格 + 自定义</li>
          <li>✅ 邮件评分系统（5 维度）</li>
          <li>✅ 对话式邮件优化</li>
          <li>✅ 行业模板库</li>
          <li>✅ Chrome 扩展</li>
          <li>✅ 优先客服</li>
        </ul>
        <button class="btn-plan btn-pro" @click="$emit('showPaywall')">升级 Pro</button>
      </div>
    </div>

    <div class="faq">
      <h3>常见问题</h3>
      <details>
        <summary>免费版有什么限制？</summary>
        <p>免费版每天可生成 3 封英文开发信，包含垃圾邮件检测。升级 Pro 可解锁无限生成和多语言支持。</p>
      </details>
      <details>
        <summary>Pro 版支持哪些语言？</summary>
        <p>支持英语、法语、阿拉伯语、西班牙语、俄语、葡萄牙语 — 覆盖全球主要外贸市场。</p>
      </details>
      <details>
        <summary>可以随时取消吗？</summary>
        <p>可以，随时取消订阅，取消后当月仍可使用至月底。</p>
      </details>
      <details>
        <summary>数据安全吗？</summary>
        <p>所有数据存储在浏览器本地，不上传到任何服务器。API 调用仅传输生成请求，不保存邮件内容。</p>
      </details>
    </div>
  </div>
</template>

<script setup>
defineEmits(['showPaywall'])
</script>

<style scoped>
.pricing-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
}
h2 {
  color: #0a66c2;
  text-align: center;
  margin-bottom: 4px;
}
.pricing-sub {
  text-align: center;
  color: #666;
  margin-bottom: 32px;
}
.pricing-cards {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  margin-bottom: 40px;
}
.pricing-card {
  border-radius: 16px;
  padding: 28px;
  border: 2px solid #e0e0e0;
  position: relative;
  background: white;
}
.pricing-card.pro {
  border-color: #0a66c2;
  box-shadow: 0 4px 20px rgba(10,102,194,0.15);
}
.card-popular {
  position: absolute;
  top: -12px;
  right: 20px;
  background: #0a66c2;
  color: white;
  font-size: 12px;
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 12px;
}
.card-icon {
  font-size: 36px;
  margin-bottom: 8px;
}
h3 {
  font-size: 20px;
  margin: 0 0 8px;
}
.price {
  font-size: 40px;
  font-weight: 800;
  color: #0a66c2;
  margin-bottom: 16px;
}
.price span {
  font-size: 16px;
  font-weight: 400;
  color: #666;
}
ul {
  list-style: none;
  padding: 0;
  margin: 0 0 20px;
  font-size: 14px;
  line-height: 2.2;
}
.btn-plan {
  width: 100%;
  padding: 12px;
  border-radius: 8px;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}
.btn-free {
  background: #f0f0f0;
  color: #999;
}
.btn-pro {
  background: linear-gradient(135deg, #0a66c2, #004182);
  color: white;
}
.btn-pro:hover {
  opacity: 0.9;
}

.faq {
  max-width: 600px;
  margin: 0 auto;
}
.faq h3 {
  text-align: center;
  margin-bottom: 16px;
}
details {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  margin-bottom: 8px;
  padding: 12px 16px;
}
summary {
  font-weight: 600;
  cursor: pointer;
  font-size: 14px;
}
details p {
  margin: 8px 0 0;
  font-size: 13px;
  color: #666;
  line-height: 1.6;
}

@media (max-width: 600px) {
  .pricing-cards {
    grid-template-columns: 1fr;
  }
}
</style>
