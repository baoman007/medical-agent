class MedicalConsultation {
  final bool success;
  final String? content;
  final Map<String, dynamic>? symptoms;
  final Map<String, dynamic>? diagnosis;
  final Map<String, dynamic>? recommendations;
  final String urgency;
  final bool needsDoctor;

  MedicalConsultation({
    required this.success,
    this.content,
    this.symptoms,
    this.diagnosis,
    this.recommendations,
    required this.urgency,
    required this.needsDoctor,
  });

  factory MedicalConsultation.fromJson(Map<String, dynamic> json) {
    return MedicalConsultation(
      success: json['success'] ?? false,
      content: json['content'] as String?,
      symptoms: json['symptoms'] as Map<String, dynamic>?,
      diagnosis: json['diagnosis'] as Map<String, dynamic>?,
      recommendations: json['recommendations'] as Map<String, dynamic>?,
      urgency: json['urgency'] as String? ?? 'low',
      needsDoctor: json['needsDoctor'] as bool? ?? false,
    );
  }
}

class HistoryItem {
  final int id;
  final String message;
  final MedicalConsultation result;
  final String timestamp;

  HistoryItem({
    required this.id,
    required this.message,
    required this.result,
    required this.timestamp,
  });

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'message': message,
      'result': {
        'success': result.success,
        'content': result.content,
        'symptoms': result.symptoms,
        'diagnosis': result.diagnosis,
        'recommendations': result.recommendations,
        'urgency': result.urgency,
        'needsDoctor': result.needsDoctor,
      },
      'timestamp': timestamp,
    };
  }

  factory HistoryItem.fromJson(Map<String, dynamic> json) {
    return HistoryItem(
      id: json['id'] as int,
      message: json['message'] as String,
      result: MedicalConsultation.fromJson(
        json['result'] as Map<String, dynamic>? ?? {},
      ),
      timestamp: json['timestamp'] as String,
    );
  }
}
