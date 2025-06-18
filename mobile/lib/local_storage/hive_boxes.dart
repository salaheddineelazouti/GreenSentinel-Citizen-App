import 'package:hive_flutter/hive_flutter.dart';
import 'package:green_sentinel_mobile/local_storage/models/report_queue_item.dart';
import 'package:path_provider/path_provider.dart';

/// Helper class for accessing Hive boxes
class Boxes {
  /// Box for the report queue items
  static Box<ReportQueueItem> get reportQueue => 
      Hive.box<ReportQueueItem>('reportQueue');
}

/// Initialize Hive and open the required boxes
Future<void> initHive() async {
  // Initialize Hive
  final appDocumentDir = await getApplicationDocumentsDirectory();
  await Hive.initFlutter(appDocumentDir.path);
  
  // Register adapters
  Hive.registerAdapter(ReportQueueItemAdapter());
  
  // Open boxes
  await Hive.openBox<ReportQueueItem>('reportQueue');
}
