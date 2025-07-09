import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface RecoveryContextProps {
  isRecoveryMode: boolean;
  setRecoveryMode: (mode: boolean) => void;
}

const RecoveryContext = createContext<RecoveryContextProps | undefined>(undefined);

export const useRecovery = () => {
  const context = useContext(RecoveryContext);
  if (!context) {
    throw new Error('useRecovery must be used within a RecoveryProvider');
  }
  return context;
};

interface RecoveryProviderProps {
  children: ReactNode;
}

export const RecoveryProvider = ({ children }: RecoveryProviderProps) => {
  const [isRecoveryMode, setIsRecoveryMode] = useState(false);

  const setRecoveryMode = (mode: boolean) => {
    console.log('🔄 Recovery mode:', mode);
    setIsRecoveryMode(mode);
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        console.log('🔒 Password recovery detected, entering recovery mode');
        setRecoveryMode(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <RecoveryContext.Provider value={{ isRecoveryMode, setRecoveryMode }}>
      {children}
    </RecoveryContext.Provider>
  );
};