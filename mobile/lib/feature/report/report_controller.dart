import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:geolocator/geolocator.dart';
import 'package:go_router/go_router.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/models/report_draft.dart';
import 'package:green_sentinel_mobile/models/report_response.dart';
import 'package:green_sentinel_mobile/services/report_repository.dart';
import 'package:image_picker/image_picker.dart';
import 'package:permission_handler/permission_handler.dart';

/// Status of the report creation process
enum ReportStatus {
  /// Initial state, ready to capture
  idle,

  /// Currently capturing image or location
  capturing,

  /// Data captured, ready for submission
  ready,

  /// Currently sending report
  sending,

  /// Report successfully sent
  sent,

  /// An error occurred
  error,
}

/// Provider for the report repository
final reportRepositoryProvider = Provider<ReportRepository>((ref) {
  return ReportRepository();
});

/// Provider for the report controller
final reportControllerProvider =
    StateNotifierProvider<ReportController, ReportState>((ref) {
  final repository = ref.watch(reportRepositoryProvider);
  return ReportController(repository: repository);
});

/// State for the report controller
class ReportState {
  /// Current status of the report
  final ReportStatus status;

  /// Error message if any
  final String? errorMessage;

  /// Current report draft
  final ReportDraft reportDraft;

  /// Response from the server after submission
  final ReportResponse? reportResponse;

  /// Step in the report creation process (0: capture, 1: details, 2: preview)

  /// Creates a new [ReportState]
  const ReportState({
    this.status = ReportStatus.idle,
    this.errorMessage,
    ReportDraft? reportDraft,
    this.reportResponse,
    this.currentStep = 0,
  }) : reportDraft = reportDraft ?? const ReportDraft();

  /// Creates a copy of this [ReportState] with the given fields replaced
  ReportState copyWith({
    ReportStatus? status,
    String? errorMessage,
    ReportDraft? reportDraft,
    ReportResponse? reportResponse,
    int? currentStep,
  }) {
    return ReportState(
      status: status ?? this.status,
      errorMessage: errorMessage,
      reportDraft: reportDraft ?? this.reportDraft,
      reportResponse: reportResponse ?? this.reportResponse,
      currentStep: currentStep ?? this.currentStep,
    );
  }
}

/// Controller for the report creation process
class ReportController extends StateNotifier<ReportState> {
  /// Creates a new instance of [ReportController]
  ReportController({required this.repository}) : super(const ReportState());
  
  /// Repository for report-related operations
  final ReportRepository repository;

  /// Captures an image from the camera
  Future<void> captureImage() async {
    // Check for camera permission
    final status = await Permission.camera.request();
    if (status.isDenied || status.isPermanentlyDenied) {
      state = state.copyWith(
        status: ReportStatus.error,
        errorMessage: 'Permission de caméra refusée',
      );
      return;
    }

    try {
      state = state.copyWith(status: ReportStatus.capturing);

      final picker = ImagePicker();
      final XFile? image = await picker.pickImage(
        source: ImageSource.camera,
        maxWidth: 1024,
        imageQuality: 85,
      );

      if (image == null) {
        state = state.copyWith(status: ReportStatus.idle);
        return;
      }

      // Update state with captured image
      state = state.copyWith(
        reportDraft: state.reportDraft.copyWith(
          filePath: image.path,
          timestamp: DateTime.now(),
        ),
        status: ReportStatus.idle,
        currentStep: 1, // Move to preview step
      );

      // Get location after taking the photo
      await getCurrentLocation();
    } catch (e) {
      state = state.copyWith(
        status: ReportStatus.error,
        errorMessage: 'Erreur lors de la capture: $e',
      );
    }
  }

  /// Updates the problem type of the report
  void updateProblemType(ProblemType problemType) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(
        problemType: problemType,
      ),
    );
  }

  /// Updates the area type of the report
  void updateAreaType(AreaType areaType) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(
        areaType: areaType,
      ),
    );
  }
  
  /// Moves to the next step in the report process
  void goToNextStep() {
    state = state.copyWith(currentStep: state.currentStep + 1);
  }

  /// Gets the current location
  Future<void> getCurrentLocation() async {
    // Check for location permission
    final status = await Permission.location.request();
    if (status.isDenied || status.isPermanentlyDenied) {
      // We proceed without location
      return;
    }

    try {
      state = state.copyWith(status: ReportStatus.capturing);

      final Position position = await Geolocator.getCurrentPosition(
        desiredAccuracy: LocationAccuracy.high,
      );

      state = state.copyWith(
        reportDraft: state.reportDraft.copyWith(
          latitude: position.latitude,
          longitude: position.longitude,
        ),
        status: ReportStatus.idle,
      );
    } catch (e) {
      // We continue without location, but don't set error state
      state = state.copyWith(status: ReportStatus.idle);
    }
  }

  /// Updates the description of the report
  void updateDescription(String description) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(
        description: description,
      ),
    );
  }

  /// Updates the severity level of the report
  void updateSeverityLevel(int level) {
    state = state.copyWith(
      reportDraft: state.reportDraft.copyWith(
        severityLevel: level,
      ),
    );
  }

  /// Resets the state to capture a new image
  void resetToCapture() {
    state = const ReportState();
  }

  /// Submits the report
  Future<void> submitReport() async {
    // Validate required fields
    if (!state.reportDraft.isComplete) {
      String errorMessage = 'Informations manquantes';
      if (state.reportDraft.filePath == null) {
        errorMessage = 'Photo requise';
      } else if (state.reportDraft.problemType == null) {
        errorMessage = 'Type de problème requis';
      } else if (state.reportDraft.description == null || state.reportDraft.description!.isEmpty) {
        errorMessage = 'Description requise';
      }
      
      state = state.copyWith(
        status: ReportStatus.error,
        errorMessage: errorMessage,
      );
      return;
    }

    try {
      // Update state to sending
      state = state.copyWith(
        status: ReportStatus.sending,
        errorMessage: null,
      );

      // Attempt to upload the report
      final ReportResponse? response = await repository.uploadReport(state.reportDraft);

      if (response != null) {
        // Success - update state and save response
        state = state.copyWith(
          status: ReportStatus.sent,
          reportResponse: response,
        );
      } else {
        // Save draft locally for future retry
        final savedLocally = await repository.saveDraftLocally(state.reportDraft);
        
        // Failure - update state with appropriate message
        state = state.copyWith(
          status: ReportStatus.error,
          errorMessage: savedLocally 
              ? 'Échec de l\'envoi, mais votre signalement a été enregistré localement'
              : 'Échec de l\'envoi, réessayez plus tard',
        );
      }
    } catch (e) {
      state = state.copyWith(
        status: ReportStatus.error,
        errorMessage: 'Erreur lors de l\'envoi: $e',
      );
    }
  }
  
  /// Shows appropriate message based on report status
  void showStatusMessage(BuildContext context) {
    if (state.status == ReportStatus.sent) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Signalement envoyé !'),
          backgroundColor: Colors.green,
        ),
      );
      
      // Navigate back to home
      GoRouter.of(context).go('/home');
    } else if (state.status == ReportStatus.error) {
      ScaffoldMessenger.of(context).showSnackBar(
        SnackBar(
          content: Text(state.errorMessage ?? 'Une erreur est survenue'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }
}
