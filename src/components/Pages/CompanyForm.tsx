import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { X, Save, Loader2 } from "lucide-react";
import { Company, CreateCompany, UpdateCompany, CompanyFormData, CompanyFormErrors } from "@/types/company";
import { dbService } from "@/services/database";

interface CompanyFormProps {
  company?: Company | null;
  onSubmit: (data: CreateCompany | UpdateCompany) => Promise<void>;
  onClose: () => void;
}

// Indian state codes for dropdown
const STATE_CODES = [
  "01", "02", "03", "04", "05", "06", "07", "08", "09", "10",
  "11", "12", "13", "14", "15", "16", "17", "18", "19", "20",
  "21", "22", "23", "24", "25", "26", "27", "28", "29", "30",
  "31", "32", "33", "34", "35", "36", "37", "38"
];

const STATE_NAMES: Record<string, string> = {
  "01": "Jammu and Kashmir",
  "02": "Himachal Pradesh", 
  "03": "Punjab",
  "04": "Chandigarh",
  "05": "Uttarakhand",
  "06": "Haryana",
  "07": "Delhi",
  "08": "Rajasthan",
  "09": "Uttar Pradesh",
  "10": "Bihar",
  "11": "Sikkim",
  "12": "Arunachal Pradesh",
  "13": "Nagaland",
  "14": "Manipur",
  "15": "Mizoram",
  "16": "Tripura",
  "17": "Meghalaya",
  "18": "Assam",
  "19": "West Bengal",
  "20": "Jharkhand",
  "21": "Odisha",
  "22": "Chhattisgarh",
  "23": "Madhya Pradesh",
  "24": "Gujarat",
  "25": "Daman and Diu",
  "26": "Dadra and Nagar Haveli",
  "27": "Maharashtra",
  "28": "Andhra Pradesh",
  "29": "Karnataka",
  "30": "Goa",
  "31": "Lakshadweep",
  "32": "Kerala",
  "33": "Tamil Nadu",
  "34": "Puducherry",
  "35": "Andaman and Nicobar Islands",
  "36": "Telangana",
  "37": "Andhra Pradesh (New)",
  "38": "Ladakh"
};

export function CompanyForm({ company, onSubmit, onClose }: CompanyFormProps) {
  const [formData, setFormData] = useState<CompanyFormData>({
    company_name: "",
    gst_no: "",
    state_code: "",
  });
  const [errors, setErrors] = useState<CompanyFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditing = !!company;

  useEffect(() => {
    if (company) {
      setFormData({
        company_name: company.company_name,
        gst_no: company.gst_no,
        state_code: company.state_code,
      });
    }
  }, [company]);

  const validateForm = async (): Promise<boolean> => {
    const newErrors: CompanyFormErrors = {};

    // Company name validation
    if (!formData.company_name.trim()) {
      newErrors.company_name = "Company name is required";
    } else if (formData.company_name.length > 255) {
      newErrors.company_name = "Company name must be 255 characters or less";
    }

    // GST number validation
    if (!formData.gst_no.trim()) {
      newErrors.gst_no = "GST number is required";
    } else if (!isValidGSTFormat(formData.gst_no)) {
      newErrors.gst_no = "GST number must be 15 characters and follow GST format";
    } else {
      // Check for duplicate GST
      try {
        const excludeId = isEditing ? company?.id : undefined;
        const gstExists = await dbService.checkGstExists(formData.gst_no, excludeId);
        if (gstExists) {
          newErrors.gst_no = "GST number already in use";
        }
      } catch (error) {
        console.error("Error checking GST:", error);
        newErrors.gst_no = "Error validating GST number";
      }
    }

    // State code validation
    if (!formData.state_code.trim()) {
      newErrors.state_code = "State code is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isValidGSTFormat = (gstNo: string): boolean => {
    const trimmed = gstNo.trim();
    return trimmed.length === 15 && !!trimmed.match(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}[Z]{1}[1-9A-Z]{1}$/);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);
    try {
      if (isEditing) {
        await onSubmit({
          company_name: formData.company_name.trim(),
          gst_no: formData.gst_no.trim(),
          state_code: formData.state_code.trim(),
        });
      } else {
        await onSubmit({
          company_name: formData.company_name.trim(),
          gst_no: formData.gst_no.trim(),
          state_code: formData.state_code.trim(),
        });
      }
    } catch (error) {
      // Error handling is done in parent component
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof CompanyFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <CardTitle>{isEditing ? "Edit Company" : "Add New Company"}</CardTitle>
            <CardDescription>
              {isEditing 
                ? "Update company information" 
                : "Enter company details and GST information"
              }
            </CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Company Name */}
            <div className="space-y-2">
              <Label htmlFor="company_name">
                Company Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="company_name"
                value={formData.company_name}
                onChange={(e) => handleInputChange("company_name", e.target.value)}
                placeholder="Enter company name"
                className={errors.company_name ? "border-destructive" : ""}
                disabled={isSubmitting}
              />
              {errors.company_name && (
                <p className="text-sm text-destructive">{errors.company_name}</p>
              )}
            </div>

            {/* GST Number */}
            <div className="space-y-2">
              <Label htmlFor="gst_no">
                GST Number <span className="text-destructive">*</span>
              </Label>
              <Input
                id="gst_no"
                value={formData.gst_no}
                onChange={(e) => handleInputChange("gst_no", e.target.value.toUpperCase())}
                placeholder="e.g., 07AABCU9603R1ZX"
                className={errors.gst_no ? "border-destructive" : ""}
                disabled={isSubmitting}
                maxLength={15}
              />
              {errors.gst_no && (
                <p className="text-sm text-destructive">{errors.gst_no}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Format: 2 digits (state) + 10 characters (PAN) + 3 characters (entity type)
              </p>
            </div>

            {/* State Code */}
            <div className="space-y-2">
              <Label htmlFor="state_code">
                State Code <span className="text-destructive">*</span>
              </Label>
              <select
                id="state_code"
                value={formData.state_code}
                onChange={(e) => handleInputChange("state_code", e.target.value)}
                className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                  errors.state_code ? "border-destructive" : ""
                }`}
                disabled={isSubmitting}
              >
                <option value="">Select state code</option>
                {STATE_CODES.map((code) => (
                  <option key={code} value={code}>
                    {code} - {STATE_NAMES[code]}
                  </option>
                ))}
              </select>
              {errors.state_code && (
                <p className="text-sm text-destructive">{errors.state_code}</p>
              )}
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting} className="gap-2">
                {isSubmitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                {isSubmitting ? "Saving..." : isEditing ? "Update" : "Create"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
