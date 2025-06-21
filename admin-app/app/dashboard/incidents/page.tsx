'use client';

import { useState, useEffect } from 'react';
import { Box, Heading, Grid, GridItem, useToast, Flex, Card, CardBody, Spinner, Text } from '@chakra-ui/react';
import useSWR from 'swr';
import dynamic from 'next/dynamic';
import IncidentTable from '@/components/IncidentTable';
import { getIncidents, Incident, IncidentFilters, PaginatedResponse } from '@/lib/api';
import { getIncidentWebSocket } from '@/lib/ws';
import { isClient } from '@/lib/utils';
import { convertToExportFilters } from '@/lib/filterUtils';

// Dynamically import the map component with SSR disabled
const IncidentsMap = dynamic(
  () => import('@/components/IncidentsMap'),
  { ssr: false }
);

export default function IncidentsPage() {
  // State for table controls
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filters, setFilters] = useState<IncidentFilters>({});
  const [selectedIncident, setSelectedIncident] = useState<Incident | null>(null);

  const toast = useToast();

  // Prepare SWR key using all filter/sort/pagination parameters
  const swrKey = JSON.stringify({
    endpoint: '/incidents',
    page: currentPage,
    limit: pageSize,
    sortBy,
    sortOrder,
    ...filters,
  });

  // Fetch incidents with SWR for auto-revalidation
  const { data, error, isLoading, mutate } = useSWR<PaginatedResponse<Incident>>(
    swrKey,
    async () => {
      return await getIncidents({
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
        ...filters,
      });
    },
    {
      revalidateOnFocus: false,
      dedupingInterval: 5000,
    }
  );

  // Initialize WebSocket for real-time updates
  useEffect(() => {
    // Don't initialize WebSocket during server-side rendering
    if (!isClient) return;

    const ws = getIncidentWebSocket();
    
    // Only proceed if WebSocket is available (client-side)
    if (!ws) return;
    
    // Connect to WebSocket
    ws.connect();

    // Listen for new incidents
    const handleCreate = (event: any) => {
      toast({
        title: "New incident reported",
        description: `${event.payload.title}`,
        status: "info",
        duration: 5000,
        isClosable: true,
        position: "bottom-right",
      });
      
      // Refresh data
      mutate();
    };

    // Listen for incident updates
    const handleUpdate = (event: any) => {
      toast({
        title: "Incident updated",
        description: `${event.payload.title} has been updated`,
        status: "info",
        duration: 3000,
        isClosable: true,
        position: "bottom-right",
      });
      
      // Update selected incident if it's the one being updated
      if (selectedIncident && selectedIncident.id === event.payload.id) {
        setSelectedIncident(event.payload);
      }
      
      // Refresh data
      mutate();
    };

    // Register event handlers
    ws.on('create', handleCreate);
    ws.on('update', handleUpdate);

    return () => {
      // Clean up event listeners and disconnect when component unmounts
      if (ws) {
        ws.off('create', handleCreate);
        ws.off('update', handleUpdate);
        ws.disconnect();
      }
    };
  }, [mutate, selectedIncident, toast]);

  // Handle page change
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle page size change
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  // Handle sort change
  const handleSortChange = (column: string, order: 'asc' | 'desc') => {
    setSortBy(column);
    setSortOrder(order);
  };

  // Handle filter change
  const handleFilterChange = (newFilters: IncidentFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
    }));
    setCurrentPage(1); // Reset to first page when changing filters
  };

  // Handle incident selection
  const handleIncidentSelect = (incident: Incident) => {
    setSelectedIncident(incident);
  };

  // Show error if API request failed
  if (error) {
    return (
      <Box p={5}>
        <Card>
          <CardBody>
            <Heading size="md" mb={4} color="red.500">Error loading incidents</Heading>
            <Text>There was a problem retrieving the incidents. Please try again later.</Text>
          </CardBody>
        </Card>
      </Box>
    );
  }

  return (
    <Box>
      <Heading mb={6} size="lg">Incidents</Heading>
      
      {isLoading && !data ? (
        <Flex justify="center" align="center" minH="60vh">
          <Spinner size="xl" color="primary.500" thickness="4px" />
        </Flex>
      ) : (
        <Grid templateColumns={{ base: '1fr', lg: '1fr 1fr' }} gap={6}>
          {/* Incidents Table */}
          <GridItem>
            <IncidentTable
              incidents={data?.data || []}
              isLoading={isLoading}
              totalItems={data?.total || 0}
              currentPage={currentPage}
              pageSize={pageSize}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
              onSortChange={handleSortChange}
              onIncidentSelect={handleIncidentSelect}
              selectedIncident={selectedIncident}
              sortBy={sortBy}
              sortOrder={sortOrder}
              onFilterChange={handleFilterChange}
              currentFilters={convertToExportFilters(filters)}
            />
          </GridItem>
          
          {/* Map */}
          <GridItem>
            <IncidentsMap 
              incidents={data?.data || []} 
              selectedIncident={selectedIncident} 
            />
          </GridItem>
        </Grid>
      )}
    </Box>
  );
}
