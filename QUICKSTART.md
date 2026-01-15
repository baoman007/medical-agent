# 医疗问诊智能体 - 快速开始

## 🎯 项目简介

这是一个基于 **LangChain + LangGraph + DeepSeek** 构建的智能医疗问诊系统。

### ✨ 核心功能

- 🔍 **智能症状分析** - 自动提取和理解患者症状
- 🏥 **初步诊断建议** - 基于症状提供可能的疾病判断
- 💡 **个性化建议** - 提供自我护理和生活方式建议
- 🚨 **紧急程度评估** - 自动识别需要紧急就医的情况
- 📊 **结构化输出** - 使用 Zod Schema 确保数据结构化
- 🔄 **多节点工作流** - 使用 LangGraph 构建复杂的决策流程

## 🚀 快速开始

### 1. 安装依赖

```bash
cd /Users/baozhen/CodeBuddy/medical-agent
npm install
```

### 2. 配置 API 密钥

编辑 `.env` 文件，设置 DeepSeek API 密钥：

```bash
DEEPSEEK_API_KEY=sk-your_actual_api_key_here
```

### 3. 运行程序

#### 方式 1：使用启动脚本（推荐）

```bash
./start.sh
```

#### 方式 2：交互模式

```bash
node interactive.js
```

#### 方式 3：单次查询

```bash
npm start "我感觉头痛、发烧，持续了两天"
```

## 📋 使用示例

### 示例 1：轻微症状

```bash
npm start "我感觉有点头痛，可能是昨晚没睡好"
```

**输出：**
```
🔍 [节点1] 分析症状...
   症状: 头痛
   紧急程度: low

🏥 [节点2] 进行诊断...
   最可能: 睡眠不足引起的头痛
   置信度: 70%

💡 [节点3] 生成建议...
   自我护理: 休息, 补水
```

### 示例 2：中度症状

```bash
npm start "我发烧38度，咳嗽有痰，有点胸闷，持续了三天"
```

**输出：**
```
🔍 [节点1] 分析症状...
   症状: 发烧, 咳嗽, 胸闷
   紧急程度: medium

🏥 [节点2] 进行诊断...
   最可能: 上呼吸道感染
   置信度: 80%

💡 [节点3] 生成建议...
   自我护理: 休息, 多喝水, 监测体温
   随访建议: 如症状持续超过5天，建议就医
```

### 示例 3：紧急症状

```bash
npm start "我胸痛很严重，呼吸困难，出了很多汗"
```

**输出：**
```
🔍 [节点1] 分析症状...
   症状: 胸痛, 呼吸困难, 出汗
   紧急程度: emergency

🚨 [节点5] 评估紧急程度...
   紧急评估: 需要立即就医

⚠️ 紧急提醒：根据您的症状描述，建议立即就医或拨打急救电话（120）
```

## 🏗️ 技术架构

### LangGraph 工作流

```
用户输入
  ↓
analyzeSymptoms（症状分析）
  ↓
assessUrgency（紧急评估）
  ↓
  ├──[紧急]→ generateResponse（生成响应）
  │
  └──[非紧急]→ makeDiagnosis（诊断）
                ↓
          generateRecommendations（生成建议）
                ↓
          generateResponse（生成响应）
```

### 技术栈

| 技术 | 用途 |
|------|------|
| LangChain | LLM 应用开发框架 |
| LangGraph | 状态机和工作流管理 |
| DeepSeek | 大语言模型 |
| Zod | 数据验证 |

## 📁 项目文件

```
medical-agent/
├── index.js              # 主程序（单次查询）
├── interactive.js        # 交互模式
├── test.js              # 测试脚本
├── start.sh             # 快速启动脚本
├── README.md            # 项目介绍
├── INSTALL.md           # 安装指南
├── USAGE_EXAMPLES.md    # 使用示例
├── ARCHITECTURE.md      # 架构文档
└── PROJECT_SUMMARY.md   # 项目总结
```

## ⚠️ 重要提示

1. **仅供参考** - 本系统仅供参考，不能替代专业医生的诊断和治疗
2. **紧急情况** - 如有胸痛、呼吸困难等紧急症状，请立即就医
3. **专业建议** - 所有医疗决策应由专业医生做出
4. **持续监测** - 如症状加重或持续，请及时就医

## 📖 详细文档

- **README.md** - 完整的项目介绍
- **INSTALL.md** - 详细的安装指南
- **USAGE_EXAMPLES.md** - 丰富的使用示例
- **ARCHITECTURE.md** - 系统架构设计
- **PROJECT_SUMMARY.md** - 项目总结

## 🔗 相关链接

- [LangChain 官网](https://www.langchain.com/)
- [LangGraph 文档](https://langchain-ai.github.io/langgraph/)
- [DeepSeek 官网](https://www.deepseek.com/)

## 💡 常见问题

### Q: 需要付费吗？

A: 需要支付 DeepSeek API 的调用费用。DeepSeek 的定价相对较低。

### Q: 可以离线使用吗？

A: 不可以。系统需要调用 DeepSeek API，必须保持网络连接。

### Q: 如何获取 API 密钥？

A: 访问 DeepSeek 官网注册账号，在控制台创建 API 密钥。

### Q: 支持哪些语言？

A: 当前主要支持中文。DeepSeek 对中英文都有很好的支持。

## 🎉 开始使用

```bash
cd /Users/baozhen/CodeBuddy/medical-agent
./start.sh
```

祝您健康！

---

**最后更新：** 2026-01-13
**版本：** 1.0.0
