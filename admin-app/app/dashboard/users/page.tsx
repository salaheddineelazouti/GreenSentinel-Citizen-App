'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Button,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Input,
  Select,
  IconButton,
  Flex,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  FormControl,
  FormLabel,
  useToast,
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  Stack,
  Spinner,
} from '@chakra-ui/react';
import { AddIcon, DeleteIcon, EditIcon } from '@chakra-ui/icons';
import { User, getUsers, createUser, updateUser, deleteUser } from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { useRef } from 'react';

// Mock data for initial users since this is a stub
const initialUsers: User[] = [
  {
    id: '1',
    name: 'Admin User',
    email: 'admin@greensentinel.dev',
    role: 'admin',
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'Field Agent',
    email: 'agent@greensentinel.dev',
    role: 'user',
    createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export default function UsersPage() {
  // État pour les utilisateurs
  const [users, setUsers] = useState<User[]>(initialUsers);
  
  // Calculer les utilisateurs sûrs (toujours un tableau)
  const safeUsers = Array.isArray(users) ? users : initialUsers;
  const [isLoading, setIsLoading] = useState(true);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<User>>({
    name: '',
    email: '',
    role: 'user',
  });

  // Hooks
  const toast = useToast();
  const { 
    isOpen: isEditModalOpen, 
    onOpen: onEditModalOpen, 
    onClose: onEditModalClose 
  } = useDisclosure();
  const {
    isOpen: isDeleteAlertOpen,
    onOpen: onDeleteAlertOpen,
    onClose: onDeleteAlertClose,
  } = useDisclosure();
  const cancelRef = useRef(null);

  // Fetch users on component mount
  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      // Call the API
      const data = await getUsers();
      
      // S'assurer que data est un tableau avant de le stocker
      if (Array.isArray(data)) {
        // Utiliser les données de l'API (garanties comme un tableau)
        setUsers(data);
        console.log(`${data.length} utilisateurs chargés depuis l'API`);
      } else {
        // Si ce n'est pas un tableau, utiliser un tableau vide
        console.warn('API a retourné des données non conformes (pas un tableau):', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des utilisateurs:', error);
      
      // Utiliser les données statiques UNIQUEMENT en cas d'erreur réelle
      setUsers(initialUsers);
      // Afficher une notification d'erreur une seule fois
      toast({
        title: 'Erreur de connexion à l\'API',
        description: 'Données de démonstration affichées',
        status: 'error',
        duration: 3000,
        isClosable: true,
        // ID unique pour éviter les duplications
        id: 'api-error-toast'
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Nettoyer les toasts existants et charger les utilisateurs au montage
  useEffect(() => {
    // Effacer toutes les notifications existantes
    // Utiliser setTimeout pour s'assurer que ça se produit après le rendu initial
    setTimeout(() => {
      document.querySelectorAll('.chakra-toast').forEach(toastEl => {
        const closeButton = toastEl.querySelector('button[aria-label="Close"]');
        if (closeButton) {
          (closeButton as HTMLButtonElement).click();
        }
      });
    }, 100);
    
    // Charger les données
    fetchUsers();
  }, []);

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Handle add/edit user
  const handleSaveUser = async () => {
    try {
      // Validate form data
      if (!formData.name || !formData.email) {
        toast({
          title: 'Erreur de validation',
          description: 'Nom et email sont requis',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
        return;
      }

      // For existing user (edit)
      if (editingUser) {
        try {
          // Call the real API
          const updatedUser = await updateUser(editingUser.id, formData);
          
          // Update local state with API response
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === editingUser.id ? updatedUser : user
          ));

          toast({
            title: 'Utilisateur mis à jour',
            description: `${updatedUser.name} a été mis à jour`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } catch (err) {
          console.error('API update failed, using fallback:', err);
          
          // Fallback behavior if API call fails
          const updatedUser: User = {
            ...editingUser,
            name: formData.name || editingUser.name,
            email: formData.email || editingUser.email,
            role: formData.role as 'admin' | 'user' || editingUser.role,
            updatedAt: new Date().toISOString()
          };
          
          setUsers(prevUsers => prevUsers.map(user => 
            user.id === editingUser.id ? updatedUser : user
          ));

          toast({
            title: 'Mode hors-ligne',
            description: `Mise à jour locale uniquement`,
            status: 'warning',
            duration: 2000,
            isClosable: true,
          });
        }
      } 
      // For new user (add)
      else {
        try {
          // Call the real API
          const newUser = await createUser(formData);
          
          // Add new user returned from API to local state
          setUsers(prevUsers => [...prevUsers, newUser]);

          toast({
            title: 'Utilisateur créé',
            description: `${newUser.name} a été créé`,
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } catch (err) {
          console.error('API create failed, using fallback:', err);
          
          // Fallback behavior if API call fails
          const newUser: User = {
            id: `${Date.now()}`, // Generate a unique ID
            name: formData.name || 'User',
            email: formData.email || '',
            role: formData.role as 'admin' | 'user' || 'user',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          };
          
          setUsers(prevUsers => [...prevUsers, newUser]);

          toast({
            title: 'Mode hors-ligne',
            description: `Création locale uniquement`,
            status: 'warning',
            duration: 2000,
            isClosable: true,
          });
        }
      }

      // Close modal and reset form
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        role: 'user',
      });
      onEditModalClose();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de l\'enregistrement',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Handle delete user
  const handleDeleteUser = async () => {
    try {
      if (!deletingUserId) return;
      
      try {
        // Call the real API
        await deleteUser(deletingUserId);
        
        // Update local state
        setUsers(prevUsers => prevUsers.filter(user => user.id !== deletingUserId));
        
        toast({
          title: 'Utilisateur supprimé',
          description: 'L\'utilisateur a été supprimé avec succès',
          status: 'success',
          duration: 2000,
          isClosable: true,
        });
      } catch (err) {
        console.error('API delete failed, using fallback:', err);
        
        // Fallback behavior if API call fails
        setUsers(prevUsers => prevUsers.filter(user => user.id !== deletingUserId));
        
        toast({
          title: 'Mode hors-ligne',
          description: 'Suppression locale uniquement',
          status: 'warning',
          duration: 2000,
          isClosable: true,
        });
      }
      
      // Reset state and close alert
      setDeletingUserId(null);
      onDeleteAlertClose();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast({
        title: 'Erreur',
        description: 'Échec de la suppression. Veuillez réessayer.',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  // Open edit modal for adding a new user
  const handleAddUser = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      role: 'user',
    });
    onEditModalOpen();
  };

  // Open edit modal for editing an existing user
  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      role: user.role,
    });
    onEditModalOpen();
  };

  // Open confirmation dialog for deleting a user
  const handleDeleteConfirm = (userId: string) => {
    setDeletingUserId(userId);
    onDeleteAlertOpen();
  };

  return (
    <Box>
      <Flex justify="space-between" align="center" mb={6}>
        <Heading size="lg">Users</Heading>
        <Button 
          leftIcon={<AddIcon />}
          colorScheme="primary"
          onClick={handleAddUser}
        >
          Add User
        </Button>
      </Flex>
      
      {isLoading ? (
        <Flex justify="center" py={10}>
          <Spinner size="xl" color="primary.500" />
        </Flex>
      ) : (
        <Box overflowX="auto">
          <Table variant="simple">
            <Thead>
              <Tr>
                <Th>Name</Th>
                <Th>Email</Th>
                <Th>Role</Th>
                <Th>Created At</Th>
                <Th width="100px">Actions</Th>
              </Tr>
            </Thead>
            <Tbody>
              {safeUsers.map(user => (
                <Tr key={user.id}>
                  <Td>{user.name}</Td>
                  <Td>{user.email}</Td>
                  <Td>{user.role}</Td>
                  <Td>{formatDate(user.createdAt)}</Td>
                  <Td>
                    <Flex gap={2}>
                      <IconButton
                        aria-label="Edit user"
                        icon={<EditIcon />}
                        size="sm"
                        onClick={() => handleEditUser(user)}
                      />
                      <IconButton
                        aria-label="Delete user"
                        icon={<DeleteIcon />}
                        size="sm"
                        colorScheme="red"
                        onClick={() => handleDeleteConfirm(user.id)}
                      />
                    </Flex>
                  </Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      )}
      
      {/* Edit/Create User Modal */}
      <Modal isOpen={isEditModalOpen} onClose={onEditModalClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>
            {editingUser ? `Edit User: ${editingUser.name}` : 'Add New User'}
          </ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Stack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Name</FormLabel>
                <Input
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                />
              </FormControl>
              <FormControl>
                <FormLabel>Role</FormLabel>
                <Select
                  name="role"
                  value={formData.role}
                  onChange={handleInputChange}
                >
                  <option value="user">User</option>
                  <option value="admin">Admin</option>
                </Select>
              </FormControl>
            </Stack>
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" mr={3} onClick={onEditModalClose}>
              Cancel
            </Button>
            <Button colorScheme="primary" onClick={handleSaveUser}>
              Save
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
      
      {/* Delete User Confirmation */}
      <AlertDialog
        isOpen={isDeleteAlertOpen}
        leastDestructiveRef={cancelRef}
        onClose={onDeleteAlertClose}
      >
        <AlertDialogOverlay>
          <AlertDialogContent>
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Delete User
            </AlertDialogHeader>
            <AlertDialogBody>
              Are you sure you want to delete this user? This action cannot be undone.
            </AlertDialogBody>
            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onDeleteAlertClose}>
                Cancel
              </Button>
              <Button colorScheme="red" onClick={handleDeleteUser} ml={3}>
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
}
