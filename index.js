import 'dotenv/config';
import { ChatOpenAI } from '@langchain/openai';
import { StateGraph } from '@langchain/langgraph';
import { Annotation } from '@langchain/langgraph';
import { HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';
import { z } from 'zod';

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
  temperature: parseFloat(process.env.TEMPERATURE) || 0.7,
  maxTokens: parseInt(process.env.MAX_TOKENS) || 2000,
  configuration: {
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
  },
});

// ==================== 定义Schema ====================

const SymptomAnalysisSchema = z.object({
  symptoms: z.array(z.string()).describe('患者的症状列表'),
  duration: z.string().describe('症状持续时间'),
  severity: z.enum(['mild', 'moderate', 'severe']).describe('症状严重程度'),
  urgency: z.enum(['low', 'medium', 'high', 'emergency']).describe('紧急程度'),
  needsEmergencyCare: z.boolean().describe('是否需要立即就医'),
  notes: z.string().describe('其他重要信息'),
});

const DiagnosisSchema = z.object({
  possibleConditions: z.array(z.string()).describe('可能的疾病列表'),
  mostLikely: z.string().describe('最可能的疾病'),
  confidence: z.number().min(0).max(100).describe('诊断置信度（0-100）'),
  reasoning: z.string().describe('诊断理由'),
});

const RecommendationSchema = z.object({
  selfCare: z.array(z.string()).describe('自我护理建议'),
  lifestyle: z.array(z.string()).describe('生活方式建议'),
  monitoring: z.array(z.string()).describe('需要监测的症状'),
  followUp: z.string().describe('随访建议'),
  whenToSeekCare: z.string().describe('何时需要就医'),
  warnings: z.array(z.string()).describe('注意事项'),
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

/**
 * 节点1：症状分析
 * 提取并分析患者的症状
 */
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
      new HumanMessage(
        '你是一个专业的医疗助手，具有丰富的临床经验。你的任务是准确分析患者的症状。'
      ),
      new HumanMessage(prompt)
    ],
    SymptomAnalysisSchema
  );

  console.log('✅ 症状分析完成');
  console.log(`   症状: ${result.symptoms.join(', ')}`);
  console.log(`   紧急程度: ${result.urgency}`);
  console.log(`   需要急诊: ${result.needsEmergencyCare}`);

  return {
    symptoms: result,
    urgency: result.urgency,
    needsDoctor: result.needsEmergencyCare,
  };
}

/**
 * 节点2：医学诊断
 * 基于症状进行初步诊断
 */
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
      new SystemMessage(
        '你是一个经验丰富的医生。基于症状进行初步诊断，提供可能性和理由。'
      ),
      new HumanMessage(prompt)
    ],
    DiagnosisSchema
  );

  console.log('✅ 诊断完成');
  console.log(`   最可能: ${result.mostLikely}`);
  console.log(`   置信度: ${result.confidence}%`);
  console.log(`   可能疾病: ${result.possibleConditions.slice(0, 3).join(', ')}`);

  return {
    diagnosis: result,
  };
}

/**
 * 节点3：生成建议
 * 提供治疗和建议
 */
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
      new SystemMessage(
        '你是一个专业的医疗顾问。为患者提供实用、安全的医疗建议。'
      ),
      new HumanMessage(prompt)
    ],
    RecommendationSchema
  );

  console.log('✅ 建议生成完成');
  console.log(`   自我护理: ${result.selfCare.slice(0, 2).join(', ')}`);
  console.log(`   随访建议: ${result.followUp}`);

  return {
    recommendations: result,
  };
}

/**
 * 节点4：综合响应
 * 生成最终的患者友好回复
 */
async function generateResponse(state) {
  console.log('\n📝 [节点4] 生成最终回复...');

  const { symptoms, diagnosis, recommendations, needsDoctor } = state;

  const prompt = `作为医疗助手，为患者生成一个友好、专业、易懂的回复。

患者症状：${symptoms.symptoms.join(', ')}
持续时间：${symptoms.duration}
紧急程度：${symptoms.urgency}
需要急诊：${symptoms.needsEmergencyCare ? '是' : '否'}

最可能疾病：${diagnosis.mostLikely}
置信度：${diagnosis.confidence}%
可能疾病：${diagnosis.possibleConditions.join(', ')}

自我护理建议：
${recommendations.selfCare.map(s => `- ${s}`).join('\n')}

生活方式建议：
${recommendations.lifestyle.map(s => `- ${s}`).join('\n')}

监测症状：
${recommendations.monitoring.map(s => `- ${s}`).join('\n')}

随访建议：${recommendations.followUp}
何时就医：${recommendations.whenToSeekCare}

注意事项：
${recommendations.warnings.map(s => `- ${s}`).join('\n')}

请生成一个结构化、易于理解的回复，包括：
1. 症状总结
2. 可能的疾病
3. 紧急程度提示
4. 具体建议
5. 何时就医提醒
6. 免责声明

语气要专业、关怀、谨慎。`;

  const response = await llm.invoke([
    new SystemMessage(
      '你是一个专业的医疗助手，以关怀、专业的态度为患者提供医疗咨询。'
    ),
    new HumanMessage(prompt)
  ]);

  console.log('✅ 回复生成完成');

  return {
    messages: [response],
  };
}

/**
 * 节点5：紧急评估
 * 评估是否需要立即就医
 */
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
        new AIMessage(
          '⚠️ 紧急提醒：根据您的症状描述，建议立即就医或拨打急救电话（120）。' +
          '这些症状可能需要紧急医疗处理。请不要等待，立即寻求专业医疗帮助！'
        )
      ]
    };
  }

  return {};
}

// ==================== 构建LangGraph ====================

function createMedicalGraph() {
  const workflow = new StateGraph(StateAnnotation);

  // 添加节点
  workflow.addNode('analyzeSymptoms', analyzeSymptoms);
  workflow.addNode('assessUrgency', assessUrgency);
  workflow.addNode('makeDiagnosis', makeDiagnosis);
  workflow.addNode('generateRecommendations', generateRecommendations);
  workflow.addNode('generateResponse', generateResponse);

  // 设置入口
  workflow.setEntryPoint('analyzeSymptoms');

  // 添加边
  workflow.addEdge('analyzeSymptoms', 'assessUrgency');
  
  // 条件边：根据紧急程度决定是否需要跳过诊断
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

  // 设置结束节点
  workflow.setFinishPoint('generateResponse');

  return workflow.compile();
}

// ==================== 主函数 ====================

async function main() {
  console.log('==========================================');
  console.log('🏥 医疗问诊智能体');
  console.log('基于 LangChain + LangGraph + DeepSeek');
  console.log('==========================================\n');

  // 创建图
  const medicalGraph = createMedicalGraph();

  // 示例问题
  const exampleCases = [
    '我感觉头痛、恶心，有点发烧，持续了两天',
    '我最近咳嗽很厉害，有痰，感觉胸闷，持续了一周',
    '我昨晚胸痛，呼吸困难，出汗很多，感觉很害怕',
  ];

  console.log('📋 请选择示例或输入您的问题：');
  console.log('1. 头痛、恶心、发烧（非紧急）');
  console.log('2. 咳嗽、胸闷、有痰（中等紧急）');
  console.log('3. 胸痛、呼吸困难、出汗（紧急）');
  console.log('4. 自定义输入\n');

  // 使用示例1进行演示
  const selectedInput = process.argv[2] || exampleCases[0];
  
  console.log(`\n患者: "${selectedInput}"\n`);

  try {
    // 运行图
    const result = await medicalGraph.invoke({
      messages: [new HumanMessage(selectedInput)],
    });

    console.log('\n==========================================');
    console.log('📋 医疗问诊结果');
    console.log('==========================================\n');

    const finalMessage = result.messages[result.messages.length - 1];
    console.log(finalMessage.content);

    console.log('\n==========================================');
    console.log('📊 详细信息');
    console.log('==========================================\n');

    if (result.symptoms) {
      console.log('症状分析:');
      console.log(`  症状: ${result.symptoms.symptoms.join(', ')}`);
      console.log(`  持续时间: ${result.symptoms.duration}`);
      console.log(`  严重程度: ${result.symptoms.severity}`);
      console.log(`  紧急程度: ${result.symptoms.urgency}\n`);
    }

    if (result.diagnosis) {
      console.log('初步诊断:');
      console.log(`  最可能: ${result.diagnosis.mostLikely}`);
      console.log(`  置信度: ${result.diagnosis.confidence}%`);
      console.log(`  可能疾病: ${result.diagnosis.possibleConditions.join(', ')}\n`);
    }

    if (result.recommendations) {
      console.log('建议:');
      console.log(`  自我护理: ${result.recommendations.selfCare.join(', ')}`);
      console.log(`  随访建议: ${result.recommendations.followUp}\n`);
    }

    console.log('==========================================');
    console.log('⚠️  免责声明');
    console.log('==========================================');
    console.log('本系统提供的信息仅供参考，不能替代专业医生的诊断和治疗。');
    console.log('如有疑问或症状加重，请及时就医。');
    console.log('==========================================\n');

  } catch (error) {
    console.error('❌ 错误:', error.message);
    console.error(error);
  }
}

// 运行主函数
main().catch(console.error);

// 导出函数供其他模块使用
export { createMedicalGraph };
