# 🚀 GPT-4 评分器快速参考

## 命令速查

### 配置 API 密钥
```bash
export OPENAI_API_KEY=sk-your-key-here
```

### 测试 GPT-4 配置
```bash
python3 test_gpt4_grader.py
```

### 运行评估
```bash
# 基础（5个用例）
python3 healthbench_gpt4_eval.py --examples 5

# 指定模型和数据集
python3 healthbench_gpt4_eval.py --model qwen2.5:latest --dataset hard --examples 10

# 指定输出文件
python3 healthbench_gpt4_eval.py --examples 5 --output my_results.json
```

### 对比结果
```bash
# 生成两种评分
python3 healthbench_real.py --examples 5 --output heuristic.json
python3 healthbench_gpt4_eval.py --examples 5 --output gpt4.json

# 对比分析
python3 compare_scores.py heuristic.json gpt4.json
```

## 评分方法对比

| 方法 | 脚本 | 准确性 | 成本 | 速度 |
|------|------|--------|------|------|
| 启发式 | `healthbench_real.py` | 中等 | 免费 | 快 |
| GPT-4 | `healthbench_gpt4_eval.py` | 高 | $0.075/次 | 中等 |

## 成本估算

| 用例数 | 估算成本 |
|-------|---------|
| 5 | ~$0.38 |
| 50 | ~$3.75 |
| 500 | ~$37.50 |

## 文件索引

| 文件 | 说明 |
|------|------|
| `healthbench_gpt4_eval.py` | GPT-4 评分主脚本 |
| `test_gpt4_grader.py` | 测试 API 配置 |
| `compare_scores.py` | 对比评分结果 |
| `HEALTHBENCH_GPT4_GUIDE.md` | 完整使用指南 |
| `TECHNICAL_ANALYSIS.md` | 技术分析 |
| `GPT4_EVAL_SUMMARY.md` | 完整总结 |

## 常见问题

**Q: 如何获取 OpenAI API 密钥？**
A: 访问 https://platform.openai.com/api-keys

**Q: API 密钥未设置怎么办？**
A: 运行 `export OPENAI_API_KEY=sk-your-key-here`

**Q: 如何减少成本？**
A: 1) 先用启发式评分测试 2) GPT-4 只评分 5-10 个关键用例

**Q: GPT-4 和启发式评分差异很大怎么办？**
A: 以 GPT-4 评分为准，使用 compare_scores.py 分析差异

## 推荐流程

```
1. 开发阶段: healthbench_test.py (免费、快速)
2. 验证阶段: healthbench_gpt4_eval.py --examples 5
3. 评估阶段: healthbench_gpt4_eval.py --examples 100
4. 对比阶段: compare_scores.py
```
