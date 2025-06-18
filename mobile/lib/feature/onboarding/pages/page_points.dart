import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Third onboarding page - Points
class PagePoints extends StatelessWidget {
  /// Creates a new instance of [PagePoints]
  const PagePoints({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.all(AppTheme().getSpacing('6')),
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          // Illustration
          Expanded(
            flex: 3,
            child: Semantics(
              label: "Illustration de trophée et récompenses",
              child: Center(
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: AppTheme().getBorderRadius('full'),
                  ),
                  child: Icon(
                    Icons.emoji_events_outlined,
                    size: 120,
                    color: AppColors.alert,
                  ),
                ),
              ),
            ),
          ),
          
          // Text content
          Expanded(
            flex: 2,
            child: Column(
              children: [
                Text(
                  "Gagnez des points",
                  style: TextStyle(
                    fontSize: AppTheme().getTypographySize('2xl'),
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "Contribuez à l'amélioration de l'environnement et gagnez des points pour monter en niveau et débloquer des récompenses",
                  textAlign: TextAlign.center,
                  style: TextStyle(
                    fontSize: AppTheme().getTypographySize('base'),
                    color: AppColors.gray500,
                    height: 1.5,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
