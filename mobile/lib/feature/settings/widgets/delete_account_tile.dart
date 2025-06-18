import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/settings/settings_controller.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// A widget for the delete account option
class DeleteAccountTile extends ConsumerWidget {
  const DeleteAccountTile({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return ListTile(
      leading: Icon(
        Icons.delete_forever,
        color: AppColors.danger,
      ),
      title: Text(
        'deleteAccount'.tr(),
        style: TextStyle(
          color: AppColors.danger,
          fontWeight: FontWeight.bold,
        ),
      ),
      onTap: () => _showDeleteAccountConfirmation(context, ref),
    );
  }

  void _showDeleteAccountConfirmation(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: Text('deleteAccount'.tr()),
        content: Text('deleteAccountConfirmation'.tr()),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(context).pop(),
            child: Text('cancel'.tr()),
          ),
          TextButton(
            style: TextButton.styleFrom(
              foregroundColor: AppColors.danger,
            ),
            onPressed: () async {
              // Call the mock delete account method
              await ref.read(settingsControllerProvider.notifier).deleteAccount();
              
              if (context.mounted) {
                // Show confirmation message
                ScaffoldMessenger.of(context).showSnackBar(
                  SnackBar(
                    content: Text('accountDeleted'.tr()),
                  ),
                );
                
                // Navigate back to onboarding
                context.go('/onboarding');
              }
            },
            child: Text('delete'.tr()),
          ),
        ],
      ),
    );
  }
}
