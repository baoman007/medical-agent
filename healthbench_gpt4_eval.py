#!/usr/bin/env python3
"""
HealthBench Evaluator with GPT-4 Grader
使用 GPT-4 作为评分器来评估医疗 AI 模型的响应
"""

import json
import time
import os
import argparse
from typing import Dict, Any, List, Optional
from datetime import datetime

import requests
from openai import OpenAI


class OllamaClient:
    """Ollama API 客户端"""

    def __init__(self, base_url: str = "http://localhost:11434", model: str = "medical-assistant"):
        self.base_url = base_url
        self.model = model

    def chat(self, messages: List[Dict[str, str]]) -> str:
        """发送聊天请求到 Ollama"""
        payload = {
            "model": self.model,
            "messages": messages,
            "stream": False,
        }

        response = requests.post(
            f"{self.base_url}/api/chat",
            json=payload,
            timeout=120
        )

        if response.status_code == 200:
            return response.json()["message"]["content"]
        else:
            raise Exception(f"Ollama API error: {response.status_code} - {response.text}")


class GPT4Grader:
    """GPT-4 评分器"""

    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        if not self.api_key:
            raise ValueError("OPENAI_API_KEY environment variable not set")
        
        self.client = OpenAI(api_key=self.api_key)

    def evaluate(self, response: str, rubric: List[Dict]) -> Dict[str, Any]:
        """
        使用 GPT-4 评估响应
        
        Args:
            response: 模型生成的响应
            rubric: 评分标准列表
            
        Returns:
            包含评分的字典
        """
        # 构建评分提示
        rubric_text = "\n".join([
            f"- {item['criterion']} ({item['points']} 分)"
            for item in rubric
        ])
        
        prompt = f"""你是一个专业的医疗 AI 评分员。请根据以下标准评估模型响应。

模型响应:
\"\"\"
{response}
\"\"\"

评分标准:
{rubric_text}

请按照以下格式返回 JSON:
{{
    "reasoning": "你的评分理由",
    "scores": [0 或标准分，对应每个标准的得分],
    "score": 总分,
    "max_score": 总分制,
    "percentage": 百分比 (0-100)
}}

评分原则:
1. 仔细阅读模型响应
2. 根据每个标准判断是否满足
3. 给出详细的评分理由
4. 必须返回有效的 JSON 格式"""

        try:
            completion = self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": "你是一个专业的医疗 AI 评分员。请严格按照 JSON 格式返回评分结果。"
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                temperature=0.3,
                response_format={"type": "json_object"}
            )

            result_text = completion.choices[0].message.content
            
            # 解析 JSON
            result = json.loads(result_text)
            
            # 验证字段
            if "score" not in result:
                result["score"] = 0
            if "max_score" not in result:
                result["max_score"] = sum(item["points"] for item in rubric)
            if "percentage" not in result:
                result["percentage"] = (result["score"] / result["max_score"] * 100) if result["max_score"] > 0 else 0
            
            return result
            
        except json.JSONDecodeError as e:
            print(f"⚠️  GPT-4 返回的 JSON 解析失败: {e}")
            print(f"原始响应: {result_text}")
            # 返回默认评分
            return {
                "score": 0,
                "max_score": sum(item["points"] for item in rubric),
                "percentage": 0,
                "reasoning": "JSON 解析失败",
                "scores": []
            }
        except Exception as e:
            print(f"⚠️  GPT-4 评分失败: {e}")
            return {
                "score": 0,
                "max_score": sum(item["points"] for item in rubric),
                "percentage": 0,
                "reasoning": str(e),
                "scores": []
            }


class HealthBenchGPT4Evaluator:
    """使用 GPT-4 评分的 HealthBench 评估器"""

    # HealthBench 数据集 URL
    HEALTHBENCH_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/2025-05-07-06-14-12_oss_eval.jsonl"
    HEALTHBENCH_HARD_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/2025-05-07-06-14-18_oss_eval_hard.jsonl"
    HEALTHBENCH_CONSENSUS_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/2025-05-07-06-14-20_oss_eval_consensus.jsonl"

    def __init__(self, model: str = "medical-assistant", ollama_base_url: str = "http://localhost:11434"):
        self.model = model
        self.client = OllamaClient(base_url=ollama_base_url, model=model)
        self.grader = GPT4Grader()
        self.results = []

    def load_dataset(self, url: str, num_examples: Optional[int] = None) -> List[Dict]:
        """从 URL 加载 HealthBench 数据集"""
        print(f"📥 下载数据集: {url}")
        
        try:
            response = requests.get(url, timeout=60)
            response.raise_for_status()
            
            test_cases = []
            for line in response.text.strip().split('\n'):
                if line:
                    test_cases.append(json.loads(line))
            
            if num_examples:
                test_cases = test_cases[:num_examples]
            
            print(f"✅ 加载了 {len(test_cases)} 个测试用例")
            return test_cases
            
        except Exception as e:
            print(f"❌ 下载数据集失败: {e}")
            return []

    def run_evaluation(
        self,
        dataset: str = "standard",
        num_examples: Optional[int] = None,
        output_file: str = "healthbench_gpt4_results.json"
    ) -> Optional[Dict[str, Any]]:
        """运行评估"""
        # 选择数据集
        if dataset == "standard":
            url = self.HEALTHBENCH_URL
        elif dataset == "hard":
            url = self.HEALTHBENCH_HARD_URL
        elif dataset == "consensus":
            url = self.HEALTHBENCH_CONSENSUS_URL
        else:
            raise ValueError(f"Unknown dataset: {dataset}")

        # 加载测试用例
        test_cases = self.load_dataset(url, num_examples)

        if not test_cases:
            print("❌ 没有找到测试用例!")
            return None

        print(f"\n🧪 开始 GPT-4 评分评估")
        print(f"📋 模型: {self.model}")
        print(f"📊 数据集: {dataset}")
        print(f"📝 测试用例数: {len(test_cases)}\n")

        # 评估每个测试用例
        for i, test_case in enumerate(test_cases, 1):
            print(f"{'='*70}")
            print(f"测试用例 {i}/{len(test_cases)}")
            print(f"{'='*70}")

            # 提取用户消息
            prompt = test_case.get("prompt", [])
            if not prompt:
                print("⚠️  没有找到 prompt，跳过")
                continue

            user_message = prompt[-1].get("content", "")

            # 显示标签/主题
            tags = test_case.get("example_tags", [])
            if tags:
                print(f"\n🏷️  标签: {', '.join(tags)}")

            print(f"\n📝 问题: {user_message[:200]}{'...' if len(user_message) > 200 else ''}")

            try:
                # 获取模型响应
                start_time = time.time()
                response = self.client.chat(prompt)
                model_time = time.time() - start_time

                print(f"\n🤖 模型响应 (前300字符): {response[:300]}{'...' if len(response) > 300 else ''}")
                print(f"⏱️  模型响应时间: {model_time:.2f}s")

                # GPT-4 评分
                print(f"\n🎯 使用 GPT-4 评分中...")
                grader_start = time.time()
                rubric = test_case.get("rubrics", [])
                evaluation = self.grader.evaluate(response, rubric)
                grader_time = time.time() - grader_start

                print(f"\n📊 评分结果:")
                print(f"   得分: {evaluation['score']}/{evaluation['max_score']} ({evaluation['percentage']:.1f}%)")
                print(f"   评分时间: {grader_time:.2f}s")
                print(f"   评分理由: {evaluation.get('reasoning', 'N/A')[:200]}{'...' if len(evaluation.get('reasoning', '')) > 200 else ''}")

                self.results.append({
                    "prompt_id": test_case.get("prompt_id"),
                    "question": user_message,
                    "response": response,
                    "rubric_score": evaluation["score"],
                    "rubric_max": evaluation["max_score"],
                    "percentage": evaluation["percentage"],
                    "model_time": model_time,
                    "grader_time": grader_time,
                    "total_time": model_time + grader_time,
                    "reasoning": evaluation.get("reasoning", ""),
                    "scores": evaluation.get("scores", []),
                    "tags": tags,
                })

            except Exception as e:
                print(f"\n❌ 错误: {e}")
                self.results.append({
                    "prompt_id": test_case.get("prompt_id"),
                    "question": user_message,
                    "response": "",
                    "error": str(e),
                    "rubric_score": 0,
                    "rubric_max": 0,
                    "percentage": 0,
                })

        # 计算最终统计
        valid_results = [r for r in self.results if "error" not in r]
        if valid_results:
            total_score = sum(r["rubric_score"] for r in valid_results)
            total_max = sum(r["rubric_max"] for r in valid_results)
            avg_time = sum(r["total_time"] for r in valid_results) / len(valid_results)
            avg_percentage = sum(r["percentage"] for r in valid_results) / len(valid_results)
            avg_model_time = sum(r["model_time"] for r in valid_results) / len(valid_results)
            avg_grader_time = sum(r["grader_time"] for r in valid_results) / len(valid_results)

            print(f"\n{'='*70}")
            print("📊 最终结果")
            print(f"{'='*70}")
            print(f"总分: {total_score}/{total_max}")
            print(f"平均分: {avg_percentage:.1f}%")
            print(f"平均总时间: {avg_time:.2f}s")
            print(f"  - 模型响应: {avg_model_time:.2f}s")
            print(f"  - GPT-4 评分: {avg_grader_time:.2f}s")
            print(f"评估用例数: {len(valid_results)}/{len(test_cases)}")

            # 保存结果
            final_results = {
                "model": self.model,
                "dataset": dataset,
                "grader": "GPT-4",
                "timestamp": datetime.now().isoformat(),
                "total_examples": len(test_cases),
                "evaluated_examples": len(valid_results),
                "total_score": total_score,
                "total_max": total_max,
                "average_percentage": avg_percentage,
                "average_total_time": avg_time,
                "average_model_time": avg_model_time,
                "average_grader_time": avg_grader_time,
                "results": valid_results,
            }

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(final_results, f, ensure_ascii=False, indent=2)

            print(f"\n💾 结果已保存到: {output_file}")

            return final_results
        else:
            print("\n❌ 没有有效结果!")
            return None


def main():
    """主函数"""
    parser = argparse.ArgumentParser(
        description="HealthBench evaluation with GPT-4 grader"
    )
    parser.add_argument("--model", type=str, default="medical-assistant",
                       help="Ollama 模型名称 (default: medical-assistant)")
    parser.add_argument("--dataset", type=str, default="standard",
                       choices=["standard", "hard", "consensus"],
                       help="HealthBench 数据集变体 (default: standard)")
    parser.add_argument("--examples", type=int, default=None,
                       help="测试用例数量 (default: all)")
    parser.add_argument("--output", type=str, default="healthbench_gpt4_results.json",
                       help="输出 JSON 文件 (default: healthbench_gpt4_results.json)")
    parser.add_argument("--api-key", type=str, default=None,
                       help="OpenAI API 密钥 (或设置 OPENAI_API_KEY 环境变量)")

    args = parser.parse_args()

    # 设置 API key
    if args.api_key:
        os.environ["OPENAI_API_KEY"] = args.api_key

    # 运行评估
    try:
        evaluator = HealthBenchGPT4Evaluator(model=args.model)
        results = evaluator.run_evaluation(
            dataset=args.dataset,
            num_examples=args.examples,
            output_file=args.output
        )

        if results:
            print("\n✅ 评估完成!")
        else:
            print("\n❌ 评估失败!")

    except ValueError as e:
        print(f"\n❌ 错误: {e}")
        print("\n💡 提示: 请设置 OPENAI_API_KEY 环境变量或使用 --api-key 参数")
    except Exception as e:
        print(f"\n❌ 意外错误: {e}")


if __name__ == "__main__":
    main()
