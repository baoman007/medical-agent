# Ollama 集成使用说明

## ✅ 集成完成

你的医疗 agent 项目已成功集成 Ollama 本地模型！

## 🚀 快速开始

### 1. 确保 Ollama 服务运行中

```bash
# 检查 Ollama 状态
ollama list

# 如果服务未运行，启动服务
brew services start ollama
```

### 2. 检查已安装的模型

```bash
# 查看已安装的模型
ollama list

# 应该看到:
# medical-assistant:latest  (自定义医疗助手模型)
# qwen2.5:latest           (基础模型)
```

### 3. 运行医疗 Agent

```bash
# 使用 Ollama 本地模型运行
npm start

# 或者使用 watch 模式（开发时自动重启）
npm run dev
```

## ⚙️ 配置选项

### 切换 LLM 提供商

在 `.env` 文件中修改 `LLM_PROVIDER` 变量：

```env
# 使用 Ollama 本地模型
LLM_PROVIDER=ollama

# 或使用 DeepSeek 云端 API
LLM_PROVIDER=deepseek
```

### Ollama 配置项

```env
# Ollama 服务地址
OLLAMA_BASE_URL=http://localhost:11434

# 使用的模型名称
OLLAMA_MODEL=medical-assistant
```

### 模型参数

```env
# 温度（0.0-1.0，越高越随机）
TEMPERATURE=0.7

# 最大生成 token 数
MAX_TOKENS=2000
```

## 📊 模型管理

### 查看已安装模型

```bash
ollama list
```

### 下载新模型

```bash
# 下载其他模型
ollama pull qwen2.5:14b    # 更大的模型
ollama pull llama3.2:3b    # 更快的模型
```

### 创建自定义模型

编辑 `Modelfile`，然后运行：

```bash
ollama create my-model:latest -f Modelfile
```

### 删除模型

```bash
ollama rm model-name
```

## 🎯 示例输出

运行 `npm start` 后，系统会：

1. 🦙 加载 Ollama 本地模型
2. 🔍 分析用户症状
3. 🏥 进行初步诊断
4. 💡 生成治疗建议
5. 📝 生成友好的回复

## 🔧 故障排除

### Ollama 连接失败

```bash
# 检查 Ollama 是否运行
brew services list

# 重启 Ollama
brew services restart ollama

# 测试连接
curl http://localhost:11434/api/generate -d '{
  "model": "medical-assistant",
  "prompt": "你好"
}'
```

### 模型响应错误

```bash
# 重新创建模型
ollama rm medical-assistant
ollama create medical-assistant:latest -f Modelfile
```

### 性能优化

```bash
# 使用更小的模型提升速度
# 修改 .env
OLLAMA_MODEL=qwen2.5:3b

# 或使用量化版本
OLLAMA_MODEL=qwen2.5:7b-q4_K_M
```

## 📝 API 使用

你也可以通过 API 直接调用 Ollama：

```bash
# 发送请求
curl http://localhost:11434/api/generate -d '{
  "model": "medical-assistant",
  "prompt": "我头痛怎么办？",
  "stream": false
}'

# 使用 API 调用（Node.js）
fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'medical-assistant',
    prompt: '我头痛怎么办？',
    stream: false
  })
})
```

## 🆚 对比

| 特性 | Ollama (本地) | DeepSeek (云端) |
|------|--------------|-----------------|
| 隐私性 | ✅ 数据本地 | ❌ 数据上传 |
| 速度 | ⚡ 中等（依赖硬件） | ⚡⚡ 快 |
| 成本 | ✅ 免费 | 💰 需要付费 |
| 稳定性 | ✅ 无需网络 | ⚠️ 依赖网络 |
| 模型能力 | ⚠️ 受限于本地模型 | ✅ 最先进模型 |

## 💡 提示

- 本地模型通常比云端模型慢，但更安全
- 7B 参数模型在 M1/M2 芯片上运行流畅
- 14B+ 模型可能需要更多内存和时间
- 对于生产环境，建议先用 Ollama 开发，确认后再选择云端模型

## 📚 更多资源

- [Ollama 官方文档](https://ollama.com/docs)
- [Qwen 模型](https://ollama.com/library/qwen2.5)
- [项目文档](README.md)
- [快速开始](QUICKSTART.md)
