"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"
import { Loader2, QrCode, X, Barcode } from "lucide-react"
import { BrowserMultiFormatReader, NotFoundException } from "@zxing/library"
import { Progress } from "@/components/ui/progress"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Form,
  FormControl,
  FormDescription,
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
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"

// Schema for add item form validation
const addOthersItemSchema = z.object({
  qr_code: z.string().optional(),
  category: z.string({
    required_error: "Please select a category",
  }),
  item_name: z.string({
    required_error: "Please enter an item name",
  }).min(2, {
    message: "Item name must be at least 2 characters",
  }),
  description: z.string().optional(),
  quantity: z.coerce.number({
    required_error: "Please enter a quantity",
    invalid_type_error: "Quantity must be a number",
  }).positive({
    message: "Quantity must be greater than 0",
  }),
  unit: z.string({
    required_error: "Please select a unit",
  }),
  location: z.string().optional(),
  notes: z.string().optional(),
})

type AddOthersItemFormData = z.infer<typeof addOthersItemSchema>

interface OthersItem {
  id: string
  qr_code: string
  category: string
  item_name: string
  description: string | null
  quantity: number
  unit: string
  location: string | null
  notes: string | null
  created_at: string
  updated_at?: string
}

interface AddOthersFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  initialData?: OthersItem
}

export function AddOthersForm({
  open,
  onOpenChange,
  onSuccess,
  initialData,
}: AddOthersFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false)
  const [scanActive, setScanActive] = useState(false)
  const [scannerError, setScannerError] = useState<string | null>(null)
  const [scanProgress, setScanProgress] = useState(0)
  const [selectedVideoInput, setSelectedVideoInput] = useState<MediaDeviceInfo | null>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const scannerRef = useRef<BrowserMultiFormatReader | null>(null)
  const scanProgressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // Initialize React Hook Form
  const form = useForm<AddOthersItemFormData>({
    resolver: zodResolver(addOthersItemSchema),
    defaultValues: {
      qr_code: initialData?.qr_code || "",
      category: initialData?.category || "",
      item_name: initialData?.item_name || "",
      description: initialData?.description || "",
      quantity: initialData?.quantity || 1,
      unit: initialData?.unit || "",
      location: initialData?.location || "",
      notes: initialData?.notes || "",
    },
  })

  // Reset form when dialog opens/closes or initialData changes
  useEffect(() => {
    if (!open) {
      form.reset()
    } else if (initialData) {
      form.reset({
        qr_code: initialData.qr_code || "",
        category: initialData.category,
        item_name: initialData.item_name,
        description: initialData.description || "",
        quantity: initialData.quantity,
        unit: initialData.unit,
        location: initialData.location || "",
        notes: initialData.notes || "",
      })
    }
  }, [open, initialData, form])

  // Clean up camera resources when component unmounts or when modal closes
  useEffect(() => {
    if (!open) {
      stopBarcodeScanner()
    }
    
    return () => {
      stopBarcodeScanner()
    }
  }, [open])

  // Handle form submission
  const onSubmit = async (data: AddOthersItemFormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/inventory/others-item', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to add item")
      }
      
      toast.success("Item added to inventory successfully")
      form.reset()
      onSuccess()
      onOpenChange(false)
    } catch (error) {
      console.error("Error adding item:", error)
      toast.error(error instanceof Error ? error.message : "Failed to add item")
    } finally {
      setIsSubmitting(false)
    }
  }

  // Mock barcode generator for testing during development
  const generateMockBarcode = () => {
    const prefix = "ITEM"
    const randomNum = Math.floor(Math.random() * 10000).toString().padStart(4, '0')
    const barcode = `${prefix}${randomNum}`
    form.setValue("qr_code", barcode)
    toast.success(`Test barcode generated: ${barcode}`)
    stopBarcodeScanner()
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
            throw new Error("Video element not available")
          }
          
          // Create a new scanner
          if (!scannerRef.current) {
            scannerRef.current = new BrowserMultiFormatReader()
          } else {
            scannerRef.current.reset()
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
                const barcode = result.getText()
                form.setValue("qr_code", barcode)
                toast.success(`Barcode scanned: ${barcode}`)
                stopBarcodeScanner()
              }
              
              if (error && !(error instanceof NotFoundException)) {
                console.error("Scanner error:", error)
                if (error.message !== "Stream ended." && !error.message.includes("timeout")) {
                  setScannerError(`Scanner error: ${error.message}`)
                }
              }
            }
          )
        } catch (e) {
          console.error("Error in scanner setup:", e)
          setScannerError(`Failed to initialize scanner: ${(e as Error).message}`)
          stopBarcodeScanner()
        }
      }, 500) // Wait for DOM to update
    } catch (error) {
      console.error("Error starting scanner:", error)
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
        scannerRef.current.reset()
      } catch (err) {
        console.error("Error resetting scanner:", err)
      }
    }
    
    // Reset UI state
    setScanProgress(0)
    setShowBarcodeScanner(false)
    
    // Stop the video tracks
    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks()
      tracks.forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
    
    // Reset the selected video input
    setSelectedVideoInput(null)
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
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40 sticky top-0 bg-background/90 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-lg font-semibold">Add Item to Inventory</h2>
            <p className="text-sm text-muted-foreground">
              Add new item to the inventory
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

        <div className="p-6 space-y-6">
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
                        value={form.getValues("qr_code") || ""}
                        onChange={(e) => form.setValue("qr_code", e.target.value)}
                      />
                      <Button onClick={stopBarcodeScanner}>Done</Button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setScannerError(null)
                        startBarcodeScanner()
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
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="flex space-x-2 items-end">
                  <div className="flex-1">
                    <FormField
                      control={form.control}
                      name="qr_code"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>QR/Barcode (Optional)</FormLabel>
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

                {/* Category and Item Name Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Category Selection */}
                  <FormField
                    control={form.control}
                    name="category"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Category</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="SPAREPARTS">Spare Parts</SelectItem>
                              <SelectItem value="STATIONERY">Office Stationery</SelectItem>
                              <SelectItem value="MISCELLANEOUS">Miscellaneous</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Item Name */}
                  <FormField
                    control={form.control}
                    name="item_name"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Item Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter item name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Quantity and Unit Row */}
                <div className="grid grid-cols-2 gap-4">
                  {/* Quantity Input */}
                  <FormField
                    control={form.control}
                    name="quantity"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Quantity</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="1"
                            placeholder="Enter quantity"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  {/* Unit Input */}
                  <FormField
                    control={form.control}
                    name="unit"
                    render={({ field }) => (
                      <FormItem className="flex flex-col">
                        <FormLabel>Unit</FormLabel>
                        <FormControl>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select a unit" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="piece">Piece</SelectItem>
                              <SelectItem value="box">Box</SelectItem>
                              <SelectItem value="roll">Roll</SelectItem>
                              <SelectItem value="set">Set</SelectItem>
                              <SelectItem value="bottle">Bottle</SelectItem>
                              <SelectItem value="pair">Pair</SelectItem>
                              <SelectItem value="pack">Pack</SelectItem>
                              <SelectItem value="meter">Meter</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                {/* Location Input */}
                <FormField
                  control={form.control}
                  name="location"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Location (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Enter storage location (e.g., 'Cabinet A3', 'Warehouse Shelf B')"
                          {...field}
                          value={field.value || ""}
                          className="bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Description Input */}
                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter a description of the item"
                          {...field}
                          value={field.value || ""}
                          className="resize-none bg-background/50"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                {/* Notes Input */}
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes (Optional)</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Enter any additional notes about the item"
                          {...field}
                          value={field.value || ""}
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
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? "Adding..." : "Add to Inventory"}
                  </Button>
                </div>
              </form>
            </Form>
          )}
        </div>
      </div>
    </div>
  )
} 