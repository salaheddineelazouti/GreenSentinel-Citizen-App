import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A large, animated button for reporting environmental issues
class HeroReportButton extends StatefulWidget {
  /// Creates a [HeroReportButton] with the given [onPressed] callback
  const HeroReportButton({
    super.key,
    this.onPressed,
  });

  /// Callback that is called when the button is pressed
  final VoidCallback? onPressed;

  @override
  State<HeroReportButton> createState() => _HeroReportButtonState();
}

class _HeroReportButtonState extends State<HeroReportButton>
    with SingleTickerProviderStateMixin {
  late AnimationController _controller;
  late Animation<double> _scaleAnimation;
  bool _isPressed = false;

  @override
  void initState() {
    super.initState();
    _controller = AnimationController(
      duration: const Duration(milliseconds: 200),
      vsync: this,
    );

    _scaleAnimation = Tween<double>(
      begin: 1.0,
      end: 1.1, // Scale to 110% when pressed
    ).animate(CurvedAnimation(
      parent: _controller,
      curve: Curves.easeInOut,
    ));
  }

  @override
  void dispose() {
    _controller.dispose();
    super.dispose();
  }

  void _handleTapDown(TapDownDetails details) {
    if (!_isPressed) {
      _isPressed = true;
      _controller.forward();
    }
  }

  void _handleTapUp(TapUpDetails details) {
    if (_isPressed) {
      _isPressed = false;
      _controller.reverse();
    }
  }

  void _handleTapCancel() {
    if (_isPressed) {
      _isPressed = false;
      _controller.reverse();
    }
  }

  @override
  Widget build(BuildContext context) {
    return Semantics(
      label: 'Signaler un incendie',
      button: true,
      child: GestureDetector(
        onTapDown: _handleTapDown,
        onTapUp: _handleTapUp,
        onTapCancel: _handleTapCancel,
        onTap: widget.onPressed,
        child: AnimatedBuilder(
          animation: _scaleAnimation,
          builder: (context, child) {
            return Transform.scale(
              scale: _scaleAnimation.value,
              child: child,
            );
          },
          child: Container(
            width: 140, // Diameter as specified
            height: 140,
            decoration: BoxDecoration(
              color: AppColors.primary,
              shape: BoxShape.circle,
              boxShadow: [
                BoxShadow(
                  color: Colors.black.withOpacity(0.2),
                  blurRadius: 10,
                  offset: const Offset(0, 5),
                ),
              ],
            ),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                // Flame icon
                Icon(
                  Icons.local_fire_department,
                  size: 48,
                  color: Colors.white,
                ),
                const SizedBox(height: 8),
                // Label
                Text(
                  'Signaler',
                  style: TextStyle(
                    color: Colors.white,
                    fontSize: 16,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Extension providing a convenience method for navigating to the report screen
extension HeroReportButtonNavigation on BuildContext {
  /// Navigates to the report screen
  void navigateToReport() {
    GoRouter.of(this).go('/report');
  }
}
