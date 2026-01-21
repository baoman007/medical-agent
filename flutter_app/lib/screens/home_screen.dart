import 'package:flutter/material.dart';
import '../models/medical_consultation.dart';
import '../services/api_service.dart';
import '../services/storage_service.dart';

class HomeScreen extends StatefulWidget {
  const HomeScreen({super.key});

  @override
  State<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends State<HomeScreen> {
  final TextEditingController _symptomController = TextEditingController();
  final ApiService _apiService = ApiService();
  final StorageService _storageService = StorageService();
  
  bool _isLoading = false;
  bool _showResult = false;
  MedicalConsultation? _consultationResult;
  
  // 常见症状标签
  final List<String> _commonSymptoms = [
    '头痛',
    '发热',
    '咳嗽',
    '咽痛',
    '胸闷',
    '恶心',
    '乏力',
    '失眠',
    '心悸',
    '腹痛',
  ];

  void _addSymptom(String symptom) {
    final currentText = _symptomController.text.trim();
    final newText = currentText.isEmpty ? symptom : '$currentText、$symptom';
    _symptomController.text = newText;
  }

  Future<void> _submitConsultation() async {
    final message = _symptomController.text.trim();
    
    if (message.isEmpty) {
      _showSnackBar('请描述您的症状');
      return;
    }

    setState(() {
      _isLoading = true;
      _showResult = false;
    });

    try {
      final result = await _apiService.consult(message);
      
      setState(() {
        _isLoading = false;
        _showResult = true;
        _consultationResult = result;
      });

      if (result.diagnosis != null && result.diagnosis!.isNotEmpty) {
        await _storageService.saveHistory(
          HistoryItem(
            id: DateTime.now().millisecondsSinceEpoch,
            message: message,
            result: result,
            timestamp: DateTime.now().toLocal().toString(),
          ),
        );
      }

      if (mounted) {
        _showSnackBar('问诊完成');
      }
    } catch (e) {
      setState(() {
        _isLoading = false;
      });
      if (mounted) {
        _showSnackBar('问诊失败: $e');
      }
    }
  }

  void _showSnackBar(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text(message),
        duration: const Duration(seconds: 2),
      ),
    );
  }

  String _getUrgencyText(String urgency) {
    switch (urgency.toLowerCase()) {
      case 'emergency':
        return '🚨 紧急 - 建议立即就医';
      case 'high':
        return '⚠️ 高度关注 - 建议尽快就医';
      case 'medium':
        return '⚡ 中等 - 建议观察并咨询医生';
      default:
        return '✓ 轻微 - 可在家观察';
    }
  }

  Color _getUrgencyColor(String urgency) {
    switch (urgency.toLowerCase()) {
      case 'emergency':
        return Colors.red;
      case 'high':
        return Colors.orange;
      case 'medium':
        return Colors.amber;
      default:
        return Colors.green;
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('医疗问诊助手'),
        backgroundColor: Colors.blue,
        foregroundColor: Colors.white,
        actions: [
          IconButton(
            icon: const Icon(Icons.history),
            onPressed: () {
              Navigator.pushNamed(context, '/history');
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const Text(
              '描述您的症状',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: 8),
            const Text(
              '请详细描述您的不适症状，我们会为您提供专业的医疗建议',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
            ),
            const SizedBox(height: 16),
            
            // 症状输入框
            TextField(
              controller: _symptomController,
              maxLines: 4,
              decoration: InputDecoration(
                hintText: '例如：头痛、发热、咳嗽...',
                border: OutlineInputBorder(
                  borderRadius: BorderRadius.circular(12),
                ),
                filled: true,
                fillColor: Colors.grey[50],
              ),
            ),
            const SizedBox(height: 16),
            
            // 常见症状标签
            const Text(
              '常见症状',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.w500,
              ),
            ),
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              runSpacing: 8,
              children: _commonSymptoms.map((symptom) {
                return ActionChip(
                  label: Text(symptom),
                  onPressed: () => _addSymptom(symptom),
                );
              }).toList(),
            ),
            const SizedBox(height: 24),
            
            // 提交按钮
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isLoading ? null : _submitConsultation,
                style: ElevatedButton.styleFrom(
                  backgroundColor: Colors.blue,
                  foregroundColor: Colors.white,
                  padding: const EdgeInsets.symmetric(vertical: 16),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(12),
                  ),
                ),
                child: _isLoading
                    ? const CircularProgressIndicator(color: Colors.white)
                    : const Text(
                        '开始问诊',
                        style: TextStyle(fontSize: 16),
                      ),
              ),
            ),
            
            // 问诊结果
            if (_showResult && _consultationResult != null) ...[
              const SizedBox(height: 24),
              _buildResultCard(),
            ],
          ],
        ),
      ),
    );
  }

  Widget _buildResultCard() {
    final result = _consultationResult!;
    
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(12)),
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // 紧急程度
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: _getUrgencyColor(result.urgency).withOpacity(0.1),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(
                  color: _getUrgencyColor(result.urgency),
                  width: 1,
                ),
              ),
              child: Text(
                _getUrgencyText(result.urgency),
                style: TextStyle(
                  color: _getUrgencyColor(result.urgency),
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
            const SizedBox(height: 16),
            
            // 建议内容
            if (result.content != null) ...[
              const Text(
                '问诊建议',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                result.content!,
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ],
            
            const SizedBox(height: 16),
            
            // 诊断信息
            if (result.diagnosis != null && result.diagnosis!.isNotEmpty) ...[
              const Text(
                '可能诊断',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                result.diagnosis!['mostLikely']?.toString() ?? '暂无',
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ],
            
            const SizedBox(height: 16),
            
            // 治疗建议
            if (result.recommendations != null && result.recommendations!.isNotEmpty) ...[
              const Text(
                '治疗建议',
                style: TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                result.recommendations.toString(),
                style: const TextStyle(fontSize: 14, height: 1.5),
              ),
            ],
          ],
        ),
      ),
    );
  }

  @override
  void dispose() {
    _symptomController.dispose();
    super.dispose();
  }
}
