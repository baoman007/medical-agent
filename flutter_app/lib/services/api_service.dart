import 'dart:convert';
import 'package:http/http.dart' as http;
import '../models/medical_consultation.dart';

class ApiService {
  final String baseUrl;
  final Duration timeout;

  ApiService({
    // Android 真机需要使用局域网 IP
    this.baseUrl = 'http://192.168.2.156:3001',
    this.timeout = const Duration(seconds: 60),
  });

  Future<MedicalConsultation> consult(String message) async {
    final url = Uri.parse('$baseUrl/api/consult');
    
    try {
      final response = await http
          .post(
            url,
            headers: {'Content-Type': 'application/json'},
            body: jsonEncode({'message': message}),
          )
          .timeout(timeout);

      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        return MedicalConsultation.fromJson(data);
      } else {
        throw Exception('服务器错误: ${response.statusCode}');
      }
    } catch (e) {
      throw Exception('网络请求失败: $e');
    }
  }

  Future<bool> checkHealth() async {
    final url = Uri.parse('$baseUrl/api/health');
    
    try {
      final response = await http.get(url).timeout(const Duration(seconds: 5));
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }
}
