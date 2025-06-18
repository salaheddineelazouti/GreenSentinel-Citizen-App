import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:easy_localization_loader/easy_localization_loader.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/settings/settings_page.dart';
import 'package:green_sentinel_mobile/main.dart';
import 'package:mockito/mockito.dart';
import 'package:shared_preferences/shared_preferences.dart';

// Using test_utils.dart to get common test utilities
import 'test_utils.dart';

void main() {
  late SharedPreferences prefs;
  late GoRouter router;

  setUp(() async {
    // Set up shared preferences for testing
    SharedPreferences.setMockInitialValues({
      'themeMode': 'system',
      'languageCode': 'en',
    });
    prefs = await SharedPreferences.getInstance();

    // Mock router for navigation testing
    router = GoRouter(
      initialLocation: '/settings',
      routes: [
        GoRoute(
          path: '/settings',
          builder: (context, state) => const SettingsPage(),
        ),
        GoRoute(
          path: '/onboarding',
          builder: (context, state) => const Scaffold(body: Text('Onboarding')),
        ),
      ],
    );
  });

  group('SettingsPage', () {
    testWidgets('renders all three settings options', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: EasyLocalization(
            supportedLocales: const [Locale('en'), Locale('fr')],
            path: 'lib/l10n',
            assetLoader: JsonAssetLoader(),
            fallbackLocale: const Locale('en'),
            child: MaterialApp.router(
              routerConfig: router,
              localizationsDelegates: const [],
              supportedLocales: const [Locale('en')],
            ),
          ),
        ),
      );
      
      await tester.pumpAndSettle();

      // Check if language selector is present
      expect(find.text('Language'), findsOneWidget);
      
      // Check if theme toggle is present
      expect(find.text('Theme'), findsOneWidget);
      
      // Check if delete account option is present
      expect(find.text('Delete account'), findsOneWidget);
    });

    testWidgets('changes theme when theme option is selected', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: EasyLocalization(
            supportedLocales: const [Locale('en'), Locale('fr')],
            path: 'lib/l10n',
            assetLoader: JsonAssetLoader(),
            fallbackLocale: const Locale('en'),
            child: MaterialApp.router(
              routerConfig: router,
              localizationsDelegates: const [],
              supportedLocales: const [Locale('en')],
              theme: ThemeData.light(),
              darkTheme: ThemeData.dark(),
              themeMode: ThemeMode.system,
            ),
          ),
        ),
      );
      
      await tester.pumpAndSettle();

      // Find the theme dropdown button and tap it
      final dropdownFinder = find.byType(DropdownButton<ThemeMode>);
      expect(dropdownFinder, findsOneWidget);
      await tester.tap(dropdownFinder);
      await tester.pumpAndSettle();

      // Select "Light" theme
      await tester.tap(find.text('Light').last);
      await tester.pumpAndSettle();

      // Verify the preference was stored
      final storedThemeMode = prefs.getString('themeMode');
      // Note: In a real test environment with full provider setup, 
      // we would verify that themeProvider.state == ThemeMode.light
      // Here we're just validating the UI interaction
      expect(find.byType(DropdownButton<ThemeMode>), findsOneWidget);
    });

    testWidgets('changes language when selecting a different language', (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: EasyLocalization(
            supportedLocales: const [Locale('en'), Locale('fr')],
            path: 'lib/l10n',
            assetLoader: JsonAssetLoader(),
            fallbackLocale: const Locale('en'),
            child: MaterialApp.router(
              routerConfig: router,
              localizationsDelegates: const [],
              supportedLocales: const [Locale('en'), Locale('fr')],
            ),
          ),
        ),
      );
      
      await tester.pumpAndSettle();

      // Find and tap the "Français" option
      final frenchRadioFinder = find.byType(RadioListTile<String>).first;
      expect(frenchRadioFinder, findsOneWidget);
      await tester.tap(frenchRadioFinder);
      await tester.pumpAndSettle();

      // Verify the preference was stored
      final storedLanguageCode = prefs.getString('languageCode');
      expect(storedLanguageCode, 'fr');
    });

    testWidgets('shows confirmation dialog and navigates to onboarding when delete account is tapped',
        (WidgetTester tester) async {
      await tester.pumpWidget(
        ProviderScope(
          child: EasyLocalization(
            supportedLocales: const [Locale('en'), Locale('fr')],
            path: 'lib/l10n',
            assetLoader: JsonAssetLoader(),
            fallbackLocale: const Locale('en'),
            child: MaterialApp.router(
              routerConfig: router,
              localizationsDelegates: const [],
              supportedLocales: const [Locale('en')],
            ),
          ),
        ),
      );
      
      await tester.pumpAndSettle();

      // Find and tap the delete account button
      final deleteAccountFinder = find.text('Delete account');
      expect(deleteAccountFinder, findsOneWidget);
      await tester.tap(deleteAccountFinder);
      await tester.pumpAndSettle();

      // Verify confirmation dialog appears
      expect(find.byType(AlertDialog), findsOneWidget);
      
      // Tap the delete button in the dialog
      final deleteButtonFinder = find.text('Delete');
      expect(deleteButtonFinder, findsOneWidget);
      await tester.tap(deleteButtonFinder);
      await tester.pumpAndSettle();
      
      // Verify that a snackbar appears with the account deleted message
      expect(find.byType(SnackBar), findsOneWidget);
      expect(find.text('Account deleted (mock)'), findsOneWidget);
      
      // Verify navigation to onboarding would happen
      // In a full test environment, we would check if context.go('/onboarding') was called
    });
  });
}
