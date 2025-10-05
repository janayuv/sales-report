import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, Building2, Plus, Check } from 'lucide-react';
import { Company } from '@/types/company';
import { dbService } from '@/services/database';
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext';
import { useNavigate } from 'react-router-dom';

interface CompanySelectorProps {
  onAddCompany?: () => void;
}

export function CompanySelector({ onAddCompany }: CompanySelectorProps) {
  const { selectedCompany, setSelectedCompany, isLoading } =
    useSelectedCompany();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    loadCompanies();
  }, []);

  const loadCompanies = async () => {
    try {
      // First try a health check
      const isHealthy = await dbService.healthCheck();
      if (!isHealthy) {
        console.log('Database health check failed, attempting to unlock...');
        await dbService.forceUnlock();
      }
      
      const result = await dbService.getCompanies();
      setCompanies(result);
    } catch (err) {
      console.error('Failed to load companies:', err);
      
      // If it's a database lock error, try to unlock and retry once
      if (err instanceof Error && err.message.includes('database is locked')) {
        try {
          console.log('Retrying after database unlock...');
          await dbService.forceUnlock();
          const result = await dbService.getCompanies();
          setCompanies(result);
        } catch (retryErr) {
          console.error('Failed to load companies after retry:', retryErr);
        }
      }
    }
  };

  const handleSelectCompany = async (company: Company) => {
    try {
      await setSelectedCompany(company);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to select company:', err);
    }
  };

  const handleClearSelection = async () => {
    try {
      await setSelectedCompany(null);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to clear selection:', err);
    }
  };

  const formatGstSnippet = (gstNo: string) => {
    if (gstNo.length <= 8) return gstNo;
    return `${gstNo.substring(0, 4)}...${gstNo.substring(gstNo.length - 4)}`;
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm text-muted-foreground">Loading...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" className="gap-2 h-8">
            <Building2 className="h-4 w-4" />
            {selectedCompany ? (
              <span className="max-w-32 truncate">
                {selectedCompany.company_name}
              </span>
            ) : (
              <span>Select Company</span>
            )}
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-64">
          {companies.length === 0 ? (
            <DropdownMenuItem disabled>
              <div className="text-center py-2">
                <Building2 className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No companies found
                </p>
                <p className="text-xs text-muted-foreground">
                  Add your first company to get started
                </p>
              </div>
            </DropdownMenuItem>
          ) : (
            companies.map(company => (
              <DropdownMenuItem
                key={company.id}
                onClick={() => handleSelectCompany(company)}
                className="flex items-center justify-between"
              >
                <div className="flex flex-col items-start">
                  <span className="font-medium">{company.company_name}</span>
                  <span className="text-xs text-muted-foreground">
                    GST: {formatGstSnippet(company.gst_no)} •{' '}
                    {company.state_code}
                  </span>
                </div>
                {selectedCompany?.id === company.id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </DropdownMenuItem>
            ))
          )}

          {companies.length > 0 && <DropdownMenuSeparator />}

          <DropdownMenuItem
            onClick={() => {
              setIsOpen(false);
              if (onAddCompany) {
                onAddCompany();
              } else {
                navigate('/companies');
              }
            }}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Company...
          </DropdownMenuItem>

          {selectedCompany && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearSelection}>
                Clear Selection
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedCompany && (
        <Badge variant="secondary" className="text-xs">
          {selectedCompany.state_code}
        </Badge>
      )}
    </div>
  );
}
