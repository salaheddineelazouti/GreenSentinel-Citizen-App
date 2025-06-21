'use client';

import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Badge,
  Flex,
  Button,
  Select,
  Text,
  useColorModeValue,
  Spinner,
  IconButton,
  HStack,
  Spacer,
} from '@chakra-ui/react';
import { ChevronLeftIcon, ChevronRightIcon, TriangleDownIcon, TriangleUpIcon } from '@chakra-ui/icons';
import { useState, useEffect } from 'react';
import { Incident, IncidentFilters } from '@/lib/api';
import { Filters } from '@/lib/filters';
import { formatDate } from '@/lib/utils';
import ExportMenu from './ExportMenu';

interface IncidentTableProps {
  incidents: Incident[];
  isLoading: boolean;
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onSortChange: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  onIncidentSelect: (incident: Incident) => void;
  selectedIncident?: Incident | null;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  onFilterChange?: (filters: IncidentFilters) => void;
  currentFilters?: Filters;
}

export default function IncidentTable({
  incidents,
  isLoading,
  totalItems,
  currentPage,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onSortChange,
  onIncidentSelect,
  selectedIncident,
  sortBy,
  sortOrder,
  onFilterChange,
}: IncidentTableProps) {
  const bg = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  const hoverBg = useColorModeValue('gray.50', 'gray.700');
  const selectedBg = useColorModeValue('blue.50', 'blue.900');
  
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  
  const totalPages = Math.ceil(totalItems / pageSize);
  
  // Handlers
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setStatusFilter(value);
    if (onFilterChange) {
      onFilterChange({
        status: value as any || undefined,
        priority: priorityFilter as any || undefined,
      });
    }
  };
  
  const handlePriorityFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setPriorityFilter(value);
    if (onFilterChange) {
      onFilterChange({
        status: statusFilter as any || undefined,
        priority: value as any || undefined,
      });
    }
  };
  
  const handleSort = (column: string) => {
    const newSortOrder = sortBy === column && sortOrder === 'asc' ? 'desc' : 'asc';
    onSortChange(column, newSortOrder);
  };
  
  // Status and priority styling
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'new': return 'red';
      case 'in_progress': return 'yellow';
      case 'resolved': return 'green';
      default: return 'gray';
    }
  };
  
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'red';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };
  
  const renderSortIcon = (column: string) => {
    if (sortBy !== column) return null;
    return sortOrder === 'asc' ? <TriangleUpIcon ml={1} /> : <TriangleDownIcon ml={1} />;
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      bg={bg}
      borderColor={borderColor}
      boxShadow="sm"
      w="100%"
    >
      {/* Filters and Export */}
      <Flex p={4} borderBottomWidth="1px" borderColor={borderColor} align="center" wrap="wrap" gap={4}>
        <Box>
          <Select
            size="sm"
            placeholder="Filter by status"
            value={statusFilter}
            onChange={handleStatusFilterChange}
            maxW="180px"
          >
            <option value="">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </Select>
        </Box>
        <Box>
          <Select
            size="sm"
            placeholder="Filter by priority"
            value={priorityFilter}
            onChange={handlePriorityFilterChange}
            maxW="180px"
          >
            <option value="">All Priorities</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </Select>
        </Box>
        
        <Spacer />
        
        {/* Export Menu */}
        {currentFilters && (
          <ExportMenu 
            incidentsCount={totalItems} 
            filters={currentFilters} 
          />
        )}
      </Flex>
      
      {/* Table */}
      <Box overflowX="auto">
        <Table variant="simple" size="md">
          <Thead>
            <Tr>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('title')}
                userSelect="none"
              >
                <Flex align="center">
                  Title {renderSortIcon('title')}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('status')}
                userSelect="none"
              >
                <Flex align="center">
                  Status {renderSortIcon('status')}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('priority')}
                userSelect="none"
              >
                <Flex align="center">
                  Priority {renderSortIcon('priority')}
                </Flex>
              </Th>
              <Th 
                cursor="pointer" 
                onClick={() => handleSort('createdAt')}
                userSelect="none"
              >
                <Flex align="center">
                  Created At {renderSortIcon('createdAt')}
                </Flex>
              </Th>
              <Th>Location</Th>
            </Tr>
          </Thead>
          <Tbody>
            {isLoading ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  <Spinner size="lg" color="primary.500" />
                </Td>
              </Tr>
            ) : incidents.length === 0 ? (
              <Tr>
                <Td colSpan={5} textAlign="center" py={8}>
                  No incidents found
                </Td>
              </Tr>
            ) : (
              incidents.map((incident) => (
                <Tr 
                  key={incident.id}
                  onClick={() => onIncidentSelect(incident)}
                  cursor="pointer"
                  _hover={{ bg: hoverBg }}
                  bg={selectedIncident?.id === incident.id ? selectedBg : undefined}
                >
                  <Td fontWeight="medium">{incident.title}</Td>
                  <Td>
                    <Badge colorScheme={getStatusColor(incident.status)}>
                      {incident.status.replace('_', ' ')}
                    </Badge>
                  </Td>
                  <Td>
                    <Badge colorScheme={getPriorityColor(incident.priority)}>
                      {incident.priority}
                    </Badge>
                  </Td>
                  <Td>{formatDate(incident.createdAt)}</Td>
                  <Td>
                    {incident.location?.address || 
                      `${incident.location?.latitude.toFixed(4)}, ${incident.location?.longitude.toFixed(4)}`}
                  </Td>
                </Tr>
              ))
            )}
          </Tbody>
        </Table>
      </Box>
      
      {/* Pagination */}
      <Flex 
        p={4} 
        justify="space-between" 
        align="center" 
        borderTopWidth="1px" 
        borderColor={borderColor}
        wrap="wrap"
        gap={4}
      >
        <HStack spacing={2}>
          <Select
            size="sm"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            width="80px"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
          </Select>
          <Text fontSize="sm" color="gray.600">items per page</Text>
        </HStack>
        
        <HStack>
          <Text fontSize="sm" color="gray.600">
            {`${Math.min((currentPage - 1) * pageSize + 1, totalItems)} - ${Math.min(
              currentPage * pageSize,
              totalItems
            )} of ${totalItems}`}
          </Text>
          <IconButton
            aria-label="Previous page"
            icon={<ChevronLeftIcon />}
            size="sm"
            variant="ghost"
            isDisabled={currentPage <= 1}
            onClick={() => onPageChange(currentPage - 1)}
          />
          <IconButton
            aria-label="Next page"
            icon={<ChevronRightIcon />}
            size="sm"
            variant="ghost"
            isDisabled={currentPage >= totalPages}
            onClick={() => onPageChange(currentPage + 1)}
          />
        </HStack>
      </Flex>
    </Box>
  );
}
