import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  PlusIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

type Vignette = {
  id: number;
  vignetteNumber: string;
  dateDebut: string;
  dateExpiration: string;
  priceAnnuel: number;
  carId: number;
  carModele: string;
  carMarque: string;
};

type CarSelect = {
  id: number;
  marque: string;
  modele: string;
};

const VignettesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentVignette, setCurrentVignette] = useState<Vignette | null>(null);
  const [vignetteToDelete, setVignetteToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const API_BASE_URL = 'https://localhost:7079/api/vignette';
  const CARS_API_URL = 'https://localhost:7079/api/car/CarsList';
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [cars, setCars] = useState<CarSelect[]>([]);

  // Fetch all vignettes
  useEffect(() => {
    const fetchVignettes = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setVignettes(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch vignettes');
        console.error("Error fetching vignettes:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVignettes();
  }, []);

  // Fetch all cars for dropdown
  useEffect(() => {
    const fetchCars = async () => {
      try {
        const response = await fetch(CARS_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCars(data);
      } catch (err) {
        console.error("Error fetching cars:", err);
      }
    };

    fetchCars();
  }, []);

  const handleAdd = async () => {
  setIsLoading(true);
  setError(null);
  setFormErrors({}); // Clear previous form errors
  
  // Store current state for potential rollback
  const previousVignettes = [...vignettes];
  
  try {
    // Create temporary vignette for optimistic UI update
    const tempVignette = {
      id: -1, // Temporary placeholder ID
      vignetteNumber: newVignette.vignetteNumber,
      dateDebut: newVignette.dateDebut,
      dateExpiration: newVignette.dateExpiration,
      priceAnnuel: newVignette.priceAnnuel,
      carId: newVignette.carId,
      carModele: newVignette.carModele,
      carMarque: newVignette.carMarque
    };

    // Optimistically update UI
    setVignettes([...vignettes, tempVignette]);

    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newVignette),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        // Extract validation errors from ASP.NET ModelState
        if (errorData.errors) {
          // Convert server errors to field-specific errors
          const fieldErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            // Convert "VignetteNumber" to "vignetteNumber" for matching
            const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
            fieldErrors[fieldName] = errorData.errors[key].join(', ');
          });
          setFormErrors(fieldErrors);
          throw new Error("Form validation failed");
        }
        throw new Error(errorData.message || 'Validation failed');
      }
      throw new Error('Failed to add vignette');
    }

    // Get the actual ID from the backend response
    const result = await response.json();
    const actualId = result.id;
    
    // Update the vignette list with the actual ID
    setVignettes(prev => prev.map(vignette => 
      vignette.id === -1 ? { ...vignette, id: actualId } : vignette
    ));

    setAddModalOpen(false);
    setNewVignette({
      vignetteNumber: '',
      dateDebut: new Date().toISOString().split('T')[0],
      dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      priceAnnuel: 0,
      carId: 0,
      carModele: '',
      carMarque: ''
    });
  } catch (err) {
    // Revert to previous state on error
    setVignettes(previousVignettes);
    // Don't set general error for form validation errors
    const errorMessage = err instanceof Error ? err.message : 'Failed to add vignette';
    if (!errorMessage.includes("Form validation failed")) {
      setError(errorMessage);
    }
    console.error("Error adding vignette:", err);
  } finally {
    setIsLoading(false);
  }
};
const handleSave = async () => {
  if (!editedVignette) return;

  setIsLoading(true);
  setError(null);
  setFormErrors({}); // Clear previous form errors

  // Store previous state for potential rollback
  const previousVignettes = [...vignettes];
  
  try {
    // Optimistic update
    setVignettes(prev => prev.map(vignette => 
      vignette.id === editedVignette.id ? editedVignette : vignette
    ));

    const response = await fetch(`${API_BASE_URL}/${editedVignette.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedVignette),
    });

    if (!response.ok) {
      if (response.status === 400) {
        const errorData = await response.json();
        // Extract validation errors from ASP.NET ModelState
        if (errorData.errors) {
          // Convert server errors to field-specific errors
          const fieldErrors: Record<string, string> = {};
          Object.keys(errorData.errors).forEach(key => {
            // Convert "VignetteNumber" to "vignetteNumber" for matching
            const fieldName = key.charAt(0).toLowerCase() + key.slice(1);
            fieldErrors[fieldName] = errorData.errors[key].join(', ');
          });
          setFormErrors(fieldErrors);
          throw new Error("Form validation failed");
        }
        throw new Error(errorData.message || 'Validation failed');
      }
      
      if (response.status === 404) {
        throw new Error("Vignette not found");
      }
      
      throw new Error('Failed to update vignette');
    }

    // Success - no need to refresh, we already updated optimistically
    setEditModalOpen(false);
  } catch (err) {
    // Revert on error
    setVignettes(previousVignettes);
    // Don't set general error for form validation errors
    const errorMessage = err instanceof Error ? err.message : 'Failed to update vignette';
    if (!errorMessage.includes("Form validation failed")) {
      setError(errorMessage);
    }
    console.error("Error updating vignette:", err);
  } finally {
    setIsLoading(false);
  }
};


  // Delete vignette
  const handleDelete = async () => {
    if (!vignetteToDelete) return;

    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${vignetteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVignettes(vignettes.filter(v => v.id !== vignetteToDelete));
      setDeleteConfirmOpen(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete vignette');
      console.error("Error deleting vignette:", err);
    } finally {
      setIsLoading(false);
      setVignetteToDelete(null);
    }
  };

  const [filteredVignettes, setFilteredVignettes] = useState<Vignette[]>(vignettes);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedVignette, setEditedVignette] = useState<Vignette | null>(null);
  const [newVignette, setNewVignette] = useState<Omit<Vignette, 'id'>>({ 
    vignetteNumber: '',
    dateDebut: new Date().toISOString().split('T')[0],
    dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    priceAnnuel: 0,
    carId: 0,
    carModele: '',
    carMarque: ''
  });

  type FilterOptions = {
    carMarque: string[];
    status: string[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    carMarque: [],
    status: []
  });

  const uniqueCarMarques = [...new Set(vignettes.map(v => v.carMarque))];

  // Apply filters
  useEffect(() => {
    let result = [...vignettes];

    if (searchTerm) {
      result = result.filter(vignette => 
        vignette.vignetteNumber.toLowerCase().includes(searchTerm.toLowerCase()) || 
        vignette.carModele.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vignette.carMarque.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterOptions.carMarque.length > 0) {
      result = result.filter(vignette => 
        filterOptions.carMarque.includes(vignette.carMarque)
      );
    }

    if (filterOptions.status.length > 0) {
      const today = new Date();
      result = result.filter(vignette => {
        const expDate = new Date(vignette.dateExpiration);
        const isExpired = expDate < today;
        return filterOptions.status.includes(isExpired ? 'expired' : 'active');
      });
    }

    setFilteredVignettes(result);
  }, [vignettes, searchTerm, filterOptions]);

  // Handle car selection in add modal
  const handleCarSelect = (carId: number) => {
    const selectedCar = cars.find(car => car.id === carId);
    if (selectedCar) {
      setNewVignette({
        ...newVignette,
        carId: selectedCar.id,
        carMarque: selectedCar.marque,
        carModele: selectedCar.modele
      });
    }
  };

  // Handle car selection in edit modal
  const handleEditCarSelect = (carId: number) => {
    const selectedCar = cars.find(car => car.id === carId);
    if (selectedCar && editedVignette) {
      setEditedVignette({
        ...editedVignette,
        carId: selectedCar.id,
        carMarque: selectedCar.marque,
        carModele: selectedCar.modele
      });
    }
  };

  const openEditModal = (vignette: Vignette) => {
    setCurrentVignette(vignette);
    setEditedVignette({...vignette});
    setEditModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setVignetteToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const viewDetails = (vignette: Vignette) => {
    console.log("Vignette details:", vignette);
  };

const toggleFilter = <K extends keyof FilterOptions>(
  category: K,
  value: FilterOptions[K][number]
) => {
  setFilterOptions(prev => ({
    ...prev,
    [category]: prev[category].includes(value)
      ? prev[category].filter(v => v !== value)
      : [...prev[category], value],
  }));
};



  const clearAllFilters = () => {
    setFilterOptions({
      carMarque: [],
      status: []
    });
    setSearchTerm('');
  };

  const isVignetteExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
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
                placeholder="Rechercher des vignettes..."
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

          <div className="space-y-3">
            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Marque de voiture</h4>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {uniqueCarMarques.map(marque => (
                  <div key={marque} className="flex items-center">
                    <input
                      id={`marque-${marque}`}
                      type="checkbox"
                      checked={filterOptions.carMarque.includes(marque)}
                      onChange={() => toggleFilter('carMarque', marque)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`marque-${marque}`} className="ml-2 text-sm text-gray-700">
                      {marque}
                    </label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Statut</h4>
              <div className="space-y-1">
                {['active', 'expired'].map(status => (
                  <div key={status} className="flex items-center">
                    <input
                      id={`status-${status}`}
                      type="checkbox"
                      checked={filterOptions.status.includes(status as 'active' | 'expired')}
                      onChange={() => toggleFilter('status', status)}
                      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                    />
                    <label htmlFor={`status-${status}`} className="ml-2 text-sm text-gray-700 capitalize">
                      {status}
                    </label>
                  </div>
                ))}
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
            <h1 className="text-xl font-bold text-indigo-600">Vignettes</h1>
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
              <h2 className="font-semibold">Vignettes</h2>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-4">
                  {filteredVignettes.length} {filteredVignettes.length === 1 ? 'vignette trouvée' : 'vignettes trouvées'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Vignette</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Véhicule</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/annee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVignettes.map(vignette => (
                    <tr key={vignette.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{vignette.vignetteNumber}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">{vignette.carMarque} {vignette.carModele}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>Début: {new Date(vignette.dateDebut).toLocaleDateString()}</div>
                        <div>Fin: {new Date(vignette.dateExpiration).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {vignette.priceAnnuel} €
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          isVignetteExpired(vignette.dateExpiration) 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isVignetteExpired(vignette.dateExpiration) ? 'Expirée' : 'Active'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => openEditModal(vignette)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => confirmDelete(vignette.id)}
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

      {/* Add Vignette Modal */}
{addModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Ajouter une nouvelle vignette</h3>
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
          <label className="block text-sm font-medium text-gray-700">N° Vignette</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.vignetteNumber ? 'border-red-500' : ''
            }`}
            value={newVignette.vignetteNumber}
            onChange={(e) => setNewVignette({...newVignette, vignetteNumber: e.target.value.toUpperCase()})}
          />
          {formErrors.vignetteNumber && (
            <p className="mt-1 text-sm text-red-600">{formErrors.vignetteNumber}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Sélectionner une voiture</label>
          <select
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.carId ? 'border-red-500' : ''
            }`}
            value={newVignette.carId}
            onChange={(e) => handleCarSelect(Number(e.target.value))}
          >
            <option value={0}>Sélectionner une voiture</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.marque} {car.modele}
              </option>
            ))}
          </select>
          {formErrors.carId && (
            <p className="mt-1 text-sm text-red-600">{formErrors.carId}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Début</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateDebut ? 'border-red-500' : ''
            }`}
            value={newVignette.dateDebut}
            onChange={(e) => setNewVignette({...newVignette, dateDebut: e.target.value})}
          />
          {formErrors.dateDebut && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateDebut}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Expiration</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateExpiration ? 'border-red-500' : ''
            }`}
            value={newVignette.dateExpiration}
            onChange={(e) => setNewVignette({...newVignette, dateExpiration: e.target.value})}
          />
          {formErrors.dateExpiration && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateExpiration}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix/Annee</label>
          <input
            type="number"
            step="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.priceAnnuel ? 'border-red-500' : ''
            }`}
            value={newVignette.priceAnnuel}
            onChange={(e) => setNewVignette({...newVignette, priceAnnuel: Number(e.target.value)})}
          />
          {formErrors.priceAnnuel && (
            <p className="mt-1 text-sm text-red-600">{formErrors.priceAnnuel}</p>
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
{editModalOpen && editedVignette && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Modifier la vignette</h3>
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
          <label className="block text-sm font-medium text-gray-700">N° Vignette</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.vignetteNumber ? 'border-red-500' : ''
            }`}
            value={editedVignette.vignetteNumber}
            onChange={(e) => setEditedVignette({...editedVignette, vignetteNumber: e.target.value.toUpperCase()})}
          />
          {formErrors.vignetteNumber && (
            <p className="mt-1 text-sm text-red-600">{formErrors.vignetteNumber}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Sélectionner une voiture</label>
          <select
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.carId ? 'border-red-500' : ''
            }`}
            value={editedVignette.carId}
            onChange={(e) => handleEditCarSelect(Number(e.target.value))}
          >
            <option value={0}>Sélectionner une voiture</option>
            {cars.map(car => (
              <option key={car.id} value={car.id}>
                {car.marque} {car.modele}
              </option>
            ))}
          </select>
          {formErrors.carId && (
            <p className="mt-1 text-sm text-red-600">{formErrors.carId}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Début</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateDebut ? 'border-red-500' : ''
            }`}
            value={editedVignette.dateDebut}
            onChange={(e) => setEditedVignette({...editedVignette, dateDebut: e.target.value})}
          />
          {formErrors.dateDebut && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateDebut}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date Expiration</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateExpiration ? 'border-red-500' : ''
            }`}
            value={editedVignette.dateExpiration}
            onChange={(e) => setEditedVignette({...editedVignette, dateExpiration: e.target.value})}
          />
          {formErrors.dateExpiration && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateExpiration}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix/Annee</label>
          <input
            type="number"
            step="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.priceAnnuel ? 'border-red-500' : ''
            }`}
            value={editedVignette.priceAnnuel}
            onChange={(e) => setEditedVignette({...editedVignette, priceAnnuel: Number(e.target.value)})}
          />
          {formErrors.priceAnnuel && (
            <p className="mt-1 text-sm text-red-600">{formErrors.priceAnnuel}</p>
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
            
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer cette vignette ? Cette action est irréversible.</p>
            
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

export default VignettesPage;