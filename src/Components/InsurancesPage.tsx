import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  PencilIcon, 
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

type InsuranceVM = {
  id: number;
  numeroContrat: string;
  idCompagnie: number;
  compagnie: string;
  pricePerYear: number; // This should match the API's decimal type
  dateDebut: string; // This will be in YYYY-MM-DD format
  dateExpiration: string; // This will be in YYYY-MM-DD format
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

const API_BASE_URL = 'https://palmares20250909131957.azurewebsites.net/api/insurance';

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
type FilterCategory = "compagnie" | "status" | "carMarque";

const fetchInsurances = (): Promise<InsuranceVM[]> => 
  fetchData(API_BASE_URL, 'Failed to fetch insurances').then(data => 
    data.map((insurance: any) => ({
      ...insurance,
      status: calculateStatus(insurance.dateExpiration),
      // No need to split the dates anymore as they're already in YYYY-MM-DD format
      dateDebut: insurance.dateDebut,
      dateExpiration: insurance.dateExpiration
    }))
  );

const fetchCompanies = (): Promise<Company[]> => 
  fetchData('https://palmares20250909131957.azurewebsites.net/api/compagnie', 'Failed to fetch companies');

const fetchCars = (): Promise<Car[]> => 
  fetchData('https://palmares20250909131957.azurewebsites.net/api/car/CarsList', 'Failed to fetch cars');

const deleteInsurance = async (id: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${id}`, { method: 'DELETE' });
  if (!response.ok) throw new Error(response.status === 404 ? 'Insurance not found' : 'Failed to delete insurance');
};

const createInsurance = async (insurance: InsuranceForm): Promise<InsuranceVM> => {
  const response = await fetch(API_BASE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insurance),
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      // Parse the validation errors from the API
      const errorData = await response.json();
      console.log('API validation errors:', errorData);
      
      throw { 
        message: 'Validation failed', 
        errors: errorData.errors // This contains the validation errors
      };
    }
    if (response.status === 404) throw new Error('Insurance not found');
    throw new Error('Failed to create insurance');
  }
  
  const data = await response.json();
  return {
    id: data.id,
    numeroContrat: insurance.numeroContrat,
    idCompagnie: insurance.idCompagnie,
    compagnie: '',
    pricePerYear: insurance.pricePerYear,
    dateDebut: insurance.dateDebut,
    dateExpiration: insurance.dateExpiration,
    idCar: insurance.carId,
    carModele: '',
    carMarque: '',
    status: calculateStatus(insurance.dateExpiration)
  };
};

const updateInsurance = async (insurance: InsuranceForm): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/${insurance.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(insurance),
  });
  
  if (!response.ok) {
    if (response.status === 400) {
      // Parse the validation errors from the API
      const errorData = await response.json();
      console.log('API validation errors:', errorData);
      
      throw { 
        message: 'Validation failed', 
        errors: errorData.errors // This contains the validation errors
      };
    }
    if (response.status === 404) throw new Error('Insurance not found');
    throw new Error('Failed to update insurance');
  }
};

// Components
const FilterSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div>
    <h4 className="text-sm font-medium text-gray-700 mb-1">{title}</h4>
    <div className="space-y-1 max-h-40 overflow-y-auto">
      {children}
    </div>
  </div>
);

const FilterCheckbox = ({ id, label, checked, onChange }: { 
  id: string; label: string; checked: boolean; onChange: () => void; 
}) => (
  <div className="flex items-center">
    <input
      id={id}
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
    />
    <label htmlFor={id} className="ml-2 text-sm text-gray-700 capitalize">
      {label}
    </label>
  </div>
);

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

const ActionButton = ({ icon: Icon, onClick, title, color }: { 
  icon: React.ComponentType<any>; 
  onClick: () => void; 
  title: string;
  color: string;
}) => (
  <motion.button
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    className={`${color} hover:${color.replace('600', '900')}`}
    title={title}
  >
    <Icon className="h-5 w-5" />
  </motion.button>
);



const DeleteConfirmModal = ({ isOpen, onClose, onConfirm }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Confirmer la suppression</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <p className="mb-6">Êtes-vous sûr de vouloir supprimer ce contrat d'assurance ? Cette action est irréversible.</p>
        
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
          >
            Supprimer
          </button>
        </div>
      </div>
    </div>
  );
};

const Sidebar = ({ 
  isOpen, 
  searchTerm, 
  setSearchTerm, 
  filterOptions, 
  toggleFilter, 
  clearAllFilters, 
  compagnieNames, 
  uniqueStatuses, 
  carMarques 
}: {
  isOpen: boolean;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterOptions: any;
  toggleFilter: (category: FilterCategory, value: string) => void;
  clearAllFilters: () => void;
  compagnieNames: string[];
  uniqueStatuses: readonly ('active' | 'expired')[];
  carMarques: string[];
}) => (
  <div className={`inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
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
            placeholder="Rechercher des contrats..."
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
        <FilterSection title="Compagnie">
          {compagnieNames.map(compagnie => (
            <FilterCheckbox
              key={compagnie}
              id={`company-${compagnie}`}
              label={compagnie}
              checked={filterOptions.compagnie.includes(compagnie)}
              onChange={() => toggleFilter('compagnie', compagnie)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Statut">
          {uniqueStatuses.map(status => (
            <FilterCheckbox
              key={status}
              id={`status-${status}`}
              label={status}
              checked={filterOptions.status.includes(status)}
              onChange={() => toggleFilter('status', status)}
            />
          ))}
        </FilterSection>

        <FilterSection title="Marque de voiture">
          {carMarques.map(marque => (
            <FilterCheckbox
              key={marque}
              id={`car-${marque}`}
              label={marque}
              checked={filterOptions.carMarque.includes(marque)}
              onChange={() => toggleFilter('carMarque', marque)}
            />
          ))}
        </FilterSection>
      </div>
    </div>
  </div>
);

const InsuranceTable = ({ insurances, onEdit, onDelete }: {
  insurances: InsuranceVM[];
  onEdit: (insurance: InsuranceVM) => void;
  onDelete: (id: number) => void;
}) => (
  <div className="overflow-x-auto">
    <table className="min-w-full divide-y divide-gray-200">
      <thead className="bg-gray-50">
        <tr>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">N° Contrat</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Compagnie</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marque</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modèle</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/An</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Statut</th>
          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
        </tr>
      </thead>
      <tbody className="bg-white divide-y divide-gray-200">
        {insurances.map(insurance => (
          <tr key={insurance.id} className="hover:bg-gray-50">
            <td className="px-6 py-4">
              <div className="font-medium text-gray-900">{insurance.numeroContrat}</div>
            </td>
            <td className="px-6 py-4 text-sm text-gray-500">{insurance.compagnie}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{insurance.carMarque}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{insurance.carModele}</td>
            <td className="px-6 py-4 text-sm text-gray-500">{insurance.pricePerYear} €</td>
            <td className="px-6 py-4 text-sm text-gray-500">
              <div>Début: {new Date(insurance.dateDebut).toLocaleDateString()}</div>
              <div>Expiration: {new Date(insurance.dateExpiration).toLocaleDateString()}</div>
            </td>
            <td className="px-6 py-4">
              <StatusBadge status={insurance.status || 'active'} />
            </td>
            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
              <div className="flex justify-end space-x-3">
                <ActionButton
                  icon={PencilIcon}
                  onClick={() => onEdit(insurance)}
                  title="Modifier"
                  color="text-blue-600"
                />
                <ActionButton
                  icon={TrashIcon}
                  onClick={() => onDelete(insurance.id)}
                  title="Supprimer"
                  color="text-red-600"
                />
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Main Component
const InsurancesPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [currentInsurance, setCurrentInsurance] = useState<InsuranceVM | null>(null);
  const [insuranceToDelete, setInsuranceToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
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
        setError(err instanceof Error ? err.message : 'Failed to load data');
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
  };

  const confirmDelete = (id: number) => {
    setInsuranceToDelete(id);
    setDeleteConfirmOpen(true);
  };
const handleAddInsurance = async () => {
  setIsLoading(true);
  setError(null);
  setFormErrors({});
  
  const previousInsurances = [...insurances];
  
  try {
    const tempInsurance: InsuranceVM = {
      id: -1,
      numeroContrat: newInsurance.numeroContrat,
      idCompagnie: newInsurance.idCompagnie,
      compagnie: companies.find(c => c.id === newInsurance.idCompagnie)?.name || '',
      pricePerYear: newInsurance.pricePerYear,
      dateDebut: newInsurance.dateDebut,
      dateExpiration: newInsurance.dateExpiration,
      idCar: newInsurance.carId,
      carModele: cars.find(c => c.id === newInsurance.carId)?.modele || '',
      carMarque: cars.find(c => c.id === newInsurance.carId)?.marque || '',
      status: calculateStatus(newInsurance.dateExpiration)
    };
    
    setInsurances(prev => [...prev, tempInsurance]);
    const createdInsurance = await createInsurance(newInsurance);
    
    setInsurances(prev => prev.map(insurance => 
      insurance.id === -1 ? { ...createdInsurance } : insurance
    ));

    setAddModalOpen(false);
    setNewInsurance({
      numeroContrat: '',
      idCompagnie: 0,
      pricePerYear: 0,
      dateDebut: new Date().toISOString().split('T')[0],
      dateExpiration: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
      carId: 0
    });
  } catch (err: any) {
    setInsurances(previousInsurances);
    if (err.errors) {
      // Convert the backend error format to match our form field names
      const formattedErrors: Record<string, string> = {};
      
      Object.keys(err.errors).forEach(key => {
        // The backend might use PascalCase, convert to camelCase if needed
        const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);
        
        // Take the first error message for each field
        if (err.errors[key] && err.errors[key].length > 0) {
          formattedErrors[camelCaseKey] = err.errors[key][0];
        }
      });
      
      setFormErrors(formattedErrors);
      setError('Veuillez corriger les erreurs dans le formulaire');
    } else {
      setError(err instanceof Error ? err.message : 'Failed to add insurance');
      setFormErrors({});
    }
  } finally {
    setIsLoading(false);
  }
};

const handleSave = async () => {
  if (!editedInsurance) return;

  setIsLoading(true);
  setError(null);
  setFormErrors({});
  
  const previousInsurances = [...insurances];
  
  try {
    setInsurances(prev => prev.map(insurance => 
      insurance.id === editedInsurance.id 
        ? { 
            ...insurance, 
            numeroContrat: editedInsurance.numeroContrat,
            idCompagnie: editedInsurance.idCompagnie,
            compagnie: companies.find(c => c.id === editedInsurance.idCompagnie)?.name || '',
            pricePerYear: editedInsurance.pricePerYear,
            dateDebut: editedInsurance.dateDebut,
            dateExpiration: editedInsurance.dateExpiration,
            idCar: editedInsurance.carId,
            carModele: cars.find(c => c.id === editedInsurance.carId)?.modele || '',
            carMarque: cars.find(c => c.id === editedInsurance.carId)?.marque || '',
            status: calculateStatus(editedInsurance.dateExpiration)
          }
        : insurance
    ));
    
    await updateInsurance(editedInsurance);
    setEditModalOpen(false);
  } catch (err: any) {
    setInsurances(previousInsurances);
    if (err.errors) {
      // Convert the backend error format to match our form field names
      const formattedErrors: Record<string, string> = {};
      
      Object.keys(err.errors).forEach(key => {
        // The backend might use PascalCase, convert to camelCase if needed
        const camelCaseKey = key.charAt(0).toLowerCase() + key.slice(1);
        
        // Take the first error message for each field
        if (err.errors[key] && err.errors[key].length > 0) {
          formattedErrors[camelCaseKey] = err.errors[key][0];
        }
      });
      
      setFormErrors(formattedErrors);
      setError('Veuillez corriger les erreurs dans le formulaire');
    } else {
      setError(err instanceof Error ? err.message : 'Failed to update insurance');
      setFormErrors({});
    }
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async () => {
    if (insuranceToDelete !== null) {
      setIsLoading(true);
      setError(null);
      
      const previousInsurances = [...insurances];
      
      try {
        setInsurances(prev => prev.filter(insurance => insurance.id !== insuranceToDelete));
        await deleteInsurance(insuranceToDelete);
        setDeleteConfirmOpen(false);
      } catch (err) {
        setInsurances(previousInsurances);
        setError(err instanceof Error ? err.message : 'Failed to delete insurance');
      } finally {
        setIsLoading(false);
      }
    }
  };



  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      <Sidebar
        isOpen={sidebarOpen}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterOptions={filterOptions}
        toggleFilter={toggleFilter}
        clearAllFilters={clearAllFilters}
        compagnieNames={compagnieNames}
        uniqueStatuses={uniqueStatuses}
        carMarques={carMarques}
      />

      <div className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white shadow-sm z-10 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Assurances</h1>
            <div className="flex items-center space-x-3">
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-1 text-gray-500 hover:text-gray-600 relative">
                <BellIcon className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 lg:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
              <span className="block sm:inline">{error}</span>
              <button onClick={() => setError(null)} className="absolute top-0 right-0 px-4 py-3">
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          )}


          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Contrats d'assurance</h2>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-4">
                  {filteredInsurances.length} {filteredInsurances.length === 1 ? 'contrat trouvé' : 'contrats trouvés'}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700"
                >
                  <PlusIcon className="h-5 w-5 mr-2" />
                  Ajouter
                </motion.button>
              </div>
            </div>

            {filteredInsurances.length > 0 ? (
              <InsuranceTable 
                insurances={filteredInsurances} 
                onEdit={openEditModal} 
                onDelete={confirmDelete} 
              />
            ) : (
              <div className="p-6 text-center text-gray-500">
                Aucun contrat d'assurance disponible
              </div>
            )}
          </div>
        </main>
      </div>

{/* Add Insurance Modal */}
  {addModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium">Ajouter une nouvelle assurance</h3>
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
            <label className="block text-sm font-medium text-gray-700">N° Contrat *</label>
            <input
              type="text"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.numeroContrat ? 'border-red-500' : ''
              }`}
              value={newInsurance.numeroContrat}
              onChange={(e) => setNewInsurance({...newInsurance, numeroContrat: e.target.value})}
              disabled={isLoading}
            />
            {formErrors.numeroContrat && (
              <p className="mt-1 text-sm text-red-600">{formErrors.numeroContrat}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Compagnie *</label>
            <select
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.idCompagnie ? 'border-red-500' : ''
              }`}
              value={newInsurance.idCompagnie}
              onChange={(e) => setNewInsurance({...newInsurance, idCompagnie: parseInt(e.target.value)})}
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
              <p className="mt-1 text-sm text-red-600">{formErrors.idCompagnie}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Véhicule *</label>
            <select
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.carId ? 'border-red-500' : ''
              }`}
              value={newInsurance.carId}
              onChange={(e) => setNewInsurance({...newInsurance, carId: parseInt(e.target.value)})}
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
              <p className="mt-1 text-sm text-red-600">{formErrors.carId}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Prix/An *</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.pricePerYear ? 'border-red-500' : ''
              }`}
              value={newInsurance.pricePerYear}
              onChange={(e) => setNewInsurance({...newInsurance, pricePerYear: parseFloat(e.target.value)})}
              disabled={isLoading}
            />
            {formErrors.pricePerYear && (
              <p className="mt-1 text-sm text-red-600">{formErrors.pricePerYear}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date de début *</label>
            <input
              type="date"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.dateDebut ? 'border-red-500' : ''
              }`}
              value={newInsurance.dateDebut}
              onChange={(e) => setNewInsurance({...newInsurance, dateDebut: e.target.value})}
              disabled={isLoading}
            />
            {formErrors.dateDebut && (
              <p className="mt-1 text-sm text-red-600">{formErrors.dateDebut}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Date d'expiration *</label>
            <input
              type="date"
              className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
                formErrors.dateExpiration ? 'border-red-500' : ''
              }`}
              value={newInsurance.dateExpiration}
              onChange={(e) => setNewInsurance({...newInsurance, dateExpiration: e.target.value})}
              disabled={isLoading}
            />
            {formErrors.dateExpiration && (
              <p className="mt-1 text-sm text-red-600">{formErrors.dateExpiration}</p>
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
            onClick={handleAddInsurance}
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
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
      </div>
    </div>
  )}

 {/* Edit Insurance Modal */}
{editModalOpen && currentInsurance && editedInsurance && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Modifier l'assurance</h3>
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
          <label className="block text-sm font-medium text-gray-700">N° Contrat *</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.numeroContrat ? 'border-red-500' : ''
            }`}
            value={editedInsurance.numeroContrat}
            onChange={(e) => setEditedInsurance({...editedInsurance, numeroContrat: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.numeroContrat && (
            <p className="mt-1 text-sm text-red-600">{formErrors.numeroContrat}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Compagnie *</label>
          <select
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
            <p className="mt-1 text-sm text-red-600">{formErrors.idCompagnie}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Véhicule *</label>
          <select
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
            <p className="mt-1 text-sm text-red-600">{formErrors.carId}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Prix/An *</label>
          <input
            type="number"
            step="0.01"
            min="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.pricePerYear ? 'border-red-500' : ''
            }`}
            value={editedInsurance.pricePerYear}
            onChange={(e) => setEditedInsurance({...editedInsurance, pricePerYear: parseFloat(e.target.value)})}
            disabled={isLoading}
          />
          {formErrors.pricePerYear && (
            <p className="mt-1 text-sm text-red-600">{formErrors.pricePerYear}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date de début *</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateDebut ? 'border-red-500' : ''
            }`}
            value={editedInsurance.dateDebut}
            onChange={(e) => setEditedInsurance({...editedInsurance, dateDebut: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.dateDebut && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateDebut}</p>
          )}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700">Date d'expiration *</label>
          <input
            type="date"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.dateExpiration ? 'border-red-500' : ''
            }`}
            value={editedInsurance.dateExpiration}
            onChange={(e) => setEditedInsurance({...editedInsurance, dateExpiration: e.target.value})}
            disabled={isLoading}
          />
          {formErrors.dateExpiration && (
            <p className="mt-1 text-sm text-red-600">{formErrors.dateExpiration}</p>
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
          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 flex items-center"
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
    </div>
  </div>
)}
      
      <DeleteConfirmModal
        isOpen={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default InsurancesPage;