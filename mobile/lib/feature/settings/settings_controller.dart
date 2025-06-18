import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';

/// Provider for the SettingsController
final settingsControllerProvider =
    StateNotifierProvider<SettingsController, SettingsState>((ref) {
  return SettingsController();
});

/// State class for settings
class SettingsState {
  final Locale locale;
  
  const SettingsState({
    this.locale = const Locale('en'),
  });

  SettingsState copyWith({
    Locale? locale,
  }) {
    return SettingsState(
      locale: locale ?? this.locale,
    );
  }
}

/// Controller for settings functionality
class SettingsController extends StateNotifier<SettingsState> {
  SettingsController() : super(const SettingsState()) {
    _loadSettings();
  }

  /// Load settings from SharedPreferences
  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final languageCode = prefs.getString('languageCode') ?? 'en';
    
    state = state.copyWith(
      locale: Locale(languageCode),
    );
  }

  /// Set the app locale
  Future<void> setLocale(String languageCode) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString('languageCode', languageCode);
    
    state = state.copyWith(
      locale: Locale(languageCode),
    );
  }

  /// Delete user account (mock implementation)
  Future<void> deleteAccount() async {
    // In a real implementation, this would call an API to delete the account
    // For now, we'll just clear preferences as a mock implementation
    final prefs = await SharedPreferences.getInstance();
    await prefs.clear();
    
    // Note: This doesn't actually delete any account data,
    // just simulates the flow for UI demonstration
  }
}
