import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A widget that displays the current location coordinates
class LocationBadge extends StatelessWidget {
  /// Creates a new [LocationBadge]
  const LocationBadge({
    super.key,
    this.latitude,
    this.longitude,
    this.isLoading = false,
  });

  /// Latitude coordinate
  final double? latitude;

  /// Longitude coordinate
  final double? longitude;

  /// Whether the location is currently being loaded
  final bool isLoading;

  @override
  Widget build(BuildContext context) {
    // Determine text to display
    final String displayText = isLoading
        ? 'Récupération de position...'
        : (latitude == null || longitude == null)
            ? 'Localisation désactivée'
            : '${latitude!.toStringAsFixed(2)}, ${longitude!.toStringAsFixed(2)}';

    // Determine icon to display
    final IconData icon = isLoading
        ? Icons.location_searching
        : (latitude == null || longitude == null)
            ? Icons.location_off
            : Icons.location_on;

    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppTheme().getSpacing('3'),
        vertical: AppTheme().getSpacing('2'),
      ),
      decoration: BoxDecoration(
        color: (latitude == null || longitude == null) 
            ? AppColors.gray300
            : AppColors.info.withOpacity(0.9),
        borderRadius: AppTheme().getBorderRadius('md'),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withOpacity(0.1),
            blurRadius: 4,
            offset: const Offset(0, 2),
          ),
        ],
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(
            icon,
            size: 18,
            color: (latitude == null || longitude == null)
                ? AppColors.gray700
                : Colors.white,
          ),
          SizedBox(width: AppTheme().getSpacing('2')),
          Text(
            displayText,
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.w500,
              color: (latitude == null || longitude == null)
                  ? AppColors.gray700
                  : Colors.white,
            ),
          ),
        ],
      ),
    );
  }
}
