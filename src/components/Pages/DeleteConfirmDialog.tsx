import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, X } from "lucide-react";
import { Company } from "@/types/company";

interface DeleteConfirmDialogProps {
  company: Company;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ company, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-destructive" />
            <CardTitle className="text-destructive">Delete Company</CardTitle>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <CardDescription>
            Are you sure you want to delete <strong>{company.company_name}</strong>?
            This action cannot be undone.
          </CardDescription>
          
          <div className="bg-muted/50 p-3 rounded-lg">
            <p className="text-sm text-muted-foreground">
              <strong>Company:</strong> {company.company_name}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>GST:</strong> {company.gst_no}
            </p>
            <p className="text-sm text-muted-foreground">
              <strong>State:</strong> {company.state_code}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={onConfirm} className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Delete Company
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
