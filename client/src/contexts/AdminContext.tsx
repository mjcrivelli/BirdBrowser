import { createContext, useContext, useState, ReactNode } from 'react';

interface AdminContextType {
  isAdminMode: boolean;
  adminPassword: string;
  setAdminMode: (password: string) => Promise<boolean>;
  exitAdminMode: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  const setAdminMode = async (password: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/admin/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      
      if (response.ok) {
        setIsAdminMode(true);
        setAdminPassword(password);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Admin verification failed:', error);
      return false;
    }
  };

  const exitAdminMode = () => {
    setIsAdminMode(false);
    setAdminPassword('');
  };

  return (
    <AdminContext.Provider value={{ isAdminMode, adminPassword, setAdminMode, exitAdminMode }}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
