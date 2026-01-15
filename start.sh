#!/bin/bash

# 医疗问诊智能体 - 快速启动脚本

echo "=========================================="
echo "🏥 医疗问诊智能体"
echo "基于 LangChain + LangGraph + DeepSeek"
echo "=========================================="
echo ""

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未检测到 Node.js"
    echo "请先安装 Node.js: https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 版本: $(node --version)"

# 检查 npm 是否安装
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未检测到 npm"
    exit 1
fi

echo "✅ npm 版本: $(npm --version)"
echo ""

# 检查依赖是否已安装
if [ ! -d "node_modules" ]; then
    echo "📦 首次运行，正在安装依赖..."
    npm install
    
    if [ $? -ne 0 ]; then
        echo "❌ 依赖安装失败"
        exit 1
    fi
    echo "✅ 依赖安装完成"
    echo ""
fi

# 检查 .env 文件
if [ ! -f ".env" ]; then
    echo "⚠️  未检测到 .env 文件"
    echo "正在创建 .env 文件..."
    cp .env.example .env
    echo "✅ 已创建 .env 文件"
    echo ""
    echo "⚠️  重要提示：请编辑 .env 文件，设置您的 DeepSeek API 密钥"
    echo ""
    read -p "是否现在编辑 .env 文件？(y/n) " -n 1 -r
    echo ""
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        ${EDITOR:-nano} .env
    fi
fi

# 检查 API 密钥
if grep -q "your_deepseek_api_key_here" .env; then
    echo "⚠️  警告：.env 文件中的 API 密钥尚未配置"
    echo ""
    echo "请编辑 .env 文件，设置 DEEPSEEK_API_KEY"
    echo ""
    exit 1
fi

echo "✅ 环境检查完成"
echo ""

# 选择运行模式
echo "请选择运行模式："
echo "1. 交互模式（推荐）"
echo "2. 单次查询"
echo "3. 运行测试"
echo "4. 查看文档"
echo ""
read -p "请输入选项 (1-4): " choice

case $choice in
    1)
        echo ""
        echo "🚀 启动交互模式..."
        node interactive.js
        ;;
    2)
        echo ""
        read -p "请输入您的症状描述: " symptoms
        echo ""
        echo "🚀 处理中..."
        node index.js "$symptoms"
        ;;
    3)
        echo ""
        echo "🧪 运行测试..."
        node test.js
        ;;
    4)
        echo ""
        echo "📖 可用文档："
        echo "  - README.md          项目介绍"
        echo "  - INSTALL.md        安装指南"
        echo "  - USAGE_EXAMPLES.md 使用示例"
        echo "  - ARCHITECTURE.md   架构文档"
        echo "  - PROJECT_SUMMARY.md 项目总结"
        echo ""
        read -p "请输入要查看的文件名: " doc_file
        if [ -f "$doc_file" ]; then
            cat "$doc_file" | less
        else
            echo "❌ 文件不存在: $doc_file"
        fi
        ;;
    *)
        echo "❌ 无效选项"
        exit 1
        ;;
esac

echo ""
echo "=========================================="
echo "感谢使用医疗问诊智能体！"
echo "=========================================="
