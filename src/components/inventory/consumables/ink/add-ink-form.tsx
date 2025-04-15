"use client"

import { useState, useRef, useEffect } from "react"
import { toast } from "sonner"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import JsBarcode from "jsbarcode"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { CalendarIcon, XCircle, Loader2, QrCode, Printer, RefreshCw } from "lucide-react"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { Progress } from "@/components/ui/progress"

const formSchema = z.object({
  barcode_id: z.string().min(1, { message: "Barcode ID is required" }),
  supplier: z.string().optional(),
  ink_type: z.string().min(1, { message: "Ink type is required" }),
  color: z.string().min(1, { message: "Color is required" }),
  custom_color: z.string().optional(),
  quantity: z.string().min(1, { message: "Quantity is required" }),
  unit: z.string().min(1, { message: "Unit is required" }),
  created_at: z.date().optional(),
  notes: z.string().optional(),
});

type AddInkFormProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => Promise<void>;
};

export function AddInkForm({ open, onOpenChange, onSubmit }: AddInkFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [scanActive, setScanActive] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [showScanner, setShowScanner] = useState(false);
  const [videoInputs, setVideoInputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<string | null>(null);
  const [scannerError, setScannError] = useState<string | null>(null);
  const [scannerInitializing, setScannerInitializing] = useState(false);
  const [showBarcodePreview, setShowBarcodePreview] = useState(false);
  const [lastGeneratedBarcode, setLastGeneratedBarcode] = useState<string | null>(null);
  const [showCustomColorField, setShowCustomColorField] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null);
  const scanProgressInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const printFrameRef = useRef<HTMLIFrameElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barcode_id: "",
      supplier: "",
      ink_type: "Sublimation Ink",
      color: "",
      custom_color: "",
      quantity: "",
      unit: "ml",
      notes: "",
    },
  });

  // Watch the color field to show/hide custom color field
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'color' && value.color === 'Others') {
        setShowCustomColorField(true);
      } else if (name === 'color') {
        setShowCustomColorField(false);
        form.setValue('custom_color', '');
      }
    });
    return () => subscription.unsubscribe();
  }, [form]);

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

  // Clean up scanner on unmount or when dialog closes
  useEffect(() => {
    if (!open) {
      stopBarcodeScanner();
    }

    return () => {
      stopBarcodeScanner();
    };
  }, [open]);

  // Start barcode scanner
  const startBarcodeScanner = async () => {
    // Prevent multiple initializations
    if (scannerInitializing) return;
    
    try {
      // First clean up any existing scanner
      stopBarcodeScanner();
      
      setScannerInitializing(true);
      setShowScanner(true);
      setScanActive(true);
      setScanProgress(0);
      setScannError(null);
      
      // Clear any existing interval
      if (scanProgressInterval.current) {
        clearInterval(scanProgressInterval.current);
      }
      
      // Set up progress animation
      scanProgressInterval.current = setInterval(() => {
        setScanProgress((prev) => {
          // Reset to near 0 when it reaches 100
          if (prev >= 100) return 5;
          // Gradually increase, but never quite reach 100 until success
          return prev + (95 - prev) * 0.05;
        });
      }, 100);
      
      // Wait for the video element to be in the DOM
      setTimeout(async () => {
        try {
          if (!videoRef.current) {
            throw new Error("Video element not available");
          }
          
          // Get available video devices
          const devices = await navigator.mediaDevices.enumerateDevices();
          const cameras = devices.filter(device => device.kind === "videoinput");
          setVideoInputs(cameras);
          
          // Use the first camera if no camera is selected
          if (!selectedDevice && cameras.length > 0) {
            setSelectedDevice(cameras[0].deviceId);
          }
          
          const deviceId = selectedDevice || (cameras.length > 0 ? cameras[0].deviceId : null);
          
          if (!deviceId) {
            throw new Error("No camera detected");
          }
          
          // Get video stream
          const constraints = {
            video: {
              deviceId: deviceId ? { exact: deviceId } : undefined,
              width: { ideal: 1280 },
              height: { ideal: 720 },
              facingMode: 'environment' // Prefer back camera on mobile
            }
          };
          
          // Get the video stream
          const stream = await navigator.mediaDevices.getUserMedia(constraints);
          streamRef.current = stream;
          
          // Apply stream to video element if still in DOM
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            
            // Use a promise and proper event handling for play()
            try {
              // The loadedmetadata event ensures the video is ready to play
              await new Promise<void>((resolve, reject) => {
                if (!videoRef.current) {
                  reject(new Error("Video element not available"));
                  return;
                }
                
                const videoElement = videoRef.current;
                
                // Set up event handlers
                const handleMetadata = () => {
                  videoElement.removeEventListener('loadedmetadata', handleMetadata);
                  resolve();
                };
                
                const handleError = (e: Event) => {
                  videoElement.removeEventListener('error', handleError);
                  reject(new Error(`Video error: ${(e as ErrorEvent).message}`));
                };
                
                videoElement.addEventListener('loadedmetadata', handleMetadata);
                videoElement.addEventListener('error', handleError);
                
                // In case video is already loaded
                if (videoElement.readyState >= 2) {
                  resolve();
                }
              });
              
              // Play the video after metadata is loaded
              await videoRef.current.play();
            } catch (playError) {
              console.error("Error setting up video:", playError);
              throw new Error(`Failed to play video: ${(playError as Error).message}`);
            }
          } else {
            throw new Error("Video element not available");
          }
          
          // Initialize barcode scanner after video is playing
          if (!scannerRef.current) {
            scannerRef.current = new BrowserMultiFormatReader();
          } else {
            scannerRef.current.reset();
          }
          
          // Start scanning with a slight delay to ensure video is playing
          setTimeout(async () => {
            try {
              if (!scannerRef.current || !videoRef.current) {
                throw new Error("Scanner or video not available");
              }
              
              await scannerRef.current.decodeFromVideoDevice(
                deviceId,
                videoRef.current,
                (result, error) => {
                  if (result) {
                    // Clear interval and set progress to 100% on success
                    if (scanProgressInterval.current) {
                      clearInterval(scanProgressInterval.current);
                      scanProgressInterval.current = null;
                    }
                    setScanProgress(100);
                    
                    // Process scan result
                    const barcode = result.getText();
                    form.setValue("barcode_id", barcode);
                    toast.success(`Barcode scanned: ${barcode}`);
                    stopBarcodeScanner();
                  }
                  
                  if (error && !(error instanceof NotFoundException)) {
                    console.error("Scanner error:", error);
                    if (error.message !== "Stream ended." && !error.message.includes("timeout")) {
                      setScannError(`Scanner error: ${error.message}`);
                    }
                  }
                }
              );
            } catch (scanError) {
              console.error("Error starting scanner:", scanError);
              setScannError(`Scanner error: ${(scanError as Error).message}`);
            }
          }, 300);
        } catch (e) {
          console.error("Error in scanner setup:", e);
          setScannError(`Failed to initialize scanner: ${(e as Error).message}`);
          stopBarcodeScanner();
        } finally {
          setScannerInitializing(false);
        }
      }, 300); // Wait for DOM to update
      
    } catch (error) {
      console.error("Error starting scanner:", error);
      setScannError(error instanceof Error ? error.message : "Failed to access camera");
      toast.error("Could not access camera");
      stopBarcodeScanner();
      setScannerInitializing(false);
    }
  };

  // Stop barcode scanner
  const stopBarcodeScanner = () => {
    setScanActive(false);
    setScannerInitializing(false);
    
    // Clear the progress interval
    if (scanProgressInterval.current) {
      clearInterval(scanProgressInterval.current);
      scanProgressInterval.current = null;
    }
    
    // Reset scanner if it exists
    if (scannerRef.current) {
      try {
        scannerRef.current.reset();
      } catch (err) {
        console.error("Error resetting scanner:", err);
      }
    }
    
    // Reset UI state
    setScanProgress(0);
    
    // Stop the video tracks
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Only hide scanner after things are reset
    setShowScanner(false);
    
    // Reset the selected video input
    setSelectedDevice(null);
  };

  // Generate test barcode
  const generateTestBarcode = () => {
    const testBarcode = `INK-${Math.floor(Math.random() * 10000).toString().padStart(4, '0')}`;
    form.setValue("barcode_id", testBarcode);
    toast.success(`Test barcode generated: ${testBarcode}`);
  };

  // Generate a barcode ID with format SMTINKMMYY001
  const generateBarcodeId = async () => {
    try {
      setIsLoading(true);
      
      // Get current month and year in MMYY format
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = String(now.getFullYear()).slice(-2);
      const mmyy = `${month}${year}`;
      
      // Create barcode prefix
      const prefix = `SMTINK${mmyy}`;
      
      try {
        // Try to fetch from API
        const response = await fetch(`/api/inventory/ink-stock/next-barcode?prefix=${prefix}`);
        
        if (response.ok) {
          const data = await response.json();
          const barcodeId = data.nextBarcodeId;
          
          // Set the barcode ID in the form
          form.setValue("barcode_id", barcodeId);
          setLastGeneratedBarcode(barcodeId);
          toast.success(`Generated barcode: ${barcodeId}`);
          
          // Pre-render the barcode
          setTimeout(() => {
            renderBarcodePreview(barcodeId);
          }, 100);
          return;
        }
        throw new Error('API response not OK');
      } catch (apiError) {
        console.warn('API fetch error, using fallback generation:', apiError);
        // Continue to fallback generation
      }
      
      // Fallback generation - local generation without API
      const randomSeq = Math.floor(Math.random() * 999) + 1;
      const seq = String(randomSeq).padStart(3, '0');
      const fallbackBarcodeId = `SMTINK${mmyy}${seq}`;
      
      form.setValue("barcode_id", fallbackBarcodeId);
      setLastGeneratedBarcode(fallbackBarcodeId);
      toast.success(`Generated barcode: ${fallbackBarcodeId}`);
      
      // Pre-render the barcode
      setTimeout(() => {
        renderBarcodePreview(fallbackBarcodeId);
      }, 100);
    } catch (error) {
      console.error('Error generating barcode ID:', error);
      toast.error('Failed to generate barcode');
    } finally {
      setIsLoading(false);
    }
  };

  // Render the barcode preview
  const renderBarcodePreview = (barcodeId: string) => {
    if (!barcodeCanvasRef.current) return;
    
    try {
      JsBarcode(barcodeCanvasRef.current, barcodeId, {
        format: "CODE128",
        width: 2,
        height: 50,
        displayValue: false,
        margin: 0,
        background: "#ffffff"
      });
      
      setShowBarcodePreview(true);
    } catch (error) {
      console.error('Error rendering barcode:', error);
      toast.error('Failed to render barcode preview');
    }
  };

  // Print the barcode label
  const printBarcode = () => {
    try {
      const barcode = form.getValues("barcode_id");
      const inkType = form.getValues("ink_type");
      let color = form.getValues("color");
      
      // Use custom color if "Others" is selected
      if (color === 'Others') {
        const customColor = form.getValues("custom_color");
        if (customColor) {
          color = customColor;
        }
      }
      
      const supplier = form.getValues("supplier") || "SMARTONE";
      const quantity = form.getValues("quantity");
      const unit = form.getValues("unit");
      const colorFirstChar = color ? color.charAt(0).toUpperCase() : "";
      const dateAdded = new Date();
      const formattedDate = format(dateAdded, "dd-MM-yyyy");
      
      // Create a new window for printing
      const printContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>Print Barcode</title>
          <style>
            @page {
              size: 35mm 25mm;
              margin: 0;
            }
            body {
              margin: 0;
              padding: 0;
              width: 35mm;
              height: 25mm;
              font-family: Arial, sans-serif;
            }
            .barcode-container {
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              padding: 1mm;
              box-sizing: border-box;
            }
            .ink-type {
              font-size: 6pt;
              font-weight: bold;
              text-align: center;
              margin-bottom: 1mm;
            }
            .barcode-image {
              height: 7mm;
              width: 100%;
              text-align: center;
            }
            .barcode-id {
              font-size: 6pt;
              text-align: center;
              margin-top: 0mm;
            }
            .color-box {
              position: absolute;
              bottom: 2mm;
              left: 2mm;
              width: 5mm;
              height: 5mm;
              border: 1px solid black;
              display: flex;
              align-items: center;
              justify-content: center;
              font-weight: bold;
              font-size: 8pt;
            }
            .supplier {
              position: absolute;
              bottom: 5mm;
              left: 9mm;
              font-size: 5pt;
            }
            .quantity {
              position: absolute;
              bottom: 2mm;
              right: 2mm;
              font-size: 8pt;
              font-weight: bold;
              text-align: right;
            }
            .color-name {
              position: absolute;
              bottom: 5mm;
              right: 2mm;
              font-size: 6pt;
              text-align: right;
            }
            .date {
              position: absolute;
              bottom: 2mm;
              left: 50%;
              transform: translateX(-50%);
              font-size: 5pt;
              text-align: center;
            }
          </style>
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
        </head>
        <body>
          <div class="barcode-container">
            <div class="ink-type">${inkType.toUpperCase()}</div>
            <div class="barcode-image">
              <svg id="barcode"></svg>
            </div>
            <div class="barcode-id">${barcode}</div>
            <div class="color-box">${colorFirstChar}</div>
            <div class="supplier">${supplier}</div>
            <div class="quantity">${quantity} ${unit.toUpperCase()}</div>
            <div class="color-name">${color.toUpperCase()}</div>
            <div class="date">${formattedDate}</div>
          </div>
          <script>
            // Load JsBarcode and generate barcode
            document.addEventListener('DOMContentLoaded', function() {
              JsBarcode("#barcode", "${barcode}", {
                format: "CODE128",
                width: 1,
                height: 30,
                displayValue: false,
                margin: 0,
                background: "#ffffff"
              });
              
              // Wait a bit for rendering and then print
              setTimeout(function() {
                window.print();
                // Don't close the window immediately to prevent issues with printing
                // Let the user close it manually or they can wait for auto-close
                setTimeout(function() {
                  try {
                    window.close();
                  } catch (e) {
                    console.log('Window close prevented by browser');
                  }
                }, 1000);
              }, 500);
            });
          </script>
        </body>
        </html>
      `;

      // Use iframe method as fallback if window.open doesn't work
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.open();
        printWindow.document.write(printContent);
        printWindow.document.close();
        toast.success('Preparing barcode for printing...');
      } else {
        // Fallback to iframe
        if (printFrameRef.current) {
          const iframe = printFrameRef.current;
          iframe.style.display = 'block';
          iframe.style.position = 'fixed';
          iframe.style.left = '-9999px';
          
          const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
          if (iframeDoc) {
            iframeDoc.open();
            iframeDoc.write(printContent);
            iframeDoc.close();
            toast.success('Preparing barcode for printing via iframe...');
          } else {
            throw new Error('Could not access iframe document');
          }
        } else {
          throw new Error('Print iframe not available');
        }
      }
    } catch (error) {
      console.error('Error printing barcode:', error);
      toast.error('Failed to print barcode. Please check if pop-ups are allowed.');
    }
  };

  // Handle form submission
  const handleFormSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsLoading(true);
      
      // Use custom color if "Others" is selected
      const finalColor = values.color === 'Others' && values.custom_color 
        ? values.custom_color 
        : values.color;
      
      // Add calculated name field based on color and type
      const dataToSubmit = {
        ...values,
        color: finalColor,
        name: `${finalColor} ${values.ink_type}`, // Generate name from color and type
        availability: "YES", // Set availability to YES
      };
      
      // Remove custom_color as it's not in the database schema
      delete dataToSubmit.custom_color;
      
      await onSubmit(dataToSubmit);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error("Error submitting form:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => {
          if (showScanner) {
            stopBarcodeScanner()
          } else {
            onOpenChange(false)
          }
        }}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto max-h-[90vh]">
        {showScanner ? (
          <div className="p-6 space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Scan Barcode</h3>
              <Button
                variant="ghost"
                size="icon"
                onClick={stopBarcodeScanner}
              >
                <XCircle className="h-4 w-4" />
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
                      onChange={(e) => form.setValue("barcode_id", e.target.value)}
                    />
                    <Button onClick={stopBarcodeScanner}>Done</Button>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 pt-2">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setScannError(null);
                      startBarcodeScanner();
                    }}
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="secondary"
                    onClick={generateTestBarcode}
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
                    id="barcode-scanner-view"
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
                    <Progress 
                      value={scanProgress} 
                      className="h-1" 
                      role="progressbar"
                      aria-label="Barcode scanning progress"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={scanProgress}
                    />
                    <p className="text-xs text-center text-muted-foreground">Scanning...</p>
                  </div>
                )}
                
                <Button onClick={() => stopBarcodeScanner()} variant="outline" className="w-full">
                  <XCircle className="h-4 w-4 mr-2" /> Cancel
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
                <h2 className="text-lg font-semibold">Add New Ink</h2>
                <p className="text-sm text-muted-foreground">
                  Fill in the details below to add a new ink to inventory.
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
              >
                <XCircle className="h-4 w-4" />
              </Button>
            </div>
            
            <div className="p-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                  <div className="flex space-x-2 items-end">
                    <div className="flex-1">
                      <FormField
                        control={form.control}
                        name="barcode_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Barcode ID</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input 
                                  placeholder="Enter barcode ID" 
                                  {...field} 
                                  className="bg-background/50"
                                />
                              </FormControl>
                              <Button
                                type="button"
                                variant="outline"
                                size="icon"
                                onClick={generateBarcodeId}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <RefreshCw className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
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
                      <QrCode className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {showBarcodePreview && lastGeneratedBarcode && (
                    <div className="p-2 border rounded-lg bg-white flex flex-col items-center space-y-2">
                      <canvas ref={barcodeCanvasRef} className="w-full h-10"></canvas>
                      <Button
                        type="button" 
                        variant="outline" 
                        onClick={printBarcode}
                        className="w-full text-xs"
                      >
                        <Printer className="h-3 w-3 mr-1" /> Print Barcode Label
                      </Button>
                    </div>
                  )}
                  
                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier (Optional)</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter supplier name" 
                            {...field} 
                            className="bg-background/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="ink_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Ink Type</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="Sublimation Ink">Sublimation Ink</option>
                            <option value="DTF Ink">DTF Ink</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="color"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Color</FormLabel>
                        <FormControl>
                          <select
                            className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            {...field}
                          >
                            <option value="" disabled>Select a color</option>
                            <option value="CYAN">CYAN</option>
                            <option value="MAROON">MAROON</option>
                            <option value="YELLOW">YELLOW</option>
                            <option value="KEY/BLACK">KEY/BLACK</option>
                            <option value="WHITE">WHITE</option>
                            <option value="Others">Others</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {showCustomColorField && (
                    <FormField
                      control={form.control}
                      name="custom_color"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custom Color</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="Enter custom color name" 
                              {...field} 
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Quantity</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="e.g. 1000" 
                              {...field} 
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="unit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit</FormLabel>
                          <FormControl>
                            <select
                              className="flex h-10 w-full rounded-md border border-input bg-background/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                              {...field}
                            >
                              <option value="ml">ml</option>
                              <option value="L">L</option>
                              <option value="kg">kg</option>
                              <option value="gr">gr</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional information about this ink"
                            className="resize-none bg-background/50"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="flex justify-end space-x-2 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isLoading}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Add Ink"
                      )}
                    </Button>
                  </div>
                </form>
              </Form>
            </div>
          </>
        )}
      </div>
      
      {/* Hidden iframe for printing if needed */}
      <iframe ref={printFrameRef} style={{ display: 'none' }}></iframe>
    </div>
  );
} 