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
      
      // Map additional costs to specific fields expected by the API
      const additionalCostFields: Record<string, string | number> = {};
      validAdditionalCosts.forEach((cost, index) => {
        if (index === 0) {
          additionalCostFields.tambah_cutting = cost.description || "";
          additionalCostFields.satuan_cutting = cost.pricePerUnit || 0;
          additionalCostFields.qty_cutting = cost.unitQuantity || 0;
          additionalCostFields.total_cutting = cost.total || 0;
        } else if (index < 6) { // Up to 5 additional costs (1-5)
          additionalCostFields[`tambah_cutting${index}`] = cost.description || "";
          additionalCostFields[`satuan_cutting${index}`] = cost.pricePerUnit || 0;
          additionalCostFields[`qty_cutting${index}`] = cost.unitQuantity || 0;
          additionalCostFields[`total_cutting${index}`] = cost.total || 0;
        }
      });
      
      // Determine asalBahanId based on asalBahan value
      let asalBahanId: string | undefined = undefined;
      if (data.asalBahan === "SMARTONE") {
        asalBahanId = "22"; // Fixed ID for SMARTONE
        console.log("Setting asalBahanId to 22 for SMARTONE");
      } else if (data.asalBahan === "CUSTOMER") {
        asalBahanId = data.customerId; // Use customer's ID
        console.log(`Setting asalBahanId to customer ID: ${data.customerId}`);
      }
      
      // Add the SPK number to the form data
      const orderData = {
        customerId: data.customerId,
        spk: spkNumber,
        jenisProduk: data.jenisProduk,
        dtfPass: data.dtfPass,
        jumlah: data.jumlah, // Keep as string
        unit: data.unit,
        asalBahan: data.asalBahan,
        asalBahanId: asalBahanId, // Add asalBahanId
        namaBahan: data.namaBahan,
        aplikasiProduk: data.aplikasiProduk,
        fabricLength: data.fabricLength,
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
        harga: data.harga || "", // Keep as string
        harga_satuan: data.harga || "", // Add harga_satuan as string
        
        // Include discount data
        discountType: data.discountType,
        discountValue: data.discountValue || "", // Keep as string
        
        tax: data.tax,
        taxPercentage: data.taxPercentage || "", // Keep as string
        totalPrice: data.totalPrice || "", // Keep as string
        nominal: data.totalPrice || "", // Add nominal field as string
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
      if (data.unit === "piece" && !isNaN(parseFloat(data.jumlah))) {
        quantity = parseFloat(data.jumlah).toString()
      }
      
      // Convert additionalCostFields values to strings for database compatibility
      Object.keys(additionalCostFields).forEach(key => {
        if (typeof additionalCostFields[key] === 'number') {
          additionalCostFields[key] = String(additionalCostFields[key]);
        }
      });

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
          asalBahanId: asalBahanId, // Include asalBahanId explicitly
          namaBahan: data.namaBahan,
          fabricLength: data.fabricLength,
          tax: data.tax,
          taxPercentage: data.tax ? data.taxPercentage : null,
          totalPrice: data.totalPrice || "", // Ensure string
          nominal: data.totalPrice || "", // Ensure string
          // Instead of a JSON string for additional costs, include the individual fields
          ...additionalCostFields,
          // Use converted quantity if needed, but as string
          jumlah: quantity,
          // Include unit info
          unit: data.unit,
          // Status field for new orders
          status: "PENDING", 
          // Ensure dates are properly formatted for the API
          tanggal: new Date().toISOString(),
          targetSelesai: data.targetSelesai ? data.targetSelesai.toISOString() : null,
          est_order: data.targetSelesai ? data.targetSelesai.toISOString() : null, // Add est_order for consistency
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