import 'package:flutter/material.dart';
import 'package:formz/formz.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/severity_slider.dart';
import 'package:green_sentinel_mobile/theme.dart';

/// Form for capturing report details with validation
class ReportDetailsForm extends StatefulWidget {
  /// Creates a new [ReportDetailsForm]
  const ReportDetailsForm({
    super.key,
    required this.initialProblemType,
    required this.initialDescription,
    required this.initialSeverityLevel,
    required this.initialAreaType,
    required this.onFormSubmitted,
    required this.onFormValidChanged,
  });

  /// Initial problem type
  final ProblemType? initialProblemType;

  /// Initial description
  final String? initialDescription;

  /// Initial severity level
  final int initialSeverityLevel;

  /// Initial area type
  final AreaType? initialAreaType;

  /// Callback when form is submitted with valid data
  final Function({
    required ProblemType problemType,
    required String description,
    required int severityLevel,
    required AreaType areaType,
  }) onFormSubmitted;

  /// Callback when form validation state changes
  final Function(bool isValid) onFormValidChanged;

  @override
  State<ReportDetailsForm> createState() => _ReportDetailsFormState();
}

class _ReportDetailsFormState extends State<ReportDetailsForm> {
  late ProblemTypeInput _problemType;
  late DescriptionInput _description;
  late SeverityInput _severity;
  late AreaTypeInput _areaType;
  final _formKey = GlobalKey<FormState>();
  
  // Form state
  FormzSubmissionStatus _status = FormzSubmissionStatus.initial;
  bool _isValid = false;

  @override
  void initState() {
    super.initState();
    _problemType = ProblemTypeInput.dirty(widget.initialProblemType);
    _description = DescriptionInput.dirty(widget.initialDescription ?? '');
    _severity = SeverityInput.dirty(widget.initialSeverityLevel);
    _areaType = AreaTypeInput.dirty(widget.initialAreaType ?? AreaType.none);
    
    _validateForm();
  }
  
  void _validateForm() {
    final isValid = Formz.validate([
      _problemType,
      _description,
      _severity,
    ]);
    
    if (isValid != _isValid) {
      setState(() {
        _isValid = isValid;
      });
      widget.onFormValidChanged(isValid);
    }
  }

  void _onSubmit() {
    if (!_isValid) return;

    setState(() {
      _status = FormzSubmissionStatus.inProgress;
    });

    widget.onFormSubmitted(
      problemType: _problemType.value!,
      description: _description.value,
      severityLevel: _severity.value,
      areaType: _areaType.value ?? AreaType.none,
    );

    setState(() {
      _status = FormzSubmissionStatus.success;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Form(
      key: _formKey,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Problem type dropdown
          Text(
            'Type de problème',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<ProblemType>(
            value: _problemType.value,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: AppTheme().getBorderRadius('regular'),
              ),
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppTheme().getSpacing('3'),
                vertical: AppTheme().getSpacing('2'),
              ),
              errorText: _problemType.isPure ? null : _problemType.error,
            ),
            items: ProblemType.values
                .map((type) => DropdownMenuItem(
                      value: type,
                      child: Text(type.label),
                    ))
                .toList(),
            onChanged: (value) {
              setState(() {
                _problemType = ProblemTypeInput.dirty(value);
              });
              _validateForm();
            },
          ),
          
          SizedBox(height: AppTheme().getSpacing('4')),
          
          // Description field
          Text(
            'Description (max 200)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 8),
          TextFormField(
            initialValue: _description.value,
            maxLength: 200,
            maxLines: 3,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: AppTheme().getBorderRadius('regular'),
              ),
              hintText: 'Décrivez le problème...',
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppTheme().getSpacing('3'),
                vertical: AppTheme().getSpacing('2'),
              ),
              errorText: _description.isPure ? null : _description.error,
            ),
            onChanged: (value) {
              setState(() {
                _description = DescriptionInput.dirty(value);
              });
              _validateForm();
            },
          ),
          
          SizedBox(height: AppTheme().getSpacing('4')),
          
          // Severity slider
          SeveritySlider(
            value: _severity.value,
            errorText: _severity.isPure ? null : _severity.error,
            onChanged: (value) {
              setState(() {
                _severity = SeverityInput.dirty(value);
              });
              _validateForm();
            },
          ),
          
          SizedBox(height: AppTheme().getSpacing('4')),
          
          // Area type dropdown (optional)
          Text(
            'Zone touchée (optionnel)',
            style: TextStyle(
              fontSize: 16,
              fontWeight: FontWeight.bold,
              color: AppColors.gray700,
            ),
          ),
          const SizedBox(height: 8),
          DropdownButtonFormField<AreaType>(
            value: _areaType.value,
            decoration: InputDecoration(
              border: OutlineInputBorder(
                borderRadius: AppTheme().getBorderRadius('regular'),
              ),
              contentPadding: EdgeInsets.symmetric(
                horizontal: AppTheme().getSpacing('3'),
                vertical: AppTheme().getSpacing('2'),
              ),
            ),
            items: AreaType.values
                .map((type) => DropdownMenuItem(
                      value: type,
                      child: Text(type.label),
                    ))
                .toList(),
            onChanged: (value) {
              setState(() {
                _areaType = AreaTypeInput.dirty(value);
              });
            },
          ),
          
          SizedBox(height: AppTheme().getSpacing('4')),
          
          // Submit button
          ElevatedButton(
            onPressed: _isValid ? _onSubmit : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.primary,
              foregroundColor: Colors.white,
              padding: EdgeInsets.symmetric(vertical: AppTheme().getSpacing('3')),
              shape: RoundedRectangleBorder(
                borderRadius: AppTheme().getBorderRadius('regular'),
              ),
            ),
            child: _status == FormzSubmissionStatus.inProgress
                ? const SizedBox(
                    height: 20,
                    width: 20,
                    child: CircularProgressIndicator(
                      color: Colors.white,
                      strokeWidth: 2,
                    ),
                  )
                : const Text(
                    'Suivant',
                    style: TextStyle(fontSize: 16, fontWeight: FontWeight.bold),
                  ),
          ),
        ],
      ),
    );
  }
}
