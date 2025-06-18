import 'dart:convert';
import 'package:hive/hive.dart';
import 'package:green_sentinel_mobile/feature/report/models/report_draft.dart';

part 'report_queue_item.g.dart';

/// Hive model for storing reports that need to be synced
@HiveType(typeId: 1)
class ReportQueueItem extends HiveObject {
  /// Serialized ReportDraft as JSON
  @HiveField(0)
  final String draftJson;

  /// Path to the image file
  @HiveField(1)
  final String imagePath;

  /// Number of retry attempts
  @HiveField(2)
  int retries;

  /// Timestamp when this item was enqueued
  @HiveField(3)
  final DateTime enqueuedAt;

  /// Creates a new [ReportQueueItem]
  ReportQueueItem({
    required this.draftJson,
    required this.imagePath,
    this.retries = 0,
    DateTime? enqueuedAt,
  }) : enqueuedAt = enqueuedAt ?? DateTime.now();

  /// Creates a [ReportQueueItem] from a [ReportDraft]
  factory ReportQueueItem.fromDraft(ReportDraft draft) {
    if (draft.filePath == null) {
      throw ArgumentError('Report draft must have a file path');
    }
    
    return ReportQueueItem(
      draftJson: jsonEncode(draft.toJson()),
      imagePath: draft.filePath!,
    );
  }

  /// Converts this [ReportQueueItem] back to a [ReportDraft]
  ReportDraft toDraft() {
    final Map<String, dynamic> json = jsonDecode(draftJson);
    return ReportDraft.fromJson(json);
  }

  /// Factory constructor to create a [ReportQueueItem] from JSON
  factory ReportQueueItem.fromJson(Map<String, dynamic> json) {
    return ReportQueueItem(
      draftJson: json['draftJson'],
      imagePath: json['imagePath'],
      retries: json['retries'] ?? 0,
      enqueuedAt: json['enqueuedAt'] != null 
          ? DateTime.parse(json['enqueuedAt']) 
          : DateTime.now(),
    );
  }

  /// Converts this [ReportQueueItem] to JSON
  Map<String, dynamic> toJson() {
    return {
      'draftJson': draftJson,
      'imagePath': imagePath,
      'retries': retries,
      'enqueuedAt': enqueuedAt.toIso8601String(),
    };
  }
}
