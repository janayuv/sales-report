import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Plus,
  Users,
  AlertCircle,
  Download,
  Upload,
  FileSpreadsheet,
  Loader2,
} from 'lucide-react';
import { Customer, CreateCustomer, UpdateCustomer } from '@/types/customer';
import { CustomerForm } from './CustomerForm';
import { CustomerDataTable } from '@/components/CustomerDataTable';
import { Badge } from '@/components/ui/badge';
import { dbService } from '@/services/database';
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext';
import { CustomerExcelService } from '@/services/customer-excel';
import { useToast } from '@/hooks/use-toast';

export default function Customers() {
  const { selectedCompany } = useSelectedCompany();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Import/Export state
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    total: number;
    processed: number;
    status: string;
  } | null>(null);

  // Customer mappings state
  const [showMappingsDialog, setShowMappingsDialog] = useState(false);
  const [customerMappings, setCustomerMappings] = useState<any[]>([]);

  // Load customers when selected company changes
  useEffect(() => {
    if (selectedCompany) {
      loadCustomers();
    } else {
      setCustomers([]);
      setIsLoading(false);
    }
  }, [selectedCompany]);

  const loadCustomers = async () => {
    if (!selectedCompany) return;

    try {
      setIsLoading(true);
      setError(null);
      const result = await dbService.getCustomers(selectedCompany.id!);
      setCustomers(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load customers');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCustomer = async (customerData: CreateCustomer) => {
    if (!selectedCompany) return;

    try {
      setError(null);
      const customerWithCompany = {
        ...customerData,
        company_id: selectedCompany.id!,
      };
      const newCustomer = await dbService.createCustomer(customerWithCompany);
      setCustomers(prev => [newCustomer, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create customer'
      );
      throw err; // Re-throw to let form handle it
    }
  };

  const handleUpdateCustomer = async (
    id: number,
    customerData: UpdateCustomer
  ) => {
    if (!selectedCompany) return;

    try {
      setError(null);
      const updatedCustomer = await dbService.updateCustomer(
        id,
        customerData,
        selectedCompany.id!
      );
      setCustomers(prev =>
        prev.map(customer => (customer.id === id ? updatedCustomer : customer))
      );
      setShowForm(false);
      setEditingCustomer(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update customer'
      );
      throw err; // Re-throw to let form handle it
    }
  };

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
  };

  const loadCustomerMappings = async () => {
    if (!selectedCompany) return;
    
    try {
      const mappings = await dbService.getAllPersistentCustomerMappings(selectedCompany.id!);
      setCustomerMappings(mappings);
    } catch (error) {
      console.error('Failed to load customer mappings:', error);
    }
  };

  const handleViewMappings = async () => {
    await loadCustomerMappings();
    setShowMappingsDialog(true);
  };

  const handleDeleteMapping = async (reportCustomerName: string) => {
    if (!selectedCompany) return;
    
    try {
      await dbService.deletePersistentCustomerMapping(selectedCompany.id!, reportCustomerName);
      await loadCustomerMappings(); // Reload mappings
      toast({
        title: 'Mapping Deleted',
        description: `Mapping for "${reportCustomerName}" has been removed.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Delete Failed',
        description: 'Failed to delete customer mapping',
      });
    }
  };

  // Import/Export functions
  const handleDownloadTemplate = () => {
    try {
      CustomerExcelService.generateTemplate();
      toast({
        title: 'Template Downloaded',
        description: 'Customer template has been downloaded successfully.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Download Failed',
        description: 'Failed to download template. Please try again.',
      });
    }
  };

  const handleExportCustomers = () => {
    if (customers.length === 0) {
      toast({
        variant: 'destructive',
        title: 'No Data',
        description: 'No customers to export.',
      });
      return;
    }

    try {
      CustomerExcelService.exportCustomers(customers);
      toast({
        title: 'Export Successful',
        description: `${customers.length} customers exported successfully.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Export Failed',
        description: 'Failed to export customers. Please try again.',
      });
    }
  };

  const handleImportFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImportFile(file);
    }
  };

  const handleImportCustomers = async () => {
    if (!selectedCompany || !importFile) return;

    setIsImporting(true);
    setImportProgress({
      total: 0,
      processed: 0,
      status: 'Parsing Excel file...',
    });

    try {
      // Parse Excel file
      const parseResult =
        await CustomerExcelService.parseCustomerExcel(importFile);

      if (!parseResult.validation.isValid) {
        toast({
          variant: 'destructive',
          title: 'Import Failed',
          description: `Header validation failed: ${parseResult.validation.errors.join(', ')}`,
        });
        setIsImporting(false);
        setImportProgress(null);
        return;
      }

      setImportProgress({
        total: parseResult.data.length,
        processed: 0,
        status: 'Importing customers...',
      });

      // Import customers
      const importResult = await dbService.importCustomers(
        parseResult.data,
        selectedCompany.id!
      );

      if (importResult.success) {
        toast({
          title: 'Import Successful',
          description: `Successfully imported ${importResult.importedCount} customers.`,
        });
        // Reload customers
        await loadCustomers();
      } else {
        toast({
          variant: 'destructive',
          title: 'Import Completed with Errors',
          description: `Imported ${importResult.importedCount} customers. Errors: ${importResult.errors.slice(0, 3).join(', ')}${importResult.errors.length > 3 ? '...' : ''}`,
        });
        // Still reload to show imported customers
        await loadCustomers();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Import Failed',
        description: `Failed to import customers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
      setShowImportDialog(false);
      setImportFile(null);
    }
  };

  const handleCancelImport = () => {
    setShowImportDialog(false);
    setImportFile(null);
    setIsImporting(false);
    setImportProgress(null);
  };

  // Show message when no company is selected
  if (!selectedCompany) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No Company Selected</h3>
            <p className="text-muted-foreground">
              Please select a company from the Companies page to manage
              customers.
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading customers...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
            <p className="text-muted-foreground">
              Manage your customer information and categories
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleDownloadTemplate}
              className="gap-2"
            >
              <FileSpreadsheet className="h-4 w-4" />
              Template
            </Button>
            <Button
              variant="outline"
              onClick={handleExportCustomers}
              className="gap-2"
              disabled={customers.length === 0}
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowImportDialog(true)}
              className="gap-2"
            >
              <Upload className="h-4 w-4" />
              Import
            </Button>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
            <Button variant="outline" onClick={handleViewMappings} className="gap-2">
              <Users className="h-4 w-4" />
              View Mappings
            </Button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Customers Data Table */}
      {customers.length === 0 && !isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Users className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No customers yet</h3>
            <p className="text-muted-foreground text-center mb-4">
              Get started by adding your first customer
            </p>
            <Button onClick={() => setShowForm(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Customer
            </Button>
          </CardContent>
        </Card>
      ) : (
        <CustomerDataTable
          data={customers}
          onEdit={handleEdit}
          isLoading={isLoading}
        />
      )}

      {/* Customer Form Modal */}
      {showForm && (
        <CustomerForm
          customer={editingCustomer}
          onSubmit={
            editingCustomer
              ? data =>
                  handleUpdateCustomer(
                    editingCustomer.id!,
                    data as UpdateCustomer
                  )
              : data => handleCreateCustomer(data as CreateCustomer)
          }
          onClose={handleCloseForm}
        />
      )}

      {/* Import Dialog */}
      {showImportDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                Import Customers
              </CardTitle>
              <CardDescription>
                Upload an Excel file to import customers. Download the template
                first to see the required format.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="import-file">Select Excel File</Label>
                <Input
                  id="import-file"
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleImportFileChange}
                  disabled={isImporting}
                />
                {importFile && (
                  <p className="text-sm text-muted-foreground">
                    Selected: {importFile.name} (
                    {(importFile.size / 1024).toFixed(1)} KB)
                  </p>
                )}
              </div>

              {/* Import Progress */}
              {importProgress && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">
                      {importProgress.status}
                    </span>
                  </div>
                  {importProgress.total > 0 && (
                    <>
                      <div className="w-full bg-blue-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${(importProgress.processed / importProgress.total) * 100}%`,
                          }}
                        />
                      </div>
                      <p className="text-xs text-blue-600">
                        {importProgress.processed} of {importProgress.total}{' '}
                        customers processed
                      </p>
                    </>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={handleCancelImport}
                  disabled={isImporting}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportCustomers}
                  disabled={!importFile || isImporting}
                  className="gap-2"
                >
                  {isImporting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4" />
                  )}
                  {isImporting ? 'Importing...' : 'Import'}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Customer Mappings Dialog */}
      {showMappingsDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-background rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Customer Mappings</h2>
                  <p className="text-muted-foreground">
                    View and manage persistent customer mappings for future imports
                  </p>
                </div>
                <Button variant="outline" onClick={() => setShowMappingsDialog(false)}>
                  Close
                </Button>
              </div>

              {customerMappings.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No mappings yet</h3>
                    <p className="text-muted-foreground text-center">
                      Customer mappings will appear here after you verify customers during imports
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {customerMappings.map((mapping) => (
                    <Card key={mapping.id}>
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant={mapping.mappingType === 'user_mapped' ? 'default' : 'secondary'}>
                                {mapping.mappingType === 'user_mapped' ? 'User Mapped' : 'Auto Created'}
                              </Badge>
                              <span className="text-sm text-muted-foreground">
                                {new Date(mapping.updatedAt).toLocaleDateString()}
                              </span>
                            </div>
                            <div className="space-y-1">
                              <p className="font-medium">
                                <span className="text-muted-foreground">Report Customer:</span> {mapping.reportCustomerName}
                              </p>
                              <p className="text-sm text-muted-foreground">
                                <span className="text-muted-foreground">Mapped to Customer ID:</span> {mapping.mappedCustomerId}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteMapping(mapping.reportCustomerName)}
                            className="text-destructive hover:text-destructive"
                          >
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
