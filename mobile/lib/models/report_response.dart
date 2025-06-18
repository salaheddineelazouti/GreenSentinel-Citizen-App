/// Response model for report submission API
class ReportResponse {
  /// Unique identifier for the report
  final String id;

  /// Status of the report (pending_validation, approved, rejected)
  final String status;

  /// UTC timestamp when the report was created on the server
  final DateTime createdAt;

  /// Creates a new [ReportResponse]
  const ReportResponse({
    required this.id,
    required this.status,
    required this.createdAt,
  });

  /// Creates a [ReportResponse] from JSON data
  factory ReportResponse.fromJson(Map<String, dynamic> json) {
    return ReportResponse(
      id: json['id'] as String,
      status: json['status'] as String,
      createdAt: DateTime.parse(json['createdAt'] as String),
    );
  }

  /// Converts this [ReportResponse] to a JSON map
  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'status': status,
      'createdAt': createdAt.toIso8601String(),
    };
  }

  @override
  String toString() {
    return 'ReportResponse{id: $id, status: $status, createdAt: $createdAt}';
  }
}
