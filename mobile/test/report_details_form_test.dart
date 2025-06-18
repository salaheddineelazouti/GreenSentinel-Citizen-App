import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:green_sentinel_mobile/feature/report/models/formz_inputs.dart';
import 'package:green_sentinel_mobile/feature/report/widgets/report_details_form.dart';

void main() {
  testWidgets('ReportDetailsForm shows validation errors when fields are empty',
      (WidgetTester tester) async {
    bool formSubmitted = false;
    bool formValidChanged = false;
    bool isFormValid = false;

    // Build the form widget
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ReportDetailsForm(
          initialProblemType: null,
          initialDescription: '',
          initialSeverityLevel: 1,
          initialAreaType: AreaType.none,
          onFormSubmitted: ({
            required ProblemType problemType,
            required String description,
            required int severityLevel,
            required AreaType areaType,
          }) {
            formSubmitted = true;
          },
          onFormValidChanged: (isValid) {
            formValidChanged = true;
            isFormValid = isValid;
          },
        ),
      ),
    ));

    // Initial state - button should be disabled
    expect(find.text('Suivant'), findsOneWidget);
    final submitButton = find.byType(ElevatedButton);
    expect(tester.widget<ElevatedButton>(submitButton).enabled, isFalse);

    // Form should have validation errors
    expect(formValidChanged, isTrue);
    expect(isFormValid, isFalse);
  });

  testWidgets('ReportDetailsForm enables submit button when fields are valid',
      (WidgetTester tester) async {
    bool formSubmitted = false;
    bool isFormValid = false;
    
    // Build the form with initial values
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ReportDetailsForm(
          initialProblemType: null,
          initialDescription: '',
          initialSeverityLevel: 3,
          initialAreaType: AreaType.none,
          onFormSubmitted: ({
            required ProblemType problemType,
            required String description,
            required int severityLevel,
            required AreaType areaType,
          }) {
            formSubmitted = true;
          },
          onFormValidChanged: (isValid) {
            isFormValid = isValid;
          },
        ),
      ),
    ));
    
    // Select a problem type
    await tester.tap(find.byType(DropdownButtonFormField<ProblemType>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Feu').last);
    await tester.pumpAndSettle();
    
    // Enter a description
    await tester.enterText(find.byType(TextFormField), 'This is a test description');
    await tester.pumpAndSettle();
    
    // Form should now be valid
    expect(isFormValid, isTrue);
    
    // Submit button should be enabled
    final submitButton = find.byType(ElevatedButton);
    expect(tester.widget<ElevatedButton>(submitButton).enabled, isTrue);
    
    // Tap the submit button
    await tester.tap(submitButton);
    await tester.pumpAndSettle();
    
    // Form should have been submitted
    expect(formSubmitted, isTrue);
  });

  testWidgets('ReportDetailsForm shows validation error for empty description',
      (WidgetTester tester) async {
    // Build the form with only problem type (missing description)
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ReportDetailsForm(
          initialProblemType: ProblemType.fire,
          initialDescription: '',
          initialSeverityLevel: 3,
          initialAreaType: AreaType.none,
          onFormSubmitted: ({
            required ProblemType problemType,
            required String description,
            required int severityLevel,
            required AreaType areaType,
          }) {},
          onFormValidChanged: (_) {},
        ),
      ),
    ));

    // Trigger validation by changing a field
    await tester.tap(find.byType(DropdownButtonFormField<ProblemType>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Pollution').last);
    await tester.pumpAndSettle();
    
    // Description should show error
    expect(find.text('Description obligatoire'), findsOneWidget);
    
    // Submit button should still be disabled
    final submitButton = find.byType(ElevatedButton);
    expect(tester.widget<ElevatedButton>(submitButton).enabled, isFalse);
  });

  testWidgets('ReportDetailsForm area type selection works correctly',
      (WidgetTester tester) async {
    ProblemType? selectedProblemType;
    String? selectedDescription;
    int selectedSeverity = 0;
    AreaType? selectedAreaType;

    // Build form with valid required fields
    await tester.pumpWidget(MaterialApp(
      home: Scaffold(
        body: ReportDetailsForm(
          initialProblemType: ProblemType.fire,
          initialDescription: 'Initial test description',
          initialSeverityLevel: 2,
          initialAreaType: AreaType.none,
          onFormSubmitted: ({
            required ProblemType problemType,
            required String description,
            required int severityLevel,
            required AreaType areaType,
          }) {
            selectedProblemType = problemType;
            selectedDescription = description;
            selectedSeverity = severityLevel;
            selectedAreaType = areaType;
          },
          onFormValidChanged: (_) {},
        ),
      ),
    ));
    
    // Change area type
    await tester.tap(find.byType(DropdownButtonFormField<AreaType>).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('Moyenne végétation').last);
    await tester.pumpAndSettle();
    
    // Submit the form
    await tester.tap(find.text('Suivant'));
    await tester.pumpAndSettle();
    
    // Verify values
    expect(selectedProblemType, ProblemType.fire);
    expect(selectedDescription, 'Initial test description');
    expect(selectedSeverity, 2);
    expect(selectedAreaType, AreaType.midVegetation);
  });
}
