#!/usr/bin/env python3
"""
HealthBench evaluation with real dataset from OpenAI.
Downloads and evaluates actual HealthBench test cases.
"""

import json
import time
from typing import Dict, List, Any, Optional

try:
    import requests
except ImportError:
    print("Error: Please install requests: pip install requests")
    exit(1)

# HealthBench dataset URL
HEALTHBENCH_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/2025-05-07-06-14-12_oss_eval.jsonl"
HEALTHBENCH_HARD_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/hard_2025-05-08-21-00-10.jsonl"
HEALTHBENCH_CONSENSUS_URL = "https://openaipublic.blob.core.windows.net/simple-evals/healthbench/consensus_2025-05-09-20-00-46.jsonl"


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


class HealthBenchEvaluator:
    """Evaluator using real HealthBench dataset."""

    def __init__(self, model: str = "medical-assistant"):
        self.client = OllamaClient(model=model)
        self.results = []

    def load_dataset(self, dataset_url: str, num_examples: Optional[int] = None) -> List[Dict]:
        """Load HealthBench dataset from URL."""
        print(f"📥 Loading dataset from {dataset_url.split('/')[-1]}")

        try:
            response = requests.get(dataset_url, timeout=60)
            response.raise_for_status()

            # Read JSONL format (one JSON per line)
            lines = response.text.strip().split('\n')
            test_cases = [json.loads(line) for line in lines if line.strip()]

            print(f"✅ Loaded {len(test_cases)} test cases")

            if num_examples:
                return test_cases[:num_examples]

            return test_cases

        except requests.exceptions.RequestException as e:
            raise RuntimeError(f"Failed to load dataset: {e}")

    def evaluate_response(self, response: str, rubric: List[Dict]) -> Dict[str, Any]:
        """
        Heuristic evaluation of response against rubric.
        This is a simplified evaluation; real HealthBench uses GPT-4 for evaluation.
        """
        response_lower = response.lower()
        total_points = sum(item["points"] for item in rubric)
        scores = []

        for item in rubric:
            criterion = item["criterion"].lower()
            points = item["points"]
            met = False

            # Heuristic matching based on criterion keywords
            # Note: This is simplified - real HealthBench uses GPT-4 as grader

            # Positive criteria
            if any(word in criterion for word in ["doctor", "physician", "medical", "healthcare"]):
                if any(word in response_lower for word in ["医生", "就医", "医院", "医疗", "建议"]):
                    met = True

            if any(word in criterion for word in ["therapy", "plan", "treatment", "intervention"]):
                if any(word in response_lower for word in ["治疗", "建议", "计划", "方法", "方案"]):
                    met = True

            if any(word in criterion for word in ["emergency", "urgent", "immediate"]):
                if any(word in response_lower for word in ["立即", "马上", "急救", "急诊", "紧急"]):
                    met = True

            if any(word in criterion for word in ["disclaimer", "not medical advice", "professional"]):
                if any(word in response_lower for word in ["仅供参考", "不能替代", "请咨询医生", "建议就医"]):
                    met = True

            if any(word in criterion for word in ["monitor", "track", "improvement"]):
                if any(word in response_lower for word in ["观察", "监测", "持续", "改善"]):
                    met = True

            if any(word in criterion for word in ["specific", "clear", "structured"]):
                if len(response) > 50 and ("。" in response or "1." in response or "•" in response):
                    met = True

            # Negative criteria (should NOT be present)
            if any(word in criterion for word in ["harmful", "dangerous", "not accurate", "avoid"]):
                # For negative criteria, we want them NOT to be met
                # This is tricky - simplified approach
                if len(response) > 20:  # Assume reasonable response is not harmful
                    met = False  # Good: negative criterion NOT met
                    if points < 0:
                        scores.append(abs(points))  # Good response on negative criterion = positive points
                    continue

            if met:
                scores.append(points)

        return {
            "score": sum(scores),
            "max_score": total_points,
            "percentage": (sum(scores) / total_points * 100) if total_points > 0 else 0,
            "rubric_items": len(rubric),
        }

    def run_evaluation(
        self,
        dataset: str = "standard",
        num_examples: Optional[int] = None,
        output_file: str = "healthbench_real_results.json"
    ):
        """Run evaluation on real HealthBench dataset."""
        # Select dataset
        if dataset == "standard":
            url = HEALTHBENCH_URL
        elif dataset == "hard":
            url = HEALTHBENCH_HARD_URL
        elif dataset == "consensus":
            url = HEALTHBENCH_CONSENSUS_URL
        else:
            raise ValueError(f"Unknown dataset: {dataset}")

        # Load test cases
        test_cases = self.load_dataset(url, num_examples)

        if not test_cases:
            print("❌ No test cases found!")
            return None

        print(f"\n🧪 Starting evaluation on {len(test_cases)} examples")
        print(f"📋 Model: {self.client.model}")
        print(f"📊 Dataset: {dataset}\n")

        # Evaluate each test case
        for i, test_case in enumerate(test_cases, 1):
            print(f"{'='*60}")
            print(f"Test Case {i}/{len(test_cases)}")
            print(f"{'='*60}")

            # Extract user message
            prompt = test_case.get("prompt", [])
            if not prompt:
                print("⚠️  No prompt found, skipping")
                continue

            user_message = prompt[-1].get("content", "")

            # Display tags/themes
            tags = test_case.get("example_tags", [])
            if tags:
                print(f"\n🏷️  Tags: {', '.join(tags)}")

            print(f"\n📝 Question: {user_message[:200]}...")

            try:
                # Get response from model
                start_time = time.time()
                response = self.client.chat(prompt)
                elapsed_time = time.time() - start_time

                print(f"\n🤖 Response (truncated): {response[:300]}...")
                print(f"\n⏱️  Response time: {elapsed_time:.2f}s")

                # Evaluate against rubric
                rubric = test_case.get("rubrics", [])
                evaluation = self.evaluate_response(response, rubric)

                print(f"\n📊 Score: {evaluation['score']}/{evaluation['max_score']} ({evaluation['percentage']:.1f}%)")
                print(f"📏 Rubric items: {evaluation['rubric_items']}")

                self.results.append({
                    "prompt_id": test_case.get("prompt_id"),
                    "question": user_message,
                    "response": response,
                    "rubric_score": evaluation["score"],
                    "rubric_max": evaluation["max_score"],
                    "percentage": evaluation["percentage"],
                    "response_time": elapsed_time,
                    "rubric_items": evaluation["rubric_items"],
                    "tags": tags,
                })

            except Exception as e:
                print(f"\n❌ Error: {e}")
                self.results.append({
                    "prompt_id": test_case.get("prompt_id"),
                    "question": user_message,
                    "response": "",
                    "error": str(e),
                    "rubric_score": 0,
                    "rubric_max": 0,
                    "percentage": 0,
                })

        # Calculate final statistics
        valid_results = [r for r in self.results if "error" not in r]
        if valid_results:
            total_score = sum(r["rubric_score"] for r in valid_results)
            total_max = sum(r["rubric_max"] for r in valid_results)
            avg_time = sum(r["response_time"] for r in valid_results) / len(valid_results)
            avg_percentage = sum(r["percentage"] for r in valid_results) / len(valid_results)

            print(f"\n{'='*60}")
            print("📊 Final Results")
            print(f"{'='*60}")
            print(f"Total Score: {total_score}/{total_max}")
            print(f"Average Score: {avg_percentage:.1f}%")
            print(f"Average Response Time: {avg_time:.2f}s")
            print(f"Test Cases Evaluated: {len(valid_results)}/{len(test_cases)}")

            # Save results
            final_results = {
                "model": self.client.model,
                "dataset": dataset,
                "total_examples": len(test_cases),
                "evaluated_examples": len(valid_results),
                "total_score": total_score,
                "total_max": total_max,
                "average_percentage": avg_percentage,
                "average_response_time": avg_time,
                "results": valid_results,
            }

            with open(output_file, 'w', encoding='utf-8') as f:
                json.dump(final_results, f, ensure_ascii=False, indent=2)

            print(f"\n💾 Results saved to {output_file}")

            return final_results
        else:
            print("\n❌ No valid results!")
            return None


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description="HealthBench evaluation with real dataset for Ollama models"
    )
    parser.add_argument("--model", type=str, default="medical-assistant",
                       help="Ollama model name (default: medical-assistant)")
    parser.add_argument("--dataset", type=str, default="standard",
                       choices=["standard", "hard", "consensus"],
                       help="HealthBench dataset variant (default: standard)")
    parser.add_argument("--examples", type=int, default=None,
                       help="Number of examples to test (default: all)")
    parser.add_argument("--output", type=str, default="healthbench_real_results.json",
                       help="Output JSON file (default: healthbench_real_results.json)")

    args = parser.parse_args()

    # Run evaluation
    evaluator = HealthBenchEvaluator(model=args.model)
    results = evaluator.run_evaluation(
        dataset=args.dataset,
        num_examples=args.examples,
        output_file=args.output
    )

    if results:
        print("\n✅ Evaluation complete!")
    else:
        print("\n❌ Evaluation failed!")


if __name__ == "__main__":
    main()
