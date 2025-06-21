'use client';

import { useState } from 'react';
import {
  Box,
  Heading,
  Grid,
  GridItem,
  Flex,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  HStack
} from '@chakra-ui/react';
import { useStats, PeriodDays } from '@/hooks/useStats';
import DateRangeSelect from '@/components/DateRangeSelect';
import DailyLineChart from '@/components/DailyLineChart';
import ResponseTimeBar from '@/components/ResponseTimeBar';
import TypeRadarChart from '@/components/TypeRadarChart';

export default function StatsPage() {
  // Default to 30 days view
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodDays>(30);
  
  // Use our custom hook to fetch stats data
  const { data, error, isLoading, setDays } = useStats(selectedPeriod);
  
  // Handle period change
  const handlePeriodChange = (days: PeriodDays) => {
    setSelectedPeriod(days);
    setDays(days);
  };

  // Show error if API request failed
  if (error) {
    return (
      <Box p={5}>
        <Alert status="error" variant="subtle" flexDirection="column" alignItems="center" justifyContent="center" textAlign="center" borderRadius="md">
          <AlertIcon boxSize="40px" mr={0} />
          <AlertTitle mt={4} mb={1} fontSize="lg">
            Erreur de chargement des statistiques
          </AlertTitle>
          <AlertDescription maxWidth="sm">
            Une erreur s'est produite lors du chargement des données. Veuillez réessayer plus tard.
          </AlertDescription>
        </Alert>
      </Box>
    );
  }

  return (
    <Box p={4}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg">Statistiques</Heading>
        <DateRangeSelect 
          value={selectedPeriod} 
          onChange={handlePeriodChange} 
          isLoading={isLoading} 
        />
      </HStack>
      
      {isLoading ? (
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="red.500" thickness="4px" />
        </Flex>
      ) : (
        <Grid 
          templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)' }} 
          gap={6}
        >
          <GridItem colSpan={{ base: 1, md: 2 }}>
            <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
              <Heading size="md" mb={4}>Incidents par jour</Heading>
              {data?.daily && <DailyLineChart data={data.daily} />}
            </Box>
          </GridItem>
          
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
              <Heading size="md" mb={4}>Temps de réponse moyen</Heading>
              {data?.responseTimes && <ResponseTimeBar data={data.responseTimes} />}
            </Box>
          </GridItem>
          
          <GridItem>
            <Box p={4} borderWidth="1px" borderRadius="lg" bg="white" shadow="sm">
              <Heading size="md" mb={4}>Répartition par type</Heading>
              {data?.byType && <TypeRadarChart data={data.byType} />}
            </Box>
          </GridItem>
        </Grid>
      )}
    </Box>
  );
}
