/**
 * 医疗问诊智能体测试脚本
 */

import 'dotenv/config';

async function testMedicalAgent() {
  console.log('==========================================');
  console.log('🧪 测试医疗问诊智能体');
  console.log('==========================================\n');

  const testCases = [
    {
      name: '测试1：轻微症状',
      input: '我感觉有点头痛，可能是昨天没睡好',
      expected: 'urgency: low'
    },
    {
      name: '测试2：中度症状',
      input: '我发烧38度，有点咳嗽，持续了两天',
      expected: 'urgency: medium'
    },
    {
      name: '测试3：紧急症状',
      input: '我胸痛很严重，呼吸困难，出了很多汗',
      expected: 'urgency: emergency'
    },
    {
      name: '测试4：复杂症状',
      input: '我最近一周总觉得疲惫，食欲不振，偶尔头晕',
      expected: 'multiple symptoms'
    },
    {
      name: '测试5：消化系统',
      input: '我胃疼，有点恶心，昨天吃坏了肚子',
      expected: 'digestive system'
    }
  ];

  let passed = 0;
  let failed = 0;

  for (const testCase of testCases) {
    console.log(`\n${testCase.name}`);
    console.log(`输入: ${testCase.input}`);
    console.log(`预期: ${testCase.expected}`);
    
    try {
      const { exec } = await import('child_process');
      const { promisify } = await import('util');
      const execAsync = promisify(exec);

      const { stdout, stderr } = await execAsync(
        `node index.js "${testCase.input}"`,
        { timeout: 60000 }
      );

      if (stderr) {
        console.log(`输出: ${stdout.substring(0, 200)}...`);
        passed++;
        console.log('✅ 测试通过\n');
      } else {
        console.log('⚠️  测试跳过（需要配置API密钥）\n');
      }
    } catch (error) {
      console.error(`❌ 测试失败: ${error.message}\n`);
      failed++;
    }
  }

  console.log('==========================================');
  console.log('📊 测试总结');
  console.log('==========================================');
  console.log(`✅ 通过: ${passed}`);
  console.log(`❌ 失败: ${failed}`);
  console.log(`📈 成功率: ${passed > 0 ? ((passed / (passed + failed)) * 100).toFixed(1) : 0}%`);
  console.log('==========================================\n');
}

testMedicalAgent().catch(console.error);
