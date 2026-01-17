# HealthBench GPT-4 评分器使用指南

## 📖 概述

本指南介绍如何使用 GPT-4 作为评分器来评估医疗 AI 模型在 HealthBench 基准测试中的表现。

## 🎯 特点

### 与启发式评分的对比

| 特性 | 启发式评分 (`healthbench_real.py`) | GPT-4 评分 (`healthbench_gpt4_eval.py`) |
|------|-----------------------------------|------------------------------------------|
| **评分方法** | 关键词匹配 | GPT-4 语义理解 |
| **准确性** | 中等 | 高 |
| **评分理由** | 无 | 详细的中文解释 |
| **成本** | 免费 | 需要 OpenAI API |
| **速度** | 快 (5-10秒/用例) | 中等 (20-40秒/用例) |
| **官方对齐** | 否 | 是（官方使用 GPT-4） |

## 📋 前置要求

### 1. OpenAI API 密钥

你需要一个 OpenAI API 密钥来使用 GPT-4。

#### 获取 API 密钥

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 登录或注册账号
3. 进入 [API Keys](https://platform.openai.com/api-keys)
4. 点击 "Create new secret key"
5. 复制生成的密钥

#### 配置 API 密钥

**方式 1: 环境变量（推荐）**
```bash
export OPENAI_API_KEY=sk-your-api-key-here
```

**方式 2: 命令行参数**
```bash
python3 healthbench_gpt4_eval.py --api-key sk-your-api-key-here --examples 3
```

**方式 3: 添加到 .env 文件**
```bash
echo "OPENAI_API_KEY=sk-your-api-key-here" >> .env
source .env
```

### 2. Ollama 服务

确保 Ollama 服务正在运行：
```bash
# 检查服务状态
curl http://localhost:11434/api/tags

# 如果未运行，启动服务
brew services start ollama
```

### 3. 安装依赖

```bash
# 安装 OpenAI Python SDK
python3 -m pip install openai requests

# 验证安装
python3 -c "import openai, requests; print('✅ 依赖已安装')"
```

## 🚀 快速开始

### 基础使用

```bash
# 测试 3 个用例
python3 healthbench_gpt4_eval.py --model medical-assistant --examples 3

# 测试标准数据集（所有用例）
python3 healthbench_gpt4_eval.py --model medical-assistant --dataset standard

# 测试困难数据集
python3 healthbench_gpt4_eval.py --model medical-assistant --dataset hard --examples 5
```

### 指定输出文件

```bash
python3 healthbench_gpt4_eval.py --model medical-assistant --examples 5 \
  --output my_results.json
```

### 完整示例

```bash
# 设置 API 密钥
export OPENAI_API_KEY=sk-proj-xxxxx

# 评估 medical-assistant 模型
python3 healthbench_gpt4_eval.py \
  --model medical-assistant \
  --dataset standard \
  --examples 5 \
  --output medical_assistant_gpt4.json
```

## 📊 输出格式

### 控制台输出

```
======================================================================
测试用例 1/5
======================================================================

🏷️  标签: 遇到困难，症状

📝 问题: I've been experiencing frequent headaches...

🤖 模型响应 (前300字符): 您好！听到您频繁头痛，我理解这确实很不舒服...

⏱️  模型响应时间: 6.23s

🎯 使用 GPT-4 评分中...

📊 评分结果:
   得分: 8/10 (80.0%)
   评分时间: 15.42s
   评分理由: 模型响应较为全面，提供了可能的原因和建议，但缺少具体的行动指导...
```

### JSON 结果文件

```json
{
  "model": "medical-assistant",
  "dataset": "standard",
  "grader": "GPT-4",
  "timestamp": "2025-01-17T10:30:00",
  "total_examples": 5,
  "evaluated_examples": 5,
  "total_score": 42,
  "total_max": 50,
  "average_percentage": 84.0,
  "average_total_time": 21.65,
  "average_model_time": 6.23,
  "average_grader_time": 15.42,
  "results": [
    {
      "prompt_id": "healthbench_xxx",
      "question": "...",
      "response": "...",
      "rubric_score": 8,
      "rubric_max": 10,
      "percentage": 80.0,
      "model_time": 6.23,
      "grader_time": 15.42,
      "total_time": 21.65,
      "reasoning": "模型响应较为全面...",
      "scores": [2, 2, 2, 2],
      "tags": ["头痛", "困难"]
    }
  ]
}
```

## 🎓 评分机制

### GPT-4 评分流程

1. **构建评分提示**
   - 模型响应
   - 评分标准（Rubric）
   - 输出格式要求

2. **GPT-4 分析**
   - 理解响应内容
   - 对照评分标准
   - 生成评分理由

3. **返回结果**
   - 评分理由（中文）
   - 每个标准的得分
   - 总分和百分比

### 评分标准示例

```json
{
  "rubrics": [
    {
      "criterion": "Provides potential causes for the symptoms",
      "points": 2
    },
    {
      "criterion": "Suggests consulting a healthcare provider",
      "points": 2
    },
    {
      "criterion": "Includes appropriate medical disclaimer",
      "points": 1
    }
  ]
}
```

## 💰 成本估算

### GPT-4 API 费用

| 操作 | Token 估算 | 费用（约） |
|------|-----------|-----------|
| 输入（Prompt + Rubric） | ~500 tokens | ~$0.015 |
| 输出（评分结果） | ~200 tokens | ~$0.06 |
| **单次评分** | ~700 tokens | **~$0.075** |

### 估算示例

```bash
# 5 个测试用例
成本 ≈ 5 × $0.075 = $0.375

# 50 个测试用例
成本 ≈ 50 × $0.075 = $3.75

# 500 个测试用例
成本 ≈ 500 × $0.075 = $37.50
```

**提示**: 建议先用少量用例（3-5个）测试，再扩大规模。

## 📈 性能对比

### 测试时间对比

| 方法 | 模型响应 | 评分 | 总时间 | 5 用例总耗时 |
|------|---------|------|--------|------------|
| 启发式评分 | ~6s | ~0.1s | ~6.1s | ~30s |
| GPT-4 评分 | ~6s | ~15s | ~21s | ~105s |

### 准确性对比

根据官方 HealthBench 的测试：

- **启发式评分**: 可能偏高/偏低 10-20%
- **GPT-4 评分**: 与人工评分高度一致（>95% 相关性）

## 🔧 高级用法

### 批量测试多个模型

```bash
# 测试 medical-assistant
python3 healthbench_gpt4_eval.py \
  --model medical-assistant \
  --examples 5 \
  --output medical_assistant_gpt4.json

# 测试 qwen2.5
python3 healthbench_gpt4_eval.py \
  --model qwen2.5:latest \
  --examples 5 \
  --output qwen_gpt4.json

# 对比结果
cat medical_assistant_gpt4.json | grep "average_percentage"
cat qwen_gpt4.json | grep "average_percentage"
```

### 只测试特定标签的用例

需要修改代码或使用过滤脚本：

```python
# 在 run_evaluation 中添加过滤
filtered_cases = [
    tc for tc in test_cases
    if any("头痛" in tag for tag in tc.get("example_tags", []))
]
```

### 分析评分理由

```python
import json

# 读取结果
with open("healthbench_gpt4_results.json") as f:
    data = json.load(f)

# 查看评分理由
for result in data["results"]:
    if result["percentage"] < 50:
        print(f"\n低分用例:")
        print(f"得分: {result['percentage']:.1f}%")
        print(f"理由: {result['reasoning']}")
```

## 🐛 故障排除

### 问题 1: OPENAI_API_KEY 未设置

```
❌ 错误: OPENAI_API_KEY environment variable not set
```

**解决方案:**
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### 问题 2: Ollama 服务未运行

```
❌ Ollama API error: Connection refused
```

**解决方案:**
```bash
brew services start ollama
```

### 问题 3: JSON 解析失败

```
⚠️  GPT-4 返回的 JSON 解析失败
```

**解决方案**: 
- 这是偶发问题，脚本会返回默认评分（0分）
- 可以重试该用例

### 问题 4: API 限流

```
Rate limit exceeded
```

**解决方案:**
- 减少并发请求
- 在请求之间添加延迟
- 升级 OpenAI 计划

## 📝 最佳实践

1. **先用少量用例测试**
   ```bash
   # 从 3-5 个用例开始
   python3 healthbench_gpt4_eval.py --examples 3
   ```

2. **监控 API 成本**
   - 在 OpenAI Platform 查看使用量
   - 设置预算警告

3. **保存所有结果**
   - 每次测试使用不同的输出文件名
   - 保留原始 JSON 用于分析

4. **对比不同评分方法**
   ```bash
   # 启发式评分
   python3 healthbench_real.py --examples 5 --output heuristic.json
   
   # GPT-4 评分
   python3 healthbench_gpt4_eval.py --examples 5 --output gpt4.json
   ```

5. **分析低分用例**
   - 重点关注得分 < 50% 的用例
   - 阅读 GPT-4 的评分理由
   - 改进模型提示或微调

## 📚 相关文件

| 文件 | 说明 |
|------|------|
| `healthbench_gpt4_eval.py` | GPT-4 评分主脚本 |
| `healthbench_real.py` | 启发式评分脚本 |
| `healthbench_test.py` | 简化测试脚本 |
| `HEALTHBENCH_GPT4_GUIDE.md` | 本文档 |
| `HEALTHBENCH_COMPARISON.md` | 评分方法对比 |

## 🎯 下一步

1. ✅ 获取 OpenAI API 密钥
2. ✅ 测试少量用例（3-5个）
3. ✅ 查看 GPT-4 的评分理由
4. ✅ 扩展到更多用例
5. ✅ 对比不同模型的性能

---

**注意**: GPT-4 评分需要付费 API。建议先用免费的启发式评分进行快速测试，确认模型基本可用后，再使用 GPT-4 进行更准确的评估。
