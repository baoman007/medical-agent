# 医疗问诊智能体 - 架构文档

## 目录

1. [系统架构](#系统架构)
2. [技术栈](#技术栈)
3. [模块设计](#模块设计)
4. [数据流](#数据流)
5. [安全考虑](#安全考虑)
6. [扩展方案](#扩展方案)

## 系统架构

### 整体架构图

```
┌─────────────────────────────────────────────────────────────┐
│                     用户界面层                              │
│  (CLI / Web界面 / 移动端)                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   LangGraph 工作流层                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │症状分析  │→ │紧急评估  │→ │医学诊断  │→ │生成建议  │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘ │
│                                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   LangChain 应用层                          │
│  - LLM 调用                                                │
│  - Schema 验证                                             │
│  - Prompt 管理                                              │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ↓
┌─────────────────────────────────────────────────────────────┐
│                   DeepSeek 模型层                           │
│  - deepseek-chat                                           │
│  - 智能推理                                                 │
└─────────────────────────────────────────────────────────────┘
```

## 技术栈

### 核心框架

| 技术 | 版本 | 用途 |
|------|------|------|
| LangChain | ^0.3.0 | LLM 应用开发框架 |
| LangGraph | ^0.2.0 | 状态机和工作流 |
| DeepSeek | latest | 大语言模型 |
| Zod | latest | 数据验证 |
| Node.js | >=18 | 运行时环境 |

### 为什么选择这些技术？

#### LangChain
- 成熟的 LLM 应用框架
- 丰富的工具和集成
- 活跃的社区支持

#### LangGraph
- 可视化工作流
- 状态管理
- 条件路由
- 易于调试

#### DeepSeek
- 中文理解能力强
- API 响应快
- 成本相对低

## 模块设计

### 1. 状态管理模块

```javascript
const StateAnnotation = Annotation.Root({
  messages: [...],       // 对话历史
  symptoms: null,       // 症状分析
  urgency: null,        // 紧急程度
  diagnosis: null,      // 诊断结果
  recommendations: null, // 建议
  needsDoctor: false,   // 需就医
});
```

**设计原则：**
- 状态不可变
- 每个节点返回新的状态
- 使用 reducer 合并状态

### 2. Schema 定义模块

#### SymptomAnalysisSchema
- 目的：验证症状提取结果
- 字段：症状列表、持续时间、严重程度
- 用途：确保数据结构化

#### DiagnosisSchema
- 目的：验证诊断结果
- 字段：可能疾病、置信度、理由
- 用途：提供诊断依据

#### RecommendationSchema
- 目的：验证建议结果
- 字段：自我护理、生活方式、随访
- 用途：提供可执行建议

### 3. 节点模块

#### 节点1：analyzeSymptoms
```javascript
功能：提取和分析症状
输入：患者描述
输出：symptoms, urgency, needsDoctor
流程：
  1. 接收患者输入
  2. 使用 LLM 提取症状
  3. 评估严重程度
  4. 判断紧急程度
```

#### 节点2：assessUrgency
```javascript
功能：评估是否需要急诊
输入：symptoms
输出：needsDoctor, urgency
流程：
  1. 检查警示症状
  2. 判断是否紧急
  3. 决定下一步流程
```

#### 节点3：makeDiagnosis
```javascript
功能：进行初步诊断
输入：symptoms, urgency
输出：diagnosis
流程：
  1. 基于症状分析
  2. 查询可能疾病
  3. 计算置信度
  4. 提供诊断理由
```

#### 节点4：generateRecommendations
```javascript
功能：生成治疗建议
输入：symptoms, diagnosis, urgency
输出：recommendations
流程：
  1. 分析诊断结果
  2. 提供自我护理建议
  3. 给出生活方式建议
  4. 制定随访计划
```

#### 节点5：generateResponse
```javascript
功能：生成最终回复
输入：所有先前状态
输出：messages
流程：
  1. 整合所有信息
  2. 生成友好回复
  3. 添加免责声明
```

## 数据流

### 正常流程（非紧急）

```
用户输入
  ↓
analyzeSymptoms
  ├─ 提取症状
  ├─ 评估严重度
  └─ 返回 urgency: medium
  ↓
assessUrgency
  ├─ 检查警示症状
  ├─ 判断非紧急
  └─ 返回 continue
  ↓
makeDiagnosis
  ├─ 分析症状
  ├─ 提供可能疾病
  └─ 返回 diagnosis
  ↓
generateRecommendations
  ├─ 生成自我护理建议
  ├─ 提供生活方式建议
  └─ 返回 recommendations
  ↓
generateResponse
  ├─ 整合所有信息
  ├─ 生成友好回复
  └─ 返回最终结果
```

### 紧急流程

```
用户输入（胸痛、呼吸困难）
  ↓
analyzeSymptoms
  ├─ 提取症状
  └─ 返回 urgency: high
  ↓
assessUrgency
  ├─ 检测到警示症状
  ├─ 判断为紧急
  └─ 返回 emergency
  ↓
generateResponse（跳过诊断）
  ├─ 生成紧急提醒
  ├─ 建议立即就医
  └─ 返回紧急响应
```

## 安全考虑

### 1. 数据隐私

- 不存储患者个人信息
- 对话数据仅在内存中
- 不传输敏感信息

### 2. 医疗责任

- 添加明确的免责声明
- 识别紧急情况并建议就医
- 不替代专业医生诊断
- 强调仅作参考

### 3. 紧急识别

**警示症状列表：**
- 胸痛
- 呼吸困难
- 严重出血
- 意识不清
- 剧烈头痛
- 高烧
- 严重过敏反应
- 骨折
- 严重烧伤

### 4. 输出验证

- 使用 Zod Schema 验证
- 确保结构化输出
- 防止幻觉内容

## 扩展方案

### 1. 多模态输入

```javascript
// 添加图片分析节点
async function analyzeMedicalImage(state) {
  // 分析 X 光片、CT 等
}
```

### 2. 知识库集成

```javascript
// 添加知识检索节点
async function searchMedicalKnowledge(state) {
  // 从医学知识库检索
  // 提供循证医学支持
}
```

### 3. 历史记录

```javascript
// 添加对话历史管理
async function managePatientHistory(state) {
  // 保存和检索患者历史
  // 支持持续跟踪
}
```

### 4. 医生协作

```javascript
// 添加医生转接节点
async function referToDoctor(state) {
  // 生成详细报告
  // 推荐专科医生
}
```

### 5. 用药建议

```javascript
// 添加用药建议节点
async function suggestMedication(state) {
  // 基于诊断建议药物
  // 检查药物相互作用
  // 注意禁忌症
}
```

## 性能优化

### 1. 缓存策略

```javascript
// 缓存常见症状分析
const symptomCache = new Map();

async function analyzeSymptoms(state) {
  const key = state.messages[state.messages.length - 1].content;
  if (symptomCache.has(key)) {
    return symptomCache.get(key);
  }
  // ... 分析逻辑
  symptomCache.set(key, result);
  return result;
}
```

### 2. 并行处理

```javascript
// 并行执行独立节点
const [diagnosis, recommendations] = await Promise.all([
  makeDiagnosis(state),
  generateRecommendations(state)
]);
```

### 3. 流式输出

```javascript
// 使用流式输出提升用户体验
async function generateResponse(state) {
  const stream = await llm.stream(...);
  for await (const chunk of stream) {
    // 实时输出
  }
}
```

## 监控和日志

### 日志记录

```javascript
// 结构化日志
logger.info('Analysis started', {
  sessionId: state.sessionId,
  timestamp: new Date().toISOString()
});
```

### 性能指标

- 每个节点的执行时间
- LLM 调用次数
- API 响应时间
- 错误率

### 用户反馈

```javascript
// 收集用户反馈
async function collectFeedback(state, feedback) {
  // 保存反馈用于改进
}
```

## 总结

本架构设计遵循以下原则：

1. **模块化** - 每个节点职责单一
2. **可扩展** - 易于添加新功能
3. **安全性** - 优先考虑患者安全
4. **专业性** - 基于医学知识
5. **可用性** - 提供友好体验

---

**最后更新：** 2026-01-13
**版本：** 1.0.0
