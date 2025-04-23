"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, ArrowLeft, Ban, CheckCircle2, Download, Printer, Clock } from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { useToast } from "@/components/ui/use-toast";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

// Types
type BillItem = {
  id: string;
  billId: string;
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
};

type Bill = {
  id: string;
  billNumber: string;
  vendorId: string;
  vendorName: string;
  description: string;
  issueDate: string;
  dueDate: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: "draft" | "pending" | "paid" | "partially_paid" | "overdue";
  notes: string;
  createdAt: string;
  updatedAt: string;
  items: BillItem[];
  payments: Payment[];
};

type Payment = {
  id: string;
  billId: string;
  amount: number;
  paymentDate: string;
  paymentMethod: string;
  reference: string;
  notes: string;
  createdAt: string;
};

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<Bill | null>(null);
  const [paymentDialog, setPaymentDialog] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");
  const [processingPayment, setProcessingPayment] = useState(false);
  const [cancelDialog, setCancelDialog] = useState(false);
  const [cancellingBill, setCancellingBill] = useState(false);

  // Load bill data
  useEffect(() => {
    const fetchBillData = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/finance/payable?id=${params.id}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch bill data");
        }
        
        const data = await response.json();
        if (data.bills && data.bills.length > 0) {
          setBill(data.bills[0]);
        } else {
          toast({
            title: "Error",
            description: "Bill not found",
            variant: "destructive",
          });
          router.push("/finance/payable");
        }
      } catch (error) {
        console.error("Error fetching bill data:", error);
        toast({
          title: "Error",
          description: "Failed to load bill data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchBillData();
  }, [params.id, router, toast]);

  // Format currency
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  // Format date
  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "MMM dd, yyyy");
    } catch (e) {
      return "Invalid Date";
    }
  };

  // Get status badge
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline" className="text-sm">Draft</Badge>;
      case "pending":
        return <Badge variant="secondary" className="text-sm">Pending</Badge>;
      case "paid":
        return <Badge variant="success" className="text-sm">Paid</Badge>;
      case "partially_paid":
        return <Badge variant="warning" className="text-sm">Partially Paid</Badge>;
      case "overdue":
        return <Badge variant="destructive" className="text-sm">Overdue</Badge>;
      default:
        return <Badge variant="outline" className="text-sm">{status}</Badge>;
    }
  };

  // Handle payment submission
  const handlePaymentSubmit = async () => {
    if (!bill) return;
    
    try {
      setProcessingPayment(true);
      
      // Validate payment amount
      const amount = parseFloat(paymentAmount);
      if (isNaN(amount) || amount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid payment amount",
          variant: "destructive",
        });
        return;
      }
      
      if (amount > bill.outstandingAmount) {
        toast({
          title: "Invalid amount",
          description: "Payment amount cannot exceed the outstanding amount",
          variant: "destructive",
        });
        return;
      }
      
      // Prepare payment data
      const paymentData = {
        billId: bill.id,
        amount,
        paymentMethod,
        reference: paymentReference,
        notes: paymentNotes
      };
      
      // Submit payment
      const response = await fetch("/api/finance/payable", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(paymentData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to process payment");
      }
      
      // Success
      toast({
        title: "Payment processed",
        description: "Payment has been successfully recorded",
      });
      
      // Reset form and close dialog
      setPaymentAmount("");
      setPaymentReference("");
      setPaymentNotes("");
      setPaymentDialog(false);
      
      // Refresh bill data
      const billResponse = await fetch(`/api/finance/payable?id=${params.id}`);
      const billData = await billResponse.json();
      if (billData.bills && billData.bills.length > 0) {
        setBill(billData.bills[0]);
      }
    } catch (error) {
      console.error("Error processing payment:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to process payment",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  // Handle bill cancellation
  const handleCancelBill = async () => {
    if (!bill) return;
    
    try {
      setCancellingBill(true);
      const response = await fetch(`/api/finance/payable/${params.id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to cancel bill");
      }
      
      toast({
        title: "Bill cancelled",
        description: "The bill has been cancelled successfully",
      });
      setCancelDialog(false);
      router.push("/finance/payable");
    } catch (error) {
      console.error("Error cancelling bill:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to cancel bill",
        variant: "destructive",
      });
    } finally {
      setCancellingBill(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center mb-6">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <Skeleton className="h-8 w-64" />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <div>
            <Skeleton className="h-96 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!bill) {
    return (
      <div className="p-6 flex flex-col items-center justify-center h-[50vh]">
        <AlertCircle className="h-16 w-16 text-destructive mb-6" />
        <h3 className="text-xl font-semibold mb-2">Bill Not Found</h3>
        <p className="text-muted-foreground mb-6">The requested bill could not be found or may have been deleted.</p>
        <Button onClick={() => router.push("/finance/payable")}>
          Return to Accounts Payable
        </Button>
      </div>
    );
  }

  // Calculate payment status and progress
  const paymentProgress = (bill.paidAmount / bill.totalAmount) * 100;
  const daysUntilDue = bill.status !== "paid" 
    ? formatDistanceToNow(parseISO(bill.dueDate), { addSuffix: true })
    : "";
  const isOverdue = bill.status === "overdue";

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center">
          <Button variant="ghost" size="sm" onClick={() => router.back()} className="mr-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              Bill #{bill.billNumber} {getStatusBadge(bill.status)}
            </h1>
            <p className="text-muted-foreground">
              {bill.vendorName} - {formatDate(bill.issueDate)}
            </p>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 mr-2" /> Print
          </Button>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" /> Download PDF
          </Button>
          
          {bill.status !== "paid" && bill.status !== "draft" && (
            <Dialog open={paymentDialog} onOpenChange={setPaymentDialog}>
              <DialogTrigger asChild>
                <Button size="sm">Record Payment</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Record Payment</DialogTitle>
                  <DialogDescription>
                    Enter payment details for Bill #{bill.billNumber}
                  </DialogDescription>
                </DialogHeader>
                
                <div className="grid gap-4 py-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Outstanding Amount:</span>
                    <span className="font-semibold">{formatCurrency(bill.outstandingAmount)}</span>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-amount">Payment Amount</Label>
                    <Input
                      id="payment-amount"
                      type="number"
                      placeholder="0.00"
                      value={paymentAmount}
                      onChange={(e) => setPaymentAmount(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-method">Payment Method</Label>
                    <select
                      id="payment-method"
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    >
                      <option value="bank_transfer">Bank Transfer</option>
                      <option value="check">Check</option>
                      <option value="credit_card">Credit Card</option>
                      <option value="cash">Cash</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-reference">Reference Number</Label>
                    <Input
                      id="payment-reference"
                      placeholder="Transaction ID, Check #, etc."
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="payment-notes">Notes</Label>
                    <Textarea
                      id="payment-notes"
                      placeholder="Additional payment details"
                      value={paymentNotes}
                      onChange={(e) => setPaymentNotes(e.target.value)}
                    />
                  </div>
                </div>
                
                <DialogFooter>
                  <Button variant="outline" onClick={() => setPaymentDialog(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handlePaymentSubmit} 
                    disabled={processingPayment || !paymentAmount}
                  >
                    {processingPayment ? "Processing..." : "Record Payment"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
          
          {bill.status !== "paid" && (
            <AlertDialog open={cancelDialog} onOpenChange={setCancelDialog}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm">
                  <Ban className="h-4 w-4 mr-2" /> Cancel Bill
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Cancel this bill?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action will cancel Bill #{bill.billNumber} and cannot be undone.
                    Any associated payments will not be affected.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Nevermind</AlertDialogCancel>
                  <AlertDialogAction 
                    onClick={handleCancelBill} 
                    className="bg-destructive"
                    disabled={cancellingBill}
                  >
                    {cancellingBill ? "Cancelling..." : "Cancel Bill"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Bill Details</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium w-1/3">Bill Number</TableCell>
                    <TableCell>{bill.billNumber}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Vendor</TableCell>
                    <TableCell>{bill.vendorName}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Description</TableCell>
                    <TableCell>{bill.description}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Issue Date</TableCell>
                    <TableCell>{formatDate(bill.issueDate)}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Due Date</TableCell>
                    <TableCell className={isOverdue ? "text-destructive" : ""}>
                      {formatDate(bill.dueDate)}
                      {bill.status !== "paid" && (
                        <span className={`ml-2 text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                          {isOverdue ? "(Overdue)" : `(Due ${daysUntilDue})`}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium">Status</TableCell>
                    <TableCell>{getStatusBadge(bill.status)}</TableCell>
                  </TableRow>
                  {bill.notes && (
                    <TableRow>
                      <TableCell className="font-medium">Notes</TableCell>
                      <TableCell>{bill.notes}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Bill Items</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Quantity</TableHead>
                    <TableHead className="text-right">Unit Price</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{item.description}</TableCell>
                      <TableCell className="text-right">{item.quantity}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <tfoot>
                  <tr>
                    <td colSpan={3} className="text-right pr-4 py-2 font-medium">Total Amount</td>
                    <td className="text-right pr-4 py-2 font-bold">{formatCurrency(bill.totalAmount)}</td>
                  </tr>
                </tfoot>
              </Table>
            </CardContent>
          </Card>

          <Tabs defaultValue="payments">
            <TabsList>
              <TabsTrigger value="payments">Payments</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            <TabsContent value="payments" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Payment History</CardTitle>
                </CardHeader>
                <CardContent>
                  {bill.payments && bill.payments.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>Method</TableHead>
                          <TableHead>Reference</TableHead>
                          <TableHead className="text-right">Amount</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {bill.payments.map((payment) => (
                          <TableRow key={payment.id}>
                            <TableCell>{formatDate(payment.paymentDate)}</TableCell>
                            <TableCell className="capitalize">
                              {payment.paymentMethod.replace("_", " ")}
                            </TableCell>
                            <TableCell>{payment.reference || "-"}</TableCell>
                            <TableCell className="text-right">{formatCurrency(payment.amount)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <div className="text-center py-8">
                      <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                      <h3 className="text-lg font-medium mb-1">No Payments Yet</h3>
                      <p className="text-muted-foreground mb-4">
                        There are no payments recorded for this bill.
                      </p>
                      {bill.status !== "paid" && bill.status !== "draft" && (
                        <Button onClick={() => setPaymentDialog(true)}>Record Payment</Button>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
            <TabsContent value="history" className="mt-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle>Activity History</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="relative pl-6 border-l">
                    <div className="mb-6">
                      <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-primary"></div>
                      <h3 className="text-sm font-medium">Bill created</h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {formatDate(bill.createdAt)} at {format(parseISO(bill.createdAt), "h:mm a")}
                      </p>
                    </div>
                    
                    {bill.payments && bill.payments.map((payment, i) => (
                      <div className="mb-6" key={i}>
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-green-500"></div>
                        <h3 className="text-sm font-medium">
                          Payment of {formatCurrency(payment.amount)} recorded
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(payment.createdAt)} at {format(parseISO(payment.createdAt), "h:mm a")}
                        </p>
                      </div>
                    ))}
                    
                    {bill.status === "paid" && (
                      <div className="mb-6">
                        <div className="absolute -left-1.5 mt-1.5 h-3 w-3 rounded-full border border-background bg-green-500"></div>
                        <h3 className="text-sm font-medium flex items-center">
                          <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" /> Bill marked as paid
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {formatDate(bill.updatedAt)} at {format(parseISO(bill.updatedAt), "h:mm a")}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Payment Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Total Amount</span>
                  <span className="font-medium">{formatCurrency(bill.totalAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Paid Amount</span>
                  <span className="font-medium text-green-600">{formatCurrency(bill.paidAmount)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Outstanding</span>
                  <span className="font-medium text-destructive">{formatCurrency(bill.outstandingAmount)}</span>
                </div>
                <Separator className="my-2" />
                <div className="mt-2">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Payment Progress</span>
                    <span className="text-sm font-medium">{Math.round(paymentProgress)}%</span>
                  </div>
                  <Progress value={paymentProgress} className="h-2" />
                </div>
              </div>

              {bill.status !== "paid" && bill.status !== "draft" && (
                <Button 
                  className="w-full" 
                  onClick={() => setPaymentDialog(true)}
                >
                  Record Payment
                </Button>
              )}
              
              {bill.status === "paid" && (
                <div className="rounded-md bg-green-50 p-4">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-green-800">Payment Complete</h3>
                      <div className="mt-2 text-sm text-green-700">
                        <p>This bill has been fully paid.</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Bill Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium mb-1">Created</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(bill.createdAt)}
                </p>
              </div>
              
              <div>
                <h3 className="text-sm font-medium mb-1">Last Updated</h3>
                <p className="text-sm text-muted-foreground">
                  {formatDate(bill.updatedAt)}
                </p>
              </div>
              
              {bill.status !== "paid" && bill.dueDate && (
                <div>
                  <h3 className="text-sm font-medium mb-1">Due Date</h3>
                  <p className={`text-sm ${isOverdue ? "text-destructive" : "text-muted-foreground"}`}>
                    {formatDate(bill.dueDate)}
                    <br />
                    <span className="text-xs">
                      {isOverdue ? "Overdue" : `Due ${daysUntilDue}`}
                    </span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
          
          {bill.status !== "paid" && bill.status !== "draft" && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button 
                  className="w-full" 
                  variant="outline"
                  onClick={() => router.push(`/finance/payable/edit/${bill.id}`)}
                >
                  Edit Bill
                </Button>
                <Button 
                  className="w-full" 
                  variant="destructive"
                  onClick={() => setCancelDialog(true)}
                  disabled={cancellingBill}
                >
                  {cancellingBill ? "Cancelling..." : "Cancel Bill"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 