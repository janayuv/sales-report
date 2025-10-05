import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Check, X, AlertTriangle, Users } from 'lucide-react';
import { Customer, Category } from '@/types/customer';
import { CustomerMapping } from '@/types/import-report';
import { useToast } from '@/hooks/use-toast';

interface CustomerMappingProps {
  reportCustomerName: string;
  existingCustomers: Customer[];
  categories: Category[];
  onMappingComplete: (mapping: CustomerMapping) => void;
  onCancel: () => void;
}

/**
 * Customer Mapping Component
 *
 * DROPDOWN MAPPING LOGIC:
 *
 * 1. Shows the report customer name that needs mapping
 * 2. Displays dropdown of existing Tally customers for selection
 * 3. Shows category dropdown for the selected customer
 * 4. Validates that both customer and category are selected
 * 5. Only allows import to proceed when mapping is confirmed
 * 6. Prevents data inconsistency by requiring explicit mapping
 *
 * This ensures that imported data is always linked to the correct
 * customer and category in our system, maintaining data integrity.
 */
export function CustomerMappingDialog({
  reportCustomerName,
  existingCustomers,
  categories,
  onMappingComplete,
  onCancel,
}: CustomerMappingProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null
  );
  const [selectedCategoryId, setSelectedCategoryId] = useState<number | null>(
    null
  );
  const [isValid, setIsValid] = useState(false);
  const { toast } = useToast();

  // Update validation when selections change
  useEffect(() => {
    setIsValid(selectedCustomerId !== null && selectedCategoryId !== null);
  }, [selectedCustomerId, selectedCategoryId]);

  const handleConfirm = () => {
    if (!isValid) {
      toast({
        variant: 'destructive',
        title: 'Incomplete Mapping',
        description:
          'Please select both a customer and category before confirming.',
      });
      return;
    }

    const mapping: CustomerMapping = {
      reportCustomerName,
      tallyCustomerId: selectedCustomerId!,
      categoryId: selectedCategoryId!,
    };

    onMappingComplete(mapping);
  };

  const selectedCustomer = existingCustomers.find(
    c => c.id === selectedCustomerId
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-2xl mx-4">
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <CardTitle>Customer Mapping Required</CardTitle>
          </div>
          <CardDescription>
            The customer "{reportCustomerName}" from the report doesn't exist in
            our system. Please map it to an existing customer and assign a
            category.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Report Customer Display */}
          <div className="p-4 bg-muted rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <Label className="text-sm font-medium">Report Customer</Label>
            </div>
            <Badge variant="outline" className="text-sm">
              {reportCustomerName}
            </Badge>
          </div>

          {/* Customer Selection */}
          <div className="space-y-2">
            <Label htmlFor="customer-select">Select Tally Customer</Label>
            <Select
              value={selectedCustomerId?.toString() || ''}
              onValueChange={value => setSelectedCustomerId(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose an existing customer..." />
              </SelectTrigger>
              <SelectContent>
                {existingCustomers.map(customer => (
                  <SelectItem key={customer.id} value={customer.id!.toString()}>
                    <div className="flex flex-col">
                      <span className="font-medium">
                        {customer.tally_customer}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        Report: {customer.report_customer}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category Selection */}
          <div className="space-y-2">
            <Label htmlFor="category-select">Select Category</Label>
            <Select
              value={selectedCategoryId?.toString() || ''}
              onValueChange={value => setSelectedCategoryId(parseInt(value))}
              disabled={!selectedCustomerId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a category..." />
              </SelectTrigger>
              <SelectContent>
                {categories.map(category => (
                  <SelectItem key={category.id} value={category.id!.toString()}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Mapping Preview */}
          {selectedCustomer && selectedCategoryId && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Check className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-800">
                  Mapping Preview
                </span>
              </div>
              <div className="text-sm text-green-700">
                <p>
                  <strong>Report Customer:</strong> {reportCustomerName}
                </p>
                <p>
                  <strong>→ Tally Customer:</strong>{' '}
                  {selectedCustomer.tally_customer}
                </p>
                <p>
                  <strong>→ Category:</strong>{' '}
                  {categories.find(c => c.id === selectedCategoryId)?.name}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={onCancel}>
              <X className="h-4 w-4 mr-2" />
              Cancel Import
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!isValid}
              className="bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 mr-2" />
              Confirm Mapping
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface CustomerMappingListProps {
  missingCustomers: string[];
  existingCustomers: Customer[];
  categories: Category[];
  onAllMappingsComplete: (mappings: CustomerMapping[]) => void;
  onCancel: () => void;
}

/**
 * Customer Mapping List Component
 *
 * Handles multiple customer mappings in sequence.
 * Ensures all customers are mapped before allowing import to proceed.
 */
export function CustomerMappingList({
  missingCustomers,
  existingCustomers,
  categories,
  onAllMappingsComplete,
  onCancel,
}: CustomerMappingListProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [completedMappings, setCompletedMappings] = useState<CustomerMapping[]>(
    []
  );
  const [isComplete, setIsComplete] = useState(false);

  const currentCustomer = missingCustomers[currentIndex];
  const isLastCustomer = currentIndex === missingCustomers.length - 1;

  const handleMappingComplete = (mapping: CustomerMapping) => {
    const newMappings = [...completedMappings, mapping];
    setCompletedMappings(newMappings);

    if (isLastCustomer) {
      setIsComplete(true);
      onAllMappingsComplete(newMappings);
    } else {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const handleCancel = () => {
    onCancel();
  };

  if (isComplete) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <Card className="w-full max-w-md mx-4">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              <CardTitle>All Customers Mapped</CardTitle>
            </div>
            <CardDescription>
              All {missingCustomers.length} customers have been successfully
              mapped. The import can now proceed.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedMappings.map((mapping, index) => (
                <div key={index} className="flex items-center gap-2 text-sm">
                  <Check className="h-3 w-3 text-green-500" />
                  <span>{mapping.reportCustomerName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span>
                    {
                      existingCustomers.find(
                        c => c.id === mapping.tallyCustomerId
                      )?.tally_customer
                    }
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <CustomerMappingDialog
      reportCustomerName={currentCustomer}
      existingCustomers={existingCustomers}
      categories={categories}
      onMappingComplete={handleMappingComplete}
      onCancel={handleCancel}
    />
  );
}
