'use client';

import { useState } from 'react';
import {
  Button,
  Drawer,
  DrawerBody,
  DrawerCloseButton,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  FormControl,
  FormLabel,
  VStack,
  HStack,
  Heading,
  CheckboxGroup,
  Checkbox,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  SliderMark,
  Text,
  Box,
} from '@chakra-ui/react';
import { SingleDatepicker } from 'chakra-dayzed-datepicker';
import { Filters, defaultFilters } from '@/lib/filters';
import { IncidentState } from '@/lib/api';

interface FiltersDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (filters: Filters) => void;
  onApply: () => void;
}

/**
 * Drawer containing filter controls for incidents
 */
export default function FiltersDrawer({
  isOpen,
  onClose,
  filters,
  setFilters,
  onApply,
}: FiltersDrawerProps) {
  // Local state for filters, applied when "Appliquer" is clicked
  const [localFilters, setLocalFilters] = useState<Filters>({...filters});
  
  // Map incident states to more readable labels
  const stateLabels: Record<IncidentState, string> = {
    validated_fire: 'Feu Validé',
    travelling: 'En Route',
    onsite: 'Sur Site',
    finished: 'Terminé'
  };
  
  // All possible states
  const allStates: IncidentState[] = ['validated_fire', 'travelling', 'onsite', 'finished'];
  
  // Reset filters to default
  const handleReset = () => {
    setLocalFilters({...defaultFilters});
  };
  
  // Apply local filters and close drawer
  const handleApply = () => {
    setFilters(localFilters);
    onApply();
    onClose();
  };
  
  // When drawer is opened, reset local filters to current global filters
  const onDrawerClose = () => {
    setLocalFilters({...filters});
    onClose();
  };
  
  return (
    <Drawer isOpen={isOpen} placement="right" onClose={onDrawerClose} size="md">
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader>Filtres</DrawerHeader>
        
        <DrawerBody>
          <VStack spacing={6} align="stretch">
            {/* Date range controls */}
            <Box>
              <Heading size="sm" mb={3}>Plage de dates</Heading>
              <HStack spacing={4} mb={2}>
                <FormControl>
                  <FormLabel>De</FormLabel>
                  <SingleDatepicker
                    name="date-from"
                    date={localFilters.fromDate || undefined}
                    onDateChange={(date) => setLocalFilters({...localFilters, fromDate: date})}
                  />
                </FormControl>
                
                <FormControl>
                  <FormLabel>À</FormLabel>
                  <SingleDatepicker
                    name="date-to"
                    date={localFilters.toDate || undefined}
                    onDateChange={(date) => setLocalFilters({...localFilters, toDate: date})}
                  />
                </FormControl>
              </HStack>
            </Box>
            
            {/* States filter */}
            <Box>
              <Heading size="sm" mb={3}>États</Heading>
              <CheckboxGroup
                value={localFilters.states}
                onChange={(values) => 
                  setLocalFilters({
                    ...localFilters, 
                    states: values as IncidentState[]
                  })
                }
              >
                <VStack spacing={2} align="start">
                  {allStates.map((state) => (
                    <Checkbox key={state} value={state}>
                      {stateLabels[state]}
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            </Box>
            
            {/* Severity slider */}
            <Box>
              <Heading size="sm" mb={4}>Gravité minimale</Heading>
              <Box px={2}>
                <Slider
                  min={1}
                  max={5}
                  step={1}
                  value={localFilters.minSeverity}
                  onChange={(val) => setLocalFilters({...localFilters, minSeverity: val})}
                  colorScheme="red"
                >
                  <SliderMark value={1} mt={2} fontSize="sm">1</SliderMark>
                  <SliderMark value={2} mt={2} fontSize="sm">2</SliderMark>
                  <SliderMark value={3} mt={2} fontSize="sm">3</SliderMark>
                  <SliderMark value={4} mt={2} fontSize="sm">4</SliderMark>
                  <SliderMark value={5} mt={2} fontSize="sm">5</SliderMark>
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb boxSize={6}>
                    <Text fontSize="xs">{localFilters.minSeverity}</Text>
                  </SliderThumb>
                </Slider>
              </Box>
            </Box>
          </VStack>
        </DrawerBody>
        
        <DrawerFooter>
          <Button variant="outline" mr={3} onClick={handleReset}>
            Réinitialiser
          </Button>
          <Button colorScheme="red" onClick={handleApply}>
            Appliquer
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
