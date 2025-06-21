'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  Button,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
  Spinner,
  Stack,
  Code,
  Badge,
  Card,
  CardHeader,
  CardBody,
  SimpleGrid,
  Divider,
} from '@chakra-ui/react';
import { getIncidents, getUsers } from '@/lib/api';

export default function DiagnosticPage() {
  const [loading, setLoading] = useState(false);
  const [statusIncidents, setStatusIncidents] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [statusUsers, setStatusUsers] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [incidentsData, setIncidentsData] = useState<any>(null);
  const [usersData, setUsersData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const testIncidentsApi = async () => {
    setStatusIncidents('loading');
    try {
      // CORRECTION: Hardcoder l'URL de l'API avec le préfixe /api/v1/
      const API_BASE = 'http://localhost:8000/api/v1';
      
      // S'assurer que l'URL est complète avec protocole http://
      const url = 'http://localhost:8000/api/v1/incidents/?limit=5';
      
      console.log('Diagnostic: Calling API at', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(response.statusText || 'Request failed');
      }

      const data = await response.json();
      setIncidentsData(data);
      setStatusIncidents('success');
      return true;
    } catch (error: any) {
      console.error('API Error - Incidents:', error);
      setStatusIncidents('error');
      setErrorMessage('API Error: ' + (error?.message || 'Unknown error'));
      return false;
    }
  };

  const testUsersApi = async () => {
    setStatusUsers('loading');
    try {
      // CORRECTION: Hardcoder l'URL de l'API avec le préfixe /api/v1/
      const API_BASE = 'http://localhost:8000/api/v1';
      
      // S'assurer que l'URL est complète avec protocole http://
      const url = 'http://localhost:8000/api/v1/users/';
      
      console.log('Diagnostic: Calling API at', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error(response.statusText || 'Not Found');
      }
      
      const data = await response.json();
      setUsersData(data);
      setStatusUsers('success');
      return true;
    } catch (error: any) {
      console.error('API Error - Users:', error);
      setStatusUsers('error');
      // Utiliser une erreur locale plutôt qu'une notification globale
      setErrorMessage('API Error: ' + (error?.message || 'Not Found'));
      return false;
    }
  };

  const runAllTests = async () => {
    setLoading(true);
    setErrorMessage(null);
    
    await testIncidentsApi();
    await testUsersApi();
    
    setLoading(false);
  };

  // Helper to render status badge
  const renderStatusBadge = (status: 'idle' | 'loading' | 'success' | 'error') => {
    if (status === 'idle') return <Badge>Idle</Badge>;
    if (status === 'loading') return <Badge colorScheme="blue">Testing...</Badge>;
    if (status === 'success') return <Badge colorScheme="green">Success</Badge>;
    return <Badge colorScheme="red">Error</Badge>;
  };

  return (
    <Box>
      <Heading mb={4}>Dashboard Diagnostic</Heading>
      <Text mb={6}>Cette page permet de tester la connectivité avec les API du backend.</Text>

      {errorMessage && (
        <Alert status="error" mb={4} borderRadius="md">
          <AlertIcon />
          <AlertTitle>Erreur:</AlertTitle>
          <AlertDescription>{errorMessage}</AlertDescription>
        </Alert>
      )}

      <Button 
        colorScheme="blue" 
        onClick={runAllTests} 
        mb={8} 
        isLoading={loading}
        loadingText="Running tests..."
      >
        Run All Tests
      </Button>

      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
        {/* Incidents API Test */}
        <Card>
          <CardHeader>
            <Heading size="md">
              API Incidents Test {renderStatusBadge(statusIncidents)}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={3}>
              <Button 
                onClick={testIncidentsApi} 
                colorScheme="teal" 
                isLoading={statusIncidents === 'loading'}
                size="sm"
              >
                Tester API Incidents
              </Button>
              
              {incidentsData && (
                <>
                  <Text>Total incidents: {incidentsData.total}</Text>
                  <Text>Résultats: {incidentsData.data?.length || 0}</Text>
                  {incidentsData.data?.length > 0 && (
                    <Code p={2} borderRadius="md" fontSize="sm">
                      {JSON.stringify(incidentsData.data[0], null, 2)}
                    </Code>
                  )}
                </>
              )}
            </Stack>
          </CardBody>
        </Card>

        {/* Users API Test */}
        <Card>
          <CardHeader>
            <Heading size="md">
              API Users Test {renderStatusBadge(statusUsers)}
            </Heading>
          </CardHeader>
          <CardBody>
            <Stack spacing={3}>
              <Button 
                onClick={testUsersApi} 
                colorScheme="teal" 
                isLoading={statusUsers === 'loading'}
                size="sm"
              >
                Tester API Users
              </Button>
              
              {usersData && (
                <>
                  <Text>Total users: {usersData.length}</Text>
                  {usersData.length > 0 && (
                    <Code p={2} borderRadius="md" fontSize="sm">
                      {JSON.stringify(usersData[0], null, 2)}
                    </Code>
                  )}
                </>
              )}
            </Stack>
          </CardBody>
        </Card>
      </SimpleGrid>

      <Divider my={8} />

      <Box mt={8}>
        <Heading size="md" mb={4}>Configuration API</Heading>
        <Code p={4} borderRadius="md" fontSize="sm" whiteSpace="pre-wrap">
          API_BASE: http://localhost:8000/api/v1<br />
          URL endpoints utilisés: http://localhost:8000/api/v1/users/ et http://localhost:8000/api/v1/incidents/<br />
        </Code>
        <Text mt={2} fontSize="sm" color="gray.500">
          Note: Configuration manuelle forcée pour contourner le problème de chargement des variables d'environnement.
        </Text>
      </Box>
    </Box>
  );
}
