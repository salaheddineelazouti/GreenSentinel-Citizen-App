import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A widget that displays a row of dots as a page indicator
class DotIndicator extends StatelessWidget {
  /// Creates a new instance of [DotIndicator]
  /// 
  /// - [pageController] is the controller for the page view
  /// - [pages] is the total number of pages
  const DotIndicator({
    super.key,
    required this.pageController,
    required this.pages,
  });

  /// The controller for the page view
  final PageController pageController;
  
  /// The total number of pages
  final int pages;

  @override
  Widget build(BuildContext context) {
    return AnimatedBuilder(
      animation: pageController,
      builder: (context, _) {
        double page = 0;
        
        // Handle edge case where position isn't available yet
        if (pageController.positions.isNotEmpty) {
          // Calculate the exact page position, including fractional positions
          page = pageController.page ?? 0;
        }

        return Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: List.generate(
            pages,
            (index) => Dot(
              isActive: (index - page).abs() < 0.5,
              isPartiallyActive: (index - page).abs() < 1.0,
              partialValue: 1.0 - (index - page).abs(),
            ),
          ),
        );
      },
    );
  }
}

/// A single dot in the indicator
class Dot extends StatelessWidget {
  /// Creates a new instance of [Dot]
  /// 
  /// - [isActive] indicates if this dot represents the current page
  /// - [isPartiallyActive] indicates if this dot should show a partial animation
  /// - [partialValue] is the animation value between 0.0 and 1.0
  const Dot({
    super.key,
    required this.isActive,
    this.isPartiallyActive = false,
    this.partialValue = 0.0,
  });

  /// Whether this dot represents the current page
  final bool isActive;
  
  /// Whether this dot should show a partial animation (when swiping)
  final bool isPartiallyActive;
  
  /// Animation value between 0.0 and 1.0
  final double partialValue;

  @override
  Widget build(BuildContext context) {
    // Calculate size based on active state or animation
    double size;
    if (isActive) {
      size = 12.0; // Active dot size
    } else if (isPartiallyActive) {
      // Interpolate between inactive (8.0) and active (12.0) size
      size = 8.0 + (4.0 * partialValue);
    } else {
      size = 8.0; // Inactive dot size
    }

    // Calculate opacity based on active state or animation
    double opacity;
    if (isActive) {
      opacity = 1.0; // Active dot opacity
    } else if (isPartiallyActive) {
      // Interpolate between inactive (0.5) and active (1.0) opacity
      opacity = 0.5 + (0.5 * partialValue);
    } else {
      opacity = 0.5; // Inactive dot opacity
    }

    return AnimatedContainer(
      duration: const Duration(milliseconds: 250),
      margin: const EdgeInsets.symmetric(horizontal: 4.0),
      height: size,
      width: size,
      decoration: BoxDecoration(
        color: AppColors.primary.withOpacity(opacity),
        borderRadius: BorderRadius.circular(size / 2),
      ),
    );
  }
}
