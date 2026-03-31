import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  MinusCircle, 
  Table as TableIcon, 
  History,
  HelpCircle,
  LogOut, 
  Sun, 
  Moon,
  Menu,
  X
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { auth } from '../firebase';
import { signOut, onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { theme, toggleTheme } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribe();
  }, []);

  const handleLogout = () => signOut(auth);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'input', label: 'Input Barang', icon: PlusCircle },
    { id: 'output', label: 'Output Barang', icon: MinusCircle },
    { id: 'table', label: 'Data Inventory', icon: TableIcon },
    { id: 'history-input', label: 'Riwayat Input', icon: History },
    { id: 'history-output', label: 'Riwayat Output', icon: History },
  ];

  if (!user) return <>{children}</>;

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100 transition-colors duration-300">
      {/* Sidebar */}
      <aside 
        className={cn(
          "fixed top-0 left-0 h-full bg-white dark:bg-neutral-900 border-r border-neutral-200 dark:border-neutral-800 transition-all duration-300 z-50",
          isSidebarOpen ? "w-64" : "w-20"
        )}
      >
        <div className="flex flex-col h-full">
          <div className="p-6 flex items-center justify-between">
            <AnimatePresence mode="wait">
              {isSidebarOpen && (
                <motion.span 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="font-bold text-xl tracking-tight text-primary-600 dark:text-primary-400"
                >
                  RIMPIL-TRACK
                </motion.span>
              )}
            </AnimatePresence>
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition-colors"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="flex-1 px-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={cn(
                  "w-full flex items-center p-3 rounded-xl transition-all duration-200 group",
                  activeTab === item.id 
                    ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 shadow-lg" 
                    : "hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-400"
                )}
              >
                <item.icon size={20} className={cn(activeTab === item.id ? "" : "group-hover:scale-110 transition-transform")} />
                {isSidebarOpen && (
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="ml-4 font-medium text-sm"
                  >
                    {item.label}
                  </motion.span>
                )}
              </button>
            ))}
          </nav>

          <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 space-y-1">
            <a
              href="mailto:aabhismab@gmail.com"
              className="w-full flex items-center p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              <HelpCircle size={20} />
              {isSidebarOpen && <span className="ml-4 font-medium text-sm">Help</span>}
            </a>
            <button
              onClick={toggleTheme}
              className="w-full flex items-center p-3 rounded-xl hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors text-neutral-600 dark:text-neutral-400"
            >
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              {isSidebarOpen && <span className="ml-4 font-medium text-sm">{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
            </button>
            <button
              onClick={handleLogout}
              className="w-full flex items-center p-3 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 transition-colors"
            >
              <LogOut size={20} />
              {isSidebarOpen && <span className="ml-4 font-medium text-sm">Logout</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main 
        className={cn(
          "transition-all duration-300 min-h-screen p-8",
          isSidebarOpen ? "ml-64" : "ml-20"
        )}
      >
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
