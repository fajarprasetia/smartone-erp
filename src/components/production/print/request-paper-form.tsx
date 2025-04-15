"use client"

import { useState, useEffect } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { toast } from "sonner"
import { Search } from "lucide-react"

import { Button } from "@/components/ui/button"
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
import { DialogModal } from "@/components/ui/dialog-modal"

// Form schema for paper request
const requestPaperSchema = z.object({
  paper_type: z.string().min(1, { message: "Paper type is required" }),
  gsm: z.string().min(1, { message: "GSM is required" }),
  width: z.string().min(1, { message: "Width is required" }),
  length: z.string().min(1, { message: "Length is required" }),
  user_notes: z.string().optional(),
})

type RequestPaperFormValues = z.infer<typeof requestPaperSchema>

interface RequestPaperFormProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (data: RequestPaperFormValues) => Promise<void>
}

export function RequestPaperForm({ open, onOpenChange, onSubmit }: RequestPaperFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [paperTypes, setPaperTypes] = useState<string[]>(["Sublimation Paper", "DTF Film"])
  const [availableGSMs, setAvailableGSMs] = useState<string[]>([])
  const [availableWidths, setAvailableWidths] = useState<string[]>([])
  const [availableLengths, setAvailableLengths] = useState<string[]>([])
  const [selectedPaperType, setSelectedPaperType] = useState<string>("")
  const [selectedGSM, setSelectedGSM] = useState<string>("")
  const [selectedWidth, setSelectedWidth] = useState<string>("")

  // Initialize form
  const form = useForm<RequestPaperFormValues>({
    resolver: zodResolver(requestPaperSchema),
    defaultValues: {
      paper_type: "",
      gsm: "",
      width: "",
      length: "",
      user_notes: "",
    },
  })

  // Handle paper type selection change
  const handlePaperTypeChange = async (paperType: string) => {
    setSelectedPaperType(paperType)
    form.setValue("paper_type", paperType)
    
    // Reset other selections
    setSelectedGSM("")
    setSelectedWidth("")
    form.setValue("gsm", "")
    form.setValue("width", "")
    form.setValue("length", "")
    
    try {
      // Fetch available GSMs based on paper type
      const response = await fetch(`/api/inventory/paper?availability=YES&type=${encodeURIComponent(paperType)}`)
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || `Error: ${response.status}`);
      }
      
      const gsms = [...new Set(responseData.map((item: any) => String(item.gsm)))] as string[]
      setAvailableGSMs(gsms);
      
      // Clear other fields
      setAvailableWidths([]);
      setAvailableLengths([]);
      
      // Show toast only if GSMs were found
      if (gsms.length > 0) {
        toast.success(`Found ${gsms.length} GSM options for ${paperType}`);
      } else {
        toast.info(`No GSM options found for ${paperType}`);
      }
    } catch (error) {
      console.error("Error fetching available GSMs:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load available GSMs")
      setAvailableGSMs([])
    }
  }

  // Handle GSM selection change
  const handleGSMChange = async (gsm: string) => {
    setSelectedGSM(gsm)
    form.setValue("gsm", gsm)
    
    // Reset width and length
    setSelectedWidth("")
    form.setValue("width", "")
    form.setValue("length", "")
    
    try {
      // Fetch available widths based on paper type and GSM
      const response = await fetch(`/api/inventory/paper?availability=YES&type=${encodeURIComponent(selectedPaperType)}&gsm=${encodeURIComponent(gsm)}`)
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || `Error: ${response.status}`);
      }
      
      const widths = [...new Set(responseData.map((item: any) => String(item.width)))] as string[]
      setAvailableWidths(widths);
      
      // Clear length field
      setAvailableLengths([]);
      
      // Show toast only if widths were found
      if (widths.length > 0) {
        toast.success(`Found ${widths.length} width options for ${gsm} GSM`);
      } else {
        toast.info(`No width options found for ${gsm} GSM`);
      }
    } catch (error) {
      console.error("Error fetching available widths:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load available widths")
      setAvailableWidths([])
    }
  }

  // Handle width selection change
  const handleWidthChange = async (width: string) => {
    setSelectedWidth(width)
    form.setValue("width", width)
    
    // Reset length
    form.setValue("length", "")
    
    try {
      // Fetch available lengths based on paper type, GSM, and width
      const response = await fetch(`/api/inventory/paper?availability=YES&type=${encodeURIComponent(selectedPaperType)}&gsm=${encodeURIComponent(selectedGSM)}&width=${encodeURIComponent(width)}`)
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.details || responseData.error || `Error: ${response.status}`);
      }
      
      const lengths = [...new Set(responseData.map((item: any) => String(item.remaining_length || item.remainingLength)))] as string[]
      setAvailableLengths(lengths);
      
      // Show toast only if lengths were found
      if (lengths.length > 0) {
        toast.success(`Found ${lengths.length} length options for ${width} cm width`);
      } else {
        toast.info(`No length options found for ${width} cm width`);
      }
    } catch (error) {
      console.error("Error fetching available lengths:", error)
      toast.error(error instanceof Error ? error.message : "Failed to load available lengths")
      setAvailableLengths([])
    }
  }

  // Handle form submission
  const handleSubmit = async (data: RequestPaperFormValues) => {
    try {
      setIsLoading(true)
      
      // Make sure we have all required fields
      if (!data.paper_type || !data.gsm || !data.width || !data.length) {
        toast.error("Please fill in all required fields");
        throw new Error("Missing required fields");
      }
      
      await onSubmit(data)
      toast.success("Paper request submitted successfully");
      
      // Reset form
      form.reset()
      setSelectedPaperType("")
      setSelectedGSM("")
      setSelectedWidth("")
      onOpenChange(false)
    } catch (error) {
      console.error("Error submitting paper request:", error)
      toast.error(error instanceof Error ? error.message : "Failed to submit paper request")
    } finally {
      setIsLoading(false)
    }
  }

  // Update available GSMs when paper type changes
  useEffect(() => {
    if (selectedPaperType) {
      setIsLoading(true)
      fetch(`/api/inventory/paper-stock/options?paper_type=${encodeURIComponent(selectedPaperType)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch GSM options")
          }
          return response.json()
        })
        .then(data => {
          // Use a Set to ensure uniqueness
          const uniqueGSMs = [...new Set(data.gsm as string[])]
          setAvailableGSMs(uniqueGSMs)
        })
        .catch(error => {
          console.error("Error fetching GSM options:", error)
          toast.error("Failed to load GSM options")
        })
        .finally(() => setIsLoading(false))
    } else {
      setAvailableGSMs([])
    }
  }, [selectedPaperType])

  // Update available widths when GSM changes
  useEffect(() => {
    if (selectedPaperType && selectedGSM) {
      setIsLoading(true)
      fetch(`/api/inventory/paper-stock/options?paper_type=${encodeURIComponent(selectedPaperType)}&gsm=${encodeURIComponent(selectedGSM)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch width options")
          }
          return response.json()
        })
        .then(data => {
          // Use a Set to ensure uniqueness
          const uniqueWidths = [...new Set(data.width as string[])]
          setAvailableWidths(uniqueWidths)
        })
        .catch(error => {
          console.error("Error fetching width options:", error)
          toast.error("Failed to load width options")
        })
        .finally(() => setIsLoading(false))
    } else {
      setAvailableWidths([])
    }
  }, [selectedPaperType, selectedGSM])

  // Update available lengths when width changes
  useEffect(() => {
    if (selectedPaperType && selectedGSM && selectedWidth) {
      setIsLoading(true)
      fetch(`/api/inventory/paper-stock/options?paper_type=${encodeURIComponent(selectedPaperType)}&gsm=${encodeURIComponent(selectedGSM)}&width=${encodeURIComponent(selectedWidth)}`)
        .then(response => {
          if (!response.ok) {
            throw new Error("Failed to fetch length options")
          }
          return response.json()
        })
        .then(data => {
          // Use a Set to ensure uniqueness
          const uniqueLengths = [...new Set(data.length as string[])]
          setAvailableLengths(uniqueLengths)
        })
        .catch(error => {
          console.error("Error fetching length options:", error)
          toast.error("Failed to load length options")
        })
        .finally(() => setIsLoading(false))
    } else {
      setAvailableLengths([])
    }
  }, [selectedPaperType, selectedGSM, selectedWidth])

  return (
    <DialogModal 
      open={open} 
      onOpenChange={onOpenChange}
      title="Request Paper"
      description="Submit a request for paper from inventory"
      maxWidth="lg"
    >
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="paper_type"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Paper Type</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      handlePaperTypeChange(value)
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select paper type" />
                    </SelectTrigger>
                    <SelectContent>
                      {paperTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="gsm"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>GSM</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleGSMChange(value)
                    }}
                    disabled={!selectedPaperType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select GSM" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGSMs.map((gsm) => (
                        <SelectItem key={gsm} value={gsm}>
                          {gsm}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="width"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Width (cm)</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value)
                      handleWidthChange(value)
                    }}
                    disabled={!selectedGSM}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select width" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableWidths.map((width) => (
                        <SelectItem key={width} value={width}>
                          {width}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="length"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Length (cm)</FormLabel>
                <FormControl>
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={!selectedWidth}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select length" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableLengths.map((length) => (
                        <SelectItem key={length} value={length}>
                          {length}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="user_notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Why do you need this paper?" 
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
              {isLoading ? "Submitting..." : "Submit Request"}
            </Button>
          </div>
        </form>
      </Form>
    </DialogModal>
  )
} 