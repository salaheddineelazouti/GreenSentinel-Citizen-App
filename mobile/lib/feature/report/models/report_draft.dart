import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';

/// Data class representing a draft report before submission
class ReportDraft {
  /// Path to the image file on device
  final String? filePath;

  /// Latitude of the location where the report was created
  final double? latitude;

  /// Longitude of the location where the report was created
  final double? longitude;

  /// Timestamp when the report was created
  final DateTime timestamp;

  /// Type of environmental problem
  final ProblemType? problemType;

  /// Description provided by the user
  final String? description;

  /// Severity level from 1-5
  final int severityLevel;
  
  /// Type of affected area
  final AreaType? areaType;

  /// Creates a new [ReportDraft]
  const ReportDraft({
    this.filePath,
    this.latitude,
    this.longitude,
    DateTime? timestamp,
    this.problemType,
    this.description,
    this.severityLevel = 1,
    this.areaType = AreaType.none,
  }) : timestamp = timestamp ?? DateTime.now();

  /// Creates a copy of this [ReportDraft] with the given fields replaced
  ReportDraft copyWith({
    String? filePath,
    double? latitude,
    double? longitude,
    DateTime? timestamp,
    ProblemType? problemType,
    String? description,
    int? severityLevel,
    AreaType? areaType,
  }) {
    return ReportDraft(
      filePath: filePath ?? this.filePath,
      latitude: latitude ?? this.latitude,
      longitude: longitude ?? this.longitude,
      timestamp: timestamp ?? this.timestamp,
      problemType: problemType ?? this.problemType,
      description: description ?? this.description,
      severityLevel: severityLevel ?? this.severityLevel,
      areaType: areaType ?? this.areaType,
    );
  }

  /// Returns true if the report has all required data to be submitted
  bool get isComplete => 
      filePath != null && 
      latitude != null && 
      longitude != null && 
      problemType != null && 
      description != null && 
      description!.isNotEmpty;

  /// Returns a string representation of the location
  String get locationText {
    if (latitude == null || longitude == null) {
      return 'Position inconnue';
    }

    return '${latitude!.toStringAsFixed(2)}, ${longitude!.toStringAsFixed(2)}';
  }
}
