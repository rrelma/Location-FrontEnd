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

type Compagnie = {
  id: number;
  name: string;
};

const CompagniesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentCompagnie, setCurrentCompagnie] = useState<Compagnie | null>(null);
  const [compagnieToDelete, setCompagnieToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const API_BASE_URL = 'https://localhost:7079/api/compagnie';
  
  const [compagnies, setCompagnies] = useState<Compagnie[]>([]);

  // Fetch all compagnies
  useEffect(() => {
    const fetchCompagnies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCompagnies(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch compagnies');
        console.error("Error fetching compagnies:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompagnies();
  }, []);

  const handleAdd = async () => {
    setIsLoading(true);
    setError(null);
    setFormErrors({});
    
    const previousCompagnies = [...compagnies];
    
    try {
      // Optimistic UI update
      const tempCompagnie = {
        id: -1,
        name: newCompagnie.name
      };

      setCompagnies([...compagnies, tempCompagnie]);

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompagnie),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors: Record<string, string> = {};
            Object.keys(errorData.errors).forEach(key => {
              const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
              fieldErrors[fieldName] = errorData.errors[key].join(', ');
            });
            setFormErrors(fieldErrors);
            throw new Error("Form validation failed");
          }
          throw new Error(errorData.message || 'Validation failed');
        }
        throw new Error('Failed to add compagnie');
      }

      const result = await response.json();
      const actualId = result.id;
      
      setCompagnies(prev => prev.map(compagnie => 
        compagnie.id === -1 ? { ...compagnie, id: actualId } : compagnie
      ));

      setAddModalOpen(false);
      setNewCompagnie({ name: '' });
    } catch (err) {
      setCompagnies(previousCompagnies);
      const errorMessage = err instanceof Error ? err.message : 'Failed to add compagnie';
      if (!errorMessage.includes("Form validation failed")) {
        setError(errorMessage);
      }
      console.error("Error adding compagnie:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedCompagnie) return;

    setIsLoading(true);
    setError(null);
    setFormErrors({});

    const previousCompagnies = [...compagnies];
    
    try {
      setCompagnies(prev => prev.map(compagnie => 
        compagnie.id === editedCompagnie.id ? editedCompagnie : compagnie
      ));

      const response = await fetch(`${API_BASE_URL}/${editedCompagnie.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editedCompagnie),
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          if (errorData.errors) {
            const fieldErrors: Record<string, string> = {};
            Object.keys(errorData.errors).forEach(key => {
              const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
              fieldErrors[fieldName] = errorData.errors[key].join(', ');
            });
            setFormErrors(fieldErrors);
            throw new Error("Form validation failed");
          }
          throw new Error(errorData.message || 'Validation failed');
        }
        
        if (response.status === 404) {
          throw new Error("Compagnie not found");
        }
        
        throw new Error('Failed to update compagnie');
      }

      setEditModalOpen(false);
    } catch (err) {
      setCompagnies(previousCompagnies);
      const errorMessage = err instanceof Error ? err.message : 'Failed to update compagnie';
      if (!errorMessage.includes("Form validation failed")) {
        setError(errorMessage);
      }
      console.error("Error updating compagnie:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete compagnie
  const handleDelete = async () => {
    if (!compagnieToDelete) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${compagnieToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCompagnies(compagnies.filter(c => c.id !== compagnieToDelete));
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete compagnie');
      console.error("Error deleting compagnie:", err);
    } finally {
      setIsLoading(false);
      setCompagnieToDelete(null);
    }
  };

  const [filteredCompagnies, setFilteredCompagnies] = useState<Compagnie[]>(compagnies);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedCompagnie, setEditedCompagnie] = useState<Compagnie | null>(null);
  const [newCompagnie, setNewCompagnie] = useState<Omit<Compagnie, 'id'>>({ 
    name: ''
  });

  type FilterOptions = {
    status: string[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    status: []
  });

  // Apply filters
  useEffect(() => {
    let result = [...compagnies];

    if (searchTerm) {
      result = result.filter(compagnie => 
        compagnie.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter (if you want to add some status logic later)
    if (filterOptions.status.length > 0) {
      // You can implement status-based filtering here if needed
      // For now, we'll just return all results since compagnies don't have a status field
    }

    setFilteredCompagnies(result);
  }, [compagnies, searchTerm, filterOptions]);

  const openEditModal = (compagnie: Compagnie) => {
    setCurrentCompagnie(compagnie);
    setEditedCompagnie({...compagnie});
    setEditModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setCompagnieToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const toggleFilter = (category: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].includes(value) 
        ? prev[category].filter(v => v !== value) 
        : [...prev[category], value]
    }));
  };

  const clearAllFilters = () => {
    setFilterOptions({
      status: []
    });
    setSearchTerm('');
  };

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <div className={`inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Filtres</h3>
            <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800">
              Tout effacer
            </button>
          </div>
          
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher des compagnies..."
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


        </div>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <div className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white shadow-sm z-10 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Entreprises d'assurance</h1>
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileFiltersOpen(true)} className="p-1 text-gray-500 hover:text-gray-600">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-1 text-gray-500 hover:text-gray-600 relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Entreprises d'assurance</h2>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-4">
                  {filteredCompagnies.length} {filteredCompagnies.length === 1 ? 'compagnie trouvée' : 'compagnies trouvées'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                  disabled={isLoading}
                >
                  {isLoading ? 'Chargement...' : (
                    <>
                      <PlusIcon className="h-5 w-5 mr-2" />
                      Ajouter
                    </>
                  )}
                </motion.button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nom</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCompagnies.map(compagnie => (
                    <tr key={compagnie.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{compagnie.id}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{compagnie.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditModal(compagnie)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmDelete(compagnie.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Supprimer"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </motion.button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>

      {/* Add Compagnie Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Ajouter une nouvelle entreprise d'assurance</h3>
              <button 
                onClick={() => {
                  setAddModalOpen(false);
                  setFormErrors({});
                }} 
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={newCompagnie.name}
                  onChange={(e) => setNewCompagnie({...newCompagnie, name: e.target.value})}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setAddModalOpen(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'En cours...' : 'Ajouter'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editedCompagnie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Modifier l'entreprise</h3>
              <button 
                onClick={() => {
                  setEditModalOpen(false);
                  setFormErrors({});
                }} 
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Nom</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={editedCompagnie.name}
                  onChange={(e) => setEditedCompagnie({...editedCompagnie, name: e.target.value})}
                />
                {formErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                )}
              </div>
            </div>
            
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setEditModalOpen(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                disabled={isLoading}
              >
                {isLoading ? 'En cours...' : 'Enregistrer'}
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
              <h3 className="text-lg font-medium">Confirmer la suppression</h3>
              <button 
                onClick={() => setDeleteConfirmOpen(false)} 
                className="text-gray-500 hover:text-gray-700"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer cette compagnie ? Cette action est irréversible.</p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                disabled={isLoading}
              >
                {isLoading ? 'Suppression...' : 'Supprimer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompagniesPage;