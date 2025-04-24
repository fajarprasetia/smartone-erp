import { useState, useEffect, useCallback, useRef } from "react"
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

export function useOrderData(mode: 'create' | 'edit' = 'create', initialOrderData?: any) {
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
  const resolver: Resolver<OrderFormValues> = (async (
    values: OrderFormValues,
    context: any,
    options: any
  ) => {
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
  }) as any;
  
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
  
  // Function to refresh the customers list
  const refreshCustomers = async (): Promise<Customer[]> => {
    try {
      const response = await fetch('/api/customers')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch customers')
      }
      const data = await response.json()
      setCustomers(data)
      return data
    } catch (error) {
      console.error('Error refreshing customers:', error)
      toast.error('Failed to refresh customers')
      return []
    }
  }
  
  // Fetch customers when component mounts
  useEffect(() => {
    refreshCustomers()
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
      
      // Check if DTF is selected to filter paper type
      const isDtfSelected = form.watch("jenisProduk")?.DTF === true;
      const paperType = isDtfSelected ? "DTF Film" : "regular";
      
      try {
        // Add paperType as query parameter
        const response = await fetch(`/api/inventory/paper-stock/gsm?type=${paperType}`);
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
  }, [form.watch("jenisProduk")?.DTF]); // Add explicit dependency on DTF selection
  
  // Fetch paper width options based on selected GSM
  useEffect(() => {
    const fetchPaperWidth = async () => {
      if (!watchedGsmKertas) {
        setPaperWidthOptions([])
        return
      }
      
      // Check if DTF is selected to filter paper type
      const isDtfSelected = form.watch("jenisProduk")?.DTF === true;
      const paperType = isDtfSelected ? "DTF Film" : "regular";
      
      setIsLoadingPaperWidth(true)
      try {
        const response = await fetch(`/api/inventory/paper-stock/width?gsm=${watchedGsmKertas}&type=${paperType}`)
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
  }, [watchedGsmKertas, form.watch("jenisProduk")?.DTF]) // Add dependency on DTF selection
  
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
        
        // Clear fabric-related fields when DTF is selected
        form.setValue("asalBahan", "")
        form.setValue("asalBahanId", "")
        form.setValue("namaBahan", "")
        form.setValue("fabricLength", "")
        form.setValue("lebarKain", "")
        setSelectedFabric(null)
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
    [form.setValue, form.getValues, form, updateNotesWithProductTypes, setSelectedFabric]
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

  // Process additional costs for API submission
  const processAdditionalCosts = (data: OrderFormValues): any[] => {
    const additionalCosts: any[] = [];
    
    // Process additional costs if they exist
    if (data.additionalCosts && data.additionalCosts.length > 0) {
      data.additionalCosts.forEach(cost => {
        if (cost.item || cost.pricePerUnit || cost.unitQuantity || cost.total) {
          additionalCosts.push({
            item: cost.item || "",
            pricePerUnit: cost.pricePerUnit || "",
            unitQuantity: cost.unitQuantity || "",
            total: cost.total || ""
          });
        }
      });
    }
    
    // Also check for legacy additional costs structure (cutting1, cutting2, etc.)
    for (let i = 0; i < 6; i++) {
      const suffix = i === 0 ? '' : i.toString();
      const itemField = `tambah_cutting${suffix}`;
      const priceField = `satuan_cutting${suffix}`;
      const qtyField = `qty_cutting${suffix}`;
      const totalField = `total_cutting${suffix}`;
      
      // Type assertion to allow string indexing
      const formData = data as any;
      
      if (formData[itemField] || formData[priceField] || formData[qtyField] || formData[totalField]) {
        additionalCosts.push({
          item: formData[itemField] || "",
          pricePerUnit: formData[priceField] || "",
          unitQuantity: formData[qtyField] || "",
          total: formData[totalField] || ""
        });
      }
    }
    
    return additionalCosts;
  };

  const prepareFormDataForSubmission = (data: OrderFormValues): Record<string, unknown> => {
    console.log("Preparing form data for submission:", data);

    // Process dates properly
    const formattedTargetSelesai = formatDateField(data.targetSelesai);
    
    // Format numeric IDs correctly
    const formattedCustomerId = formatNumericId(data.customerId);
    
    // Process the discount value
    let discountValue: string | number | undefined = undefined;
    if (data.discountType === "percentage" || data.discountType === "fixed") {
      discountValue = data.discountValue ? parseFloat(data.discountValue) : 0;
    }
    
    // Determine asalBahanId based on asalBahan value
    let asalBahanId: string | undefined = undefined;
    if (data.asalBahan === "SMARTONE") {
      asalBahanId = "22"; // Fixed ID for SMARTONE
      console.log("Setting asalBahanId to 22 for SMARTONE");
    } else if (data.asalBahan === "CUSTOMER" && data.customerId) {
      asalBahanId = data.customerId; // Use customer's ID
      console.log(`Setting asalBahanId to customer ID: ${data.customerId}`);
    }
    
    // Process tax data
    const isTaxEnabled = data.tax === true;
    const taxPercentage = isTaxEnabled && data.taxPercentage ? data.taxPercentage : '0';
    
    // Process additional costs for the expected API format (individual fields)
    const additionalCostsArray = processAdditionalCosts(data);
    
    // Create an object to store additional costs in the proper field format
    const additionalCostFields: Record<string, string> = {};
    
    // Map additional costs to the specific field names expected by the API
    additionalCostsArray.forEach((cost, index) => {
      if (index === 0) {
        additionalCostFields.tambah_cutting = cost.item || "";
        additionalCostFields.satuan_cutting = cost.pricePerUnit || "";
        additionalCostFields.qty_cutting = cost.unitQuantity || "";
        additionalCostFields.total_cutting = cost.total || "";
      } else if (index < 6) { // Up to 5 additional costs (1-5)
        additionalCostFields[`tambah_cutting${index}`] = cost.item || "";
        additionalCostFields[`satuan_cutting${index}`] = cost.pricePerUnit || "";
        additionalCostFields[`qty_cutting${index}`] = cost.unitQuantity || "";
        additionalCostFields[`total_cutting${index}`] = cost.total || "";
      }
    });
    
    console.log("Formatted additional costs:", additionalCostFields);
    
    // Construct the final form data
    const formDataForSubmission: Record<string, unknown> = {
      ...data,
      // Basic info
      spk: data.spk,
      customerId: formattedCustomerId,
      // Use marketing ID directly (previously stored user name)
      marketing: data.marketing, // This is now the user ID, not the name
      // Process asalBahan
      asalBahan: data.asalBahan,
      asalBahanId: asalBahanId, // Set asalBahanId based on asalBahan
      // Dates - Target Completion Date maps to est_order in DB
      targetSelesai: formattedTargetSelesai,
      est_order: formattedTargetSelesai, // Ensure target date goes to est_order field
      // Numeric fields need conversion
      jumlah: data.jumlah,
      // Always send harga as string for database compatibility
      harga: data.harga ? String(data.harga) : "",
      harga_satuan: data.harga ? String(data.harga) : "", // Ensure harga_satuan is sent as string
      // Process discount
      discountType: data.discountType,
      discountValue: discountValue,
      // Process tax
      tax: data.tax,
      taxPercentage: taxPercentage,
      // Process total price - convert to string to ensure database compatibility
      totalPrice: data.totalPrice ? String(data.totalPrice) : "",
      nominal: data.totalPrice ? String(data.totalPrice) : "", // Ensure nominal is sent as string
      sisa: data.totalPrice ? String(data.totalPrice) : "", // Also set sisa equal to totalPrice
      // Include additional costs as individual fields rather than a JSON string
      ...additionalCostFields,
      // Process status fields - but only include if they have values
      statusProduksi: data.statusProduksi,
      status: "PENDING", // Default status for new/edited orders
      
      // For backend compatibility, convert matchingColor to warna_acuan
      matchingColor: data.matchingColor,
      
      // Store tax percentage in tambah_bahan field if tax is applied
      tambah_bahan: isTaxEnabled ? `Tax: ${taxPercentage}%` : undefined,
    };
    
    // Remove fields that don't exist in the database schema
    delete formDataForSubmission.tax;
    delete formDataForSubmission.taxPercentage;
    delete formDataForSubmission.additionalCosts; // Remove the array, since we've already processed it

    console.log("Formatted data for form:", formDataForSubmission);

    return formDataForSubmission;
  };
  
  // Update the onSubmit function to handle both create and edit modes
  const onSubmit = useCallback(async (values: OrderFormValues) => {
    setIsSubmitting(true);
    try {
      console.log(`${mode === 'create' ? 'Creating' : 'Updating'} order with values:`, values);
      
      // Create a copy of values to manipulate
      const valuesToSubmit = { ...values };
      
      // Handle repeat order SPK - add to notes rather than as a separate field
      if (valuesToSubmit.repeatOrderSpk) {
        const repeatText = `REPEAT SPK No. ${valuesToSubmit.repeatOrderSpk}`;
        if (!valuesToSubmit.notes || !valuesToSubmit.notes.includes(repeatText)) {
          valuesToSubmit.notes = valuesToSubmit.notes 
            ? `${valuesToSubmit.notes}, ${repeatText}`
            : repeatText;
        }
        // Remove repeatOrderSpk as a separate field
        delete valuesToSubmit.repeatOrderSpk;
      }
      
      // Format the form data for submission
      const formData = {
        ...valuesToSubmit,
        // IMPORTANT: When sending to the API, do NOT convert jenisProduk to string for PUT requests
        // Only convert to string for POST requests (create mode)
        jenisProduk: mode === 'create' 
          ? formatProductTypes(values.jenisProduk) 
          : values.jenisProduk, // Keep as object for PUT requests
        
        // Ensure asalBahan is explicitly included
        asalBahan: values.asalBahan,
        
        // Add customerId for reference with fabric origin
        customerId: values.customerId,
      };
      
      console.log("Formatted form data:", formData);
      
      // Use POST for create, PUT for edit
      const url = mode === 'create' ? '/api/orders' : `/api/orders/${orderId}`;
      const method = mode === 'create' ? 'POST' : 'PUT';
      
      const response = await fetch(url, {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("API error response:", errorData);
        throw new Error(errorData.error || errorData.details || `Failed to ${mode === 'create' ? 'create' : 'update'} order`);
      }

      const data = await response.json();
      // Check both possible response formats for order ID
      const responseOrderId = data.order?.id || data.orderId || data.id || orderId;
      setOrderId(responseOrderId);
      toast.success(`Order ${mode === 'create' ? 'created' : 'updated'} successfully`);
      
      // Redirect to the main order list page
      router.push("/order");
    } catch (error) {
      console.error(`Error ${mode === 'create' ? 'submitting' : 'updating'} order:`, error);
      toast.error(error instanceof Error ? error.message : `Failed to ${mode === 'create' ? 'create' : 'update'} order`);
    } finally {
      setIsSubmitting(false);
    }
  }, [router, mode, orderId, formatProductTypes]);
  
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
  const fetchSpkNumber = async (retryCount = 0) => {
    // First check if we already have an SPK to avoid unnecessary fetches
    if (spkNumber) {
      console.log('SPK already exists, skipping fetch:', spkNumber);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Add signal to allow aborting the fetch after a timeout
      const controller = new AbortController();
      const signal = controller.signal;
      
      console.log('Fetching SPK number...');
      
      // Add a unique timestamp to prevent cache issues
      const timestamp = Date.now();
      
      // Use a longer timeout (30 seconds) to avoid AbortErrors
      let timeoutId = setTimeout(() => {
        console.log('SPK fetch timeout, aborting');
        controller.abort();
      }, 30000);
      
      const response = await fetch(`/api/orders/spk/generate?t=${timestamp}`, {
        signal,
        method: 'GET',
        headers: {
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SPK: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.spk) {
        // Handle both regular and fallback SPKs from the API
        setSpkNumber(data.spk);
        form.setValue('spk', data.spk);
        
        if (data.fallback) {
          console.log('Using API-provided fallback SPK:', data.spk);
          toast.warning('Using a fallback SPK number due to server issues.');
        } else if (data.recovered) {
          console.log('Using API-provided recovery SPK:', data.spk);
          toast.info('Using recovery SPK due to sequence conflicts.');
        } else {
          console.log('Set SPK:', data.spk);
        }
      } else {
        console.error('Invalid SPK response:', data);
        toast.error('Failed to generate SPK number. Using temporary value.');
        
        // Fallback to date-based SPK if the API fails
        generateFallbackSpk();
      }
    } catch (error) {
      console.error('Error fetching SPK:', error);
      
      // Skip retry if we already have a valid SPK
      if (spkNumber) {
        console.log('Already have SPK, skipping retry:', spkNumber);
        return;
      }
      
      // Implement retry logic for network issues
      if (retryCount < 2) {
        console.log(`Retrying SPK fetch (attempt ${retryCount + 1})...`);
        setTimeout(() => fetchSpkNumber(retryCount + 1), 2000); // Longer delay (2 seconds)
        return;
      }
      
      toast.error('Failed to generate SPK number');
      
      // If retries are exhausted, use a fallback
      generateFallbackSpk();
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper to format SPK number - if above 999, don't pad with zeros
  const formatSPKNumber = (datePrefix: string, number: number): string => {
    if (number <= 999) {
      return `${datePrefix}${String(number).padStart(3, '0')}`
    } else {
      return `${datePrefix}${number}`
    }
  }
  
  // Helper to generate a fallback SPK
  const generateFallbackSpk = () => {
    const now = new Date()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const year = String(now.getFullYear()).slice(-2)
    const datePrefix = `${month}${year}`
    
    // Try to find the highest SPK in the spkOptions array
    let highestNumber = 0
    const prefixRegex = new RegExp(`^${datePrefix}(\\d+)$`)
    
    spkOptions.forEach(spk => {
      const match = spk.match(prefixRegex)
      if (match && match[1]) {
        const num = parseInt(match[1], 10)
        if (!isNaN(num) && num > highestNumber) {
          highestNumber = num
        }
      }
    })
    
    // If we found a valid highest number, use that + 1
    // Otherwise use a random number
    let nextNumber
    if (highestNumber > 0) {
      nextNumber = highestNumber + 1
    } else {
      nextNumber = Math.floor(100 + Math.random() * 900)
    }
    
    // Format the SPK with the next number
    const fallbackSpk = formatSPKNumber(datePrefix, nextNumber)
    
    console.log('Using client-generated fallback SPK:', fallbackSpk)
    setSpkNumber(fallbackSpk)
    form.setValue('spk', fallbackSpk)
    
    // Also indicate to the user that this is a temporary SPK
    toast.warning('Using a temporary SPK number. Please verify it before submitting the order.')
  }
  
  // Call the fetchSpkNumber function when the component mounts
  useEffect(() => {
    // Only fetch new SPK number when creating a new order, not when editing
    if (mode === 'create' && !spkNumber) {
      // Create a single instance flag to prevent multiple fetch calls
      const fetchSingleInstance = () => {
        // Use a static variable to track if this has been called
        if (!(fetchSingleInstance as any).hasRun) {
          (fetchSingleInstance as any).hasRun = true;
          fetchSpkNumber();
        }
      };
      
      fetchSingleInstance();
    }
    // For edit mode, the SPK is set in setInitialData
  }, [mode, spkNumber]);
  
  // Set initial data for edit mode
  const setInitialData = useCallback((data: any) => {
    if (!data) return;
    
    console.log("Setting initial data:", data);
    
    try {
      // Reset form with defaults first to clear any previous values
      form.reset(defaultValues);
      
      // Store the data as initialOrderData for later use
      // We can't update the parameter directly since it's read-only
      // But we can store the ID for later use
      setOrderId(data.id);
      
      // Extract and format product types
      const productTypes = {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: false,
        SEWING: false
      };
      
      if (data.produk) {
        const productArr = data.produk.split(",");
        productArr.forEach((type: string) => {
          const trimmedType = type.trim().toUpperCase();
          if (Object.keys(productTypes).includes(trimmedType)) {
            productTypes[trimmedType as keyof typeof productTypes] = true;
          }
        });
      }
      
      // Format dates properly
      const targetSelesai = data.est_order ? new Date(data.est_order) : new Date();
      
      // Set the order ID
      setOrderId(data.id);
      
      // Set SPK number - IMPORTANT: Preserve the existing SPK number when editing
      setSpkNumber(data.spk || "");
      
      // Set form values
      form.setValue("customerId", data.customerId || data.customer_id || "");
      form.setValue("spk", data.spk || "");
      form.setValue("marketing", data.marketing || ""); // This is now the user ID
      form.setValue("jenisProduk", productTypes);
      form.setValue("tipe_produk", data.tipe_produk || "SUBLIM");
      
      // Handle DTF pass if available
      if (data.catatan && data.catatan.includes("PASS")) {
        if (data.catatan.includes("4 PASS")) {
          form.setValue("dtfPass", "4 PASS");
        } else if (data.catatan.includes("6 PASS")) {
          form.setValue("dtfPass", "6 PASS");
        }
      }
      
      // Handle status fields - only set fields that exist in the form schema
      if (data.statusprod || data.statusProduksi) {
        form.setValue("statusProduksi", data.statusprod || data.statusProduksi || "NEW");
      }
      
      // Handle quantity, pricing, and unit fields
      form.setValue("jumlah", data.jumlah || data.qty || data.panjang_order || "");
      form.setValue("unit", data.satuan_bahan || "meter");
      form.setValue("harga", data.harga || data.harga_satuan || "");
      
      // Handle fabric information
      form.setValue("asalBahan", data.asalBahan || ""); // Will be handled in UI separately
      form.setValue("asalBahanId", data.asalBahanId || data.asal_bahan || "");
      form.setValue("namaBahan", data.namaBahan || data.nama_kain || "");
      form.setValue("lebarKain", data.lebarKain || data.lebar_kain || "");
      form.setValue("fabricLength", data.fabricLength || data.jumlah_kain || "");
      
      // Handle product application
      form.setValue("aplikasiProduk", data.aplikasiProduk || data.nama_produk || "");
      
      // Handle paper information
      form.setValue("gsmKertas", data.gsmKertas || data.gramasi || "");
      form.setValue("lebarKertas", data.lebarKertas || data.lebar_kertas || "");
      form.setValue("fileWidth", data.fileWidth || data.lebar_file || "");
      
      // Handle color matching
      let matchingColor: "YES" | "NO" = "NO";
      if (data.matchingColor === "YES" || data.warna_acuan === "ADA") {
        matchingColor = "YES";
      }
      form.setValue("matchingColor", matchingColor);
      
      // Handle design file
      form.setValue("fileDesain", data.fileDesain || data.path || "");
      
      // Handle notes
      form.setValue("notes", data.notes || data.catatan || "");
      
      // Handle category
      form.setValue("kategori", data.kategori || "REGULAR ORDER");
      form.setValue("targetSelesai", targetSelesai);
      
      // Handle priority
      form.setValue("priority", data.priority || data.prioritas === "YES" || false);
      
      // Handle discount
      if (data.diskon) {
        if (data.diskon.includes("%")) {
          form.setValue("discountType", "percentage");
          form.setValue("discountValue", data.diskon.replace("%", ""));
        } else {
          form.setValue("discountType", "fixed");
          form.setValue("discountValue", data.diskon);
        }
      } else {
        form.setValue("discountType", "none");
      }
      
      // Handle tax
      const hasTax = data.tambah_bahan && data.tambah_bahan.includes("Tax:");
      form.setValue("tax", hasTax);
      if (hasTax) {
        const taxMatch = data.tambah_bahan.match(/Tax:\s*(\d+(?:\.\d+)?)%/);
        if (taxMatch && taxMatch[1]) {
          form.setValue("taxPercentage", taxMatch[1]);
        } else {
          form.setValue("taxPercentage", "10"); // Default tax percentage
        }
      }
      
      // Handle additional costs
      const additionalCosts = [];
      
      // First set
      if (data.tambah_cutting && data.satuan_cutting) {
        additionalCosts.push({
          item: data.tambah_cutting || "",
          pricePerUnit: data.satuan_cutting || "",
          unitQuantity: data.qty_cutting || "",
          total: data.total_cutting || ""
        });
      }
      
      // Additional sets 1-5
      for (let i = 1; i <= 5; i++) {
        const itemField = `tambah_cutting${i}`;
        const priceField = `satuan_cutting${i}`;
        const qtyField = `qty_cutting${i}`;
        const totalField = `total_cutting${i}`;
        
        if (data[itemField] && data[priceField]) {
          additionalCosts.push({
            item: data[itemField] || "",
            pricePerUnit: data[priceField] || "",
            unitQuantity: data[qtyField] || "",
            total: data[totalField] || ""
          });
        }
      }
      
      if (additionalCosts.length > 0) {
        form.setValue("additionalCosts", additionalCosts);
      }
      
      // Handle price calculation
      if (data.nominal || data.total_price) {
        form.setValue("totalPrice", data.nominal || data.total_price || "");
      } else {
        // Calculate total price if not explicitly provided
        const totalPrice = calculateTotalPrice(
          form.getValues("jumlah"),
          form.getValues("harga"),
          form.getValues("additionalCosts"),
          form.getValues("discountType"),
          form.getValues("discountValue"),
          form.getValues("tax"),
          form.getValues("unit")
        );
        form.setValue("totalPrice", totalPrice.toString());
      }
      
      console.log("Form initialized with data successfully");
    } catch (error) {
      console.error("Error setting initial form data:", error);
      toast.error("Failed to load order data");
    }
  }, [form, setOrderId, calculateTotalPrice]);
  
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
    orderId,
    refreshCustomers
  }
}