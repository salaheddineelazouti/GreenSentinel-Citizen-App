import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:easy_localization/easy_localization.dart';
import 'package:green_sentinel_mobile/feature/settings/widgets/delete_account_tile.dart';
import 'package:green_sentinel_mobile/feature/settings/widgets/language_selector.dart';
import 'package:green_sentinel_mobile/feature/settings/widgets/theme_toggle.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Settings page for the GreenSentinel app
class SettingsPage extends ConsumerWidget {
  /// Creates a settings page
  const SettingsPage({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return Scaffold(
      appBar: AppBar(
        title: Text('settings'.tr()),
      ),
      body: SafeArea(
        child: ListView(
          children: [
            // Settings sections with appropriate spacing
            Padding(
              padding: EdgeInsets.symmetric(
                vertical: AppTheme().getSpacing('4'),
              ),
              child: const LanguageSelector(),
            ),
            const Divider(),
            const ThemeToggle(),
            const Divider(),
            // Spacer to push the delete account option to the bottom
            SizedBox(height: AppTheme().getSpacing('8')),
            const DeleteAccountTile(),
            SizedBox(height: AppTheme().getSpacing('4')),
          ],
        ),
      ),
    );
  }
}
