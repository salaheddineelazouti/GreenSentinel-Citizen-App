import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:google_fonts/google_fonts.dart';

/// AppTheme manages the application's theme settings based on design tokens
///
/// TODO: Token Synchronization Strategy
/// Currently tokens are loaded at runtime from design-tokens.json file.
/// For production, consider implementing the following synchronization strategy:
///
/// 1. Use style-dictionary to generate Dart code from design-tokens.json:
///    - Install style-dictionary: `npm install -g style-dictionary`
///    - Create a config file that outputs Dart format
///    - Run: `style-dictionary build`
///
/// 2. Alternative: Create a build_runner based solution:
///    - Create a build.yaml configuration
///    - Define a Builder that converts JSON to Dart classes
///    - Run: `flutter pub run build_runner build`
///
/// This would generate a tokens.dart file with strongly typed values,
/// eliminating the need for runtime JSON parsing.
class AppTheme {
  static final AppTheme _instance = AppTheme._internal();
  factory AppTheme() => _instance;
  AppTheme._internal();

  Map<String, dynamic> _tokens = {};
  bool _loaded = false;

  /// Loads tokens from the design-tokens.json file
  Future<void> loadTokens() async {
    if (_loaded) return;

    try {
      // Load from asset bundle
      String jsonContent = await rootBundle.loadString('design-tokens.json');
      _tokens = json.decode(jsonContent);
      _loaded = true;
    } catch (e) {
      debugPrint('Error loading design tokens: $e');
      // Fallback to empty tokens
      _tokens = {};
      _loaded = true;
    }
  }

  /// Gets a color token by its path (e.g. "primary.500")
  Color getColorToken(String path, {Color fallback = const Color(0xFF000000)}) {
    if (!_loaded) {
      debugPrint('Tokens not loaded yet! Returning fallback.');
      return fallback;
    }

    try {
      final parts = path.split('.');
      dynamic value = _tokens;
      
      for (final part in parts) {
        value = value[part];
      }
      
      if (value is Map && value.containsKey('value')) {
        String hexColor = value['value'];
        if (hexColor.startsWith('#')) {
          return Color(int.parse('0xFF${hexColor.substring(1)}'));
        }
      }
      
      debugPrint('Invalid color token: $path');
      return fallback;
    } catch (e) {
      debugPrint('Error getting color token $path: $e');
      return fallback;
    }
  }

  /// Gets a typography size token in pixels (converted from rem)
  double getTypographySize(String size, {double fallback = 16.0}) {
    if (!_loaded) {
      debugPrint('Tokens not loaded yet! Returning fallback.');
      return fallback;
    }

    try {
      final String? value = _tokens['typography']?['fontSize']?[size]?['value'];
      if (value == null) return fallback;
      
      if (value.endsWith('rem')) {
        // Convert rem to pixels (assuming 1rem = 16px)
        final double remValue = double.parse(value.replaceAll('rem', ''));
        return remValue * 16;
      } else if (value.endsWith('px')) {
        return double.parse(value.replaceAll('px', ''));
      }
      
      return double.parse(value);
    } catch (e) {
      debugPrint('Error getting typography size $size: $e');
      return fallback;
    }
  }

  /// Gets a spacing token in pixels (converted from rem)
  double getSpacing(String key, {double fallback = 8.0}) {
    if (!_loaded) {
      debugPrint('Tokens not loaded yet! Returning fallback.');
      return fallback;
    }

    try {
      final String? value = _tokens['spacing']?[key]?['value'];
      if (value == null) return fallback;
      
      if (value.endsWith('rem')) {
        // Convert rem to pixels (assuming 1rem = 16px)
        final double remValue = double.parse(value.replaceAll('rem', ''));
        return remValue * 16;
      } else if (value.endsWith('px')) {
        return double.parse(value.replaceAll('px', ''));
      }
      
      return double.parse(value);
    } catch (e) {
      debugPrint('Error getting spacing $key: $e');
      return fallback;
    }
  }

  /// Gets a border radius token in pixels (converted from rem)
  BorderRadius getBorderRadius(String key, {BorderRadius? fallback}) {
    fallback ??= BorderRadius.circular(8.0);
    
    if (!_loaded) {
      debugPrint('Tokens not loaded yet! Returning fallback.');
      return fallback;
    }

    try {
      final String? value = _tokens['borderRadius']?[key]?['value'];
      if (value == null) return fallback;
      
      if (value == '9999px' || key == 'full') {
        return BorderRadius.circular(999);
      }
      
      double pixels = 8.0;
      if (value.endsWith('rem')) {
        // Convert rem to pixels (assuming 1rem = 16px)
        final double remValue = double.parse(value.replaceAll('rem', ''));
        pixels = remValue * 16;
      } else if (value.endsWith('px')) {
        pixels = double.parse(value.replaceAll('px', ''));
      } else {
        pixels = double.parse(value);
      }
      
      return BorderRadius.circular(pixels);
    } catch (e) {
      debugPrint('Error getting border radius $key: $e');
      return fallback;
    }
  }

  ThemeData get lightTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.light(
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.secondary,
      onSecondary: Colors.white,
      error: AppColors.danger,
      surface: AppColors.gray50,
      background: AppColors.gray50,
    ),
    textTheme: _buildTextTheme(Colors.black87),
    appBarTheme: AppBarTheme(
      backgroundColor: AppColors.primary,
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: getBorderRadius('xl'),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: getSpacing('4'),
          vertical: getSpacing('4'),
        ),
      ),
    ),
    cardTheme: CardTheme(
      color: Colors.white,
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: getBorderRadius('lg'),
      ),
    ),
  );

  ThemeData get darkTheme => ThemeData(
    useMaterial3: true,
    colorScheme: ColorScheme.dark(
      primary: AppColors.primary,
      onPrimary: Colors.white,
      secondary: AppColors.secondary,
      onSecondary: Colors.white,
      error: AppColors.danger,
      surface: const Color(0xFF121212),
      background: const Color(0xFF121212),
    ),
    textTheme: _buildTextTheme(Colors.white),
    appBarTheme: AppBarTheme(
      backgroundColor: const Color(0xFF1E1E1E),
      foregroundColor: Colors.white,
      elevation: 0,
    ),
    elevatedButtonTheme: ElevatedButtonThemeData(
      style: ElevatedButton.styleFrom(
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
        shape: RoundedRectangleBorder(
          borderRadius: getBorderRadius('xl'),
        ),
        padding: EdgeInsets.symmetric(
          horizontal: getSpacing('4'),
          vertical: getSpacing('4'),
        ),
      ),
    ),
    cardTheme: CardTheme(
      color: const Color(0xFF2C2C2C),
      elevation: 1,
      shape: RoundedRectangleBorder(
        borderRadius: getBorderRadius('lg'),
      ),
    ),
  );

  TextTheme _buildTextTheme(Color textColor) {
    return GoogleFonts.interTextTheme(
      TextTheme(
        displayLarge: TextStyle(color: textColor, fontSize: getTypographySize('2xl'), fontWeight: FontWeight.bold),
        displayMedium: TextStyle(color: textColor, fontSize: getTypographySize('xl'), fontWeight: FontWeight.bold),
        displaySmall: TextStyle(color: textColor, fontSize: getTypographySize('lg'), fontWeight: FontWeight.bold),
        headlineMedium: TextStyle(color: textColor, fontSize: getTypographySize('lg')),
        titleLarge: TextStyle(color: textColor, fontSize: getTypographySize('base'), fontWeight: FontWeight.bold),
        bodyLarge: TextStyle(color: textColor, fontSize: getTypographySize('base')),
        bodyMedium: TextStyle(color: textColor, fontSize: getTypographySize('sm')),
        labelLarge: TextStyle(color: textColor, fontSize: getTypographySize('sm'), fontWeight: FontWeight.bold),
      ),
    );
  }
}

/// Extension for easy access to theme colors
extension AppColors on ColorScheme {
  static Color get primary => AppTheme().getColorToken('color.primary.500', fallback: const Color(0xFF10B981));
  static Color get secondary => AppTheme().getColorToken('color.primary.600', fallback: const Color(0xFF059669));
  static Color get danger => AppTheme().getColorToken('color.danger.500', fallback: const Color(0xFFEF4444));
  static Color get warning => AppTheme().getColorToken('color.warning.500', fallback: const Color(0xFFF59E0B));
  static Color get info => AppTheme().getColorToken('color.info.500', fallback: const Color(0xFF3B82F6));
  static Color get success => AppTheme().getColorToken('color.success.600', fallback: const Color(0xFF16A34A));
  static Color get alert => AppTheme().getColorToken('color.alert.500', fallback: const Color(0xFFEAB308));
  static Color get gray50 => AppTheme().getColorToken('color.gray.50', fallback: const Color(0xFFF9FAFB));
  static Color get gray100 => AppTheme().getColorToken('color.gray.100', fallback: const Color(0xFFF3F4F6));
  static Color get gray500 => AppTheme().getColorToken('color.gray.500', fallback: const Color(0xFF6B7280));
  static Color get gray700 => AppTheme().getColorToken('color.gray.700', fallback: const Color(0xFF374151));
}

/// Extension for easy access to text styles
extension AppTextStyles on TextTheme {
  static TextStyle get titleLarge => TextStyle(
    fontSize: AppTheme().getTypographySize('2xl'),
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get titleMedium => TextStyle(
    fontSize: AppTheme().getTypographySize('xl'),
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get titleSmall => TextStyle(
    fontSize: AppTheme().getTypographySize('lg'),
    fontWeight: FontWeight.bold,
  );
  
  static TextStyle get bodyLarge => TextStyle(
    fontSize: AppTheme().getTypographySize('base'),
  );
  
  static TextStyle get bodyMedium => TextStyle(
    fontSize: AppTheme().getTypographySize('sm'),
  );
  
  static TextStyle get bodySmall => TextStyle(
    fontSize: AppTheme().getTypographySize('xs'),
  );
}
