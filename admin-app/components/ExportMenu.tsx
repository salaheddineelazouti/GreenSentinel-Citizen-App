'use client';

import { useState } from 'react';
import {
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Button,
  IconButton,
  useToast,
  Tooltip
} from '@chakra-ui/react';
import { DownloadIcon, ChevronDownIcon } from '@chakra-ui/icons';
import { ExportFormat, fetchExport } from '@/lib/export';
import { Filters } from '@/lib/filters';

interface ExportMenuProps {
  /**
   * Number of incidents that match the current filters
   */
  incidentsCount: number;
  
  /**
   * Current filters applied to incidents
   */
  filters: Filters;
  
  /**
   * Whether the export is currently in progress
   */
  isCompact?: boolean;
}

/**
 * Export menu component for downloading incidents data as CSV or JSON
 */
export default function ExportMenu({ incidentsCount, filters, isCompact = false }: ExportMenuProps) {
  const toast = useToast();
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: ExportFormat) => {
    if (incidentsCount === 0) return;
    
    setIsExporting(true);
    try {
      await fetchExport(format, filters);
      
      toast({
        title: 'Export réussi',
        description: `Fichier ${format.toUpperCase()} généré`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Erreur d\'export',
        description: 'Impossible de générer le fichier',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsExporting(false);
    }
  };

  // If there are no incidents matching the filter, disable the export button
  const isDisabled = incidentsCount === 0 || isExporting;

  const tooltipLabel = incidentsCount === 0 
    ? 'Aucun incident à exporter' 
    : 'Exporter les incidents filtrés';

  return (
    <Tooltip label={tooltipLabel}>
      <span>
        <Menu>
          {isCompact ? (
            <MenuButton
              as={IconButton}
              icon={<DownloadIcon />}
              isDisabled={isDisabled}
              isLoading={isExporting}
              variant="outline"
              colorScheme="green"
              aria-label="Exporter"
            />
          ) : (
            <MenuButton
              as={Button}
              rightIcon={<ChevronDownIcon />}
              isDisabled={isDisabled}
              isLoading={isExporting}
              variant="outline"
              colorScheme="green"
              aria-label="Exporter"
            >
              Exporter
            </MenuButton>
          )}
          <MenuList>
            <MenuItem 
              onClick={() => handleExport('csv')}
              icon={<DownloadIcon />}
              isDisabled={isDisabled}
            >
              CSV
            </MenuItem>
            <MenuItem 
              onClick={() => handleExport('json')}
              icon={<DownloadIcon />}
              isDisabled={isDisabled}
            >
              JSON
            </MenuItem>
          </MenuList>
        </Menu>
      </span>
    </Tooltip>
  );
}
