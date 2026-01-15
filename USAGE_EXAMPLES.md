# 医疗问诊智能体 - 使用示例

## 目录

1. [快速开始](#快速开始)
2. [命令行使用](#命令行使用)
3. [交互模式](#交互模式)
4. [代码集成](#代码集成)
5. [常见场景](#常见场景)

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置 API 密钥

编辑 `.env` 文件，设置 DeepSeek API 密钥：

```env
DEEPSEEK_API_KEY=your_actual_api_key_here
```

### 3. 运行测试

```bash
# 单次查询
npm start "我感觉头痛、发烧，持续了两天"

# 交互模式
node interactive.js

# 运行测试
node test.js
```

## 命令行使用

### 基本用法

```bash
node index.js "你的症状描述"
```

### 示例

#### 示例 1：头痛

```bash
node index.js "我头痛，有点恶心，可能是昨晚没睡好"
```

**预期输出：**
```
🔍 [节点1] 分析症状...
   症状: 头痛, 恶心
   紧急程度: low

🏥 [节点2] 进行诊断...
   最可能: 睡眠不足引起的头痛
   置信度: 70%

💡 [节点3] 生成建议...
   自我护理: 休息, 补水

📝 [节点4] 生成最终回复...
✅ 回复生成完成

根据您的症状，初步诊断为睡眠不足引起的头痛...
```

#### 示例 2：感冒症状

```bash
node index.js "我发烧38度，咳嗽有痰，有点胸闷，持续了三天"
```

**预期输出：**
```
🔍 [节点1] 分析症状...
   症状: 发烧, 咳嗽, 胸闷
   紧急程度: medium

🏥 [节点2] 进行诊断...
   最可能: 上呼吸道感染
   置信度: 80%

💡 [节点3] 生成建议...
   自我护理: 休息, 多喝水, 监测体温

📝 [节点4] 生成最终回复...
✅ 回复生成完成

根据您的症状，初步诊断为上呼吸道感染...
```

#### 示例 3：紧急症状

```bash
node index.js "我胸痛很严重，呼吸困难，出了很多汗，感觉很害怕"
```

**预期输出：**
```
🔍 [节点1] 分析症状...
   症状: 胸痛, 呼吸困难, 出汗
   紧急程度: emergency

🚨 [节点5] 评估紧急程度...
   紧急评估: 需要立即就医

⚠️ 紧急提醒：根据您的症状描述，建议立即就医或拨打急救电话（120）...
```

## 交互模式

### 启动交互模式

```bash
node interactive.js
```

### 交互示例

```
==========================================
🏥 医疗问诊智能体 - 交互模式
基于 LangChain + LangGraph + DeepSeek
==========================================

👤 请描述您的症状（输入 "quit" 退出）: 我最近总是觉得累，食欲也不太好

🔍 [节点1] 分析症状...
✅ 症状分析完成

🏥 [节点2] 进行诊断...
✅ 诊断完成

💡 [节点3] 生成建议...
✅ 建议生成完成

📝 [节点4] 生成最终回复...
✅ 回复生成完成

==========================================
📋 医疗问诊结果
==========================================

症状总结：
您描述的主要症状是疲劳和食欲不振...

初步诊断：
根据您的症状，可能的疾病包括：贫血、甲状腺功能减退、慢性疲劳综合症...
最可能：轻度贫血 (置信度: 60%)

具体建议：
1. 自我护理：
   - 保证充足睡眠
   - 均衡饮食，补充铁质
   - 适度运动

2. 监测指标：
   - 观察精神状态变化
   - 记录食欲改善情况

3. 随访建议：
   - 如症状持续超过2周，建议就医
   - 可考虑进行血常规检查

💡 初步诊断: 轻度贫血 (置信度: 60%)
🚨 紧急程度: low

⚠️  免责声明：本系统仅供参考，不能替代专业医生的诊断和治疗。

👤 请描述您的症状（输入 "quit" 退出）: quit

感谢使用，祝您健康！
```

## 代码集成

### 作为模块导入

```javascript
import { createMedicalGraph } from './index.js';

async function customIntegration() {
  const medicalGraph = createMedicalGraph();
  
  const result = await medicalGraph.invoke({
    messages: [{ content: '你的症状描述' }],
  });
  
  console.log(result);
}
```

### 集成到 Web 应用

```javascript
import express from 'express';
import { createMedicalGraph } from './index.js';

const app = express();
const medicalGraph = createMedicalGraph();

app.post('/consult', async (req, res) => {
  try {
    const { symptoms } = req.body;
    
    const result = await medicalGraph.invoke({
      messages: [{ content: symptoms }],
    });
    
    res.json({
      success: true,
      diagnosis: result.diagnosis,
      recommendations: result.recommendations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

app.listen(3000);
```

### 集成到聊天机器人

```javascript
import { createMedicalGraph } from './index.js';

const medicalGraph = createMedicalGraph();

async function handleUserMessage(message) {
  // 检测是否为医疗咨询
  if (isMedicalQuery(message)) {
    const result = await medicalGraph.invoke({
      messages: [{ content: message }],
    });
    return formatMedicalResponse(result);
  } else {
    // 其他处理
  }
}
```

## 常见场景

### 场景 1：日常健康咨询

**用户输入：**
```
我最近总是失眠，白天精神不太好，有没有什么建议？
```

**系统响应：**
```
症状分析：失眠、精神不佳
紧急程度：low
诊断建议：可能为压力性失眠
自我护理：
- 建立规律作息
- 睡前避免使用电子设备
- 尝试冥想或深呼吸
- 避免咖啡因
随访建议：如持续超过1个月，建议就医
```

### 场景 2：消化系统问题

**用户输入：**
```
我胃疼，有点恶心，昨天吃了火锅后开始不舒服
```

**系统响应：**
```
症状分析：胃痛、恶心
紧急程度：low
诊断建议：急性胃炎或消化不良
自我护理：
- 暂时禁食，让胃休息
- 补充水分，避免脱水
- 可服用抗酸药（按说明书）
监测指标：疼痛是否缓解
随访建议：如疼痛持续超过24小时或加重，建议就医
```

### 场景 3：呼吸系统症状

**用户输入：**
```
我咳嗽很厉害，有痰，有时候还胸闷，已经一周了
```

**系统响应：**
```
症状分析：咳嗽、有痰、胸闷
紧急程度：medium
诊断建议：支气管炎或肺炎
自我护理：
- 多休息，避免劳累
- 多喝温水
- 使用加湿器
监测指标：体温变化、呼吸困难程度
随访建议：建议就医，可能需要胸片检查
何时就医：如出现发热或呼吸困难加重
```

### 场景 4：皮肤问题

**用户输入：**
```
我手臂上起了很多红疹子，有点痒，吃了抗过敏药好像没用
```

**系统响应：**
```
症状分析：红疹、瘙痒
紧急程度：low
诊断建议：可能为湿疹或接触性皮炎
自我护理：
- 避免抓挠
- 保持皮肤清洁干燥
- 避免已知过敏原
- 可使用保湿霜
随访建议：如症状持续超过3天或加重，建议就医
```

### 场景 5：肌肉骨骼疼痛

**用户输入：**
```
我昨天运动后腰就疼，今天起床都困难，动一下就痛
```

**系统响应：**
```
症状分析：腰痛、活动受限
紧急程度：low
诊断建议：肌肉拉伤或腰肌劳损
自我护理：
- 休息，避免剧烈运动
- 局部冷敷（前48小时）
- 可使用非甾体抗炎药
监测指标：疼痛程度、活动范围
随访建议：如疼痛持续超过5天，建议就医
```

### 场景 6：心理健康关注

**用户输入：**
```
我最近总是情绪低落，不想和人交流，对什么都没兴趣
```

**系统响应：**
```
症状分析：情绪低落、社交回避、兴趣丧失
紧急程度：medium
诊断建议：可能为抑郁症状
自我护理：
- 尝试与信任的人交流
- 保持规律作息
- 适度运动
- 避免隔离
随访建议：建议咨询心理医生或精神科医生
紧急提醒：如有自伤念头，立即就医或拨打心理援助热线
```

## 高级用法

### 自定义 Schema

```javascript
import { z } from 'zod';

const CustomSymptomSchema = z.object({
  // 自定义字段
  additionalInfo: z.string(),
});
```

### 添加新节点

```javascript
workflow.addNode('customNode', async (state) => {
  // 自定义逻辑
  return { customData: '...' };
});
```

### 修改工作流

```javascript
// 添加新的分支
workflow.addConditionalEdges(
  'assessUrgency',
  {
    emergency: 'generateResponse',
    high: 'recommendation',
    medium: 'diagnosis',
    low: 'selfCare',
  },
  (state) => {
    return state.urgency;
  }
);
```

## 最佳实践

1. **描述清晰**：详细描述症状，包括持续时间、严重程度
2. **诚实回答**：不要隐瞒重要信息
3. **遵循建议**：认真对待系统提供的建议
4. **及时就医**：紧急情况不要等待
5. **持续跟踪**：记录症状变化

## 故障排查

### 问题：API 调用失败

**解决方法：**
1. 检查 `.env` 文件中的 API 密钥
2. 确认网络连接正常
3. 验证 API 密钥是否有效

### 问题：症状识别不准确

**解决方法：**
1. 提供更详细的症状描述
2. 包含持续时间和严重程度
3. 提供相关背景信息

### 问题：建议不够具体

**解决方法：**
1. 在交互模式中提供更多细节
2. 使用多轮对话补充信息
3. 明确告知自己的情况和需求

---

**最后更新：** 2026-01-13
**版本：** 1.0.0
