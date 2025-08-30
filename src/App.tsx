import { BrowserRouter as Router, Routes, Route, Navigate, NavLink } from 'react-router-dom';
import { useState } from 'react';
import './App.css';
import LoginForm from './Components/LoginForm';
import DashboardPage from './Components/DashboardPage';
import CarsPage from './Components/CarsPage';
import React, { useEffect } from 'react';
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
  CheckBadgeIcon ,
    AdjustmentsHorizontalIcon,
      ArrowRightOnRectangleIcon,


} from '@heroicons/react/24/outline';


function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

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
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showProfileMenu]);

  const handleLogin = (username: string, password: string) => {
    if (username === "admin" && password === "pass") {
      setIsAuthenticated(true);
      return true;
    }
    return false;
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
      <div className="flex flex-col min-h-screen bg-gray-50">
        {/* Barre de navigation supérieure */}
         <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex justify-between h-16 items-center">
              {/* Logo */}
              <div className="flex items-center">
                <h1 className="text-xl font-bold text-indigo-600">Location de voitures</h1>
              </div>
              
              {/* Navigation principale et contrôles utilisateur */}
              <div className="flex items-center space-x-6">
                {/* Navigation principale */}
                <div className="hidden lg:flex space-x-1">
                  <NavLink 
                    to="/dashboard" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <HomeIcon className="w-5 h-5 mr-1" />
                    Tableau de bord
                  </NavLink>
                  <NavLink 
                    to="/cars" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <ArrowsRightLeftIcon className="w-5 h-5 mr-1" />
                    Voitures
                  </NavLink>
                  <NavLink 
                    to="/clients" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <UsersIcon className="w-5 h-5 mr-1" />
                    Clients
                  </NavLink>
                  <NavLink 
                    to="/insurance" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <ShieldCheckIcon className="w-5 h-5 mr-1" />
                    Assurances
                  </NavLink>
                  <NavLink 
                    to="/vignette" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <CheckBadgeIcon className="w-5 h-5 mr-1" />
                    Vignettes
                  </NavLink>
                <NavLink 
                    to="/compagnie" 
                    className={({ isActive }) => `inline-flex items-center px-3 py-2 rounded-md text-sm font-medium ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-100'}`}
                  >
                    <CheckBadgeIcon className="w-5 h-5 mr-1" />
                    Entreprises d'assurance 
                  </NavLink>
                </div>

                {/* Bouton filtres mobile */}
                <div className="lg:hidden">
                  <button 
                    onClick={() => setMobileFiltersOpen(true)}
                    className="flex items-center px-3 py-2 text-sm bg-white rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
                  >
                    <AdjustmentsHorizontalIcon className="h-4 w-4 mr-1" />
                    Filtres
                  </button>
                </div>

                {/* Contrôles utilisateur */}
                <div className="flex items-center space-x-4">
                  {/* Menu déroulant Notifications */}
                  <div className="relative notifications-menu">
                    <button 
                      onClick={() => setShowNotifications(!showNotifications)} 
                      className="p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 relative"
                    >
                      <span className="sr-only">Voir les notifications</span>
                      <BellIcon className="h-6 w-6" />
                      <span className="absolute top-0 right-0 h-2 w-2 rounded-full bg-red-500"></span>
                    </button>
                    
                    {/* Panneau des notifications */}
                    {showNotifications && (
                      <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                        <div className="px-4 py-3 border-b">
                          <p className="text-sm font-medium text-gray-700">Notifications</p>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                          <a href="#" className="block px-4 py-3 text-sm text-gray-700 hover:bg-gray-100 border-b">
                            <div className="flex items-center">
                              <div className="flex-shrink-0">
                                <span className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                                  <BellIcon className="h-5 w-5 text-indigo-600" />
                                </span>
                              </div>
                              <div className="ml-3">
                                <p className="font-medium">Nouvelle demande de location</p>
                                <p className="text-xs text-gray-500">Il y a 2 heures</p>
                              </div>
                            </div>
                          </a>
                          {/* Autres éléments de notification... */}
                        </div>
                        <a href="#" className="block px-4 py-2 text-sm text-center text-indigo-600 hover:bg-gray-100 border-t">
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
                        <UserCircleIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-500" />
                        <span className="hidden lg:inline-block ml-2 text-sm font-medium text-gray-700 group-hover:text-gray-900">Admin</span>
                        <ChevronDownIcon className="hidden lg:inline-block ml-1 h-4 w-4 text-gray-400 group-hover:text-gray-500" />
                      </div>
                    </button>
                    
                    {/* Panneau du menu profil */}
                     {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-10">
                          <NavLink 
                            to="/profile"
                            className={({ isActive }) => `block px-4 py-2 text-sm ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700 hover:bg-gray-100'}`}
                          >
                            Votre profil
                          </NavLink>
                          <button 
                            onClick={() => setIsAuthenticated(false)}
                            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
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
          </div>
        </nav>

        {/* Contenu principal */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
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
                <DashboardPage setIsAuthenticated={setIsAuthenticated} />
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
                <ProfilePage setIsAuthenticated={setIsAuthenticated} />
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