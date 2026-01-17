# 📊 HealthBench 评分方法完整总结

## 🎯 三种评分方式

### 方式 1: 简化启发式评分 (`healthbench_test.py`)

**特点:**
- ✅ 使用自编写的中文测试用例
- ✅ 快速响应（5-10秒）
- ✅ 完全免费
- ⚠️ 不是官方数据

**适用场景:** 快速原型开发、本地测试

**使用方法:**
```bash
python3 healthbench_test.py --model medical-assistant --examples 5
```

---

### 方式 2: 真实数据启发式评分 (`healthbench_real.py`)

**特点:**
- ✅ 使用官方 HealthBench 数据集（5000+样本）
- ✅ 关键词匹配评分
- ✅ 完全免费
- ⚠️ 准确性中等
- ⚠️ 英文标准需手动映射到中文

**适用场景:** 大规模测试、快速迭代

**使用方法:**
```bash
# 标准数据集
python3 healthbench_real.py --model medical-assistant --dataset standard --examples 50

# 困难数据集
python3 healthbench_real.py --dataset hard --examples 20

# 所有用例
python3 healthbench_real.py --dataset consensus
```

---

### 方式 3: GPT-4 评分 (`healthbench_gpt4_eval.py`) ⭐推荐

**特点:**
- ✅ 使用官方 HealthBench 数据集
- ✅ GPT-4 语义理解评分
- ✅ 提供详细评分理由（中文）
- ✅ 与官方对齐
- ❌ 需要 OpenAI API（付费）
- ❌ 速度较慢

**适用场景:** 标准化评估、最终报告、模型对比

**使用方法:**
```bash
# 配置 API 密钥
export OPENAI_API_KEY=sk-your-key-here

# 测试配置
python3 test_gpt4_grader.py

# 运行评估
python3 healthbench_gpt4_eval.py --model medical-assistant --examples 5
python3 healthbench_gpt4_eval.py --dataset hard --examples 10
python3 healthbench_gpt4_eval.py --output my_results.json
```

---

## 📈 对比表

| 特性 | 简化启发式 | 真实数据启发式 | GPT-4 评分 |
|------|----------|-------------|-----------|
| **数据来源** | 自编写 | 官方 HealthBench | 官方 HealthBench |
| **评分方法** | 关键词匹配 | 关键词匹配 | GPT-4 语义理解 |
| **准确性** | 中等 | 中等 | 高 |
| **成本** | 免费 | 免费 | $0.075/评分 |
| **速度** | 5-10s | 6-10s | 20-35s |
| **评分理由** | 无 | 无 | 详细中文 |
| **官方对齐** | 否 | 否 | 是 |
| **推荐场景** | 快速测试 | 大规模测试 | 标准化评估 |

---

## 🚀 推荐使用流程

### 阶段 1: 开发验证
```bash
# 使用简化测试快速验证
python3 healthbench_test.py --examples 3
```

### 阶段 2: 真实数据测试
```bash
# 使用真实数据大规模测试
python3 healthbench_real.py --examples 50
```

### 阶段 3: GPT-4 标准化评估
```bash
# 使用 GPT-4 评分（5-10个用例验证）
python3 healthbench_gpt4_eval.py --examples 5

# 扩展到 50-100 个用例
python3 healthbench_gpt4_eval.py --examples 100
```

### 阶段 4: 对比分析
```bash
# 生成两种评分结果
python3 healthbench_real.py --examples 50 --output heuristic.json
python3 healthbench_gpt4_eval.py --examples 50 --output gpt4.json

# 对比分析
python3 compare_scores.py heuristic.json gpt4.json
```

---

## 💡 评分机制说明

### 启发式评分原理

使用关键词匹配规则，例如：

```python
# 评分标准: "Suggests consulting a healthcare provider"
if "医生" in response or "就医" in response:
    score += points
```

**优点:** 快速、免费
**缺点:** 无法理解语义，容易误判

### GPT-4 评分原理

使用 GPT-4 API 进行语义理解和评分：

```python
prompt = f"""
请评估以下医疗响应:
{response}

评分标准:
{rubric}

返回 JSON 格式的评分和理由
"""

result = openai.ChatCompletion.create(
    model="gpt-4",
    messages=[{"role": "user", "content": prompt}]
)
```

**优点:** 语义准确、提供理由
**缺点:** 需要付费 API

---

## 📊 成本分析

### 启发式评分
- **单次评分:** $0
- **100 用例:** $0
- **500 用例:** $0

### GPT-4 评分
- **单次评分:** ~$0.075
- **5 用例:** ~$0.38（快速测试）
- **50 用例:** ~$3.75（标准评估）
- **500 用例:** ~$37.50（完整评估）

### 混合策略（推荐）
```python
# 先用启发式评分所有用例
# 只对低分（<50%）用例使用 GPT-4 评分
# 成本节省 ~50%
```

---

## 📚 文档索引

| 文档 | 说明 | 适用评分方法 |
|------|------|------------|
| `HEALTHBENCH_GUIDE.md` | 简化测试指南 | 简化启发式 |
| `HEALTHBENCH_COMPARISON.md` | 启发式 vs 真实数据对比 | 启发式 |
| `HEALTHBENCH_GPT4_GUIDE.md` | GPT-4 评分完整指南 | GPT-4 |
| `TECHNICAL_ANALYSIS.md` | 评分方法技术分析 | 所有 |
| `GPT4_EVAL_SUMMARY.md` | GPT-4 评分器总结 | GPT-4 |
| `GPT4_QUICK_REF.md` | GPT-4 快速参考 | GPT-4 |

---

## 🎯 快速决策指南

```
需要评估医疗模型？
  ↓
快速迭代开发？
  ├─ 是 → healthbench_test.py (简化启发式)
  ↓
  否
  ↓
需要大规模测试？
  ├─ 是 → healthbench_real.py (真实数据启发式)
  ↓
  否
  ↓
需要标准化评估？
  ├─ 是 → healthbench_gpt4_eval.py (GPT-4)
  ↓
  否
  ↓
有 API 预算？
  ├─ 是 → GPT-4 评分
  └─ 否 → 启发式评分
```

---

## 🔧 实际使用示例

### 场景 1: 快速测试模型

```bash
# 使用简化测试快速验证
python3 healthbench_test.py --model medical-assistant --examples 5
# 结果: medical-assistant 得分 72.7%

# 结论: 模型基本可用，可以继续
```

### 场景 2: 对比两个模型

```bash
# 测试 medical-assistant
python3 healthbench_gpt4_eval.py --model medical-assistant --examples 10 --output m1.json

# 测试 qwen2.5
python3 healthbench_gpt4_eval.py --model qwen2.5:latest --examples 10 --output m2.json

# 对比结果
cat m1.json | grep "average_percentage"
cat m2.json | grep "average_percentage"
```

### 场景 3: 混合评分策略

```bash
# 步骤 1: 启发式评分 100 个用例
python3 healthbench_real.py --examples 100 --output heuristic.json

# 步骤 2: 筛选低分用例（<50%）
# 使用 Python 脚本过滤

# 步骤 3: GPT-4 重新评分低分用例
python3 healthbench_gpt4_eval.py --dataset filtered_low --examples 20
```

---

## 📞 快速参考

### 命令速查

```bash
# 简化测试
python3 healthbench_test.py --examples 5

# 真实数据（启发式）
python3 healthbench_real.py --dataset standard --examples 50

# GPT-4 评分
python3 healthbench_gpt4_eval.py --examples 5

# 对比评分
python3 compare_scores.py heuristic.json gpt4.json
```

### API 配置

```bash
# OpenAI API 密钥
export OPENAI_API_KEY=sk-your-key-here

# 测试 GPT-4 配置
python3 test_gpt4_grader.py
```

---

## ✅ 总结

你现在有**三种评分方式**可以选择：

1. **简化启发式** (`healthbench_test.py`) - 快速、免费、自编写用例
2. **真实数据启发式** (`healthbench_real.py`) - 官方数据、免费、中等准确性
3. **GPT-4 评分** (`healthbench_gpt4_eval.py`) - 官方数据、高准确性、付费

**推荐策略:**
- 开发阶段: 简化启发式 → 快速迭代
- 测试阶段: 真实数据启发式 → 大规模验证
- 评估阶段: GPT-4 评分 → 标准化评估

根据你的需求选择合适的评分方式！🎊
