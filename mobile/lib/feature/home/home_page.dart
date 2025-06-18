import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:green_sentinel_mobile/feature/home/home_controller.dart';
import 'package:green_sentinel_mobile/feature/home/widgets/hero_report_button.dart';
import 'package:green_sentinel_mobile/feature/home/widgets/level_badge.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// The home page of the app, showing the main reporting button and user stats
class HomePage extends ConsumerStatefulWidget {
  /// Creates a new instance of [HomePage]
  const HomePage({super.key});

  @override
  ConsumerState<HomePage> createState() => _HomePageState();
}

class _HomePageState extends ConsumerState<HomePage> {
  @override
  void initState() {
    super.initState();
    // Refresh user stats when the page loads
    WidgetsBinding.instance.addPostFrameCallback((_) {
      ref.read(homeControllerProvider.notifier).refreshUserStats();
    });
  }

  @override
  Widget build(BuildContext context) {
    // Get the current theme
    final theme = Theme.of(context);
    // Get the current state from the provider
    final homeState = ref.watch(homeControllerProvider);

    return Scaffold(
      backgroundColor: theme.colorScheme.background,
      appBar: AppBar(
        title: const Text('GreenSentinel'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        actions: [
          // Theme toggle button
          IconButton(
            icon: const Icon(Icons.brightness_6),
            onPressed: () {
              // This would normally use the theme provider to toggle the theme
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: EdgeInsets.all(
            AppTheme().getSpacing('6'), // Using token for large spacing
          ),
          child: Stack(
            children: [
              // Level badge positioned in top-right corner
              Positioned(
                top: 0,
                right: 0,
                child: LevelBadge(
                  level: homeState.level,
                  points: homeState.points,
                ),
              ),
              
              // Main content - centered hero button
              Center(
                child: HeroReportButton(
                  onPressed: () {
                    // Navigate to report page
                    context.navigateToReport();
                  },
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
