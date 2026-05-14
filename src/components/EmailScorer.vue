<template>
  <div class="email-scorer">
    <div class="score-header">
      <span class="score-grade" :class="score.grade">{{ score.grade }}</span>
      <span class="score-total">{{ score.total }}/100</span>
    </div>
    <div class="score-bar-container">
      <div class="score-bar" :style="{ width: score.total + '%' }" :class="barClass"></div>
    </div>
    <div class="score-details">
      <div class="score-item" v-for="item in scoreItems" :key="item.key">
        <span class="score-label">{{ item.label }}</span>
        <div class="score-mini-bar">
          <div class="score-mini-fill" :style="{ width: item.value + '%' }" :class="item.class"></div>
        </div>
        <span class="score-value">{{ item.value }}</span>
      </div>
    </div>
    <div v-if="score.spamDetails.flags.length" class="spam-flags">
      <span class="flag-label">改进建议：</span>
      <span class="flag-item" v-for="(flag, i) in score.spamDetails.flags.slice(0, 3)" :key="i">{{ flag }}</span>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  score: { type: Object, required: true }
})

const barClass = computed(() => {
  if (props.score.total >= 80) return 'bar-a'
  if (props.score.total >= 65) return 'bar-b'
  if (props.score.total >= 50) return 'bar-c'
  return 'bar-d'
})

const scoreItems = computed(() => [
  { key: 'spam', label: '反垃圾', value: props.score.spam, class: props.score.spam >= 80 ? 'fill-good' : 'fill-warn' },
  { key: 'personal', label: '个性化', value: props.score.personal, class: props.score.personal >= 60 ? 'fill-good' : 'fill-warn' },
  { key: 'cta', label: 'CTA清晰度', value: props.score.cta, class: props.score.cta >= 60 ? 'fill-good' : 'fill-warn' },
  { key: 'tone', label: '语气匹配', value: props.score.tone, class: props.score.tone >= 60 ? 'fill-good' : 'fill-warn' },
  { key: 'length', label: '长度适宜', value: props.score.length, class: props.score.length >= 70 ? 'fill-good' : 'fill-warn' },
])
</script>

<style scoped>
.email-scorer {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 12px;
  margin-top: 8px;
}
.score-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}
.score-grade {
  font-size: 24px;
  font-weight: 800;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
}
.score-grade.A { background: #e8f5e9; color: #2e7d32; }
.score-grade.B { background: #e3f2fd; color: #1565c0; }
.score-grade.C { background: #fff8e1; color: #f57f17; }
.score-grade.D { background: #ffebee; color: #d93025; }
.score-total {
  font-size: 18px;
  font-weight: 700;
  color: #333;
}
.score-bar-container {
  height: 6px;
  background: #e0e0e0;
  border-radius: 3px;
  margin-bottom: 12px;
  overflow: hidden;
}
.score-bar {
  height: 100%;
  border-radius: 3px;
  transition: width 0.5s ease;
}
.bar-a { background: linear-gradient(90deg, #4caf50, #66bb6a); }
.bar-b { background: linear-gradient(90deg, #2196f3, #42a5f5); }
.bar-c { background: linear-gradient(90deg, #ff9800, #ffa726); }
.bar-d { background: linear-gradient(90deg, #f44336, #ef5350); }

.score-details {
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.score-item {
  display: flex;
  align-items: center;
  gap: 8px;
}
.score-label {
  width: 70px;
  font-size: 12px;
  color: #666;
  flex-shrink: 0;
}
.score-mini-bar {
  flex: 1;
  height: 4px;
  background: #e0e0e0;
  border-radius: 2px;
  overflow: hidden;
}
.score-mini-fill {
  height: 100%;
  border-radius: 2px;
  transition: width 0.4s ease;
}
.fill-good { background: #4caf50; }
.fill-warn { background: #ff9800; }
.score-value {
  width: 28px;
  font-size: 12px;
  font-weight: 600;
  color: #333;
  text-align: right;
}
.spam-flags {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px solid #e0e0e0;
}
.flag-label {
  font-size: 12px;
  color: #666;
  font-weight: 600;
}
.flag-item {
  display: inline-block;
  font-size: 11px;
  color: #d93025;
  background: #ffebee;
  padding: 2px 8px;
  border-radius: 10px;
  margin: 2px 4px 2px 0;
}
</style>
