import { useState } from 'react';
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Check,
  AlertTriangle,
  Users,
  Plus,
  UserPlus,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { ReportCustomer, CustomerMatch } from '@/types/import-report';
import { Customer, Category, CreateCustomer } from '@/types/customer';
import { useToast } from '@/hooks/use-toast';
import { dbService } from '@/services/database';
import { CustomerMatchingService } from '@/services/customer-matching';

interface ImportPreviewProps {
  reportCustomers: ReportCustomer[];
  existingCustomers: Customer[];
  categories: Category[];
  companyId: number;
  onVerificationComplete: (verifiedCustomers: ReportCustomer[]) => void;
  onCancel: () => void;
}

interface NewCustomerFormData {
  report_customer: string;
  tally_customer: string;
  gst_no: string;
  state_code: string;
  category_id: number | null;
}

export function ImportPreview({
  reportCustomers,
  existingCustomers,
  categories,
  companyId,
  onVerificationComplete,
  onCancel,
}: ImportPreviewProps) {
  const { toast } = useToast();
  
  const [customers, setCustomers] = useState<ReportCustomer[]>(reportCustomers);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [currentCustomer, setCurrentCustomer] = useState<ReportCustomer | null>(null);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerFormData>({
    report_customer: '',
    tally_customer: '',
    gst_no: '',
    state_code: '',
    category_id: null,
  });
  const [isCreatingCustomer, setIsCreatingCustomer] = useState(false);
  const [showBulkCreateDialog, setShowBulkCreateDialog] = useState(false);

  const unverifiedCount = customers.filter(c => c.status === 'unverified').length;
  const canProceed = unverifiedCount === 0;

  const handleMapToExisting = async (reportCustomer: ReportCustomer, match: CustomerMatch) => {
    try {
      // Save persistent mapping for future imports
      await dbService.savePersistentCustomerMapping(
        companyId,
        reportCustomer.name,
        match.customerId,
        'user_mapped'
      );

      setCustomers(prev =>
        prev.map(c =>
          c.reportCustomerId === reportCustomer.reportCustomerId
            ? { ...c, status: 'verified' as const, mappedCustomerId: match.customerId }
            : c
        )
      );

      toast({
        title: 'Customer Mapped',
        description: `"${reportCustomer.name}" mapped to "${match.name}" and saved for future imports`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Mapping Failed',
        description: 'Failed to save customer mapping',
      });
    }
  };

  const handleCreateNew = (reportCustomer: ReportCustomer) => {
    setCurrentCustomer(reportCustomer);
    setNewCustomerForm({
      report_customer: reportCustomer.name,
      tally_customer: reportCustomer.name,
      gst_no: '',
      state_code: '',
      category_id: categories.length > 0 ? categories[0].id! : null,
    });
    setShowCreateDialog(true);
  };

  const handleCreateCustomer = async () => {
    if (!currentCustomer || !newCustomerForm.category_id) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Form',
        description: 'Please fill in all required fields.',
      });
      return;
    }

    setIsCreatingCustomer(true);

    try {
      // Check for duplicates
      const duplicateCheck = CustomerMatchingService.checkForDuplicates(
        {
          report_customer: newCustomerForm.report_customer,
          gst_no: newCustomerForm.gst_no,
          state_code: newCustomerForm.state_code,
        },
        existingCustomers
      );

      if (duplicateCheck.hasDuplicates) {
        toast({
          variant: 'destructive',
          title: 'Potential Duplicate',
          description: duplicateCheck.warnings.join('; '),
        });
        setIsCreatingCustomer(false);
        return;
      }

      // Create the customer
      const customerData: CreateCustomer = {
        report_customer: newCustomerForm.report_customer.trim(),
        tally_customer: newCustomerForm.tally_customer.trim(),
        gst_no: newCustomerForm.gst_no?.trim() || '',
        state_code: newCustomerForm.state_code?.trim() || '',
        category_id: newCustomerForm.category_id,
        company_id: companyId,
      };

      const newCustomer = await dbService.createCustomer(customerData, 'import_session');

      // Save persistent mapping for the newly created customer
      await dbService.savePersistentCustomerMapping(
        companyId,
        currentCustomer.name,
        newCustomer.id!,
        'auto_created'
      );

      // Update the report customer status
      setCustomers(prev =>
        prev.map(c =>
          c.reportCustomerId === currentCustomer.reportCustomerId
            ? { ...c, status: 'verified' as const, createdCustomerId: newCustomer.id }
            : c
        )
      );

      toast({
        title: 'Customer Created',
        description: `New customer "${newCustomer.report_customer}" created and saved for future imports.`,
      });

      setShowCreateDialog(false);
      setCurrentCustomer(null);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Creation Failed',
        description: `Failed to create customer: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const handleBulkCreateAll = async () => {
    const unverifiedCustomers = customers.filter(c => c.status === 'unverified');
    
    if (unverifiedCustomers.length === 0) {
      return;
    }

    setIsCreatingCustomer(true);

    try {
      for (const customer of unverifiedCustomers) {
        const customerData: CreateCustomer = {
          report_customer: customer.name.trim(),
          tally_customer: customer.name.trim(),
          gst_no: '',
          state_code: '',
          category_id: categories.length > 0 ? categories[0].id! : 1,
          company_id: companyId,
        };

        const newCustomer = await dbService.createCustomer(customerData, 'import_session');

        // Save persistent mapping for the newly created customer
        await dbService.savePersistentCustomerMapping(
          companyId,
          customer.name,
          newCustomer.id!,
          'auto_created'
        );

        // Update the report customer status
        setCustomers(prev =>
          prev.map(c =>
            c.reportCustomerId === customer.reportCustomerId
              ? { ...c, status: 'verified' as const, createdCustomerId: newCustomer.id }
              : c
          )
        );
      }

      toast({
        title: 'Bulk Creation Complete',
        description: `Successfully created ${unverifiedCustomers.length} new customers.`,
      });

      setShowBulkCreateDialog(false);
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Bulk Creation Failed',
        description: `Failed to create customers: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    } finally {
      setIsCreatingCustomer(false);
    }
  };

  const getStatusBadge = (customer: ReportCustomer) => {
    switch (customer.status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Verified</Badge>;
      case 'error':
        return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge variant="secondary"><AlertTriangle className="w-3 h-3 mr-1" />Unverified</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Import Preview - Customer Verification
          </CardTitle>
          <CardDescription>
            All report customers must be verified before import can proceed. 
            Map to existing customers or create new ones.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              {customers.length - unverifiedCount} of {customers.length} customers verified
            </div>
            <div className="flex gap-2">
              {unverifiedCount > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setShowBulkCreateDialog(true)}
                  className="gap-2"
                >
                  <UserPlus className="h-4 w-4" />
                  Create All New ({unverifiedCount})
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Customer Verification Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Report Customer</TableHead>
                <TableHead>Sample Rows</TableHead>
                <TableHead>Detected Matches</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {customers.map((customer) => (
                <TableRow key={customer.reportCustomerId}>
                  <TableCell>
                    <div className="font-medium">{customer.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {customer.normalizedName}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{customer.sampleRowsCount}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.detectedMatches.length === 0 ? (
                        <span className="text-sm text-muted-foreground">No matches found</span>
                      ) : (
                        customer.detectedMatches.slice(0, 2).map((match) => (
                          <div key={match.customerId} className="flex items-center gap-2">
                            <Badge variant={match.matchType === 'exact' ? 'default' : 'secondary'}>
                              {match.matchType === 'exact' ? 'Exact' : `${Math.round(match.confidence * 100)}%`}
                            </Badge>
                            <span className="text-sm truncate">{match.name}</span>
                            {customer.status === 'unverified' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleMapToExisting(customer, match)}
                                className="h-6 px-2 text-xs"
                              >
                                Map
                              </Button>
                            )}
                          </div>
                        ))
                      )}
                      {customer.detectedMatches.length > 2 && (
                        <span className="text-xs text-muted-foreground">
                          +{customer.detectedMatches.length - 2} more
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {customer.status === 'unverified' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCreateNew(customer)}
                        className="gap-2"
                      >
                        <Plus className="h-3 w-3" />
                        Create New
                      </Button>
                    )}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(customer)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onCancel}>
          Cancel Import
        </Button>
        <Button
          onClick={() => onVerificationComplete(customers)}
          disabled={!canProceed}
          className="gap-2"
        >
          <Check className="h-4 w-4" />
          {canProceed ? 'Proceed with Import' : `${unverifiedCount} customers unverified`}
        </Button>
      </div>

      {/* Create Customer Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Create New Customer</DialogTitle>
            <DialogDescription>
              Create a new customer record for "{currentCustomer?.name}"
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="report_customer">Report Customer Name</Label>
              <Input
                id="report_customer"
                value={newCustomerForm.report_customer}
                onChange={(e) =>
                  setNewCustomerForm(prev => ({ ...prev, report_customer: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tally_customer">Tally Customer Name</Label>
              <Input
                id="tally_customer"
                value={newCustomerForm.tally_customer}
                onChange={(e) =>
                  setNewCustomerForm(prev => ({ ...prev, tally_customer: e.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="gst_no">GST Number</Label>
              <Input
                id="gst_no"
                value={newCustomerForm.gst_no}
                onChange={(e) =>
                  setNewCustomerForm(prev => ({ ...prev, gst_no: e.target.value }))
                }
                placeholder="Optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state_code">State Code</Label>
              <Input
                id="state_code"
                value={newCustomerForm.state_code}
                onChange={(e) =>
                  setNewCustomerForm(prev => ({ ...prev, state_code: e.target.value }))
                }
                placeholder="e.g., MH, GJ, KA"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={newCustomerForm.category_id?.toString() || ''}
                onValueChange={(value) =>
                  setNewCustomerForm(prev => ({ ...prev, category_id: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.length > 0 ? (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id!.toString()}>
                        {category.name}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-categories" disabled>
                      No categories available - Create categories in Customers page first
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCustomer} disabled={isCreatingCustomer}>
              {isCreatingCustomer ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create Customer & Verify
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bulk Create Dialog */}
      <Dialog open={showBulkCreateDialog} onOpenChange={setShowBulkCreateDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Create {unverifiedCount} New Customers</DialogTitle>
            <DialogDescription>
              This will create new customer records for all unverified report customers with default settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">Customers to be created:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {customers
                  .filter(c => c.status === 'unverified')
                  .map(customer => (
                    <div key={customer.reportCustomerId} className="text-sm">
                      • {customer.name}
                    </div>
                  ))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground">
              Default category: {categories.length > 0 ? categories[0].name : 'None'}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkCreateAll} disabled={isCreatingCustomer}>
              {isCreatingCustomer ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UserPlus className="h-4 w-4 mr-2" />
              )}
              Create All Customers
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
