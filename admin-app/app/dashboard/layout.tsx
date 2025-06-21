'use client';

import {
  Box,
  Flex,
  HStack,
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Text,
  Button,
  Avatar,
  Badge,
  Tooltip,
  useColorMode,
  useColorModeValue,
  useBreakpointValue,
} from '@chakra-ui/react';
import { SunIcon, MoonIcon } from '@chakra-ui/icons';
import { Sidebar } from '@/components/Sidebar';
import { logout } from '@/lib/auth';
import { useEffect, useState } from 'react';
import { getIncidentWebSocket } from '@/lib/ws';
import { isClient } from '@/lib/utils';
import { FiMapPin } from 'react-icons/fi';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { colorMode, toggleColorMode } = useColorMode();
  const isMobile = useBreakpointValue({ base: true, md: false });
  const [adminName, setAdminName] = useState('Admin User');
  const [incidentCount, setIncidentCount] = useState(0);

  // In a real app, you would fetch the admin name from the API
  useEffect(() => {
    // Mock getting admin name - in real app, this would fetch from API
    // using the auth token to get current user details
    setAdminName('Admin User');
  }, []);
  
  // Connect to WebSocket for real-time incident count updates
  useEffect(() => {
    if (!isClient) return;

    const ws = getIncidentWebSocket();
    if (!ws) return;
    
    // Connect to WebSocket
    ws.connect();

    // Listen for new incidents
    const handleCreate = (event: any) => {
      setIncidentCount(prev => prev + 1);
    };

    // Register event handlers
    ws.on('create', handleCreate);

    return () => {
      // Clean up event listeners when component unmounts
      if (ws) {
        ws.off('create', handleCreate);
        // Don't disconnect as other components might be using the WebSocket
      }
    };
  }, []);

  return (
    <Box minH="100vh" bg={useColorModeValue('gray.50', 'gray.900')}>
      <Flex h="full">
        {/* Sidebar */}
        <Sidebar isMobile={isMobile} />
        
        {/* Main content area */}
        <Box flex="1" ml={{ base: 0, md: 60 }}>
          {/* Topbar */}
          <Flex
            as="header"
            align="center"
            justify="space-between"
            w="full"
            px="4"
            py="4"
            borderBottomWidth="1px"
            borderBottomColor={useColorModeValue('gray.200', 'gray.700')}
            bg={useColorModeValue('white', 'gray.800')}
            boxShadow="sm"
          >
            <HStack spacing="4">
              {isMobile && <Sidebar isMobile={true} />}
              <Text fontSize="xl" fontWeight="semibold" color="primary.500" display={{ base: 'none', md: 'block' }}>
                Dashboard
              </Text>
            </HStack>
            
            <HStack spacing="4">
              <Box position="relative" display="flex" alignItems="center">
                <Tooltip label="Incidents en direct">
                  <Box>
                    <IconButton
                      aria-label="Incidents Map"
                      variant="ghost"
                      size="md"
                      fontSize="lg"
                      icon={<FiMapPin />}
                      as="a"
                      href="/dashboard/map"
                    />
                    {incidentCount > 0 && (
                      <Badge
                        position="absolute"
                        top="0"
                        right="0"
                        transform="translate(30%, -30%)"
                        colorScheme="red"
                        borderRadius="full"
                        fontSize="xs"
                      >
                        {incidentCount}
                      </Badge>
                    )}
                  </Box>
                </Tooltip>
              </Box>
              
              <IconButton
                aria-label={`Switch to ${colorMode === 'light' ? 'dark' : 'light'} mode`}
                variant="ghost"
                size="md"
                fontSize="lg"
                icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
                onClick={toggleColorMode}
              />
              
              <Menu>
                <MenuButton
                  as={Button}
                  variant="link"
                  cursor="pointer"
                  minW={0}
                  _hover={{ textDecoration: 'none' }}
                >
                  <HStack>
                    <Avatar
                      size="sm"
                      name={adminName}
                      bg="primary.500"
                      color="white"
                    />
                    <Text fontSize="sm" fontWeight="medium" display={{ base: 'none', md: 'block' }}>
                      {adminName}
                    </Text>
                  </HStack>
                </MenuButton>
                <MenuList>
                  <MenuItem onClick={logout}>Logout</MenuItem>
                </MenuList>
              </Menu>
            </HStack>
          </Flex>
          
          {/* Page content */}
          <Box p="4" overflowY="auto">
            {children}
          </Box>
        </Box>
      </Flex>
    </Box>
  );
}
