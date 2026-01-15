# 医疗问诊智能体

基于 LangChain、LangGraph 和 DeepSeek 构建的智能医疗问诊系统。

## 功能特点

- 🔍 **智能症状分析** - 提取和理解患者症状
- 🏥 **初步诊断建议** - 基于症状提供可能的疾病判断
- 💡 **个性化建议** - 提供自我护理和生活方式建议
- 🚨 **紧急程度评估** - 自动识别需要紧急就医的情况
- 📊 **结构化输出** - 使用 Zod Schema 确保数据结构化
- 🔄 **多节点工作流** - 使用 LangGraph 构建复杂的决策流程

## 技术栈

- **LangChain** - LLM 应用开发框架
- **LangGraph** - 状态机和工作流管理
- **DeepSeek** - 大语言模型
- **Zod** - 数据验证和 Schema 定义

## 安装

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并配置 DeepSeek API 密钥：

```bash
cp .env.example .env
```

编辑 `.env` 文件：

```env
DEEPSEEK_API_KEY=your_deepseek_api_key_here
DEEPSEEK_BASE_URL=https://api.deepseek.com/v1
TEMPERATURE=0.7
MAX_TOKENS=2000
```

## 使用方法

### 基本使用

```bash
npm start
```

这会使用默认示例运行。

### 自定义输入

```bash
npm start "我感觉头痛、发烧，持续了三天"
```

## LangGraph 工作流

### 节点说明

1. **analyzeSymptoms** - 症状分析节点
   - 提取患者症状
   - 评估持续时间
   - 判断严重程度

2. **assessUrgency** - 紧急程度评估
   - 识别警示症状
   - 判断是否需要急诊

3. **makeDiagnosis** - 医学诊断节点
   - 基于症状进行诊断
   - 提供疾病可能性列表
   - 给出诊断置信度

4. **generateRecommendations** - 生成建议节点
   - 自我护理建议
   - 生活方式调整
   - 监测指标
   - 随访计划

5. **generateResponse** - 综合响应节点
   - 生成患者友好的回复
   - 组织所有信息
   - 添加免责声明

### 决策流程

```
开始
  ↓
分析症状
  ↓
评估紧急程度
  ↓
  ├──[紧急]→ 生成响应 → 结束
  │
  └──[非紧急]→ 诊断 → 生成建议 → 生成响应 → 结束
```

## 数据结构

### 状态定义

```javascript
{
  messages: [],        // 对话消息历史
  symptoms: null,      // 症状分析结果
  urgency: null,       // 紧急程度
  diagnosis: null,     // 诊断结果
  recommendations: null,// 建议列表
  needsDoctor: false,  // 是否需要就医
}
```

### Schema 定义

#### SymptomAnalysisSchema
```javascript
{
  symptoms: string[],          // 症状列表
  duration: string,           // 持续时间
  severity: 'mild'|'moderate'|'severe',
  urgency: 'low'|'medium'|'high'|'emergency',
  needsEmergencyCare: boolean,
  notes: string
}
```

#### DiagnosisSchema
```javascript
{
  possibleConditions: string[],
  mostLikely: string,
  confidence: number,        // 0-100
  reasoning: string
}
```

#### RecommendationSchema
```javascript
{
  selfCare: string[],
  lifestyle: string[],
  monitoring: string[],
  followUp: string,
  whenToSeekCare: string,
  warnings: string[]
}
```

## 示例

### 示例 1：头痛、发烧（非紧急）

**输入：**
```
我感觉头痛、恶心，有点发烧，持续了两天
```

**输出：**
```
症状分析: 头痛、恶心、发烧
紧急程度: medium
最可能: 上呼吸道感染
置信度: 75%
建议: 休息、多喝水、监测体温
```

### 示例 2：胸痛、呼吸困难（紧急）

**输入：**
```
我昨晚胸痛，呼吸困难，出汗很多
```

**输出：**
```
⚠️ 紧急提醒：建议立即就医或拨打急救电话（120）
紧急程度: emergency
需要急诊: true
```

## 架构设计

### LangGraph 的优势

1. **状态管理** - 自动管理对话状态
2. **可视化流程** - 清晰的决策路径
3. **可扩展性** - 易于添加新节点
4. **错误处理** - 完善的异常处理机制
5. **条件路由** - 基于状态的智能路由

### 设计原则

1. **安全性** - 识别紧急情况，优先处理
2. **专业性** - 基于医学知识提供建议
3. **实用性** - 提供可执行的建议
4. **责任性** - 明确免责声明
5. **友好性** - 患者友好的表达方式

## 扩展功能

### 添加新的诊断领域

1. 创建新的 Schema
2. 添加新的节点
3. 更新工作流图

### 集成外部 API

- 电子病历系统
- 在线挂号系统
- 药品数据库
- 医院定位服务

### 多轮对话

```javascript
// 添加对话历史管理
workflow.addNode('clarifySymptoms', clarifySymptoms);
workflow.addEdge('analyzeSymptoms', 'clarifySymptoms');
```

## 安全提示

⚠️ **重要免责声明**

- 本系统仅供参考，不能替代专业医生诊断
- 紧急情况请立即就医
- 不要仅依赖 AI 建议做出医疗决策
- 建议结合专业医疗建议使用

## 故障排查

### 问题 1：API 调用失败

检查 `.env` 文件中的 API 密钥是否正确。

### 问题 2：模块导入错误

确保所有依赖已正确安装：

```bash
npm install
```

### 问题 3：Schema 验证失败

检查 Zod Schema 定义是否与模型输出匹配。

## 开发路线图

- [ ] 添加更多症状类型
- [ ] 集成医疗知识库
- [ ] 支持多语言
- [ ] 添加症状可视化
- [ ] 集成在线挂号
- [ ] 添加用药提醒功能
- [ ] 支持语音输入
- [ ] 移动端适配

## 贡献

欢迎提交 Issue 和 Pull Request！

## 许可证

MIT

## 联系方式

如有问题或建议，请联系开发者。

---

**最后更新：** 2026-01-13
**版本：** 1.0.0
