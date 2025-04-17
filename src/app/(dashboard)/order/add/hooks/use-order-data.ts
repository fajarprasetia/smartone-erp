import { useState, useEffect, useCallback } from "react"
import { toast } from "sonner"
import { useForm, Resolver } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"

import { 
  Customer, 
  FabricInfo, 
  RepeatOrder, 
  MarketingUser,
  OrderFormValues,
  orderFormSchema,
  defaultValues
} from "../schemas/order-form-schema"
import { formatProductTypes, yardToMeter, calculateTotalPrice, updateNotesWithProductTypes } from "../utils/order-form-utils"

export function useOrderData() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [, ] = useState(false)
  const [marketingUsers, setMarketingUsers] = useState<MarketingUser[]>([])
  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  const [isMarketingOpen, setIsMarketingOpen] = useState(false)
  const [fabricNames, setFabricNames] = useState<FabricInfo[]>([])
  const [isLoadingFabricNames, setIsLoadingFabricNames] = useState(false)
  const [selectedFabric, setSelectedFabric] = useState<FabricInfo | null>(null)
  const [isFabricNameOpen, setIsFabricNameOpen] = useState(false)
  const [repeatOrders, setRepeatOrders] = useState<RepeatOrder[]>([])
  const [showRepeatOrders, setShowRepeatOrders] = useState(false)
  const [spkNumber, setSpkNumber] = useState<string>("")
  const [spkOptions, setSpkOptions] = useState<string[]>([])
  const [isRepeatOrder, setIsRepeatOrder] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isLoadingMarketingUsers, setIsLoadingMarketingUsers] = useState(false)
  const [paperGsmOptions, setPaperGsmOptions] = useState<{gsm: number, remainingLength: number}[]>([])
  const [paperWidthOptions, setPaperWidthOptions] = useState<string[]>([])
  const [isLoadingPaperGsm, setIsLoadingPaperGsm] = useState(false)
  const [isLoadingPaperWidth, setIsLoadingPaperWidth] = useState(false)
  const [orderId, setOrderId] = useState<string | null>(null)
  
  const session = useSession()
  
  // Use react-hook-form with zod validation
  const resolver: Resolver<OrderFormValues> = async (values, context, options) => {
    // Perform the validation
    const result = await zodResolver(orderFormSchema)(values, context, options);
    
    // If we have validation errors, return them
    if (result.errors) {
      return result;
    }
    
    // Apply any business logic transformations to the values here
    // For example, calculating totals, formatting fields, etc.
    
    // Return the validated values
    return {
      values: result.values,
      errors: result.errors
    };
  };
  
  const form = useForm<OrderFormValues>({
    resolver,
    defaultValues,
  })
  
  // Watch values from the form
  const watchedProductTypes = form.watch("jenisProduk")
  const watchedDtfPass = form.watch("dtfPass")
  const watchedHarga = form.watch("harga")
  const watchedJumlah = form.watch("jumlah")
  const watchedDiscountType = form.watch("discountType")
  const watchedDiscountValue = form.watch("discountValue")
  const watchedTax = form.watch("tax")
  const watchedAdditionalCosts = form.watch("additionalCosts")
  const watchedGsmKertas = form.watch("gsmKertas")
  const watchedMatchingColor = form.watch("matchingColor")
  
  // Fetch customers when component mounts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch('/api/customers')
        if (!response.ok) throw new Error('Failed to fetch customers')
        const data = await response.json()
        setCustomers(data)
      } catch (error) {
        console.error('Error fetching customers:', error)
        toast.error('Failed to load customers')
        // Set empty array to avoid undefined errors
        setCustomers([])
      }
    }
    
    fetchCustomers()
  }, [])
  
  // Fetch marketing users with role "Marketing"
  useEffect(() => {
    const fetchMarketingUsers = async () => {
      setIsLoadingMarketingUsers(true)
      try {
        const response = await fetch(`/api/marketing/users`)
        if (!response.ok) {
          throw new Error('Failed to fetch marketing users')
        }
        const data = await response.json()
        setMarketingUsers(data)
      } catch (error) {
        console.error('Error fetching marketing users:', error)
        toast.error('Failed to fetch marketing users')
        setMarketingUsers([])
      } finally {
        setIsLoadingMarketingUsers(false)
      }
    }
    
    fetchMarketingUsers()
  }, [])
  
  // Fetch SPK number when component mounts
  useEffect(() => {
    const fetchSpkNumbers = async () => {
      try {
        const response = await fetch('/api/orders/spks')
        if (!response.ok) throw new Error('Failed to fetch SPK numbers')
        const data = await response.json()
        setSpkOptions(data)
      } catch (error) {
        console.error('Error fetching SPK numbers:', error)
        toast.error('Failed to fetch SPK numbers')
      }
    }
    
    fetchSpkNumbers()
  }, [])
  
  // Fetch fabric names based on selected fabric origin and customer ID
  useEffect(() => {
    const fetchFabricNames = async () => {
      const asalBahan = form.watch("asalBahan")
      const customerId = form.watch("customerId")
      
      if (!asalBahan) {
        setFabricNames([])
        return
      }
      
      setIsLoadingFabricNames(true)
      
      try {
        let sourceId = null
        
        // If origin is SMARTONE, find its ID from customer table
        if (asalBahan === "SMARTONE") {
          // Find the customer with name "SMARTONE" to get its ID
          const smartoneCustomer = customers.find(c => c.nama.toUpperCase() === "SMARTONE")
          if (smartoneCustomer) {
            sourceId = smartoneCustomer.id
          }
        } 
        // If origin is CUSTOMER, use the selected customer ID
        else if (asalBahan === "CUSTOMER" && customerId) {
          sourceId = customerId
        }
        
        // If we have a valid sourceId, fetch fabric names
        if (sourceId) {
          const response = await fetch(`/api/inventory/fabric-names?asal_bahan=${sourceId}`)
          if (!response.ok) {
            throw new Error('Failed to fetch fabric names')
          }
          
          const data = await response.json()
          setFabricNames(data)
        } else {
          // Clear fabric names if no valid sourceId
          setFabricNames([])
        }
      } catch (error) {
        console.error('Error fetching fabric names:', error)
        toast.error('Failed to fetch fabric names')
        setFabricNames([])
      } finally {
        setIsLoadingFabricNames(false)
      }
    }
    
    fetchFabricNames()
  }, [form.watch("asalBahan"), form.watch("customerId"), customers])
  
  // Fetch paper GSM options
  useEffect(() => {
    const fetchPaperGsm = async () => {
      setIsLoadingPaperGsm(true);
      try {
        const response = await fetch('/api/inventory/paper-stock/gsm');
        if (!response.ok) {
          throw new Error('Failed to fetch paper GSM options');
        }
        
        const data = await response.json();
        console.log('Paper GSM data:', data); // Debug log
        
        // Filter GSM options where remaining length > 10
        if (!Array.isArray(data) || data.length === 0) {
          console.error('Invalid or empty paper GSM data', data);
          setPaperGsmOptions([]);
          setIsLoadingPaperGsm(false);
          return;
        }
        
        // Map data to ensure consistent property names and types
        const normalizedData = data.map(item => ({
          gsm: item.gsm ? parseInt(String(item.gsm), 10) : 0,
          remainingLength: item.remainingLength ? parseFloat(String(item.remainingLength)) : 
                          item.remaining_length ? parseFloat(String(item.remaining_length)) : 0
        }))
        .filter(item => !isNaN(item.gsm) && !isNaN(item.remainingLength) && item.remainingLength > 10);
        
        console.log('Normalized GSM data:', normalizedData);
        
        // Group by GSM and sum remaining lengths
        const gsmMap = new Map();
        
        normalizedData.forEach(item => {
          const gsmKey = String(item.gsm);
          if (!gsmMap.has(gsmKey)) {
            gsmMap.set(gsmKey, { 
              gsm: item.gsm, 
              remainingLength: item.remainingLength 
            });
          } else {
            // Sum the remaining length for the same GSM
            const existingItem = gsmMap.get(gsmKey);
            existingItem.remainingLength += item.remainingLength;
            gsmMap.set(gsmKey, existingItem);
          }
        });
        
        // Convert map to array and sort by GSM
        const uniqueGsmOptions = Array.from(gsmMap.values())
          .sort((a, b) => a.gsm - b.gsm);
        
        console.log('Final GSM options:', uniqueGsmOptions);
        setPaperGsmOptions(uniqueGsmOptions);
      } catch (error) {
        console.error('Error fetching paper GSM options:', error);
        toast.error('Failed to fetch paper GSM options');
        setPaperGsmOptions([]);
      } finally {
        setIsLoadingPaperGsm(false);
      }
    };
    
    fetchPaperGsm();
  }, []);
  
  // Fetch paper width options based on selected GSM
  useEffect(() => {
    const fetchPaperWidth = async () => {
      if (!watchedGsmKertas) {
        setPaperWidthOptions([])
        return
      }
      
      setIsLoadingPaperWidth(true)
      try {
        const response = await fetch(`/api/inventory/paper-stock/width?gsm=${watchedGsmKertas}`)
        if (!response.ok) {
          throw new Error('Failed to fetch paper width options')
        }
        const data = await response.json()
        console.log('Paper width data:', data)
        
        // Check if data is in the expected format (array of objects with width and remainingLength)
        if (!Array.isArray(data)) {
          console.error('Invalid paper width data format:', data)
          setPaperWidthOptions([])
          return
        }
        
        // Extract width values and format them consistently
        const widths = data.map(item => {
          if (typeof item === 'object' && item.width) {
            // New format: { width: string, remainingLength: number }
            return item.width.toString()
          } else if (item) {
            // Old format or primitive value
            return String(item)
          }
          return ''
        }).filter(Boolean)

        // Filter out duplicates and sort
        const uniqueWidths = [...new Set(widths)]
          .sort((a, b) => parseFloat(a) - parseFloat(b))
        
        console.log('Processed width options:', uniqueWidths)
        setPaperWidthOptions(uniqueWidths)
      } catch (error) {
        console.error('Error fetching paper width options:', error)
        toast.error('Failed to fetch paper width options')
        setPaperWidthOptions([])
      } finally {
        setIsLoadingPaperWidth(false)
      }
    }
    
    fetchPaperWidth()
  }, [watchedGsmKertas])
  
  // Fetch repeat orders when status changes to REPEAT
  useEffect(() => {
    const fetchRepeatOrders = async () => {
      const status = form.watch('statusProduksi')
      const customerId = form.watch('customerId')
      
      if (status === 'REPEAT' && customerId) {
        try {
          const response = await fetch(`/api/orders/repeat-orders?customerId=${customerId}`)
          if (!response.ok) throw new Error('Failed to fetch repeat orders')
          const data = await response.json()
          setRepeatOrders(data)
        } catch (error) {
          console.error('Error fetching repeat orders:', error)
          toast.error('Failed to load repeat orders')
          // Set empty array to avoid undefined errors
          setRepeatOrders([])
        }
      }
    }
    
    fetchRepeatOrders()
  }, [form.watch('statusProduksi'), form.watch('customerId'), form])
  
  // Update fabric info when fabric name changes
  useEffect(() => {
    const fabricName = form.watch('namaBahan')
    const selectedFabric = fabricNames.find(f => f.name === fabricName)
    setSelectedFabric(selectedFabric || null)
    
    // If fabric has estimated length, set it as recommended quantity
    if (selectedFabric && selectedFabric.length) {
      form.setValue('jumlah', selectedFabric.length)
    }
  }, [form.watch('namaBahan'), fabricNames, form])
  
  // Initialize marketing field with current user
  useEffect(() => {
    if (session?.data?.user?.id && marketingUsers.length > 0) {
      // Set the logged-in user's ID as marketing by default if they are a marketing user
      const currentUser = marketingUsers.find(user => user.id === session.data.user.id)
      if (currentUser) {
        form.setValue('marketing', currentUser.id)
      }
    }
  }, [session.data?.user?.id, marketingUsers, form])
  
  // Update notes when product types change
  useEffect(() => {
    const currentNotes = form.getValues("notes") || ""
    const updatedNotes = updateNotesWithProductTypes(currentNotes, watchedProductTypes, watchedDtfPass)
    form.setValue("notes", updatedNotes)
  }, [watchedProductTypes, watchedDtfPass, form])
  
  // Update notes when matching color changes
  useEffect(() => {
    if (watchedMatchingColor === "YES") {
      const currentNotes = form.getValues("notes") || ""
      if (!currentNotes.includes("Color Matching")) {
        const updatedNotes = currentNotes ? `${currentNotes}, Color Matching` : "Color Matching"
        form.setValue("notes", updatedNotes)
      }
    }
  }, [watchedMatchingColor, form])
  
  // Calculate total price
  useEffect(() => {
    if (watchedHarga && watchedJumlah) {
      const totalPrice = calculateTotalPrice(
        watchedJumlah,
        watchedHarga,
        watchedAdditionalCosts,
        watchedDiscountType,
        watchedDiscountValue,
        watchedTax,
        form.watch("unit")
      )
      form.setValue("totalPrice", totalPrice.toString())
    }
  }, [
    watchedHarga,
    watchedJumlah,
    watchedDiscountType,
    watchedDiscountValue,
    watchedTax,
    watchedAdditionalCosts,
    form.watch("unit"),
    form,
  ])
  
  // Update target date based on category
  useEffect(() => {
    const category = form.watch("kategori")
    if (!category) return

    const getDateWithoutSunday = (daysToAdd: number): Date => {
      const result = new Date()
      let addedDays = 0
      
      while (addedDays < daysToAdd) {
        result.setDate(result.getDate() + 1)
        // Skip Sundays (getDay() returns 0 for Sunday)
        if (result.getDay() !== 0) {
          addedDays++
        }
      }
      
      return result
    }
    
    let targetDate: Date
    
    switch (category) {
      case "ONE DAY SERVICE":
        targetDate = getDateWithoutSunday(1)
        break
      case "PROJECT":
        targetDate = getDateWithoutSunday(3)
        break
      case "REGULAR ORDER":
      default:
        targetDate = getDateWithoutSunday(4)
        break
    }
    
    form.setValue("targetSelesai", targetDate)
  }, [form.watch("kategori"), form])
  
  // This function handles the product type checkbox changes
  const handleProductTypeChange = useCallback(
    (type: keyof OrderFormValues["jenisProduk"], checked: boolean) => {
      // Update the product type checkbox
      form.setValue(`jenisProduk.${type}`, checked)
      
      // Special handling for DTF
      if (type === "DTF" && checked) {
        // If DTF is being checked, set a default DTF pass if not already set
        if (!form.getValues("dtfPass")) {
          form.setValue("dtfPass", "4 PASS")
        }
        
        // When DTF is selected, uncheck other product types
        form.setValue("jenisProduk.PRINT", false)
        form.setValue("jenisProduk.PRESS", false)
        form.setValue("jenisProduk.CUTTING", false)
        form.setValue("jenisProduk.SEWING", false)
      } else if (checked) {
        // If any other product type is checked, uncheck DTF
        form.setValue("jenisProduk.DTF", false)
        
        // Clear DTF pass if DTF is unchecked
        if (type !== "DTF") {
          form.setValue("dtfPass", undefined)
        }
      }
      
      // Update the notes field with the selected product types
      const updatedNotes = updateNotesWithProductTypes(
        form.getValues("notes") || "",
        form.getValues("jenisProduk"),
        form.getValues("dtfPass")
      )
      form.setValue("notes", updatedNotes)
    },
    [form.setValue, form.getValues, form, updateNotesWithProductTypes]
  )
  
  // Handle DTF pass changes
  const handleDTFPassChange = (pass: "4 PASS" | "6 PASS") => {
    form.setValue("dtfPass", pass)
    
    // Update notes with the new DTF pass
    const updatedNotes = updateNotesWithProductTypes(
      form.getValues("notes") || "",
      form.getValues("jenisProduk"),
      pass
    )
    form.setValue("notes", updatedNotes)
  }
  
  // Utility function to prepare form data for API submission
  const prepareFormDataForSubmission = (formData: OrderFormValues): Record<string, unknown> => {
    // Format additional costs for submission
    const validAdditionalCosts = (formData.additionalCosts || [])
      .filter(cost => Boolean(cost.item) || Boolean(cost.pricePerUnit) || Boolean(cost.unitQuantity) || Boolean(cost.total));
    
    const productTypes = formatProductTypes(formData.jenisProduk, formData.dtfPass);
    
    // Helper function to safely format date fields
    const formatDateField = (value: Date | string | null | undefined): string | null => {
      if (!value) return null;
      
      try {
        // If it's already a Date object, format it
        if (value instanceof Date && !isNaN(value.getTime())) {
          return value.toISOString();
        }
        
        // If it's a string that might represent a date, try to parse and format it
        if (typeof value === 'string') {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            return parsedDate.toISOString();
          }
        }
        
        // If we couldn't format it as a date, return null
        return null;
      } catch (err) {
        console.error("Error formatting date:", err);
        return null;
      }
    };
    
    // Helper function to safely format numeric IDs
    const formatNumericId = (id: string | undefined): string | undefined => {
      if (!id) return undefined;
      
      // Ensure the ID is a properly formatted numeric string
      if (/^\d+$/.test(id)) {
        return id; // It's already a numeric string
      }
      
      try {
        // Try to convert to a valid number
        const numericId = parseInt(id, 10);
        if (!isNaN(numericId)) {
          return String(numericId);
        }
      } catch (err) {
        console.error("Error formatting numeric ID:", err);
      }
      
      return id; // Return original if we can't format
    };
    
    // Format targetSelesai if it exists
    const formattedTargetDate = formData.targetSelesai ? formatDateField(formData.targetSelesai) : undefined;
    console.log("Formatted target date:", formattedTargetDate);
    
    // Handle tax information in the right format
    // Instead of sending tax and taxPercentage as separate fields,
    // we'll handle them in the API by setting tambah_bahan field
    const isTaxEnabled = formData.tax === true;
    const taxPercentage = isTaxEnabled ? (formData.taxPercentage || "11") : null;
    
    // Create a compatible object with both camelCase for TypeScript and snake_case for API
    const formDataForSubmission: Record<string, unknown> = {
      ...formData, // Keep all original fields for type compatibility
      targetSelesai: formattedTargetDate, // Override with formatted date
      
      // Add relations using Prisma's connect syntax
      customer: formData.customerId ? {
        connect: { 
          id: formatNumericId(formData.customerId) 
        }
      } : undefined,
      
      // Handle asal_bahan_rel correctly based on its value
      asal_bahan_rel: formData.asalBahan === "CUSTOMER" ? 
        {
          connect: { 
            id: formatNumericId(formData.customerId) 
          }
        } : 
        (formData.asalBahan === "SMARTONE" ? 
          {
            connect: { 
              id: formatNumericId(customers.find(c => c.nama.toUpperCase() === "SMARTONE")?.id) 
            }
          } : 
          undefined),
      
      // Set tipe_produk string value if neither CUSTOMER nor SMARTONE
      tipe_produk: formData.asalBahan !== "CUSTOMER" && formData.asalBahan !== "SMARTONE" ? 
                  formData.asalBahan : undefined,
      
      // Include other fields needed for API processing
      additionalCosts: validAdditionalCosts,
      productTypes,
      
      // Set tambah_bahan field directly with tax information if tax is enabled
      tambah_bahan: isTaxEnabled ? `Tax: ${taxPercentage}%` : undefined,
    };
    
    // Remove fields that don't exist in the database schema
    delete formDataForSubmission.tax;
    delete formDataForSubmission.taxPercentage;

    console.log("Formatted data for form:", formDataForSubmission);

    return formDataForSubmission;
  };
  
  // Handle form submission
  const onSubmit = async (data: OrderFormValues) => {
    setLoading(true);
    try {
      // Log tax information for debugging
      console.log('Tax information:', { 
        taxEnabled: data.tax, 
        taxPercentage: data.taxPercentage 
      });
      
      // Log priority information for debugging
      console.log('Priority information:', {
        isPriority: data.priority
      });
      
      // Prepare the form data with needed transformations
      const formData = prepareFormDataForSubmission(data);
      
      let requestUrl;
      let requestMethod;
      
      // If we have an orderId, we're in edit mode and should PUT
      if (orderId) {
        requestUrl = `/api/orders/${orderId}`;
        requestMethod = 'PUT';
        console.log(`Updating order ${orderId}`);
      } else {
        // Otherwise, we're in create mode and should POST
        requestUrl = '/api/orders';
        requestMethod = 'POST';
        console.log('Creating new order');
      }
      
      console.log(`API Request: ${requestMethod} ${requestUrl}`);
      console.log('Form data being sent:', JSON.stringify(formData, null, 2));
      
      try {
        const response = await fetch(requestUrl, {
          method: requestMethod,
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        });
        
        // Log the response status
        console.log(`Response status: ${response.status} ${response.statusText}`);
        
        // Try to get the response text first 
        const responseText = await response.text();
        console.log('Raw response text:', responseText);
        
        // Try to parse as JSON if not empty
        let responseData: Record<string, unknown> = {};
        if (responseText) {
          try {
            responseData = JSON.parse(responseText);
            console.log('Response data:', responseData);
          } catch (parseError: unknown) {
            console.error('Failed to parse response as JSON:', parseError);
            console.log('Raw response:', responseText);
          }
        } else {
          console.log('Empty response received');
        }
        
        // Check if the response was successful
        if (!response.ok) {
          // Extract error details for different status codes
          if (response.status === 400) {
            // Validation error - try to extract detailed errors
            const validationErrors = responseData.details || responseData.error || 'Validation failed';
            
            console.error('Validation errors:', validationErrors);
            
            // Format validation errors for display
            let errorMessage: string;
            
            if (typeof validationErrors === 'string') {
              errorMessage = validationErrors;
            } else if (typeof validationErrors === 'object') {
              // Try to format object errors into a readable string
              errorMessage = 'Validation failed:\n' + 
                Object.entries(validationErrors as Record<string, unknown>)
                  .map(([field, error]) => `- ${field}: ${error}`)
                  .join('\n');
            } else {
              errorMessage = 'Invalid request data';
            }
            
            throw new Error(errorMessage);
          } else if (response.status === 401) {
            throw new Error('Unauthorized - Please log in again');
          } else if (response.status === 404) {
            throw new Error('Resource not found');
          } else if (response.status === 500) {
            // For server errors, provide more details from the response if available
            let serverErrorMessage = 'Server error - Please try again later';
            if (responseData.details) {
              serverErrorMessage = `Server error: ${responseData.details}`;
            } else if (responseData.error) {
              serverErrorMessage = `Server error: ${responseData.error}`;
            }
            throw new Error(serverErrorMessage);
          } else {
            throw new Error(`Request failed with status ${response.status} ${response.statusText}`);
          }
        }
        
        // Success!
        const successMessage = orderId 
          ? `✅ Order updated successfully! \nSPK: ${data.spk}`
          : `✅ Order created successfully! \nSPK: ${data.spk}`;
        
        // Show success toast
        toast.success(
          successMessage + (responseData.projectNumber ? `\nProject: ${responseData.projectNumber}` : ''),
          {
            duration: 5000, // Show for 5 seconds
            position: 'top-center',
            style: { fontWeight: 'bold' }
          }
        );
        
        // Reset form for create mode only
        if (!orderId) {
          form.reset(defaultValues);
        }
        
        // Redirect to the order list page after successful submission
        setTimeout(() => {
          router.push('/order');
        }, 1500); // Give time for the toast to be seen
        
        return responseData;
      } catch (apiError: unknown) {
        console.error('API call error:', apiError);
        const errorMessage = apiError instanceof Error 
          ? apiError.message 
          : 'An unexpected error occurred while communicating with the server';
        
        // Show error toast
        const actionWord = orderId ? 'update' : 'create';
        toast.error(
          `Failed to ${actionWord} order\n${errorMessage}`,
          {
            duration: 5000,
            position: 'top-center'
          }
        );
        
        return null;
      }
    } catch (error: unknown) {
      console.error("Form submission error:", error);
      
      // Format error message for display
      let displayErrorMessage: string;
      
      if (error instanceof Error) {
        displayErrorMessage = error.message;
      } else if (typeof error === 'string') {
        displayErrorMessage = error;
      } else {
        displayErrorMessage = "Unknown error occurred";
      }
      
      // Show error toast
      const actionWord = orderId ? 'update' : 'create';
      toast.error(
        `Failed to ${actionWord} order\n${displayErrorMessage}`,
        {
          duration: 5000,
          position: 'top-center'
        }
      );
      
      return null;
    } finally {
      setLoading(false);
    }
  };
  
  // Function to handle fetching repeat order info
  const handleFetchRepeatOrderInfo = async (spkNumber: string) => {
    if (!spkNumber) {
      toast.error("Please enter an SPK number")
      return
    }

    setLoading(true)
    try {
      console.log(`Setting repeat order SPK: ${spkNumber}`)
      
      // Set the SPK number and update notes
      form.setValue("repeatOrderSpk", spkNumber)
      form.setValue("notes", `REPEAT SPK No. ${spkNumber}`)
      
      // Set status to REPEAT
      form.setValue("statusProduksi", "REPEAT")
      
      // Set isRepeatOrder for UI state
      setIsRepeatOrder(true)

      toast.success(`Repeat order SPK ${spkNumber} set successfully`)
    } catch (error) {
      console.error("Error setting repeat order info:", error)
      toast.error("Failed to set repeat order info")
    } finally {
      setLoading(false)
    }
  }
  
  // Function to check if quantity exceeds available fabric length
  const isQuantityExceedingAvailable = (quantity: string, unit: string, availableLength?: string | number): boolean => {
    if (!quantity || !availableLength) return false
    
    const qtyNumber = parseFloat(quantity)
    const availableLengthNumber = typeof availableLength === 'string' ? parseFloat(availableLength) : availableLength
    
    if (isNaN(qtyNumber) || isNaN(availableLengthNumber)) return false
    
    // Convert yards to meters if needed
    const qtyInMeters = unit === 'yard' ? yardToMeter(qtyNumber) : qtyNumber
    
    return qtyInMeters > availableLengthNumber
  }
  
  // Add a function to fetch SPK number and update state
  const fetchSpkNumber = async () => {
    setIsSubmitting(true)
    try {
      const response = await fetch('/api/orders/spk/generate')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SPK: ${response.status}`)
      }
      
      const data = await response.json()
      if (data && data.spk) {
        setSpkNumber(data.spk)
        form.setValue('spk', data.spk)
        console.log('Set SPK:', data.spk)
      } else {
        console.error('Invalid SPK response:', data)
        toast.error('Failed to generate SPK number. Using temporary value.')
        
        // Fallback to date-based SPK if the API fails
        const now = new Date()
        const month = String(now.getMonth() + 1).padStart(2, '0')
        const year = String(now.getFullYear()).slice(-2)
        const fallbackSpk = `${month}${year}0000`
        setSpkNumber(fallbackSpk)
        form.setValue('spk', fallbackSpk)
      }
    } catch (error) {
      console.error('Error fetching SPK:', error)
      toast.error('Failed to generate SPK number')
    } finally {
      setIsSubmitting(false)
    }
  }
  
  // Call the fetchSpkNumber function when the component mounts
  useEffect(() => {
    fetchSpkNumber()
  }, [])
  
  /**
   * Sets initial data for editing an existing order
   */
  const setInitialData = useCallback((data: OrderFormValues & { 
    id?: string | number;
    produk?: string;
    asal_bahan_id?: string;
    asal_bahan?: string;
    warna_acuan?: string;
    tambah_cutting?: string;
    satuan_cutting?: string;
    qty_cutting?: string;
    total_cutting?: string;
    tambah_cutting1?: string;
    satuan_cutting1?: string;
    qty_cutting1?: string;
    total_cutting1?: string;
    tambah_cutting2?: string;
    satuan_cutting2?: string;
    qty_cutting2?: string;
    total_cutting2?: string;
    tambah_cutting3?: string;
    satuan_cutting3?: string;
    qty_cutting3?: string;
    total_cutting3?: string;
    tambah_cutting4?: string;
    satuan_cutting4?: string;
    qty_cutting4?: string;
    total_cutting4?: string;
    tambah_cutting5?: string;
    satuan_cutting5?: string;
    qty_cutting5?: string;
    total_cutting5?: string;
    dtf_pass?: string;
    tipe_produk?: string;
    statusprod?: string;
    diskon?: string | number;
    tax?: string | boolean;
    tax_percentage?: string | number;
    tambah_bahan?: string;
    customer_id?: string | number;
    est_order?: string | Date;
    target_selesai?: string | Date;
    repeat_order_spk?: string;
    repeatOrderSpk?: string;
    nama_kain?: string;
    nama_produk?: string;
    gramasi?: string;
    lebar_kertas?: string;
    lebar_file?: string;
    path?: string;
    qty?: string | number;
    satuan_bahan?: string;
    harga_satuan?: string | number;
    nominal?: string | number;
    total_price?: string | number;
    catatan?: string;
    prioritas?: string;
    priority?: boolean;
    customer?: { id?: string | number };
    marketingInfo?: { name?: string };
  }) => {
    if (!data) return;
    
    console.log("Setting initial data:", data);
    
    // Store the order ID for edit operations
    setOrderId(data.id ? data.id.toString() : null);
    
    // Helper function to determine if a string contains a product type
    const hasProductType = (tipe: string, productTypes?: string) => {
      if (!productTypes) return false;
      return productTypes.toUpperCase().includes(tipe);
    };

    // Process product types (from 'produk' field which is comma-separated)
    const productTypes = {
      PRINT: false,
      PRESS: false,
      CUTTING: false,
      DTF: false,
      SEWING: false
    };
    
    if (data.produk) {
      const produkArray = data.produk.split(',').map((p: string) => p.trim().toUpperCase());
      produkArray.forEach((produk: string) => {
        if (produk === 'PRINT') productTypes.PRINT = true;
        if (produk === 'PRESS') productTypes.PRESS = true;
        if (produk === 'CUTTING') productTypes.CUTTING = true;
        if (produk === 'DTF') productTypes.DTF = true;
        if (produk === 'SEWING') productTypes.SEWING = true;
      });
    }

    // Process fabric origin (asal_bahan) - Simplify logic as requested
    let fabricOrigin = "CUSTOMER"; // Default to CUSTOMER
    
    // If value is "22" then set it to "SMARTONE" else set it to "CUSTOMER"
    if (data.asal_bahan_id === "22" || data.asal_bahan === "22") {
      fabricOrigin = "SMARTONE";
    }
    
    console.log("Processed fabric origin:", fabricOrigin, "from:", data.asal_bahan_id || data.asal_bahan);

    // Process matching color (warna_acuan) - Simplify logic as requested
    const matchingColor = (data.warna_acuan === "ADA") ? "YES" : "NO";
    
    console.log("Processed matching color:", matchingColor, "from:", data.warna_acuan);

    // Process additional costs
    const additionalCosts = [];
    
    // Process primary additional cost
    if (data.tambah_cutting || data.satuan_cutting || data.qty_cutting || data.total_cutting) {
      additionalCosts.push({
        item: data.tambah_cutting || "",
        pricePerUnit: data.satuan_cutting || "",
        unitQuantity: data.qty_cutting || "",
        total: data.total_cutting || ""
      });
    }
    
    // Process additional costs 1-5
    for (let i = 1; i <= 5; i++) {
      const itemField = `tambah_cutting${i}`;
      const priceField = `satuan_cutting${i}`;
      const qtyField = `qty_cutting${i}`;
      const totalField = `total_cutting${i}`;
      
      if (data[itemField] || data[priceField] || data[qtyField] || data[totalField]) {
        additionalCosts.push({
          item: data[itemField] || "",
          pricePerUnit: data[priceField] || "",
          unitQuantity: data[qtyField] || "",
          total: data[totalField] || ""
        });
      }
    }

    // Extract dtf_pass based on the product types
    let dtfPass: "4 PASS" | "6 PASS" | undefined = undefined;
    if (data.dtf_pass) {
      // Ensure that we only assign valid values to dtfPass
      const pass = data.dtf_pass.toString().trim().toUpperCase();
      if (pass === "4 PASS") {
        dtfPass = "4 PASS";
      } else if (pass === "6 PASS") {
        dtfPass = "6 PASS";
      }
    } else if (hasProductType("DTF", data.tipe_produk)) {
      // Default to 4 PASS if DTF is selected but no pass is specified
      dtfPass = "4 PASS";
    }
    
    // Ensure proper status value
    const statusProduksi = data.statusprod === "REPEAT" ? "REPEAT" : "NEW";
    
    // Ensure kategori is valid
    const kategori = data.kategori === "ONE DAY SERVICE" ? "ONE DAY SERVICE" :
                     data.kategori === "PROJECT" ? "PROJECT" : "REGULAR ORDER";

    // Determine discount type and value from the diskon field
    let discountType: "none" | "fixed" | "percentage" = "none";
    let discountValue = "";
    
    if (data.diskon) {
      const diskonStr = data.diskon.toString();
      console.log("Raw discount value:", diskonStr);
      
      if (diskonStr.includes('%')) {
        discountType = "percentage";
        discountValue = diskonStr.replace('%', '');
        console.log("Detected percentage discount:", discountValue, "%");
      } else if (diskonStr !== "0") {
        discountType = "fixed";
        discountValue = diskonStr;
        console.log("Detected fixed discount:", discountValue);
      }
    }
    
    // Extract tax percentage from tambah_bahan field if it exists
    let taxEnabled = false;
    let taxPercentage = "11"; // Default tax percentage
    
    // Check if tax information is stored in tambah_bahan field
    if (data.tambah_bahan && data.tambah_bahan.toString().includes("Tax:")) {
      taxEnabled = true;
      const taxMatch = data.tambah_bahan.toString().match(/Tax:\s*(\d+(?:\.\d+)?)%/);
      if (taxMatch && taxMatch[1]) {
        taxPercentage = taxMatch[1];
        console.log("Extracted tax percentage from tambah_bahan:", taxPercentage);
      }
    }

    // Map the data from API format to form format
    const formattedData: OrderFormValues = {
      // Customer section
      customerId: data.customer_id?.toString() || "",
      spk: data.spk || "",
      marketing: data.marketing || (data.marketingInfo?.name || ""),
      
      // Order detail section
      statusProduksi: statusProduksi,
      kategori: kategori,
      targetSelesai: data.est_order ? new Date(data.est_order) : 
                    (data.target_selesai ? new Date(data.target_selesai) : new Date()),
      repeatOrderSpk: data.repeat_order_spk || data.repeatOrderSpk || "",
      
      // Product type section
      jenisProduk: productTypes,
      dtfPass: dtfPass,
      
      // Fabric info section
      asalBahan: fabricOrigin,
      namaBahan: data.nama_kain || "",
      aplikasiProduk: data.nama_produk || data.produk || "",
      
      // Paper info section
      gsmKertas: data.gramasi || "",
      lebarKertas: data.lebar_kertas || "",
      fileWidth: data.lebar_file || "",
      matchingColor: matchingColor as "YES" | "NO",
      fileDesain: data.path || "",
      jumlah: data.qty?.toString() || "",
      unit: data.satuan_bahan === "yard" ? "yard" : "meter",
      
      // Pricing section
      harga: data.harga_satuan?.toString() || "",
      additionalCosts: additionalCosts,
      // Use the pre-determined discount type and value
      discountType: discountType,
      discountValue: discountValue,
      tax: taxEnabled,
      taxPercentage: taxPercentage,
      totalPrice: data.nominal?.toString() || data.total_price?.toString() || "",
      
      // Notes section
      notes: data.catatan || "",
      priority: data.prioritas === "YES" || data.priority === true
    };

    console.log("Formatted data for form:", formattedData);

    // Reset the form with the formatted data
    form.reset(formattedData);
    
    // Set related data for dropdowns and selects
    if (data.customer) {
      const matchedCustomer = customers.find(c => 
        c.id.toString() === data.customer_id?.toString() || 
        c.id.toString() === data.customer.id?.toString()
      );
      if (matchedCustomer) {
        console.log("Setting customer:", matchedCustomer);
        form.setValue("customerId", matchedCustomer.id.toString());
      }
      setIsCustomerOpen(false);
    }
    
    if (data.marketing || data.marketingInfo) {
      const marketer = data.marketingInfo?.name || data.marketing;
      const matchedMarketing = marketingUsers.find(u => u.name === marketer);
      if (matchedMarketing) {
        console.log("Setting marketing:", matchedMarketing);
        form.setValue("marketing", matchedMarketing.name);
      } else if (marketer) {
        form.setValue("marketing", marketer);
      }
      setIsMarketingOpen(false);
    }
    
    // Set fabric name directly
    if (data.nama_kain) {
      console.log("Setting fabric name:", data.nama_kain);
      
      // Directly set the fabric name field
      form.setValue("namaBahan", data.nama_kain);
      
      // Look for matching fabric in fabricNames
      const matchedFabric = fabricNames.find(f => f.name === data.nama_kain);
      if (matchedFabric) {
        console.log("Found matching fabric in fabricNames:", matchedFabric);
        setSelectedFabric(matchedFabric);
      } else {
        // Create a placeholder fabric object if exact match not found
        const fabricData = {
          id: data.fabric_id || "",
          name: data.nama_kain,
          composition: data.composition || null,
          length: data.length || null,
          width: data.lebar_kain || null,
          remainingLength: data.remaining_length || null
        };
        console.log("Created placeholder fabric data:", fabricData);
        setSelectedFabric(fabricData);
      }
      setIsFabricNameOpen(false);
    }
    
    // Set product application directly
    if (data.nama_produk) {
      console.log("Setting product application:", data.nama_produk);
      form.setValue("aplikasiProduk", data.nama_produk);
    }
    
    // Fetch paper width options if GSM is set
    if (data.gramasi) {
      console.log("Setting GSM and fetching widths:", data.gramasi);
      const gsmValue = data.gramasi.toString();
      form.setValue("gsmKertas", gsmValue);
      // The useEffect will automatically fetch the paper width options
    }
    
    // Set product types and update notes if needed
    if (data.produk) {
      console.log("Setting product types from produk field:", data.produk);
      
      // Make sure DTF pass is set if DTF is selected
      if (productTypes.DTF && !dtfPass) {
        form.setValue("dtfPass", "4 PASS");
      }
      
      // Update notes with product types if needed
      const notes = form.getValues("notes") || "";
      const updatedNotes = updateNotesWithProductTypes(notes, productTypes, dtfPass);
      if (updatedNotes !== notes) {
        form.setValue("notes", updatedNotes);
      }
    }
    
  }, [
    form,
    customers,
    marketingUsers,
    fabricNames,
    setIsCustomerOpen,
    setIsMarketingOpen,
    setIsFabricNameOpen,
    setSelectedFabric,
    updateNotesWithProductTypes,
    form.reset,
    form.setValue,
    form.getValues
  ]);
  
  return {
    form,
    isSubmitting,
    setIsSubmitting,
    customers,
    marketingUsers,
    isCustomerOpen,
    setIsCustomerOpen,
    isMarketingOpen,
    setIsMarketingOpen,
    fabricNames,
    selectedFabric,
    setSelectedFabric,
    isFabricNameOpen,
    setIsFabricNameOpen,
    repeatOrders,
    showRepeatOrders,
    setShowRepeatOrders,
    spkNumber,
    isRepeatOrder,
    setIsRepeatOrder,
    loading,
    handleFetchRepeatOrderInfo,
    isLoadingMarketingUsers,
    isLoadingFabricNames,
    fetchSpkNumber,
    isQuantityExceedingAvailable,
    handleProductTypeChange,
    handleDTFPassChange,
    updateNotesWithProductTypes,
    onSubmit,
    spkOptions,
    paperGsmOptions,
    paperWidthOptions,
    isLoadingPaperGsm,
    isLoadingPaperWidth,
    setInitialData,
    orderId
  }
} 