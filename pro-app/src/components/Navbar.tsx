import React from 'react';
import { NavLink } from 'react-router-dom';
import { Settings, Bell, Moon, Sun, MonitorSmartphone, Map } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

const Navbar: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = React.useState(false);

  // Détermine l'icône à afficher en fonction du thème actuel
  const getThemeIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <MonitorSmartphone className="h-5 w-5" />;
      default:
        return <Sun className="h-5 w-5" />;
    }
  };

  // Gestion du menu thème
  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    setMenuOpen(false);
  };
  
  return (
    <nav className="bg-secondary dark:bg-gray-800 shadow-md sticky top-0 z-10">
      <div className="container-app flex justify-between items-center">
        <NavLink to="/" className="text-xl font-bold text-white flex items-center gap-2 py-4">
          <Bell className="h-6 w-6" />
          <span>GreenSentinel Pro</span>
        </NavLink>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <button 
              onClick={() => setMenuOpen(!menuOpen)}
              className="p-2 rounded-full hover:bg-white/10 text-white"
              aria-label="Toggle theme menu"
            >
              {getThemeIcon()}
            </button>

            {/* Menu thème déroulant */}
            {menuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-700 rounded-md shadow-lg z-20 overflow-hidden">
                <button 
                  className={`flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${theme === 'light' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                  onClick={() => handleThemeChange('light')}
                >
                  <Sun className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-white">Clair</span>
                </button>
                <button 
                  className={`flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${theme === 'dark' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                  onClick={() => handleThemeChange('dark')}
                >
                  <Moon className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-white">Sombre</span>
                </button>
                <button 
                  className={`flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-600 ${theme === 'system' ? 'bg-gray-200 dark:bg-gray-600' : ''}`}
                  onClick={() => handleThemeChange('system')}
                >
                  <MonitorSmartphone className="h-4 w-4" />
                  <span className="text-gray-800 dark:text-white">Système</span>
                </button>
              </div>
            )}
          </div>
          
          <NavLink 
            to="/map" 
            className={({isActive}) => `p-2 rounded-full hover:bg-white/10 text-white ${isActive ? 'bg-white/20' : ''}`}
            aria-label="Carte"
          >
            <Map className="h-5 w-5" />
          </NavLink>
          
          <NavLink 
            to="/settings" 
            className={({isActive}) => `p-2 rounded-full hover:bg-white/10 text-white ${isActive ? 'bg-white/20' : ''}`}
            aria-label="Settings"
          >
            <Settings className="h-5 w-5" />
          </NavLink>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
