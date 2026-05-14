# ColdMail AI - AI 外贸开发信生成器

🤖 输入中文需求，AI 自动生成多语言高转化率开发信

![Version](https://img.shields.io/badge/version-1.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Stripe](https://img.shields.io/badge/payment-Stripe-purple)

## ✨ 功能特点

- 🌏 **多语言支持** - 英语、法语、阿拉伯语、西班牙语、俄语、葡萄牙语
- 🤖 **AI 智能生成** - 基于 GPT-4 级别模型，生成地道专业邮件
- 📊 **邮件评分系统** - 5 维度分析，优化转化率
- 🛡️ **垃圾邮件检测** - 自动检测高风险词汇，避免进垃圾箱
- ⚡ **3 种写作风格** - 直接高效型、友好亲和型、价值驱动型
- 🔌 **Chrome 扩展** - 直接在 LinkedIn 上使用

## 🚀 快速开始

### 安装

```bash
npm install
```

### 开发模式

```bash
npm run dev
```

### 构建生产版本

```bash
npm run build
```

### 预览构建结果

```bash
npm run preview
```

## 💰 盈利系统

### 当前收入模型

| 方案 | 价格 | 功能 |
|------|------|------|
| 免费版 | ¥0 | 每天 3 封，仅英文 |
| Pro 月付 | ¥49/月 | 无限量，6 种语言 |
| Pro 年付 | ¥399/年 | 节省 ¥189 |

### 自动化盈利架构

```
SEO流量 + 社媒获客 → 注册/试用 → 免费转化 → 升级付费 → 续费留存 → 口碑传播
```

### 已实现功能

- ✅ **支付集成** - Stripe Checkout，支持信用卡、支付宝、微信
- ✅ **订阅管理** - 完整的订阅生命周期管理
- ✅ **激活码系统** - 支持一次性码和限时优惠码
- ✅ **推荐奖励** - 邀请 1 人付费得 1 个月 Pro
- ✅ **数据追踪** - 事件追踪和转化漏斗分析
- ✅ **邮件自动化** - 用户生命周期自动化邮件序列

## 📁 项目结构

```
cold-email-writer/
├── src/
│   ├── components/
│   │   ├── LandingPage.vue      # SEO 落地页
│   │   ├── PricingPage.vue       # 定价页面
│   │   ├── PaywallModal.vue      # 付费墙弹窗
│   │   ├── EmailScorer.vue       # 邮件评分组件
│   │   └── LanguageSelector.vue   # 语言选择器
│   ├── composables/
│   │   ├── useAI.js              # AI 调用
│   │   ├── useUsageLimit.js      # 用量限制
│   │   ├── useSpamDetector.js    # 垃圾检测
│   │   └── useEmailHistory.js     # 历史记录
│   ├── services/
│   │   ├── subscription.js       # 订阅管理服务
│   │   ├── referral.js           # 推荐系统服务
│   │   ├── emailAutomation.js    # 邮件自动化
│   │   └── analytics.js          # 数据分析
│   ├── App.vue
│   └── main.js
├── api/                          # 后端 API（可选）
│   ├── server.js                 # Express 服务器
│   ├── package.json
│   └── .env.example              # 环境变量示例
├── extension/                     # Chrome 扩展
├── public/
├── dist/                         # 构建输出
└── package.json
```

## 🔧 部署

### 前端部署 (GitHub Pages)

1. 修改 `vite.config.js` 中的 base 路径
2. GitHub Actions 自动构建部署

```yaml
# .github/workflows/deploy.yml
name: Deploy
on:
  push:
    branches: [main]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
      - run: npm ci
      - run: npm run build
      - uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./dist
```

### 后端 API 部署

推荐使用以下平台之一：

1. **Railway** - 最简单的部署方式
2. **Render** - 免费层可用
3. **Vercel Serverless Functions** - 边缘函数
4. **Cloudflare Workers** - 免费且快速

### Stripe 配置

1. 创建 Stripe 账号: https://stripe.com
2. 创建产品并获取 Price ID
3. 配置 Webhook（指向你的后端 API）
4. 设置环境变量

### Supabase 配置

1. 创建 Supabase 项目: https://supabase.com
2. 创建以下表：
   - `subscriptions` - 订阅记录
   - `users` - 用户信息
   - `referral_stats` - 推荐统计
   - `events` - 事件追踪
3. 配置 RLS 策略

## 📈 数据看板

### 关键指标

| 指标 | 目标值 |
|------|--------|
| 转化率（免费→付费） | 5-10% |
| 月留存率 | >80% |
| 获客成本 (CAC) | <¥50 |
| 用户生命周期价值 (LTV) | >¥300 |
| 分享转化率 | >15% |

### 追踪的事件

- `page_view` - 页面浏览
- `signup` - 注册
- `email_generated` - 邮件生成
- `upgrade_click` - 升级点击
- `payment_completed` - 支付完成
- `share_click` - 分享点击

## 🤝 推荐计划

邀请好友注册，双方都可获得奖励：

- 邀请 1 人付费 → 获得 1 个月 Pro
- 邀请 5 人付费 → 获得 1 年 Pro
- 邀请 10 人付费 → 获得 2 年 Pro

分享链接格式：`https://iguoxing.github.io/cold-email-writer/?ref=USER_ID`

## 🔐 安全说明

- 所有敏感操作需要服务端验证
- API Key 不存储在前端
- 支付信息由 Stripe 安全处理
- 用户数据存储在本地或加密的数据库中

## 📝 License

MIT License - 详见 [LICENSE](LICENSE) 文件

## 🙏 致谢

- [Pollinations.ai](https://pollinations.ai) - 免费 AI 图片生成
- [Stripe](https://stripe.com) - 支付处理
- [Supabase](https://supabase.com) - 数据库和认证
- [Vue.js](https://vuejs.org) - 前端框架
