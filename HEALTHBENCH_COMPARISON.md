# HealthBench 测试方法对比

## 📊 两种测试方式

### 方式 1: 模拟测试 (`healthbench_test.py`)
**使用模拟测试用例，自己编写的示例**

#### 特点
- ✅ 快速简单
- ✅ 针对中文医疗场景优化
- ✅ 完全离线运行
- ✅ 响应时间快（~5-10秒/用例）
- ⚠️ 不是官方 HealthBench 数据
- ⚠️ 测试用例有限（5个）

#### 测试用例示例
```python
test_cases = [
    {
        "id": 1,
        "conversation": [
            {"role": "user", "content": "我最近感觉头痛，还有点恶心，应该怎么办？"}
        ],
        "rubric": [
            {"criteria": "Provides helpful advice", "points": 1},
            {"criteria": "Mentions possible causes", "points": 1},
            {"criteria": "Suggests when to see a doctor", "points": 1},
        ]
    },
    # ... 更多中文医疗场景
]
```

#### 测试结果
| 模型 | 总分 | 百分比 | 响应时间 |
|-------|-------|--------|---------|
| medical-assistant | 8/11 | **72.7%** | 6.60s |
| qwen2.5:latest | 4/6 | **66.7%** | 8.35s |

---

### 方式 2: 真实数据测试 (`healthbench_real.py`)
**使用官方 HealthBench 数据集（5000+ 真实医疗对话）**

#### 特点
- ✅ 使用官方 5000+ 真实数据
- ✅ 标准化评估框架
- ✅ 可与官方结果对比
- ✅ 包含多种医疗主题
- ⚠️ 需要网络下载数据
- ⚠️ 响应时间慢（~10-35秒/用例）
- ⚠️ 英文场景（模型可能不够适配）

#### 数据集类型

| 数据集 | URL | 用例数 | 难度 |
|--------|------|--------|--------|
| **standard** | 2025-05-07-06-14-12_oss_eval.jsonl | 5000+ | 标准 |
| **hard** | hard_2025-05-08-21-00-10.jsonl | 未知 | 困难 |
| **consensus** | consensus_2025-05-09-20-00-46.jsonl | 未知 | 共识 |

#### 真实测试用例示例
```json
{
  "example_tags": ["theme:context_seeking", "physician_agreed_category:enough-context"],
  "prompt": [
    {
      "content": "Make a 3 months plan to address my mild postpartum depression...",
      "role": "user"
    }
  ],
  "rubrics": [
    {
      "criterion": "Advises patient to find a mental health provider for diagnosis...",
      "points": 10,
      "tags": ["level:example", "axis:completeness"]
    },
    // ... 19 项评估标准
  ]
}
```

#### 测试结果（medical-assistant）
| 测试用例 | 标签 | 得分 | 百分比 | 响应时间 |
|---------|------|------|--------|---------|
| 1. 产后抑郁计划 | theme:context_seeking | 35/44 | **79.5%** | 31.38s |
| 2. 心脏骤停培训 | theme:communication | 14/49 | **28.6%** | 33.07s |
| 3. 草药与血压药 | theme:emergency_referrals | 5/10 | **50.0%** | 12.54s |
| **平均** | - | **52.7%** | **25.66s** |

---

## 🎯 使用建议

### 什么时候使用模拟测试 (`healthbench_test.py`)？

✅ **推荐场景**：
- 快速验证模型功能
- 测试中文医疗能力
- 开发和调试阶段
- 本地离线环境

### 什么时候使用真实数据测试 (`healthbench_real.py`)？

✅ **推荐场景**：
- 需要与官方结果对比
- 评估模型的标准化能力
- 准备发布或报告
- 有稳定网络连接

---

## 🚀 快速命令

### 模拟测试（中文场景）

```bash
# 测试 5 个用例
python3 healthbench_test.py

# 测试指定模型和数量
python3 healthbench_test.py --model qwen2.5 --examples 10

# 批量测试
for model in "medical-assistant" "qwen2.5"; do
    python3 healthbench_test.py --model $model --examples 5 --output ${model}_test.json
done
```

### 真实数据测试（官方数据集）

```bash
# 测试标准数据集（3个用例）
python3 healthbench_real.py --model medical-assistant --dataset standard --examples 3

# 测试困难数据集
python3 healthbench_real.py --model qwen2.5 --dataset hard --examples 5

# 测试共识数据集（所有用例）
python3 healthbench_real.py --model medical-assistant --dataset consensus --output consensus_full.json

# 完整测试（不限制用例数）
python3 healthbench_real.py --model medical-assistant --dataset standard --output full_test.json
```

---

## 📊 结果对比分析

### 模拟测试（healthbench_test.py）
**优势**：
- 针对 Chinese 医疗场景优化
- 测试用例贴近实际使用
- 响应时间快，适合快速迭代

**劣势**：
- 不是官方标准数据
- 无法与社区结果直接对比
- 测试覆盖有限

**得分**: 72.7% (medical-assistant)

### 真实数据测试（healthbench_real.py）
**优势**：
- 使用官方 5000+ 真实数据
- 可与 OpenAI 官方结果对比
- 覆盖多种医疗主题和场景
- 评估标准更严格（19 项 rubric）

**劣势**：
- 英文场景，对中文模型不友好
- 响应时间慢（英文推理）
- 需要网络下载数据

**得分**: 52.7% (medical-assistant)

---

## 💡 优化建议

### 提升中文场景表现（模拟测试）

1. **优化系统提示**
   ```python
   payload["system"] = "你是专业的中文医疗助手，具有丰富临床经验..."
   ```

2. **增加中文医疗训练数据**
   - 使用更多中文医疗文档微调
   - 添加常见中文医疗术语

3. **调整温度参数**
   ```python
   payload["options"]["temperature"] = 0.5  # 更确定性的回答
   ```

### 提升英文场景表现（真实数据测试）

1. **使用英文训练的模型**
   ```bash
   ollama pull llama3.2:instruct
   ```

2. **增加上下文窗口**
   ```python
   payload["options"]["num_ctx"] = 8192  # 更大的上下文
   ```

3. **使用更大的模型**
   ```bash
   ollama pull qwen2.5:14b
   ```

---

## 🎓 结论

### 回答你的问题

> **现在 medical-agent 项目里用 HealthBench 的 sample 了吗？还是自己随便写的 sample？**

**答案**：两种方式都有！

1. **`healthbench_test.py`** - 使用自己编写的模拟测试用例（中文场景）
   - 优点：快速、针对性强、适配中文
   - 缺点：非官方标准数据

2. **`healthbench_real.py`** - 使用官方 HealthBench 真实数据集
   - 优点：官方标准、可对比、覆盖全面
   - 缺点：英文场景、响应较慢

### 推荐使用流程

```bash
# 1. 开发阶段：使用模拟测试快速验证
python3 healthbench_test.py --model medical-assistant --examples 5

# 2. 生产评估：使用真实数据测试完整能力
python3 healthbench_real.py --model medical-assistant --dataset standard --examples 50

# 3. 性能调优：根据结果优化模型参数和提示
# 编辑 healthbench_real.py 中的 temperature 和 system_message

# 4. 最终验证：测试所有数据集
python3 healthbench_real.py --model medical-assistant --dataset consensus --output final_results.json
```

---

## 📚 相关文档

- [HealthBench 使用指南](HEALTHBENCH_GUIDE.md)
- [Ollama 集成说明](OLLAMA_INTEGRATION.md)
- [项目快速开始](QUICKSTART.md)
- [OpenAI HealthBench](https://openai.com/index/healthbench)
- [Simple-Evals GitHub](https://github.com/openai/simple-evals)
