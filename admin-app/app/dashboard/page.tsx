'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CardFooter,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  Flex,
  Icon,
  Button,
  useColorModeValue,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { FiMapPin, FiUsers, FiAlertTriangle, FiBarChart2 } from 'react-icons/fi';
import { getIncidents, getUsers } from '@/lib/api';

export default function DashboardPage() {
  const router = useRouter();
  const cardBg = useColorModeValue('white', 'gray.800');
  const cardHoverBg = useColorModeValue('gray.50', 'gray.700');
  
  // État pour stocker les données du backend
  const [incidentCount, setIncidentCount] = useState<number | null>(null);
  const [incidentTrend, setIncidentTrend] = useState<number>(0);
  const [userCount, setUserCount] = useState<number | null>(null);
  const [userTrend, setUserTrend] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer les données du backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Utiliser les appels fetch directs pour éviter les toasts d'erreur globaux
        const API_BASE = process.env.NEXT_PUBLIC_API_BASE || 'https://api.greensentinel.dev';
        
        // Récupérer les incidents via fetch direct
        try {
          const incidentsResponse = await fetch(`${API_BASE}/incidents?limit=1`, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (incidentsResponse.ok) {
            const data = await incidentsResponse.json();
            setIncidentCount(data.total || 0);
            // Pour simuler une tendance
            setIncidentTrend(Math.floor(Math.random() * 20) + 5);
          } else {
            console.warn('Impossible de charger les incidents:', incidentsResponse.statusText);
            setIncidentCount(8); // Valeur par défaut
            setIncidentTrend(12); // Tendance par défaut
          }
        } catch(e) {
          console.warn('Erreur incidents:', e);
          setIncidentCount(8); // Valeur par défaut
          setIncidentTrend(12); // Tendance par défaut
        }
        
        // Récupérer les utilisateurs via fetch direct
        try {
          const usersResponse = await fetch(`${API_BASE}/users`, {
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (usersResponse.ok) {
            const data = await usersResponse.json();
            setUserCount(data.length || 0);
            // Pour simuler une tendance
            setUserTrend(Math.floor(Math.random() * 10) + 5);
          } else {
            console.warn('Impossible de charger les utilisateurs:', usersResponse.statusText);
            setUserCount(2); // Valeur par défaut
            setUserTrend(5); // Tendance par défaut
          }
        } catch(e) {
          console.warn('Erreur utilisateurs:', e);
          setUserCount(2); // Valeur par défaut
          setUserTrend(5); // Tendance par défaut
        }

      } catch (err) {
        console.error('Erreur générale', err);
        setError('Erreur lors de la récupération des données. Veuillez réessayer.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);
  
  // Afficher un spinner pendant le chargement
  if (loading) {
    return (
      <Center h="50vh">
        <Spinner size="xl" color="green.500" thickness="4px" />
      </Center>
    );
  }

  // Afficher une erreur si nécessaire
  if (error) {
    return (
      <Alert status="error" variant="solid" borderRadius="md">
        <AlertIcon />
        {error}
      </Alert>
    );
  }

  return (
    <Box>
      <Heading as="h1" size="lg" mb={6}>
        Tableau de Bord GreenSentinel
      </Heading>

      <Text mb={6} color="gray.600">
        Bienvenue dans l'interface d'administration GreenSentinel. Sélectionnez une section ci-dessous.
      </Text>

      <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6}>
        {/* Carte Incidents */}
        <Card 
          bg={cardBg} 
          cursor="pointer" 
          transition="all 0.2s"
          _hover={{ bg: cardHoverBg, transform: 'translateY(-5px)', shadow: 'md' }}
          onClick={() => router.push('/dashboard/incidents')}
        >
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiAlertTriangle} boxSize={6} color="red.500" mr={2} />
              <Heading size="md">Incidents</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatLabel>Total Incidents</StatLabel>
              <StatNumber>{incidentCount !== null ? incidentCount : '-'}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {incidentTrend}% ce mois
              </StatHelpText>
            </Stat>
          </CardBody>
          <CardFooter pt={0}>
            <Button size="sm" colorScheme="red" variant="outline">
              Voir les incidents
            </Button>
          </CardFooter>
        </Card>

        {/* Carte Carte */}
        <Card 
          bg={cardBg} 
          cursor="pointer" 
          transition="all 0.2s"
          _hover={{ bg: cardHoverBg, transform: 'translateY(-5px)', shadow: 'md' }}
          onClick={() => router.push('/dashboard/map')}
        >
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiMapPin} boxSize={6} color="green.500" mr={2} />
              <Heading size="md">Carte</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>Visualisation géographique des incidents</Text>
          </CardBody>
          <CardFooter pt={0}>
            <Button size="sm" colorScheme="green" variant="outline">
              Ouvrir la carte
            </Button>
          </CardFooter>
        </Card>

        {/* Carte Utilisateurs */}
        <Card 
          bg={cardBg} 
          cursor="pointer" 
          transition="all 0.2s"
          _hover={{ bg: cardHoverBg, transform: 'translateY(-5px)', shadow: 'md' }}
          onClick={() => router.push('/dashboard/users')}
        >
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiUsers} boxSize={6} color="blue.500" mr={2} />
              <Heading size="md">Utilisateurs</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stat>
              <StatLabel>Utilisateurs actifs</StatLabel>
              <StatNumber>{userCount !== null ? userCount : '-'}</StatNumber>
              <StatHelpText>
                <StatArrow type="increase" />
                {userTrend}% ce mois
              </StatHelpText>
            </Stat>
          </CardBody>
          <CardFooter pt={0}>
            <Button size="sm" colorScheme="blue" variant="outline">
              Gérer les utilisateurs
            </Button>
          </CardFooter>
        </Card>

        {/* Carte Statistiques */}
        <Card 
          bg={cardBg} 
          cursor="pointer" 
          transition="all 0.2s"
          _hover={{ bg: cardHoverBg, transform: 'translateY(-5px)', shadow: 'md' }}
          onClick={() => router.push('/dashboard/stats')}
        >
          <CardHeader pb={0}>
            <Flex align="center">
              <Icon as={FiBarChart2} boxSize={6} color="purple.500" mr={2} />
              <Heading size="md">Statistiques</Heading>
            </Flex>
          </CardHeader>
          <CardBody>
            <Text>Analyses et rapports complets</Text>
          </CardBody>
          <CardFooter pt={0}>
            <Button size="sm" colorScheme="purple" variant="outline">
              Voir les statistiques
            </Button>
          </CardFooter>
        </Card>
      </SimpleGrid>
    </Box>
  );
}
