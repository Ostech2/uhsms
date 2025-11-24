import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, XCircle, Clock, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Approval {
  id: string;
  warden_id: string;
  request_type: string;
  item_details: any;
  description: string;
  status: string;
  request_date: string;
  approval_date: string | null;
  warden?: {
    full_name: string;
    assigned_hostel: string;
  };
}

interface WardenApprovalsProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function WardenApprovals({ isOpen, onOpenChange }: WardenApprovalsProps) {
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<Approval | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      loadApprovals();
    }
  }, [isOpen]);

  const loadApprovals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('warden_approvals')
        .select(`
          *,
          warden:user_profiles!warden_id (
            full_name,
            assigned_hostel
          )
        `)
        .order('request_date', { ascending: false });

      if (error) throw error;

      setApprovals(data || []);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load approvals",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApproval = async (approvalId: string, status: 'approved' | 'rejected') => {
    try {
      const approval = approvals.find(a => a.id === approvalId);

      // Get admin user ID for tracking
      const { data: adminUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('role', 'admin')
        .limit(1)
        .single();

      const { error } = await supabase
        .from('warden_approvals')
        .update({
          status,
          approval_date: new Date().toISOString(),
          approved_by: adminUser?.id || null
        })
        .eq('id', approvalId);

      if (error) throw error;

      // If approved and it's an inventory request, add the item to inventory
      if (status === 'approved') {
        if (approval && approval.request_type === 'inventory_add' && approval.item_details) {
          const { error: inventoryError } = await supabase
            .from('inventory_items')
            .insert([{
              ...approval.item_details,
              assigned_by: approval.warden_id,
              status: 'available'
            }]);

          if (inventoryError) {
            console.error('Failed to add inventory item:', inventoryError);
            toast({
              title: "Warning",
              description: "Request approved but failed to add inventory item",
              variant: "destructive"
            });
            return;
          }
        }
      }

      loadApprovals();
      toast({
        title: "Success",
        description: `Request has been ${status}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update approval status",
        variant: "destructive"
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500 text-white';
      case 'rejected': return 'bg-red-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'inventory_add': return 'Add Inventory';
      case 'maintenance_request': return 'Maintenance';
      case 'room_assignment': return 'Room Assignment';
      default: return type;
    }
  };

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex justify-center p-8">Loading...</div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Warden Approval Requests
            </DialogTitle>
            <DialogDescription>
              Review and manage warden requests for approval
            </DialogDescription>
          </DialogHeader>

          <Card>
            <CardHeader>
              <CardTitle>Pending & Recent Requests</CardTitle>
              <CardDescription>Manage warden approval requests</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Warden</TableHead>
                    <TableHead>Request Type</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {approvals.map((approval) => (
                    <TableRow key={approval.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{approval.warden?.full_name}</p>
                          <p className="text-sm text-muted-foreground">{approval.warden?.assigned_hostel}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getRequestTypeLabel(approval.request_type)}
                        </Badge>
                      </TableCell>
                      <TableCell className="max-w-xs truncate">{approval.description}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(approval.status)}>
                          {approval.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {new Date(approval.request_date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedApproval(approval)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {approval.status === 'pending' && (
                            <>
                              <Button
                                size="sm"
                                variant="default"
                                className="bg-green-600 hover:bg-green-700"
                                onClick={() => handleApproval(approval.id, 'approved')}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleApproval(approval.id, 'rejected')}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {approvals.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        No approval requests found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </DialogContent>
      </Dialog>

      {/* Details Modal */}
      {selectedApproval && (
        <Dialog open={!!selectedApproval} onOpenChange={() => setSelectedApproval(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Request Details</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold">Warden:</h4>
                <p>{selectedApproval.warden?.full_name} - {selectedApproval.warden?.assigned_hostel}</p>
              </div>
              <div>
                <h4 className="font-semibold">Request Type:</h4>
                <p>{getRequestTypeLabel(selectedApproval.request_type)}</p>
              </div>
              <div>
                <h4 className="font-semibold">Description:</h4>
                <p>{selectedApproval.description}</p>
              </div>
              {selectedApproval.item_details && (
                <div>
                  <h4 className="font-semibold">Item Details:</h4>
                  <pre className="bg-muted p-3 rounded text-sm">
                    {JSON.stringify(selectedApproval.item_details, null, 2)}
                  </pre>
                </div>
              )}
              <div>
                <h4 className="font-semibold">Status:</h4>
                <Badge className={getStatusColor(selectedApproval.status)}>
                  {selectedApproval.status}
                </Badge>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}