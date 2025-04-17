"use client"

import React, { useEffect, useState } from "react"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Loader2 } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { OrderFormValues, RepeatOrder } from "../schemas/order-form-schema"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { Switch } from "@/components/ui/switch"
import { toast } from "sonner"
import { DialogModal } from "@/components/ui/dialog-modal"
import Image from "next/image"
import { Check, Clock, Search } from "lucide-react"
import { useFormContext } from "react-hook-form"

// A component to display order details in a view dialog
interface OrderViewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  orderId: string
}

const OrderViewDialog = ({ open, onOpenChange, orderId }: OrderViewDialogProps) => {
  const [order, setOrder] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open || !orderId) return

    const fetchOrderDetails = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const response = await fetch(`/api/orders/spk?spk=${encodeURIComponent(orderId)}`)
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.status}`)
        }
        
        const data = await response.json()
        setOrder(data)
      } catch (err) {
        console.error("Error fetching order:", err)
        setError(err instanceof Error ? err.message : "Failed to load order details")
      } finally {
        setLoading(false)
      }
    }
    
    fetchOrderDetails()
  }, [open, orderId])

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A"
    try {
      return format(new Date(dateString), "dd/MM/yyyy")
    } catch (error) {
      return "Invalid date"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-4">Loading order details...</p>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="p-6">
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p>{error || "Order not found"}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-h-[70vh] overflow-auto p-2">
      {/* SPK Document preview - similar to view/[id]/page.tsx but simplified */}
      <div className="bg-white rounded-md border">
        {/* 1. Header Table */}
        <table className="w-full table-fixed border-collapse border mb-4">
          <colgroup>
            <col className="w-[80px]" />
            <col className="w-[20%]" />
            <col className="w-[25%]" />
            <col className="w-[20%]" />
            <col className="w-[25%]" />
          </colgroup>
          <thead>
            <tr>
              <th colSpan={5} className="text-center border py-1.5 px-2 bg-muted/20">
                <h2 className="text-lg font-bold">Surat Perintah Kerja</h2>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={3} className="text-center border p-1.5">
                <div className="relative h-[70px] w-[70px] mx-auto">
                  <Image src="/logo.png" alt="SmartOne Logo" width={70} height={70} style={{ objectFit: "contain" }} />
                </div>
              </td>
              <td className="border p-1.5 text-sm font-medium">No Invoice</td>
              <td className="border p-1.5 text-sm">{order.invoice || "N/A"}</td>
              <td className="border p-1.5 text-sm font-medium">No Project</td>
              <td className="border p-1.5 text-sm">{order.no_project || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5 text-sm font-medium">Revisi</td>
              <td className="border p-1.5 text-sm">-</td>
              <td className="border p-1.5 text-sm font-medium">No. SPK</td>
              <td className="border p-1.5 text-sm">{order.spk || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5 text-sm font-medium">Estimasi</td>
              <td className="border p-1.5 text-sm">{formatDate(order.est_order || order.targetSelesai)}</td>
              <td className="border p-1.5 text-sm font-medium">Tanggal</td>
              <td className="border p-1.5 text-sm">{formatDate(order.created_at || order.tanggal)}</td>
            </tr>
          </tbody>
        </table>

        {/* 2. Detail Order Table */}
        <h1 className="text-base font-bold mb-1.5 pl-2">1. Detail Order</h1>
        <table className="w-full border-collapse border mb-4 table-fixed">
          <colgroup>
            <col className="w-[30%]" />
            <col className="w-[40%]" />
            <col className="w-[30%]" />
          </colgroup>
          <thead>
            <tr className="bg-muted/20">
              <th className="border p-1.5 text-center text-sm font-medium">KETERANGAN</th>
              <th className="border p-1.5 text-center text-sm font-medium">DESKRIPSI</th>
              <th className="border p-1.5 text-center text-sm font-medium">CATATAN</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr><td className="border p-1.5">1. Asal Bahan</td><td className="border p-1.5">{order.asal_bahan_rel?.nama || order.asal_bahan || "N/A"}</td><td rowSpan={8} className="border p-1.5 align-top">
              {order.catatan_design && (
                <>
                  <span className="text-xs font-medium">Catatan Designer:</span>
                  <p className="text-sm font-bold text-red-600 mt-1">{order.catatan_design}</p>
                </>
              )}
            </td></tr>
            <tr><td className="border p-1.5">2. Nama Kain</td><td className="border p-1.5">{order.nama_kain || "N/A"}</td></tr>
            <tr><td className="border p-1.5">3. Jumlah Kain</td><td className="border p-1.5">-</td></tr>
            <tr><td className="border p-1.5">4. Lebar Kertas</td><td className="border p-1.5">{order.lebar_kertas || "N/A"}</td></tr>
            <tr><td className="border p-1.5">5. Aplikasi Produk</td><td className="border p-1.5">{order.nama_produk || order.produk || "N/A"}</td></tr>
            <tr><td className="border p-1.5">6. Quantity Produksi</td><td className="border p-1.5">{order.qty || "N/A"}</td></tr>
            <tr><td className="border p-1.5">7. Panjang Layout</td><td className="border p-1.5">
              {order.lebar_kertas && order.qty ? `${order.lebar_kertas} X ${order.qty}` : "N/A"}
            </td></tr>
            <tr><td className="border p-1.5">8. Nama File</td><td className="border p-1.5">{order.path || "N/A"}</td></tr>
          </tbody>
        </table>
        
        {/* 3. Preview Project Table */}
        <h1 className="text-base font-bold mb-1.5 pl-2">2. Preview Project</h1>
        <table className="w-full border-collapse border mb-4 preview-project-table">
          <colgroup>
            <col className="w-[70%]" />
            <col className="w-[30%]" />
          </colgroup>
          <tbody className="text-sm">
            <tr>
              <td rowSpan={2} className="border p-1.5 text-center">
                <p className="text-base font-medium">{order.customer?.nama || "N/A"}</p>
              </td>
              <td className="border p-1.5 font-medium">Marketing</td>
            </tr>
            <tr>
              <td className="border p-1.5">{order.marketingInfo?.name || order.marketing || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5 text-center align-middle">
                <div className="min-h-[220px] flex flex-col justify-center items-center">
                  <p className="text-base font-bold text-red-600">{order.produk || "N/A"}</p>
                  <p className="text-sm font-bold text-red-600 mt-0.5">{order.kategori || "N/A"}</p>
                  <div className="flex justify-center gap-3 mt-3 flex-wrap">
                    {order.capture && (
                      <div className="relative h-[150px] w-[200px] flex-shrink-0">
                        <Image
                          src={`/uploads/${order.capture}`}
                          alt="Design preview"
                          width={200}
                          height={150}
                          className="object-contain max-h-[150px]"
                        />
                      </div>
                    )}
                    {order.capture_name && (
                      <div className="relative h-[100px] w-[240px] flex-shrink-0">
                        <Image
                          src={`/uploads/${order.capture_name}`}
                          alt="Name preview"
                          width={240}
                          height={100}
                          className="object-contain max-h-[100px]"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="border p-1.5 align-top">
                <table className="w-full border-collapse text-xs min-w-0">
                  <colgroup>
                    <col className="w-[50%]" />
                    <col className="w-[50%]" />
                  </colgroup>
                  <tbody>
                    <tr><td className="pr-1 py-0.5">Lebar Kertas</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.lebar_kertas || ""} readOnly /></td></tr>
                    <tr><td className="pr-1 py-0.5">Gramasi Kertas</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.gramasi || ""} readOnly /></td></tr>
                    <tr><td className="pr-1 py-0.5">Lebar Kain</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.lebar_kain || ""} readOnly /></td></tr>
                    <tr><td className="pr-1 py-0.5">Lebar File</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.lebar_file || ""} readOnly /></td></tr>
                    <tr><td className="pr-1 py-0.5">Warna Acuan</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.warna_acuan || ""} readOnly /></td></tr>
                    <tr><td className="pr-1 py-0.5">Status Produksi</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order.statusprod || order.status || ""} readOnly /></td></tr>
                  </tbody>
                </table>
                <div className="mt-2">
                  <p className="text-xs font-medium">Catatan:</p>
                  <p className="text-sm font-medium text-red-600 break-words mt-0.5">{order.catatan || "N/A"}</p>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  )
}

interface OrderDetailSectionProps {
  form: UseFormReturn<OrderFormValues>
  className?: string
  repeatOrders: RepeatOrder[]
  showRepeatOrders: boolean
  setShowRepeatOrders: (value: boolean) => void
  handleFetchRepeatOrderInfo: (spkNumber: string) => void
  isLoadingRepeatOrder?: boolean
  repeatOrderData?: RepeatOrder[] | null
  setSelectedRepeatOrder?: (order: RepeatOrder | null) => void
  selectedRepeatOrder?: RepeatOrder | null
}

export function OrderDetailSection({
  form,
  className,
  repeatOrders,
  showRepeatOrders,
  setShowRepeatOrders,
  handleFetchRepeatOrderInfo,
  isLoadingRepeatOrder,
  repeatOrderData,
  setSelectedRepeatOrder,
  selectedRepeatOrder,
}: OrderDetailSectionProps) {
  const [openRepeatOrderDialog, setOpenRepeatOrderDialog] = useState(false)
  const [repeatOrderNumber, setRepeatOrderNumber] = useState("")
  const [repeatOrder, setRepeatOrder] = useState(false)
  const [viewOrderDialogOpen, setViewOrderDialogOpen] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState("")

  const isRepeatOrderStatus = form.watch("statusProduksi") === "REPEAT"
  const repeatOrderSpk = form.watch("repeatOrderSpk")
  const kategori = form.watch("kategori")
  const targetSelesai = form.watch("targetSelesai")
  
  console.log("Order Detail Section - Current values:", { 
    statusProduksi: isRepeatOrderStatus ? "REPEAT" : "NEW", 
    repeatOrderSpk, 
    kategori,
    targetSelesai
  });
  
  const handleFetchRepeatOrder = () => {
    if (!repeatOrderSpk) return
    handleFetchRepeatOrderInfo(repeatOrderSpk)
  }

  const onFetchRepeatOrder = async () => {
    if (!repeatOrderNumber) {
      toast.error("Please enter a repeat order number")
      return
    }

    try {
      await handleFetchRepeatOrderInfo(repeatOrderNumber)
    } catch (error) {
      console.error("Error fetching repeat order:", error)
    }
  }

  const handleSelectRepeatOrder = (order: RepeatOrder) => {
    setSelectedRepeatOrder?.(order)
    setOpenRepeatOrderDialog(false)
  }

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setViewOrderDialogOpen(true)
  }

  useEffect(() => {
    if (selectedRepeatOrder) {
      // Parse the details string to extract required information
      try {
        // If details contain JSON data or structured information,
        // you would parse it here to get productTypes, quantity, etc.
        // For now, we'll just set the SPK number to notes
        form.setValue("notes", `REPEAT SPK No. ${selectedRepeatOrder.spk}`);
      } catch (error) {
        console.error("Error parsing repeat order details:", error);
      }
    }
  }, [selectedRepeatOrder, form])

  return (
    <div className={cn("space-y-6", className)}>
      <div>
        <h3 className="text-lg font-medium">Order Details</h3>
        <p className="text-sm text-muted-foreground">
          Enter the details of the order.
        </p>
      </div>
      <Separator />

      {/* Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="statusProduksi"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Status*</FormLabel>
              <Select
                onValueChange={(value) => {
                  field.onChange(value)
                }}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status">
                      {field.value}
                    </SelectValue>
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="NEW">New Order</SelectItem>
                  <SelectItem value="REPEAT">Repeat Order</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Order Category */}
        <FormField
          control={form.control}
          name="kategori"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Order Category*</FormLabel>
              <Select
                onValueChange={field.onChange}
                value={field.value}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select category">
                      {field.value}
                    </SelectValue>
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
      </div>

      {/* Target Date */}
      <FormField
        control={form.control}
        name="targetSelesai"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Target Completion Date*</FormLabel>
            <FormControl>
              <Input
                type="date"
                value={field.value instanceof Date ? field.value.toISOString().slice(0, 10) : ""}
                onChange={(e) => field.onChange(new Date(e.target.value))}
              />
            </FormControl>
            <FormDescription>
              Set automatically based on category (excluding Sundays). You can adjust if needed.
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      {/* Show button to pick repeat orders when REPEAT is selected */}
      {isRepeatOrderStatus && (
        <div className="space-y-4">
          <Button
            type="button"
            className="w-full"
            onClick={() => setShowRepeatOrders(true)}
          >
            Pick Repeat Order
          </Button>

          {/* Repeat Order SPK Input and Fetch Button */}
          <div className="flex space-x-2">
            <FormField
              control={form.control}
              name="repeatOrderSpk"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Repeat Order SPK</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter SPK number" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button
              type="button"
              variant="outline"
              className="mt-8"
              onClick={handleFetchRepeatOrder}
              disabled={!repeatOrderSpk}
            >
              Fetch
            </Button>
          </div>
        </div>
      )}

      {/* Repeat Order Dialog using DialogModal */}
      <DialogModal 
        open={showRepeatOrders}
        onOpenChange={setShowRepeatOrders}
        title="Select Repeat Order"
        maxWidth="lg"
        maxHeight="80vh"
      >
        <div className="space-y-4">
          {repeatOrders.length > 0 ? (
            repeatOrders.map((order) => (
              <div key={order.spk} className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent">
                <div className="flex-1">
                  <h4 className="font-medium">SPK: {order.spk}</h4>
                  <p className="text-sm text-muted-foreground">
                    Order Date: {order.orderDate 
                      ? (() => {
                          try {
                            const date = new Date(order.orderDate);
                            return !isNaN(date.getTime()) 
                              ? format(date, "dd MMM yyyy") 
                              : "N/A";
                          } catch (e) {
                            return "N/A";
                          }
                        })() 
                      : "N/A"}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">{order.details}</p>
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewOrder(order.spk)}
                  >
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      handleFetchRepeatOrderInfo(order.spk);
                      setShowRepeatOrders(false);
                    }}
                  >
                    Choose
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No repeat orders found for this customer.
            </div>
          )}
        </div>
      </DialogModal>

      {/* Order View Dialog */}
      <DialogModal
        open={viewOrderDialogOpen}
        onOpenChange={setViewOrderDialogOpen}
        title={`Order Details - SPK: ${selectedOrderId}`}
        maxWidth="2xl"
        maxHeight="80vh"
      >
        <OrderViewDialog 
          open={viewOrderDialogOpen} 
          onOpenChange={setViewOrderDialogOpen}
          orderId={selectedOrderId}
        />
      </DialogModal>
    </div>
  )
} 