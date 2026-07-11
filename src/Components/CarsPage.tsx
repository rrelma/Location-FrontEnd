import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/auth';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  PlusIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';

type Car = {
  id: number;
  pricePerDay: number;
  disponible: boolean;
  howManyDaysLeftinReservation: number | null;
  marque: string;
  modele: string;
  dateExpirationInsurance: string | null;
  dateExpirationVignette: string | null;
};

type FilterOptions = {
  marque: string[];
  disponible: string[];
};

const CarsPage: React.FC = () => {
const apiUrl = import.meta.env.VITE_API_URL;

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [carToDelete, setCarToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [cars, setCars] = useState<Car[]>([]);
  const [filteredCars, setFilteredCars] = useState<Car[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedCar, setEditedCar] = useState<Car | null>(null);
  const [newCar, setNewCar] = useState<Omit<Car, 'id'>>({ 
    pricePerDay: 0,
    marque: "",
    modele: "",
    disponible: true,
    howManyDaysLeftinReservation: null,
    dateExpirationInsurance: null,
    dateExpirationVignette: null
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    marque: [],
    disponible: []
  });

  // Show success message (same as DashboardPage)
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message (same as DashboardPage)
  const showError = (message: string) => {
    setOperationError(message);
    setTimeout(() => setOperationError(null), 5000);
  };

  // Fetch cars on component mount
  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`${apiUrl}/api/car`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      const mapped = data.map((c: Car) => ({
        id: c.id,
        pricePerDay: c.pricePerDay,
        disponible: c.disponible,
        howManyDaysLeftinReservation: c.howManyDaysLeftinReservation,
        marque: c.marque,
        modele: c.modele,
        dateExpirationInsurance: c.dateExpirationInsurance,
        dateExpirationVignette: c.dateExpirationVignette
      }));

      setCars(mapped);
      setFilteredCars(mapped);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch cars';
      setError(errorMessage);
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters whenever cars, searchTerm or filterOptions change
  useEffect(() => {
    let result = [...cars];

    // Apply search filter
    if (searchTerm) {
      result = result.filter(car => 
        car.marque.toLowerCase().includes(searchTerm.toLowerCase()) || 
        car.modele.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply marque filter
    if (filterOptions.marque.length > 0) {
      result = result.filter(car => 
        filterOptions.marque.includes(car.marque)
      );
    }

    // Apply disponibilité filter
    if (filterOptions.disponible.length > 0) {
      // Convert boolean values to strings for comparison
      const disponibleValues = filterOptions.disponible.map(val => val.toString());
      result = result.filter(car => 
        disponibleValues.includes(car.disponible.toString())
      );
    }

    setFilteredCars(result);
  }, [cars, searchTerm, filterOptions]);

  // Open edit modal and set current car
  const openEditModal = (car: Car) => {
    setCurrentCar(car);
    setEditedCar({...car});
    setEditModalOpen(true);
    setOperationError(null);
  };

  const handleAddCar = async () => {
    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});

    try {
      const response = await apiFetch(`${apiUrl}/api/car`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pricePerDay: newCar.pricePerDay,
          marque: newCar.marque,
          modele: newCar.modele,
        })
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          const errors: Record<string, string[]> = {};
          
          // Handle ASP.NET Core ModelState error format
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                // Remove property path prefix if present (e.g., "car.marque" becomes "marque")
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

      // Refresh the car list
      await fetchCars();
      setAddModalOpen(false);
      setNewCar({
        pricePerDay: 0,
        marque: "",
        modele: "",
        disponible: true,
        howManyDaysLeftinReservation: null,
        dateExpirationInsurance: null,
        dateExpirationVignette: null
      });
      showSuccess("Voiture ajoutée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add car';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Save edited car
  const handleSave = async () => {
    if (!editedCar) return;

    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});

    try {
      const response = await apiFetch(`${apiUrl}/api/car/${editedCar.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editedCar.id,
          pricePerDay: editedCar.pricePerDay,
          marque: editedCar.marque,
          modele: editedCar.modele,
          disponible: editedCar.disponible
        })
      });

      if (!response.ok) {
        if (response.status === 400) {
          const errorData = await response.json();
          const errors: Record<string, string[]> = {};
          
          // Handle ASP.NET Core ModelState error format
          if (errorData.errors) {
            for (const [key, value] of Object.entries(errorData.errors)) {
              if (Array.isArray(value)) {
                // Remove property path prefix if present (e.g., "car.marque" becomes "marque")
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

      // Refresh the car list
      await fetchCars();
      setEditModalOpen(false);
      showSuccess("Voiture modifiée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update car';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!carToDelete) return;

    setIsLoading(true);
    setOperationError(null);

    try {
      const response = await apiFetch(`${apiUrl}/api/car/${carToDelete}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      // Refresh the car list
      await fetchCars();
      setDeleteConfirmOpen(false);
      showSuccess("Voiture supprimée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete car';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setCarToDelete(null);
    }
  };

  // Confirm delete
  const confirmDelete = (id: number) => {
    setCarToDelete(id);
    setDeleteConfirmOpen(true);
    setOperationError(null);
  };

  const uniqueMarques = [...new Set(cars.map(car => car.marque))];

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
      marque: [],
      disponible: []
    });
    setSearchTerm('');
  };

  const removeFilter = (category: keyof FilterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  // Function to check if a date is expired or expiring soon
  const getDateStatus = (dateString: string | null) => {
    if (!dateString) return { status: 'unknown', text: 'N/A' };
    
    const today = new Date();
    const expirationDate = new Date(dateString);
    const diffTime = expirationDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
      return { status: 'expired', text: 'Expiré' };
    } else if (diffDays <= 30) {
      return { status: 'expiring', text: `Expire dans ${diffDays} jours` };
    } else {
      return { status: 'valid', text: 'Valide' };
    }
  };

  if (isLoading && cars.length === 0) {
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
          {/* Notification messages - Inside main content (same as DashboardPage) */}
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

          {/* Filters Section - Same style as DashboardPage */}
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
                {(searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0) && (
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
                      placeholder="Rechercher par marque ou modèle..."
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
                
                {/* Marque Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marque</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {uniqueMarques.map(marque => (
                      <div key={marque} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`marque-${marque}`}
                          checked={filterOptions.marque.includes(marque)}
                          onChange={() => toggleFilter('marque', marque)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`marque-${marque}`} className="ml-2 text-sm text-slate-700">
                          {marque}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Availability Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Disponibilité</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="disponible-true"
                        checked={filterOptions.disponible.includes("true")}
                        onChange={() => toggleFilter('disponible', "true")}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="disponible-true" className="ml-2 text-sm text-slate-700">
                        Disponible
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="disponible-false"
                        checked={filterOptions.disponible.includes("false")}
                        onChange={() => toggleFilter('disponible', "false")}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="disponible-false" className="ml-2 text-sm text-slate-700">
                        Non disponible
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Active filters display */}
            {(searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0) && (
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
                  
                  {filterOptions.marque.map(marque => (
                    <span key={marque} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Marque: {marque}
                      <button
                        onClick={() => removeFilter('marque', marque)}
                        className="ml-1 text-blue-600 hover:text-blue-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  
                  {filterOptions.disponible.map(status => (
                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Statut: {status === 'true' ? 'Disponible' : 'Non disponible'}
                      <button
                        onClick={() => removeFilter('disponible', status)}
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

          {/* Cars Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="font-semibold text-slate-800 text-lg">Inventaire des voitures</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-slate-500">
                  {filteredCars.length} {filteredCars.length === 1 ? 'voiture trouvée' : 'voitures trouvées'}
                  {(searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0) && 
                    ` (${cars.length} au total)`}
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
                    onClick={fetchCars}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Détails</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prix/jour</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Disponible</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Jours Restant</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Assurance</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vignette</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredCars.length > 0 ? (
                      filteredCars.map(car => {
                        const insuranceStatus = getDateStatus(car.dateExpirationInsurance);
                        const vignetteStatus = getDateStatus(car.dateExpirationVignette);
                        
                        return (
                          <tr key={car.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-4 py-4">
                              <div className="font-medium text-slate-900">{car.marque} {car.modele}</div>
                            </td>
                            <td className="px-4 py-4 text-sm text-slate-500">
                              ${car.pricePerDay.toFixed(2)}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${car.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {car.disponible ? 'Oui' : 'Non'}
                              </span>
                            </td>
                            <td className="px-4 py-4">
                              {car.howManyDaysLeftinReservation !== null ? (
                                car.howManyDaysLeftinReservation === -1 ? (
                                  <span className="inline-flex px-2 py-1 text-xs font-medium text-slate-500">
                                    Non louée
                                  </span>
                                ) : (
                                  <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                                    car.howManyDaysLeftinReservation < 0 
                                      ? 'bg-red-100 text-red-800' 
                                      : car.howManyDaysLeftinReservation <= 3 
                                        ? 'bg-yellow-100 text-yellow-800' 
                                        : 'bg-green-100 text-green-800'
                                  }`}>
                                    {car.howManyDaysLeftinReservation} jours
                                  </span>
                                )
                              ) : (
                                <span className="inline-flex px-2 py-1 text-xs font-medium text-slate-500">
                                  N/A
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                {insuranceStatus.status === 'expired' && (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {insuranceStatus.status === 'expiring' && (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                )}
                                <span className={`text-xs font-medium ${
                                  insuranceStatus.status === 'expired' 
                                    ? 'text-red-600' 
                                    : insuranceStatus.status === 'expiring' 
                                      ? 'text-yellow-600' 
                                      : 'text-slate-600'
                                }`}>
                                  {insuranceStatus.text}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4">
                              <div className="flex items-center">
                                {vignetteStatus.status === 'expired' && (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-red-500 mr-1" />
                                )}
                                {vignetteStatus.status === 'expiring' && (
                                  <ExclamationTriangleIcon className="h-4 w-4 text-yellow-500 mr-1" />
                                )}
                                <span className={`text-xs font-medium ${
                                  vignetteStatus.status === 'expired' 
                                    ? 'text-red-600' 
                                    : vignetteStatus.status === 'expiring' 
                                      ? 'text-yellow-600' 
                                      : 'text-slate-600'
                                }`}>
                                  {vignetteStatus.text}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <div className="flex justify-end space-x-2">
                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => openEditModal(car)}
                                  className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                  title="Modifier"
                                >
                                  <PencilIcon className="h-5 w-5" />
                                </motion.button>

                                <motion.button
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  onClick={() => confirmDelete(car.id)}
                                  className="text-red-600 hover:text-red-800 transition-colors p-1"
                                  title="Supprimer"
                                >
                                  <TrashIcon className="h-5 w-5" />
                                </motion.button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-lg font-medium">Aucune voiture trouvée</p>
                          <p className="text-sm mt-1">
                            {searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0
                              ? "Essayez de modifier vos filtres ou votre recherche."
                              : "Commencez par ajouter une nouvelle voiture."}
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => {
                                if (searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0) {
                                  clearAllFilters();
                                } else {
                                  setAddModalOpen(true);
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                              {searchTerm || filterOptions.marque.length > 0 || filterOptions.disponible.length > 0
                                ? "Effacer les filtres"
                                : "Ajouter une voiture"}
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

      {/* Add Car Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter une nouvelle voiture</h3>
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
              {/* Marque field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Marque *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.marque ? 'border-red-500' : ''
                  }`}
                  value={newCar.marque}
                  onChange={(e) => setNewCar({...newCar, marque: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.marque && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.marque.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modele field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Modèle *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.modele ? 'border-red-500' : ''
                  }`}
                  value={newCar.modele}
                  onChange={(e) => setNewCar({...newCar, modele: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.modele && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.modele.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par jour ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.pricePerDay ? 'border-red-500' : ''
                  }`}
                  value={newCar.pricePerDay}
                  onChange={(e) => setNewCar({...newCar, pricePerDay: parseFloat(e.target.value) || 0})}
                  required
                  disabled={isLoading}
                />
                {formErrors.pricePerDay && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.pricePerDay.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['marque', 'modele', 'pricePerDay'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['marque', 'modele', 'pricePerDay'].includes(key))
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
                onClick={handleAddCar}
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

      {/* Edit Car Modal */}
      {editModalOpen && editedCar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier la voiture</h3>
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
              {/* Marque field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Marque *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.marque ? 'border-red-500' : ''
                  }`}
                  value={editedCar.marque}
                  onChange={(e) => setEditedCar({...editedCar, marque: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.marque && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.marque.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Modele field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Modèle *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.modele ? 'border-red-500' : ''
                  }`}
                  value={editedCar.modele}
                  onChange={(e) => setEditedCar({...editedCar, modele: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.modele && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.modele.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par jour ($) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.pricePerDay ? 'border-red-500' : ''
                  }`}
                  value={editedCar.pricePerDay}
                  onChange={(e) => setEditedCar({...editedCar, pricePerDay: parseFloat(e.target.value) || 0})}
                  disabled={isLoading}
                />
                {formErrors.pricePerDay && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.pricePerDay.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>

              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['marque', 'modele', 'pricePerDay'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['marque', 'modele', 'pricePerDay'].includes(key))
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
            
            {carToDelete && (
              <>
                {/* Show which car is being deleted */}
                <div className="mb-4 p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">
                    Voiture à supprimer: 
                  </p>
                  {cars.find(car => car.id === carToDelete) && (
                    <p className="text-sm text-slate-600">
                      {cars.find(car => car.id === carToDelete)?.marque} {cars.find(car => car.id === carToDelete)?.modele}
                    </p>
                  )}
                </div>
                
                <p className="mb-6 text-slate-700">
                  Êtes-vous sûr de vouloir supprimer cette voiture ? Cette action est irréversible.
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

export default CarsPage;