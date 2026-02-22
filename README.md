# 锦绣山河：华夏求和挑战

一款以中国大好河山为主题的数字消除益智游戏。

## 部署到 Vercel 指南

### 1. 准备 GitHub 仓库
1. 在 GitHub 上创建一个新的私有或公开仓库。
2. 将此项目的所有代码推送到该仓库。

### 2. 在 Vercel 上部署
1. 登录 [Vercel](https://vercel.com/)。
2. 点击 **"Add New"** -> **"Project"**。
3. 导入你的 GitHub 仓库。
4. 在 **"Environment Variables"** 部分，添加以下变量：
   - `GEMINI_API_KEY`: 你的 Google Gemini API 密钥（可以从 [Google AI Studio](https://aistudio.google.com/app/apikey) 获取）。
5. 点击 **"Deploy"**。

### 3. 注意事项
- 本项目使用 Vite 构建，Vercel 会自动识别并配置构建设置。
- `vercel.json` 已配置，以确保单页应用（SPA）的路由正常工作。
- 请确保在部署前已在 Vercel 后台正确设置了 API 密钥，否则 AI 聊天功能将无法使用。

## 本地开发
```bash
npm install
npm run dev
```
