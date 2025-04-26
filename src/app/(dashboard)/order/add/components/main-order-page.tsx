"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form } from "@/components/ui/form"
import { Button } from "@/components/ui/button"
import { SaveIcon, XIcon, ChevronLeft, ChevronsUpDown, Check, X, Plus } from "lucide-react"
import { LoadingOverlay } from "@/components/ui/loading-overlay"
import { Checkbox } from "@/components/ui/checkbox"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

import { CustomerSection } from "./customer-section"
import { OrderDetailSection } from "./order-detail-section"
import { ProductTypeSection } from "./product-type-section"
import { FabricInfoSection } from "./fabric-info-section"
import { PaperInfoSection } from "./paper-info-section"
import { PricingSection } from "./pricing-section"
import { NotesSection } from "./notes-section"
import { useOrderData } from "../hooks/use-order-data"
import { Customer, OrderFormValues } from "../schemas/order-form-schema"

interface MainOrderPageProps {
  mode?: 'create' | 'edit';
  initialData?: any;
}

export function MainOrderPage({ mode = 'create', initialData }: MainOrderPageProps) {
  const router = useRouter()
  const {
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
    handleProductTypeChange,
    handleDTFPassChange,
    onSubmit,
    spkOptions,
    isRepeatOrder,
    setIsRepeatOrder,
    loading,
    handleFetchRepeatOrderInfo,
    isLoadingMarketingUsers,
    isLoadingFabricNames,
    paperGsmOptions,
    paperWidthOptions,
    isLoadingPaperGsm,
    isLoadingPaperWidth,
    setInitialData,
    fetchSpkNumber,
    refreshCustomers
  } = useOrderData(mode, initialData)

  // Get special product type if only one is selected
  const getSpecialProductType = () => {
    const productTypes = form.getValues("jenisProduk");
    
    // Check if only one product type is selected
    if (productTypes) {
      const selectedCount = Object.values(productTypes).filter(Boolean).length;
      
      if (selectedCount === 1) {
        if (productTypes.PRINT) return "PRINT ONLY";
        if (productTypes.PRESS) return "PRESS ONLY";
        if (productTypes.CUTTING) return "CUTTING ONLY";
      }
    }
    
    return null;
  };

  // Modify the submission handler to handle special product types
  const handleSubmit = async (data: OrderFormValues) => {
    // Check if a special product type is needed
    const specialProductType = getSpecialProductType();
    
    if (specialProductType) {
      // Create a copy of the data
      const modifiedData = { ...data };
      
      // Add the special product type to the notes for visibility
      if (modifiedData.notes) {
        if (!modifiedData.notes.includes(specialProductType)) {
          modifiedData.notes = `${modifiedData.notes} [${specialProductType}]`;
        }
      } else {
        modifiedData.notes = `[${specialProductType}]`;
      }
      
      // Set produk field directly for API consumption
      // @ts-ignore - Adding property for API that's not in the type
      modifiedData.produk = specialProductType;
      
      // Submit with the special product type information
      await onSubmit(modifiedData);
    } else {
      // Normal submission for multiple product types or other scenarios
      await onSubmit(data);
    }
  };

  // Initialize with data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setInitialData(initialData);
    }
  }, [mode, initialData, setInitialData]);

  // Display SPK number in title for easy identification
  useEffect(() => {
    // Update document title with SPK number when available
    if (spkNumber) {
      document.title = `Order ${spkNumber} - ${mode === 'create' ? 'Add' : 'Edit'} | SmartOne ERP`;
    }
    
    // Reset title when component unmounts
    return () => {
      document.title = 'Order | SmartOne ERP';
    };
  }, [spkNumber, mode]);

  const onCancel = () => {
    if (confirm("Are you sure you want to cancel? All changes will be lost.")) {
      router.push("/order")
      toast.info(mode === 'create' ? "Order creation canceled" : "Order editing canceled")
    }
  }

  return (
    <div className="container mx-auto py-6 relative">
      {isSubmitting && <LoadingOverlay message={mode === 'create' ? "Creating order..." : "Updating order..."} />}
      
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle className="text-2xl font-bold">{mode === 'create' ? "Add New Order" : "Edit Order"}</CardTitle>
            <CardDescription>
              {mode === 'create' 
                ? "Create a new order by filling in the details below" 
                : "Update the order information and click save when done"}
            </CardDescription>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="priority-header"
              checked={form.watch("priority")}
              onCheckedChange={(checked) => form.setValue("priority", !!checked)}
              className={`h-5 w-5 ${
                form.watch("priority")
                  ? "border-red-500 bg-red-500 text-primary-foreground animate-pulse"
                  : ""
              }`}
            />
            <label
              htmlFor="priority-header"
              className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                form.watch("priority") ? "text-red-500 font-bold" : ""
              }`}
            >
              PRIORITY
            </label>
          </div>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8 w-full">
              {/* Customer and Marketing Section */}
              <CustomerSection
                form={form}
                customers={customers.map(c => ({
                  id: c.id,
                  nama: c.nama,
                  telp: c.telp || null
                }))}
                marketingUsers={marketingUsers}
                isCustomerOpen={isCustomerOpen}
                setIsCustomerOpen={setIsCustomerOpen}
                isMarketingOpen={isMarketingOpen}
                setIsMarketingOpen={setIsMarketingOpen}
                spkNumber={spkNumber}
                fetchSpkNumber={fetchSpkNumber}
                refreshCustomers={refreshCustomers}
              />

              {/* Order Detail Section */}
              <OrderDetailSection
                form={form}
                repeatOrders={repeatOrders}
                showRepeatOrders={showRepeatOrders}
                setShowRepeatOrders={setShowRepeatOrders}
                handleFetchRepeatOrderInfo={handleFetchRepeatOrderInfo}
              />

              {/* Product Type Section */}
              <ProductTypeSection
                form={form}
                handleProductTypeChange={(type: any, checked: boolean) => 
                  handleProductTypeChange(type, checked)
                }
                handleDTFPassChange={handleDTFPassChange}
              />

              {/* Fabric Section */}
              <FabricInfoSection
                form={form}
                fabricNames={fabricNames}
                selectedFabric={selectedFabric}
                setSelectedFabric={setSelectedFabric}
                isFabricNameOpen={isFabricNameOpen}
                setIsFabricNameOpen={setIsFabricNameOpen}
              />

              {/* File Details and Paper Info Section */}
              <PaperInfoSection
                form={form}
                paperGsmOptions={paperGsmOptions}
                paperWidthOptions={paperWidthOptions}
                isLoadingPaperGsm={isLoadingPaperGsm}
                isLoadingPaperWidth={isLoadingPaperWidth}
                selectedFabric={selectedFabric}
              />

              {/* Pricing Section */}
              <PricingSection
                form={form}
              />

              {/* Notes Section */}
              <NotesSection
                form={form}
              />

              {/* Form Actions */}
              <div className="flex justify-end space-x-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                >
                  <XIcon className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                >
                  <SaveIcon className="h-4 w-4 mr-2" />
                  {mode === 'create' ? "Save Order" : "Update Order"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
} 