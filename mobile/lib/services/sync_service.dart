import 'dart:isolate';
import 'dart:ui';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/foundation.dart';
import 'package:green_sentinel_mobile/local_storage/hive_boxes.dart';
import 'package:green_sentinel_mobile/local_storage/models/report_queue_item.dart';
import 'package:green_sentinel_mobile/services/report_repository.dart';
import 'package:hive_flutter/adapters.dart';
import 'package:workmanager/workmanager.dart';

/// Name of the background task that syncs reports
const String kSyncReportsTaskName = 'syncReports';

/// Callback name for Isolate communication
const String _kSyncBackgroundPort = 'sync_background_port';

/// Service for synchronizing offline reports when connectivity is restored
class SyncService {
  /// Instance of the repository for sending reports
  final ReportRepository _repository;
  
  /// Connectivity instance for monitoring network state
  final Connectivity _connectivity;
  
  /// Creates a new [SyncService]
  SyncService({
    ReportRepository? repository, 
    Connectivity? connectivity,
  }) : _repository = repository ?? ReportRepository(),
       _connectivity = connectivity ?? Connectivity();
  
  /// Stream of network connectivity changes
  Stream<ConnectivityResult> get connectivityStream => 
      _connectivity.onConnectivityChanged;
  
  /// Last known connectivity status
  ConnectivityResult _lastConnectivity = ConnectivityResult.none;
  
  /// Initialize the service and set up listeners
  Future<void> initialize() async {
    // Get the initial connectivity status
    _lastConnectivity = await _connectivity.checkConnectivity();
    
    // Listen for connectivity changes
    connectivityStream.listen(_handleConnectivityChange);
  }
  
  /// Handle connectivity changes
  void _handleConnectivityChange(ConnectivityResult result) {
    // If we were offline and now we're online, try to flush the queue
    if (_lastConnectivity == ConnectivityResult.none && 
        (result == ConnectivityResult.mobile || result == ConnectivityResult.wifi)) {
      flushQueue();
    }
    
    _lastConnectivity = result;
  }
  
  /// Try to send all queued reports
  Future<void> flushQueue() async {
    try {
      final box = Boxes.reportQueue;
      final keys = box.keys.toList();
      
      debugPrint('🔄 Flushing queue with ${keys.length} items');
      
      for (final key in keys) {
        final item = box.get(key);
        if (item == null) continue;
        
        // Check if we've exceeded max retry count
        if (item.retries >= 5) {
          debugPrint('⚠️ Maximum retries reached for item $key, removing from queue');
          await box.delete(key);
          continue;
        }
        
        // Try to send the report
        final success = await _trySendQueueItem(item);
        
        if (success) {
          // If successful, remove from queue
          debugPrint('✓ Successfully sent queued report $key');
          await box.delete(key);
        } else {
          // Increment retry count and update the item
          item.retries++;
          debugPrint('× Failed to send queued report $key, retry: ${item.retries}');
          
          // Use exponential backoff - don't try again immediately
          if (item.retries < 5) {
            await box.put(key, item);
          } else {
            // Maximum retries reached, remove from queue
            await box.delete(key);
          }
        }
      }
    } catch (e) {
      debugPrint('Error flushing queue: $e');
    }
  }
  
  /// Try to send a queue item
  Future<bool> _trySendQueueItem(ReportQueueItem item) async {
    try {
      final draft = item.toDraft();
      final response = await _repository.uploadReport(draft);
      return response != null;
    } catch (e) {
      debugPrint('Error sending queued report: $e');
      return false;
    }
  }
  
  /// Schedule periodic background sync task
  static Future<void> schedulePeriodicSync() async {
    await Workmanager().registerPeriodicTask(
      'sync-reports-periodic',
      kSyncReportsTaskName,
      frequency: const Duration(minutes: 15),
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
      existingWorkPolicy: ExistingWorkPolicy.keep,
    );
  }
  
  /// Request an immediate sync
  static Future<void> requestImmediateSync() async {
    await Workmanager().registerOneOffTask(
      'sync-reports-immediate-${DateTime.now().millisecondsSinceEpoch}',
      kSyncReportsTaskName,
      constraints: Constraints(
        networkType: NetworkType.connected,
      ),
    );
  }
}

/// Background task handler for WorkManager
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    // Set up communication with main isolate if needed
    final SendPort? sendPort = IsolateNameServer.lookupPortByName(
      _kSyncBackgroundPort,
    );
    
    switch (task) {
      case kSyncReportsTaskName:
        try {
          // Initialize Hive
          await initHive();
          
          // Create repository and flush queue
          final repository = ReportRepository();
          final syncService = SyncService(repository: repository);
          await syncService.flushQueue();
          
          // Notify main isolate if port is available
          sendPort?.send('sync_completed');
          return true;
        } catch (e) {
          debugPrint('Background sync failed: $e');
          return false;
        }
      default:
        return false;
    }
  });
}
