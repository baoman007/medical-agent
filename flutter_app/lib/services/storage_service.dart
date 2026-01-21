import 'dart:convert';
import 'package:shared_preferences/shared_preferences.dart';
import '../models/medical_consultation.dart';

class StorageService {
  static const String _historyKey = 'consultation_history';

  Future<void> saveHistory(HistoryItem item) async {
    final prefs = await SharedPreferences.getInstance();
    final history = await getHistory();
    
    history.insert(0, item);
    
    // 只保留最近20条
    if (history.length > 20) {
      history.removeRange(20, history.length);
    }
    
    final historyJson = history.map((item) => item.toJson()).toList();
    await prefs.setString(_historyKey, jsonEncode(historyJson));
  }

  Future<List<HistoryItem>> getHistory() async {
    final prefs = await SharedPreferences.getInstance();
    final historyString = prefs.getString(_historyKey);
    
    if (historyString == null) return [];
    
    try {
      final historyJson = jsonDecode(historyString) as List;
      return historyJson
          .map((json) => HistoryItem.fromJson(json as Map<String, dynamic>))
          .toList();
    } catch (e) {
      return [];
    }
  }

  Future<void> clearHistory() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_historyKey);
  }

  Future<void> deleteHistoryItem(int id) async {
    final history = await getHistory();
    history.removeWhere((item) => item.id == id);
    
    final prefs = await SharedPreferences.getInstance();
    final historyJson = history.map((item) => item.toJson()).toList();
    await prefs.setString(_historyKey, jsonEncode(historyJson));
  }
}
