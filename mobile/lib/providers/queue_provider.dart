import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:green_sentinel_mobile/local_storage/hive_boxes.dart';
import 'package:green_sentinel_mobile/local_storage/models/report_queue_item.dart';
import 'package:green_sentinel_mobile/services/report_repository.dart';
import 'package:hive_flutter/hive_flutter.dart';

/// Provider for the report repository
final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository();
});

/// Provider that streams the number of reports in the queue
final queueLengthStreamProvider = StreamProvider<int>((ref) {
  final repository = ref.watch(reportRepositoryProvider);
  
  // Get initial length
  final initialLength = repository.getQueueLength();
  
  // Listen to changes in the box
  return Boxes.reportQueue
    .listenable()
    .map<int>((box) => box.length)
    .distinct() // Only emit when the length changes
    .startWith(initialLength); // Start with the initial value
});

/// Provider that returns the current queue length
final queueLengthProvider = Provider<int>((ref) {
  // Use the async value from the stream provider if available
  final asyncValue = ref.watch(queueLengthStreamProvider);
  
  return asyncValue.maybeWhen(
    data: (length) => length,
    orElse: () {
      // If the stream has not emitted a value yet, use the repository directly
      final repository = ref.read(reportRepositoryProvider);
      return repository.getQueueLength();
    },
  );
});
