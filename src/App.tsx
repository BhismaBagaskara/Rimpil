import React, { useState, useEffect } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, User } from 'firebase/auth';
import Layout from './components/Layout';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import InventoryForm from './components/InventoryForm';
import InventoryTable from './components/InventoryTable';
import HistoryTable from './components/HistoryTable';
import ErrorBoundary from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-neutral-50 dark:bg-neutral-950">
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="w-12 h-12 border-4 border-neutral-900 dark:border-white border-t-transparent rounded-full animate-spin"
        />
      </div>
    );
  }

  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard />;
      case 'input':
        return <InventoryForm type="input" />;
      case 'output':
        return <InventoryForm type="output" />;
      case 'table':
        return <InventoryTable />;
      case 'history-input':
        return <HistoryTable type="input" />;
      case 'history-output':
        return <HistoryTable type="output" />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {renderContent()}
          </motion.div>
        </AnimatePresence>
      </Layout>
    </ErrorBoundary>
  );
}
