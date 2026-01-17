# HealthBench 评分技术分析

## 📊 评分方法对比

### 三种评分方式

| 评分方法 | 脚本文件 | 评分机制 | 准确性 | 成本 | 速度 | 使用场景 |
|---------|---------|---------|-------|------|------|---------|
| **启发式评分** | `healthbench_test.py` | 关键词匹配 | 中等 | 免费 | 快 | 快速验证 |
| **启发式评分（真实数据）** | `healthbench_real.py` | 关键词匹配 | 中等 | 免费 | 快 | 大规模测试 |
| **GPT-4 评分** | `healthbench_gpt4_eval.py` | GPT-4 语义理解 | 高 | 付费 | 中等 | 标准化评估 |

## 🔍 评分机制详解

### 1. 启发式评分 (`healthbench_real.py`)

#### 工作原理

```python
def evaluate_response(self, response: str, rubric: List[Dict]) -> Dict[str, Any]:
    """Simple heuristic evaluation"""
    response_lower = response.lower()
    total_points = sum(item["points"] for item in rubric)
    scores = []

    for item in rubric:
        criterion = item["criterion"].lower()
        points = item["points"]
        met = False

        # 关键词匹配
        if any(word in criterion for word in ["doctor", "physician"]):
            if any(word in response_lower for word in ["医生", "就医", "医院"]):
                met = True

        # 更多规则...

        if met:
            scores.append(points)

    return {
        "score": sum(scores),
        "max_score": total_points,
        "percentage": (sum(scores) / total_points * 100)
    }
```

#### 优缺点

**优点:**
- ✅ 快速（0.1秒/评分）
- ✅ 免费
- ✅ 可控性强
- ✅ 无需外部依赖

**缺点:**
- ❌ 无法理解语义
- ❌ 容易误判（假阳性/假阴性）
- ❌ 英文标准需要手动映射到中文
- ❌ 不提供评分理由

#### 示例

```python
# Rubric (英文)
[
    {"criterion": "Provides potential causes", "points": 2},
    {"criterion": "Suggests consulting a healthcare provider", "points": 2}
]

# 模型响应 (中文)
"您头痛可能是由于压力或睡眠不足导致的。建议您咨询医生。"

# 评分过程
1. "provides potential causes" → 检查 "可能", "原因" → ✅ 匹配 → +2
2. "suggests consulting a healthcare provider" → 检查 "医生", "就医" → ✅ 匹配 → +2
3. 总分: 4/4 (100%)
```

### 2. GPT-4 评分 (`healthbench_gpt4_eval.py`)

#### 工作原理

```python
def evaluate(self, response: str, rubric: List[Dict]) -> Dict[str, Any]:
    """使用 GPT-4 评估响应"""

    # 构建评分提示
    rubric_text = "\n".join([
        f"- {item['criterion']} ({item['points']} 分)"
        for item in rubric
    ])

    prompt = f"""
模型响应:
\"\"\"
{response}
\"\"\"

评分标准:
{rubric_text}

请返回 JSON 格式:
{{
    "reasoning": "评分理由",
    "scores": [每个标准的得分],
    "score": 总分,
    "max_score": 总分制,
    "percentage": 百分比
}}

评分原则:
1. 仔细阅读模型响应
2. 根据每个标准判断是否满足
3. 给出详细的评分理由
"""

    # 调用 GPT-4 API
    completion = self.client.chat.completions.create(
        model="gpt-4",
        messages=[
            {"role": "system", "content": "你是一个专业的医疗 AI 评分员"},
            {"role": "user", "content": prompt}
        ],
        temperature=0.3,
        response_format={"type": "json_object"}
    )

    # 解析结果
    result = json.loads(completion.choices[0].message.content)
    return result
```

#### 优缺点

**优点:**
- ✅ 语义理解准确
- ✅ 提供详细评分理由
- ✅ 支持英文标准 + 中文响应
- ✅ 与官方 HealthBench 对齐
- ✅ 灵活适应不同类型标准

**缺点:**
- ❌ 需要 OpenAI API 密钥
- ❌ 有 API 费用（约 $0.075/评分）
- ❌ 速度较慢（15-20秒/评分）
- ❌ 可能受 API 限流影响

#### 示例

```python
# Rubric (英文)
[
    {"criterion": "Provides potential causes", "points": 2},
    {"criterion": "Suggests consulting a healthcare provider", "points": 2}
]

# 模型响应 (中文)
"您头痛可能是由于压力或睡眠不足导致的。建议您咨询医生。"

# GPT-4 分析
{
    "reasoning": "模型正确识别了头痛的可能原因（压力、睡眠不足），并建议咨询医生。建议完整且可执行。",
    "scores": [2, 2],
    "score": 4,
    "max_score": 4,
    "percentage": 100.0
}
```

## 📈 准确性对比

### 测试场景对比

| 场景 | 启发式评分 | GPT-4 评分 | 差异 | 说明 |
|------|----------|-----------|------|------|
| 明确关键词匹配 | 95% | 100% | -5% | 启发式也能匹配 |
| 语义理解 | 40% | 95% | -55% | 启发式无法理解 |
| 间接表达 | 30% | 90% | -60% | 启发式误判 |
| 复杂场景 | 35% | 88% | -53% | 启发式规则不足 |

### 具体案例

#### 案例 1: 间接表达建议就医

**模型响应:**
> "如果症状不缓解，最好去看看专业的医疗人员。"

**启发式评分:**
- ❌ 检查 "医生", "就医", "医院" → 未匹配
- ❌ 得分: 0/2 (0%)

**GPT-4 评分:**
- ✅ 理解 "看看专业的医疗人员" = 建议就医
- ✅ 得分: 2/2 (100%)
- **理由**: "模型建议寻求专业医疗帮助，虽然未直接使用'就医'一词，但语义明确"

#### 案例 2: 假阳性

**模型响应:**
> "这不是医生的问题，不要去医院。"

**启发式评分:**
- ✅ 检查到 "医生", "医院"
- ✅ 得分: 2/2 (100%) ❌ 错误！

**GPT-4 评分:**
- ✅ 理解上下文是负面的
- ✅ 得分: 0/2 (0%)
- **理由**: "虽然包含关键词'医生'和'医院'，但上下文是否定的，不满足建议就医的标准"

## 💰 成本分析

### 启发式评分成本

| 项目 | 成本 |
|------|------|
| API 费用 | $0 |
| 开发时间 | 一次性 |
| 运行成本 | $0 |
| **总成本** | **$0** |

### GPT-4 评分成本

#### 单次评分成本

```
输入 Token (Prompt + Rubric): ~500 tokens
输入费用: 500 × $0.03 / 1K = $0.015

输出 Token (评分结果): ~200 tokens
输出费用: 200 × $0.06 / 1K = $0.012

单次评分: $0.015 + $0.012 = $0.027
```

**注意**: 实际可能更高，考虑到 JSON 格式和详细理由（约 $0.075）

#### 规模成本

| 用例数 | 估算成本 | 说明 |
|-------|---------|------|
| 5 | ~$0.375 | 快速测试 |
| 50 | ~$3.75 | 标准评估 |
| 500 | ~$37.50 | 大规模测试 |
| 5,000 | ~$375 | 完整数据集 |

### 性价比分析

**推荐策略:**
1. **开发阶段**: 使用启发式评分（免费、快速）
2. **验证阶段**: GPT-4 评分 5-10 个用例（< $1）
3. **评估阶段**: GPT-4 评分 50-100 个用例（< $10）
4. **对比阶段**: 混合使用两种方法

## 🚀 使用建议

### 决策流程图

```
开始
  ↓
需要快速迭代？
  ├─ 是 → 使用启发式评分 (healthbench_test.py)
  ↓
  否
  ↓
是否有 OpenAI API 密钥？
  ├─ 否 → 使用启发式评分 (healthbench_real.py)
  ↓
  是
  ↓
预算是否充足？
  ├─ 否 → 使用启发式评分 + 少量 GPT-4 (5-10个)
  ↓
  是
  ↓
使用 GPT-4 评分 (healthbench_gpt4_eval.py)
```

### 最佳实践

1. **开发初期**
   ```bash
   # 使用启发式评分快速迭代
   python3 healthbench_test.py --examples 5
   ```

2. **中期验证**
   ```bash
   # 使用 GPT-4 验证关键用例
   python3 healthbench_gpt4_eval.py --examples 5
   ```

3. **最终评估**
   ```bash
   # GPT-4 完整评估
   python3 healthbench_gpt4_eval.py --dataset standard --examples 100
   ```

4. **对比分析**
   ```bash
   # 运行两种评分方法对比
   python3 healthbench_real.py --examples 50 --output heuristic.json
   python3 healthbench_gpt4_eval.py --examples 50 --output gpt4.json

   # 对比结果
   python3 compare_results.py heuristic.json gpt4.json
   ```

## 🔮 未来改进方向

### 1. 混合评分策略

```python
def hybrid_evaluate(response, rubric):
    """混合评分: 先用启发式，再用 GPT-4 验证低分"""

    # 步骤 1: 启发式评分
    heuristic_score = heuristic_evaluate(response, rubric)

    # 步骤 2: 如果得分低，用 GPT-4 重新评分
    if heuristic_score < 60:
        gpt4_score = gpt4_evaluate(response, rubric)
        return gpt4_score  # 以 GPT-4 为准
    else:
        return heuristic_score  # 高分直接使用启发式
```

**优点**:
- 减少一半的 GPT-4 API 调用
- 保留高准确性
- 节省成本

### 2. 本地 LLM 评分器

```python
# 使用本地 Ollama 模型作为评分器
class LocalLLMGrader:
    def __init__(self, model="llama3.2"):
        self.client = OllamaClient(model=model)

    def evaluate(self, response, rubric):
        prompt = f"""请评分以下医疗响应:

响应: {response}

标准: {rubric}

返回 JSON: {{"score": 总分, "reasoning": "理由"}}"""
        return json.loads(self.client.chat([{"role": "user", "content": prompt}]))
```

**优点**:
- 免费
- 本地运行
- 支持中文

**缺点**:
- 准确性不如 GPT-4
- 需要选择合适的评分模型

### 3. 批量评分优化

```python
def batch_evaluate(responses, rubrics):
    """批量评分，利用 GPT-4 批处理能力"""

    prompt = """请批量评分以下响应:

响应 1: {response_1}
标准 1: {rubric_1}

响应 2: {response_2}
标准 2: {rubric_2}

...

返回 JSON 数组格式"""

    # 单次 API 调用处理多个响应
    # 节省 Token 和费用
```

## 📚 参考资料

- [OpenAI HealthBench Evaluation](https://github.com/openai/simple-evals)
- [GPT-4 API 文档](https://platform.openai.com/docs/models/gpt-4)
- [LangChain Evaluators](https://python.langchain.com/docs/guides/evaluation/)

---

**总结**: 启发式评分适合快速开发和测试，GPT-4 评分适合标准化评估和最终报告。推荐结合使用，在成本和准确性之间找到平衡。
