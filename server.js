import express from 'express';
import cors from 'cors';
import { createMedicalGraph } from './index.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// 创建医疗图实例
const medicalGraph = createMedicalGraph();

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: '医疗问诊 API 服务运行正常' });
});

// 医疗问诊接口
app.post('/api/consult', async (req, res) => {
  try {
    const { message } = req.body;

    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        error: '请提供有效的症状描述'
      });
    }

    console.log(`\n📝 收到问诊请求: ${message}`);

    // 调用医疗问诊图
    const result = await medicalGraph.invoke({
      messages: [{ content: message }],
    });

    // 提取结果
    const finalMessage = result.messages[result.messages.length - 1];
    const response = {
      success: true,
      content: finalMessage.content,
      symptoms: result.symptoms,
      diagnosis: result.diagnosis,
      recommendations: result.recommendations,
      urgency: result.symptoms?.urgency || result.urgency,
      needsDoctor: result.needsDoctor || result.symptoms?.needsEmergencyCare,
    };

    console.log('✅ 问诊完成\n');

    res.json(response);
  } catch (error) {
    console.error('❌ 问诊错误:', error);

    res.status(500).json({
      success: false,
      error: error.message || '处理请求时发生错误',
    });
  }
});

// 启动服务器
app.listen(PORT, () => {
  console.log('==========================================');
  console.log('🏥 医疗问诊 Web 服务');
  console.log('==========================================');
  console.log(`📡 API 服务运行在: http://localhost:${PORT}`);
  console.log(`🌐 Web 界面访问: http://localhost:${PORT}`);
  console.log('==========================================\n');
});

export default app;
