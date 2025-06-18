import 'package:flutter_riverpod/flutter_riverpod.dart';

/// Provider for the onboarding controller
final onboardingControllerProvider =
    StateNotifierProvider<OnboardingController, bool>((ref) {
  return OnboardingController();
});

/// Controller for the onboarding flow
class OnboardingController extends StateNotifier<bool> {
  /// Creates a new instance of [OnboardingController]
  /// 
  /// The state represents whether the user is on the last page of onboarding
  OnboardingController() : super(false);

  /// Sets whether the user is on the last page of onboarding
  void setLastPage(bool isLastPage) {
    state = isLastPage;
  }
}
