import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'package:green_sentinel_mobile/feature/onboarding/onboarding_controller.dart';
import 'package:green_sentinel_mobile/feature/onboarding/pages/page_welcome.dart';
import 'package:green_sentinel_mobile/feature/onboarding/pages/page_map.dart';
import 'package:green_sentinel_mobile/feature/onboarding/pages/page_points.dart';
import 'package:green_sentinel_mobile/feature/onboarding/widgets/dot_indicator.dart';
import 'package:green_sentinel_mobile/theme.dart';

class OnboardingPage extends ConsumerStatefulWidget {
  const OnboardingPage({super.key});

  @override
  ConsumerState<OnboardingPage> createState() => _OnboardingPageState();
}

class _OnboardingPageState extends ConsumerState<OnboardingPage> {
  final PageController _pageController = PageController();
  
  @override
  void dispose() {
    _pageController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final isLastPage = ref.watch(onboardingControllerProvider);
    final theme = Theme.of(context);
    
    return Scaffold(
      body: SafeArea(
        child: Column(
          children: [
            Expanded(
              flex: 3,
              child: PageView(
                controller: _pageController,
                onPageChanged: (index) {
                  ref.read(onboardingControllerProvider.notifier).setLastPage(index == 2);
                },
                children: const [
                  PageWelcome(),
                  PageMap(),
                  PagePoints(),
                ],
              ),
            ),
            Expanded(
              flex: 1,
              child: Padding(
                padding: EdgeInsets.symmetric(
                  horizontal: AppTheme().getSpacing('6'),
                ),
                child: Column(
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    // Dot indicators
                    DotIndicator(
                      pageController: _pageController,
                      pages: 3,
                    ),
                    const SizedBox(height: 32),
                    // Navigation button
                    SizedBox(
                      width: double.infinity,
                      height: 56,
                      child: ElevatedButton(
                        onPressed: () async {
                          if (isLastPage) {
                            // Save that user has completed onboarding
                            final prefs = await SharedPreferences.getInstance();
                            await prefs.setBool('hasSeenOnboarding', true);
                            
                            if (!mounted) return;
                            // Navigate to home
                            context.go('/home');
                          } else {
                            // Go to next page
                            _pageController.nextPage(
                              duration: const Duration(milliseconds: 300),
                              curve: Curves.easeInOut,
                            );
                          }
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.primary,
                          foregroundColor: Colors.white,
                          shape: RoundedRectangleBorder(
                            borderRadius: AppTheme().getBorderRadius('lg'),
                          ),
                        ),
                        child: Text(
                          isLastPage ? 'Commencer' : 'Suivant',
                          style: const TextStyle(
                            fontSize: 16,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 16),
                    // Skip button (not on last page)
                    if (!isLastPage)
                      TextButton(
                        onPressed: () async {
                          // Save that user has completed onboarding
                          final prefs = await SharedPreferences.getInstance();
                          await prefs.setBool('hasSeenOnboarding', true);
                          
                          if (!mounted) return;
                          // Navigate to home
                          context.go('/home');
                        },
                        child: Text(
                          'Passer',
                          style: TextStyle(
                            color: AppColors.gray700,
                            fontSize: 16,
                          ),
                        ),
                      ),
                  ],
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

/// Checks if the user has completed onboarding
Future<bool> checkOnboardingStatus() async {
  final prefs = await SharedPreferences.getInstance();
  return prefs.getBool('hasSeenOnboarding') ?? false;
}
