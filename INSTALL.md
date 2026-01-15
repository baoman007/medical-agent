# 安装指南

## 前置要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- DeepSeek API 密钥

## 安装步骤

### 1. 获取 DeepSeek API 密钥

1. 访问 [DeepSeek 官网](https://www.deepseek.com/)
2. 注册账号
3. 在控制台创建 API 密钥
4. 复制 API 密钥

### 2. 克隆或创建项目

```bash
cd /path/to/your/workspace
mkdir medical-agent
cd medical-agent
```

### 3. 安装依赖

```bash
npm install
```

这将安装以下依赖：
- `@langchain/community` - LangChain 社区扩展
- `@langchain/core` - LangChain 核心
- `@langchain/langgraph` - LangGraph 工作流
- `langchain` - LangChain 主框架
- `dotenv` - 环境变量管理
- `openai` - OpenAI 兼容客户端

### 4. 配置环境变量

复制环境变量模板：

```bash
cp .env.example .env
```

编辑 `.env` 文件，设置您的 API 密钥：

```env
DEEPSEEK_API_KEY=sk-your_actual_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
TEMPERATURE=0.7
MAX_TOKENS=2000
```

### 5. 验证安装

运行测试脚本：

```bash
node test.js
```

或直接运行：

```bash
npm start "测试症状描述"
```

## 项目结构

```
medical-agent/
├── .env                    # 环境变量配置
├── .env.example            # 环境变量模板
├── .gitignore              # Git 忽略文件
├── ARCHITECTURE.md         # 架构文档
├── INSTALL.md              # 安装指南
├── package.json            # 项目配置
├── README.md               # 项目说明
├── USAGE_EXAMPLES.md       # 使用示例
├── index.js                # 主程序（单次查询）
├── interactive.js          # 交互模式
└── test.js                # 测试脚本
```

## 快速开始

### 方式 1：单次查询

```bash
npm start "我感觉头痛、发烧，持续了两天"
```

### 方式 2：交互模式

```bash
node interactive.js
```

### 方式 3：作为模块使用

```javascript
import { createMedicalGraph } from './index.js';

const medicalGraph = createMedicalGraph();
const result = await medicalGraph.invoke({
  messages: [{ content: '你的症状' }],
});
```

## 常见问题

### Q: npm install 失败？

A: 尝试以下方法：
```bash
# 清除缓存
npm cache clean --force

# 使用淘宝镜像
npm install --registry=https://registry.npmmirror.com

# 或使用 yarn
yarn install
```

### Q: 如何测试 API 密钥是否有效？

A: 创建测试脚本 `test-api.js`:

```javascript
import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';

async function testAPI() {
  const llm = new ChatOpenAI({
    openAIApiKey: process.env.DEEPSEEK_API_KEY,
    modelName: 'deepseek-chat',
    configuration: {
      baseURL: process.env.DEEPSEEK_BASE_URL,
    },
  });

  try {
    const result = await llm.invoke('测试连接');
    console.log('✅ API 连接成功！');
    console.log(result.content);
  } catch (error) {
    console.error('❌ API 连接失败：', error.message);
  }
}

testAPI();
```

运行：
```bash
node test-api.js
```

### Q: 系统支持中文吗？

A: 完全支持！DeepSeek 模型对中文理解能力很强，推荐用于中文医疗咨询。

### Q: 如何查看详细的执行流程？

A: 系统默认会输出每个节点的执行情况。如需更详细的日志，可以修改日志级别。

### Q: 可以离线使用吗？

A: 不可以。系统需要调用 DeepSeek API 进行推理，需要网络连接。

## 卸载

如需卸载：

```bash
# 删除项目
cd ..
rm -rf medical-agent

# 或仅删除依赖
cd medical-agent
rm -rf node_modules package-lock.json
```

## 下一步

安装完成后，建议阅读：

1. [README.md](./README.md) - 了解项目概况
2. [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) - 查看使用示例
3. [ARCHITECTURE.md](./ARCHITECTURE.md) - 了解系统架构

## 获取帮助

如遇问题：

1. 查看 [USAGE_EXAMPLES.md](./USAGE_EXAMPLES.md) 中的故障排查部分
2. 检查控制台输出的错误信息
3. 确认 API 密钥配置正确
4. 验证网络连接

---

**最后更新：** 2026-01-13
**版本：** 1.0.0
