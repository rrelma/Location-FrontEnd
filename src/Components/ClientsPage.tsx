import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  PencilIcon, 
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentClient, setCurrentClient] = useState<Client | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [clients, setClients] = useState<Client[]>([]);
  const [filteredClients, setFilteredClients] = useState<Client[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedClient, setEditedClient] = useState<ClientForm | null>(null);
  const [newClient, setNewClient] = useState<ClientForm>({ 
    name: '',
    telephone: ''
  });

  // Filter options
  type FilterOptions = {
    rating: number[];
    isRenting: boolean[];
    reservations: number[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    rating: [],
    isRenting: [],
    reservations: []
  });

  // Fetch clients from API
  useEffect(() => {
    const fetchClients = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('https://localhost:7079/api/client');
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setClients(data);
        setFilteredClients(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        console.error('Error fetching clients:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchClients();
  }, []);

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
        filterOptions.isRenting.includes(client.isRenting)
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
  };

  // Save edited client
const handleSave = async () => {
  if (!editedClient) return;

  setIsLoading(true);
  setError(null);
  setFormErrors({}); // Clear previous form errors
  
  // Store previous state for potential rollback
  const previousClients = [...clients];
  
  try {
    // Optimistic update
    setClients(prev => prev.map(client => 
      client.id === editedClient.id 
        ? { ...client, name: editedClient.name, telephone: editedClient.telephone }
        : client
    ));
    
    const response = await fetch(`https://localhost:7079/api/client/${editedClient.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedClient)
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        // Extract validation errors from ASP.NET ModelState
        if (errorData.errors) {
          // Convert server errors to field-specific errors
          const fieldErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            // Convert property names to match form field names
            const fieldName = key.toLowerCase();
            fieldErrors[fieldName] = errorData.errors[key].join(', ');
          });
          setFormErrors(fieldErrors);
          throw new Error("Form validation failed");
        }
        throw new Error(errorData.message || 'Validation failed');
      }
      throw new Error('Failed to update client');
    }

    // Success - no need to refresh, we already updated optimistically
    setEditModalOpen(false);
    
  } catch (err) {
    // Revert on error
    setClients(previousClients);
    // Don't set general error for form validation errors
    const errorMessage = err instanceof Error ? err.message : 'Failed to update client';
    if (!errorMessage.includes("Form validation failed")) {
      setError(errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};

const handleAddClient = async () => {
  setIsLoading(true);
  setError(null);
  setFormErrors({}); // Clear previous form errors
  
  const previousClients = [...clients];
  
  try {
    // Create temporary client with placeholder ID
    const tempClient = {
      id: -1, // Temporary placeholder
      name: newClient.name,
      telephone: newClient.telephone,
      numberOfReservations: 0,
      rating: 0,
      isRenting: false
    };
    
    // Optimistic update with placeholder ID
    setClients(prev => [...prev, tempClient]);
    
    const response = await fetch('https://localhost:7079/api/client', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newClient)
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        // Extract validation errors from ASP.NET ModelState
        if (errorData.errors) {
          // Convert server errors to field-specific errors
          const fieldErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            // Convert property names to match form field names
            const fieldName = key.toLowerCase();
            fieldErrors[fieldName] = errorData.errors[key].join(', ');
          });
          setFormErrors(fieldErrors);
          throw new Error("Form validation failed");
        }
        throw new Error(errorData.message || 'Validation failed');
      }
      throw new Error('Failed to add client');
    }

    // Get the actual ID from the backend response
    const result = await response.json();
    const actualId = result.id;
    
    // Update the client list with the actual ID
    setClients(prev => prev.map(client => 
      client.id === -1 ? { ...client, id: actualId } : client
    ));

    setAddModalOpen(false);
    setNewClient({ name: '', telephone: '' });
    
  } catch (err) {
    // Revert on error - remove the temporary client
    setClients(previousClients);
    // Don't set general error for form validation errors
    const errorMessage = err instanceof Error ? err.message : 'Failed to add client';
    if (!errorMessage.includes("Form validation failed")) {
      setError(errorMessage);
    }
  } finally {
    setIsLoading(false);
  }
};

  // Delete client
const handleDelete = async () => {
  if (!clientToDelete) return;

  setIsLoading(true);
  setError(null);
  
  // Store previous state for potential rollback
  const previousClients = [...clients];
  
  try {
    // Optimistic update
    setClients(prev => prev.filter(client => client.id !== clientToDelete));
    
    const response = await fetch(`https://localhost:7079/api/client/${clientToDelete}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to delete client');
    }

    // Success - no need to refresh, we already updated optimistically
    setDeleteConfirmOpen(false);
    
  } catch (err) {
    // Revert on error
    setClients(previousClients);
    setError(err instanceof Error ? err.message : 'Failed to delete client');
  } finally {
    setIsLoading(false);
  }
};

  // Toggle filter
  const toggleFilter = (category: keyof FilterOptions, value: number | boolean) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].includes(value as never) 
        ? prev[category].filter(v => v !== value) 
        : [...prev[category], value as never]
    }));
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

  // Filter options
  const ratingOptions = [0, 1, 2, 3, 4, 5];
  const rentingOptions = [true, false];
  const reservationOptions = [1, 3, 5, 10];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <div className={`inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Filters</h3>
            <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800">
              Clear all
            </button>
          </div>
          
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rating filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Rating</h4>
            <div className="space-y-1">
              {ratingOptions.map(rating => (
                <div key={`rating-${rating}`} className="flex items-center">
                  <input
                    id={`rating-${rating}`}
                    type="checkbox"
                    checked={filterOptions.rating.includes(rating)}
                    onChange={() => toggleFilter('rating', rating)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`rating-${rating}`} className="ml-2 text-sm text-gray-700 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={`star-${rating}-${i}`}
                        className={`h-3 w-3 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
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

          {/* Renting status filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Renting Status</h4>
            <div className="space-y-1">
              {rentingOptions.map(status => (
                <div key={`status-${status}`} className="flex items-center">
                  <input
                    id={`status-${status}`}
                    type="checkbox"
                    checked={filterOptions.isRenting.includes(status)}
                    onChange={() => toggleFilter('isRenting', status)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700">
                    {status ? 'Renting' : 'Not Renting'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reservations</h4>
            <div className="space-y-1">
              {reservationOptions.map(num => (
                <div key={`reservations-${num}`} className="flex items-center">
                  <input
                    id={`reservations-${num}`}
                    type="checkbox"
                    checked={filterOptions.reservations.includes(num)}
                    onChange={() => toggleFilter('reservations', num)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`reservations-${num}`} className="ml-2 text-sm text-gray-700">
                    {num}+ reservations
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main content */}
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Mobile header */}
        <header className="bg-white shadow-sm z-10 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Dashboard</h1>
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileFiltersOpen(true)} className="p-1 text-gray-500 hover:text-gray-600">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-4 lg:p-6 overflow-y-auto">
          {/* Error message */}
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Clients table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Clients List</h2>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-4">
                  {filteredClients.length} {filteredClients.length === 1 ? 'client found' : 'clients found'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  ) : (
                    <PlusIcon className="h-5 w-5 mr-2" />
                  )}
                  Add Client
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reservations</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rating</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {isLoading ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        Loading clients...
                      </td>
                    </tr>
                  ) : filteredClients.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No clients found
                      </td>
                    </tr>
                  ) : (
                    filteredClients.map(client => (
                      <tr key={`client-${client.id}`} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{client.name}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {client.telephone}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          {client.numberOfReservations}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            {[...Array(5)].map((_, i) => (
                              <svg
                                key={`client-${client.id}-star-${i}`}
                                className={`h-5 w-5 ${i < Math.floor(client.rating) ? 'text-yellow-400' : 'text-gray-300'}`}
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                              </svg>
                            ))}
                            <span className="ml-1 text-gray-600">{client.rating}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${client.isRenting ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                            {client.isRenting ? 'Renting' : 'Not Renting'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openEditModal(client)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Edit"
                              disabled={isLoading}
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => {
                                setClientToDelete(client.id);
                                setDeleteConfirmOpen(true);
                              }}
                              className="text-red-600 hover:text-red-900"
                              title="Delete"
                              disabled={isLoading}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Client Modal */}
{addModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Add New Client</h3>
        <button 
          onClick={() => {
            setAddModalOpen(false);
            setFormErrors({}); // Clear errors when closing modal
          }}
          className="text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name*</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.name ? 'border-red-500' : ''
            }`}
            value={newClient.name}
            onChange={(e) => setNewClient({...newClient, name: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone*</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.telephone ? 'border-red-500' : ''
            }`}
            value={newClient.telephone}
            onChange={(e) => setNewClient({...newClient, telephone: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.telephone && (
            <p className="mt-1 text-sm text-red-600">{formErrors.telephone}</p>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => {
            setAddModalOpen(false);
            setFormErrors({}); // Clear errors when closing
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleAddClient}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Adding...
            </>
          ) : 'Add Client'}
        </button>
      </div>
    </div>
  </div>
)}

     {/* Edit Client Modal */}
{editModalOpen && currentClient && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Edit Client</h3>
        <button 
          onClick={() => {
            setEditModalOpen(false);
            setFormErrors({}); // Clear errors when closing modal
          }}
          className="text-gray-500 hover:text-gray-700"
          disabled={isLoading}
        >
          <XMarkIcon className="h-6 w-6" />
        </button>
      </div>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name*</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.name ? 'border-red-500' : ''
            }`}
            value={editedClient?.name || ''}
            onChange={(e) => setEditedClient({...editedClient!, name: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.name && (
            <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Phone*</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.telephone ? 'border-red-500' : ''
            }`}
            value={editedClient?.telephone || ''}
            onChange={(e) => setEditedClient({...editedClient!, telephone: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.telephone && (
            <p className="mt-1 text-sm text-red-600">{formErrors.telephone}</p>
          )}
        </div>
      </div>
      
      <div className="mt-6 flex justify-end space-x-3">
        <button
          onClick={() => {
            setEditModalOpen(false);
            setFormErrors({}); // Clear errors when closing
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : 'Save Changes'}
        </button>
      </div>
    </div>
  </div>
)}

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Confirm Deletion</h3>
              <button 
                onClick={() => setDeleteConfirmOpen(false)}
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            {error && (
              <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
                {error}
              </div>
            )}
            
            <p className="mb-6">Are you sure you want to delete this client? This action cannot be undone.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filters Panel */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-white p-4 lg:hidden">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">Filters</h2>
            <button onClick={() => setMobileFiltersOpen(false)} className="text-gray-500 hover:text-gray-700">
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>
          
          {/* Applied filters */}
          {(filterOptions.rating.length > 0 || filterOptions.isRenting.length > 0 || filterOptions.reservations.length > 0) && (
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="text-sm font-medium">Applied Filters</h4>
                <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800">
                  Clear all
                </button>
              </div>
              <div className="flex flex-wrap gap-1">
                {filterOptions.rating.map(rating => (
                  <span key={`mobile-selected-rating-${rating}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                    {rating}★
                    <button onClick={() => toggleFilter('rating', rating)} className="ml-1 text-indigo-600 hover:text-indigo-800">
                      ×
                    </button>
                  </span>
                ))}
                {filterOptions.isRenting.map(status => (
                  <span key={`mobile-selected-status-${status}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                    {status ? 'Renting' : 'Not Renting'}
                    <button onClick={() => toggleFilter('isRenting', status)} className="ml-1 text-indigo-600 hover:text-indigo-800">
                      ×
                    </button>
                  </span>
                ))}
                {filterOptions.reservations.map(num => (
                  <span key={`mobile-selected-reservations-${num}`} className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-indigo-100 text-indigo-800">
                    {num}+ reservations
                    <button onClick={() => toggleFilter('reservations', num)} className="ml-1 text-indigo-600 hover:text-indigo-800">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="mb-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search clients..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
                <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Rating filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Rating</h4>
            <div className="space-y-1">
              {ratingOptions.map(rating => (
                <div key={`mobile-rating-${rating}`} className="flex items-center">
                  <input
                    id={`mobile-rating-${rating}`}
                    type="checkbox"
                    checked={filterOptions.rating.includes(rating)}
                    onChange={() => toggleFilter('rating', rating)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`mobile-rating-${rating}`} className="ml-2 text-sm text-gray-700 flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={`mobile-star-${rating}-${i}`}
                        className={`h-3 w-3 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`}
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

          {/* Renting status filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Renting Status</h4>
            <div className="space-y-1">
              {rentingOptions.map(status => (
                <div key={`mobile-status-${status}`} className="flex items-center">
                  <input
                    id={`mobile-status-${status}`}
                    type="checkbox"
                    checked={filterOptions.isRenting.includes(status)}
                    onChange={() => toggleFilter('isRenting', status)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`mobile-status-${status}`} className="ml-2 text-sm text-gray-700">
                    {status ? 'Renting' : 'Not Renting'}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Reservations filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Reservations</h4>
            <div className="space-y-1">
              {reservationOptions.map(num => (
                <div key={`mobile-reservations-${num}`} className="flex items-center">
                  <input
                    id={`mobile-reservations-${num}`}
                    type="checkbox"
                    checked={filterOptions.reservations.includes(num)}
                    onChange={() => toggleFilter('reservations', num)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`mobile-reservations-${num}`} className="ml-2 text-sm text-gray-700">
                    {num}+ reservations
                  </label>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full py-2 px-4 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
            >
              Apply Filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;