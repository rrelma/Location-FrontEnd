import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/auth';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type Client = {
  id: number;
  name: string;
  telephone: string;
  numberOfReservations: number;
  rating: number;
  isRenting: boolean;
};

// Client form type that matches the backend's ClientForm
type ClientForm = {
  id?: number;
  name: string;
  telephone: string;
};

const ClientsPage = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedClient, setEditedClient] = useState<ClientForm | null>(null);
  const [newClient, setNewClient] = useState<ClientForm>({ 
    name: '',
    telephone: ''
  });

  const apiUrl = import.meta.env.VITE_API_URL;

  // Filter options
  type FilterOptions = {
    rating: number[];
    isRenting: string[];
    reservations: number[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    rating: [],
    isRenting: [],
    reservations: []
  });

  // Show success message (same as CarsPage)
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message (same as CarsPage)
  const showError = (message: string) => {
    setOperationError(message);
    setTimeout(() => setOperationError(null), 5000);
  };

  // Fetch clients from API
  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await apiFetch(`${apiUrl}/api/client`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setClients(data);
      setFilteredClients(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    let result = [...clients];

    // Search filter
    if (searchTerm) {
      result = result.filter(client => 
        client.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        client.telephone.includes(searchTerm)
      );
    }

    // Rating filter
    if (filterOptions.rating.length > 0) {
      result = result.filter(client => 
        filterOptions.rating.includes(Math.floor(client.rating))
      );
    }

    // Renting status filter
    if (filterOptions.isRenting.length > 0) {
      result = result.filter(client => 
        filterOptions.isRenting.includes(client.isRenting.toString())
      );
    }

    // Reservations filter
    if (filterOptions.reservations.length > 0) {
      result = result.filter(client => 
        filterOptions.reservations.some(threshold => 
          client.numberOfReservations >= threshold
        )
      );
    }

    setFilteredClients(result);
  }, [clients, searchTerm, filterOptions]);

  // Open edit modal
  const openEditModal = (client: Client) => {
    setCurrentClient(client);
    setEditedClient({
      id: client.id,
      name: client.name,
      telephone: client.telephone
    });
    setEditModalOpen(true);
    setOperationError(null);
  };

  // Save edited client
  const handleSave = async () => {
    if (!editedClient) return;

    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
    try {
      const response = await apiFetch(`${apiUrl}/api/client/${editedClient.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedClient)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          const errors: Record<string, string[]> = {};
          
          // Handle ASP.NET Core ModelState error format
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                // Remove property path prefix if present
                const cleanKey = key.includes('.') ? key.split('.').pop()! : key;
                errors[cleanKey] = value as string[];
              }
            }
          } else {
            // Handle other error formats
            for (const [key, value] of Object.entries(errorData)) {
              if (Array.isArray(value)) {
                errors[key] = value as string[];
              } else if (typeof value === 'string') {
                errors[key] = [value];
              }
            }
          }
          
          setFormErrors(errors);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the client list
      await fetchClients();
      setEditModalOpen(false);
      showSuccess("Client modifié avec succès!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddClient = async () => {
    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
    try {
      const response = await apiFetch(`${apiUrl}/api/client`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newClient)
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          const errors: Record<string, string[]> = {};
          
          // Handle ASP.NET Core ModelState error format
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                // Remove property path prefix if present
                const cleanKey = key.includes('.') ? key.split('.').pop()! : key;
                errors[cleanKey] = value as string[];
              }
            }
          } else {
            // Handle other error formats
            for (const [key, value] of Object.entries(errorData)) {
              if (Array.isArray(value)) {
                errors[key] = value as string[];
              } else if (typeof value === 'string') {
                errors[key] = [value];
              }
            }
          }
          
          setFormErrors(errors);
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the client list
      await fetchClients();
      setAddModalOpen(false);
      setNewClient({ name: '', telephone: '' });
      showSuccess("Client ajouté avec succès!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete client
  const handleDelete = async () => {
    if (!clientToDelete) return;

    setIsLoading(true);
    setOperationError(null);

    try {
      const response = await apiFetch(`${apiUrl}/api/client/${clientToDelete}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the client list
      await fetchClients();
      setDeleteConfirmOpen(false);
      showSuccess("Client supprimé avec succès!");
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete client';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle filter
  const toggleFilter = (category: keyof FilterOptions, value: number | string) => {
    setFilterOptions(prev => {
      const currentValues = prev[category];
      const valueIndex = currentValues.indexOf(value as never);
      
      if (valueIndex > -1) {
        // Remove the value if it exists
        return {
          ...prev,
          [category]: currentValues.filter(v => v !== value)
        };
      } else {
        // Add the value if it doesn't exist
        return {
          ...prev,
          [category]: [...currentValues, value as never]
        };
      }
    });
  };

  // Clear all filters
  const clearAllFilters = () => {
    setFilterOptions({
      rating: [],
      isRenting: [],
      reservations: []
    });
    setSearchTerm('');
  };

  const removeFilter = (category: keyof FilterOptions, value: number | string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  // Filter options
  const ratingOptions = [0, 1, 2, 3, 4, 5];
  const rentingOptions = ["true", "false"];
  const reservationOptions = [1, 3, 5, 10];

  if (isLoading && clients.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 overflow-auto">
      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      {/* Main content */}
      <div className="relative z-10">
        <main className="p-4 lg:p-6">
          {/* Notification messages - Inside main content (same as CarsPage) */}
          <AnimatePresence>
            <div className="mb-6 space-y-4">
              {operationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 flex items-start"
                >
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                    <p className="mt-1 text-sm text-red-700">{operationError}</p>
                  </div>
                  <button onClick={() => setOperationError(null)} className="text-red-600 hover:text-red-800">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
              
              {successMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-green-50 border border-green-200 rounded-lg shadow-sm p-4 flex items-start"
                >
                  <CheckCircleIcon className="h-6 w-6 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-green-800">Succès</h3>
                    <p className="mt-1 text-sm text-green-700">{successMessage}</p>
                  </div>
                  <button onClick={() => setSuccessMessage(null)} className="text-green-600 hover:text-green-800">
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </motion.div>
              )}
            </div>
          </AnimatePresence>

          {/* Filters Section */}
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100 mb-6"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
              <h2 className="font-semibold text-slate-800">Filtres</h2>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center px-3 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <FunnelIcon className="h-5 w-5 mr-1" />
                  {showFilters ? 'Masquer' : 'Afficher'}
                </button>
                {(searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0) && (
                  <button
                    onClick={clearAllFilters}
                    className="flex items-center px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="h-5 w-5 mr-1" />
                    Effacer
                  </button>
                )}
              </div>
            </div>
            
            {showFilters && (
              <div className="p-4 md:p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                {/* Search Input */}
                <div className="lg:col-span-2">
                  <label className="block text-sm font-medium text-slate-700 mb-2">Recherche</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                    </div>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Rechercher par nom ou téléphone..."
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
                
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Note</label>
                  <div className="space-y-2">
                    {ratingOptions.map(rating => (
                      <div key={`rating-${rating}`} className="flex items-center">
                        <input
                          id={`rating-${rating}`}
                          type="checkbox"
                          checked={filterOptions.rating.includes(rating)}
                          onChange={() => toggleFilter('rating', rating)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`rating-${rating}`} className="ml-2 text-sm text-slate-700 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={`star-${rating}-${i}`}
                              className={`h-3 w-3 ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Renting Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Statut de location</label>
                  <div className="space-y-2">
                    {rentingOptions.map(status => (
                      <div key={`status-${status}`} className="flex items-center">
                        <input
                          id={`status-${status}`}
                          type="checkbox"
                          checked={filterOptions.isRenting.includes(status)}
                          onChange={() => toggleFilter('isRenting', status)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`status-${status}`} className="ml-2 text-sm text-slate-700">
                          {status === "true" ? 'En location' : 'Non en location'}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reservations Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Réservations</label>
                  <div className="space-y-2">
                    {reservationOptions.map(num => (
                      <div key={`reservations-${num}`} className="flex items-center">
                        <input
                          id={`reservations-${num}`}
                          type="checkbox"
                          checked={filterOptions.reservations.includes(num)}
                          onChange={() => toggleFilter('reservations', num)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`reservations-${num}`} className="ml-2 text-sm text-slate-700">
                          {num}+ réservations
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {/* Active filters display */}
            {(searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0) && (
              <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
                <div className="flex flex-wrap gap-2">
                  {searchTerm && (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                      Recherche: "{searchTerm}"
                      <button
                        onClick={() => setSearchTerm('')}
                        className="ml-1 text-teal-600 hover:text-teal-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  )}
                  
                  {filterOptions.rating.map(rating => (
                    <span key={rating} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Note: {rating} étoile{rating > 1 ? 's' : ''}
                      <button
                        onClick={() => removeFilter('rating', rating)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  
                  {filterOptions.isRenting.map(status => (
                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Statut: {status === "true" ? 'En location' : 'Non en location'}
                      <button
                        onClick={() => removeFilter('isRenting', status)}
                        className="ml-1 text-purple-600 hover:text-purple-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  {filterOptions.reservations.map(num => (
                    <span key={num} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Réservations: {num}+
                      <button
                        onClick={() => removeFilter('reservations', num)}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Clients Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="font-semibold text-slate-800 text-lg">Liste des clients</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-slate-500">
                  {filteredClients.length} {filteredClients.length === 1 ? 'client trouvé' : 'clients trouvés'}
                  {(searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0) && 
                    ` (${clients.length} au total)`}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setAddModalOpen(true);
                    setOperationError(null);
                  }}
                  className="flex items-center px-3 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all text-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">Ajouter</span>
                </motion.button>
              </div>
            </div>

            {error ? (
              <div className="p-8 text-center">
                <ExclamationTriangleIcon className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h3 className="mt-2 text-sm font-medium text-slate-900">Erreur de chargement</h3>
                <p className="mt-1 text-sm text-slate-500">{error}</p>
                <div className="mt-6">
                  <button
                    onClick={fetchClients}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                  >
                    Réessayer
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Téléphone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Réservations</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredClients.length > 0 ? (
                      filteredClients.map(client => (
                        <tr key={`client-${client.id}`} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">{client.name}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {client.telephone}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {client.numberOfReservations}
                          </td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={`client-${client.id}-star-${i}`}
                                  className={`h-5 w-5 ${i < Math.floor(client.rating) ? 'text-yellow-400' : 'text-slate-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1 text-slate-600">{client.rating}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${client.isRenting ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'}`}>
                              {client.isRenting ? 'En location' : 'Non en location'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEditModal(client)}
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </motion.button>
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => {
                                  setClientToDelete(client.id);
                                  setDeleteConfirmOpen(true);
                                  setOperationError(null);
                                }}
                                className="text-red-600 hover:text-red-800 transition-colors p-1"
                                title="Supprimer"
                              >
                                <TrashIcon className="h-5 w-5" />
                              </motion.button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="px-6 py-8 text-center text-slate-500">
                          <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-lg font-medium">Aucun client trouvé</p>
                          <p className="text-sm mt-1">
                            {searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0
                              ? "Essayez de modifier vos filtres ou votre recherche."
                              : "Commencez par ajouter un nouveau client."}
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => {
                                if (searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0) {
                                  clearAllFilters();
                                } else {
                                  setAddModalOpen(true);
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                              {searchTerm || filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0
                                ? "Effacer les filtres"
                                : "Ajouter un client"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </main>
      </div>

      {/* Add Client Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter un nouveau client</h3>
              <button 
                onClick={() => {
                  setAddModalOpen(false);
                  setFormErrors({});
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nom *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={newClient.name}
                  onChange={(e) => setNewClient({...newClient, name: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.name && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.name.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Téléphone *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.telephone ? 'border-red-500' : ''
                  }`}
                  value={newClient.telephone}
                  onChange={(e) => setNewClient({...newClient, telephone: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.telephone && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.telephone.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['name', 'telephone'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['name', 'telephone'].includes(key))
                    .map(([key, errors]) => (
                      <div key={key} className="mt-1 text-sm text-red-600">
                        {errors.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                ))}
              </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleAddClient}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 transition-all flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ajout...
                  </>
                ) : 'Ajouter'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Client Modal */}
      {editModalOpen && editedClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier le client</h3>
              <button 
                onClick={() => {
                  setEditModalOpen(false);
                  setFormErrors({});
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Nom *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={editedClient.name}
                  onChange={(e) => setEditedClient({...editedClient, name: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.name && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.name.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Téléphone *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.telephone ? 'border-red-500' : ''
                  }`}
                  value={editedClient.telephone}
                  onChange={(e) => setEditedClient({...editedClient, telephone: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.telephone && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.telephone.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['name', 'telephone'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['name', 'telephone'].includes(key))
                    .map(([key, errors]) => (
                      <div key={key} className="mt-1 text-sm text-red-600">
                        {errors.map((error, index) => (
                          <p key={index}>{error}</p>
                        ))}
                      </div>
                    ))
                  }
                </div>
              )}
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 transition-all flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enregistrement...
                  </>
                ) : 'Enregistrer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Confirmer la suppression</h3>
              <button 
                onClick={() => setDeleteConfirmOpen(false)}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {clientToDelete && (
              <>
                {/* Show which client is being deleted */}
                <div className="mb-4 p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">
                    Client à supprimer: 
                  </p>
                  {clients.find(client => client.id === clientToDelete) && (
                    <p className="text-sm text-slate-600">
                      {clients.find(client => client.id === clientToDelete)?.name}
                    </p>
                  )}
                </div>
                
                <p className="mb-6 text-slate-700">
                  Êtes-vous sûr de vouloir supprimer ce client ? Cette action est irréversible.
                </p>
              </>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
                disabled={isLoading}
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      <style>{`
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ClientsPage;