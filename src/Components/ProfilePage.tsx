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
  ExclamationTriangleIcon,
  TrashIcon
} from '@heroicons/react/24/outline';

type UserProfile = {
  id: number;
  username: string;
  email: string;
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

const ProfilePage = ({ setIsAuthenticated }: { setIsAuthenticated: (value: boolean) => void }) => {
  const navigate = useNavigate();
  
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
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

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

        const response = await fetch(`https://localhost:7079/api/profile/${userid}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include' // This sends the session cookie
        });
        console.log(userid," ++++++++");
        if (!response.ok) {
          // If unauthorized, redirect to login
          if (response.status === 401) {
            setIsAuthenticated(false);
            navigate('/login');
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const userData = await response.json();
        
        // Update profile with data from API
        setProfile(prev => ({
          ...prev,
          id: userData.id || 0,
          username: userData.username || '',
          email: userData.email || ''
        }));

       

      } catch (error) {
        console.error('Failed to fetch user data:', error);
        setErrors({ api: 'Failed to load profile data. Please try again.' });
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [navigate, setIsAuthenticated]);

  const handleSave = async (field: keyof typeof editMode) => {
    setIsLoading(true);
    setErrors({});
    
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
                setErrors({ password: 'New passwords do not match' });
                setIsLoading(false);
                return;
            }
            updateData = {
                id: parseInt(userId),
                password: profile.newPassword // Backend expects just "Password" field
            };
        }

        const response = await fetch(`https://localhost:7079/api/profile/${userId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(updateData)
        });

        console.log('Update response:', response.status, response.statusText);
        
        if (!response.ok) {
            // Try to get detailed error message
            let errorMessage = `Failed to update ${field}`;
            try {
                const errorData = await response.json();
                errorMessage = errorData.title || errorData.message || errorMessage;
                
                // Handle validation errors from ModelState
                if (errorData.errors) {
                    const validationErrors = Object.values(errorData.errors).flat();
                    errorMessage = validationErrors.join(', ') || errorMessage;
                }
            } catch (e) {
                errorMessage = response.statusText || errorMessage;
            }
            throw new Error(errorMessage);
        }

        setEditMode(prev => ({ ...prev, [field]: false }));
        setSuccessMessage(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
        setTimeout(() => setSuccessMessage(''), 3000);

        // Clear password fields after successful update
        if (field === 'password') {
            setProfile(prev => ({
                ...prev,
                currentPassword: '',
                newPassword: '',
                confirmPassword: ''
            }));
        }

    } catch (error: any) {
        console.error(`Failed to update ${field}:`, error);
        setErrors({ api: error.message || `Failed to update ${field}. Please try again.` });
    } finally {
        setIsLoading(false);
    }
};

  const handleCancel = (field: keyof typeof editMode) => {
    setEditMode(prev => ({ ...prev, [field]: false }));
    setErrors({});
    
    // Refetch original data from API
    const fetchOriginalData = async () => {
      try {
        const userId = sessionStorage.getItem('userid');
        if (!userId) return;

        const response = await fetch(`https://localhost:7079/api/users/${userId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include'
        });

        if (response.ok) {
          const userData = await response.json();
          setProfile(prev => ({
            ...prev,
            username: userData.username || '',
            email: userData.email || ''
          }));
        }
      } catch (error) {
        console.error('Failed to fetch original data:', error);
      }
    };

    fetchOriginalData();
  };

  const handleLogout = async () => {
    try {
      // Call logout API to clear server session
      await fetch('http://localhost:7079/api/logout', {
        method: 'POST',
        credentials: 'include'
      });
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear client-side session storage
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('userid');
      
      setIsAuthenticated(false);
      navigate('/login');
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Are you sure you want to delete your account? This action cannot be undone.')) {
      return;
    }

    try {
      const userId = sessionStorage.getItem('userid');
      if (!userId) {
        throw new Error('No user ID found in session');
      }

      const response = await fetch(`http://localhost:7079/api/users/${userId}`, {
        method: 'DELETE',
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Failed to delete account');
      }

      // Clear client-side storage and redirect
      sessionStorage.removeItem('username');
      sessionStorage.removeItem('userId');
      setIsAuthenticated(false);
      navigate('/register');
      
    } catch (error) {
      console.error('Account deletion failed:', error);
      setErrors({ api: 'Failed to delete account. Please try again.' });
    }
  };

  if (isLoading && !profile.username) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6 transition-colors duration-200"
        >
          <ArrowLeftIcon className="h-5 w-5 mr-2" />
          Back to Dashboard
        </button>
        
        <div className="bg-white shadow rounded-lg overflow-hidden">
          {/* Profile Header */}
          <div className="bg-indigo-700 px-6 py-8 text-center">
            <div className="h-24 w-24 rounded-full bg-white flex items-center justify-center text-indigo-700 text-4xl font-bold mb-4 mx-auto">
              <UserCircleIcon className="h-20 w-20" />
            </div>
            <h1 className="text-2xl font-bold text-white">
              @{profile.username}
            </h1>
            <p className="text-indigo-200">{profile.email}</p>
          </div>
          
          {/* Success Message */}
          {successMessage && (
            <div className="bg-green-50 border-l-4 border-green-400 p-4 mx-6 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <CheckIcon className="h-5 w-5 text-green-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-green-700">{successMessage}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Error Message */}
          {errors.api && (
            <div className="bg-red-50 border-l-4 border-red-400 p-4 mx-6 mt-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{errors.api}</p>
                </div>
              </div>
            </div>
          )}
          
          {/* Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('profile')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'profile'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab('security')}
                className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
                  activeTab === 'security'
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                Security
              </button>
            </nav>
          </div>
          
          {/* Profile Details */}
          <div className="px-6 py-6 space-y-6">
            {activeTab === 'profile' ? (
              <>
                {/* Username Section */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Username</h2>
                    {!editMode.username ? (
                      <button
                        onClick={() => setEditMode(prev => ({ ...prev, username: true }))}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave('username')}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 flex items-center transition-colors duration-200 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel('username')}
                          className="text-red-600 hover:text-red-900 flex items-center transition-colors duration-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editMode.username ? (
                    <div>
                      <input
                        type="text"
                        value={profile.username}
                        onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-600">@{profile.username}</p>
                  )}
                </div>
                
                {/* Email Section */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Email Address</h2>
                    {!editMode.email ? (
                      <button
                        onClick={() => setEditMode(prev => ({ ...prev, email: true }))}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Edit
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave('email')}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 flex items-center transition-colors duration-200 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Save
                        </button>
                        <button
                          onClick={() => handleCancel('email')}
                          className="text-red-600 hover:text-red-900 flex items-center transition-colors duration-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editMode.email ? (
                    <div>
                      <input
                        type="email"
                        value={profile.email}
                        onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  ) : (
                    <p className="text-gray-600">{profile.email}</p>
                  )}
                </div>
              </>
            ) : (
              /* Security Tab */
              <div className="space-y-6">
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <ExclamationTriangleIcon className="h-5 w-5 text-yellow-400" />
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-yellow-700">
                        For your security, please keep your password confidential and update it regularly.
                      </p>
                    </div>
                  </div>
                </div>
                
                {/* Password Section */}
                <div className="border-b border-gray-200 pb-6">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-medium text-gray-900">Change Password</h2>
                    {!editMode.password ? (
                      <button
                        onClick={() => setEditMode(prev => ({ ...prev, password: true }))}
                        className="text-indigo-600 hover:text-indigo-900 flex items-center transition-colors duration-200"
                      >
                        <PencilIcon className="h-4 w-4 mr-1" />
                        Change
                      </button>
                    ) : (
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleSave('password')}
                          disabled={isLoading}
                          className="text-green-600 hover:text-green-900 flex items-center transition-colors duration-200 disabled:opacity-50"
                        >
                          <CheckIcon className="h-4 w-4 mr-1" />
                          Update
                        </button>
                        <button
                          onClick={() => handleCancel('password')}
                          className="text-red-600 hover:text-red-900 flex items-center transition-colors duration-200"
                        >
                          <XMarkIcon className="h-4 w-4 mr-1" />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {editMode.password ? (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Current Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.current ? "text" : "password"}
                            value={profile.currentPassword}
                            onChange={(e) => setProfile({ ...profile, currentPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword({ ...showPassword, current: !showPassword.current })}
                          >
                            {showPassword.current ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.new ? "text" : "password"}
                            value={profile.newPassword}
                            onChange={(e) => setProfile({ ...profile, newPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword({ ...showPassword, new: !showPassword.new })}
                          >
                            {showPassword.new ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirm New Password</label>
                        <div className="relative">
                          <input
                            type={showPassword.confirm ? "text" : "password"}
                            value={profile.confirmPassword}
                            onChange={(e) => setProfile({ ...profile, confirmPassword: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 right-0 pr-3 flex items-center"
                            onClick={() => setShowPassword({ ...showPassword, confirm: !showPassword.confirm })}
                          >
                            {showPassword.confirm ? (
                              <EyeSlashIcon className="h-5 w-5 text-gray-400" />
                            ) : (
                              <EyeIcon className="h-5 w-5 text-gray-400" />
                            )}
                          </button>
                        </div>
                      </div>
                      {errors.password && (
                        <p className="text-red-500 text-sm">{errors.password}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-600">Last changed: 3 months ago</p>
                  )}
                </div>
                
                {/* Account Deletion Section */}
                <div className="border-b border-gray-200 pb-6">
                  <h2 className="text-lg font-medium text-gray-900 mb-4">Delete Account</h2>
                  <p className="text-gray-600 mb-4">
                    Once you delete your account, there is no going back. Please be certain.
                  </p>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex items-center text-red-600 hover:text-red-800 transition-colors duration-200"
                  >
                    <TrashIcon className="h-5 w-5 mr-1" />
                    Delete Account
                  </button>
                </div>
              </div>
            )}
            
            {/* Logout Button */}
            <div className="flex justify-end pt-4">
              <button
                onClick={handleLogout}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors duration-200"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;