import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';

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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentVignette, setCurrentVignette] = useState<Vignette | null>(null);
  const [vignetteToDelete, setVignetteToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const apiUrl = import.meta.env.VITE_API_URL;

  const API_BASE_URL = `${apiUrl}/api/vignette`;
  const CARS_API_URL = `${apiUrl}/api/car/CarsList`;
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [cars, setCars] = useState<CarSelect[]>([]);

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message
  const showError = (message: string) => {
    setOperationError(message);
    setTimeout(() => setOperationError(null), 5000);
  };

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
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch vignettes';
        setError(errorMessage);
        showError(errorMessage);
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
      }
    };

    fetchCars();
  }, []);

  const handleAdd = async () => {
    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
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
        let errorMessage = 'Failed to add vignette';

        if (response.status === 400) {
          const errorData = await response.json();
          const errors: Record<string, string[]> = {};
          
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                const cleanKey = key.includes('.') ? key.split('.').pop()! : key;
                errors[cleanKey] = value as string[];
              }
            }
          } else {
            for (const [key, value] of Object.entries(errorData)) {
              if (Array.isArray(value)) {
                errors[key] = value as string[];
              } else if (typeof value === 'string') {
                errors[key] = [value];
              }
            }
          }
          
          setFormErrors(errors);
          throw new Error("Form validation failed");
          errorMessage=errorData.message || 'Validation failed';
        }
        throw new Error(errorMessage);
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

      showSuccess("Vignette ajoutée avec succès!");
    } catch (err) {
      // Revert to previous state on error
      setVignettes(previousVignettes);
      // Don't set general error for form validation errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to add vignette';
      if (!errorMessage.includes("Form validation failed")) {
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedVignette) return;

    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});

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
          const errors: Record<string, string[]> = {};
          
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                const cleanKey = key.includes('.') ? key.split('.').pop()! : key;
                errors[cleanKey] = value as string[];
              }
            }
          } else {
            for (const [key, value] of Object.entries(errorData)) {
              if (Array.isArray(value)) {
                errors[key] = value as string[];
              } else if (typeof value === 'string') {
                errors[key] = [value];
              }
            }
          }
          
          setFormErrors(errors);
          throw new Error("Form validation failed");
        }
        
        if (response.status === 404) {
          throw new Error("Vignette not found");
        }
        
        throw new Error('Failed to update vignette');
      }

      // Success - no need to refresh, we already updated optimistically
      setEditModalOpen(false);
      showSuccess("Vignette modifiée avec succès!");
    } catch (err) {
      // Revert on error
      setVignettes(previousVignettes);
      // Don't set general error for form validation errors
      const errorMessage = err instanceof Error ? err.message : 'Failed to update vignette';
      if (!errorMessage.includes("Form validation failed")) {
        showError(errorMessage);
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Delete vignette
  const handleDelete = async () => {
    if (!vignetteToDelete) return;

    setIsLoading(true);
    setOperationError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/${vignetteToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setVignettes(vignettes.filter(v => v.id !== vignetteToDelete));
      setDeleteConfirmOpen(false);
      showSuccess("Vignette supprimée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete vignette';
      showError(errorMessage);
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
    setOperationError(null);
    setFormErrors({});
  };

  const confirmDelete = (id: number) => {
    setVignetteToDelete(id);
    setDeleteConfirmOpen(true);
    setOperationError(null);
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

  const removeFilter = (category: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  const isVignetteExpired = (expirationDate: string) => {
    return new Date(expirationDate) < new Date();
  };

  if (isLoading && vignettes.length === 0) {
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
      {/* Notification messages - Inside main content */}
      <AnimatePresence>
        <div className="mb-6 space-y-4">
          {operationError && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
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
              exit={{ opacity: 0, y: 10 }}
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
            {(searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0) && (
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
                  placeholder="Rechercher par numéro, marque, modèle..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
            
            {/* Car Marque Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Marque de voiture</label>
              <div className="space-y-2 max-h-40 overflow-y-auto">
                {uniqueCarMarques.map(marque => (
                  <div key={marque} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`marque-${marque}`}
                      checked={filterOptions.carMarque.includes(marque)}
                      onChange={() => toggleFilter('carMarque', marque)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                    />
                    <label htmlFor={`marque-${marque}`} className="ml-2 text-sm text-slate-700">
                      {marque}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
              <div className="space-y-2">
                {['active', 'expired'].map(status => (
                  <div key={status} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`status-${status}`}
                      checked={filterOptions.status.includes(status)}
                      onChange={() => toggleFilter('status', status)}
                      className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                    />
                    <label htmlFor={`status-${status}`} className="ml-2 text-sm text-slate-700 capitalize">
                      {status === 'active' ? 'Actif' : 'Expiré'}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Active filters display */}
        {(searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0) && (
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
              
              {filterOptions.carMarque.map(marque => (
                <span key={marque} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Marque: {marque}
                  <button
                    onClick={() => removeFilter('carMarque', marque)}
                    className="ml-1 text-blue-600 hover:text-blue-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
              
              {filterOptions.status.map(status => (
                <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                  Statut: {status === 'active' ? 'Actif' : 'Expiré'}
                  <button
                    onClick={() => removeFilter('status', status)}
                    className="ml-1 text-purple-600 hover:text-purple-800"
                  >
                    <XMarkIcon className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Vignettes Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-slate-800 text-lg">Vignettes</h2>
          <div className="flex items-center space-x-3">
            <p className="text-sm text-slate-500">
              {filteredVignettes.length} {filteredVignettes.length === 1 ? 'vignette trouvée' : 'vignettes trouvées'}
              {(searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0) && 
                ` (${vignettes.length} au total)`}
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAddModalOpen(true);
                setOperationError(null);
                setFormErrors({});
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
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-极速600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">N° Vignette</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Véhicule</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-极速500 uppercase tracking-wider">Dates</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prix/An</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredVignettes.length > 0 ? (
                  filteredVignettes.map(vignette => (
                    <tr key={vignette.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{vignette.vignetteNumber}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {vignette.carMarque} {vignette.carModele}
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        <div>Début: {new Date(vignette.dateDebut).toLocaleDateString()}</div>
                        <div>Fin: {new Date(vignette.dateExpiration).toLocaleDateString()}</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-slate-500">
                        {vignette.priceAnnuel.toFixed(2)} €
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                          isVignetteExpired(vignette.dateExpiration) 
                            ? 'bg-red-100 text-red-800' 
                            : 'bg-green-100 text-green-800'
                        }`}>
                          {isVignetteExpired(vignette.dateExpiration) ? 'Expirée' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="极速flex justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(vignette)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => confirmDelete(vignette.id)}
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
                      <p className="text-lg font-medium">Aucune vignette trouvée</p>
                      <p className="text-sm mt-1">
                        {searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0
                          ? "Essayez de modifier vos filtres ou votre recherche."
                          : "Commencez par ajouter une nouvelle vignette."}
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            if (searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0) {
                              clearAllFilters();
                            } else {
                              setAddModalOpen(true);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                          {searchTerm || filterOptions.carMarque.length > 0 || filterOptions.status.length > 0
                            ? "Effacer les filtres"
                            : "Ajouter une vignette"}
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

      {/* Add Vignette Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter une nouvelle vignette</h3>
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
              {/* Vignette Number field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">N° Vignette *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.vignetteNumber ? 'border-red-500' : ''
                  }`}
                  value={newVignette.vignetteNumber}
                  onChange={(e) => setNewVignette({...newVignette, vignetteNumber: e.target.value.toUpperCase()})}
                  required
                  disabled={isLoading}
                />
                {formErrors.vignetteNumber && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.vignetteNumber.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Car selection field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Véhicule *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.carId ? 'border-red-500' : ''
                  }`}
                  value={newVignette.carId}
                  onChange={(e) => handleCarSelect(Number(e.target.value))}
                  required
                  disabled={isLoading}
                >
                  <option value={0}>Sélectionner un véhicule</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.marque} {car.modele}
                    </option>
                  ))}
                </select>
                {formErrors.carId && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.carId.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Date Début field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de début *</label>
                <input
                  type="date"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.dateDebut ? 'border-red-500' : ''
                  }`}
                  value={newVignette.dateDebut}
                  onChange={(e) => setNewVignette({...newVignette, dateDebut: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.dateDebut && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.dateDebut.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Date Expiration field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Date d'expiration *</label>
                <input
                  type="date"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.dateExpiration ? 'border-red-500' : ''
                  }`}
                  value={newVignette.dateExpiration}
                  onChange={(e) => setNewVignette({...newVignette, dateExpiration: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.dateExpiration && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.dateExpiration.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par an (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.priceAnnuel ? 'border-red-500' : ''
                  }`}
                  value={newVignette.priceAnnuel}
                  onChange={(e) => setNewVignette({...newVignette, priceAnnuel: Number(e.target.value)})}
                  required
                  disabled={isLoading}
                />
                {formErrors.priceAnnuel && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.priceAnnuel.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['vignetteNumber', 'carId', 'dateDebut', 'dateExpiration', 'priceAnnuel'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['vignetteNumber', 'carId', 'dateDebut', 'dateExpiration', 'priceAnnuel'].includes(key))
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
                  setAddModalOpen(false);
                  setFormErrors({});
                }}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                disabled={isLoading}
              >
                Annuler
              </button>
              <button
                onClick={handleAdd}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 transition-all flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-极速4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 极速0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Ajout...
                  </>
                ) : 'Ajouter'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Vignette Modal */}
      {editModalOpen && editedVignette && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier la vignette</h3>
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
              {/* Vignette Number field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">N° Vignette *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.vignetteNumber ? 'border-red-500' : ''
                  }`}
                  value={editedVignette.vignetteNumber}
                  onChange={(e) => setEditedVignette({...editedVignette, vignetteNumber: e.target.value.toUpperCase()})}
                  disabled={isLoading}
                />
                {formErrors.vignetteNumber && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.vignetteNumber.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Car selection field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Véhicule *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.carId ? 'border-red-500' : ''
                  }`}
                  value={editedVignette.carId}
                  onChange={(e) => handleEditCarSelect(Number(e.target.value))}
                  disabled={isLoading}
                >
                  <option value={0}>Sélectionner un véhicule</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.marque} {car.modele}
                    </option>
                  ))}
                </select>
                {formErrors.carId && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.carId.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Date Début field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de début *</label>
                <input
                  type="date"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.dateDebut ? 'border-red-500' : ''
                  }`}
                  value={editedVignette.dateDebut}
                  onChange={(e) => setEditedVignette({...editedVignette, dateDebut: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.dateDebut && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.dateDebut.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Date Expiration field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Date d'expiration *</label>
                <input
                  type="date"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.dateExpiration ? 'border-red-500' : ''
                  }`}
                  value={editedVignette.dateExpiration}
                  onChange={(e) => setEditedVignette({...editedVignette, dateExpiration: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.dateExpiration && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.dateExpiration.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par an (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.priceAnnuel ? 'border-red-500' : ''
                  }`}
                  value={editedVignette.priceAnnuel}
                  onChange={(e) => setEditedVignette({...editedVignette, priceAnnuel: Number(e.target.value)})}
                  disabled={isLoading}
                />
                {formErrors.priceAnnuel && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.priceAnnuel.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['vignetteNumber', 'carId', 'dateDebut', 'dateExpiration', 'priceAnnuel'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['vignetteNumber', 'carId', 'dateDebut', 'dateExpiration', 'priceAnnuel'].includes(key))
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
                    <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 4">
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
            
            {vignetteToDelete && (
              <>
                {/* Show which vignette is being deleted */}
                <div className="mb-4 p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">
                    Vignette à supprimer: 
                  </p>
                  {vignettes.find(vignette => vignette.id === vignetteToDelete) && (
                    <p className="text-sm text-slate-600">
                      {vignettes.find(vignette => vignette.id === vignetteToDelete)?.vignetteNumber}
                    </p>
                  )}
                </div>
                
                <p className="mb-6 text-slate-700">
                  Êtes-vous sûr de vouloir supprimer cette vignette ? Cette action est irréversible.
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
    </div>
  );
};

export default VignettesPage;