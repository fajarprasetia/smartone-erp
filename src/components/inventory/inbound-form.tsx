"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm, UseFormReturn } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Calendar as CalendarIcon, ChevronsUpDown, X, Camera, Plus } from "lucide-react"
import { format } from "date-fns"
import { CustomerFormDialogNew } from "@/components/marketing/customer-form-dialog-new"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

// Define the form schema with validation
const formSchema = z.object({
  asal_bahan: z.string().optional(),
  nama_bahan: z.string().min(1, { message: "Fabric name is required" }),
  lebar_bahan: z.string().optional(),
  berat_bahan: z.string().optional(),
  est_pjg_bahan: z.string().optional(),
  tanggal: z.date().optional(),
  foto: z.string().optional(),
  roll: z.string().optional(),
  keterangan: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

// Customer interface
interface Customer {
  id: string
  nama: string
  telp?: string | null
}

// Image interface
interface ImageFile {
  fileUrl: string
  fileName: string
}

interface InboundFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  customers?: Customer[] // Make customers optional since we'll fetch them directly
  onSubmit: (data: FormValues & { images?: ImageFile[] }) => Promise<void>
  initialData?: any // Add initialData for editing
}

export function InboundForm({ open, onOpenChange, customers: initialCustomers, onSubmit, initialData }: InboundFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [comboboxOpen, setComboboxOpen] = useState(false)
  const [images, setImages] = useState<ImageFile[]>([])
  const [showCamera, setShowCamera] = useState(false)
  const [isAddingCustomer, setIsAddingCustomer] = useState(false)
  const [customerFormOpen, setCustomerFormOpen] = useState(false) 
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers || [])
  const [totalLength, setTotalLength] = useState<string>('')
  const videoRef = useRef<HTMLVideoElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  
  // Initialize form with default values
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      asal_bahan: "",
      nama_bahan: "",
      lebar_bahan: "",
      berat_bahan: "",
      est_pjg_bahan: "",
      tanggal: new Date(),
      foto: "",
      roll: "",
      keterangan: "",
    },
  })

  // Update form values when initialData changes
  useEffect(() => {
    if (initialData) {
      form.reset({
        asal_bahan: initialData.asal_bahan || "",
        nama_bahan: initialData.nama_bahan || "",
        lebar_bahan: initialData.lebar_bahan || "",
        berat_bahan: initialData.berat_bahan || "",
        est_pjg_bahan: initialData.est_pjg_bahan || "",
        tanggal: initialData.tanggal ? new Date(initialData.tanggal) : new Date(),
        foto: initialData.foto || "",
        roll: initialData.roll || "",
        keterangan: initialData.keterangan || "",
      });
      
      // Set initial images if available
      if (initialData.foto) {
        setImages([{ 
          fileUrl: initialData.foto,
          fileName: `${initialData.id}_image.jpg`
        }]);
      } else {
        setImages([]);
      }
    }
  }, [initialData, form]);

  // Change the title and description based on whether we're editing or adding
  const isEditing = !!initialData;
  const formTitle = isEditing ? "Edit Inventory Item" : "Add Inventory Item";
  const formDescription = isEditing
    ? "Update the details of this inventory item"
    : "Fill in the details to add a new inventory item";

  // Define a function to fetch customers
  const fetchCustomers = async () => {
    try {
      const response = await fetch("/api/marketing/customers")
      
      if (!response.ok) {
        throw new Error("Failed to fetch customers")
      }
      
      const data = await response.json()
      setCustomers(data)
    } catch (error) {
      console.error("Error fetching customers:", error)
      toast.error("Failed to load customers")
    }
  }

  // Fetch customers when component mounts or dialog opens
  useEffect(() => {
    if (open && (!initialCustomers || initialCustomers.length === 0)) {
      fetchCustomers()
    } else if (initialCustomers && initialCustomers.length > 0) {
      setCustomers(initialCustomers)
    }
  }, [open, initialCustomers])

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

  // Watch for changes in est_pjg_bahan and roll fields
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === "est_pjg_bahan" || name === "roll") {
        const estLength = form.getValues("est_pjg_bahan");
        const roll = form.getValues("roll");
        
        if (estLength && roll) {
          const estLengthNum = parseFloat(estLength);
          const rollNum = parseFloat(roll);
          
          if (!isNaN(estLengthNum) && !isNaN(rollNum)) {
            const total = estLengthNum * rollNum;
            setTotalLength(total.toString());
          }
        } else {
          setTotalLength('');
        }
      }
    });
    
    return () => subscription.unsubscribe();
  }, [form]);

  // Handle form submission
  const handleSubmit = async (data: FormValues) => {
    try {
      setIsLoading(true);
      
      // Add the images to the data object
      const dataWithImages = {
        ...data,
        images: images
      };
      
      // Call the parent's onSubmit function
      await onSubmit(dataWithImages);
      
      // Don't reset form here since the parent component will close the dialog
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("Failed to save inventory item");
    } finally {
      setIsLoading(false);
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-sm"
        onClick={() => onOpenChange(false)}
      />

      {/* Modal */}
      <div className="bg-background/90 backdrop-blur-xl backdrop-saturate-150 z-50 rounded-lg border border-border/40 shadow-lg shadow-primary/10 w-full max-w-lg mx-4 overflow-auto">
        <div className="flex justify-between items-center p-6 border-b border-border/40">
          <div>
            <h2 className="text-lg font-semibold">{formTitle}</h2>
            <p className="text-sm text-muted-foreground">
              {formDescription}
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
              <FormField
                control={form.control}
                name="nama_bahan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fabric Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter fabric name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="space-y-4">
                <div>
                  <FormLabel>Fabric Capture</FormLabel>
                  <div className="flex gap-2 mt-2">
                    <Button 
                      variant="outline" 
                      type="button" 
                      onClick={() => {
                        setShowCamera(true);
                        // Initialize webcam after a short delay to ensure DOM is ready
                        setTimeout(() => {
                          if (videoRef.current) {
                            navigator.mediaDevices.getUserMedia({ video: true })
                              .then(stream => {
                                if (videoRef.current) {
                                  videoRef.current.srcObject = stream;
                                }
                              })
                              .catch(err => {
                                console.error("Error accessing camera:", err);
                                toast.error("Could not access camera");
                              });
                          }
                        }, 100);
                      }}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Take Photo
                    </Button>
                    <Input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      id="images"
                      onChange={(e) => {
                        if (e.target.files) {
                          const newImages = Array.from(e.target.files).map(file => ({
                            fileUrl: URL.createObjectURL(file),
                            fileName: file.name
                          }))
                          setImages([...images, ...newImages])
                        }
                      }}
                    />
                    <Button 
                      variant="outline" 
                      type="button" 
                      className="cursor-pointer"
                      onClick={() => {
                        document.getElementById('images')?.click();
                      }}
                    >
                      <Camera className="mr-2 h-4 w-4" /> Upload Image
                    </Button>
                  </div>
                  {showCamera && (
                    <div className="mt-4 border rounded-md p-4">
                      <div className="relative">
                        <video 
                          ref={videoRef} 
                          autoPlay 
                          playsInline 
                          className="w-full h-[300px] object-cover rounded-md"
                        />
                        <canvas ref={canvasRef} className="hidden" width="640" height="480" />
                      </div>
                      <div className="flex justify-end gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowCamera(false);
                            // Stop all video streams when closing camera
                            if (videoRef.current && videoRef.current.srcObject) {
                              const stream = videoRef.current.srcObject as MediaStream;
                              stream.getTracks().forEach(track => track.stop());
                            }
                          }}
                        >
                          Cancel
                        </Button>
                        <Button 
                          onClick={() => {
                            try {
                              if (videoRef.current && canvasRef.current) {
                                const video = videoRef.current;
                                const canvas = canvasRef.current;
                                const context = canvas.getContext('2d');
                                
                                if (context) {
                                  // Set canvas dimensions to match video
                                  canvas.width = video.videoWidth;
                                  canvas.height = video.videoHeight;
                                  
                                  // Draw the current video frame to the canvas
                                  context.drawImage(video, 0, 0, canvas.width, canvas.height);
                                  
                                  // Convert canvas to data URL (image)
                                  const imageDataUrl = canvas.toDataURL('image/jpeg');
                                  
                                  // Add to images array
                                  setImages([...images, {
                                    fileUrl: imageDataUrl,
                                    fileName: `capture_${Date.now()}.jpg`
                                  }]);
                                  
                                  // Stop camera stream
                                  const stream = video.srcObject as MediaStream;
                                  stream.getTracks().forEach(track => track.stop());
                                  
                                  // Close camera view
                                  setShowCamera(false);
                                }
                              }
                            } catch (error) {
                              console.error("Error taking photo:", error);
                              toast.error("Failed to capture photo");
                            }
                          }}
                        >
                          Capture
                        </Button>
                      </div>
                    </div>
                  )}
                  {images.length > 0 && (
                    <div className="mt-4 grid grid-cols-3 gap-2">
                      {images.map((image, index) => (
                        <div key={index} className="relative group">
                          <img 
                            src={image.fileUrl} 
                            alt={image.fileName}
                            className="h-24 w-full object-cover rounded-md"
                          />
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => {
                              setImages(images.filter((_, i) => i !== index))
                            }}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              
              <FormField
                control={form.control}
                name="asal_bahan"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fabric Source</FormLabel>
                    <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            role="combobox"
                            className={cn(
                              "w-full justify-between",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value
                              ? customers.find(customer => customer.id === field.value)?.nama
                              : "Select customer"}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-[300px] p-0">
                        <Command
                          filter={(value, search) => {
                            // If the regular filter would match, return true
                            if (value.toLowerCase().includes(search.toLowerCase())) {
                              return 1;
                            }
                            
                            // Normalize the search query for phone numbers
                            const normalizedSearch = search.replace(/^(0|62)/, '');
                            
                            // If the search looks like a phone number (only digits)
                            if (/^\d+$/.test(normalizedSearch) && value.includes(normalizedSearch)) {
                              return 1;
                            }
                            
                            return 0;
                          }}
                        >
                          <CommandInput 
                            placeholder="Search by name or phone..." 
                            onValueChange={(search) => {
                              // Let's keep the original search as is, as the CommandItem values
                              // now include multiple phone formats to match against
                            }}
                          />
                          <CommandEmpty>
                              <Button 
                                variant="ghost" 
                                className="w-full"
                                onClick={() => {
                                  setComboboxOpen(false);
                                  setCustomerFormOpen(true);
                                }}
                              >
                                <Plus className="mr-2 h-4 w-4" /> Add New Customer
                              </Button>
                            </CommandEmpty>
                          <CommandGroup>
                            {customers.map(customer => {
                              const customerPhone = customer.telp || '';
                              
                              // Create different formats of the phone number for search
                              let phoneFormats = '';
                              if (customerPhone) {
                                // Original format (e.g., "812345678")
                                phoneFormats = customerPhone;
                                // With leading 0 (e.g., "0812345678")
                                phoneFormats += ' 0' + customerPhone;
                                // With leading 62 (e.g., "62812345678")
                                phoneFormats += ' 62' + customerPhone;
                              }
                              
                              return (
                                <CommandItem
                                  value={`${customer.nama.toLowerCase()} ${phoneFormats.toLowerCase()}`}
                                  key={customer.id}
                                  onSelect={() => {
                                    form.setValue("asal_bahan", customer.id)
                                    setComboboxOpen(false)
                                  }}
                                  className="flex justify-between"
                                >
                                  <span>{customer.nama}</span>
                                  {customer.telp && (
                                    <span className="text-xs text-muted-foreground">
                                      {customer.telp}
                                    </span>
                                  )}
                                </CommandItem>
                              );
                            })}
                          </CommandGroup>
                        </Command>
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="lebar_bahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Width (cm)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter width" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="berat_bahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Weight (kg)</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter weight" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="est_pjg_bahan"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Estimated Length Per Roll (m)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter est. length" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            const estLength = e.target.value;
                            const roll = form.getValues("roll");
                            
                            if (estLength && roll) {
                              const estLengthNum = parseFloat(estLength);
                              const rollNum = parseFloat(roll);
                              
                              if (!isNaN(estLengthNum) && !isNaN(rollNum)) {
                                const total = estLengthNum * rollNum;
                                setTotalLength(total.toString());
                              }
                            } else {
                              setTotalLength('');
                            }
                          }}
                        />
                      </FormControl>
                      {totalLength && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Total Length: {totalLength} Meter
                        </p>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="roll"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Roll/Bal/Pack (pcs)</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Enter roll" 
                          {...field} 
                          onChange={(e) => {
                            field.onChange(e);
                            const roll = e.target.value;
                            const estLength = form.getValues("est_pjg_bahan");
                            
                            if (estLength && roll) {
                              const estLengthNum = parseFloat(estLength);
                              const rollNum = parseFloat(roll);
                              
                              if (!isNaN(estLengthNum) && !isNaN(rollNum)) {
                                const total = estLengthNum * rollNum;
                                setTotalLength(total.toString());
                              }
                            } else {
                              setTotalLength('');
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="tanggal"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP")
                            ) : (
                              <span>Pick a date</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
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
                name="keterangan"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter notes" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Adding..." : "Add Item"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </div>

      {/* CustomerFormDialog for adding new customer */}
      <CustomerFormDialogNew
        open={customerFormOpen}
        customer={null}
        onClose={(refresh) => {
          setCustomerFormOpen(false);
          if (refresh) {
            // Refresh the customers list
            fetchCustomers();
          }
        }}
      />
    </div>
  )
}