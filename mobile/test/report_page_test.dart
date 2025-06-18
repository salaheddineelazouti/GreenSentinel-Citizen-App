import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/report/report_controller.dart';
import 'package:green_sentinel_mobile/feature/report/report_page.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/camera_capture_button.dart';
import 'package:image_picker_platform_interface/image_picker_platform_interface.dart';
import 'package:mocktail/mocktail.dart';
import 'package:plugin_platform_interface/plugin_platform_interface.dart';

// Mock classes
class MockGoRouter extends Mock implements GoRouter {}

class MockImagePicker extends Mock
    with MockPlatformInterfaceMixin
    implements ImagePickerPlatform {
  @override
  Future<XFile?> pickImage({
    required ImageSource source,
    double? maxWidth,
    double? maxHeight,
    int? imageQuality,
    CameraDevice preferredCameraDevice = CameraDevice.rear,
  }) async {
    return XFile('mock_image_path.jpg');
  }
}

class MockPermissionHandler extends Mock {
  Future<bool> requestPermission() async => true;
}

// Mock provider overrides
final mockReportControllerProvider = StateNotifierProvider<MockReportController, ReportState>(
  (ref) => MockReportController(),
);

class MockReportController extends StateNotifier<ReportState>
    implements ReportController {
  MockReportController() : super(const ReportState());

  bool captureImageCalled = false;
  bool submitReportCalled = false;

  @override
  Future<void> captureImage() async {
    captureImageCalled = true;
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(
        filePath: 'mock_image_path.jpg',
        latitude: 48.85,
        longitude: 2.35,
      ),
      currentStep: 1,
      status: ReportStatus.idle,
    );
  }

  @override
  Future<void> submitReport() async {
    submitReportCalled = true;
    state = state.copyWith(status: ReportStatus.sending);
    await Future.delayed(const Duration(milliseconds: 100));
    state = state.copyWith(status: ReportStatus.sent);
  }

  @override
  void resetToCapture() {
    state = const ReportState();
  }

  @override
  Future<void> getCurrentLocation() async {}

  @override
  void updateDescription(String description) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(description: description),
    );
  }

  @override
  void updateSeverityLevel(int level) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(severityLevel: level),
    );
  }
}

void main() {
  late MockGoRouter mockGoRouter;
  late MockReportController mockController;

  setUpAll(() {
    // Register fallback values
    registerFallbackValue('/home');
  });

  setUp(() {
    mockGoRouter = MockGoRouter();
    mockController = MockReportController();
  });

  // Helper function to build the report page with required providers
  Widget createReportPage() {
    return ProviderScope(
      overrides: [
        reportControllerProvider.overrideWithProvider(mockReportControllerProvider),
      ],
      child: MaterialApp(
        home: InheritedGoRouter(
          goRouter: mockGoRouter,
          child: const ReportPage(),
        ),
      ),
    );
  }

  testWidgets('ReportPage should show camera button in first step',
      (WidgetTester tester) async {
    await tester.pumpWidget(createReportPage());
    await tester.pumpAndSettle();

    // Verify we are in step 1 with camera button
    expect(find.byType(CameraCaptureButton), findsOneWidget);
    expect(find.text('Photographiez le problème'), findsOneWidget);
  });

  testWidgets('Tapping camera button should trigger captureImage',
      (WidgetTester tester) async {
    await tester.pumpWidget(createReportPage());
    await tester.pumpAndSettle();

    // Tap camera button
    await tester.tap(find.byType(CameraCaptureButton));
    await tester.pumpAndSettle();

    // Verify captureImage was called
    expect(mockController.captureImageCalled, isTrue);
  });

  testWidgets('After capture, report page should move to step 2',
      (WidgetTester tester) async {
    // Start with a controller in state after capture
    await tester.pumpWidget(createReportPage());
    
    // Simulate image capture to move to step 2
    await tester.tap(find.byType(CameraCaptureButton));
    await tester.pumpAndSettle();

    // Verify we are in step 2
    expect(find.text('Description (max 140)'), findsOneWidget);
    expect(find.text('Niveau de gravité'), findsOneWidget);
    expect(find.text('48.85, 2.35'), findsOneWidget); // Mock coordinates
  });

  testWidgets('Submit button should trigger submitReport',
      (WidgetTester tester) async {
    await tester.pumpWidget(createReportPage());
    
    // Move to step 2
    await tester.tap(find.byType(CameraCaptureButton));
    await tester.pumpAndSettle();

    // Tap submit button
    await tester.tap(find.text('Envoyer'));
    await tester.pump();

    // Verify submitReport was called
    expect(mockController.submitReportCalled, isTrue);
  });

  testWidgets('After successful submit, snackbar should appear and navigate home',
      (WidgetTester tester) async {
    await tester.pumpWidget(createReportPage());
    
    // Move to step 2
    await tester.tap(find.byType(CameraCaptureButton));
    await tester.pumpAndSettle();

    // Submit the report
    await tester.tap(find.text('Envoyer'));
    await tester.pump(const Duration(milliseconds: 200)); // Wait for status update

    // Verify snackbar appears
    expect(find.text('Signalement sauvegardé (mock)'), findsOneWidget);

    // Wait for navigation delay
    await tester.pump(const Duration(milliseconds: 1600));
    
    // Verify navigation was triggered
    verify(() => mockGoRouter.go('/home')).called(1);
  });
}

// Helper class for providing GoRouter in tests
class InheritedGoRouter extends InheritedWidget {
  const InheritedGoRouter({
    super.key,
    required this.goRouter,
    required super.child,
  });

  final GoRouter goRouter;

  static InheritedGoRouter of(BuildContext context) {
    final result = context.dependOnInheritedWidgetOfExactType<InheritedGoRouter>();
    assert(result != null, 'No InheritedGoRouter found in context');
    return result!;
  }

  @override
  bool updateShouldNotify(InheritedGoRouter oldWidget) =>
      oldWidget.goRouter != goRouter;
}
