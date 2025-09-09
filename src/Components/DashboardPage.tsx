import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  BellIcon,
  UserCircleIcon,
  ChevronDownIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  AdjustmentsHorizontalIcon,
  XMarkIcon,
  Bars3Icon,
  PlusIcon,
} from '@heroicons/react/24/outline';

// === Match C# ReservationVM ===
type Reservation = {
  id: number;
  marque: string;
  model: string;
  idClient: number;
  clientName: string;
  clientRating: number; // decimal in C#, use number in JS
  dateStartReservation: string; // DateOnly -> "YYYY-MM-DD"
  dateExpReservation: string | null; // DateOnly? -> string | null
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
  dateStart: string; // DateOnly -> "YYYY-MM-DD"
  dateExp: string; // DateOnly -> "YYYY-MM-DD"
  pricePerDay: number;
  idClient: number;
  idCar: number;
};

type FilterOptions = {
  marque: string[];
  clientRating: number[];
};

type DashboardPageProps = {
  setIsAuthenticated: (value: boolean) => void;
};

const DashboardPage: React.FC<DashboardPageProps> = ({ setIsAuthenticated }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentReservation, setCurrentReservation] = useState<Reservation | null>(null);
  const [reservationToDelete, setReservationToDelete] = useState<number | null>(null);
  const [editedReservation, setEditedReservation] = useState<Reservation | null>(null);
  const [cars, setCars] = useState<{ id: number; marque: string; model: string }[]>([]);
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [clients, setClients] = useState<{ id: number; name: string }[]>([]);
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [stats, setStats] = useState<Stats>({
    rentedCars: 0,
    expiringInsuranceThisWeek: 0,
    averageClientRating: 0,
    availableCars: 0
  });

  // === New reservation form state (match ReservationForm) ===
  const [newReservation, setNewReservation] = useState<ReservationForm>({
    id: 0,
    dateStart: '',
    dateExp: '',
    pricePerDay: 0,
    idClient: 0,
    idCar: 0
  });

  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    marque: [],
    clientRating: []
  });

  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);

  // === Fetch data from API ===
  useEffect(() => {
    fetchReservations();
    fetchStats();
    fetchClients();
    fetchCars();
  }, []);

  const fetchReservations = async () => {
    try {
      const response = await fetch('https://localhost:7079/api/Dashboard/reservations');
      if (response.ok) {
        const data: Reservation[] = await response.json();
        setReservations(data);
      } else {
        console.error('Failed to fetch reservations');
      }
    } catch (error) {
      console.error('Error fetching reservations:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch('https://localhost:7079/api/Dashboard/stats');
      if (response.ok) {
        const data: Stats = await response.json();
        setStats(data);
      } else {
        console.error('Failed to fetch stats');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await fetch('https://localhost:7079/api/client/ClientsList');
      if (response.ok) {
        const clientsData: { id: number; name: string }[] = await response.json();
        setClients(clientsData);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const fetchCars = async () => {
    try {
      const response = await fetch('https://localhost:7079/api/car/CarsList');
      if (response.ok) {
        const carsData: { id: number; marque: string; model: string }[] = await response.json();
        setCars(carsData);
      } else {
        console.error('Failed to fetch cars');
      }
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };

  // === Effect: Handle outside clicks for menus ===
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notifications-menu') && showNotifications) {
        setShowNotifications(false);
      }
      if (!target.closest('.profile-menu') && showProfileMenu) {
        setShowProfileMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileMenu]);

  // === Effect: Filter reservations ===
  useEffect(() => {
    const filtered = reservations.filter(res => {
      const matchesSearch =
        res.marque.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        res.clientName.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMarque = filterOptions.marque.length === 0 || filterOptions.marque.includes(res.marque);

      const matchesRating = filterOptions.clientRating.length === 0 ||
        filterOptions.clientRating.some(rating => Math.floor(res.clientRating) === rating);

      return matchesSearch && matchesMarque && matchesRating;
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
    setFilterOptions({ marque: [], clientRating: [] });
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
    setEditModalOpen(true);
  };

  const handleSave = async () => {
    if (editedReservation) {
      try {
        const response = await fetch(`https://localhost:7079/api/Dashboard/reservations/${editedReservation.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            id: editedReservation.id,
            dateStart: editedReservation.dateStartReservation,
            dateExp: editedReservation.dateExpReservation,
            idClient: editedReservation.idClient,
            idCar: cars.find(c => c.marque === editedReservation.marque && c.model === editedReservation.model)?.id || 0,
            pricePerDay: 0 // You might need to adjust this based on your API
          }),
        });

        if (response.ok) {
          fetchReservations(); // Refresh the list
          setEditModalOpen(false);
        } else {
          console.error('Failed to update reservation');
        }
      } catch (error) {
        console.error('Error updating reservation:', error);
      }
    }
  };

  const handleAddReservation = async () => {
    try {
      const selectedCar = cars.find(car => car.id === newReservation.idCar);
      
      const response = await fetch('https://localhost:7079/api/Dashboard/reservations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newReservation),
      });

      if (response.ok) {
        fetchReservations(); // Refresh the list
        setAddModalOpen(false);
        setNewReservation({
          id: 0,
          dateStart: '',
          dateExp: '',
          pricePerDay: 0,
          idClient: 0,
          idCar: 0
        });
      } else {
        console.error('Failed to add reservation');
      }
    } catch (error) {
      console.error('Error adding reservation:', error);
    }
  };

  const confirmDelete = (id: number) => {
    setReservationToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (reservationToDelete) {
      try {
        const response = await fetch(`https://localhost:7079/api/Dashboard/reservations/${reservationToDelete}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          fetchReservations(); // Refresh the list
          setDeleteConfirmOpen(false);
        } else {
          console.error('Failed to delete reservation');
        }
      } catch (error) {
        console.error('Error deleting reservation:', error);
      }
    }
  };

  const uniqueMarques = [...new Set(reservations.map(res => res.marque))];
  const uniqueRatings = [1, 2, 3, 4, 5];

  return (
    <div className="flex min-h-screen bg-gray-50 overflow-auto">
      {/* Sidebar */}
      <div
        className={`inset-y-0 left-0 z-30 w-64 bg-white shadow-md transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
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
                placeholder="Rechercher..."
                className="w-full pl-8 pr-3 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-indigo-500"
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
              <h4 className="text-sm font-medium text-gray-700 mb-1">Marque</h4>
              <div className="space-y-1">
                {uniqueMarques.map(marque => (
                  <div key={marque} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterOptions.marque.includes(marque)}
                      onChange={() => toggleFilter('marque', marque)}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700">{marque}</label>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-1">Note Client</h4>
              <div className="space-y-1">
                {uniqueRatings.map(rating => (
                  <div key={rating} className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filterOptions.clientRating.includes(rating)}
                      onChange={() => toggleFilter('clientRating', rating)}
                      className="h-4 w-4 text-indigo-600 rounded"
                    />
                    <label className="ml-2 text-sm text-gray-700 flex items-center">
                      {[...Array(5)].map((_, i) => (
                        <svg key={i} className={`h-3 w-3 ${i < rating ? 'text-yellow-400' : 'text-gray-300'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                      ))}
                      {rating > 0 && <span className="ml-1">& plus</span>}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 min-h-screen overflow-auto">
        <header className="bg-white shadow-sm z-10 lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <button onClick={() => setSidebarOpen(true)} className="text-gray-500 hover:text-gray-600">
              <Bars3Icon className="h-6 w-6" />
            </button>
            <h1 className="text-xl font-bold text-indigo-600">Tableau de bord</h1>
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

        <main className="p-4 lg:p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-green-100 text-green-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Voitures disponibles</p>
                  <p className="text-xl font-semibold">{stats.availableCars}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-indigo-500">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-indigo-100 text-indigo-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Actuellement louées</p>
                  <p className="text-xl font-semibold">{stats.rentedCars}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-red-500">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-red-100 text-red-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assurance expirant</p>
                  <p className="text-xl font-semibold">{stats.expiringInsuranceThisWeek}</p>
                </div>
              </div>
            </motion.div>

            <motion.div whileHover={{ y: -2 }} className="bg-white p-4 rounded-lg shadow-sm border-l-4 border-yellow-500">
              <div className="flex items-center">
                <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 mr-3">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.175 0l-3.976 2.888c-.783.57-1.838-.197-1.539-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Note moyenne client</p>
                  <p className="text-xl font-semibold">{stats.averageClientRating}/5</p>
                </div>
              </div>
            </motion.div>
          </div>

          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold">Locations en cours</h2>
              <div className="flex items-center space-x-4">
                <p className="text-sm text-gray-500">
                  {filteredReservations.length} {filteredReservations.length === 1 ? 'réservation' : 'réservations'}
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
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Détails</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Client</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Note</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredReservations.map(res => (
                    <tr key={res.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium text-gray-900">{res.marque} {res.model}</div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{res.clientName}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          {[...Array(5)].map((_, i) => (
                            <svg
                              key={i}
                              className={`h-5 w-5 ${i < Math.floor(res.clientRating) ? 'text-yellow-400' : 'text-gray-300'}`}
                              fill="currentColor"
                              viewBox="0 0 20 20"
                            >
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                          ))}
                          <span className="ml-1 text-gray-600">{res.clientRating}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        <div>Début: {res.dateStartReservation ? new Date(res.dateStartReservation).toLocaleDateString() : 'N/A'}</div>
                        <div>Fin: {res.dateExpReservation ? new Date(res.dateExpReservation).toLocaleDateString() : 'N/A'}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-3">
                          <motion.button onClick={() => openEditModal(res)} className="text-blue-600 hover:text-blue-900" title="Modifier">
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>
                          <motion.button onClick={() => confirmDelete(res.id)} className="text-red-600 hover:text-red-900" title="Supprimer">
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

      {/* Add Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Ajouter une réservation</h3>
              <button onClick={() => setAddModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Voiture</label>
                <select
                  value={newReservation.idCar}
                  onChange={(e) => setNewReservation({ ...newReservation, idCar: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                >
                  <option value={0}>Sélectionner une voiture</option>
                  {cars.map(car => (
                    <option key={car.id} value={car.id}>{car.marque} {car.model}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  value={newReservation.idClient}
                  onChange={(e) => setNewReservation({ ...newReservation, idClient: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                >
                  <option value={0}>Sélectionner un client</option>
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de début</label>
                <input
                  type="date"
                  value={newReservation.dateStart}
                  onChange={(e) => setNewReservation({ ...newReservation, dateStart: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                <input
                  type="date"
                  value={newReservation.dateExp}
                  onChange={(e) => setNewReservation({ ...newReservation, dateExp: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                />
              </div>
    
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setAddModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleAddReservation}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Ajouter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editModalOpen && editedReservation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Modifier la réservation</h3>
              <button onClick={() => setEditModalOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Marque</label>
                <input
                  type="text"
                  value={editedReservation.marque}
                  onChange={(e) => setEditedReservation({ ...editedReservation, marque: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Modèle</label>
                <input
                  type="text"
                  value={editedReservation.model}
                  onChange={(e) => setEditedReservation({ ...editedReservation, model: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                  disabled
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Client</label>
                <select
                  value={editedReservation.idClient}
                  onChange={(e) => setEditedReservation({ ...editedReservation, idClient: parseInt(e.target.value) })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                >
                  {clients.map(client => (
                    <option key={client.id} value={client.id}>{client.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de début</label>
                <input
                  type="date"
                  value={editedReservation.dateStartReservation}
                  onChange={(e) => setEditedReservation({ ...editedReservation, dateStartReservation: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                <input
                  type="date"
                  value={editedReservation.dateExpReservation || ''}
                  onChange={(e) => setEditedReservation({ ...editedReservation, dateExpReservation: e.target.value })}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setEditModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                Enregistrer
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
              <button onClick={() => setDeleteConfirmOpen(false)} className="text-gray-500 hover:text-gray-700">
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            <p className="mb-6">Êtes-vous sûr de vouloir supprimer cette réservation ? Cette action est irréversible.</p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setDeleteConfirmOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
              >
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DashboardPage;