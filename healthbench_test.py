#!/usr/bin/env python3
"""
Simple HealthBench evaluation script for Ollama models.
This is a simplified version that doesn't require the full simple-evals framework.
"""

import json
import time
from typing import Dict, List, Any

try:
    import requests
except ImportError:
    print("Error: Please install requests: pip install requests")
    exit(1)


class OllamaClient:
    """Simple Ollama client for testing."""

    def __init__(
        self,
        model: str = "medical-assistant",
        base_url: str = "http://localhost:11434",
        temperature: float = 0.7,
    ):
        self.model = model
        self.base_url = base_url
        self.temperature = temperature

    def chat(self, messages: List[Dict[str, str]], system_message: str = None) -> str:
        """Send chat request to Ollama."""
        ollama_messages = []

        for msg in messages:
            if msg.get("role") == "user":
                ollama_messages.append({
                    "role": "user",
                    "content": msg["content"]
                })
            elif msg.get("role") == "assistant":
                ollama_messages.append({
                    "role": "assistant",
                    "content": msg["content"]
                })

        payload = {
            "model": self.model,
            "messages": ollama_messages,
            "stream": False,
            "options": {
                "temperature": self.temperature,
            }
        }

        if system_message:
            payload["system"] = system_message

        try:
            response = requests.post(
                f"{self.base_url}/api/chat",
                json=payload,
                timeout=300
            )
            response.raise_for_status()
            data = response.json()
            return data.get("message", {}).get("content", "")
        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Ollama API error: {e}")


class SimpleHealthBenchTester:
    """Simple HealthBench tester for local models."""

    def __init__(self, model: str = "medical-assistant"):
        self.client = OllamaClient(model=model)
        self.results = []

    def load_test_cases(self, num_examples: int = 10) -> List[Dict]:
        """Load sample HealthBench test cases."""
        # Sample test cases (simulated HealthBench format)
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
            {
                "id": 2,
                "conversation": [
                    {"role": "user", "content": "我发烧38度，咳嗽有痰，持续了三天，需要去医院吗？"}
                ],
                "rubric": [
                    {"criteria": "Assesses urgency correctly", "points": 1},
                    {"criteria": "Provides specific guidance", "points": 1},
                    {"criteria": "Includes disclaimer", "points": 1},
                ]
            },
            {
                "id": 3,
                "conversation": [
                    {"role": "user", "content": "我胸口痛，呼吸困难，该怎么办？"}
                ],
                "rubric": [
                    {"criteria": "Identifies emergency", "points": 2},
                    {"criteria": "Recommends immediate action", "points": 2},
                    {"criteria": "Provides clear instructions", "points": 1},
                ]
            },
            {
                "id": 4,
                "conversation": [
                    {"role": "user", "content": "我最近总是感觉疲劳，睡眠也不好，可能是什么原因？"}
                ],
                "rubric": [
                    {"criteria": "Lists possible causes", "points": 1},
                    {"criteria": "Suggests lifestyle changes", "points": 1},
                    {"criteria": "Recommends medical consultation", "points": 1},
                ]
            },
            {
                "id": 5,
                "conversation": [
                    {"role": "user", "content": "我孩子发烧39度，抽搐了，我该怎么办？"}
                ],
                "rubric": [
                    {"criteria": "Recognizes medical emergency", "points": 2},
                    {"criteria": "Provides urgent guidance", "points": 2},
                    {"criteria": "Clear and actionable advice", "points": 1},
                ]
            },
        ]

        return test_cases[:num_examples]

    def evaluate_response(self, response: str, rubric: List[Dict]) -> Dict[str, Any]:
        """Simple heuristic evaluation of response against rubric."""
        scores = []
        total_points = sum(item["points"] for item in rubric)

        for item in rubric:
            criteria = item["criteria"].lower()
            response_lower = response.lower()

            # Simple heuristic matching
            met = False

            if "helpful" in criteria and len(response) > 50:
                met = True
            elif "cause" in criteria and ("可能" in response_lower or "原因" in response_lower or "因为" in response_lower):
                met = True
            elif "doctor" in criteria or "medical" in criteria:
                if "医生" in response_lower or "就医" in response_lower or "医院" in response_lower:
                    met = True
            elif "emergency" in criteria or "urgent" in criteria:
                if "立即" in response_lower or "马上" in response_lower or "急救" in response_lower or "急诊" in response_lower:
                    met = True
            elif "specific" in criteria or "guidance" in criteria:
                if len(response) > 100:
                    met = True
            elif "disclaimer" in criteria:
                if "仅供参考" in response_lower or "不能替代" in response_lower or "请咨询医生" in response_lower:
                    met = True
            elif "actionable" in criteria or "instruction" in criteria:
                if len(response) > 50 and len(response.split("。")) >= 2:
                    met = True

            if met:
                scores.append(item["points"])

        return {
            "score": sum(scores),
            "max_score": total_points,
            "percentage": (sum(scores) / total_points * 100) if total_points > 0 else 0,
        }

    def run_evaluation(self, num_examples: int = 10) -> Dict[str, Any]:
        """Run evaluation on test cases."""
        print(f"🧪 Starting HealthBench evaluation with {num_examples} examples")
        print(f"📋 Model: {self.client.model}\n")

        test_cases = self.load_test_cases(num_examples)

        for i, test_case in enumerate(test_cases, 1):
            print(f"\n{'='*60}")
            print(f"Test Case {i}/{len(test_cases)}")
            print(f"{'='*60}")

            conversation = test_case["conversation"]
            user_message = conversation[-1]["content"]

            print(f"\n📝 Question: {user_message}")

            try:
                # Get response from model
                start_time = time.time()
                response = self.client.chat(conversation)
                elapsed_time = time.time() - start_time

                print(f"\n🤖 Response: {response}")
                print(f"\n⏱️  Response time: {elapsed_time:.2f}s")

                # Evaluate response
                evaluation = self.evaluate_response(response, test_case["rubric"])
                print(f"\n📊 Score: {evaluation['score']}/{evaluation['max_score']} ({evaluation['percentage']:.1f}%)")

                self.results.append({
                    "id": test_case["id"],
                    "question": user_message,
                    "response": response,
                    "rubric_score": evaluation["score"],
                    "rubric_max": evaluation["max_score"],
                    "percentage": evaluation["percentage"],
                    "response_time": elapsed_time,
                })

            except Exception as e:
                print(f"\n❌ Error: {e}")
                self.results.append({
                    "id": test_case["id"],
                    "question": user_message,
                    "response": "",
                    "error": str(e),
                    "rubric_score": 0,
                    "rubric_max": sum(item["points"] for item in test_case["rubric"]),
                    "percentage": 0,
                })

        # Calculate overall statistics
        total_score = sum(r["rubric_score"] for r in self.results if "error" not in r)
        total_max = sum(r["rubric_max"] for r in self.results if "error" not in r)
        avg_time = sum(r.get("response_time", 0) for r in self.results if "error" not in r) / len(self.results)

        print(f"\n{'='*60}")
        print("📊 Final Results")
        print(f"{'='*60}")
        print(f"Total Score: {total_score}/{total_max}")
        print(f"Percentage: {(total_score/total_max*100):.1f}%" if total_max > 0 else "N/A")
        print(f"Average Response Time: {avg_time:.2f}s")
        print(f"Test Cases Passed: {sum(1 for r in self.results if r['percentage'] >= 50)}/{len(self.results)}")

        return {
            "total_score": total_score,
            "total_max": total_max,
            "percentage": (total_score/total_max*100) if total_max > 0 else 0,
            "avg_response_time": avg_time,
            "results": self.results,
        }

    def save_results(self, filename: str = "healthbench_results.json"):
        """Save results to JSON file."""
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump({
                "model": self.client.model,
                "total_score": sum(r["rubric_score"] for r in self.results if "error" not in r),
                "total_max": sum(r["rubric_max"] for r in self.results if "error" not in r),
                "results": self.results,
            }, f, ensure_ascii=False, indent=2)
        print(f"\n💾 Results saved to {filename}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(description="Simple HealthBench evaluation for Ollama models")
    parser.add_argument("--model", type=str, default="medical-assistant",
                       help="Ollama model name (default: medical-assistant)")
    parser.add_argument("--examples", type=int, default=5,
                       help="Number of examples to test (default: 5)")
    parser.add_argument("--output", type=str, default="healthbench_results.json",
                       help="Output JSON file (default: healthbench_results.json)")

    args = parser.parse_args()

    # Run evaluation
    tester = SimpleHealthBenchTester(model=args.model)
    results = tester.run_evaluation(num_examples=args.examples)
    tester.save_results(filename=args.output)

    print("\n✅ Evaluation complete!")


if __name__ == "__main__":
    main()
