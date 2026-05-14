<template>
  <div class="lang-selector">
    <button
      v-for="lang in languages"
      :key="lang.code"
      class="lang-btn"
      :class="{ active: modelValue === lang.code, rtl: lang.rtl }"
      @click="$emit('update:modelValue', lang.code)"
      :title="lang.name"
    >
      <span class="lang-flag">{{ lang.flag }}</span>
      <span class="lang-code">{{ lang.code.toUpperCase() }}</span>
    </button>
  </div>
</template>

<script setup>
defineProps({
  modelValue: { type: String, default: 'en' }
})
defineEmits(['update:modelValue'])

const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧', rtl: false },
  { code: 'fr', name: 'Français', flag: '🇫🇷', rtl: false },
  { code: 'ar', name: 'العربية', flag: '🇸🇦', rtl: true },
  { code: 'es', name: 'Español', flag: '🇪🇸', rtl: false },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', rtl: false },
  { code: 'pt', name: 'Português', flag: '🇧🇷', rtl: false },
]
</script>

<style scoped>
.lang-selector {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
}
.lang-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 12px;
  border: 2px solid #e0e0e0;
  border-radius: 20px;
  background: white;
  cursor: pointer;
  font-size: 13px;
  transition: all 0.2s;
}
.lang-btn:hover {
  border-color: #0a66c2;
  background: #f0f7ff;
}
.lang-btn.active {
  border-color: #0a66c2;
  background: #0a66c2;
  color: white;
}
.lang-flag {
  font-size: 16px;
}
.lang-code {
  font-weight: 600;
  font-size: 12px;
}
</style>
