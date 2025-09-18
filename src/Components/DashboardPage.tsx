import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
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

// === Match C# ReservationVM ===
type Reservation = {
  id: number;
  marque: string;
  modele: string;
  idClient: number;
  clientName: string;
  clientRating: number;
  dateStartReservation: string;
  dateExpReservation: string | null;
};

// === Match C# StatsVM ===
type Stats = {
  rentedCars: number;
  expiringInsuranceThisWeek: number;
  averageClientRating: number;
  availableCars: number;
};

// === Match C# ReservationForm ===
type ReservationForm = {
  id: number;
  dateStart: string;
  dateExp: string;
  idClient: number;
  idCar: number;
};

type FilterOptions = {
  marque: string[];
  clientRating: number[];
  status: string[];
};

const DashboardPage = () => {
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  const [editedReservation, setEditedReservation] = useState<Reservation | null>(null);
  const [cars, setCars] = useState<{ id: number; marque: string; modele: string }[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats>({
    rentedCars: 0,
    expiringInsuranceThisWeek: 0,
    averageClientRating: 0,
    availableCars: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const [selectedMarqueEdit, setSelectedMarqueEdit] = useState('');

  const [newReservation, setNewReservation] = useState<ReservationForm>({
    id: 0,
    dateStart: '',
    dateExp: '',
    idClient: 0,
    idCar: 0
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    marque: [],
    clientRating: [],
    status: []
  });

  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Show error message
  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 5000);
  };

  // === Fetch data from API ===
  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchReservations(),
        fetchStats(),
        fetchClients(),
        fetchCars()
      ]);
    } catch (err) {
      showError('Erreur lors du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  const fetchReservations = async () => {
    try {
      const response = await fetch('https://palmares20250909131957.azurewebsites.net/api/Dashboard/reservations');
      if (response.ok) {
        const data: Reservation[] = await response.json();
        setReservations(data);
      } else {
        throw new Error('Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
      throw error;
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://palmares20250909131957.azurewebsites.net/api/Dashboard/stats');
      if (response.ok) {
        const data: Stats = await response.json();
        setStats(data);
      } else {
        throw new Error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      throw error;
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('https://palmares20250909131957.azurewebsites.net/api/client/ClientsList');
      if (response.ok) {
        const clientsData: { id: number; name: string }[] = await response.json();
        setClients(clientsData);
      } else {
        throw new Error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };

  const fetchCars = async () => {
    try {
      const response = await fetch('https://palmares20250909131957.azurewebsites.net/api/car/CarsList');
      if (response.ok) {
        const carsData: { id: number; marque: string; modele: string }[] = await response.json();
        setCars(carsData);
        console.log(carsData);
      } else {
        throw new Error('Failed to fetch cars');
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
      throw error;
    }
  };

  // === Effect: Filter reservations ===
  useEffect(() => {
    const filtered = reservations.filter(res => {
      const matchesSearch =
        res.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.modele.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarque = filterOptions.marque.length === 0 || filterOptions.marque.includes(res.marque);

      const matchesRating = filterOptions.clientRating.length === 0 ||
        filterOptions.clientRating.some(rating => Math.floor(res.clientRating) === rating);

      // Status filter logic (active/expired/upcoming)
      const status = getReservationStatus(res);
      
      const matchesStatus = filterOptions.status.length === 0 || 
        (filterOptions.status.includes('active') && status === 'active') ||
        (filterOptions.status.includes('expired') && status === 'expired') ||
        (filterOptions.status.includes('upcoming') && status === 'upcoming');

      return matchesSearch && matchesMarque && matchesRating && matchesStatus;
    });
    setFilteredReservations(filtered);
  }, [searchTerm, filterOptions, reservations]);

  const toggleFilter = (category: keyof FilterOptions, value: string | number) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].includes(value as never)
        ? prev[category].filter(v => v !== value)
        : [...prev[category], value as never]
    }));
  };

  const clearAllFilters = () => {
    setFilterOptions({ marque: [], clientRating: [], status: [] });
    setSearchTerm('');
  };

  const removeFilter = (category: keyof FilterOptions, value: string | number) => {
    setFilterOptions(prev => ({
      ...prev,
      [category]: prev[category].filter(v => v !== value)
    }));
  };

  const viewDetails = (id: number) => navigate(`/reservation/${id}`);

  const openEditModal = (res: Reservation) => {
    setCurrentReservation(res);
    setEditedReservation({ ...res });
    setSelectedMarqueEdit(res.marque);
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (editedReservation) {
      try {
        // Find the car ID based on marque and model
        const car = cars.find(c => c.marque === editedReservation.marque && c.modele === editedReservation.modele);
        
        if (!car) {
          showError('Voiture non trouvée');
          return;
        }

        const response = await fetch(`https://palmares20250909131957.azurewebsites.net/api/Dashboard/reservations/${editedReservation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editedReservation.id,
            dateStart: editedReservation.dateStartReservation,
            dateExp: editedReservation.dateExpReservation,
            idClient: editedReservation.idClient,
            idCar: car.id,
            pricePerDay: 100 // Default value, adjust as needed
          }),
        });

        if (response.ok) {
          await fetchReservations();
          setEditModalOpen(false);
          showSuccess('Réservation mise à jour avec succès');
        } else {
          const errorData = await response.json();
          showError(errorData.message || 'Erreur lors de la mise à jour');
        }
      } catch (error) {
        console.error('Error updating reservation:', error);
        showError('Erreur de connexion au serveur');
        }
    }
  };

  const handleAddReservation = async () => {
    try {
      // Validate form
      if (!newReservation.idCar || !newReservation.idClient || !newReservation.dateStart || !newReservation.dateExp) {
        showError('Veuillez remplir tous les champs obligatoires');
        return;
      }

      // Validate dates
      const startDate = new Date(newReservation.dateStart);
      const endDate = new Date(newReservation.dateExp);
      
      if (endDate <= startDate) {
        showError('La date de fin doit être après la date de début');
        return;
      }

      const response = await fetch('https://palmares20250909131957.azurewebsites.net/api/Dashboard/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReservation),
      });

      if (response.ok) {
        await fetchReservations();
        setAddModalOpen(false);
        setNewReservation({
          id: 0,
          dateStart: '',
          dateExp: '',
          idClient: 0,
          idCar: 0
        });
        showSuccess('Réservation ajoutée avec succès');
      } else {
        const errorData = await response.json();
        showError(errorData.message || 'Erreur lors de l\'ajout');
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
      showError('Erreur de connexion au serveur');
    }
  };

  const confirmDelete = (id: number) => {
    setReservationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (reservationToDelete) {
      try {
        const response = await fetch(`https://palmares20250909131957.azurewebsites.net/api/Dashboard/reservations/${reservationToDelete}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await fetchReservations();
          setDeleteConfirmOpen(false);
          showSuccess('Réservation supprimée avec succès');
        } else {
          const errorData = await response.json();
          showError(errorData.message || 'Erreur lors de la suppression');
        }
      } catch (error) {
        console.error('Error deleting reservation:', error);
        showError('Erreur de connexion au serveur');
      }
    }
  };

  const uniqueMarques = [...new Set(reservations.map(res => res.marque))];
  const uniqueRatings = [1, 2, 3, 4, 5];

  // Get status of reservation (active/expired/upcoming)
  const getReservationStatus = (res: Reservation) => {
    const now = new Date();
    const startDate = new Date(res.dateStartReservation);
    const endDate = res.dateExpReservation ? new Date(res.dateExpReservation) : null;
    
    if (startDate > now) {
      return 'upcoming'; // Reservation hasn't started yet
    } else if (endDate && endDate < now) {
      return 'expired'; // Reservation has ended
    } else {
      return 'active'; // Reservation is currently active
    }
  };

  // Find car ID based on marque and modele
  const findCarId = (marque: string, modele: string) => {
    const car = cars.find(c => c.marque === marque && c.modele === modele);
    return car ? car.id : 0;
  };

  if (loading) {
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
          {/* Notification messages - Inside main content */}
          <AnimatePresence>
            <div className="mb-6 space-y-4">
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="bg-red-50 border border-red-200 rounded-lg shadow-sm p-4 flex items-start"
                >
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-red-800">Erreur</h3>
                    <p className="mt-1 text-sm text-red-700">{error}</p>
                  </div>
                  <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
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

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-teal-100 text-teal-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Voitures disponibles</p>
                  <p className="text-xl font-semibold text-slate-800">{stats.availableCars}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-blue-100 text-blue-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Actuellement louées</p>
                  <p className="text-xl font-semibold text-slate-800">{stats.rentedCars}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Assurance expirant</p>
                  <p className="text-xl font-semibold text-slate-800">{stats.expiringInsuranceThisWeek}</p>
                </div>
              </div>
            </motion.div>

            <motion.div 
              whileHover={{ y: -2 }} 
              className="bg-white p-4 rounded-xl shadow-sm border border-slate-100"
            >
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Note moyenne client</p>
                  <p className="text-xl font-semibold text-slate-800">{stats.averageClientRating}/5</p>
                </div>
              </div>
            </motion.div>
          </div>

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
                {(searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0) && (
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
                      placeholder="Rechercher par marque, modèle ou client..."
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
                
                {/* Rating Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Note client</label>
                  <div className="space-y-2">
                    {uniqueRatings.map(rating => (
                      <div key={rating} className="flex items-center">
                        <input
                          type="checkbox"
                          id={`rating-${rating}`}
                          checked={filterOptions.clientRating.includes(rating)}
                          onChange={() => toggleFilter('clientRating', rating)}
                          className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                        />
                        <label htmlFor={`rating-${rating}`} className="ml-2 text-sm text-slate-700 flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-4 w-4 ${i < rating ? 'text-yellow-400' : 'text-slate-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1">({rating})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Statut</label>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="status-active"
                        checked={filterOptions.status.includes('active')}
                        onChange={() => toggleFilter('status', 'active')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="status-active" className="ml-2 text-sm text-slate-700">
                        Actif
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="status-expired"
                        checked={filterOptions.status.includes('expired')}
                        onChange={() => toggleFilter('status', 'expired')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="status-expired" className="ml-2 text-sm text-slate-700">
                        Expiré
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        id="status-upcoming"
                        checked={filterOptions.status.includes('upcoming')}
                        onChange={() => toggleFilter('status', 'upcoming')}
                        className="h-4 w-4 text-teal-600 focus:ring-teal-500 border-slate-300 rounded"
                      />
                      <label htmlFor="status-upcoming" className="ml-2 text-sm text-slate-700">
                        À venir
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {/* Active filters display */}
            {(searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0) && (
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
                  
                  {filterOptions.clientRating.map(rating => (
                    <span key={rating} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      Note: {rating} étoile{rating > 1 ? 's' : ''}
                      <button
                        onClick={() => removeFilter('clientRating', rating)}
                        className="ml-1 text-yellow-600 hover:text-yellow-800"
                      >
                        <XMarkIcon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}

                  {filterOptions.status.map(status => (
                    <span key={status} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                      Statut: {status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'À venir'}
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

          {/* Reservations Table */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
          >
            <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <h2 className="font-semibold text-slate-800 text-lg">Locations en cours</h2>
              <div className="flex items-center space-x-3">
                <p className="text-sm text-slate-500">
                  {filteredReservations.length} {filteredReservations.length === 1 ? 'résultat' : 'résultats'}
                  {(searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0) && 
                    ` (${reservations.length} au total)`}
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setAddModalOpen(true)}
                  className="flex items-center px-3 py-2 bg-gradient-to-r from-teal-600 to-blue-600 text-white rounded-lg hover:from-teal-700 hover:to-blue-700 transition-all text-sm"
                >
                  <PlusIcon className="h-5 w-5 mr-1" />
                  <span className="hidden sm:inline">Ajouter</span>
                </motion.button>
              </div>
            </div>
            <div className="overflow-x-auto">
              {filteredReservations.length > 0 ? (
                <table className="min-w-full divide-y divide-slate-200">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Détails</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Client</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Note</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Dates</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Statut</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredReservations.map(res => {
                      const status = getReservationStatus(res);
                      return (
                        <tr key={res.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-medium text-slate-900">{res.marque} {res.modele}</div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">{res.clientName}</td>
                          <td className="px-4 py-4">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <svg
                                  key={i}
                                  className={`h-5 w-5 ${i < Math.floor(res.clientRating) ? 'text-yellow-400' : 'text-slate-300'}`}
                                  fill="currentColor"
                                  viewBox="0 0 20 20"
                                >
                                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                              ))}
                              <span className="ml-1 text-slate-600">{res.clientRating}</span>
                            </div>
                          </td>
                          <td className="px-4 py-4 text-sm text-slate-500">
                            <div>Début: {res.dateStartReservation ? new Date(res.dateStartReservation).toLocaleDateString() : 'N/A'}</div>
                            <div>Fin: {res.dateExpReservation ? new Date(res.dateExpReservation).toLocaleDateString() : 'N/A'}</div>
                          </td>
                          <td className="px-4 py-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : status === 'expired' 
                                  ? 'bg-red-100 text-red-800' 
                                  : 'bg-blue-100 text-blue-800'
                            }`}>
                              {status === 'active' ? 'Actif' : status === 'expired' ? 'Expiré' : 'À venir'}
                            </span>
                          </td>
                          <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <div className="flex justify-end space-x-2">
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => openEditModal(res)} 
                                className="text-blue-600 hover:text-blue-800 transition-colors p-1" 
                                title="Modifier"
                              >
                                <PencilIcon className="h-5 w-5" />
                              </motion.button>
                              <motion.button 
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => confirmDelete(res.id)} 
                                className="text-red-600 hover:text-red-800 transition-colors p-1" 
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
              ) : (
                <div className="p-8 text-center">
                  <svg className="mx-auto h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <h3 className="mt-2 text-sm font-medium text-slate-900">Aucune réservation</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0
                      ? "Essayez de modifier vos filtres ou votre recherche."
                      : "Commencez par ajouter une nouvelle réservation."}
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => {
                        if (searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0) {
                          clearAllFilters();
                        } else {
                          setAddModalOpen(true);
                        }
                      }}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                    >
                      <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                      {searchTerm || filterOptions.marque.length > 0 || filterOptions.clientRating.length > 0 || filterOptions.status.length > 0
                        ? "Effacer les filtres"
                        : "Ajouter une réservation"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </main>
      </div>

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter une réservation</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Voiture <span className="text-red-500">*</span></label>
                <select
                  value={newReservation.idCar}
                  onChange={(e) => setNewReservation({ ...newReservation, idCar: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                >
                  <option value={0}>Sélectionner une voiture</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>{car.marque} {car.modele}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Client <span className="text-red-500">*</span></label>
                <select
                  value={newReservation.idClient}
                  onChange={(e) => setNewReservation({ ...newReservation, idClient: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                >
                  <option value={0}>Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de début <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={newReservation.dateStart}
                  onChange={(e) => setNewReservation({ ...newReservation, dateStart: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de fin <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={newReservation.dateExp}
                  onChange={(e) => setNewReservation({ ...newReservation, dateExp: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                />
              </div>
              
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReservation}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 transition-all"
              >
                Ajouter
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier la réservation</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              {/* Car Selection - Same as Add Modal */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Voiture <span className="text-red-500">*</span></label>
                <select
                  value={findCarId(editedReservation.marque, editedReservation.modele)}
                  onChange={(e) => {
                    const carId = parseInt(e.target.value);
                    if (carId > 0) {
                      const selectedCar = cars.find(c => c.id === carId);
                      if (selectedCar) {
                        setEditedReservation({ 
                          ...editedReservation, 
                          marque: selectedCar.marque,
                          modele: selectedCar.modele
                        });
                        setSelectedMarqueEdit(selectedCar.marque);
                      }
                    }
                  }}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                >
                  <option value={0}>Sélectionner une voiture</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>
                      {car.marque} {car.modele}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-slate-700">Client <span className="text-red-500">*</span></label>
                <select
                  value={editedReservation.idClient}
                  onChange={(e) => setEditedReservation({ ...editedReservation, idClient: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                >
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de début <span className="text-red-500">*</span></label>
                <input
                  type="date"
                  value={editedReservation.dateStartReservation}
                  onChange={(e) => setEditedReservation({ ...editedReservation, dateStartReservation: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">Date de fin</label>
                <input
                  type="date"
                  value={editedReservation.dateExpReservation || ''}
                  onChange={(e) => setEditedReservation({ ...editedReservation, dateExpReservation: e.target.value })}
                  className="mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-teal-600 to-blue-600 hover:from-teal-700 hover:to-blue-700 transition-all"
              >
                Enregistrer
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
              <button onClick={() => setDeleteConfirmOpen(false)} className="text-slate-500 hover:text-slate-700 transition-colors">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mb-6 text-slate-600">Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors"
              >
                Supprimer
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

export default DashboardPage;