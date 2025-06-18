import 'package:dio/dio.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/models/report_draft.dart';
import 'package:green_sentinel_mobile/feature/report/report_controller.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/send_button.dart';
import 'package:green_sentinel_mobile/models/report_response.dart';
import 'package:green_sentinel_mobile/services/report_repository.dart';
import 'package:http_mock_adapter/http_mock_adapter.dart';
import 'package:mockito/annotations.dart';
import 'package:mockito/mockito.dart';

// Generate mocks
@GenerateMocks([ReportRepository])
import 'report_upload_test.mocks.dart';

void main() {
  group('ReportRepository Tests', () {
    late Dio dio;
    late DioAdapter dioAdapter;
    late ReportRepository repository;

    setUp(() {
      dio = Dio();
      dioAdapter = DioAdapter(dio: dio);
      dio.httpClientAdapter = dioAdapter;
      repository = ReportRepository(dio: dio);
    });

    test('uploadReport returns ReportResponse on success', () async {
      // Setup mock response
      final mockResponseData = {
        'id': 'abc123',
        'status': 'pending_validation',
        'createdAt': '2025-06-18T12:34:56Z',
      };

      // Configure mock adapter
      dioAdapter.onPost(
        '/reports',
        (server) => server.reply(200, mockResponseData),
        data: any,
      );

      // Create a test report draft
      final draft = ReportDraft(
        filePath: 'test/assets/test_image.jpg',
        problemType: ProblemType.fire,
        description: 'Test description',
        severityLevel: 3,
        latitude: 45.5017,
        longitude: -73.5673,
        timestamp: DateTime.now(),
      );

      // Call the method
      final response = await repository.uploadReport(draft);

      // Assert
      expect(response, isNotNull);
      expect(response!.id, equals('abc123'));
      expect(response.status, equals('pending_validation'));
    });

    test('uploadReport returns null on error', () async {
      // Configure mock adapter for error
      dioAdapter.onPost(
        '/reports',
        (server) => server.reply(500, {'error': 'Server error'}),
        data: any,
      );

      // Create a test report draft
      final draft = ReportDraft(
        filePath: 'test/assets/test_image.jpg',
        problemType: ProblemType.fire,
        description: 'Test description',
        severityLevel: 3,
      );

      // Call the method
      final response = await repository.uploadReport(draft);

      // Assert
      expect(response, isNull);
    });
  });

  group('SendButton Widget Tests', () {
    testWidgets('SendButton shows correct states', (WidgetTester tester) async {
      bool buttonPressed = false;
      
      // Build idle button
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SendButton(
            state: SendButtonState.idle,
            onPressed: () {
              buttonPressed = true;
            },
          ),
        ),
      ));

      // Check idle state
      expect(find.text('Envoyer'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsNothing);
      
      // Tap button
      await tester.tap(find.byType(ElevatedButton));
      expect(buttonPressed, isTrue);
      
      // Reset and build loading button
      buttonPressed = false;
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SendButton(
            state: SendButtonState.loading,
            onPressed: () {
              buttonPressed = true;
            },
          ),
        ),
      ));
      
      // Check loading state
      expect(find.text('Envoi...'), findsOneWidget);
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
      
      // Build success button
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SendButton(
            state: SendButtonState.success,
            onPressed: () {
              buttonPressed = true;
            },
          ),
        ),
      ));
      
      // Check success state
      expect(find.text('Envoyé'), findsOneWidget);
      expect(find.byIcon(Icons.check_circle), findsOneWidget);
      expect(tester.widget<ElevatedButton>(find.byType(ElevatedButton)).enabled, isFalse);
      
      // Build error button
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: SendButton(
            state: SendButtonState.error,
            onPressed: () {
              buttonPressed = true;
            },
          ),
        ),
      ));
      
      // Check error state
      expect(find.text('Réessayer'), findsOneWidget);
      expect(find.byIcon(Icons.warning_amber), findsOneWidget);
    });
  });

  group('ReportController Integration Tests', () {
    late MockReportRepository mockRepository;
    late ReportController controller;
    late ProviderContainer container;

    setUp(() {
      mockRepository = MockReportRepository();
      
      // Create a valid report draft
      final draft = ReportDraft(
        filePath: 'test/assets/test_image.jpg',
        problemType: ProblemType.fire,
        description: 'Test description',
        severityLevel: 3,
        latitude: 45.5017,
        longitude: -73.5673,
        timestamp: DateTime.now(),
      );
      
      // Setup controller with initial state
      controller = ReportController(repository: mockRepository);
      controller.state = controller.state.copyWith(
        reportDraft: draft,
        currentStep: 2, // Preview step
        status: ReportStatus.ready,
      );
    });

    test('submitReport transitions to sent state on success', () async {
      // Mock successful response
      final mockResponse = ReportResponse(
        id: 'abc123',
        status: 'pending_validation',
        createdAt: DateTime.now(),
      );
      
      when(mockRepository.uploadReport(any))
          .thenAnswer((_) async => mockResponse);
      
      // Submit report
      await controller.submitReport();
      
      // Verify state transitions
      expect(controller.state.status, equals(ReportStatus.sent));
      expect(controller.state.reportResponse, isNotNull);
      expect(controller.state.reportResponse!.id, equals('abc123'));
      
      // Verify the repository was called
      verify(mockRepository.uploadReport(any)).called(1);
    });

    test('submitReport transitions to error state on failure', () async {
      // Mock repository failure
      when(mockRepository.uploadReport(any)).thenAnswer((_) async => null);
      when(mockRepository.saveDraftLocally(any)).thenAnswer((_) async => true);
      
      // Submit report
      await controller.submitReport();
      
      // Verify state transitions
      expect(controller.state.status, equals(ReportStatus.error));
      expect(controller.state.errorMessage, isNotNull);
      expect(controller.state.reportResponse, isNull);
      
      // Verify the repository methods were called
      verify(mockRepository.uploadReport(any)).called(1);
      verify(mockRepository.saveDraftLocally(any)).called(1);
    });
  });
}
