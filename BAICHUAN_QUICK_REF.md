# 🚀 Baichuan-M3 风格模型快速参考

## 可用模型

| 模型 | 说明 | 基础 |
|------|------|------|
| `medical-assistant` | 标准医疗助手 | Qwen2.5 |
| `baichuan-m3-medical` | Baichuan-M3 风格（结构化） | Qwen2.5 |
| `qwen2.5:latest` | 原始模型 | Qwen2.5 |

## 命令速查

### 交互式使用
```bash
ollama run baichuan-m3-medical
```

### 管道输入
```bash
echo "你好，我头痛，有什么建议？" | ollama run baichuan-m3-medical
```

### HealthBench 评估
```bash
python3 healthbench_deepseek_eval.py --model baichuan-m3-medical --examples 5
python3 healthbench_test.py --model baichuan-m3-medical --examples 5
```

### Web 服务
```bash
# 更新 .env: OLLAMA_MODEL=baichuan-m3-medical
npm run web
```

## 模型特点

### Baichuan-M3 风格
- ✅ 结构化 5 步回答框架
- ✅ 强同理心和专业性
- ✅ 详细的可能原因分析
- ✅ 实用的自护建议
- ✅ 明确的就医建议

### 回答框架
1. 症状理解
2. 可能原因
3. 自护建议
4. 就医建议
5. 免责声明

## 切换模型

### 方式 1: 修改 .env
```env
OLLAMA_MODEL=baichuan-m3-medical
```

### 方式 2: 命令行参数
```bash
python3 healthbench_deepseek_eval.py --model baichuan-m3-medical
```

### 方式 3: 直接使用 Ollama
```bash
ollama run baichuan-m3-medical
```

## 测试命令

```bash
# 查看所有模型
ollama list

# 测试 Baichuan-M3 模型
echo "你好，我最近感觉头痛" | ollama run baichuan-m3-medical

# 评估对比
python3 healthbench_deepseek_eval.py --model medical-assistant --examples 5 --output m1.json
python3 healthbench_deepseek_eval.py --model baichuan-m3-medical --examples 5 --output m2.json
```

## 文档

- `BAICHUAN_M3_GUIDE.md` - 完整使用指南
- `Modelfile.baichuan-m3` - 模型配置文件
