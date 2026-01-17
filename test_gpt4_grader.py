#!/usr/bin/env python3
"""
测试 GPT-4 评分器是否正常工作
"""

import os
from openai import OpenAI

def test_gpt4_grader():
    """测试 GPT-4 评分器"""

    # 检查 API 密钥
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        print("❌ OPENAI_API_KEY 环境变量未设置")
        print("\n请使用以下方式之一设置:")
        print("  方式 1: export OPENAI_API_KEY=sk-your-key-here")
        print("  方式 2: 将 API 密钥添加到 .env 文件")
        return False

    print(f"✅ 找到 API 密钥: {api_key[:10]}...{api_key[-4:]}")

    try:
        # 创建客户端
        client = OpenAI(api_key=api_key)

        # 测试 GPT-4 访问
        print("\n🧪 测试 GPT-4 API 访问...")

        completion = client.chat.completions.create(
            model="gpt-4",
            messages=[
                {
                    "role": "system",
                    "content": "你是一个专业的评分员。请严格按照 JSON 格式返回结果。"
                },
                {
                    "role": "user",
                    "content": """请评估以下医疗响应:

响应: "建议您多休息，保持充足的水分，并密切关注症状。如果症状持续或加重，建议及时就医。"

评分标准:
- Provides helpful advice (2 分)
- Recommends consulting a doctor (2 分)
- Clear and actionable (1 分)

请返回 JSON 格式:
{
    "score": 总分,
    "max_score": 总分制,
    "reasoning": "评分理由",
    "scores": [每个标准的得分]
}"""
                }
            ],
            temperature=0.3,
            response_format={"type": "json_object"}
        )

        result_text = completion.choices[0].message.content

        print("✅ GPT-4 API 访问成功")
        print(f"\n📊 评分结果:")
        print(result_text)

        return True

    except Exception as e:
        print(f"❌ GPT-4 API 测试失败: {e}")
        return False


if __name__ == "__main__":
    print("="*60)
    print("🧪 GPT-4 评分器测试")
    print("="*60)
    print()

    success = test_gpt4_grader()

    print()
    print("="*60)
    if success:
        print("✅ 测试通过！可以使用 healthbench_gpt4_eval.py")
    else:
        print("❌ 测试失败！请检查配置")
    print("="*60)
