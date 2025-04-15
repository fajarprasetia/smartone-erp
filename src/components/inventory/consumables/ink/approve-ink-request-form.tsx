"use client"

import { useState, useEffect, useRef } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Barcode, X } from "lucide-react"
import { BrowserMultiFormatReader } from "@zxing/library"
import { Progress } from "@/components/ui/progress"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"

// Form schema for barcode input
const barcodeInputSchema = z.object({
  barcode_id: z.string().min(1, { message: "Barcode is required" }),
});

type BarcodeInputFormValues = z.infer<typeof barcodeInputSchema>

// Ink request interface
interface InkRequest {
  id: string
  ink_stock_id?: string
  requested_by: string
  requester_name?: string
  ink_type: string
  color: string
  quantity: string
  unit: string
  user_notes?: string
  created_at: string
  approved: boolean
  approved_by_id?: string
  approved_date?: string
  rejected: boolean
  rejected_by_id?: string
  rejected_date?: string
  rejection_reason?: string
  status?: string
  requested_by_user?: {
    id: string
    name: string
  }
}

interface ApproveInkRequestFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  inkRequest: InkRequest | null
  onSubmit: (requestId: string, data: BarcodeInputFormValues) => Promise<void>
}

export function ApproveInkRequestForm({ 
  open, 
  onOpenChange, 
  inkRequest,
  onSubmit 
}: ApproveInkRequestFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [validationError, setValidationError] = useState<string | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const scanProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Initialize form
  const form = useForm<BarcodeInputFormValues>({
    resolver: zodResolver(barcodeInputSchema),
    defaultValues: {
      barcode_id: "",
    },
  })

  // Add overflow hidden to body when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = "auto"
    }
    return () => {
      document.body.style.overflow = "auto"
    }
  }, [open])

  // Clean up camera resources when component unmounts or when modal closes
  useEffect(() => {
    if (!open) {
      stopBarcodeScanner();
    }
    
    return () => {
      stopBarcodeScanner();
    }
  }, [open])

  // Reset errors when form opens or changes
  useEffect(() => {
    if (open) {
      setValidationError(null);
    }
  }, [open, form.formState.isDirty]);

  // Mock barcode generator for testing during development
  const generateMockBarcode = () => {
    const prefix = "INK";
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = `${prefix}${randomNum}`;
    form.setValue("barcode_id", barcode, { shouldValidate: true });
    form.trigger("barcode_id");
    toast.success(`Test barcode generated: ${barcode}`);
    stopBarcodeScanner();
  }

  // Handle barcode scan
  const startBarcodeScanner = async () => {
    try {
      setShowBarcodeScanner(true)
      setScannerError(null)
      setScanActive(true)
      setScanProgress(0)
      
      // Clear any existing interval
      if (scanProgressIntervalRef.current) {
        clearInterval(scanProgressIntervalRef.current)
      }

      // Set up progress animation
      scanProgressIntervalRef.current = setInterval(() => {
        setScanProgress((prev) => {
          // Reset to near 0 when it reaches 100
          if (prev >= 100) return 5
          // Gradually increase, but never quite reach 100 until success
          return prev + (95 - prev) * 0.05
        })
      }, 100)
      
      // Check if we have camera access at all - necessary for local development
      if (!navigator.mediaDevices || typeof navigator.mediaDevices.getUserMedia !== 'function') {
        console.log("Camera API not available - likely due to non-HTTPS connection in local development");
        setScannerError(
          "Camera access is not available in this environment. " +
          "This feature requires HTTPS for security reasons. " +
          "It will work when deployed to production with HTTPS."
        );
        return;
      }
      
      // Wait a bit for the video element to be rendered in the DOM
      setTimeout(async () => {
        try {
          if (!videoRef.current) {
            throw new Error("Video element not available");
          }
          
          // Clean up any existing scanner to prevent conflicts
          if (scannerRef.current) {
            try {
              scannerRef.current.reset();
            } catch (e) {
              console.error("Error resetting scanner:", e);
            }
          }
          
          try {
            // Create a new scanner without any special configurations
            scannerRef.current = new BrowserMultiFormatReader();
            
            console.log("Starting scanner with default camera");
            
            // Start continuous scanning
            await scannerRef.current.decodeFromVideoDevice(
              null, 
              videoRef.current,
              (result, error) => {
                if (result) {
                  // Clear interval and set progress to 100% on success
                  if (scanProgressIntervalRef.current) {
                    clearInterval(scanProgressIntervalRef.current)
                    scanProgressIntervalRef.current = null
                  }
                  setScanProgress(100)
                  
                  const barcode = result.getText();
                  form.setValue("barcode_id", barcode, { shouldValidate: true });
                  form.trigger("barcode_id");
                  toast.success(`Barcode scanned: ${barcode}`);
                  stopBarcodeScanner();
                }
                
                // Only log important errors
                if (error && 
                    error.name !== "NotFoundException" && 
                    !(error instanceof TypeError)) {
                  console.error("Scanner error:", error);
                  setScannerError(`Scanner error: ${error.message}`);
                }
              }
            );
            
            console.log("Scanner started successfully");
          } catch (deviceError) {
            console.error("Error accessing camera:", deviceError);
            setScannerError(
              "Could not access camera. Please check your camera permissions " +
              "or try entering the barcode manually."
            );
          }
        } catch (error) {
          console.error("Error setting up barcode scanner:", error);
          setScannerError(
            "Could not initialize barcode scanner. " + 
            "This may be because you're using an insecure connection (non-HTTPS)."
          );
        }
      }, 500); // Wait 500ms for the DOM to update
    } catch (error) {
      setScannerError(`Failed to start scanner: ${(error as Error).message}`)
      stopBarcodeScanner()
    }
  }

  const stopBarcodeScanner = () => {
    setScanActive(false)
    
    // Clear the progress interval
    if (scanProgressIntervalRef.current) {
      clearInterval(scanProgressIntervalRef.current)
      scanProgressIntervalRef.current = null
    }
    
    // Reset scanner if it exists
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (err) {
        console.error("Error resetting scanner:", err);
      }
    }
    
    // Stop the video tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset UI state
    setScanProgress(0)
    setShowBarcodeScanner(false)
  }

  // Handle form submission
  const handleSubmit = async (data: BarcodeInputFormValues) => {
    if (!inkRequest) return;
    
    setValidationError(null);
    
    try {
      setIsLoading(true)
      
      // Validate barcode against ink request specifications
      let validateResponse;
      let retries = 0;
      const maxRetries = 2;
      
      while (retries <= maxRetries) {
        try {
          validateResponse = await fetch(`/api/inventory/ink-stock/validate`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              barcode_id: data.barcode_id,
              ink_type: inkRequest.ink_type,
              color: inkRequest.color,
              quantity: inkRequest.quantity,
              unit: inkRequest.unit
            }),
          });
          
          // If response is ok or not a 500 error, break the retry loop
          if (validateResponse.ok || validateResponse.status !== 500) {
            break;
          }
          
          // Only retry on 500 errors (server errors)
          retries++;
          console.log(`Retry attempt ${retries} after server error`);
          
          // Add exponential backoff
          await new Promise(resolve => setTimeout(resolve, retries * 1000));
        } catch (fetchError) {
          console.error("Fetch error during validation:", fetchError);
          retries++;
          
          // If we've reached max retries, rethrow the error
          if (retries > maxRetries) {
            throw fetchError;
          }
          
          // Wait before retrying
          await new Promise(resolve => setTimeout(resolve, retries * 1000));
        }
      }
      
      if (!validateResponse) {
        throw new Error("Failed to connect to server after multiple attempts");
      }
      
      let validateData;
      try {
        validateData = await validateResponse.json();
      } catch (jsonError) {
        console.error("Error parsing JSON response:", jsonError);
        throw new Error("Invalid response from server");
      }
      
      if (!validateResponse.ok) {
        setValidationError(validateData.details || validateData.error || 'Barcode validation failed');
        throw new Error(validateData.error || 'Barcode does not match ink specifications');
      }
      
      // If validation passed, proceed with approval
      await onSubmit(inkRequest.id, data)
      
      // Reset form
      form.reset()
      onOpenChange(false)
    } catch (error) {
      console.error("Error approving request:", error)
      if (!validationError) {
        toast.error(error instanceof Error ? error.message : "Failed to approve request")
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (!open || !inkRequest) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (showBarcodeScanner) {
            stopBarcodeScanner()
          } else {
            onOpenChange(false)
          }
        }}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto max-h-[90vh]">
        {showBarcodeScanner ? (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Scan Barcode</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopBarcodeScanner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            
            {scannerError ? (
              <div className="space-y-4">
                <div className="bg-red-500/10 border border-red-500/30 text-red-500 p-4 rounded-md text-sm">
                  {scannerError}
                </div>
                
                <div className="space-y-3">
                  <p className="text-sm">Enter your barcode manually instead:</p>
                  <div className="flex space-x-2">
                    <Input 
                      placeholder="Type barcode number"
                      className="bg-background"
                      value={form.getValues("barcode_id") || ""}
                      onChange={(e) => {
                        form.setValue("barcode_id", e.target.value, { shouldValidate: true });
                        form.trigger("barcode_id");
                      }}
                    />
                    <Button onClick={stopBarcodeScanner}>Done</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setScannerError(null);
                      startBarcodeScanner();
                    }}
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={generateMockBarcode}
                  >
                    Generate Test Barcode
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Note: The test barcode option is available for development purposes
                </p>
              </div>
            ) : (
              <>
                <div className="relative overflow-hidden rounded-lg border border-border h-64 bg-black">
                  <video 
                    ref={videoRef} 
                    className="absolute inset-0 h-full w-full object-cover"
                    autoPlay
                    playsInline
                    muted
                  />
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-4/5 h-3/5 border-2 border-yellow-400/50 rounded-lg"></div>
                  </div>
                  {scanActive && (
                    <div className="absolute bottom-2 left-2 bg-yellow-500 h-2 w-2 rounded-full animate-pulse"></div>
                  )}
                </div>
                
                {scanActive && (
                  <div className="space-y-1 mt-2">
                    <Progress value={scanProgress} className="h-1" />
                    <p className="text-xs text-center text-muted-foreground">Scanning...</p>
                  </div>
                )}
                
                <Button onClick={() => stopBarcodeScanner()} variant="outline" className="w-full">
                  <X className="h-4 w-4 mr-2" /> Cancel
                </Button>
                
                <p className="text-sm text-muted-foreground text-center">
                  Position the barcode within the highlighted area. Scanning automatically...
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <div className="flex justify-between items-center p-6 border-b border-border/40">
              <div>
                <h2 className="text-lg font-semibold">Approve Ink Request</h2>
                <p className="text-sm text-muted-foreground">
                  Enter or scan a barcode to assign to this ink stock
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-6">
              {/* Request details */}
              <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-border/40">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <p><span className="font-medium">Requested by:</span> {inkRequest.requester_name || "N/A"}</p>
                  <p><span className="font-medium">Ink type:</span> {inkRequest.ink_type}</p>
                  <p><span className="font-medium">Color:</span> {inkRequest.color}</p>
                  <p><span className="font-medium">Quantity:</span> {inkRequest.quantity} {inkRequest.unit}</p>
                </div>
                {inkRequest.user_notes && (
                  <div className="mt-2 pt-2 border-t border-border/40">
                    <p className="font-medium">Notes:</p>
                    <p className="text-sm mt-1">{inkRequest.user_notes}</p>
                  </div>
                )}
              </div>

              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                  <div className="flex space-x-2 items-end">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="barcode_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode ID</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Enter or scan barcode"
                                className="bg-background/50"
                                onChange={(e) => {
                                  field.onChange(e);
                                  form.trigger("barcode_id");
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="mb-1"
                      onClick={startBarcodeScanner}
                    >
                      <Barcode className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {validationError && (
                    <div className="text-sm text-red-600 bg-red-100 rounded p-2">
                      {validationError}
                    </div>
                  )}
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isLoading || !form.formState.isValid}>
                      {isLoading ? "Approving..." : "Approve Request"}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}
      </div>
    </div>
  )
} 