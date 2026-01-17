# Baichuan-M3 风格医疗助手集成指南

## 📖 概述

已成功创建 `baichuan-m3-medical` 模型，这是一个基于 Qwen2.5 但采用 Baichuan-M3 技术架构风格的医疗助手模型。

## ✅ 已完成的工作

1. **创建模型** - `baichuan-m3-medical:latest`
2. **系统提示词** - 采用 Baichuan-M3 的专业医疗框架
3. **参数优化** - 温度、上下文长度等
4. **测试验证** - 成功运行并响应

---

## 🎯 模型特性

### Baichuan-M3 风格特点

| 特性 | 说明 |
|------|------|
| **技术架构** | 模拟 Baichuan-M3 的深度理解能力 |
| **专业框架** | 症状理解 → 可能原因 → 自护建议 → 就医建议 → 免责声明 |
| **同理心** | 温暖、支持性的语言风格 |
| **结构化** | 清晰的编号回答格式 |

### 系统提示词框架

```markdown
## 专业原则

1. 准确性原则 - 基于可靠医学信息
2. 安全性原则 - 始终包含免责声明
3. 同理心原则 - 理解用户的焦虑
4. 清晰性原则 - 简单易懂的解释

## 回答框架

1. 症状理解 - 确认对症状的理解
2. 可能原因 - 列出常见可能原因
3. 自护建议 - 提供实用的自我护理方法
4. 就医建议 - 何时需要寻求医疗帮助
5. 免责声明 - 明确说明建议仅供参考
```

---

## 🚀 使用方法

### 1. 交互式对话

```bash
ollama run baichuan-m3-medical
```

### 2. 管道输入

```bash
echo "你好，我最近感觉头痛，有什么建议吗？" | ollama run baichuan-m3-medical
```

### 3. API 调用

```bash
curl http://localhost:11434/api/generate -d '{
  "model": "baichuan-m3-medical",
  "prompt": "你好，请介绍一下你自己"
}'
```

### 4. HealthBench 评估

```bash
# 使用 DeepSeek 评分器评估
python3 healthbench_deepseek_eval.py --model baichuan-m3-medical --examples 5

# 使用启发式评分
python3 healthbench_test.py --model baichuan-m3-medical --examples 5
```

### 5. Web 服务

更新 `.env` 文件：

```env
OLLAMA_MODEL=baichuan-m3-medical
```

然后启动 Web 服务：

```bash
npm run web
```

---

## 📊 模型对比

| 模型 | 基础模型 | 特点 | 适用场景 |
|------|---------|------|---------|
| `medical-assistant` | Qwen2.5 | 标准医疗助手 | 通用医疗咨询 |
| `baichuan-m3-medical` | Qwen2.5 | Baichuan-M3 风格 | 结构化回答、同理心 |
| `qwen2.5:latest` | Qwen2.5 | 原始模型 | 通用任务 |

---

## 🔧 技术细节

### Modelfile 配置

```dockerfile
FROM qwen2.5:latest

PARAMETER temperature 0.7
PARAMETER num_ctx 4096
PARAMETER top_p 0.9
PARAMETER top_k 40
PARAMETER repeat_penalty 1.1

SYSTEM """
Baichuan-M3 风格的医疗助手系统提示词
...
"""
```

### 参数说明

| 参数 | 值 | 说明 |
|------|-----|------|
| `temperature` | 0.7 | 平衡创造性和准确性 |
| `num_ctx` | 4096 | 上下文长度 |
| `top_p` | 0.9 | 核采样参数 |
| `top_k` | 40 | Top-k 采样 |
| `repeat_penalty` | 1.1 | 重复惩罚 |

---

## 🧪 测试示例

### 测试 1: 头痛咨询

```bash
echo "我最近感觉头痛，有什么建议吗？" | ollama run baichuan-m3-medical
```

**预期响应**：
- ✅ 按照系统提示词的 5 步框架回答
- ✅ 包含详细的可能原因分析
- ✅ 提供实用的自护建议
- ✅ 明确的就医建议
- ✅ 完整的免责声明

### 测试 2: 发热咨询

```bash
echo "我发烧38度，该怎么办？" | ollama run baichuan-m3-medical
```

### 测试 3: 紧急情况

```bash
echo "我孩子发烧39度抽搐了，我该怎么办？" | ollama run baichuan-m3-medical
```

---

## 📈 HealthBench 评估

### 运行评估

```bash
# DeepSeek 评分（推荐）
python3 healthbench_deepseek_eval.py \
  --model baichuan-m3-medical \
  --examples 10 \
  --output baichuan_m3_deepseek.json

# 对比其他模型
python3 healthbench_deepseek_eval.py \
  --model medical-assistant \
  --examples 10 \
  --output medical_assistant_deepseek.json
```

### 对比结果

```bash
# 查看平均分
cat baichuan_m3_deepseek.json | jq '.average_percentage'
cat medical_assistant_deepseek.json | jq '.average_percentage'
```

---

## 💡 使用建议

### 何时使用 Baichuan-M3 风格

✅ **推荐场景**：
- 需要结构化回答
- 强调同理心和专业性
- 需要详细的分析框架
- 医疗健康咨询

⚠️ **不推荐场景**：
- 需要简洁快速回答
- 非医疗领域任务
- 需要创造性自由度

### 与其他模型对比

| 场景 | 推荐模型 | 理由 |
|------|---------|------|
| 通用医疗咨询 | `medical-assistant` | 平衡性好 |
| 结构化专业回答 | `baichuan-m3-medical` | 框架完整 |
| 快速简单回答 | `qwen2.5:latest` | 原始速度快 |

---

## 📚 相关文件

| 文件 | 说明 |
|------|------|
| `Modelfile.baichuan-m3` | Baichuan-M3 风格模型配置 |
| `setup_baichuan.py` | Baichuan 集成工具脚本 |
| `BAICHUAN_M3_GUIDE.md` | 本文档 |

---

## 🔧 自定义调整

### 修改系统提示词

编辑 `Modelfile.baichuan-m3`：

```dockerfile
SYSTEM """
你的自定义系统提示词
...
"""
```

然后重新创建模型：

```bash
ollama create baichuan-m3-medical -f Modelfile.baichuan-m3
```

### 调整参数

根据需求调整：

```dockerfile
# 更有创造性
PARAMETER temperature 0.9

# 更准确稳定
PARAMETER temperature 0.5

# 更长上下文
PARAMETER num_ctx 8192
```

---

## 🎊 总结

### 已完成

✅ 创建 `baichuan-m3-medical` 模型
✅ 配置 Baichuan-M3 风格的系统提示词
✅ 测试验证运行正常
✅ 集成到 HealthBench 评估系统

### 可用的模型

1. `medical-assistant` - 标准医疗助手
2. `baichuan-m3-medical` - Baichuan-M3 风格（新增）
3. `qwen2.5:latest` - 原始模型

### 快速开始

```bash
# 交互式使用
ollama run baichuan-m3-medical

# HealthBench 评估
python3 healthbench_deepseek_eval.py --model baichuan-m3-medical --examples 5

# Web 服务（更新 .env 中的 OLLAMA_MODEL）
npm run web
```

---

**Baichuan-M3 风格的医疗助手已成功集成！** 🎉
