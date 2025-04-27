"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, Upload, X, RefreshCw, AlertCircle, Info } from "lucide-react"
import { toast } from "sonner"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import Image from "next/image"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { FileInput } from "@/components/ui/file-input"

// Schema for the design process form
const designProcessSchema = z.object({
  // Design information section - editable
  fileWidth: z.string().optional(),
  matchingColor: z.enum(["YES", "NO"]),
  // Quantity field - editable
  qty: z.coerce.number().optional(),
  // Design notes
  notes: z.string().optional(),
})

// Type for the design process form values
interface DesignProcessFormValues {
  fileWidth?: string
  matchingColor: "YES" | "NO"
  qty?: number
  notes?: string
}

// Type for the order data
interface OrderData {
  id: string
  spk?: string | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
  tanggal?: string | null
  marketing?: string | null
  targetSelesai?: string | null
  est_order?: string | null
  tipe_produk?: string | null
  kategori?: string | null
  produk?: string | null
  nama_produk?: string | null
  asal_bahan_id?: string | null
  nama_kain?: string | null
  lebar_kain?: string | null
  lebar_bahan?: string | null
  lebar_kertas?: string | null
  gramasi?: string | null
  lebar_file?: string | null
  warna_acuan?: string | null
  qty?: number | null
  catatan?: string | null
  capture?: string | null
  capture_name?: string | null
  jenisProduk?: Record<string, boolean> | null
  statusprod?: string | null
}

export default function EditDesignPage() {
  const router = useRouter()
  const params = useParams()
  const orderId = params?.id as string
  
  const [isLoading, setIsLoading] = useState(true)
  const [order, setOrder] = useState<OrderData | null>(null)
  const [captureFile, setCaptureFile] = useState<File | null>(null)
  const [captureNameFile, setCaptureNameFile] = useState<File | null>(null)
  const [capturePreview, setCapturePreview] = useState<string | null>(null)
  const [captureNamePreview, setCaptureNamePreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [currentUser, setCurrentUser] = useState<{id: string, name: string} | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)
  
  // Initialize form
  const form = useForm<DesignProcessFormValues>({
    resolver: zodResolver(designProcessSchema),
    defaultValues: {
      fileWidth: "",
      matchingColor: "NO",
      qty: undefined,
      notes: "",
    },
  })
  
  // Fetch current user
  useEffect(() => {
    const fetchCurrentUser = async () => {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session.user) {
            setCurrentUser({
              id: session.user.id,
              name: session.user.name
            });
          }
        }
      } catch (error) {
        console.error("Failed to fetch current user:", error);
      }
    };
    
    fetchCurrentUser();
  }, []);
  
  // Fetch order data
  useEffect(() => {
    const fetchOrderInfo = async () => {
      if (!orderId) return
      
      try {
        setIsLoading(true)
        const response = await fetch(`/api/orders/${orderId}`)
        
        if (response.ok) {
          const data = await response.json()
          setOrder(data)
          
          // Populate form with order data
          form.reset({
            fileWidth: data.lebar_file || "",
            matchingColor: (data.warna_acuan === "ADA" ? "YES" : "NO") as "YES" | "NO",
            qty: data.qty || undefined,
            notes: data.catatan || "",
          })
          
          // Set capture previews if available
          if (data.capture) {
            setCapturePreview(`/capture/file/${data.capture}`)
          }
          
          if (data.capture_name) {
            setCaptureNamePreview(`/capture/name/${data.capture_name}`)
          }
        } else {
          console.error("Failed to fetch order info")
          toast.error("Failed to fetch order information")
        }
      } catch (error) {
        console.error("Error fetching order:", error)
        toast.error("Error loading order details")
      } finally {
        setIsLoading(false)
      }
    }
    
    fetchOrderInfo()
  }, [orderId, form])
  
  // Function to check if uploads directory exists
  const checkUploadsDirectory = async (): Promise<boolean> => {
    try {
      const response = await fetch('/api/upload/check-directory', {
        method: 'GET',
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.exists;
      }
      
      return false;
    } catch (error) {
      console.error('Error checking uploads directory:', error);
      return false;
    }
  };
  
  // Form submission handler
  const onSubmitDesign = async (values: DesignProcessFormValues) => {
    if (!order || !currentUser) {
      toast.error("Missing order information or user not logged in")
      return
    }
    
    try {
      setIsSubmitting(true)
      setUploadProgress(0)
      
      // Check if uploads directory exists
      if (captureFile || captureNameFile) {
        const directoryExists = await checkUploadsDirectory();
        if (!directoryExists) {
          toast.warning("Upload directory may not exist. Design details will be saved, but uploads may fail.");
        }
      }
      
      // 1. Upload images if provided
      let uploadResults: {
        captureUrl?: string;
        captureNameUrl?: string;
      } = {};
      
      // Upload files if provided
      if (captureFile || captureNameFile) {
        try {
          // Try each upload individually to handle partial success
          if (captureFile) {
            try {
              const captureUrl = await uploadFile(captureFile, 'capture');
              if (captureUrl) {
                // Extract just the filename from the URL
                uploadResults.captureUrl = captureUrl.split('/').pop() || captureUrl;
              }
            } catch (captureError) {
              console.error("Error uploading design capture:", captureError);
              // Continue with other uploads
            }
          }
          
          if (captureNameFile) {
            try {
              const captureNameUrl = await uploadFile(captureNameFile, 'captureName');
              if (captureNameUrl) {
                // Extract just the filename from the URL
                uploadResults.captureNameUrl = captureNameUrl.split('/').pop() || captureNameUrl;
              }
            } catch (captureNameError) {
              console.error("Error uploading design name file:", captureNameError);
              // Continue with form submission
            }
          }
        } catch (uploadError) {
          console.error("Error during file upload:", uploadError);
          toast.error("Some files failed to upload, but design details will be saved");
        }
      }
      
      // 2. Prepare update data
      const updateData = {
        lebar_file: values.fileWidth || null,
        warna_acuan: values.matchingColor === "YES" ? "ADA" : "TIDAK ADA",
        qty: values.qty?.toString() || null,
        catatan: values.notes || null,
        statusm: "DESIGNED", // Update status to DESIGNED
        capture: uploadResults.captureUrl || order.capture, // Keep existing capture if no new upload
        capture_name: uploadResults.captureNameUrl || order.capture_name // Keep existing capture_name if no new upload
      };
      
      // 3. Update order data
      const response = await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      })
      
      if (!response.ok) {
        throw new Error("Failed to update design")
      }
      
      // 4. Success!
      toast.success("Design updated successfully")
      
      // 5. Reset form and file states
      form.reset()
      setCaptureFile(null)
      setCaptureNameFile(null)
      setCapturePreview(null)
      setCaptureNamePreview(null)
      
      // 6. Redirect back to design management
      router.push('/design')
      
    } catch (error) {
      console.error("Error updating design:", error)
      toast.error("Failed to update design")
    } finally {
      setIsSubmitting(false)
      setUploadProgress(0)
    }
  }
  
  // Upload files function
  const uploadFiles = async () => {
    const result: { captureUrl?: string; captureNameUrl?: string } = {};
    
    try {
      if (captureFile) {
        const captureFileName = await uploadFile(captureFile, 'capture');
        if (captureFileName) {
          result.captureUrl = captureFileName;
        }
      }
      
      if (captureNameFile) {
        const captureNameFileName = await uploadFile(captureNameFile, 'captureName');
        if (captureNameFileName) {
          result.captureNameUrl = captureNameFileName;
        }
      }
      
      return result;
    } catch (error) {
      console.error('Error uploading files:', error);
      throw error;
    }
  };
  
  // Upload file using FormData
  const uploadFile = async (file: File, type: 'capture' | 'captureName'): Promise<string | null> => {
    if (!file) return null;
    
    try {
      setUploadProgress(10); // Start upload
      
      // Create FormData
      const formData = new FormData();
      formData.append(type, file);
      
      setUploadProgress(30); // Preparing upload
      
      // Upload to server using the existing upload API with specific folder based on type
      const folder = type === 'capture' ? 'capture/file' : 'capture/name';
      const response = await fetch(`/api/upload?folder=${folder}`, {
        method: 'POST',
        body: formData,
      });
      
      setUploadProgress(70); // Upload in progress
      
      const data = await response.json();
      
      if (!response.ok) {
        console.error(`Server error (${response.status}):`, data);
        throw new Error(data.error || data.details || `Failed to upload ${type === 'capture' ? 'design capture' : 'design name file'}`);
      }
      
      setUploadProgress(100); // Completed
      
      // Return the URL based on the type of upload
      return type === 'capture' ? data.captureUrl : data.captureNameUrl;
    } catch (error) {
      console.error(`Error uploading ${type} file:`, error);
      toast.error(`Failed to upload ${type === 'capture' ? 'design capture' : 'design name file'}: ${(error as Error).message}`);
      setUploadProgress(0);
      return null;
    }
  };
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <Button variant="outline" onClick={() => router.push('/design')}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Back to Design Management
        </Button>
        
        <Button 
          variant="outline" 
          size="icon" 
          onClick={() => router.refresh()}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl">
            {isLoading ? (
              <Skeleton className="h-8 w-64" />
            ) : (
              `Edit Design: ${order?.spk || 'Unknown'}`
            )}
          </CardTitle>
          <CardDescription>
            Update design details and upload design files
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmitDesign)} className="space-y-6">
                {/* Customer Section - Non-editable */}
                <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <h3 className="text-sm font-medium">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Customer</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.customer?.nama || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Marketing</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.marketing || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Order Details Section - Non-editable */}
                <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <h3 className="text-sm font-medium">Order Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Order Type</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.tipe_produk || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Category</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.kategori || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Production Status</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.statusprod || "N/A"}
                        </div>
                    </div>
                  </div>
                </div>
                
                {/* Product Type Section - Non-editable */}
                <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <h3 className="text-sm font-medium">Product Type</h3>
                  <div className="p-2 border rounded-md bg-muted/50">
                    {order?.produk ? (
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                      {order?.produk || "N/A"}
                    </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">No product types selected</span>
                    )}
                  </div>
                </div>
                
                {/* Fabric Type Section - Non-editable */}
                <div className="space-y-3 border p-4 rounded-md bg-muted/20">
                  <h3 className="text-sm font-medium">Fabric Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Fabric Origin</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        <div className="font-medium">
                          {order?.asal_bahan_id === "22" ? "SMARTONE" : "CUSTOMER"}
                        </div>                        
                      </div>
                    </div>
                    <div>
                      <Label>Fabric Name</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {typeof order?.nama_kain === 'object' ? JSON.stringify(order?.nama_kain) : order?.nama_kain || "N/A"}
                      </div>
                    </div>
                    <div>
                      <Label>Fabric Width</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {typeof order?.lebar_kain === 'object' ? JSON.stringify(order?.lebar_kain) : order?.lebar_kain || "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Design and Paper Information - Editable */}
                <div className="space-y-3 border p-4 rounded-md">
                  <h3 className="text-sm font-medium">Design and Paper Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Paper GSM</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.gramasi || "Not specified"}
                      </div>
                    </div>
                    
                    <div>
                      <Label>Paper Width</Label>
                      <div className="p-2 border rounded-md bg-muted/50 text-sm">
                        {order?.lebar_kertas || "Not specified"}
                      </div>
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="fileWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Width</FormLabel>
                          <FormControl>
                            <Input {...field} placeholder="Enter file width" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="matchingColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Color Matching</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                            value={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select option" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="YES">YES</SelectItem>
                              <SelectItem value="NO">NO</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
                
                {/* Quantity - Editable */}
                <div className="space-y-3 border p-4 rounded-md">
                  <h3 className="text-sm font-medium">Quantity</h3>
                  <div className="flex items-center gap-2">
                    <FormField
                      control={form.control}
                      name="qty"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormControl>
                            <Input 
                              type="number" 
                              {...field} 
                              onChange={(e) => field.onChange(e.target.valueAsNumber)}
                              value={field.value || ""}
                              placeholder="Enter quantity" 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="p-2 border rounded-md bg-muted/30 h-10 flex items-center">
                      meter
                    </div>
                  </div>
                </div>
                
                {/* Capture Design Upload */}
                <div className="space-y-3 border p-4 rounded-md">
                  <h3 className="text-sm font-medium">Capture Design</h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="captureDesign">Design Preview</Label>
                        <div className="mt-2">
                          <FileInput
                            label="Upload Design Preview"
                            onChange={(file) => {
                              setCaptureFile(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setCapturePreview(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setCapturePreview(null);
                              }
                            }}
                            preview={capturePreview || (order?.capture ? `/capture/file/${order.capture}` : null)}
                            accept="image/*"
                            icon={<Upload className="h-4 w-4 mr-1" />}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <Label htmlFor="captureName">File Name Preview</Label>
                        <div className="mt-2">
                          <FileInput
                            label="Upload File Name Image"
                            onChange={(file) => {
                              setCaptureNameFile(file);
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  if (event.target?.result) {
                                    setCaptureNamePreview(event.target.result as string);
                                  }
                                };
                                reader.readAsDataURL(file);
                              } else {
                                setCaptureNamePreview(null);
                              }
                            }}
                            preview={captureNamePreview || (order?.capture_name ? `/capture/name/${order.capture_name}` : null)}
                            accept="image/*"
                            icon={<Upload className="h-4 w-4 mr-1" />}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Notes */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          placeholder="Enter additional notes or instructions" 
                          className="min-h-[100px]"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Form Actions */}
                <CardFooter className="px-0 flex justify-between">
                  {isSubmitting && (
                    <div className="w-full mb-4">
                      <Progress value={uploadProgress} className="h-2" />
                      <p className="text-xs text-muted-foreground text-center mt-1">
                        {uploadProgress < 100 ? "Uploading..." : "Processing..."}
                      </p>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/design')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  
                  <Popover open={confirmOpen} onOpenChange={setConfirmOpen}>
                    <PopoverTrigger asChild>
                      <Button type="button" disabled={isSubmitting}>
                        {isSubmitting ? "Submitting..." : "Submit Design"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <h4 className="font-medium">Design Submission Confirmation</h4>
                        </div>
                        <p className="text-sm">
                          Have you checked all required fields? By confirming this, you have agreed to be responsible for your work.
                        </p>
                        <div className="flex justify-end space-x-2">
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm"
                            onClick={() => setConfirmOpen(false)}
                          >
                            Cancel
                          </Button>
                          <Button 
                            type="button" 
                            size="sm"
                            onClick={() => {
                              setConfirmOpen(false);
                              form.handleSubmit(onSubmitDesign)();
                            }}
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </CardFooter>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>
    </div>
  )
} 