import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/home/home_page.dart';
import 'package:green_sentinel_mobile/feature/onboarding/onboarding_page.dart';
import 'package:green_sentinel_mobile/feature/settings/settings_page.dart';
import 'package:green_sentinel_mobile/local_storage/hive_boxes.dart';
import 'package:green_sentinel_mobile/services/sync_service.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:workmanager/workmanager.dart';
import 'package:easy_localization/easy_localization.dart';
import 'theme.dart';

// Provider to manage theme mode
final themeProvider = StateNotifierProvider<ThemeModeNotifier, ThemeMode>((ref) {
  return ThemeModeNotifier();
});

// Notifier class to handle theme changes
class ThemeModeNotifier extends StateNotifier<ThemeMode> {
  ThemeModeNotifier() : super(ThemeMode.system) {
    _loadThemeMode();
  }

  // Load saved theme mode from SharedPreferences
  Future<void> _loadThemeMode() async {
    final prefs = await SharedPreferences.getInstance();
    final themeString = prefs.getString('themeMode') ?? 'system';
    
    switch (themeString) {
      case 'light':
        state = ThemeMode.light;
        break;
      case 'dark':
        state = ThemeMode.dark;
        break;
      default:
        state = ThemeMode.system;
    }
  }

  // Toggle through theme modes
  void toggleTheme() async {
    final prefs = await SharedPreferences.getInstance();
    
    switch (state) {
      case ThemeMode.system:
        state = ThemeMode.light;
        await prefs.setString('themeMode', 'light');
        break;
      case ThemeMode.light:
        state = ThemeMode.dark;
        await prefs.setString('themeMode', 'dark');
        break;
      case ThemeMode.dark:
        state = ThemeMode.system;
        await prefs.setString('themeMode', 'system');
        break;
    }
  }
}

// GoRouter configuration
final _router = GoRouter(
  initialLocation: '/home',
  routes: [
    GoRoute(
      path: '/home',
      builder: (context, state) => const HomePage(),
    ),
    GoRoute(
      path: '/onboarding',
      builder: (context, state) => const OnboardingPage(),
    ),
    GoRoute(
      path: '/settings',
      builder: (context, state) => const SettingsPage(),
    ),
  ],
);

/// Background task callback for WorkManager
@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      switch (task) {
        case kSyncReportsTaskName:
          // Initialize Hive
          await initHive();
          
          // Create repository and flush queue
          final syncService = SyncService();
          await syncService.flushQueue();
          return true;
        default:
          return false;
      }
    } catch (e) {
      debugPrint('Background task error: $e');
      return false;
    }
  });
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Initialize Easy Localization
  await EasyLocalization.ensureInitialized();
  
  // Initialize Hive for local storage
  await initHive();
  
  // Initialize WorkManager for background tasks
  await Workmanager().initialize(
    callbackDispatcher,
    isInDebugMode: true,
  );
  
  // Schedule periodic background sync
  await SyncService.schedulePeriodicSync();
  
  // Load design tokens before running the app
  await AppTheme().loadTokens();
  
  // Initialize the sync service to listen for connectivity changes
  final syncService = SyncService();
  await syncService.initialize();
  
  runApp(
    EasyLocalization(
      supportedLocales: const [Locale('en'), Locale('fr')],
      path: 'lib/l10n',
      fallbackLocale: const Locale('en'),
      child: const ProviderScope(child: MyApp()),
    ),
  );
}

class MyApp extends ConsumerWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    
    return MaterialApp.router(
      title: 'GreenSentinel Citizen',
      theme: AppTheme().lightTheme,
      darkTheme: AppTheme().darkTheme,
      themeMode: themeMode,
      routerConfig: _router,
      localizationsDelegates: context.localizationDelegates,
      supportedLocales: context.supportedLocales,
      locale: context.locale,
    );
  }
}

class HomePage extends ConsumerWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final themeMode = ref.watch(themeProvider);
    final themeText = switch (themeMode) {
      ThemeMode.light => 'Light Theme',
      ThemeMode.dark => 'Dark Theme',
      ThemeMode.system => 'System Theme',
    };
    
    return Scaffold(
      appBar: AppBar(
        title: Text('GreenSentinel Citizen'.tr()),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () => context.go('/settings'),
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Text(
              'Welcome to GreenSentinel Mobile',
              style: TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
            const SizedBox(height: 16),
            Text('Current theme: $themeText'),
            const SizedBox(height: 32),
            ElevatedButton(
              onPressed: () {
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Mobile app is under development'),
                  ),
                );
              },
              child: const Padding(
                padding: EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                child: Text('Explore Features'),
              ),
            ),
          ],
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () {
          ScaffoldMessenger.of(context).showSnackBar(
            const SnackBar(content: Text('Quick report feature coming soon')),
          );
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
