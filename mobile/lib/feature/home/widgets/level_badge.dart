import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A badge that displays the user's level and points
class LevelBadge extends StatelessWidget {
  /// Creates a [LevelBadge] with the given level and points
  const LevelBadge({
    super.key,
    required this.level,
    required this.points,
  });

  /// The user's current level
  final int level;
  
  /// The user's current points
  final int points;

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: EdgeInsets.symmetric(
        horizontal: AppTheme().getSpacing('3'),
        vertical: AppTheme().getSpacing('1'),
      ),
      decoration: BoxDecoration(
        color: AppColors.secondary,
        borderRadius: AppTheme().getBorderRadius('full'),
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
          // Level indicator
          Container(
            padding: const EdgeInsets.all(4),
            decoration: BoxDecoration(
              color: Colors.white,
              shape: BoxShape.circle,
            ),
            child: Text(
              level.toString(),
              style: TextStyle(
                color: AppColors.secondary,
                fontSize: 16,
                fontWeight: FontWeight.bold,
              ),
            ),
          ),
          const SizedBox(width: 8),
          // Points indicator
          Text(
            '$points pts',
            style: const TextStyle(
              color: Colors.white,
              fontSize: 16,
              fontWeight: FontWeight.w500,
            ),
          ),
        ],
      ),
    );
  }
}
