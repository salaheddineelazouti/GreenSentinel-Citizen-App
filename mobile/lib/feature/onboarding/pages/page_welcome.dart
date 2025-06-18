import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// First onboarding page - Welcome
class PageWelcome extends StatelessWidget {
  /// Creates a new instance of [PageWelcome]
  const PageWelcome({super.key});

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
              label: "Illustration montrant la protection de la nature",
              child: Center(
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: AppTheme().getBorderRadius('full'),
                  ),
                  child: Icon(
                    Icons.eco_outlined,
                    size: 120,
                    color: AppColors.primary,
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
                  "Protégez la nature",
                  style: TextStyle(
                    fontSize: AppTheme().getTypographySize('2xl'),
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "GreenSentinel vous aide à signaler et suivre les problèmes environnementaux dans votre région",
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
