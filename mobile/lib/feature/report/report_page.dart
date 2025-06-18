import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/report_controller.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/camera_capture_button.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/image_preview.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/location_badge.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/report_details_form.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/severity_slider.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Page for creating a new environmental report
class ReportPage extends ConsumerStatefulWidget {
  /// Creates a new instance of [ReportPage]
  const ReportPage({super.key});

  @override
  ConsumerState<ReportPage> createState() => _ReportPageState();
}

class _ReportPageState extends ConsumerState<ReportPage> {
  final TextEditingController _descriptionController = TextEditingController();

  @override
  void dispose() {
    _descriptionController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final reportState = ref.watch(reportControllerProvider);
    final controller = ref.read(reportControllerProvider.notifier);

    // Watch for state changes to show snackbars
    ref.listen<ReportState>(
      reportControllerProvider,
      (previous, current) {
        // Show error message
        if (current.status == ReportStatus.error &&
            current.errorMessage != null) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: Text(current.errorMessage!),
              backgroundColor: AppColors.alert,
            ),
          );
        }

        // Show success message and navigate back
        if (current.status == ReportStatus.sent) {
          ScaffoldMessenger.of(context).showSnackBar(
            SnackBar(
              content: const Text('Signalement sauvegardé (mock)'),
              backgroundColor: AppColors.success,
            ),
          );
          
          // Reset and navigate back
          Future.delayed(const Duration(milliseconds: 1500), () {
            controller.resetToCapture();
            context.go('/home');
          });
        }
      },
    );

    return Scaffold(
      appBar: AppBar(
        title: const Text('Nouveau signalement'),
        backgroundColor: AppColors.primary,
        foregroundColor: Colors.white,
      ),
      body: Column(
        children: [
          // Progress indicator
          LinearProgressIndicator(
            value: (reportState.currentStep + 1) / 3,
            backgroundColor: AppColors.secondary.withOpacity(0.3),
            valueColor: AlwaysStoppedAnimation<Color>(AppColors.secondary),
          ),
          
          // Main content with stepper
          Expanded(
            child: _buildStepContent(reportState, controller),
          ),
        ],
      ),
    );
  }

  Widget _buildStepContent(ReportState state, ReportController controller) {
    switch (state.currentStep) {
      case 0:
        return _buildCaptureStep(state, controller);
      case 1:
        return _buildDetailsStep(state, controller);
      case 2:
        return _buildPreviewStep(state, controller);
      default:
        return const Center(child: Text('Étape inconnue'));
    }
  }

  Widget _buildCaptureStep(ReportState state, ReportController controller) {
    return Center(
      child: Padding(
        padding: EdgeInsets.all(AppTheme().getSpacing('6')),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text(
              'Photographiez le problème',
              style: TextStyle(
                fontSize: AppTheme().getTypographySize('xl'),
                fontWeight: FontWeight.bold,
                color: AppColors.gray700,
              ),
            ),
            SizedBox(height: AppTheme().getSpacing('6')),
            CameraCaptureButton(
              onPressed: state.status == ReportStatus.capturing
                  ? null
                  : () => controller.captureImage(),
            ),
            SizedBox(height: AppTheme().getSpacing('6')),
            if (state.status == ReportStatus.capturing)
              const CircularProgressIndicator(),
          ],
        ),
      ),
    );
  }

  Widget _buildDetailsStep(ReportState state, ReportController controller) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.all(AppTheme().getSpacing('6')),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image thumbnail
            if (state.reportDraft.filePath != null)
              Center(
                child: SizedBox(
                  width: 120,
                  height: 120,
                  child: ClipRRect(
                    borderRadius: AppTheme().getBorderRadius('md'),
                    child: Image.asset(
                      state.reportDraft.filePath!,
                      fit: BoxFit.cover,
                    ),
                  ),
                ),
              ),
              
            SizedBox(height: AppTheme().getSpacing('4')),
            
            // Details form
            ReportDetailsForm(
              initialProblemType: state.reportDraft.problemType,
              initialDescription: state.reportDraft.description,
              initialSeverityLevel: state.reportDraft.severityLevel,
              initialAreaType: state.reportDraft.areaType,
              onFormSubmitted: ({required ProblemType problemType, 
                               required String description, 
                               required int severityLevel, 
                               required AreaType areaType}) {
                controller.updateProblemType(problemType);
                controller.updateDescription(description);
                controller.updateSeverityLevel(severityLevel);
                controller.updateAreaType(areaType);
                controller.goToNextStep();
              },
              onFormValidChanged: (isValid) {
                // Can be used to enable/disable navigation buttons if needed
              },
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildPreviewStep(ReportState state, ReportController controller) {
    return SingleChildScrollView(
      child: Padding(
        padding: EdgeInsets.all(AppTheme().getSpacing('6')),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            // Image preview
            if (state.reportDraft.filePath != null)
              Center(
                child: ImagePreview(
                  imagePath: state.reportDraft.filePath!,
                  onRetake: () => controller.resetToCapture(),
                ),
              ),
            
            SizedBox(height: AppTheme().getSpacing('6')),
            
            // Location badge
            Center(
              child: LocationBadge(
                latitude: state.reportDraft.latitude,
                longitude: state.reportDraft.longitude,
                isLoading: state.status == ReportStatus.capturing,
              ),
            ),
            
            SizedBox(height: AppTheme().getSpacing('6')),
            
            // Problem type
            Text(
              'Type: ${state.reportDraft.problemType?.label ?? "Non spécifié"}',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.gray700,
              ),
            ),
            
            SizedBox(height: AppTheme().getSpacing('2')),
            
            // Description
            Text(
              'Description:',
              style: TextStyle(
                fontSize: 16,
                fontWeight: FontWeight.bold,
                color: AppColors.gray700,
              ),
            ),
            SizedBox(height: AppTheme().getSpacing('1')),
            Container(
              width: double.infinity,
              padding: EdgeInsets.all(AppTheme().getSpacing('3')),
              decoration: BoxDecoration(
                color: Colors.white,
                borderRadius: AppTheme().getBorderRadius('md'),
                border: Border.all(color: AppColors.gray300),
              ),
              child: Text(
                state.reportDraft.description ?? 'Aucune description',
                style: const TextStyle(fontSize: 16),
              ),
            ),
            
            SizedBox(height: AppTheme().getSpacing('4')),
            
            // Severity level
            Row(
              children: [
                Text(
                  'Niveau de gravité: ',
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
                    '${state.reportDraft.severityLevel}',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            
            SizedBox(height: AppTheme().getSpacing('3')),
            
            // Area type if specified
            if (state.reportDraft.areaType != AreaType.none) ...[    
              Text(
                'Zone touchée: ${state.reportDraft.areaType?.label}',
                style: TextStyle(
                  fontSize: 16,
                  fontWeight: FontWeight.bold,
                  color: AppColors.gray700,
                ),
              ),
              SizedBox(height: AppTheme().getSpacing('3')),
            ],
            
            SizedBox(height: AppTheme().getSpacing('6')),
            
            // Submit button
            Center(
              child: Semantics(
                label: 'Envoyer le signalement',
                button: true,
                child: ElevatedButton(
                  onPressed: state.status == ReportStatus.sending
                      ? null
                      : () => controller.submitReport(),
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.primary,
                    foregroundColor: Colors.white,
                    padding: EdgeInsets.symmetric(
                      horizontal: AppTheme().getSpacing('6'),
                      vertical: AppTheme().getSpacing('3'),
                    ),
                    minimumSize: const Size(200, 48),
                    shape: RoundedRectangleBorder(
                      borderRadius: AppTheme().getBorderRadius('md'),
                    ),
                  ),
                  child: state.status == ReportStatus.sending
                      ? const SizedBox(
                          width: 20,
                          height: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : const Text(
                          'Envoyer',
                          style: TextStyle(fontSize: 16),
                        ),
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}
