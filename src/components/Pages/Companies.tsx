import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, Plus, Edit, Building2 } from "lucide-react";
import { Company, CreateCompany, UpdateCompany } from "@/types/company";
import { CompanyForm } from "./CompanyForm";
import { dbService } from "@/services/database";

export default function Companies() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Load companies on component mount
  useEffect(() => {
    loadCompanies();
  }, []);

  // Filter companies based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCompanies(companies);
    } else {
      const filtered = companies.filter(
        (company) =>
          company.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.gst_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
          company.state_code.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCompanies(filtered);
    }
  }, [companies, searchQuery]);

  const loadCompanies = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const result = await dbService.getCompanies();
      setCompanies(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load companies");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateCompany = async (companyData: CreateCompany) => {
    try {
      setError(null);
      const newCompany = await dbService.createCompany(companyData);
      setCompanies(prev => [newCompany, ...prev]);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create company");
      throw err; // Re-throw to let form handle it
    }
  };

  const handleUpdateCompany = async (id: number, companyData: UpdateCompany) => {
    try {
      setError(null);
      const updatedCompany = await dbService.updateCompany(id, companyData);
      setCompanies(prev => 
        prev.map(company => 
          company.id === id ? updatedCompany : company
        )
      );
      setEditingCompany(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update company");
      throw err; // Re-throw to let form handle it
    }
  };

  const handleEdit = (company: Company) => {
    setEditingCompany(company);
    setShowForm(true);
  };

  const handleCloseForm = () => {
    setShowForm(false);
    setEditingCompany(null);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString();
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Building2 className="h-12 w-12 mx-auto mb-4 text-muted-foreground animate-pulse" />
            <p className="text-muted-foreground">Loading companies...</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Companies</h1>
            <p className="text-muted-foreground">
              Manage your company information and GST details
            </p>
          </div>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Company
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg">
          <p className="text-destructive text-sm">{error}</p>
        </div>
      )}

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search companies by name, GST, or state..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Companies List */}
      {filteredCompanies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">
              {searchQuery ? "No companies found" : "No companies yet"}
            </h3>
            <p className="text-muted-foreground text-center mb-4">
              {searchQuery 
                ? "Try adjusting your search terms" 
                : "Get started by adding your first company"
              }
            </p>
            {!searchQuery && (
              <Button onClick={() => setShowForm(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Company
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl">{company.company_name}</CardTitle>
                    <CardDescription>
                      GST: {company.gst_no} • State: {company.state_code}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">
                      Created {formatDate(company.created_at)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-sm text-muted-foreground">
                    {company.updated_at && company.updated_at !== company.created_at && (
                      <p>Last updated: {formatDate(company.updated_at)}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEdit(company)}
                      className="gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Company Form Modal */}
      {showForm && (
        <CompanyForm
          company={editingCompany}
          onSubmit={editingCompany 
            ? (data) => handleUpdateCompany(editingCompany.id!, data)
            : handleCreateCompany
          }
          onClose={handleCloseForm}
        />
      )}
    </div>
  );
}
