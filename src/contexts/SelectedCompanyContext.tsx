import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Company } from '@/types/company';
import { dbService } from '@/services/database';

interface SelectedCompanyContextType {
  selectedCompany: Company | null;
  setSelectedCompany: (company: Company | null) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const SelectedCompanyContext = createContext<SelectedCompanyContextType | undefined>(undefined);

export function SelectedCompanyProvider({ children }: { children: ReactNode }) {
  const [selectedCompany, setSelectedCompanyState] = useState<Company | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load selected company on mount
  useEffect(() => {
    loadSelectedCompany();
  }, []);

  const loadSelectedCompany = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const company = await dbService.getSelectedCompany();
      setSelectedCompanyState(company);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load selected company');
    } finally {
      setIsLoading(false);
    }
  };

  const setSelectedCompany = async (company: Company | null) => {
    try {
      setError(null);
      if (company) {
        await dbService.setSelectedCompany(company.id!);
        setSelectedCompanyState(company);
      } else {
        await dbService.clearSelectedCompany();
        setSelectedCompanyState(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to set selected company');
      throw err;
    }
  };

  return (
    <SelectedCompanyContext.Provider
      value={{
        selectedCompany,
        setSelectedCompany,
        isLoading,
        error,
      }}
    >
      {children}
    </SelectedCompanyContext.Provider>
  );
}

export function useSelectedCompany() {
  const context = useContext(SelectedCompanyContext);
  if (context === undefined) {
    throw new Error('useSelectedCompany must be used within a SelectedCompanyProvider');
  }
  return context;
}
