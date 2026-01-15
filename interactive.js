import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';
import readline from 'readline';

// ==================== 定义状态 ====================

const StateAnnotation = Annotation.Root({
  messages: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => [],
  }),
  symptoms: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  urgency: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  diagnosis: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  recommendations: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => null,
  }),
  needsDoctor: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => false,
  }),
});

// ==================== 初始化模型 ====================

const llm = new ChatOpenAI({
  apiKey: process.env.DEEPSEEK_API_KEY,
  modelName: 'deepseek-chat',
  temperature: 0.7,
  maxTokens: 2000,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  },
});

// ==================== 定义Schema ====================

const SymptomAnalysisSchema = z.object({
  symptoms: z.array(z.string()),
  duration: z.string(),
  severity: z.enum(['mild', 'moderate', 'severe']),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']),
  needsEmergencyCare: z.boolean(),
  notes: z.string(),
});

const DiagnosisSchema = z.object({
  possibleConditions: z.array(z.string()),
  mostLikely: z.string(),
  confidence: z.number().min(0).max(100),
  reasoning: z.string(),
});

const RecommendationSchema = z.object({
  selfCare: z.array(z.string()),
  lifestyle: z.array(z.string()),
  monitoring: z.array(z.string()),
  followUp: z.string(),
  whenToSeekCare: z.string(),
  warnings: z.array(z.string()),
});

// ==================== LangGraph 节点 ====================

/**
 * 辅助函数：解析 LLM 返回的 JSON
 */
async function invokeWithSchema(llm, messages, schema) {
  const systemPrompt = `你是一个专业的医疗助手。请以 JSON 格式返回响应，不要包含任何其他文本。

JSON Schema:
${JSON.stringify(schema.shape, null, 2)}`;

  const response = await llm.invoke([
    new SystemMessage(systemPrompt),
    ...messages,
  ]);

  // 提取 JSON
  let jsonStr = response.content;
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }

  return schema.parse(JSON.parse(jsonStr));
}

async function analyzeSymptoms(state) {
  console.log('\n🔍 [节点1] 分析症状...');

  const lastMessage = state.messages?.[state.messages.length - 1];
  if (!lastMessage) {
    throw new Error('未找到用户消息');
  }

  const prompt = `请分析患者的症状描述。

患者描述：${lastMessage.content}

请以 JSON 格式返回以下信息：
- symptoms: 症状列表（字符串数组）
- duration: 持续时间（字符串）
- severity: 严重程度，可选值为 "mild", "moderate", "severe"
- urgency: 紧急程度，可选值为 "low", "medium", "high", "emergency"
- needsEmergencyCare: 是否需要立即就医（布尔值）
- notes: 其他重要信息（字符串）

请详细分析，特别是要识别任何警示症状。`;

  const result = await invokeWithSchema(
    llm,
    [
      new SystemMessage('你是一个专业的医疗助手。'),
      new HumanMessage(prompt)
    ],
    SymptomAnalysisSchema
  );

  console.log('✅ 症状分析完成');
  console.log(`   症状: ${result.symptoms.join(', ')}`);
  console.log(`   紧急程度: ${result.urgency}`);

  return {
    symptoms: result,
    urgency: result.urgency,
    needsDoctor: result.needsEmergencyCare,
  };
}

async function makeDiagnosis(state) {
  console.log('\n🏥 [节点2] 进行诊断...');

  const { symptoms, urgency } = state;

  const prompt = `基于以下症状信息，进行初步诊断：

症状：${symptoms.symptoms.join(', ')}
持续时间：${symptoms.duration}
严重程度：${symptoms.severity}
紧急程度：${urgency}

请以 JSON 格式返回以下信息：
- possibleConditions: 可能的疾病列表（字符串数组，按可能性排序）
- mostLikely: 最可能的疾病（字符串）
- confidence: 诊断置信度（0-100的数字）
- reasoning: 诊断理由（字符串）

注意：这是初步诊断，仅供参考，不能替代专业医生的诊断。`;

  const result = await invokeWithSchema(
    llm,
    [
      new SystemMessage('你是一个经验丰富的医生。基于症状进行初步诊断，提供可能性和理由。'),
      new HumanMessage(prompt)
    ],
    DiagnosisSchema
  );

  console.log('✅ 诊断完成');
  console.log(`   最可能: ${result.mostLikely}`);
  console.log(`   置信度: ${result.confidence}%`);

  return {
    diagnosis: result,
  };
}

async function generateRecommendations(state) {
  console.log('\n💡 [节点3] 生成建议...');

  const { symptoms, diagnosis, urgency } = state;

  const prompt = `为患者提供治疗建议：

症状：${symptoms.symptoms.join(', ')}
最可能疾病：${diagnosis.mostLikely}
紧急程度：${urgency}

请以 JSON 格式返回以下信息：
- selfCare: 自我护理建议（字符串数组）
- lifestyle: 生活方式建议（字符串数组）
- monitoring: 需要监测的症状（字符串数组）
- followUp: 随访建议（字符串）
- whenToSeekCare: 何时需要就医（字符串）
- warnings: 重要注意事项（字符串数组）

建议要实用、具体、可执行。`;

  const result = await invokeWithSchema(
    llm,
    [
      new SystemMessage('你是一个专业的医疗顾问。为患者提供实用、安全的医疗建议。'),
      new HumanMessage(prompt)
    ],
    RecommendationSchema
  );

  console.log('✅ 建议生成完成');

  return {
    recommendations: result,
  };
}

async function generateResponse(state) {
  console.log('\n📝 [节点4] 生成最终回复...');

  const { symptoms, diagnosis, recommendations, needsDoctor } = state;

  const response = await llm.invoke([
    new SystemMessage('你是一个专业的医疗助手。'),
    new HumanMessage(`为患者生成友好、专业、易懂的回复。

症状：${symptoms.symptoms.join(', ')}
最可能疾病：${diagnosis.mostLikely}
建议：${recommendations.selfCare.join(', ')}

请生成结构化的回复，包含症状总结、可能疾病、具体建议、何时就医提醒和免责声明。`)
  ]);

  console.log('✅ 回复生成完成');

  return {
    messages: [response],
  };
}

async function assessUrgency(state) {
  console.log('\n🚨 [节点5] 评估紧急程度...');

  const { symptoms } = state;

  const urgentConditions = [
    '胸痛', '呼吸困难', '严重出血', '意识不清', '剧烈头痛',
    '高烧', '严重过敏反应', '骨折', '严重烧伤'
  ];

  const isEmergency = symptoms.symptoms.some(s => 
    urgentConditions.some(c => s.includes(c))
  );

  console.log(`   紧急评估: ${isEmergency ? '需要立即就医' : '非紧急'}`);

  if (isEmergency) {
    return {
      needsDoctor: true,
      urgency: 'emergency',
      messages: [
        {
          type: 'assistant',
          content: '⚠️ 紧急提醒：根据您的症状描述，建议立即就医或拨打急救电话（120）。'
        }
      ]
    };
  }

  return {};
}

// ==================== 构建LangGraph ====================

function createMedicalGraph() {
  const workflow = new StateGraph(StateAnnotation);

  workflow.addNode('analyzeSymptoms', analyzeSymptoms);
  workflow.addNode('assessUrgency', assessUrgency);
  workflow.addNode('makeDiagnosis', makeDiagnosis);
  workflow.addNode('generateRecommendations', generateRecommendations);
  workflow.addNode('generateResponse', generateResponse);

  workflow.setEntryPoint('analyzeSymptoms');
  workflow.addEdge('analyzeSymptoms', 'assessUrgency');

  workflow.addConditionalEdges(
    'assessUrgency',
    (state) => {
      if (state.urgency === 'emergency' || state.needsDoctor === true) {
        return 'emergency';
      }
      return 'continue';
    },
    {
      emergency: 'generateResponse',
      continue: 'makeDiagnosis',
    }
  );

  workflow.addEdge('makeDiagnosis', 'generateRecommendations');
  workflow.addEdge('generateRecommendations', 'generateResponse');
  workflow.setFinishPoint('generateResponse');

  return workflow.compile();
}

// ==================== 交互式对话 ====================

function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
}

async function interactiveMode() {
  console.log('==========================================');
  console.log('🏥 医疗问诊智能体 - 交互模式');
  console.log('基于 LangChain + LangGraph + DeepSeek');
  console.log('==========================================\n');

  const medicalGraph = createMedicalGraph();
  const rl = createReadlineInterface();

  try {
    while (true) {
      const input = await askQuestion(rl, '\n👤 请描述您的症状（输入 "quit" 退出）: ');
      
      if (input.toLowerCase() === 'quit' || input.toLowerCase() === '退出') {
        console.log('\n感谢使用，祝您健康！');
        break;
      }

      if (!input.trim()) {
        console.log('请输入您的症状。');
        continue;
      }

      console.log(`\n患者: "${input}"`);

      try {
        const result = await medicalGraph.invoke({
          messages: [new HumanMessage(input)],
        });

        console.log('\n==========================================');
        console.log('📋 医疗问诊结果');
        console.log('==========================================\n');

        const finalMessage = result.messages[result.messages.length - 1];
        console.log(finalMessage.content);

        if (result.diagnosis) {
          console.log(`\n💡 初步诊断: ${result.diagnosis.mostLikely} (置信度: ${result.diagnosis.confidence}%)`);
        }

        if (result.symptoms) {
          console.log(`🚨 紧急程度: ${result.symptoms.urgency}`);
        }

        console.log('\n⚠️  免责声明：本系统仅供参考，不能替代专业医生的诊断和治疗。');

      } catch (error) {
        console.error('❌ 错误:', error.message);
      }
    }
  } finally {
    rl.close();
  }
}

async function singleQueryMode(query) {
  console.log('==========================================');
  console.log('🏥 医疗问诊智能体');
  console.log('==========================================\n');

  const medicalGraph = createMedicalGraph();

  try {
    const result = await medicalGraph.invoke({
      messages: [new HumanMessage(query)],
    });

    console.log('\n==========================================');
    console.log('📋 医疗问诊结果');
    console.log('==========================================\n');

    const finalMessage = result.messages[result.messages.length - 1];
    console.log(finalMessage.content);

    if (result.diagnosis) {
      console.log(`\n💡 初步诊断: ${result.diagnosis.mostLikely} (置信度: ${result.diagnosis.confidence}%)`);
    }

    if (result.symptoms) {
      console.log(`🚨 紧急程度: ${result.symptoms.urgency}`);
    }

    console.log('\n⚠️  免责声明：本系统仅供参考，不能替代专业医生的诊断和治疗。');

  } catch (error) {
    console.error('❌ 错误:', error.message);
  }
}

// ==================== 主函数 ====================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--interactive' || args[0] === '-i') {
    await interactiveMode();
  } else {
    await singleQueryMode(args.join(' '));
  }
}

main().catch(console.error);
