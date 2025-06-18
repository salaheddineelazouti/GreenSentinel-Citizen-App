import 'package:flutter_riverpod/flutter_riverpod.dart';

/// State for the home page
class HomeState {
  /// User's current points
  final int points;
  
  /// User's current level
  final int level;

  /// Creates a new [HomeState] with the given points and level
  const HomeState({required this.points, required this.level});

  /// Creates a copy of this [HomeState] with the given fields replaced
  HomeState copyWith({int? points, int? level}) {
    return HomeState(
      points: points ?? this.points,
      level: level ?? this.level,
    );
  }
}

/// Provider for the home controller
final homeControllerProvider =
    StateNotifierProvider<HomeController, HomeState>((ref) {
  return HomeController();
});

/// Controller for the home page
class HomeController extends StateNotifier<HomeState> {
  /// Creates a new instance of [HomeController] with mock data
  HomeController()
      : super(const HomeState(
          points: 120,
          level: 2,
        ));

  /// Refreshes the user's points and level
  /// 
  /// This is currently mocked, but would fetch from an API in a real app
  Future<void> refreshUserStats() async {
    // This would normally fetch data from an API
    // For now, we'll just simulate a delay
    await Future.delayed(const Duration(milliseconds: 500));
    
    // In a real app, this would update with values from the API
    // state = HomeState(points: fetchedPoints, level: fetchedLevel);
  }
}
