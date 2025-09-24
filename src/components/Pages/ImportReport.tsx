import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useSelectedCompany } from '@/contexts/SelectedCompanyContext';
import { Upload, FileText, AlertCircle, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ImportReport() {
  const { selectedCompany, isLoading } = useSelectedCompany();
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);
  const navigate = useNavigate();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);
    }
  };

  const handleImport = async () => {
    if (!selectedCompany) {
      setResult({
        success: false,
        message: 'No company selected — please select or create a company to continue.'
      });
      return;
    }

    if (!file) {
      setResult({
        success: false,
        message: 'Please select a file to import.'
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    // Simulate import processing
    setTimeout(() => {
      setIsProcessing(false);
      setResult({
        success: true,
        message: `Successfully imported ${file.name} for ${selectedCompany.company_name} (GST: ${selectedCompany.gst_no})`
      });
    }, 2000);
  };

  const handleGenerateReport = async () => {
    if (!selectedCompany) {
      setResult({
        success: false,
        message: 'No company selected — please select or create a company to continue.'
      });
      return;
    }

    setIsProcessing(true);
    setResult(null);

    // Simulate report generation
    setTimeout(() => {
      setIsProcessing(false);
      setResult({
        success: true,
        message: `Report generated for ${selectedCompany.company_name} (GST: ${selectedCompany.gst_no})`
      });
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Import & Reports</h1>
        <p className="text-muted-foreground">
          Import data and generate reports for your selected company
        </p>
      </div>

      {/* Selected Company Status */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {selectedCompany ? (
              <>
                <CheckCircle className="h-5 w-5 text-green-500" />
                Company Selected
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                No Company Selected
              </>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {selectedCompany ? (
            <div className="space-y-2">
              <p className="font-medium">{selectedCompany.company_name}</p>
              <p className="text-sm text-muted-foreground">
                GST: {selectedCompany.gst_no} • State: {selectedCompany.state_code}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-muted-foreground">
                Please select a company from the header dropdown to continue.
              </p>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/companies')}
              >
                Go to Companies
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Import Data
          </CardTitle>
          <CardDescription>
            Upload a file to import data for {selectedCompany?.company_name || 'your selected company'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={!selectedCompany}
            />
            {file && (
              <p className="text-sm text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(1)} KB)
              </p>
            )}
          </div>
          <Button 
            onClick={handleImport}
            disabled={!selectedCompany || !file || isProcessing}
            className="gap-2"
          >
            <Upload className="h-4 w-4" />
            {isProcessing ? 'Importing...' : 'Import Data'}
          </Button>
        </CardContent>
      </Card>

      {/* Report Generation Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Generate Report
          </CardTitle>
          <CardDescription>
            Generate a sales report for {selectedCompany?.company_name || 'your selected company'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handleGenerateReport}
            disabled={!selectedCompany || isProcessing}
            className="gap-2"
          >
            <FileText className="h-4 w-4" />
            {isProcessing ? 'Generating...' : 'Generate Report'}
          </Button>
        </CardContent>
      </Card>

      {/* Result Display */}
      {result && (
        <Card>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-2 ${
              result.success ? 'text-green-600' : 'text-red-600'
            }`}>
              {result.success ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p className="font-medium">
                {result.success ? 'Success' : 'Error'}
              </p>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {result.message}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
