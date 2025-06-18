import 'dart:convert';
import 'dart:io';
import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:dio/dio.dart';
import 'package:flutter/foundation.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/models/report_draft.dart';
import 'package:green_sentinel_mobile/local_storage/hive_boxes.dart';
import 'package:green_sentinel_mobile/local_storage/models/report_queue_item.dart';
import 'package:green_sentinel_mobile/models/report_response.dart';
import 'package:green_sentinel_mobile/services/api_client.dart';
import 'package:green_sentinel_mobile/services/sync_service.dart';

/// Repository for report-related operations
class ReportRepository {
  /// Creates a new [ReportRepository]
  ReportRepository({
    Dio? dio,
    Connectivity? connectivity,
    bool? autoFlushQueue,
  })  : _dio = dio ?? ApiClient.instance.dio,
        _connectivity = connectivity ?? Connectivity(),
        _autoFlushQueue = autoFlushQueue ?? true;

  final Dio _dio;
  final Connectivity _connectivity;
  final bool _autoFlushQueue;

  /// Uploads a report to the server
  /// 
  /// Returns [ReportResponse] on success, null on failure
  /// If offline, enqueues the report for later submission
  Future<ReportResponse?> uploadReport(ReportDraft draft) async {
    try {
      // Validate required fields first
      if (!draft.isComplete) {
        debugPrint('❌ Report is incomplete, cannot upload');
        return null;
      }

      // Check connectivity
      final connectivityResult = await _connectivity.checkConnectivity();
      
      // If we're offline, enqueue the report
      if (connectivityResult == ConnectivityResult.none) {
        debugPrint('📶 No connectivity, enqueueing report for later upload');
        final enqueued = await enqueueReport(draft);
        
        // Return null to indicate no immediate server response
        // but the UI can show "saved offline" message
        return null;
      }
      
      // We're online, try to upload directly
      return await uploadReportMultipart(draft);
    } catch (e) {
      debugPrint('❌ Error in uploadReport: $e');
      
      // Try to save offline on any error
      await enqueueReport(draft);
      return null;
    }
  }
  
  /// Uploads a report using multipart form data
  Future<ReportResponse?> uploadReportMultipart(ReportDraft draft) async {
    try {
      // Create the form data
      final formData = FormData();

      // Add the image file
      if (draft.filePath != null) {
        final file = File(draft.filePath!);
        if (await file.exists()) {
          formData.files.add(
            MapEntry(
              'image',
              await MultipartFile.fromFile(
                file.path,
                filename: 'report_image_${DateTime.now().millisecondsSinceEpoch}.jpg',
              ),
            ),
          );
        } else {
          debugPrint('❌ Image file does not exist: ${draft.filePath}');
          return null;
        }
      } else {
        debugPrint('❌ No image file path in draft');
        return null;
      }

      // Create the payload JSON
      final Map<String, dynamic> payload = {
        'type': draft.problemType?.label,
        'severity': draft.severityLevel,
        'description': draft.description,
        'area': draft.areaType?.label,
        'latitude': draft.latitude,
        'longitude': draft.longitude,
        'timestamp': draft.timestamp.toIso8601String(),
      };

      // Add the payload as a form field
      formData.fields.add(
        MapEntry('payload', jsonEncode(payload)),
      );

      // Send the request
      final response = await _dio.post<Map<String, dynamic>>(
        '/reports',
        data: formData,
      );

      // Handle the response
      if (response.statusCode == 200 && response.data != null) {
        debugPrint('✅ Report uploaded successfully');
        return ReportResponse.fromJson(response.data!);
      }

      debugPrint('❌ Report upload failed with status: ${response.statusCode}');
      return null;
    } catch (e) {
      debugPrint('❌ Error uploading report: $e');
      return null;
    }
  }
  
  /// Enqueues a report for later submission when offline
  Future<bool> enqueueReport(ReportDraft draft) async {
    try {
      if (draft.filePath == null) {
        debugPrint('❌ Cannot enqueue report without image file');
        return false;
      }
      
      // Create a queue item from the draft
      final queueItem = ReportQueueItem.fromDraft(draft);
      
      // Add to the queue
      await Boxes.reportQueue.add(queueItem);
      
      debugPrint('✅ Report enqueued successfully');
      
      // Try to schedule a background sync
      if (_autoFlushQueue) {
        SyncService.requestImmediateSync();
      }
      
      return true;
    } catch (e) {
      debugPrint('❌ Error enqueueing report: $e');
      return false;
    }
  }
  
  /// Gets the number of reports in the queue
  int getQueueLength() {
    try {
      return Boxes.reportQueue.length;
    } catch (e) {
      debugPrint('❌ Error getting queue length: $e');
      return 0;
    }
  }
  
  /// Flushes the queue of pending reports
  Future<void> flushQueue() async {
    final syncService = SyncService(repository: this);
    await syncService.flushQueue();
  }
}
