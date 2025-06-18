import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:green_sentinel_mobile/providers/queue_provider.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Widget that displays a badge with the number of unsent reports
class UnsentReportsBadge extends ConsumerWidget {
  /// Size of the badge
  final double size;
  
  /// Whether to show the badge when there are no unsent reports
  final bool hideWhenEmpty;
  
  /// Creates a new [UnsentReportsBadge]
  const UnsentReportsBadge({
    super.key, 
    this.size = 20, 
    this.hideWhenEmpty = true,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final queueLengthAsync = ref.watch(queueLengthStreamProvider);
    
    return queueLengthAsync.when(
      data: (count) {
        // Hide if requested and count is 0
        if (hideWhenEmpty && count == 0) {
          return const SizedBox.shrink();
        }
        
        return Container(
          height: size,
          width: size,
          decoration: BoxDecoration(
            color: count > 0 
                ? AppColors.danger 
                : AppColors.success,
            shape: BoxShape.circle,
          ),
          child: Center(
            child: count > 0
                ? Text(
                    count > 99 ? '99+' : '$count',
                    style: TextStyle(
                      color: Colors.white,
                      fontSize: size * 0.55,
                      fontWeight: FontWeight.bold,
                    ),
                  )
                : Icon(
                    Icons.check,
                    color: Colors.white,
                    size: size * 0.65,
                  ),
          ),
        );
      },
      loading: () => _buildPlaceholder(),
      error: (_, __) => _buildErrorBadge(),
    );
  }
  
  /// Builds a placeholder badge shown while loading
  Widget _buildPlaceholder() {
    return Container(
      height: size,
      width: size,
      decoration: BoxDecoration(
        color: Colors.grey.shade300,
        shape: BoxShape.circle,
      ),
    );
  }
  
  /// Builds a badge for error state
  Widget _buildErrorBadge() {
    return Container(
      height: size,
      width: size,
      decoration: const BoxDecoration(
        color: AppColors.danger,
        shape: BoxShape.circle,
      ),
      child: Center(
        child: Icon(
          Icons.error_outline,
          color: Colors.white,
          size: size * 0.65,
        ),
      ),
    );
  }
}
