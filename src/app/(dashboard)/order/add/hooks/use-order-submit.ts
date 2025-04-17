import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { OrderFormValues } from "../schemas/order-form-schema"
import { yardToMeter, formatProductTypes, calculateItemTotal } from "../utils/order-form-utils"

interface UseOrderSubmitProps {
  setIsSubmitting: (value: boolean) => void
  spkNumber: string
}

export function useOrderSubmit({ setIsSubmitting, spkNumber }: UseOrderSubmitProps) {
  const router = useRouter()

  const onSubmit = async (data: OrderFormValues) => {
    try {
      setIsSubmitting(true)
      
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
        }))
      
      // Add the SPK number to the form data
      const orderData = {
        customerId: data.customerId,
        spk: spkNumber,
        jenisProduk: data.jenisProduk,
        dtfPass: data.dtfPass,
        jumlah: parseFloat(data.jumlah || "0"),
        unit: data.unit,
        asalBahan: data.asalBahan,
        namaBahan: data.namaBahan,
        aplikasiProduk: data.aplikasiProduk,
        gsmKertas: data.gsmKertas,
        lebarKertas: data.lebarKertas,
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
      }

      console.log("Submitting form data:", orderData)

      // Convert jenisProduk object to string format for API
      const jenisProdukString = formatProductTypes(data.jenisProduk, data.dtfPass)
      
      // Convert yard to meter if unit is yard
      let quantity = data.jumlah
      if (data.unit === "yard" && !isNaN(parseFloat(data.jumlah))) {
        quantity = yardToMeter(parseFloat(data.jumlah)).toFixed(2)
      }
      
      // Process additional costs to store as JSON string
      const processedAdditionalCosts = data.additionalCosts?.filter(
        cost => cost.item && cost.pricePerUnit && cost.unitQuantity && cost.total
      )
      
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

  return { onSubmit }
} 