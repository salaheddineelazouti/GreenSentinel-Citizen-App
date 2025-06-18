import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Second onboarding page - Map
class PageMap extends StatelessWidget {
  /// Creates a new instance of [PageMap]
  const PageMap({super.key});

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
              label: "Illustration de carte interactive",
              child: Center(
                child: Container(
                  width: 200,
                  height: 200,
                  decoration: BoxDecoration(
                    color: AppColors.gray100,
                    borderRadius: AppTheme().getBorderRadius('full'),
                  ),
                  child: Icon(
                    Icons.map_outlined,
                    size: 120,
                    color: AppColors.info,
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
                  "Signalez sur la carte",
                  style: TextStyle(
                    fontSize: AppTheme().getTypographySize('2xl'),
                    fontWeight: FontWeight.bold,
                    color: AppColors.gray700,
                  ),
                ),
                const SizedBox(height: 16),
                Text(
                  "Localisez précisément les problèmes environnementaux que vous observez grâce à notre carte interactive",
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
