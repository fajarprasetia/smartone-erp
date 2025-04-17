"use client"

import { MainOrderPage } from "../../src/app/(dashboard)/order/add/components/main-order-page"

export default function AddOrderPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [marketingUsers, setMarketingUsers] = useState<Array<{ id: string; name: string; email: string }>>([])  
  const [isCustomerOpen, setIsCustomerOpen] = useState(false)
  const [isMarketingOpen, setIsMarketingOpen] = useState(false)
  const [fabricNames, setFabricNames] = useState<FabricInfo[]>([])
  const [selectedFabric, setSelectedFabric] = useState<FabricInfo | null>(null)
  const [isFabricNameOpen, setIsFabricNameOpen] = useState(false)
  const [paperGSMs, setPaperGSMs] = useState<PaperGSM[]>([])
  const [paperWidths, setPaperWidths] = useState<string[]>([])
  const [repeatOrders, setRepeatOrders] = useState<RepeatOrder[]>([])
  const [showRepeatOrders, setShowRepeatOrders] = useState(false)
  const [paperStockDetails, setPaperStockDetails] = useState<PaperStock[]>([])
  const [isLoadingStocks, setIsLoadingStocks] = useState(false)
  const [isLoadingGSMs, setIsLoadingGSMs] = useState(false)
  
  // Initialize form with default values
  const [spkNumber, setSpkNumber] = useState<string>("");
  const [paperGSM, setPaperGSM] = useState<number | "">("");
  const [paperWidth, setPaperWidth] = useState<string>("");
  const [isLoadingPaperWidths, setIsLoadingPaperWidths] = useState(false);
  
  const session = useSession()
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      customerId: "",
      marketing: "",
      spk: "",
      jenisProduk: {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: false,
        SEWING: false,
      },
      jumlah: "",
      unit: "meter",
      asalBahan: "",
      namaBahan: "",
      aplikasiProduk: "",
      gsmKertas: "",
      lebarKertas: "",
      fileWidth: "",
      matchingColor: "NO",
      notes: "",
      statusProduksi: "NEW",
      kategori: "REGULAR ORDER",
      targetSelesai: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      harga: "",
      discountType: "none",
      discountValue: "",
      tax: false,
      taxPercentage: "11", // Default tax percentage
      totalPrice: "",
      fileDesain: "",
      priority: false,
      additionalCosts: []
    } as FormValues,
  })
  
  // Add calculateTotalPrice function
  const calculateTotalPrice = () => {
    const quantity = parseFloat(form.getValues("jumlah") || "0");
    const price = parseFloat(form.getValues("harga") || "0");
    const taxChecked = form.getValues("tax") || false;
    const taxPercentage = parseFloat(form.getValues("taxPercentage") || "0");
    const discountType = form.getValues("discountType");
    const discountValue = parseFloat(form.getValues("discountValue") || "0");
    
    let subtotal = quantity * price;
    
    // Calculate additional costs
    const additionalCosts = form.getValues("additionalCosts") || [];
    let additionalCostsTotal = 0;
    additionalCosts.forEach(cost => {
      if (cost.pricePerUnit && cost.unitQuantity) {
        const costPrice = parseFloat(cost.pricePerUnit) || 0;
        const costQty = parseFloat(cost.unitQuantity) || 0;
        additionalCostsTotal += Math.round(costPrice * costQty); // Round each cost item
      }
    });
    
    // Apply discount
    let discountAmount = 0;
    if (discountType === "fixed" && !isNaN(discountValue)) {
      discountAmount = discountValue;
    } else if (discountType === "percentage" && !isNaN(discountValue)) {
      discountAmount = (subtotal * discountValue) / 100;
    }
    
    // Calculate final subtotal after discount
    subtotal = subtotal - discountAmount;
    
    // Add additional costs to subtotal
    subtotal += additionalCostsTotal;
    
    // Apply tax if checked
    if (taxChecked && !isNaN(taxPercentage)) {
      subtotal += (subtotal * taxPercentage) / 100;
    }
    
    // Round the final total and update the form
    const totalPrice = Math.round(subtotal);
    form.setValue("totalPrice", totalPrice.toString());
  };

  // Add function to calculate individual item total
  const calculateItemTotal = (price: number, quantity: number): string => {
    const total = price * quantity;
    return Math.round(total).toString(); // Rounded to remove decimals
  }
  
  // Fetch SPK number when component mounts
  const fetchSpkNumber = async () => {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/orders/spk');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch SPK: ${response.status}`);
      }
      
      const data = await response.json();
      if (data && data.spk) {
        form.setValue('spk', data.spk);
        console.log('Set SPK:', data.spk);
      } else {
        console.error('Invalid SPK response:', data);
        toast.error('Failed to generate SPK number. Using temporary value.');
        
        // Fallback to date-based SPK if the API fails
        const now = new Date();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const year = String(now.getFullYear()).slice(-2);
        const fallbackSpk = `${month}${year}0000`;
        form.setValue('spk', fallbackSpk);
      }
    } catch (error) {
      console.error('Error fetching SPK:', error);
      toast.error('Failed to generate SPK number');
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Fetch customers and marketing users for dropdowns
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [customersResponse, marketingResponse] = await Promise.all([
          fetch("/api/marketing/customers"),
          fetch("/api/marketing/users")
        ]);
        
        const customersData = await customersResponse.json();
        const marketingData = await marketingResponse.json();
        
        if (Array.isArray(customersData)) {
          setCustomers(customersData);
        }
        
        if (Array.isArray(marketingData)) {
          setMarketingUsers(marketingData);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load form data");
      }
    };
    
    fetchData();
  }, [])
  
  // Format date for display
  const formatDate = (date: Date) => {
    return format(date, "dd MMM yyyy")
  }
  
  // Calculate total price based on quantity, unit price, additional costs and tax
  useEffect(() => {
    calculateTotalPrice();
  }, [form.watch("jumlah"), form.watch("harga"), form.watch("tax"), form.watch("taxPercentage"), form.watch("additionalCosts"), calculateTotalPrice]);
  
  // Fetch fabric names when customer or fabric origin changes
  useEffect(() => {
    const fetchFabricNames = async () => {
      try {
        const asalBahan = form.watch("asalBahan");
        const customerId = form.watch("customerId");
        
        // Only fetch if we have both values
        if (!asalBahan || (asalBahan === "CUSTOMER" && !customerId)) {
          setFabricNames([]);
          return;
        }
        
        // Determine which customer ID to use
        const targetCustomerId = asalBahan === "SMARTONE" ? "22" : customerId;
        
        const response = await fetch(`/api/inventory/fabrics?customerId=${targetCustomerId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch fabric names");
        }
        
        const data = await response.json();
        setFabricNames(data);
      } catch (error) {
        console.error("Error fetching fabric names:", error);
        toast.error("Failed to load fabric options");
      }
    };
    
    fetchFabricNames();
  }, [form.watch("asalBahan"), form.watch("customerId")]);

  // Watch for changes in kategori to update targetSelesai
  useEffect(() => {
    const kategori = form.watch("kategori");
    const today = new Date();
    let targetDate = new Date();

    const addBusinessDays = (date: Date, days: number) => {
      let currentDate = new Date(date);
      let addedDays = 0;
      
      while (addedDays < days) {
        currentDate.setDate(currentDate.getDate() + 1);
        if (currentDate.getDay() !== 0) { // Skip Sundays
          addedDays++;
        }
      }
      
      return currentDate;
    };

    switch (kategori) {
      case "REGULAR ORDER":
        targetDate = addBusinessDays(today, 4);
        break;
      case "ONE DAY SERVICE":
        targetDate = addBusinessDays(today, 1);
        break;
      case "PROJECT":
        targetDate = addBusinessDays(today, 3);
        break;
    }

    form.setValue("targetSelesai", targetDate);
  }, [form.watch("kategori")]);

  // Fetch paper GSMs when component mounts
  useEffect(() => {
    const fetchPaperGSMs = async () => {
      setIsLoadingGSMs(true);
      try {
        console.log("[Order] Fetching paper GSMs");
        const response = await fetch("/api/inventory/paper-stock/gsm");
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
          console.error("Failed to fetch paper GSMs:", errorData);
          throw new Error(errorData.error || errorData.details || `HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("[Order] Received GSM data:", data);
        
        if (Array.isArray(data)) {
          // Process each GSM to ensure it's a number
          const processedGSMs = data
            .filter(gsm => gsm !== null && gsm !== undefined)
            .map(gsm => ({
              gsm: typeof gsm === 'number' ? gsm : parseInt(gsm, 10),
              remainingLength: 0 // We'll calculate this when width is selected
            }))
            .filter(item => !isNaN(item.gsm)); // Filter out any non-numeric values
          
          console.log("[Order] Processed GSMs:", processedGSMs);
          setPaperGSMs(processedGSMs);
          
          if (processedGSMs.length === 0) {
            toast.warning("No paper stocks available");
          }
        } else {
          console.error("[Order] Invalid GSM data format:", data);
          throw new Error("Invalid data format received");
        }
      } catch (error) {
        console.error("Error fetching paper GSMs:", error);
        toast.error(error instanceof Error ? error.message : "Failed to load paper GSM options");
        setPaperGSMs([]);
      } finally {
        setIsLoadingGSMs(false);
      }
    };

    fetchPaperGSMs();
  }, []);

  // Fetch paper widths when GSM is selected
  useEffect(() => {
    const fetchPaperWidths = async () => {
      if (!paperGSM) {
        setPaperWidths([]);
        setPaperWidth("");
        return;
      }

      setIsLoadingPaperWidths(true);
      try {
        // Use paperGSM directly as it's already a number
        const gsmStr = paperGSM.toString();
        
        const widthsResponse = await fetch(`/api/inventory/paper-stock/width?gsm=${encodeURIComponent(gsmStr)}`);
        
        if (!widthsResponse.ok) {
          const errorData = await widthsResponse.json();
          console.error("Failed to fetch paper widths:", errorData);
          toast.error("Failed to load paper widths");
          setPaperWidths([]);
          return;
        }
        
        const widths = await widthsResponse.json();
        console.log("Fetched paper widths:", widths);
        setPaperWidths(widths);
        
        // Auto-select the first width if available
        if (widths.length > 0) {
          setPaperWidth(widths[0]);
        } else {
          setPaperWidth("");
        }
      } catch (error) {
        console.error("Error fetching paper widths:", error);
        toast.error("Failed to load paper widths");
        setPaperWidths([]);
      } finally {
        setIsLoadingPaperWidths(false);
      }
    };

    fetchPaperWidths();
  }, [paperGSM]);

  // Fetch repeat orders when status changes to REPEAT
  useEffect(() => {
    const fetchRepeatOrders = async () => {
      const status = form.watch("statusProduksi");
      const customerId = form.watch("customerId");
      
      if (status === "REPEAT" && customerId) {
        try {
          const response = await fetch(`/api/orders/repeat?customerId=${customerId}`);
          if (!response.ok) throw new Error("Failed to fetch repeat orders");
          const data = await response.json();
          setRepeatOrders(data);
        } catch (error) {
          console.error("Error fetching repeat orders:", error);
          toast.error("Failed to load repeat orders");
        }
      }
    };

    fetchRepeatOrders();
  }, [form.watch("statusProduksi"), form.watch("customerId")]);

  // Update fabric info when fabric name changes and set recommended quantity
  useEffect(() => {
    const fabricName = form.watch("namaBahan");
    const selectedFabric = fabricNames.find(f => f.name === fabricName);
    setSelectedFabric(selectedFabric || null);
    
    // If fabric has estimated length, set it as recommended quantity
    if (selectedFabric && selectedFabric.length) {
      form.setValue("jumlah", selectedFabric.length);
    }
  }, [form.watch("namaBahan"), fabricNames, form]);

  // Add this function to fetch paper stock details
  const fetchPaperStockDetails = async (gsm: number | string, width: string) => {
    setIsLoadingStocks(true);
    try {
      // Convert gsm to string and ensure it's numeric
      const gsmStr = typeof gsm === 'number' ? gsm.toString() : gsm;
      
      const response = await fetch(`/api/inventory/paper-stock/details?gsm=${gsmStr}&width=${width}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch paper stock details: ${response.status}`);
      }
      const data = await response.json();
      setPaperStockDetails(data);
    } catch (error) {
      console.error("Error fetching paper stock details:", error);
      toast.error(error instanceof Error ? error.message : "Failed to load paper stock details");
      setPaperStockDetails([]);
    } finally {
      setIsLoadingStocks(false);
    }
  };

  // Add useEffect to watch for GSM and width changes
  useEffect(() => {
    const gsm = form.watch("gsmKertas");
    const width = form.watch("lebarKertas");
    
    if (gsm && width) {
      fetchPaperStockDetails(gsm, width);
    } else {
      setPaperStockDetails([]);
    }
  }, [form.watch("gsmKertas"), form.watch("lebarKertas")]);

  // Add this function before the onSubmit function
  const handleProductTypeChange = (type: string, checked: boolean) => {
    const currentValues = form.getValues("jenisProduk");
    
    // Special case for clearing - check if all values will be false after this change
    const willAllBeCleared = type === 'DTF' && !checked && 
      Object.entries(currentValues)
        .filter(([key]) => key !== 'DTF')
        .every(([_, value]) => !value);
        
    const isAnyOtherChecked = Object.entries(currentValues)
      .filter(([key]) => key !== 'DTF')
      .some(([_, value]) => value);
      
    const isDtfChecked = currentValues.DTF;
    
    if (type === 'DTF' && checked) {
      // If DTF is checked, uncheck all other product types
      form.setValue("jenisProduk", {
        PRINT: false,
        PRESS: false,
        CUTTING: false,
        DTF: true,
        SEWING: false,
      });
    } else if (type !== 'DTF' && checked) {
      // If any other type is checked, uncheck DTF
      form.setValue(`jenisProduk.DTF`, false);
    } else if (willAllBeCleared || 
              (Object.values(form.getValues("jenisProduk")).every(val => !val))) {
      // If we're clearing the last checkbox, force a re-render to reset all disabled states
      console.log("All product types cleared, resetting restrictions");
      
      // This timeout ensures React has time to update the state before we force a re-render
      setTimeout(() => {
        // Force a re-render by setting a dummy state
        form.setValue("jenisProduk", {
          ...form.getValues("jenisProduk")
        });
      }, 0);
    }
  };

  // Handle form submission
  const onSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Format additional costs for submission
      const validAdditionalCosts = (data.additionalCosts || [])
        .filter(cost => cost.item && cost.pricePerUnit && cost.unitQuantity)
        .map(cost => ({
          description: cost.item || "",
          pricePerUnit: parseFloat(cost.pricePerUnit || "0"),
          unitQuantity: parseFloat(cost.unitQuantity || "0"),
          total: parseFloat(calculateItemTotal(
            parseFloat(cost.pricePerUnit || "0"), 
            parseFloat(cost.unitQuantity || "0")
          ))
        }));
      
      // Add the SPK number to the form data
      const orderData = {
        customerId: data.customerId,
        spk: spkNumber,
        jenisProduk: data.jenisProduk,
        jumlah: parseFloat(data.jumlah || "0"),
        unit: data.unit,
        asalBahan: data.asalBahan,
        namaBahan: data.namaBahan,
        aplikasiProduk: data.aplikasiProduk,
        gsmKertas: paperGSM ? paperGSM.toString() : "",
        lebarKertas: paperWidth,
        fileWidth: data.fileWidth,
        matchingColor: data.matchingColor,
        notes: data.notes || "",
        statusProduksi: data.statusProduksi,
        kategori: data.kategori,
        targetSelesai: data.targetSelesai,
        marketing: data.marketing,
        fileDesain: data.fileDesain || "",
        harga: parseFloat(data.harga || "0"),
        
        // Include discount data
        discountType: data.discountType,
        discountValue: data.discountValue ? parseFloat(data.discountValue) : 0,
        
        tax: data.tax,
        taxPercentage: data.taxPercentage ? parseFloat(data.taxPercentage) : 0,
        totalPrice: parseFloat(data.totalPrice || "0"),
        additionalCosts: validAdditionalCosts.length > 0 
          ? JSON.stringify(validAdditionalCosts)
          : null,
        priority: data.priority,
      };

      console.log("Submitting form data:", orderData);

      // Convert jenisProduk object to string format for API
      const selectedTypes = Object.entries(data.jenisProduk)
        .filter(([_, isSelected]) => isSelected)
        .map(([type]) => type);
      
      const jenisProdukString = selectedTypes.length > 0 ? selectedTypes.join(", ") : "";
      
      // Convert yard to meter if unit is yard
      let quantity = data.jumlah;
      if (data.unit === "yard" && !isNaN(parseFloat(data.jumlah))) {
        quantity = yardToMeter(parseFloat(data.jumlah)).toFixed(2);
      }
      
      // Process additional costs to store as JSON string
      const processedAdditionalCosts = data.additionalCosts?.filter(
        cost => cost.item && cost.pricePerUnit && cost.unitQuantity && cost.total
      );
      
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...orderData,
          // Convert jenisProduk from object to string
          jenisProduk: jenisProdukString,
          // Include new fields
          asalBahan: data.asalBahan,
          namaBahan: data.namaBahan,
          tax: data.tax,
          taxPercentage: data.tax ? data.taxPercentage : null,
          totalPrice: data.totalPrice,
          // Include additional costs as JSON string
          additionalCosts: JSON.stringify(processedAdditionalCosts || []),
          // Use converted quantity if needed
          jumlah: quantity,
          // Include unit info
          unit: data.unit,
          // Remove status field as it's no longer needed
          status: "PENDING", // Default status for new orders
          // Ensure dates are properly formatted for the API
          tanggal: new Date().toISOString(),
          targetSelesai: data.targetSelesai ? data.targetSelesai.toISOString() : null,
          matchingColor: data.matchingColor,
          priority: data.priority,
        }),
      })
      
      if (!response.ok) {
        throw new Error("Failed to create order")
      }
      
      toast.success("Order created successfully")
      
      // Redirect back to order list
      router.push("/order")
    } catch (error) {
      console.error("Error submitting form:", error)
      toast.error("Failed to submit order")
    } finally {
      setIsSubmitting(false)
    }
  }

  useEffect(() => {
    // Fetch SPK number when component mounts
    fetchSpkNumber();
    
    // Initialize marketing field with current user if available
    if (session?.data?.user?.name) {
      form.setValue('marketing', session.data.user.name);
    }
  }, [session]);

  return (
    <div className="relative">
      {isSubmitting && <LoadingOverlay message="Submitting order..." />}
      <div className="container mx-auto py-10">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight">New Order</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/order")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        
        <div className="container py-10">
          <Form {...form}>
            <Card className={cn("max-w-4xl mx-auto")}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>Add New Order</CardTitle>
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0 m-0">
                        <div className="space-y-0 leading-none flex items-center">
                          <FormLabel className="font-bold text-red-500 mr-2">PRIORITY</FormLabel>
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                              className={cn(
                                "border-2", 
                                field.value ? 
                                  "border-red-500 bg-red-500 animate-pulse" : 
                                  "border-gray-300"
                              )}
                            />
                          </FormControl>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>
                <CardDescription>
                  Enter the order details below
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Section 1: Customer Info & SPK */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Customer Selection */}
                    <FormField
                      control={form.control}
                      name="customerId"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Customer*</FormLabel>
                          <Popover open={isCustomerOpen} onOpenChange={setIsCustomerOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isCustomerOpen}
                                  className="justify-between"
                                >
                                  {field.value
                                    ? customers.find((customer) => customer.id === field.value)?.nama
                                    : "Select Customer"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                              <Command>
                                <CommandInput placeholder="Search customers..." />
                                <CommandEmpty>No customer found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {customers.map((customer) => (
                                    <CommandItem
                                      key={customer.id}
                                      value={customer.nama}
                                      onSelect={() => {
                                        form.setValue("customerId", customer.id)
                                        setIsCustomerOpen(false)
                                      }}
                                    >
                                      {customer.nama}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* SPK Number */}
                    <FormField
                      control={form.control}
                      name="spk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>SPK Number</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="SPK number"
                              {...field}
                              readOnly
                              className="bg-muted"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                    
                  {/* Section 2: Marketing & Production Status */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Marketing */}
                    <FormField
                      control={form.control}
                      name="marketing"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Marketing</FormLabel>
                          <Popover open={isMarketingOpen} onOpenChange={setIsMarketingOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isMarketingOpen}
                                  className="justify-between"
                                >
                                  {field.value
                                    ? marketingUsers.find((user) => user.name === field.value)?.name
                                    : "Select Marketing"}
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                              <Command>
                                <CommandInput placeholder="Search marketing users..." />
                                <CommandEmpty>No marketing user found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {marketingUsers.map((user) => (
                                    <CommandItem
                                      key={user.id}
                                      value={user.name}
                                      onSelect={() => {
                                        form.setValue("marketing", user.name)
                                        setIsMarketingOpen(false)
                                      }}
                                    >
                                      {user.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Status Produksi */}
                    <FormField
                      control={form.control}
                      name="statusProduksi"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Production Status*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select production status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="NEW">NEW</SelectItem>
                              <SelectItem value="REPEAT">REPEAT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section 3: Category & Target Date */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Category */}
                    <FormField
                      control={form.control}
                      name="kategori"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="REGULAR ORDER">REGULAR ORDER</SelectItem>
                              <SelectItem value="ONE DAY SERVICE">ONE DAY SERVICE</SelectItem>
                              <SelectItem value="PROJECT">PROJECT</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Target Completion Date */}
                    <FormField
                      control={form.control}
                      name="targetSelesai"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Target Completion Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  className="pl-3 text-left font-normal"
                                >
                                  {field.value ? (
                                    formatDate(field.value)
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0 max-h-[85vh] overflow-y-auto" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value || undefined}
                                onSelect={field.onChange}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Repeat Order Button - conditionally shown */}
                  {form.watch("statusProduksi") === "REPEAT" && (
                    <div className="col-span-2">
                      <Button
                        type="button"
                        onClick={() => setShowRepeatOrders(true)}
                        className="w-full"
                      >
                        Pick Repeat Order
                      </Button>
                    </div>
                  )}

                  {/* Section 4: Fabric Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Fabric Origins */}
                    <FormField
                      control={form.control}
                      name="asalBahan"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Fabric Origins*</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select fabric origin" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="SMARTONE">SMARTONE</SelectItem>
                              <SelectItem value="CUSTOMER">CUSTOMER</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    {/* Fabric Name */}
                    <FormField
                      control={form.control}
                      name="namaBahan"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fabric Name</FormLabel>
                          <Popover open={isFabricNameOpen} onOpenChange={setIsFabricNameOpen}>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  variant="outline"
                                  role="combobox"
                                  aria-expanded={isFabricNameOpen}
                                  className="justify-between w-full"
                                  disabled={fabricNames.length === 0}
                                >
                                  {field.value
                                    ? fabricNames.find((fabric) => fabric.name === field.value)?.name
                                    : "Select fabric"}
                                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-[300px] max-h-[400px] overflow-y-auto">
                              <Command>
                                <CommandInput placeholder="Search fabric..." />
                                <CommandEmpty>No fabric found.</CommandEmpty>
                                <CommandGroup className="max-h-[300px] overflow-y-auto">
                                  {fabricNames.map((fabric) => (
                                    <CommandItem
                                      key={fabric.id}
                                      value={fabric.name}
                                      onSelect={() => {
                                        form.setValue("namaBahan", fabric.name);
                                        setIsFabricNameOpen(false);
                                      }}
                                    >
                                      {fabric.name}
                                    </CommandItem>
                                  ))}
                                </CommandGroup>
                              </Command>
                            </PopoverContent>
                          </Popover>
                          {selectedFabric && (
                            <div className="mt-2 text-sm space-y-1">
                              {selectedFabric.description && (
                                <p className="text-muted-foreground">Description: {selectedFabric.description}</p>
                              )}
                              {selectedFabric.composition && (
                                <p className="text-muted-foreground">Composition: {selectedFabric.composition}</p>
                              )}
                              {selectedFabric.weight && (
                                <p className="text-muted-foreground">Weight: {selectedFabric.weight}</p>
                              )}
                              {selectedFabric.width && (
                                <p className="text-muted-foreground">Width: {selectedFabric.width}</p>
                              )}
                              {selectedFabric.length && (
                                <p className="text-muted-foreground">Available: {selectedFabric.length} m</p>
                              )}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Product Application */}
                    <FormField
                      control={form.control}
                      name="aplikasiProduk"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Application</FormLabel>
                          <FormControl>
                            <Input placeholder="Product application" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section 5: Product Type */}
                  <div className="space-y-4 border p-4 rounded-md">
                    <FormLabel className="text-base">Product Type*</FormLabel>
                    {/* Shortcut Buttons */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("jenisProduk", {
                            PRINT: true,
                            PRESS: true,
                            CUTTING: false,
                            DTF: false,
                            SEWING: false,
                          });
                        }}
                        disabled={form.watch("jenisProduk.DTF")}
                      >
                        Print + Press
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("jenisProduk", {
                            PRINT: true,
                            PRESS: true,
                            CUTTING: true,
                            DTF: false,
                            SEWING: false,
                          });
                        }}
                        disabled={form.watch("jenisProduk.DTF")}
                      >
                        Print + Press + Cut
                      </Button>
                      
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("jenisProduk", {
                            PRINT: true,
                            PRESS: true,
                            CUTTING: true,
                            DTF: false,
                            SEWING: true,
                          });
                        }}
                        disabled={form.watch("jenisProduk.DTF")}
                      >
                        Full Order
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("jenisProduk", {
                            PRINT: false,
                            PRESS: false,
                            CUTTING: false,
                            DTF: true,
                            SEWING: false,
                          });
                        }}
                        disabled={form.watch("jenisProduk.PRINT") || 
                                  form.watch("jenisProduk.PRESS") || 
                                  form.watch("jenisProduk.CUTTING") || 
                                  form.watch("jenisProduk.SEWING")}
                      >
                        DTF Only
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          form.setValue("jenisProduk", {
                            PRINT: false,
                            PRESS: false,
                            CUTTING: false,
                            DTF: false,
                            SEWING: false,
                          });
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      <FormField
                        control={form.control}
                        name="jenisProduk.PRINT"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleProductTypeChange('PRINT', !!checked);
                                }}
                                disabled={form.watch("jenisProduk.DTF")}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              PRINT
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jenisProduk.PRESS"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleProductTypeChange('PRESS', !!checked);
                                }}
                                disabled={form.watch("jenisProduk.DTF")}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              PRESS
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jenisProduk.CUTTING"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleProductTypeChange('CUTTING', !!checked);
                                }}
                                disabled={form.watch("jenisProduk.DTF")}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              CUTTING
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jenisProduk.SEWING"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleProductTypeChange('SEWING', !!checked);
                                }}
                                disabled={form.watch("jenisProduk.DTF")}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              SEWING
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="jenisProduk.DTF"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                            <FormControl>
                              <Checkbox
                                checked={field.value}
                                onCheckedChange={(checked) => {
                                  field.onChange(checked);
                                  handleProductTypeChange('DTF', !!checked);
                                }}
                                disabled={form.watch("jenisProduk.PRINT") || 
                                          form.watch("jenisProduk.PRESS") || 
                                          form.watch("jenisProduk.CUTTING") || 
                                          form.watch("jenisProduk.SEWING")}
                              />
                            </FormControl>
                            <FormLabel className="font-normal cursor-pointer">
                              DTF
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormMessage />
                  </div>

                  {/* Section 6: Paper Information */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Paper GSM */}
                    <FormField
                      control={form.control}
                      name="gsmKertas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paper GSM</FormLabel>
                          <FormControl>
                            <Select
                              value={paperGSM ? paperGSM.toString() : ""}
                              onValueChange={(value) => setPaperGSM(value ? parseInt(value, 10) : "")}
                              disabled={isLoadingGSMs || paperGSMs.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingGSMs ? "Loading GSMs..." : "Select Paper GSM"} />
                              </SelectTrigger>
                              <SelectContent>
                                {paperGSMs.map((item) => (
                                  <SelectItem key={item.gsm} value={item.gsm.toString()}>
                                    {item.gsm} GSM
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Paper Width */}
                    <FormField
                      control={form.control}
                      name="lebarKertas"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Paper Width</FormLabel>
                          <FormControl>
                            <Select
                              value={paperWidth}
                              onValueChange={setPaperWidth}
                              disabled={isLoadingPaperWidths || paperWidths.length === 0}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder={isLoadingPaperWidths ? "Loading..." : "Select Paper Width"} />
                              </SelectTrigger>
                              <SelectContent>
                                {paperWidths.map((width) => (
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

                    {/* File Width */}
                    <FormField
                      control={form.control}
                      name="fileWidth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Width</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter file width" className="max-w-[200px]" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Matching Color */}
                    <FormField
                      control={form.control}
                      name="matchingColor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Matching Color</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
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

                    {/* Design File */}
                    <FormField
                      control={form.control}
                      name="fileDesain"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Design File</FormLabel>
                          <FormControl>
                            <Input placeholder="File path or URL" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                  {/* Section 7: Quantity and Pricing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Quantity with Unit Selection */}
                    <div className="grid grid-cols-1 gap-2">
                      <FormField
                        control={form.control}
                        name="jumlah"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Quantity*</FormLabel>
                            <div className="flex space-x-2">
                              <FormControl>
                                <Input 
                                  placeholder="Quantity" 
                                  {...field} 
                                  type="text"
                                  onChange={(e) => {
                                    // Only allow numbers and decimal point
                                    const value = e.target.value;
                                    if (value === "" || /^(\d+)?\.?\d*$/.test(value)) {
                                      field.onChange(value);
                                    }
                                  }} 
                                />
                              </FormControl>
                              <FormField
                                control={form.control}
                                name="unit"
                                render={({ field }) => (
                                  <FormItem>
                                    <Select
                                      value={field.value}
                                      onValueChange={(value) => {
                                        field.onChange(value);
                                      }}
                                    >
                                      <FormControl>
                                        <SelectTrigger className="w-[120px]">
                                          <SelectValue placeholder="Unit" />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        <SelectItem value="meter">meter</SelectItem>
                                        <SelectItem value="yard">yard</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                            </div>
                            {selectedFabric && selectedFabric.length && (
                              (form.watch("unit") === "yard" && parseFloat(field.value) > 0) ? 
                                (yardToMeter(parseFloat(field.value)) > parseFloat(selectedFabric.length)) && (
                                  <p className="text-sm text-orange-500 mt-1">
                                    Warning: Quantity exceeds available fabric stock ({selectedFabric.length} m)
                                  </p>
                                )
                              :
                                parseFloat(field.value) > parseFloat(selectedFabric.length) && (
                                  <p className="text-sm text-orange-500 mt-1">
                                    Warning: Quantity exceeds available fabric stock ({selectedFabric.length} m)
                                  </p>
                                )
                            )}
                            {/* Show conversion if yard is selected */}
                            {form.watch("unit") === "yard" && field.value && !isNaN(parseFloat(field.value)) && (
                              <p className="text-sm text-muted-foreground mt-1">
                                = {yardToMeter(parseFloat(field.value)).toFixed(2)} meters
                              </p>
                            )}
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>                
                    
                    {/* Price */}
                    <FormField
                      control={form.control}
                      name="harga"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Unit Price</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              placeholder="Enter unit price"
                              onChange={(e) => {
                                field.onChange(e);
                                calculateTotalPrice();
                              }}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  
                    {/* Additional Costs */}
                    <div className="col-span-full">
                      <div className="flex flex-col space-y-2">
                        <h3 className="text-lg font-medium">Additional Costs</h3>
                        
                        {form.watch("additionalCosts")?.length === 0 ? (
                          <p className="text-sm text-muted-foreground">No additional costs added. Click "Add Cost" to add costs.</p>
                        ) : (
                          <div className="space-y-2">
                            {/* Headers */}
                            <div className="grid grid-cols-12 gap-2 mb-1">
                              <div className="col-span-5 text-sm font-medium">Item</div>
                              <div className="col-span-2 text-sm font-medium">Price/Unit</div>
                              <div className="col-span-2 text-sm font-medium">Quantity</div>
                              <div className="col-span-2 text-sm font-medium">Total</div>
                              <div className="col-span-1"></div>
                            </div>
                            
                            {/* Cost Items */}
                            {form.watch("additionalCosts")?.map((cost, index) => (
                              <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                <div className="col-span-5">
                                  <Input 
                                    placeholder="Description" 
                                    value={cost.item} 
                                    onChange={(e) => {
                                      const updatedCosts = form.getValues("additionalCosts") || [];
                                      updatedCosts[index].item = e.target.value;
                                      form.setValue("additionalCosts", updatedCosts);
                                      calculateTotalPrice();
                                    }}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Input 
                                    type="number" 
                                    placeholder="Price" 
                                    value={cost.pricePerUnit} 
                                    onChange={(e) => {
                                      const updatedCosts = form.getValues("additionalCosts") || [];
                                      updatedCosts[index].pricePerUnit = e.target.value;
                                      form.setValue("additionalCosts", updatedCosts);
                                      calculateTotalPrice();
                                    }}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Input 
                                    type="number" 
                                    placeholder="Qty" 
                                    value={cost.unitQuantity} 
                                    onChange={(e) => {
                                      const updatedCosts = form.getValues("additionalCosts") || [];
                                      updatedCosts[index].unitQuantity = e.target.value;
                                      form.setValue("additionalCosts", updatedCosts);
                                      calculateTotalPrice();
                                    }}
                                  />
                                </div>
                                <div className="col-span-2">
                                  <Input 
                                    readOnly 
                                    value={calculateItemTotal(parseFloat(cost.pricePerUnit || "0"), parseFloat(cost.unitQuantity || "0"))} 
                                    className="bg-muted"
                                  />
                                </div>
                                <div className="col-span-1">
                                  <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                      const updatedCosts = form.getValues("additionalCosts") || [];
                                      updatedCosts.splice(index, 1);
                                      form.setValue("additionalCosts", updatedCosts);
                                      calculateTotalPrice();
                                    }}
                                    className="h-8 w-8"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                        
                        {/* Add Cost Button */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="mt-2 w-full md:w-auto"
                          onClick={() => {
                            const currentCosts = form.getValues("additionalCosts") || [];
                            if (currentCosts.length < 6) {
                              form.setValue("additionalCosts", [
                                ...currentCosts,
                                { item: "", pricePerUnit: "", unitQuantity: "", total: "" }
                              ]);
                            } else {
                              toast.warning("Maximum 6 additional costs allowed");
                            }
                            calculateTotalPrice();
                          }}
                        >
                          <Plus className="mr-2 h-4 w-4" />
                          Add Cost
                        </Button>
                      </div>
                    </div>

                    {/* Discount Type */}
                    <FormField
                      control={form.control}
                      name="discountType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Discount Type</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                              if (value === "none") {
                                form.setValue("discountValue", "");
                              }
                              calculateTotalPrice();
                            }}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select discount type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="none">No Discount</SelectItem>
                              <SelectItem value="fixed">Fixed Amount</SelectItem>
                              <SelectItem value="percentage">Percentage</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {/* Discount Value - Only shown if discount type is selected */}
                    {form.watch("discountType") !== "none" && (
                      <FormField
                        control={form.control}
                        name="discountValue"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              {form.watch("discountType") === "fixed"
                                ? "Discount Amount"
                                : "Discount Percentage (%)"}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                type="number"
                                placeholder={
                                  form.watch("discountType") === "fixed"
                                    ? "Enter discount amount"
                                    : "Enter discount percentage"
                                }
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotalPrice();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Tax Checkbox */}
                    <FormField
                      control={form.control}
                      name="tax"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={(checked) => {
                                field.onChange(checked);
                                calculateTotalPrice();
                              }}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Include Tax
                            </FormLabel>
                            <FormDescription>
                              Check if tax should be included in the price calculation
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />

                    {/* Tax Percentage */}
                    {form.watch("tax") && (
                      <FormField
                        control={form.control}
                        name="taxPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tax Percentage</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="Tax %" 
                                {...field} 
                                onChange={(e) => {
                                  field.onChange(e);
                                  calculateTotalPrice();
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                    
                    {/* Total Price (Calculated) */}
                    <FormField
                      control={form.control}
                      name="totalPrice"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Price</FormLabel>
                          <FormControl>
                            <Input placeholder="Total Price" {...field} readOnly className="bg-muted" />
                          </FormControl>
                          {field.value && (
                            <div className="text-4xl font-bold mt-1">
                              {formatCurrency(parseFloat(field.value))}
                            </div>
                          )}
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                  </div>

                  {/* Section 8: Notes */}
                  <FormField
                    control={form.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Additional notes for this order"
                            className="min-h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <CardFooter className="px-0 pb-0 flex justify-between">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => router.push("/order")}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Create Order
                    </Button>
                  </CardFooter>
                </form>
              </CardContent>
            </Card>
          </Form>
        </div>

        {/* Repeat Order Dialog */}
        <DialogModal 
          open={showRepeatOrders} 
          onOpenChange={setShowRepeatOrders}
          title="Select Repeat Order"
          description="Choose a previous order to repeat"
          maxWidth="lg"
        >
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            {repeatOrders.map((order) => (
              <div key={order.spk} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <h4 className="font-medium">SPK: {order.spk}</h4>
                  <p className="text-sm text-muted-foreground">
                    Order Date: {format(new Date(order.orderDate), "dd MMM yyyy")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{order.details}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      router.push(`/order/view/${order.spk}`);
                    }}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      form.setValue("notes", `REPEAT SPK No. ${order.spk}`);
                      setShowRepeatOrders(false);
                    }}
                  >
                    Choose
                  </Button>
                </div>
              </div>
            ))}
            {repeatOrders.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No repeat orders found for this customer.
              </div>
            )}
          </div>
        </DialogModal>
      </div>
    </div>
  )
}