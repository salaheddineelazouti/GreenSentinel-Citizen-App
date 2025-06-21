'use client';

import { Badge, HStack, Text, Tooltip } from '@chakra-ui/react';
import { Filters, countActiveFilters } from '@/lib/filters';
import { IncidentState } from '@/lib/api';
import dayjs from 'dayjs';

interface FilterBadgesProps {
  filters: Filters;
}

/**
 * Display badges for active filters
 */
export default function FilterBadges({ filters }: FilterBadgesProps) {
  const activeFiltersCount = countActiveFilters(filters);
  
  if (activeFiltersCount === 0) {
    return <Text fontSize="sm" color="gray.500">Aucun filtre actif</Text>;
  }
  
  // Map incident states to more readable labels
  const stateLabels: Record<IncidentState, string> = {
    validated_fire: 'Feu Validé',
    travelling: 'En Route',
    onsite: 'Sur Site',
    finished: 'Terminé'
  };
  
  return (
    <HStack spacing={2} wrap="wrap">
      {filters.fromDate && (
        <Tooltip label="Date de début">
          <Badge colorScheme="blue">
            De: {dayjs(filters.fromDate).format('DD/MM/YYYY')}
          </Badge>
        </Tooltip>
      )}
      
      {filters.toDate && (
        <Tooltip label="Date de fin">
          <Badge colorScheme="blue">
            À: {dayjs(filters.toDate).format('DD/MM/YYYY')}
          </Badge>
        </Tooltip>
      )}
      
      {filters.states.length > 0 && (
        <Tooltip label="États d'incident">
          <Badge colorScheme="green">
            États: {filters.states.map(state => stateLabels[state]).join(', ')}
          </Badge>
        </Tooltip>
      )}
      
      {filters.minSeverity > 1 && (
        <Tooltip label="Gravité minimale">
          <Badge colorScheme="red">
            Gravité ≥ {filters.minSeverity}
          </Badge>
        </Tooltip>
      )}
    </HStack>
  );
}
