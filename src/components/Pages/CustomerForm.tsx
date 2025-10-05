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
import { X, Save, Loader2, Plus, Check } from 'lucide-react';
import {
  Customer,
  CreateCustomer,
  UpdateCustomer,
  CustomerFormData,
  CustomerFormErrors,
  Category,
} from '@/types/customer';
import { dbService } from '@/services/database';
import { useToast } from '@/hooks/use-toast';
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext';

interface CustomerFormProps {
  customer?: Customer | null;
  onSubmit: (data: CreateCustomer | UpdateCustomer) => Promise<void>;
  onClose: () => void;
}

// Indian state codes for dropdown
const STATE_CODES = [
  '01',
  '02',
  '03',
  '04',
  '05',
  '06',
  '07',
  '08',
  '09',
  '10',
  '11',
  '12',
  '13',
  '14',
  '15',
  '16',
  '17',
  '18',
  '19',
  '20',
  '21',
  '22',
  '23',
  '24',
  '25',
  '26',
  '27',
  '28',
  '29',
  '30',
  '31',
  '32',
  '33',
  '34',
  '35',
  '36',
  '37',
  '38',
];

const STATE_NAMES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '28': 'Andhra Pradesh',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh (New)',
  '38': 'Ladakh',
};

export function CustomerForm({
  customer,
  onSubmit,
  onClose,
}: CustomerFormProps) {
  const { selectedCompany } = useSelectedCompany();
  const [formData, setFormData] = useState<CustomerFormData>({
    report_customer: '',
    tally_customer: '',
    gst_no: '',
    state_code: '',
    category_id: null,
  });
  const [originalData, setOriginalData] = useState<CustomerFormData>({
    report_customer: '',
    tally_customer: '',
    gst_no: '',
    state_code: '',
    category_id: null,
  });
  const [errors, setErrors] = useState<CustomerFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [categorySearch, setCategorySearch] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const { toast } = useToast();

  const isEditing = !!customer;

  useEffect(() => {
    if (selectedCompany) {
      loadCategories();
    }
    if (customer) {
      const initialData = {
        report_customer: customer.report_customer,
        tally_customer: customer.tally_customer,
        gst_no: customer.gst_no,
        state_code: customer.state_code,
        category_id: customer.category_id,
      };
      setFormData(initialData);
      setOriginalData(initialData);
    } else {
      const emptyData = {
        report_customer: '',
        tally_customer: '',
        gst_no: '',
        state_code: '',
        category_id: null,
      };
      setFormData(emptyData);
      setOriginalData(emptyData);
    }
  }, [customer, selectedCompany]);

  const loadCategories = async () => {
    if (!selectedCompany) return;

    try {
      const result = await dbService.getCategories(selectedCompany.id!);
      setCategories(result);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const validateForm = async (): Promise<boolean> => {
    const newErrors: CustomerFormErrors = {};

    // Report customer validation
    if (!formData.report_customer.trim()) {
      newErrors.report_customer = 'Report customer name is required';
    } else if (formData.report_customer.length > 255) {
      newErrors.report_customer =
        'Report customer name must be 255 characters or less';
    }

    // Tally customer validation
    if (!formData.tally_customer.trim()) {
      newErrors.tally_customer = 'Tally customer name is required';
    } else if (formData.tally_customer.length > 255) {
      newErrors.tally_customer =
        'Tally customer name must be 255 characters or less';
    } else {
      // Check for duplicate tally customer
      try {
        const excludeId = isEditing ? customer?.id : undefined;
        const tallyExists = await dbService.checkTallyCustomerExists(
          formData.tally_customer,
          selectedCompany?.id!,
          excludeId
        );
        if (tallyExists) {
          newErrors.tally_customer = 'Tally customer name must be unique';
        }
      } catch (error) {
        console.error('Error checking tally customer:', error);
        newErrors.tally_customer = 'Error validating tally customer name';
      }
    }

    // GST number validation (optional)
    if (formData.gst_no.trim() && !isValidGSTFormat(formData.gst_no)) {
      newErrors.gst_no =
        'GST number must be 15 characters and follow GST format';
    }

    // State code validation (optional)
    // No validation needed as it's optional

    // Category validation
    if (!formData.category_id) {
      newErrors.category_id = 'Category is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidGSTFormat = (gstNo: string): boolean => {
    const trimmed = gstNo.trim();
    return (
      trimmed.length === 15 &&
      !!trimmed.match(
        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[1-9A-Z]{1}$/
      )
    );
  };

  const hasFormChanges = (): boolean => {
    return (
      formData.report_customer.trim() !== originalData.report_customer.trim() ||
      formData.tally_customer.trim() !== originalData.tally_customer.trim() ||
      formData.gst_no.trim() !== originalData.gst_no.trim() ||
      formData.state_code.trim() !== originalData.state_code.trim() ||
      formData.category_id !== originalData.category_id
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check if there are any changes when editing
    if (isEditing && !hasFormChanges()) {
      toast({
        variant: 'default',
        title: 'No Changes',
        description: 'No changes have been made to save.',
      });
      return;
    }

    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await onSubmit({
          report_customer: formData.report_customer.trim(),
          tally_customer: formData.tally_customer.trim(),
          gst_no: formData.gst_no.trim() || undefined,
          state_code: formData.state_code.trim() || undefined,
          category_id: formData.category_id!,
        });

        toast({
          variant: 'success',
          title: 'Customer Updated',
          description: `${formData.report_customer} has been successfully updated.`,
        });
      } else {
        await onSubmit({
          report_customer: formData.report_customer.trim(),
          tally_customer: formData.tally_customer.trim(),
          gst_no: formData.gst_no.trim() || undefined,
          state_code: formData.state_code.trim() || undefined,
          category_id: formData.category_id!,
        });

        toast({
          variant: 'success',
          title: 'Customer Created',
          description: `${formData.report_customer} has been successfully created.`,
        });
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'An unexpected error occurred';
      toast({
        variant: 'destructive',
        title: isEditing ? 'Update Failed' : 'Creation Failed',
        description: errorMessage,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (
    field: keyof CustomerFormData,
    value: string | number
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const filteredCategories = (categories || [])
    .filter(
      (category): category is Category =>
        !!category && typeof category.name === 'string' && typeof category.id === 'number'
    )
    .filter(category =>
      category.name.toLowerCase().includes(categorySearch.toLowerCase())
    );

  const handleCategorySelect = (categoryId: number) => {
    handleInputChange('category_id', categoryId);
    const match = (categories || []).find(
      c => !!c && typeof c.id === 'number' && c.id === categoryId
    );
    setCategorySearch(match?.name || '');
    setShowCategoryInput(false);
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;

    setIsCreatingCategory(true);
    try {
      const newCategory = await dbService.createCategory({
        name: newCategoryName.trim(),
        company_id: selectedCompany?.id!,
      });
      setCategories(prev => [...prev, newCategory]);
      handleCategorySelect(newCategory.id!);
      setNewCategoryName('');
      setShowCategoryInput(false);

      toast({
        variant: 'success',
        title: 'Category Created',
        description: `Category "${newCategory.name}" has been created and selected.`,
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Category Creation Failed',
        description:
          error instanceof Error ? error.message : 'Failed to create category',
      });
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const selectedCategory = (categories || []).find(
    c => !!c && typeof c.id === 'number' && c.id === formData.category_id
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>
              {isEditing ? 'Edit Customer' : 'Add New Customer'}
            </CardTitle>
            <CardDescription>
              {isEditing
                ? 'Update customer information'
                : 'Enter customer details and category'}
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6" role="form">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Left Column */}
              <div className="space-y-4">
                {/* Report Customer */}
                <div className="space-y-2">
                  <Label htmlFor="report_customer">
                    Report Customer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="report_customer"
                    value={formData.report_customer}
                    onChange={e =>
                      handleInputChange('report_customer', e.target.value)
                    }
                    placeholder="Enter report customer name"
                    className={
                      errors.report_customer ? 'border-destructive' : ''
                    }
                    disabled={isSubmitting}
                    required
                    aria-describedby={
                      errors.report_customer
                        ? 'report_customer-error'
                        : undefined
                    }
                  />
                  {errors.report_customer && (
                    <p
                      id="report_customer-error"
                      className="text-sm text-destructive"
                    >
                      {errors.report_customer}
                    </p>
                  )}
                </div>

                {/* Tally Customer */}
                <div className="space-y-2">
                  <Label htmlFor="tally_customer">
                    Tally Customer <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="tally_customer"
                    value={formData.tally_customer}
                    onChange={e =>
                      handleInputChange('tally_customer', e.target.value)
                    }
                    placeholder="Enter tally customer name"
                    className={
                      errors.tally_customer ? 'border-destructive' : ''
                    }
                    disabled={isSubmitting}
                    required
                    aria-describedby={
                      errors.tally_customer ? 'tally_customer-error' : undefined
                    }
                  />
                  {errors.tally_customer && (
                    <p
                      id="tally_customer-error"
                      className="text-sm text-destructive"
                    >
                      {errors.tally_customer}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Must be unique - used for matching Tally imports
                  </p>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-4">
                {/* GST Number */}
                <div className="space-y-2">
                  <Label htmlFor="gst_no">GST Number</Label>
                  <Input
                    id="gst_no"
                    value={formData.gst_no}
                    onChange={e =>
                      handleInputChange('gst_no', e.target.value.toUpperCase())
                    }
                    placeholder="e.g., 07AABCU9603R1ZX"
                    className={errors.gst_no ? 'border-destructive' : ''}
                    disabled={isSubmitting}
                    maxLength={15}
                    aria-describedby={
                      errors.gst_no ? 'gst_no-error' : undefined
                    }
                  />
                  {errors.gst_no && (
                    <p id="gst_no-error" className="text-sm text-destructive">
                      {errors.gst_no}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Format: 2 digits (state) + 10 characters (PAN) + 3
                    characters (entity type)
                  </p>
                </div>

                {/* State Code */}
                <div className="space-y-2">
                  <Label htmlFor="state_code">State Code</Label>
                  <select
                    id="state_code"
                    value={formData.state_code}
                    onChange={e =>
                      handleInputChange('state_code', e.target.value)
                    }
                    className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                      errors.state_code ? 'border-destructive' : ''
                    }`}
                    disabled={isSubmitting}
                    aria-describedby={
                      errors.state_code ? 'state_code-error' : undefined
                    }
                  >
                    <option value="">Select state code</option>
                    {STATE_CODES.map(code => (
                      <option key={code} value={code}>
                        {code} - {STATE_NAMES[code]}
                      </option>
                    ))}
                  </select>
                  {errors.state_code && (
                    <p
                      id="state_code-error"
                      className="text-sm text-destructive"
                    >
                      {errors.state_code}
                    </p>
                  )}
                </div>

                {/* Category */}
                <div className="space-y-2">
                  <Label htmlFor="category">
                    Category <span className="text-destructive">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="category"
                      value={selectedCategory?.name || categorySearch}
                      onChange={e => {
                        setCategorySearch(e.target.value);
                        setShowCategoryInput(true);
                      }}
                      onFocus={() => setShowCategoryInput(true)}
                      placeholder="Search or select category"
                      className={errors.category_id ? 'border-destructive' : ''}
                      disabled={isSubmitting}
                      required
                      aria-describedby={
                        errors.category_id ? 'category-error' : undefined
                      }
                    />

                    {showCategoryInput && (
                      <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-background border border-input rounded-md shadow-lg max-h-48 overflow-y-auto">
                        {filteredCategories.length > 0 && (
                          <>
                            {filteredCategories.map(category => (
                              <button
                                key={category.id}
                                type="button"
                                className="w-full px-3 py-2 text-left hover:bg-muted focus:bg-muted focus:outline-none"
                                onClick={() =>
                                  handleCategorySelect(category.id!)
                                }
                              >
                                <div className="flex items-center justify-between">
                                  <span>{category.name}</span>
                                  {formData.category_id === category.id && (
                                    <Check className="h-4 w-4 text-primary" />
                                  )}
                                </div>
                              </button>
                            ))}
                            <div className="border-t border-border"></div>
                          </>
                        )}

                        {/* Always show "Add new category" option */}
                        <div className="p-3">
                          <p className="text-sm text-muted-foreground mb-2">
                            {categorySearch.trim()
                              ? `Create new category "${categorySearch}"`
                              : 'Create new category'}
                          </p>
                          <div className="flex items-center gap-2">
                            <Input
                              value={newCategoryName}
                              onChange={e => setNewCategoryName(e.target.value)}
                              placeholder={
                                categorySearch.trim()
                                  ? `Create "${categorySearch}"`
                                  : 'Enter category name'
                              }
                              className="text-sm"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateCategory();
                                }
                              }}
                            />
                            <Button
                              type="button"
                              size="sm"
                              onClick={handleCreateCategory}
                              disabled={
                                isCreatingCategory || !newCategoryName.trim()
                              }
                              className="shrink-0"
                            >
                              {isCreatingCategory ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Plus className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        </div>

                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left border-t hover:bg-muted focus:bg-muted focus:outline-none text-sm text-muted-foreground"
                          onClick={() => setShowCategoryInput(false)}
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  {errors.category_id && (
                    <p id="category-error" className="text-sm text-destructive">
                      {errors.category_id}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || (isEditing && !hasFormChanges())}
                className="gap-2"
                aria-label={isEditing ? 'Update customer' : 'Create customer'}
              >
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting
                  ? isEditing
                    ? 'Updating...'
                    : 'Creating...'
                  : isEditing
                    ? 'Update'
                    : 'Create'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
