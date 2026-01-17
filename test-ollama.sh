#!/bin/bash

echo "=========================================="
echo "🧪 测试 Ollama 医疗 Agent"
echo "=========================================="
echo ""

# 测试 1: 检查 Ollama 服务
echo "📌 测试 1: 检查 Ollama 服务..."
if curl -s http://localhost:11434/api/tags > /dev/null 2>&1; then
    echo "✅ Ollama 服务运行正常"
else
    echo "❌ Ollama 服务未运行"
    echo "   请运行: brew services start ollama"
    exit 1
fi

# 测试 2: 检查模型
echo ""
echo "📌 测试 2: 检查已安装模型..."
ollama list

# 测试 3: 测试模型响应
echo ""
echo "📌 测试 3: 测试模型响应..."
echo "你好" | ollama run medical-assistant | head -c 200

echo ""
echo ""
echo "=========================================="
echo "✅ 测试完成"
echo "=========================================="
