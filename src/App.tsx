import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useState, createContext, useContext, useEffect } from 'react';
import './App.css';
import LoginForm from './Components/LoginForm';
import DashboardPage from './Components/DashboardPage';
import CarsPage from './Components/CarsPage';
import VignettesPage from './Components/VignettesPage';
import InsurancesPage from './Components/InsurancesPage';
import ClientsPage from './Components/ClientsPage';
import ProfilePage from './Components/ProfilePage';
import CompagniesPage from './Components/CompagniePage';
import { 
  BellIcon, 
  UserCircleIcon, 
  ChevronDownIcon, 
  HomeIcon,
  ArrowsRightLeftIcon,
  UsersIcon,
  ShieldCheckIcon,
  CheckBadgeIcon,
  ArrowRightOnRectangleIcon,
  XMarkIcon,
  Bars3Icon,
} from '@heroicons/react/24/outline';

type NotificationType = {
  message: string;
  type: 'success' | 'error';
};

type NotificationContextType = {
  showNotification: (notification: NotificationType) => void;
};

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

function App() {
  // Check localStorage for existing authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    const savedAuth = localStorage.getItem('isAuthenticated');
    return savedAuth === 'true';
  });
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationType[]>([]);

  // Save authentication state to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('isAuthenticated', isAuthenticated.toString());
  }, [isAuthenticated]);

  const showNotification = (notification: NotificationType) => {
    setNotifications(prev => [...prev, notification]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n !== notification));
    }, 3000);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      
      // Fermer les notifications si clic à l'extérieur
      if (!target.closest('.notifications-menu') && showNotifications) {
        setShowNotifications(false);
      }
      
      // Fermer le menu profil si clic à l'extérieur
      if (!target.closest('.profile-menu') && showProfileMenu) {
        setShowProfileMenu(false);
      }

      // Fermer le menu mobile si clic à l'extérieur
      if (!target.closest('.mobile-menu') && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileMenu, mobileMenuOpen]);

  const handleLogin = (username: string, password: string) => {
    if (username === "admin" && password === "pass") {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  // Composant ProtectedRoute
  const ProtectedRoute = ({ children }: { children: React.ReactElement }) => {
    if (!isAuthenticated) {
      return <Navigate to="/login" replace />;
    }
    return children;
  };

  // Wrapper de mise en page
  const LayoutWrapper = ({ children }: { 
    children: React.ReactNode 
  }) => {
    return (
      <NotificationContext.Provider value={{ showNotification }}>
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-teal-50 overflow-auto relative">
          {/* Floating decorative elements */}
          <div className="absolute top-10 left-10 w-72 h-72 bg-teal-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob"></div>
          <div className="absolute top-10 right-10 w-72 h-72 bg-blue-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-10 left-20 w-72 h-72 bg-emerald-100 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
          
          {/* Notifications globales - z-index très élevé */}
          <div className="fixed top-4 right-4 z-[1000] space-y-2">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg shadow-lg max-w-sm ${
                  notification.type === 'success'
                    ? 'bg-green-50 border border-green-200 text-green-800'
                    : 'bg-red-50 border border-red-200 text-red-800'
                }`}
              >
                <div className="flex items-start">
                  <div className="flex-shrink-0">
                    {notification.type === 'success' ? (
                      <CheckBadgeIcon className="h-5 w-5 text-green-400" />
                    ) : (
                      <XMarkIcon className="h-5 w-5 text-red-400" />
                    )}
                  </div>
                  <div className="ml-3">
                    <p className="text-sm font-medium">{notification.message}</p>
                  </div>
                  <button
                    onClick={() => setNotifications(prev => prev.filter((_, i) => i !== index))}
                    className="ml-4 flex-shrink-0"
                  >
                    <XMarkIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="relative z-10">
            {/* Barre de navigation supérieure */}
            <nav className="bg-white shadow-sm border-b border-slate-100 relative z-40">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                  {/* Logo and mobile menu button */}
                  <div className="flex items-center">
                    <button 
                      onClick={() => setMobileMenuOpen(true)}
                      className="lg:hidden p-1 rounded-md text-slate-500 hover:text-slate-600 mr-2"
                    >
                      <Bars3Icon className="h-6 w-6" />
                    </button>
                    <h1 className="text-xl font-bold text-teal-600">Location de voitures</h1>
                  </div>
                  
                  {/* Desktop navigation */}
                  <div className="hidden lg:flex items-center space-x-6">
                    {/* Navigation principale */}
                    <div className="flex space-x-1">
                      <NavLink 
                        to="/dashboard" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <HomeIcon className="w-5 h-5 mr-1" />
                        Tableau de bord
                      </NavLink>
                      <NavLink 
                        to="/cars" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ArrowsRightLeftIcon className="w-5 h-5 mr-1" />
                        Voitures
                      </NavLink>
                      <NavLink 
                        to="/clients" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <UsersIcon className="w-5 h-5 mr-1" />
                        Clients
                      </NavLink>
                      <NavLink 
                        to="/insurance" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <ShieldCheckIcon className="w-5 h-5 mr-1" />
                        Assurances
                      </NavLink>
                      <NavLink 
                        to="/vignette" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <CheckBadgeIcon className="w-5 h-5 mr-1" />
                        Vignettes
                      </NavLink>
                      <NavLink 
                        to="/compagnie" 
                        className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                      >
                        <CheckBadgeIcon className="w-5 h-5 mr-1" />
                        Entreprises
                      </NavLink>
                    </div>
                  </div>

                  {/* Contrôles utilisateur */}
                  <div className="flex items-center space-x-4">
                    {/* Menu déroulant Notifications */}
                    <div className="relative notifications-menu">
                      <button 
                        onClick={() => setShowNotifications(!showNotifications)} 
                        className="p-1 rounded-full text-slate-500 hover:text-slate-600 transition-colors relative"
                      >
                        <span className="sr-only">Voir les notifications</span>
                        <BellIcon className="h-6 w-6" />
                        <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                      </button>
                      
                      {/* Panneau des notifications */}
                      {showNotifications && (
                        <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 border border-slate-100">
                          <div className="px-4 py-3 border-b border-slate-100">
                            <p className="text-sm font-medium text-slate-700">Notifications</p>
                          </div>
                          <div className="max-h-96 overflow-y-auto">
                            <a href="#" className="block px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 border-b border-slate-100 transition-colors">
                              <div className="flex items-center">
                                <div className="flex-shrink-0">
                                  <span className="h-8 w-8 rounded-full bg-teal-100 flex items-center justify-center">
                                    <BellIcon className="h-5 w-5 text-teal-600" />
                                  </span>
                                </div>
                                <div className="ml-3">
                                  <p className="font-medium">Nouvelle demande de location</p>
                                  <p className="text-xs text-slate-500">Il y a 2 heures</p>
                                </div>
                              </div>
                            </a>
                          </div>
                          <a href="#" className="block px-4 py-2 text-sm text-center text-teal-600 hover:bg-slate-50 border-t border-slate-100 transition-colors">
                            Voir toutes les notifications
                          </a>
                        </div>
                      )}
                    </div>

                    {/* Menu déroulant Profil */}
                    <div className="relative profile-menu">
                      <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)} 
                        className="flex items-center space-x-2 focus:outline-none group"
                      >
                        <div className="flex items-center">
                          <UserCircleIcon className="h-8 w-8 text-slate-500 group-hover:text-slate-600 transition-colors" />
                          <span className="hidden lg:inline-block ml-2 text-sm font-medium text-slate-700 group-hover:text-slate-900 transition-colors">Admin</span>
                          <ChevronDownIcon className="hidden lg:inline-block ml-1 h-4 w-4 text-slate-500 group-hover:text-slate-600 transition-colors" />
                        </div>
                      </button>
                      
                      {/* Panneau du menu profil */}
                      {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-50 border border-slate-100">
                          <NavLink 
                            to="/profile"
                            className={({ isActive }) => `block px-4 py-2 text-sm transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-700 hover:bg-slate-100'}`}
                            onClick={() => setShowProfileMenu(false)}
                          >
                            Votre profil
                          </NavLink>
                          <button 
                            onClick={handleLogout}
                            className="block w-full text-left px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 transition-colors flex items-center"
                          >
                            <ArrowRightOnRectangleIcon className="h-4 w-4 mr-2" />
                            Déconnexion
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Mobile menu */}
              {mobileMenuOpen && (
                <div className="lg:hidden mobile-menu">
                  <div className="fixed inset-0 flex z-50">
                    <div className="fixed inset-0 bg-black bg-opacity-25" onClick={() => setMobileMenuOpen(false)}></div>
                    <div className="relative max-w-xs w-full bg-white shadow-xl pb-12 flex flex-col overflow-y-auto z-50">
                      <div className="px-4 pt-5 pb-2 flex">
                        <button
                          type="button"
                          className="-m-2 p-2 rounded-md p-2 inline-flex items-center justify-center text-slate-400"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <XMarkIcon className="h-6 w-6" />
                        </button>
                      </div>
                      <div className="border-t border-slate-200 py-6 px-4 space-y-6">
                        <NavLink 
                          to="/dashboard" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <HomeIcon className="w-5 h-5 mr-3" />
                          Tableau de bord
                        </NavLink>
                        <NavLink 
                          to="/cars" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ArrowsRightLeftIcon className="w-5 h-5 mr-3" />
                          Voitures
                        </NavLink>
                        <NavLink 
                          to="/clients" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <UsersIcon className="w-5 h-5 mr-3" />
                          Clients
                        </NavLink>
                        <NavLink 
                          to="/insurance" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <ShieldCheckIcon className="w-5 h-5 mr-3" />
                          Assurances
                        </NavLink>
                        <NavLink 
                          to="/vignette" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <CheckBadgeIcon className="w-5 h-5 mr-3" />
                          Vignettes
                        </NavLink>
                        <NavLink 
                          to="/compagnie" 
                          className={({ isActive }) => `flex items-center px-3 py-2 rounded-lg text-base font-medium transition-colors ${isActive ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-100'}`}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          <CheckBadgeIcon className="w-5 h-5 mr-3" />
                          Entreprises d'assurance
                        </NavLink>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </nav>

            {/* Contenu principal */}
            <main className="p-4 lg:p-6 overflow-y-auto relative z-10">
              {children}
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
            .animation-delay-2000 {
              animation-delay: 2s;
            }
            .animation-delay-4000 {
              animation-delay: 4s;
            }
          `}</style>
        </div>
      </NotificationContext.Provider>
    );
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          isAuthenticated ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <LoginForm 
            onLogin={handleLogin}
            setIsAuthenticated={setIsAuthenticated} 
            />
          )
        } />
        
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <DashboardPage/>
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/cars" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <CarsPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/profile" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <ProfilePage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/clients" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <ClientsPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        <Route 
          path="/insurance" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <InsurancesPage/>
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/Vignette" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <VignettesPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/compagnie" 
          element={
            <ProtectedRoute>
              <LayoutWrapper>
                <CompagniesPage />
              </LayoutWrapper>
            </ProtectedRoute>
          } 
        />
        
        <Route path="/" element={
          <Navigate to={isAuthenticated ? "/dashboard" : "/login"} replace />
        } />
      </Routes>
    </Router>
  );
}

export default App;