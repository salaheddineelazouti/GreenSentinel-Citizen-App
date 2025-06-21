'use client';

import Head from 'next/head';

import { useState, useEffect } from 'react';
import { 
  Box, 
  Heading, 
  IconButton, 
  useDisclosure, 
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalCloseButton,
  useToast,
  Button,
  HStack,
  Badge,
  Flex
} from '@chakra-ui/react';
import dynamic from 'next/dynamic';
import { useIncidentsFiltered } from '@/hooks/useIncidentsFiltered';
import { Filters, defaultFilters, hasActiveFilters } from '@/lib/filters';
import { Incident } from '@/lib/api';
import { FiFilter, FiRefreshCw } from 'react-icons/fi';
import FilterBadges from '@/components/FilterBadges';
import FiltersDrawer from '@/components/FiltersDrawer';

// Dynamically import the map component with SSR disabled
const GlobalMap = dynamic(
  () => import('@/components/GlobalMap'),
  { ssr: false }
);

export default function MapPage() {
  // State for filters
  const [filters, setFilters] = useState<Filters>({...defaultFilters});
  
  // Selected incident for detail view
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);
  
  // Use useEffect to load MarkerCluster CSS
  useEffect(() => {
    // Add MarkerCluster CSS link
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = '/leaflet/markercluster.css';
    document.head.appendChild(link);
    
    return () => {
      // Cleanup - remove the link when component unmounts
      const linkEl = document.querySelector('link[href="/leaflet/markercluster.css"]');
      if (linkEl) document.head.removeChild(linkEl);
    };
  }, []);
  
  // Drawer and modal controls
  const { 
    isOpen: isDrawerOpen, 
    onOpen: onDrawerOpen, 
    onClose: onDrawerClose 
  } = useDisclosure();
  
  const { 
    isOpen: isModalOpen, 
    onOpen: onModalOpen, 
    onClose: onModalClose 
  } = useDisclosure();
  
  const toast = useToast();
  
  // Fetch filtered incidents with WebSocket updates
  const { incidents, totalCount, isLoading, refetch } = useIncidentsFiltered(filters);
  
  // Open incident detail modal when an incident is selected
  useEffect(() => {
    if (selectedIncident) {
      onModalOpen();
    }
  }, [selectedIncident, onModalOpen]);
  
  // Close modal and clear selection when closed
  const handleModalClose = () => {
    setSelectedIncident(null);
    onModalClose();
  };
  
  // Handler for filter application
  const handleApplyFilters = () => {
    refetch();
    toast({
      title: "Filtres appliqués",
      description: `${totalCount} incidents trouvés`,
      status: "success",
      duration: 3000,
      isClosable: true,
    });
  };
  
  return (
    <Box position="relative" h="calc(100vh - 80px)">
      {/* Header with filter controls */}
      <Flex 
        position="absolute" 
        top={4} 
        left={4} 
        right={4} 
        zIndex={10}
        bg="rgba(0,0,0,0.7)" 
        p={3} 
        borderRadius="md"
        justify="space-between"
        align="center"
      >
        <HStack spacing={4}>
          <Heading size="md" color="white">
            Carte Globale
            <Badge ml={2} colorScheme="red" fontSize="0.8em">
              {totalCount}
            </Badge>
          </Heading>
          
          <Box display={{ base: 'none', md: 'block' }} ml={4} color="white">
            <FilterBadges filters={filters} />
          </Box>
        </HStack>
        
        <HStack>
          <IconButton
            aria-label="Rafraîchir"
            icon={<FiRefreshCw />}
            onClick={refetch}
            size="sm"
            colorScheme="blue"
          />
          <Button
            leftIcon={<FiFilter />}
            onClick={onDrawerOpen}
            size="sm"
            colorScheme={hasActiveFilters(filters) ? "red" : "gray"}
          >
            Filtres
          </Button>
        </HStack>
      </Flex>
      
      {/* Main map component */}
      <GlobalMap 
        incidents={incidents} 
        onSelectIncident={setSelectedIncident} 
      />
      
      {/* Filters drawer */}
      <FiltersDrawer
        isOpen={isDrawerOpen}
        onClose={onDrawerClose}
        filters={filters}
        setFilters={setFilters}
        onApply={handleApplyFilters}
      />
      
      {/* Incident detail modal */}
      <Modal isOpen={isModalOpen} onClose={handleModalClose} size="lg">
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {selectedIncident?.title}
            <Badge ml={2} colorScheme="red">
              Gravité: {selectedIncident?.severity}/5
            </Badge>
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody pb={6}>
            {selectedIncident && (
              <Box>
                <p><strong>ID:</strong> {selectedIncident.id}</p>
                <p><strong>État:</strong> {selectedIncident.state}</p>
                <p><strong>Description:</strong> {selectedIncident.description || 'Aucune description'}</p>
                <p><strong>Latitude:</strong> {selectedIncident.lat}</p>
                <p><strong>Longitude:</strong> {selectedIncident.lng}</p>
                {selectedIncident.created_at ? (
                  <p><strong>Date de création:</strong> {new Date(selectedIncident.created_at).toLocaleString()}</p>
                ) : (
                  <p><strong>Date de création:</strong> {selectedIncident.createdAt ? new Date(selectedIncident.createdAt).toLocaleString() : 'Non disponible'}</p>
                )}
                {selectedIncident.updated_at ? (
                  <p><strong>Dernière mise à jour:</strong> {new Date(selectedIncident.updated_at).toLocaleString()}</p>
                ) : selectedIncident.updatedAt ? (
                  <p><strong>Dernière mise à jour:</strong> {new Date(selectedIncident.updatedAt).toLocaleString()}</p>
                ) : null}
              </Box>
            )}
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
}
