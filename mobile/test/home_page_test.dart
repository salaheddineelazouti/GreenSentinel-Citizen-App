import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/home/home_controller.dart';
import 'package:green_sentinel_mobile/feature/home/home_page.dart';
import 'package:green_sentinel_mobile/feature/home/widgets/hero_report_button.dart';
import 'package:green_sentinel_mobile/feature/home/widgets/level_badge.dart';
import 'package:mocktail/mocktail.dart';

// Mock GoRouter for navigation testing
class MockGoRouter extends Mock implements GoRouter {}

void main() {
  late MockGoRouter mockGoRouter;
  
  setUpAll(() {
    // Register a mock GoRouterProvider
    mockGoRouter = MockGoRouter();
    
    // Register the fallback value for GoRoute location
    registerFallbackValue('/report');
  });
  
  setUp(() {
    // Reset mocks before each test
    reset(mockGoRouter);
  });

  // Create a test wrapper with required providers
  Widget createHomeScreen() {
    return ProviderScope(
      child: MaterialApp(
        theme: ThemeData(
          colorScheme: ColorScheme.light(
            background: Colors.white,
            primary: Colors.green,
            secondary: Colors.blue,
          ),
        ),
        home: InheritedGoRouter(
          goRouter: mockGoRouter,
          child: const HomePage(),
        ),
      ),
    );
  }

  testWidgets('Home page should display hero button with "Signaler" text',
      (WidgetTester tester) async {
    // Build the widget
    await tester.pumpWidget(createHomeScreen());
    await tester.pumpAndSettle();

    // Verify hero button is displayed
    expect(find.byType(HeroReportButton), findsOneWidget);
    expect(find.text('Signaler'), findsOneWidget);
  });

  testWidgets('Home page should display level badge with level and points',
      (WidgetTester tester) async {
    // Build the widget
    await tester.pumpWidget(createHomeScreen());
    await tester.pumpAndSettle();

    // Verify level badge is displayed
    expect(find.byType(LevelBadge), findsOneWidget);
    expect(find.text('2'), findsOneWidget);  // Level from mock data
    expect(find.text('120 pts'), findsOneWidget);  // Points from mock data
  });

  testWidgets('Tapping hero button should navigate to report screen',
      (WidgetTester tester) async {
    // Build the widget
    await tester.pumpWidget(createHomeScreen());
    await tester.pumpAndSettle();

    // Tap the hero button
    await tester.tap(find.byType(HeroReportButton));
    await tester.pumpAndSettle();

    // Verify navigation was triggered
    verify(() => mockGoRouter.go('/report')).called(1);
  });

  testWidgets('HomeController should initialize with mock data',
      (WidgetTester tester) async {
    // Build the widget
    await tester.pumpWidget(createHomeScreen());
    
    // Access the controller through the provider
    final providerContainer = ProviderContainer();
    final homeState = providerContainer.read(homeControllerProvider);
    
    // Verify initial state
    expect(homeState.level, 2);
    expect(homeState.points, 120);
    
    // Clean up
    providerContainer.dispose();
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
