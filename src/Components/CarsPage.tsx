import React, { useState, useEffect } from 'react';
import { 
  BellIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  PlusIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion } from 'framer-motion';

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

const CarsPage = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentCar, setCurrentCar] = useState<Car | null>(null);
  const [carToDelete, setCarToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  // Filter options
  type FilterOptions = {
    marque: string[];
    disponible: string[];
  };

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    marque: [],
    disponible: []
  });

  // Fetch cars on component mount
  useEffect(() => {
    const fetchCars = async () => {
      setIsLoading(true);
      try {
        const res = await fetch("https://localhost:7079/api/car");
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
        setError(err instanceof Error ? err.message : 'Failed to fetch cars');
        console.error("Error fetching cars:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCars();
  }, []);

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
  };

const handleAddCar = async () => {
  setIsLoading(true);
  setError(null);
  setFormErrors({});

  try {
    // Create temporary car object for optimistic UI update
    const tempCar: Car = {
      id: Date.now(), // Temporary ID
      pricePerDay: newCar.pricePerDay,
      marque: newCar.marque,
      modele: newCar.modele,
      disponible: newCar.disponible,
      howManyDaysLeftinReservation: null,
      dateExpirationInsurance: null,
      dateExpirationVignette: null
    };

    // Optimistically update UI
    setCars(prevCars => [...prevCars, tempCar]);
    setFilteredCars(prevFilteredCars => [...prevFilteredCars, tempCar]);

    const response = await fetch("https://localhost:7079/api/car", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        pricePerDay: newCar.pricePerDay,
        marque: newCar.marque,
        modele: newCar.modele,
        disponible: newCar.disponible
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
        
        // Revert optimistic update on error
        setCars(prevCars => prevCars.filter(c => c.id !== tempCar.id));
        setFilteredCars(prevFilteredCars => 
          prevFilteredCars.filter(c => c.id !== tempCar.id)
        );
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    
    // Update the temporary car with the real ID from the server
    setCars(prevCars => 
      prevCars.map(c => c.id === tempCar.id ? { ...c, id: result.id } : c)
    );
    setFilteredCars(prevFilteredCars =>
      prevFilteredCars.map(c => c.id === tempCar.id ? { ...c, id: result.id } : c)
    );

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
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to add car');
    console.error("Error adding car:", err);
    
    // Revert optimistic update on error
    setCars(prevCars => prevCars.filter(c => c.id !== Date.now()));
    setFilteredCars(prevFilteredCars => 
      prevFilteredCars.filter(c => c.id !== Date.now())
    );
  } finally {
    setIsLoading(false);
  }
};

  // Save edited car
const handleSave = async () => {
  if (!editedCar) return;

  setIsLoading(true);
  setError(null);
  setFormErrors({});

  try {
    // Store the original car for potential rollback
    const originalCar = currentCar;
    
    // Optimistically update UI
    setCars(prevCars => 
      prevCars.map(c => c.id === editedCar.id ? editedCar : c)
    );
    setFilteredCars(prevFilteredCars =>
      prevFilteredCars.map(c => c.id === editedCar.id ? editedCar : c)
    );

    const response = await fetch(`https://localhost:7079/api/car/${editedCar.id}`, {
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
        
        // Revert optimistic update on error
        if (originalCar) {
          setCars(prevCars => 
            prevCars.map(c => c.id === originalCar.id ? originalCar : c)
          );
          setFilteredCars(prevFilteredCars =>
            prevFilteredCars.map(c => c.id === originalCar.id ? originalCar : c)
          );
        }
        return;
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setEditModalOpen(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to update car');
    console.error("Error updating car:", err);
    
    // Revert optimistic update on error
    if (currentCar) {
      setCars(prevCars => 
        prevCars.map(c => c.id === currentCar.id ? currentCar : c)
      );
      setFilteredCars(prevFilteredCars =>
        prevFilteredCars.map(c => c.id === currentCar.id ? currentCar : c)
      );
    }
  } finally {
    setIsLoading(false);
  }
};

const handleDelete = async () => {
  if (!carToDelete) return;

  setIsLoading(true);
  setError(null);

  try {
    // Store the car to delete for potential rollback
    const carToDeleteData = cars.find(c => c.id === carToDelete);
    
    if (!carToDeleteData) {
      throw new Error("Car not found for deletion");
    }

    // Optimistically update UI
    setCars(prevCars => prevCars.filter(c => c.id !== carToDelete));
    setFilteredCars(prevFilteredCars => 
      prevFilteredCars.filter(c => c.id !== carToDelete)
    );

    const response = await fetch(`https://localhost:7079/api/car/${carToDelete}`, {
      method: "DELETE"
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    setDeleteConfirmOpen(false);
  } catch (err) {
    setError(err instanceof Error ? err.message : 'Failed to delete car');
    console.error("Error deleting car:", err);
    
    // Revert optimistic update on error
    // We need to get the car data from the original state before optimistic update
    const originalCar = cars.find(c => c.id === carToDelete);
    if (originalCar) {
      setCars(prevCars => [...prevCars, originalCar].sort((a, b) => a.id - b.id));
      setFilteredCars(prevFilteredCars => 
        [...prevFilteredCars, originalCar].sort((a, b) => a.id - b.id)
      );
    }
  } finally {
    setIsLoading(false);
    setCarToDelete(null);
  }
};

  // View car details
  const viewDetails = (car: Car) => {
    console.log("Car details:", car);
  };

  // Confirm delete
  const confirmDelete = (id: number) => {
    setCarToDelete(id);
    setDeleteConfirmOpen(true);
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

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <div className={`inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {/* Filters section */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-medium">Filtres</h3>
            <button onClick={clearAllFilters} className="text-xs text-indigo-600 hover:text-indigo-800">
              Tout effacer
            </button>
          </div>
          
          {/* Search */}
          <div className="mb-3">
            <div className="relative">
              <input
                type="text"
                placeholder="Rechercher des voitures..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Brand filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Marque</h4>
            <div className="space-y-1 max-h-40 overflow-y-auto">
              {uniqueMarques.map(marque => (
                <div key={marque} className="flex items-center">
                  <input
                    id={`marque-${marque}`}
                    type="checkbox"
                    checked={filterOptions.marque.includes(marque)}
                    onChange={() => toggleFilter('marque', marque)}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor={`marque-${marque}`} className="ml-2 text-sm text-gray-700">
                    {marque}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Availability filter */}
          <div className="mb-4">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Disponibilité</h4>
            <div className="space-y-1">
              <div className="flex items-center">
                <input
                  id="disponible-true"
                  type="checkbox"
                  checked={filterOptions.disponible.includes("true")}
                  onChange={() => toggleFilter('disponible', "true")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="disponible-true" className="ml-2 text-sm text-gray-700">
                  Disponible
                </label>
              </div>
              <div className="flex items-center">
                <input
                  id="disponible-false"
                  type="checkbox"
                  checked={filterOptions.disponible.includes("false")}
                  onChange={() => toggleFilter('disponible', "false")}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="disponible-false" className="ml-2 text-sm text-gray-700">
                  Non disponible
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 min-h-screen overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm z-10 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Voitures</h1>
            <div className="flex items-center space-x-3">
              <button onClick={() => setMobileFiltersOpen(true)} className="p-1 text-gray-500 hover:text-gray-600">
                <AdjustmentsHorizontalIcon className="h-5 w-5" />
              </button>
              <button onClick={() => setShowNotifications(!showNotifications)} className="p-1 text-gray-500 hover:text-gray-600 relative">
                <BellIcon className="h-5 w-5" />
              </button>
            </div>
          </div>
        </header>

        {/* Main content area */}
        <main className="p-4 lg:p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          {/* Cars table */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Inventaire des voitures</h2>
              <div className="flex items-center">
                <p className="text-sm text-gray-500 mr-4">
                  {filteredCars.length} {filteredCars.length === 1 ? 'voiture trouvée' : 'voitures trouvées'}
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prix/jour</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Disponible</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Jours Restant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assurance</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vignette</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredCars.map(car => {
                    const insuranceStatus = getDateStatus(car.dateExpirationInsurance);
                    const vignetteStatus = getDateStatus(car.dateExpirationVignette);
                    
                    return (
                      <tr key={car.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{car.marque} {car.modele}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500">
                          ${car.pricePerDay.toFixed(2)}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${car.disponible ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                            {car.disponible ? 'Oui' : 'Non'}
                          </span>
                        </td>
<td className="px-6 py-4">
  {car.howManyDaysLeftinReservation !== null ? (
    car.howManyDaysLeftinReservation === -1 ? (
      <span className="inline-flex px-2 py-1 text-xs font-medium text-gray-500">
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
    <span className="inline-flex px-2 py-1 text-xs font-medium text-gray-500">
      N/A
    </span>
  )}
</td>
                        <td className="px-6 py-4">
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
                                  : 'text-gray-600'
                            }`}>
                              {insuranceStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
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
                                  : 'text-gray-600'
                            }`}>
                              {vignetteStatus.text}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex justify-end space-x-3">
                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => viewDetails(car)}
                              className="text-indigo-600 hover:text-indigo-900"
                              title="Voir détails"
                            >
                              <EyeIcon className="h-5 w-5" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => openEditModal(car)}
                              className="text-blue-600 hover:text-blue-900"
                              title="Modifier"
                            >
                              <PencilIcon className="h-5 w-5" />
                            </motion.button>

                            <motion.button
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => confirmDelete(car.id)}
                              className="text-red-600 hover:text-red-900"
                              title="Supprimer"
                            >
                              <TrashIcon className="h-5 w-5" />
                            </motion.button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>


{/* Add Car Modal */}
{addModalOpen && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Ajouter une nouvelle voiture</h3>
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
        {/* Marque field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Marque *</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
          <label className="block text-sm font-medium text-gray-700">Modèle *</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
          <label className="block text-sm font-medium text-gray-700">Prix par jour ($) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
            setFormErrors({}); // Clear errors when closing
          }}
          className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
          disabled={isLoading}
        >
          Annuler
        </button>
        <button
          onClick={handleAddCar}
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

{/* Edit Car Modal */}
{editModalOpen && editedCar && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
    <div className="bg-white rounded-lg p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-medium">Modifier la voiture</h3>
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
        {/* Marque field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Marque *</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
          <label className="block text-sm font-medium text-gray-700">Modèle *</label>
          <input
            type="text"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
          <label className="block text-sm font-medium text-gray-700">Prix par jour ($) *</label>
          <input
            type="number"
            min="0"
            step="0.01"
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
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
        
        {/* Disponible field */}
        <div>
          <label className="block text-sm font-medium text-gray-700">Disponible</label>
          <select
            className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
              formErrors.disponible ? 'border-red-500' : ''
            }`}
            value={editedCar.disponible ? "true" : "false"}
            onChange={(e) => setEditedCar({...editedCar, disponible: e.target.value === "true"})}
            disabled={isLoading}
          >
            <option value="true">Disponible</option>
            <option value="false">Non disponible</option>
          </select>
          {formErrors.disponible && (
            <div className="mt-1 text-sm text-red-600">
              {formErrors.disponible.map((error, index) => (
                <p key={index}>{error}</p>
              ))}
            </div>
          )}
        </div>

        {/* Display general errors not tied to specific fields */}
        {Object.keys(formErrors).filter(key => 
          !['marque', 'modele', 'pricePerDay', 'disponible'].includes(key)
        ).length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
            <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
            {Object.entries(formErrors)
              .filter(([key]) => !['marque', 'modele', 'pricePerDay', 'disponible'].includes(key))
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
            setFormErrors({}); // Clear errors when closing
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
      {/* Delete Confirmation Modal */}
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
      
      {carToDelete && (
        <>
          {/* Show which car is being deleted */}
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="font-medium text-gray-900">
              Voiture à supprimer: 
            </p>
            {cars.find(car => car.id === carToDelete) && (
              <p className="text-sm text-gray-600">
                {cars.find(car => car.id === carToDelete)?.marque} {cars.find(car => car.id === carToDelete)?.modele}
              </p>
            )}
          </div>
          
          <p className="mb-6 text-gray-700">
            Êtes-vous sûr de vouloir supprimer cette voiture ? Cette action est irréversible.
          </p>
        </>
      )}
      
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

export default CarsPage;