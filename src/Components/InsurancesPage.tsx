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
  CheckCircleIcon,
} from '@heroicons/react/24/outline';

type InsuranceVM = {
  id: number;
  numeroContrat: string;
  idCompagnie: number;
  compagnie: string;
  pricePerYear: number;
  dateDebut: string;
  dateExpiration: string;
  idCar: number;
  carModele: string;
  carMarque: string;
  status?: 'active' | 'expired';
};

type InsuranceForm = {
  id?: number;
  numeroContrat: string;
  idCompagnie: number;
  pricePerYear: number;
  dateDebut: string;
  dateExpiration: string;
  carId: number;
};

type Company = { id: number; name: string; };
type Car = { id: number; marque: string; modele: string; };
const apiUrl = import.meta.env.VITE_API_URL;

const API_BASE_URL = `${apiUrl}/api/insurance`;

// Helper functions
const calculateStatus = (dateExpiration: string): 'active' | 'expired' => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const expDate = new Date(dateExpiration);
  expDate.setHours(0, 0, 0, 0);
  return expDate >= today ? 'active' : 'expired';
};

const fetchData = async (url: string, errorMsg: string) => {
  const response = await fetch(url);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(errorMsg);
  }
  return response.json();
};

const fetchInsurances = (): Promise<InsuranceVM[]> => 
  fetchData(API_BASE_URL, 'Failed to fetch insurances').then(data => 
    data.map((insurance: any) => ({
      ...insurance,
      status: calculateStatus(insurance.dateExpiration),
      dateDebut: insurance.dateDebut,
      dateExpiration: insurance.dateExpiration
    }))
  );

const fetchCompanies = (): Promise<Company[]> => 
  fetchData(`${apiUrl}/api/compagnie`, 'Failed to fetch companies');

const fetchCars = (): Promise<Car[]> => 
  fetchData(`${apiUrl}/api/car/CarsList`, 'Failed to fetch cars');

const deleteInsurance = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(response.status === 404 ? 'Insurance not found' : 'Failed to delete insurance');
};

// Main Component
const InsurancesPage = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [currentInsurance, setCurrentInsurance] = useState<InsuranceVM | null>(null);
  const [insuranceToDelete, setInsuranceToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const [insurances, setInsurances] = useState<InsuranceVM[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [cars, setCars] = useState<Car[]>([]);

  const [filterOptions, setFilterOptions] = useState({
    compagnie: [] as string[],
    status: [] as ('active' | 'expired')[],
    carMarque: [] as string[],
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filteredInsurances, setFilteredInsurances] = useState<InsuranceVM[]>([]);
  const [editedInsurance, setEditedInsurance] = useState<InsuranceForm | null>(null);
  const [newInsurance, setNewInsurance] = useState<InsuranceForm>({
    numeroContrat: '',
    idCompagnie: 0,
    pricePerYear: 0,
    dateDebut: new Date().toISOString().split('T')[0],
    dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    carId: 0
  });

  // Show success message (same as ClientsPage)
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message (same as ClientsPage)
  const showError = (message: string) => {
    setOperationError(message);
    setTimeout(() => setOperationError(null), 5000);
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const [insuranceData, companiesData, carsData] = await Promise.all([
          fetchInsurances(),
          fetchCompanies(),
          fetchCars()
        ]);
        
        setInsurances(insuranceData);
        setCompanies(companiesData);
        setCars(carsData);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load data';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  useEffect(() => {
    let result = [...insurances];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(insurance => 
        insurance.numeroContrat.toLowerCase().includes(term) || 
        insurance.compagnie.toLowerCase().includes(term) ||
        insurance.carMarque.toLowerCase().includes(term) ||
        insurance.carModele.toLowerCase().includes(term)
      );
    }

    if (filterOptions.compagnie.length > 0) {
      result = result.filter(insurance => 
        filterOptions.compagnie.includes(insurance.compagnie)
      );
    }

    if (filterOptions.status.length > 0) {
      result = result.filter(insurance => 
        insurance.status && filterOptions.status.includes(insurance.status)
      );
    }

    if (filterOptions.carMarque.length > 0) {
      result = result.filter(insurance => 
        filterOptions.carMarque.includes(insurance.carMarque)
      );
    }

    setFilteredInsurances(result);
  }, [insurances, searchTerm, filterOptions]);

  const compagnieNames = [...new Set(insurances.map(i => i.compagnie))];
  const uniqueStatuses = ['active', 'expired'] as const;
  const carMarques = [...new Set(insurances.map(i => i.carMarque))];

  const toggleFilter = (category: keyof typeof filterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].includes(value as never) 
        ? prev[category].filter(v => v !== value) 
        : [...prev[category], value as never]
    }));
  };

  const clearAllFilters = () => {
    setFilterOptions({
      compagnie: [],
      status: [],
      carMarque: []
    });
    setSearchTerm('');
  };

  const removeFilter = (category: keyof typeof filterOptions, value: string) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  const openEditModal = (insurance: InsuranceVM) => {
    setCurrentInsurance(insurance);
    setEditedInsurance({
      id: insurance.id,
      numeroContrat: insurance.numeroContrat,
      idCompagnie: insurance.idCompagnie,
      pricePerYear: insurance.pricePerYear,
      dateDebut: insurance.dateDebut,
      dateExpiration: insurance.dateExpiration,
      carId: insurance.idCar
    });
    setEditModalOpen(true);
    setOperationError(null);
    setFormErrors({});
  };

  const confirmDelete = (id: number) => {
    setInsuranceToDelete(id);
    setDeleteConfirmOpen(true);
    setOperationError(null);
  };

  const handleAddInsurance = async () => {
    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
    try {
      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newInsurance),
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
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      
      // Refresh the data
      const [insuranceData] = await Promise.all([fetchInsurances()]);
      setInsurances(insuranceData);
      
      setAddModalOpen(false);
      setNewInsurance({
        numeroContrat: '',
        idCompagnie: 0,
        pricePerYear: 0,
        dateDebut: new Date().toISOString().split('T')[0],
        dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
        carId: 0
      });
      
      showSuccess("Assurance ajoutée avec succès!");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add insurance';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!editedInsurance) return;

    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
    try {
      const response = await fetch(`${API_BASE_URL}/${editedInsurance.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editedInsurance),
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
          return;
        }
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // Refresh the data
      const [insuranceData] = await Promise.all([fetchInsurances()]);
      setInsurances(insuranceData);
      
      setEditModalOpen(false);
      showSuccess("Assurance modifiée avec succès!");
    } catch (err: any) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update insurance';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (insuranceToDelete !== null) {
      setIsLoading(true);
      setOperationError(null);
      
      try {
        await deleteInsurance(insuranceToDelete);
        
        // Refresh the data
        const [insuranceData] = await Promise.all([fetchInsurances()]);
        setInsurances(insuranceData);
        
        setDeleteConfirmOpen(false);
        showSuccess("Assurance supprimée avec succès!");
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to delete insurance';
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const StatusBadge = ({ status }: { status: string }) => {
    const getStatusColor = () => {
      switch (status) {
        case 'active': return 'bg-green-100 text-green-800';
        case 'expired': return 'bg-red-100 text-red-800';
        default: return 'bg-gray-100 text-gray-800';
      }
    };
    
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor()}`}>
        {status === 'active' ? 'Actif' : 'Expiré'}
      </span>
    );
  };

  if (isLoading && insurances.length === 0) {
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
          {/* Notification messages - Inside main content (same as ClientsPage) */}
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
                {(searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0) && (
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
                      placeholder="Rechercher par contrat, compagnie, marque..."
                      className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
                
                {/* Compagnie Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Compagnie</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {compagnieNames.map(compagnie => (
                      <div key={compagnie} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`compagnie-${compagnie}`}
                          checked={filterOptions.compagnie.includes(compagnie)}
                          onChange={() => toggleFilter('compagnie', compagnie)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`compagnie-${compagnie}`} className="ml-2 text-sm text-slate-700">
                          {compagnie}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                  <div className="space-y-2">
                    {uniqueStatuses.map(status => (
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

                {/* Car Marque Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Marque de voiture</label>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {carMarques.map(marque => (
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
              </div>
            )}
            
            {/* Active filters display */}
            {(searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0) && (
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
                  
                  {filterOptions.compagnie.map(compagnie => (
                    <span key={compagnie} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Compagnie: {compagnie}
                      <button
                        onClick={() => removeFilter('compagnie', compagnie)}
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
                  
                  {filterOptions.carMarque.map(marque => (
                    <span key={marque} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-orange-100 text-orange-800">
                      Marque: {marque}
                      <button
                        onClick={() => removeFilter('carMarque', marque)}
                        className="ml-1 text-orange-600 hover:text-orange-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </motion.div>

          {/* Insurance Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="font-semibold text-slate-800 text-lg">Contrats d'assurance</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-slate-500">
                  {filteredInsurances.length} {filteredInsurances.length === 1 ? 'contrat trouvé' : 'contrats trouvés'}
                  {(searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0) && 
                    ` (${insurances.length} au total)`}
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
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">N° Contrat</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Compagnie</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Véhicule</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Prix/An</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredInsurances.length > 0 ? (
                      filteredInsurances.map(insurance => (
                        <tr key={insurance.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">{insurance.numeroContrat}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{insurance.compagnie}</td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {insurance.carMarque} {insurance.carModele}
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            {insurance.pricePerYear.toFixed(2)} €
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            <div>Début: {new Date(insurance.dateDebut).toLocaleDateString()}</div>
                            <div>Expiration: {new Date(insurance.dateExpiration).toLocaleDateString()}</div>
                          </td>
                          <td className="px-4 py-4">
                            <StatusBadge status={insurance.status || 'active'} />
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEditModal(insurance)}
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </motion.button>

                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => confirmDelete(insurance.id)}
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
                        <td colSpan={7} className="px-6 py-8 text-center text-slate-500">
                          <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                          <p className="text-lg font-medium">Aucun contrat trouvé</p>
                          <p className="text-sm mt-1">
                            {searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0
                              ? "Essayez de modifier vos filtres ou votre recherche."
                              : "Commencez par ajouter un nouveau contrat."}
                          </p>
                          <div className="mt-6">
                            <button
                              onClick={() => {
                                if (searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0) {
                                  clearAllFilters();
                                } else {
                                  setAddModalOpen(true);
                                }
                              }}
                              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                            >
                              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                              {searchTerm || filterOptions.compagnie.length > 0 || filterOptions.status.length > 0 || filterOptions.carMarque.length > 0
                                ? "Effacer les filtres"
                                : "Ajouter un contrat"}
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

      {/* Add Insurance Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter un nouveau contrat</h3>
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
              {/* Numéro Contrat field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">N° Contrat *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.numeroContrat ? 'border-red-500' : ''
                  }`}
                  value={newInsurance.numeroContrat}
                  onChange={(e) => setNewInsurance({...newInsurance, numeroContrat: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.numeroContrat && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.numeroContrat.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Compagnie field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Compagnie *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.idCompagnie ? 'border-red-500' : ''
                  }`}
                  value={newInsurance.idCompagnie}
                  onChange={(e) => setNewInsurance({...newInsurance, idCompagnie: parseInt(e.target.value)})}
                  required
                  disabled={isLoading}
                >
                  <option value={0}>Sélectionner une compagnie</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {formErrors.idCompagnie && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.idCompagnie.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Véhicule field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Véhicule *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.carId ? 'border-red-500' : ''
                  }`}
                  value={newInsurance.carId}
                  onChange={(e) => setNewInsurance({...newInsurance, carId: parseInt(e.target.value)})}
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
              
              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par an (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.pricePerYear ? 'border-red-500' : ''
                  }`}
                  value={newInsurance.pricePerYear}
                  onChange={(e) => setNewInsurance({...newInsurance, pricePerYear: parseFloat(e.target.value) || 0})}
                  required
                  disabled={isLoading}
                />
                {formErrors.pricePerYear && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.pricePerYear.map((error, index) => (
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
                  value={newInsurance.dateDebut}
                  onChange={(e) => setNewInsurance({...newInsurance, dateDebut: e.target.value})}
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
                  value={newInsurance.dateExpiration}
                  onChange={(e) => setNewInsurance({...newInsurance, dateExpiration: e.target.value})}
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
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['numeroContrat', 'idCompagnie', 'carId', 'pricePerYear', 'dateDebut', 'dateExpiration'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['numeroContrat', 'idCompagnie', 'carId', 'pricePerYear', 'dateDebut', 'dateExpiration'].includes(key))
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
                onClick={handleAddInsurance}
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

      {/* Edit Insurance Modal */}
      {editModalOpen && currentInsurance && editedInsurance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier le contrat</h3>
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
              {/* Numéro Contrat field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">N° Contrat *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.numeroContrat ? 'border-red-500' : ''
                  }`}
                  value={editedInsurance.numeroContrat}
                  onChange={(e) => setEditedInsurance({...editedInsurance, numeroContrat: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.numeroContrat && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.numeroContrat.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Compagnie field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Compagnie *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.idCompagnie ? 'border-red-500' : ''
                  }`}
                  value={editedInsurance.idCompagnie}
                  onChange={(e) => setEditedInsurance({...editedInsurance, idCompagnie: parseInt(e.target.value)})}
                  disabled={isLoading}
                >
                  <option value={0}>Sélectionner une compagnie</option>
                  {companies.map(company => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
                {formErrors.idCompagnie && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.idCompagnie.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Véhicule field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Véhicule *</label>
                <select
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.carId ? 'border-red-500' : ''
                  }`}
                  value={editedInsurance.carId}
                  onChange={(e) => setEditedInsurance({...editedInsurance, carId: parseInt(e.target.value)})}
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
              
              {/* Price field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Prix par an (€) *</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.pricePerYear ? 'border-red-500' : ''
                  }`}
                  value={editedInsurance.pricePerYear}
                  onChange={(e) => setEditedInsurance({...editedInsurance, pricePerYear: parseFloat(e.target.value) || 0})}
                  disabled={isLoading}
                />
                {formErrors.pricePerYear && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.pricePerYear.map((error, index) => (
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
                  value={editedInsurance.dateDebut}
                  onChange={(e) => setEditedInsurance({...editedInsurance, dateDebut: e.target.value})}
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
                  value={editedInsurance.dateExpiration}
                  onChange={(e) => setEditedInsurance({...editedInsurance, dateExpiration: e.target.value})}
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
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['numeroContrat', 'idCompagnie', 'carId', 'pricePerYear', 'dateDebut', 'dateExpiration'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['numeroContrat', 'idCompagnie', 'carId', 'pricePerYear', 'dateDebut', 'dateExpiration'].includes(key))
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
            
            {insuranceToDelete && (
              <>
                {/* Show which insurance is being deleted */}
                <div className="mb-4 p-3 bg-slate-50 rounded-md">
                  <p className="font-medium text-slate-900">
                    Contrat à supprimer: 
                  </p>
                  {insurances.find(insurance => insurance.id === insuranceToDelete) && (
                    <p className="text-sm text-slate-600">
                      {insurances.find(insurance => insurance.id === insuranceToDelete)?.numeroContrat}
                    </p>
                  )}
                </div>
                
                <p className="mb-6 text-slate-700">
                  Êtes-vous sûr de vouloir supprimer ce contrat d'assurance ? Cette action est irréversible.
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

export default InsurancesPage;