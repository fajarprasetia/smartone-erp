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
    setInitialData
  } = useOrderData()

  // Initialize with data if in edit mode
  useEffect(() => {
    if (mode === 'edit' && initialData) {
      setInitialData(initialData);
    }
  }, [mode, initialData, setInitialData]);

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 w-full">
              {/* Customer and Marketing Section */}
              <CustomerSection
                form={form}
                customers={customers}
                marketingUsers={marketingUsers}
                isCustomerOpen={isCustomerOpen}
                setIsCustomerOpen={setIsCustomerOpen}
                isMarketingOpen={isMarketingOpen}
                setIsMarketingOpen={setIsMarketingOpen}
                spkNumber={spkNumber}
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
                handleProductTypeChange={handleProductTypeChange}
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