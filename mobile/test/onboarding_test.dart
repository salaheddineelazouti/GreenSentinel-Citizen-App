import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/onboarding/onboarding_page.dart';
import 'package:mocktail/mocktail.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Mock GoRouter for navigation testing
class MockGoRouter extends Mock implements GoRouter {}

void main() {
  // Setup for tests
  late MockGoRouter mockGoRouter;

  setUpAll(() {
    // Register a mock GoRouterProvider
    mockGoRouter = MockGoRouter();

    // Register the fallback value for GoRoute location
    registerFallbackValue('/home');
  });

  setUp(() {
    // Reset mocks before each test
    reset(mockGoRouter);
  });

  // Helper function to build the onboarding page with a ProviderScope
  Widget createOnboardingPage() {
    return ProviderScope(
      child: MaterialApp(
        home: InheritedGoRouter(
          goRouter: mockGoRouter,
          child: const OnboardingPage(),
        ),
      ),
    );
  }

  // Setting up SharedPreferences for testing
  Future<void> setUpSharedPreferences() async {
    SharedPreferences.setMockInitialValues({});
  }

  testWidgets('Onboarding page should display all three pages with proper titles',
      (WidgetTester tester) async {
    // Set up SharedPreferences
    await setUpSharedPreferences();

    // Build the app
    await tester.pumpWidget(createOnboardingPage());

    // First page
    expect(find.text('Protégez la nature'), findsOneWidget);
    expect(find.text('Signalez sur la carte'), findsNothing);
    expect(find.text('Gagnez des points'), findsNothing);

    // Verify "Suivant" button is shown on first page
    expect(find.text('Suivant'), findsOneWidget);
    expect(find.text('Commencer'), findsNothing);

    // Tap the next button
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();

    // Second page
    expect(find.text('Protégez la nature'), findsNothing);
    expect(find.text('Signalez sur la carte'), findsOneWidget);
    expect(find.text('Gagnez des points'), findsNothing);

    // Tap the next button again
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();

    // Third page
    expect(find.text('Protégez la nature'), findsNothing);
    expect(find.text('Signalez sur la carte'), findsNothing);
    expect(find.text('Gagnez des points'), findsOneWidget);

    // Verify "Commencer" button is shown on last page
    expect(find.text('Suivant'), findsNothing);
    expect(find.text('Commencer'), findsOneWidget);
  });

  testWidgets('Clicking Commencer button should navigate to home and set shared prefs',
      (WidgetTester tester) async {
    // Set up SharedPreferences
    await setUpSharedPreferences();

    // Build the app and navigate to last page
    await tester.pumpWidget(createOnboardingPage());
    
    // Navigate to the last page
    await tester.drag(find.byType(PageView), const Offset(-800, 0)); // Swipe left
    await tester.pumpAndSettle();
    await tester.drag(find.byType(PageView), const Offset(-800, 0)); // Swipe left again
    await tester.pumpAndSettle();

    // Verify we're on the last page
    expect(find.text('Gagnez des points'), findsOneWidget);
    
    // Click the "Commencer" button
    await tester.tap(find.text('Commencer'));
    await tester.pumpAndSettle();

    // Verify navigation was triggered
    verify(() => mockGoRouter.go('/home')).called(1);

    // Verify shared preferences was set
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool('hasSeenOnboarding'), true);
  });

  testWidgets('Clicking Skip should navigate to home and set shared prefs',
      (WidgetTester tester) async {
    // Set up SharedPreferences
    await setUpSharedPreferences();

    // Build the app
    await tester.pumpWidget(createOnboardingPage());
    
    // Verify we're on the first page
    expect(find.text('Protégez la nature'), findsOneWidget);
    
    // Click the "Passer" button
    await tester.tap(find.text('Passer'));
    await tester.pumpAndSettle();

    // Verify navigation was triggered
    verify(() => mockGoRouter.go('/home')).called(1);

    // Verify shared preferences was set
    final prefs = await SharedPreferences.getInstance();
    expect(prefs.getBool('hasSeenOnboarding'), true);
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
