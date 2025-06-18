import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A slider widget to select a severity level from 1 to 5
class SeveritySlider extends StatelessWidget {
  /// Creates a new [SeveritySlider]
  const SeveritySlider({
    super.key,
    required this.value,
    required this.onChanged,
    this.errorText,
  });

  /// Current severity value (1-5)
  final int value;

  /// Callback that is called when the slider value changes
  final ValueChanged<int> onChanged;

  /// Error text to display if validation fails
  final String? errorText;

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        // Label and current value
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Text(
              'Niveau de gravité',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.gray700,
              ),
            ),
            Container(
              padding: EdgeInsets.symmetric(
                horizontal: AppTheme().getSpacing('2'),
                vertical: AppTheme().getSpacing('1'),
              ),
              decoration: BoxDecoration(
                color: AppColors.primary,
                borderRadius: AppTheme().getBorderRadius('full'),
              ),
              child: Text(
                '$value',
                style: const TextStyle(
                  color: Colors.white,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ),
          ],
        ),
        
        const SizedBox(height: 8),
        
        // Slider
        Slider(
          value: value.toDouble(),
          min: 1,
          max: 5,
          divisions: 4,
          activeColor: AppColors.primary,
          onChanged: (value) => onChanged(value.round()),
        ),
        
        // Labels
        Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            const Text(
              'Faible',
              style: TextStyle(fontSize: 14),
            ),
            const Text(
              'Moyen',
              style: TextStyle(fontSize: 14),
            ),
            const Text(
              'Élevé',
              style: TextStyle(fontSize: 14),
            ),
          ],
        ),
        
        // Error text
        if (errorText != null) ...[
          const SizedBox(height: 8),
          Text(
            errorText!,
            style: TextStyle(
              color: AppColors.alert,
              fontSize: 14,
            ),
          ),
        ],
      ],
    );
  }
}
