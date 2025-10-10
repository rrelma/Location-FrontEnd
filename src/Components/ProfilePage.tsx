import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowLeftIcon,
  UserCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/24/outline';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const apiUrl = import.meta.env.VITE_API_URL;

  const [originalProfile, setOriginalProfile] = useState<UserProfile>({
    id: 0,
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [profile, setProfile] = useState<UserProfile>({
    id: 0,
    username: '',
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [editMode, setEditMode] = useState({
    username: false,
    email: false,
    password: false
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  
  // Notification states
  const [operationError, setOperationError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

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

  // Fetch user data from API on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      setIsLoading(true);
      try {
        // Get user ID from session storage
        const userid = sessionStorage.getItem('userid');

        if (!userid) {
          throw new Error('No user ID found in session');
        }

        const response = await fetch(`${apiUrl}/api/profile/${userid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (!response.ok) {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        
        // Update both original and current profile with data from API
        const updatedProfile = {
          id: userData.id || 0,
          username: userData.username || '',
          email: userData.email || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        };
        
        setOriginalProfile(updatedProfile);
        setProfile(updatedProfile);

      } catch (error) {
        showError('Failed to load profile data. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate]);

  const handleSave = async (field: keyof typeof editMode) => {
    setIsLoading(true);
    setErrors({});
    setOperationError(null);
    
    try {
        const userId = sessionStorage.getItem('userid');
        if (!userId) {
            throw new Error('No user ID found in session');
        }

        let updateData: any = { id: parseInt(userId) };
        
        if (field === 'username') {
            updateData = { 
                id: parseInt(userId),
                username: profile.username 
            };
        } else if (field === 'email') {
            updateData = { 
                id: parseInt(userId),
                email: profile.email 
            };
        } else if (field === 'password') {
            if (profile.newPassword !== profile.confirmPassword) {
                showError('Les nouveaux mots de passe ne correspondent pas');
                setIsLoading(false);
                return;
            }
            updateData = {
                id: parseInt(userId),
                password: profile.newPassword
            };
        }

        const response = await fetch(`${apiUrl}/api/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });
        
        // Handle non-JSON responses gracefully
        let errorData;
        try {
            errorData = await response.json();
        } catch (jsonError) {
            // If response is not JSON, create a simple error object
            errorData = {
                message: `HTTP error! status: ${response.status}`,
                status: response.status
            };
        }
        
        if (!response.ok) {
            let errorMessage = `Échec de la mise à jour de ${field}`;
            
            if (response.status === 400 && errorData.errors) {
                const validationErrors: Record<string, string[]> = {};
                for (const [key, value] of Object.entries(errorData.errors)) {
                    if (Array.isArray(value)) {
                        const cleanKey = key.includes('.') ? key.split('.').pop()! : key;
                        validationErrors[cleanKey] = value as string[];
                    }
                }
                setErrors(validationErrors);
                
                // Show the first validation error
                const firstError = Object.values(validationErrors)[0]?.[0];
                if (firstError) {
                  showError(firstError);
                }
                
                // Revert to original values on error
                setProfile(originalProfile);
                return;
            }
            
            errorMessage = errorData.title || errorData.message || errorMessage;
            
            // Revert to original values on error
            setProfile(originalProfile);
            throw new Error(errorMessage);
        }

        // Update original profile with the new values on success
        setOriginalProfile(prev => ({
            ...prev,
            username: field === 'username' ? profile.username : prev.username,
            email: field === 'email' ? profile.email : prev.email
        }));
        
        setEditMode(prev => ({ ...prev, [field]: false }));
        
        // Show success notification
        const fieldName = field === 'username' ? 'Nom d\'utilisateur' : 
                         field === 'email' ? 'Email' : 'Mot de passe';
        
        showSuccess(`${fieldName} mis à jour avec succès!`);

        // Clear password fields after successful update
        if (field === 'password') {
            setProfile(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
            
            setOriginalProfile(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        }

    } catch (error: any) {
        // Revert to original values on error
        setProfile(originalProfile);
        showError(error.message || `Échec de la mise à jour de ${field}. Veuillez réessayer.`);
    } finally {
        setIsLoading(false);
    }
  };

  const handleCancel = (field: keyof typeof editMode) => {
    // Revert to original values when canceling
    setProfile(originalProfile);
    setEditMode(prev => ({ ...prev, [field]: false }));
    setErrors({});
    setOperationError(null);
  };

  if (isLoading && !profile.username) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Chargement du profil...</p>
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
              <ExclamationCircleIcon className="h-6 w-6 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
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

      {/* Floating decorative elements */}
      <div className="absolute top-10 left-10 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-10 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute bottom-10 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      {/* Main content */}
      <div className="relative z-10">
        <main className="p-4 lg:p-6">
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl shadow-sm overflow-hidden border border-slate-100"
          >
            <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center">
              <div className="flex items-center">
                <button
                  onClick={() => navigate(-1)}
                  className="flex items-center text-slate-600 hover:text-slate-900 mr-4 transition-colors duration-200"
                >
                  <ArrowLeftIcon className="h-5 w-5 mr-1" />
                  Retour
                </button>
                <h2 className="text-xl font-semibold text-slate-800">Profil Utilisateur</h2>
              </div>
            </div>

            <div className="p-6">
              {/* Profile Header */}
              <div className="text-center mb-8">
                <div className="h-24 w-24 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 text-4xl font-bold mb极速-4 mx-auto">
                  <UserCircleIcon className="h-20 w-20" />
                </div>
                <h1 className="text-2xl font-bold text-slate-800">
                  @{profile.username}
                </h1>
                <p className="text-slate-600">{profile.email}</p>
              </div>
              
              {/* Tab Navigation */}
              <div className="border-b border-slate-200 mb-6">
                <nav className="flex -mb-px">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className={`py-3 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'profile'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Informations du profil
                  </button>
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`py-3 px-6 text-center border-b-2 font-medium text-sm ${
                      activeTab === 'security'
                        ? 'border-teal-500 text-teal-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    Sécurité
                  </button>
                </nav>
              </div>
              
              {/* Profile Details */}
              <div className="space-y-6">
                {activeTab === 'profile' ? (
                  <>
                    {/* Username Section */}
                    <div className="border-b border-slate-200 pb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-slate-800">Nom d'utilisateur</h2>
                        {!editMode.username ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditMode(prev => ({ ...prev, username: true }))}
                            className="flex items-center px-3 py-1 text-teal-600 hover:text-teal-700 transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </motion.button>
                        ) : (
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSave('username')}
                              disabled={isLoading}
                              className="flex items-center px-2 py-1 text-green-600 hover:text-green-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Sauvegarder
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancel('username')}
                              className="flex items-center px-2 py-1 text-red-600 hover:text-red-700 transition-colors duration-200"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Annuler
                            </motion.button>
                          </div>
                        )}
                      </div>
                      
                      {editMode.username ? (
                        <div>
                          <input
                            type="text"
                            value={profile.username}
                            onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all ${
                              errors.username ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          {errors.username && (
                            <p className="mt-1 text-sm text-red-600">{errors.username[0]}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-600">@{profile.username}</p>
                      )}
                    </div>
                    
                    {/* Email Section */}
                    <div className="border-b border-slate-200 pb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-slate-800">Adresse email</h2>
                        {!editMode.email ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditMode(prev => ({ ...prev, email: true }))}
                            className="flex items-center px-3 py-1 text-teal-600 hover:text-teal-700 transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Modifier
                          </motion.button>
                        ) : (
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSave('email')}
                              disabled={isLoading}
                              className="flex items-center px-2 py-1 text-green-600 hover:text-green-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Sauvegarder
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancel('email')}
                              className="flex items-center px-2 py-1 text-red-600 hover:text-red-700 transition-colors duration-200"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Annuler
                            </motion.button>
                          </div>
                        )}
                      </div>
                      
                      {editMode.email ? (
                        <div>
                          <input
                            type="email"
                            value={profile.email}
                            onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                            className={`w-full px-3 py-2 border rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all ${
                              errors.email ? 'border-red-500' : 'border-slate-300'
                            }`}
                          />
                          {errors.email && (
                            <p className="mt-1 text-sm text-red-600">{errors.email[0]}</p>
                          )}
                        </div>
                      ) : (
                        <p className="text-slate-600">{profile.email}</p>
                      )}
                    </div>
                  </>
                ) : (
                  /* Security Tab */
                  <div className="space-y-6">
                    <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded-lg">
                      <div className="flex">
                        <div className="flex-shrink-0">
                          <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                        </div>
                        <div className="ml-3">
                          <p className="text-sm text-yellow-700">
                            Pour votre sécurité, veuillez garder votre mot de passe confidentiel et le mettre à jour régulièrement.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Password Section */}
                    <div className="border-b border-slate-200 pb-6">
                      <div className="flex justify-between items-center mb-4">
                        <h2 className="text-lg font-medium text-slate-800">Changer le mot de passe</h2>
                        {!editMode.password ? (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setEditMode(prev => ({ ...prev, password: true }))}
                            className="flex items-center px-3 py-1 text-teal-600 hover:text-teal-700 transition-colors duration-200"
                          >
                            <PencilIcon className="h-4 w-4 mr-1" />
                            Changer
                          </motion.button>
                        ) : (
                          <div className="flex space-x-2">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleSave('password')}
                              disabled={isLoading}
                              className="flex items-center px-2 py-1 text-green-600 hover:text-green-700 transition-colors duration-200 disabled:opacity-50"
                            >
                              <CheckIcon className="h-4 w-4 mr-1" />
                              Mettre à jour
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleCancel('password')}
                              className="flex items-center px-2 py-1 text-red-600 hover:text-red-700 transition-colors duration-200"
                            >
                              <XMarkIcon className="h-4 w-4 mr-1" />
                              Annuler
                            </motion.button>
                          </div>
                        )}
                      </div>
                      
                      {editMode.password && (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Mot de passe actuel</label>
                            <div className="relative">
                              <input
                                type={showPassword.current ? "text" : "password"}
                                value={profile.currentPassword}
                                onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                              >
                                {showPassword.current ? (
                                  <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Nouveau mot de passe</label>
                            <div className="relative">
                              <input
                                type={showPassword.new ? "text" : "password"}
                                value={profile.newPassword}
                                onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-teal-500 focus:border-teal-500 transition-all"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                              >
                                {showPassword.new ? (
                                  <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>
                          
                          <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1">Confirmer le nouveau mot de passe</label>
                            <div className="relative">
                              <input
                                type={showPassword.confirm ? "text极速" : "password"}
                                value={profile.confirmPassword}
                                onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus极速:ring-teal-500 focus:border-teal-500 transition-all"
                              />
                              <button
                                type="button"
                                className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                              >
                                {showPassword.confirm ? (
                                  <EyeSlashIcon className="h-5 w-5 text-slate-400" />
                                ) : (
                                  <EyeIcon className="h-5 w-5 text-slate-400" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </main>
      </div>

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
        .animation-del极速ay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
};

export default ProfilePage;