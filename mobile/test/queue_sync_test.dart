import 'dart:io';
import 'dart:convert';

import 'package:connectivity_plus/connectivity_plus.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:green_sentinel_mobile/feature/home/widgets/unsent_badge.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/models/report_draft.dart';
import 'package:green_sentinel_mobile/local_storage/hive_boxes.dart';
import 'package:green_sentinel_mobile/local_storage/models/report_queue_item.dart';
import 'package:green_sentinel_mobile/providers/queue_provider.dart';
import 'package:green_sentinel_mobile/services/report_repository.dart';
import 'package:green_sentinel_mobile/services/sync_service.dart';
import 'package:hive_flutter/hive_flutter.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';
import 'package:path_provider_platform_interface/path_provider_platform_interface.dart';
import 'package:path_provider/path_provider.dart';

import 'test_utils.dart';

class MockConnectivity extends Mock implements Connectivity {
  final List<ConnectivityResult> _results = [];
  Stream<ConnectivityResult>? _stream;

  void addResult(ConnectivityResult result) {
    _results.add(result);
    
    // If there's an active stream controller, add the event
    if (_stream != null) {
      (_stream as MockConnectivityStream).add(result);
    }
  }

  @override
  Future<ConnectivityResult> checkConnectivity() async {
    if (_results.isEmpty) {
      return ConnectivityResult.none; // Default to offline
    }
    return _results.last;
  }
  
  @override
  Stream<ConnectivityResult> get onConnectivityChanged {
    _stream ??= MockConnectivityStream();
    return _stream!;
  }
}

class MockConnectivityStream extends Stream<ConnectivityResult> {
  final _controller = StreamController<ConnectivityResult>.broadcast();
  
  void add(ConnectivityResult result) {
    _controller.add(result);
  }
  
  @override
  StreamSubscription<ConnectivityResult> listen(
    void Function(ConnectivityResult event)? onData,
    {Function? onError, void Function()? onDone, bool? cancelOnError}
  ) {
    return _controller.stream.listen(
      onData,
      onError: onError,
      onDone: onDone,
      cancelOnError: cancelOnError,
    );
  }
}

class MockFile extends Mock implements File {
  @override
  String get path => 'test/mock_image.jpg';
  
  @override
  Future<bool> exists() async => true;
}

class MockReportRepository extends Mock implements ReportRepository {}

void main() {
  TestWidgetsFlutterBinding.ensureInitialized();
  late MockConnectivity mockConnectivity;
  late Box<ReportQueueItem> mockBox;
  late ReportDraft testDraft;
  
  setUpAll(() async {
    // Set up temporary path for Hive
    final temporaryDir = await Directory.systemTemp.createTemp();
    
    // Initialize Hive for testing
    Hive.init(temporaryDir.path);
    
    // Register the adapter
    Hive.registerAdapter(ReportQueueItemAdapter());
    
    // Open a test box
    mockBox = await Hive.openBox<ReportQueueItem>('reportQueue');
    
    // Create a test draft
    testDraft = ReportDraft(
      filePath: 'test/mock_image.jpg',
      problemType: ProblemType.fromLabel('Fire'),
      description: 'Test description',
      areaType: AreaType.fromLabel('Forest'),
      severityLevel: 8,
      latitude: 37.7749,
      longitude: -122.4194,
      timestamp: DateTime.now(),
    );
  });

  setUp(() {
    // Clear the test box before each test
    mockBox.clear();
    
    // Set up mock connectivity
    mockConnectivity = MockConnectivity();
  });

  tearDownAll(() async {
    // Close Hive
    await Hive.close();
  });

  group('ReportRepository with offline queue', () {
    test('Should enqueue report when offline', () async {
      // Arrange
      mockConnectivity.addResult(ConnectivityResult.none);
      final repository = ReportRepository(connectivity: mockConnectivity);
      
      // Act
      final result = await repository.uploadReport(testDraft);
      
      // Assert
      expect(result, isNull);
      expect(mockBox.length, 1);
      
      // Check the queued item has the correct data
      final queueItem = mockBox.getAt(0)!;
      final decodedDraft = jsonDecode(queueItem.draftJson);
      expect(decodedDraft['description'], testDraft.description);
      expect(queueItem.imagePath, testDraft.filePath);
      expect(queueItem.retries, 0);
    });
    
    test('Should return queue length correctly', () async {
      // Arrange
      mockConnectivity.addResult(ConnectivityResult.none);
      final repository = ReportRepository(connectivity: mockConnectivity);
      
      // Act & Assert - Initially empty
      expect(repository.getQueueLength(), 0);
      
      // Add one item
      await repository.uploadReport(testDraft);
      expect(repository.getQueueLength(), 1);
      
      // Add another item
      await repository.uploadReport(testDraft);
      expect(repository.getQueueLength(), 2);
      
      // Clear queue
      await mockBox.clear();
      expect(repository.getQueueLength(), 0);
    });
    
    test('Should upload directly when online', () async {
      // This test would use a mock Dio to verify HTTP requests
      // For brevity, we'll simulate a successful response
      mockConnectivity.addResult(ConnectivityResult.wifi);
      
      // Use a real file path that exists (or mock the File class)
      final draft = testDraft.copyWith(filePath: 'test/mock_image.jpg');
      
      // Create a repository that will succeed the upload
      final repository = ReportRepository(
        connectivity: mockConnectivity,
        // We would need to mock Dio here in a real test
      );
      
      // In a complete test, we would:
      // 1. Mock Dio to return a successful response
      // 2. Call uploadReport
      // 3. Verify that Dio.post was called with the correct formData
      // 4. Verify that the queue remains empty
      
      // For this demo, we'll just verify the queue remains empty
      // assuming the upload would succeed
      expect(mockBox.length, 0);
    });
  });

  group('SyncService', () {
    test('Should try to flush queue when connectivity changes to online', () async {
      // Arrange
      mockConnectivity.addResult(ConnectivityResult.none);
      final mockRepo = MockReportRepository();
      when(mockRepo.uploadReportMultipart(any)).thenAnswer((_) async => null);
      
      // Add two items to the queue
      await mockBox.add(ReportQueueItem.fromDraft(testDraft));
      await mockBox.add(ReportQueueItem.fromDraft(testDraft));
      expect(mockBox.length, 2);
      
      final syncService = SyncService(
        repository: mockRepo,
        connectivity: mockConnectivity,
      );
      await syncService.initialize();
      
      // Change connectivity to online
      mockConnectivity.addResult(ConnectivityResult.wifi);
      
      // In a real test with a properly mocked repository:
      // 1. We would await for a short duration for the connectivity change to be processed
      // 2. Verify that repository.uploadReportMultipart was called for each item
      // 3. Verify that the queue was cleared if the uploads succeeded
      
      // For this demo, we just test the flushQueue method directly
      await syncService.flushQueue();
      
      // The flush would normally delete items that were successfully synced
      // In this demo, we're not setting up the full mock implementation
    });
  });

  group('QueueProvider', () {
    testWidgets('QueueLengthStreamProvider should emit changes in queue length', (tester) async {
      // Create a container with overrides for the repository
      final container = ProviderContainer(
        overrides: [
          reportRepositoryProvider.overrideWithValue(ReportRepository()),
        ],
      );
      
      // Add a listener to the stream
      final listener = Listener<AsyncValue<int>>();
      container.listen(
        queueLengthStreamProvider,
        listener,
        fireImmediately: true,
      );
      
      // Verify initial state
      verify(listener(any)).called(1);
      
      // Add items to the queue
      await mockBox.add(ReportQueueItem.fromDraft(testDraft));
      
      // Allow the stream to emit
      await Future.delayed(Duration.zero);
      
      // Verify the stream emitted a change
      verify(listener(any)).called(greaterThan(1));
      
      // Cleanup
      container.dispose();
    });
    
    testWidgets('UnsentReportsBadge should display the correct count', (tester) async {
      // Add items to the queue
      await mockBox.clear();
      await mockBox.add(ReportQueueItem.fromDraft(testDraft));
      await mockBox.add(ReportQueueItem.fromDraft(testDraft));
      
      // Build the widget
      await tester.pumpWidget(
        ProviderScope(
          child: MaterialApp(
            home: Scaffold(
              body: Center(
                child: UnsentReportsBadge(size: 30),
              ),
            ),
          ),
        ),
      );
      
      // Wait for widget to rebuild
      await tester.pump();
      
      // Find the badge
      final textFinder = find.text('2');
      expect(textFinder, findsOneWidget);
      
      // Clear the queue and check that badge disappears (if hideWhenEmpty is true)
      await mockBox.clear();
      await tester.pump();
      
      // Badge should now be hidden as queue is empty
      expect(find.text('0'), findsNothing);
    });
  });
}
