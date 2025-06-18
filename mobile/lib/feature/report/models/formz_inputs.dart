import 'package:formz/formz.dart';

/// Types de problème environnemental
enum ProblemType {
  fire('Feu'),
  pollution('Pollution'),
  illegalCutting('Coupe illégale'),
  other('Autre');

  const ProblemType(this.label);
  final String label;

  static List<ProblemType> get values => [
        ProblemType.fire,
        ProblemType.pollution,
        ProblemType.illegalCutting,
        ProblemType.other,
      ];
}

/// Types de zone touchée
enum AreaType {
  none('Non spécifié'),
  lowVegetation('Basse végétation'),
  midVegetation('Moyenne végétation'),
  highVegetation('Haute végétation');

  const AreaType(this.label);
  final String label;

  static List<AreaType> get values => [
        AreaType.none,
        AreaType.lowVegetation,
        AreaType.midVegetation,
        AreaType.highVegetation,
      ];
}

/// Validation du type de problème
class ProblemTypeInput extends FormzInput<ProblemType?, String> {
  const ProblemTypeInput.pure() : super.pure(null);
  const ProblemTypeInput.dirty([ProblemType? value]) : super.dirty(value);

  @override
  String? validator(ProblemType? value) {
    return value == null ? 'Type de problème obligatoire' : null;
  }
}

/// Validation de la description
class DescriptionInput extends FormzInput<String, String> {
  const DescriptionInput.pure() : super.pure('');
  const DescriptionInput.dirty([String value = '']) : super.dirty(value);

  static final RegExp _descriptionRegExp = RegExp(r'^.{1,200}$');

  @override
  String? validator(String value) {
    if (value.isEmpty) {
      return 'Description obligatoire';
    }
    if (value.length > 200) {
      return 'Maximum 200 caractères';
    }
    return null;
  }
}

/// Validation du niveau de gravité
class SeverityInput extends FormzInput<int, String> {
  const SeverityInput.pure() : super.pure(1);
  const SeverityInput.dirty([int value = 1]) : super.dirty(value);

  @override
  String? validator(int value) {
    return (value < 1 || value > 5) ? 'Niveau entre 1 et 5' : null;
  }
}

/// Validation du type de zone (optionnel)
class AreaTypeInput extends FormzInput<AreaType?, String> {
  const AreaTypeInput.pure() : super.pure(AreaType.none);
  const AreaTypeInput.dirty([AreaType? value]) : super.dirty(value);

  @override
  String? validator(AreaType? value) {
    return null; // Optionnel
  }
}
