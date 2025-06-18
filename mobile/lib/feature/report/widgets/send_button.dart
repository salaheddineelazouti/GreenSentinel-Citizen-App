import 'package:flutter/material.dart';
import 'package:green_sentinel_mobile/feature/report/report_controller.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Button states for the send button
enum SendButtonState {
  /// Ready to send
  idle,
  
  /// Currently sending
  loading,
  
  /// Successfully sent
  success,
  
  /// Failed to send
  error,
}

/// A button that displays different states during the report sending process
class SendButton extends StatelessWidget {
  /// Creates a new [SendButton]
  const SendButton({
    super.key,
    required this.state,
    required this.onPressed,
  });

  /// Current state of the button
  final SendButtonState state;

  /// Callback when button is pressed
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      height: 48,
      child: Semantics(
        label: _getAccessibilityLabel(),
        button: true,
        child: ElevatedButton(
          onPressed: state == SendButtonState.success ? null : onPressed,
          style: ElevatedButton.styleFrom(
            backgroundColor: _getButtonColor(),
            foregroundColor: Colors.white,
            shape: RoundedRectangleBorder(
              borderRadius: AppTheme().getBorderRadius('md'),
            ),
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              _buildIcon(),
              const SizedBox(width: 8),
              Text(
                _getButtonText(),
                style: const TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  /// Returns the appropriate text for the current button state
  String _getButtonText() {
    switch (state) {
      case SendButtonState.idle:
        return 'Envoyer';
      case SendButtonState.loading:
        return 'Envoi...';
      case SendButtonState.success:
        return 'Envoyé';
      case SendButtonState.error:
        return 'Réessayer';
    }
  }

  /// Returns the appropriate color for the current button state
  Color _getButtonColor() {
    switch (state) {
      case SendButtonState.idle:
        return AppColors.primary;
      case SendButtonState.loading:
        return AppColors.primary;
      case SendButtonState.success:
        return AppColors.success;
      case SendButtonState.error:
        return AppColors.alert;
    }
  }

  /// Returns the appropriate icon for the current button state
  Widget _buildIcon() {
    switch (state) {
      case SendButtonState.idle:
        return const SizedBox.shrink();
      case SendButtonState.loading:
        return const SizedBox(
          width: 16,
          height: 16,
          child: CircularProgressIndicator(
            color: Colors.white,
            strokeWidth: 2,
          ),
        );
      case SendButtonState.success:
        return const Icon(
          Icons.check_circle,
          size: 20,
        );
      case SendButtonState.error:
        return const Icon(
          Icons.warning_amber,
          size: 20,
        );
    }
  }

  /// Returns the appropriate accessibility label for the current button state
  String _getAccessibilityLabel() {
    switch (state) {
      case SendButtonState.idle:
        return 'Envoyer le signalement';
      case SendButtonState.loading:
        return 'Envoi du signalement en cours';
      case SendButtonState.success:
        return 'Signalement envoyé avec succès';
      case SendButtonState.error:
        return 'Erreur lors de l\'envoi du signalement, appuyez pour réessayer';
    }
  }
}
