"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Camera, X, Barcode, Plus } from "lucide-react"
import { format } from "date-fns"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import { Progress } from "@/components/ui/progress"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

// Form schema for adding paper
const addPaperSchema = z.object({
  barcode_id: z.string().optional(),
  supplier: z.string().optional(),
  paper_type: z.string().min(1, { message: "Paper type is required" }),
  gsm: z.string().min(1, { message: "GSM is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  remaining_length: z.string().optional(),
  notes: z.string().optional(),
  created_at: z.date(),
})

type AddPaperFormValues = z.infer<typeof addPaperSchema>

interface AddPaperFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: AddPaperFormValues & { remaining_length: string }) => Promise<void>
}

export function AddPaperForm({ open, onOpenChange, onSubmit }: AddPaperFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [remainingLength, setRemainingLength] = useState<string>("")
  const [scanActive, setScanActive] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const scanProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [selectedVideoInput, setSelectedVideoInput] = useState<MediaDeviceInfo | null>(null)

  // Initialize form
  const form = useForm<AddPaperFormValues>({
    resolver: zodResolver(addPaperSchema),
    defaultValues: {
      barcode_id: "",
      supplier: "",
      paper_type: "Sublimation Paper",
      gsm: "",
      width: "",
      length: "",
      remaining_length: "",
      notes: "",
      created_at: new Date(),
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

  // Update remaining length when length changes
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "length") {
        const length = form.getValues("length")
        if (length) {
          setRemainingLength(length)
          form.setValue("remaining_length", length)
        } else {
          setRemainingLength("")
          form.setValue("remaining_length", "")
        }
      }
    })
    
    return () => subscription.unsubscribe()
  }, [form])

  // Clean up camera resources when component unmounts or when modal closes
  useEffect(() => {
    if (!open) {
      stopBarcodeScanner();
    }
    
    return () => {
      stopBarcodeScanner();
    }
  }, [open])

  // Mock barcode generator for testing during development
  const generateMockBarcode = () => {
    const prefix = "PAPER";
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    const barcode = `${prefix}${randomNum}`;
    form.setValue("barcode_id", barcode);
    toast.success(`Test barcode generated: ${barcode}`);
    stopBarcodeScanner();
  }

  // Handle barcode scan
  const startBarcodeScanner = async () => {
    try {
      setShowBarcodeScanner(true)
      setScanActive(true)
      setScannerError(null)
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

      // Wait for the video element to be in the DOM
      setTimeout(async () => {
        try {
          if (!videoRef.current) {
            throw new Error("Video element not available");
          }
          
          // Create a new scanner
          if (!scannerRef.current) {
            scannerRef.current = new BrowserMultiFormatReader();
          } else {
            scannerRef.current.reset();
          }
          
          // Start scanner with selected device
          await scannerRef.current.decodeFromVideoDevice(
            selectedVideoInput?.deviceId || null,
            videoRef.current,
            (result, error) => {
              if (result) {
                // Clear interval and set progress to 100% on success
                if (scanProgressIntervalRef.current) {
                  clearInterval(scanProgressIntervalRef.current)
                  scanProgressIntervalRef.current = null
                }
                setScanProgress(100)
                
                // Process scan result
                const barcode = result.getText();
                form.setValue("barcode_id", barcode);
                toast.success(`Barcode scanned: ${barcode}`);
                stopBarcodeScanner();
              }
              
              if (error && !(error instanceof NotFoundException)) {
                console.error("Scanner error:", error);
                if (error.message !== "Stream ended." && !error.message.includes("timeout")) {
                  setScannerError(`Scanner error: ${error.message}`);
                }
              }
            }
          );
        } catch (e) {
          console.error("Error in scanner setup:", e);
          setScannerError(`Failed to initialize scanner: ${(e as Error).message}`);
          stopBarcodeScanner();
        }
      }, 500); // Wait for DOM to update
    } catch (error) {
      console.error("Error starting scanner:", error);
      setScannerError(`Failed to start scanner: ${(error as Error).message}`);
      stopBarcodeScanner();
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
    
    // Reset UI state
    setScanProgress(0)
    setShowBarcodeScanner(false)
    
    // Stop the video tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }
    
    // Reset the selected video input
    setSelectedVideoInput(null);
  }

  // Manual capture - for ZXing we don't need this as it's always scanning
  // but we'll keep a simplified version for user experience
  const captureBarcodeImage = () => {
    toast.info("Scanner is already active. Hold the barcode in view.");
  }

  // Handle form submission
  const handleSubmit = async (data: AddPaperFormValues) => {
    try {
      setIsLoading(true)
      
      // Add remaining_length to the data if not already set
      if (!data.remaining_length) {
        data.remaining_length = data.length
      }
      
      // Format data to match the API expectations
      const formattedData = {
        ...data,
        name: `${data.paper_type} ${data.gsm}gsm ${data.width}x${data.length}cm`,
        type: data.paper_type,  // Renamed from paper_type to type in the schema
        qrCode: data.barcode_id, // Renamed from barcode_id to qrCode in the schema
        gsm: parseInt(data.gsm),
        width: parseFloat(data.width),
        height: parseFloat(data.width), // Use width as height by default
        length: parseFloat(data.length),
        remainingLength: parseFloat(data.remaining_length), // Renamed from remaining_length to remainingLength
        manufacturer: data.supplier, // Map supplier to manufacturer
        availability: "YES",
        dateAdded: data.created_at, // Map created_at to dateAdded
      }
      
      await onSubmit(data as AddPaperFormValues & { remaining_length: string })
      
      // Reset form
      form.reset({
        barcode_id: "",
        supplier: "",
        paper_type: "Sublimation Paper",
        gsm: "",
        width: "",
        length: "",
        remaining_length: "",
        notes: "",
        created_at: new Date(),
      })
      setRemainingLength("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting paper data:", error)
      toast.error("Failed to add paper")
    } finally {
      setIsLoading(false)
    }
  }

  if (!open) return null

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
                      onChange={(e) => form.setValue("barcode_id", e.target.value)}
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
                <h2 className="text-lg font-semibold">Add Paper Stock</h2>
                <p className="text-sm text-muted-foreground">
                  Add new paper to the inventory
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

                  <FormField
                    control={form.control}
                    name="supplier"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Supplier</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter supplier name"
                            className="bg-background/50"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paper_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Paper Type</FormLabel>
                        <FormControl>
                          <Select
                            {...field}
                            onValueChange={(value) => field.onChange(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select paper type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sublimation Paper">Sublimation Paper</SelectItem>
                              <SelectItem value="DTF Film">DTF Film</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="gsm"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>GSM*</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter GSM"
                              className="bg-background/50"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="width"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Width* (cm)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" className="bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="length"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Length* (cm)</FormLabel>
                          <FormControl>
                            <Input {...field} type="number" min="0" className="bg-background/50" />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="created_at"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Date Added</FormLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <FormControl>
                              <Button
                                variant={"outline"}
                                className={cn(
                                  "w-full pl-3 text-left font-normal bg-background/50",
                                  !field.value && "text-muted-foreground"
                                )}
                              >
                                {field.value ? (
                                  format(field.value, "PPP")
                                ) : (
                                  <span>Pick a date</span>
                                )}
                              </Button>
                            </FormControl>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={field.value}
                              onSelect={(date) => field.onChange(date || new Date())}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea 
                            {...field} 
                            placeholder="Additional information about this paper stock" 
                            className="resize-none bg-background/50" 
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
                    <Button type="submit" disabled={isLoading}>
                      {isLoading ? "Adding..." : "Add Paper Stock"}
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