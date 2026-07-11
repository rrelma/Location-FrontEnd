import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { apiFetch } from '../utils/auth';
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

type Company = {
  id: number;
  name: string;
};

const CompagniesPage = () => {
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);
  const [companyToDelete, setCompanyToDelete] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [formErrors, setFormErrors] = useState<Record<string, string[]>>({});
  const apiUrl = import.meta.env.VITE_API_URL;

  const API_BASE_URL = `${apiUrl}/api/compagnie`;

  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [editedCompany, setEditedCompany] = useState<Company | null>(null);
  const [newCompany, setNewCompany] = useState<Omit<Company, 'id'>>({
    name: ''
  });

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

  // Fetch all companies
  useEffect(() => {
    const fetchCompanies = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await apiFetch(API_BASE_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setCompanies(data);
        setFilteredCompanies(data);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to fetch companies';
        setError(errorMessage);
        showError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCompanies();
  }, []);

  // Apply filters
  useEffect(() => {
    let result = [...companies];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(company => 
        company.name.toLowerCase().includes(term)
      );
    }

    setFilteredCompanies(result);
  }, [companies, searchTerm]);

  const handleAdd = async () => {
    setIsLoading(true);
    setOperationError(null);
    setFormErrors({});
    
    try {
      const response = await apiFetch(API_BASE_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompany),
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

      // Refresh the companies list
      const updatedResponse = await apiFetch(API_BASE_URL);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setCompanies(updatedData);
      }

      setAddModalOpen(false);
      setNewCompany({
        name: ''
      });

      showSuccess("Entreprise ajoutée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to add company';
      showError(errorMessage);

    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
  if (!editedCompany) return;

  setIsLoading(true);
  setOperationError(null);
  setFormErrors({});
  
  try {
    const response = await apiFetch(`${API_BASE_URL}/${editedCompany.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(editedCompany), // Send the full object with id
    });

    if (!response.ok) {
      if (response.status === 400) {
        // Check if response is JSON before parsing
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
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
        } else {
          // Handle non-JSON responses (like HTML error pages)
          const errorText = await response.text();
          showError("Une erreur s'est produite lors de la modification. Veuillez réessayer.");
        }
        return;
      }
      
      if (response.status === 404) {
        showError("L'entreprise que vous essayez de modifier n'existe pas.");
        return;
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    // For 204 No Content responses, we don't need to parse JSON
    if (response.status === 204) {
      // Refresh the companies list
      const updatedResponse = await apiFetch(API_BASE_URL);
      if (updatedResponse.ok) {
        const updatedData = await updatedResponse.json();
        setCompanies(updatedData);
      }

      setEditModalOpen(false);
      setEditedCompany(null);
      showSuccess("Entreprise modifiée avec succès!");
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Failed to update company';
    showError(errorMessage);
  } finally {
    setIsLoading(false);
  }
};

  const handleDelete = async () => {
    if (!companyToDelete) return;

    setIsLoading(true);
    setOperationError(null);
    try {
      const response = await apiFetch(`${API_BASE_URL}/${companyToDelete}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      setCompanies(companies.filter(c => c.id !== companyToDelete));
      setDeleteConfirmOpen(false);
      showSuccess("Entreprise supprimée avec succès!");
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete company';
      showError(errorMessage);
    } finally {
      setIsLoading(false);
      setCompanyToDelete(null);
    }
  };

  const openEditModal = (company: Company) => {
    setCurrentCompany(company);
    setEditedCompany({...company});
    setEditModalOpen(true);
    setOperationError(null);
    setFormErrors({});
  };

  const confirmDelete = (id: number) => {
    setCompanyToDelete(id);
    setDeleteConfirmOpen(true);
    setOperationError(null);
  };

  const clearAllFilters = () => {
    setSearchTerm('');
  };

  if (isLoading && companies.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-极速600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 overflow-auto">
      {/* Notification messages */}
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
                <p className="mt-1极速 text-sm text-red-700">{operationError}</p>
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
              className="bg-green-50 border border-green-200 rounded-lg shadow-sm p极速-4 flex items-start"
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
            {searchTerm && (
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
          <div className="p-4 md:p-6">
            {/* Search Input */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Recherche</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MagnifyingGlassIcon className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Rechercher par nom..."
                  className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Active filters display */}
        {searchTerm && (
          <div className="px-4 py-3 bg-slate-50 border-t border-slate-100">
            <div className="极速flex flex-wrap gap-2">
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-teal-100 text-teal-800">
                Recherche: "{searchTerm}"
                <button
                  onClick={() => setSearchTerm('')}
                  className="ml-1 text-teal-600 hover:text-teal-800"
                >
                  <XMarkIcon className="h-3 w-3" />
                </button>
              </span>
            </div>
          </div>
        )}
      </motion.div>

      {/* Companies Table */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
      >
        <div className="px-4 py-3 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <h2 className="font-semibold text-slate-800 text-lg">Entreprises d'assurance</h2>
          <div className="flex items-center space-x-3">
            <p className="text-sm text-slate-500">
              {filteredCompanies.length} {filteredCompanies.length === 1 ? 'entreprise trouvée' : 'entreprises trouvées'}
              {searchTerm && ` (${companies.length} au total)`}
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
                  <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Nom</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredCompanies.length > 0 ? (
                  filteredCompanies.map(company => (
                    <tr key={company.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="font-medium text-slate-900">{company.name}</div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => openEditModal(company)}
                            className="text-blue-600 hover:text-blue-800 transition-colors p-1"
                            title="Modifier"
                          >
                            <PencilIcon className="h-5 w-5" />
                          </motion.button>

                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => confirmDelete(company.id)}
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
                    <td colSpan={2} className="px-6 py-8 text-center text-slate-500">
                      <MagnifyingGlassIcon className="h-12 w-12 text-slate-300 mx-auto mb-4" />
                      <p className="text-lg font-medium">Aucune entreprise trouvée</p>
                      <p className="text-sm mt-1">
                        {searchTerm
                          ? "Essayez de modifier votre recherche."
                          : "Commencez par ajouter une nouvelle entreprise."}
                      </p>
                      <div className="mt-6">
                        <button
                          onClick={() => {
                            if (searchTerm) {
                              clearAllFilters();
                            } else {
                              setAddModalOpen(true);
                            }
                          }}
                          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-teal-600 hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-teal-500"
                        >
                          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                          {searchTerm
                            ? "Effacer la recherche"
                            : "Ajouter une entreprise"}
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

      {/* Add Company Modal */}
      {addModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Ajouter une nouvelle entreprise</h3>
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
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Nom *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({...newCompany, name: e.target.value})}
                  required
                  disabled={isLoading}
                />
                {formErrors.name && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.name.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['name'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['name'].includes(key))
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
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-medium text-slate-700 hover:极速bg-slate-50 transition-colors"
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
                    <svg className="animate-spin -ml-1 mr极速-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/s极速vg" fill="none" viewBox="0 0 24 24">
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

      {/* Edit Company Modal */}
      {editModalOpen && editedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
          >
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium text-slate-800">Modifier l'entreprise</h3>
              <button 
                onClick={() => {
                  setEditModalOpen(false);
                  setFormErrors({});
                  setEditedCompany(null);
                }}
                className="text-slate-500 hover:text-slate-700 transition-colors"
                disabled={isLoading}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Name field */}
              <div>
                <label className="block text-sm font-medium text-slate-700">Nom *</label>
                <input
                  type="text"
                  className={`mt-1 block w-full rounded-lg border-slate-300 shadow-sm focus:border-teal-500 focus:ring-teal-500 transition-all ${
                    formErrors.name ? 'border-red-500' : ''
                  }`}
                  value={editedCompany.name}
                  onChange={(e) => setEditedCompany({...editedCompany, name: e.target.value})}
                  disabled={isLoading}
                />
                {formErrors.name && (
                  <div className="mt-1 text-sm text-red-600">
                    {formErrors.name.map((error, index) => (
                      <p key={index}>{error}</p>
                    ))}
                  </div>
                )}
              </div>
              
              {/* Display general errors not tied to specific fields */}
              {Object.keys(formErrors).filter(key => 
                !['name'].includes(key)
              ).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
                  <h4 className="text-sm font-medium text-red-800">Erreurs de validation</h4>
                  {Object.entries(formErrors)
                    .filter(([key]) => !['name'].includes(key))
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
                  setEditedCompany(null);
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
                      <circle className="opacity-25极速" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 极速0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
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
      className="bg-white rounded-xl p-4 md:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto border border-slate-200"
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
      
      {companyToDelete && (
        <>
          {/* Show which company is being deleted */}
          <div className="mb-4 p-3 bg-slate-50 rounded-md">
            <p className="font-medium text-slate-900">
              Entreprise à supprimer: 
            </p>
            {companies.find(company => company.id === companyToDelete) && (
              <p className="text-sm text-slate-600">
                {companies.find(company => company.id === companyToDelete)?.name}
              </p>
            )}
          </div>
          
          <p className="mb-6 text-slate-700">
            Êtes-vous sûr de vouloir supprimer cette entreprise ? Cette action est irréversible.
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

export default CompagniesPage;