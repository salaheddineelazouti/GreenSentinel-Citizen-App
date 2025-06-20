import React from 'react';
import type { IncidentState } from '../api/incidentsApi';

type StateButtonVariant = 'travelling' | 'onsite' | 'finished';

interface StateButtonProps {
  label: string;
  state: StateButtonVariant;
  currentState?: string;
  onClick: (state: IncidentState) => void;
  disabled?: boolean;
}

/**
 * StateButton - Bouton stylé pour changer l'état d'un incident
 * Se désactive automatiquement si l'état est déjà atteint ou dépassé
 */
const StateButton: React.FC<StateButtonProps> = ({
  label,
  state,
  currentState,
  onClick,
  disabled = false,
}) => {
  // Détermine si le bouton doit être désactivé
  // 1. Désactivé explicitement par le parent
  // 2. L'état actuel correspond à cet état (déjà atteint)
  // 3. L'état actuel est plus avancé que cet état
  const isDisabled = disabled || 
    currentState === state || 
    (currentState === 'finished' && (state === 'travelling' || state === 'onsite')) ||
    (currentState === 'onsite' && state === 'travelling');
  
  // Variantes de couleurs selon l'état
  const getButtonStyles = () => {
    const baseStyles = 'btn transition-colors duration-200 font-medium rounded-lg px-4 py-2';
    
    if (isDisabled) {
      return `${baseStyles} opacity-50 cursor-not-allowed bg-gray-300 text-gray-600`;
    }
    
    switch (state) {
      case 'travelling':
        return `${baseStyles} bg-yellow-500 hover:bg-yellow-600 text-white`;
      case 'onsite':
        return `${baseStyles} bg-sky-500 hover:bg-sky-600 text-white`;
      case 'finished':
        return `${baseStyles} bg-green-600 hover:bg-green-700 text-white`;
      default:
        return `${baseStyles} bg-gray-500 hover:bg-gray-600 text-white`;
    }
  };

  return (
    <button
      className={getButtonStyles()}
      onClick={() => !isDisabled && onClick(state)}
      disabled={isDisabled}
      aria-label={`Marquer comme ${label}`}
      data-testid={`state-button-${state}`}
    >
      {label}
    </button>
  );
};

export default StateButton;
