'use client';

import {
  Box,
  Flex,
  VStack,
  Icon,
  Text,
  Link,
  useColorModeValue,
  BoxProps,
  Drawer,
  DrawerContent,
  DrawerOverlay,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  useDisclosure,
  IconButton,
} from '@chakra-ui/react';
import NextLink from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode, useEffect } from 'react';
import { FiAlertCircle, FiBarChart2, FiUsers, FiMenu } from 'react-icons/fi';

interface NavItemProps extends BoxProps {
  icon: ReactNode;
  children: ReactNode;
  href: string;
  isActive?: boolean;
}

const NavItem = ({ icon, children, href, isActive, ...rest }: NavItemProps) => {
  const activeColor = useColorModeValue('primary.600', 'primary.300');
  const inactiveColor = useColorModeValue('gray.600', 'gray.400');
  const activeBgColor = useColorModeValue('primary.50', 'whiteAlpha.100');
  
  return (
    <Link 
      as={NextLink} 
      href={href} 
      style={{ textDecoration: 'none' }} 
      w="full"
    >
      <Flex
        align="center"
        p="4"
        mx="4"
        borderRadius="lg"
        role="group"
        cursor="pointer"
        fontWeight={isActive ? "bold" : "normal"}
        color={isActive ? activeColor : inactiveColor}
        bg={isActive ? activeBgColor : 'transparent'}
        _hover={{
          bg: useColorModeValue('gray.100', 'gray.700'),
          color: useColorModeValue('primary.600', 'primary.300'),
        }}
        {...rest}
      >
        {icon && (
          <Icon
            mr="4"
            fontSize="16"
            as={icon}
          />
        )}
        {children}
      </Flex>
    </Link>
  );
};

interface SidebarProps {
  isMobile: boolean;
  onClose: () => void;
  isOpen: boolean;
}

export const SidebarContent = ({ onClose, ...props }: SidebarProps & BoxProps) => {
  const pathname = usePathname();
  
  return (
    <Box
      bg={useColorModeValue('white', 'gray.900')}
      borderRight="1px"
      borderRightColor={useColorModeValue('gray.200', 'gray.700')}
      w={{ base: 'full', md: 60 }}
      h="full"
      {...props}
    >
      <Flex h="20" alignItems="center" mx="8" justifyContent="space-between">
        <Text fontSize="2xl" fontWeight="bold" color="primary.500">
          GreenSentinel
        </Text>
        {props.isMobile && (
          <DrawerCloseButton onClick={onClose} />
        )}
      </Flex>
      <VStack spacing={2} align="stretch" my={6}>
        <NavItem icon={FiAlertCircle} href="/dashboard/incidents" isActive={pathname === '/dashboard/incidents'}>
          Incidents
        </NavItem>
        <NavItem icon={FiBarChart2} href="/dashboard/stats" isActive={pathname === '/dashboard/stats'}>
          Statistics
        </NavItem>
        <NavItem icon={FiUsers} href="/dashboard/users" isActive={pathname === '/dashboard/users'}>
          Users
        </NavItem>
      </VStack>
    </Box>
  );
};

export const Sidebar = ({ isMobile = false }: { isMobile?: boolean }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  // Close sidebar automatically for mobile when route changes
  const pathname = usePathname();
  useEffect(() => {
    if (isMobile && isOpen) {
      onClose();
    }
  }, [pathname, isMobile, isOpen, onClose]);

  if (isMobile) {
    return (
      <>
        <IconButton
          aria-label="Open menu"
          icon={<FiMenu />}
          onClick={onOpen}
          variant="ghost"
          size="lg"
        />
        <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader borderBottomWidth="1px">GreenSentinel Admin</DrawerHeader>
            <DrawerBody p={0}>
              <SidebarContent onClose={onClose} isMobile={true} isOpen={isOpen} />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return <SidebarContent onClose={onClose} display={{ base: 'none', md: 'block' }} isMobile={false} isOpen={false} />;
};
