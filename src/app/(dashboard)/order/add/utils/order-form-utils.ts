import { OrderFormValues } from "@/models/order";
import { z } from "zod";
import { Order } from "@prisma/client";
import { UseFormReturn } from "react-hook-form";
import { format } from "date-fns";

export interface AdditionalCostItem {
  item: string;
  pricePerUnit: string;
  quantity: string;
  total: string;
}

/**
 * Converts yard measurements to meters
 * @param yards - Value in yards
 * @returns Value in meters
 */
export const yardToMeter = (yards: number): number => {
  return yards * 0.9144; // 1 yard = 0.9144 meters
};

/**
 * Converts meters to yards
 * @param meters - Value in meters
 * @returns Value in yards
 */
export const meterToYard = (meters: number): number => {
  return meters / 0.9144; // 1 meter = 1.0936 yards
};

/**
 * Formats product types for display or submission
 * Handling special case for DTF with pass options
 * @param productTypes - Object containing selected product types
 * @param dtfPass - The selected DTF pass option (if applicable)
 * @returns Formatted string of product types
 */
export const formatProductTypes = (
  productTypes: { [key: string]: boolean } | null | undefined,
  dtfPass?: string
): string => {
  if (!productTypes) {
    return "";
  }
  
  const selectedTypes = Object.entries(productTypes)
    .filter(([_, isSelected]) => isSelected)
    .map(([type]) => type);

  if (selectedTypes.length === 0) return "";

  // Check if only one product type is selected
  if (selectedTypes.length === 1) {
    // Handle DTF with pass info as a special case - don't add "ONLY"
    if (selectedTypes[0] === "DTF") {
      return dtfPass ? `DTF (${dtfPass})` : "DTF";
    }
    
    // For any other single product type, add "ONLY"
    return `${selectedTypes[0]} ONLY`;
  }

  // Add DTF pass information if DTF is selected
  if (productTypes.DTF && dtfPass) {
    return selectedTypes
      .map((type) => (type === "DTF" ? `DTF (${dtfPass})` : type))
      .join(", ");
  }

  return selectedTypes.join(", ");
};

/**
 * Updates the notes field with information about selected product types
 * @param currentNotes - The current notes string
 * @param productTypes - Object containing selected product types
 * @param dtfPass - The selected DTF pass option (if applicable)
 * @returns The updated notes string
 */
export const updateNotesWithProductTypes = (
  currentNotes: string = "",
  productTypes: { [key: string]: boolean } | null | undefined,
  dtfPass?: string
): string => {
  if (!productTypes) {
    return currentNotes;
  }
  
  // Format the product types
  const formattedProductTypes = formatProductTypes(productTypes, dtfPass);
  
  if (!formattedProductTypes) return currentNotes;

  // Remove any existing product type information
  let cleanedNotes = currentNotes.replace(/\[[^\]]+\]/g, "").trim();

  // Add the new product type information
  const newNotes = `${cleanedNotes ? cleanedNotes + "\n" : ""}[${formattedProductTypes}]`;
  
  return newNotes;
};

/**
 * Calculates the total price for an order
 * @param quantity - Order quantity
 * @param unitPrice - Price per unit
 * @param additionalCosts - Array of additional cost items
 * @param discountType - Type of discount
 * @param discountValue - Value of the discount
 * @param applyTax - Whether to apply tax
 * @param unit - Unit of measurement (meter or yard)
 * @returns The total price as a string
 */
export const calculateTotalPrice = (
  quantity: string,
  unitPrice: string,
  additionalCosts: Array<{
    item?: string;
    pricePerUnit?: string;
    unitQuantity?: string;
    total?: string;
  }> | null | undefined = [],
  discountType: string = "none",
  discountValue: string = "0",
  applyTax: boolean = false,
  unit: string = "meter"
): string => {
  // Convert quantity to meters if it's in yards
  let qtyNumber = parseFloat(quantity || "0");
  if (unit === "yard") {
    qtyNumber = yardToMeter(qtyNumber);
  }
  if (unit === "piece") {
    qtyNumber = parseFloat(quantity || "0");
  }
  
  const price = parseFloat(unitPrice || "0");
  
  // Base order cost (meter result * unit price)
  let subtotal = qtyNumber * price;
  
  // Add all additional costs
  // Ensure additionalCosts is an array before reducing
  const costsArray = Array.isArray(additionalCosts) ? additionalCosts : [];
  const additionalTotal = costsArray.reduce((sum, costItem) => {
    if (costItem.total && parseFloat(costItem.total) > 0) {
      return sum + parseFloat(costItem.total);
    } else if (
      costItem.pricePerUnit &&
      costItem.unitQuantity &&
      parseFloat(costItem.pricePerUnit) > 0 &&
      parseFloat(costItem.unitQuantity) > 0
    ) {
      const itemPrice = parseFloat(costItem.pricePerUnit);
      const itemQuantity = parseFloat(costItem.unitQuantity);
      return sum + (itemPrice * itemQuantity);
    }
    return sum;
  }, 0);
  
  subtotal += additionalTotal;
  
  // Apply discount if applicable
  const discountVal = parseFloat(discountValue || "0");
  
  subtotal = applyDiscount(subtotal, discountType, discountVal);
  
  // Apply tax if checked
  if (applyTax) {
    subtotal = subtotal * 1.11; // 11% tax
  }
  
  return Math.round(subtotal).toString();
};

/**
 * Calculates the total for an additional cost item
 * @param price - Price per unit
 * @param quantity - Quantity
 * @returns String representation of the total price, rounded to whole number
 */
export const calculateItemTotal = (price: number, quantity: number): string => {
  const total = price * quantity;
  return Math.round(total).toString(); // Remove decimals for visual simplicity
};

/**
 * Validates if an additional cost item has all required fields
 * @param item - The additional cost item to validate
 * @returns Boolean indicating if the item is valid
 */
export const isValidAdditionalCostItem = (item: {
  item?: string;
  pricePerUnit?: string;
  unitQuantity?: string;
  total?: string;
}): boolean => {
  return !!(
    item.item &&
    item.pricePerUnit &&
    parseFloat(item.pricePerUnit) > 0 &&
    item.unitQuantity &&
    parseFloat(item.unitQuantity) > 0
  );
};

/**
 * Applies a discount to a subtotal
 * @param subtotal - The original amount
 * @param discountType - Type of discount (none, fixed, percentage)
 * @param discountValue - Value of the discount
 * @returns The subtotal after discount is applied
 */
export const applyDiscount = (
  subtotal: number,
  discountType: string,
  discountValue: number
): number => {
  if (discountType === "fixed" && !isNaN(discountValue)) {
    return Math.max(0, subtotal - discountValue);
  }
  
  if (discountType === "percentage" && !isNaN(discountValue)) {
    const discountAmount = (subtotal * discountValue) / 100;
    return Math.max(0, subtotal - discountAmount);
  }
  
  return subtotal; // No discount or invalid values
};

/**
 * Formats a date for display
 * @param date - Date to format
 * @returns Formatted date string
 */
export const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function formatIdrCurrency(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

export function setInitialData(form: UseFormReturn<OrderFormValues>, data: Order): void {
  console.log("Setting initial data:", data)
  
  try {
    // Type cast to 'any' to bypass TypeScript checks
    const orderData = data as any;
    
    // Parse JSON fields if they exist
    const parsedImages = orderData.images ? JSON.parse(orderData.images as string) : []
    const parsedDesignImages = orderData.design_images ? JSON.parse(orderData.design_images as string) : []
    
    const mappedValues = {
      // Customer Information
      customerId: orderData.customerId ? orderData.customerId.toString() : "",
      companyName: orderData.company_name || "",
      contactName: orderData.contact_name || "",
      phoneNumber: orderData.phone_number || "",
      email: orderData.email || "",
      
      // Order Information
      productType: orderData.product_type || "",
      orderNumber: orderData.order_number || "",
      estOrder: orderData.est_order ? new Date(orderData.est_order) : undefined,
      
      // Fabric Information
      asalBahan: orderData.asal_bahan || "",
      namaBahan: orderData.nama_bahan || "",
      aplikasiProduk: orderData.aplikasi_produk || "",
      lebarKain: orderData.lebar_kain || "",
      fabricLength: orderData.jumlah_kain || "",
      
      // Paper Information
      namaPaper: orderData.nama_paper || "",
      lebarKertas: orderData.lebar_kertas || "",
      kuantitas: orderData.kuantitas ? orderData.kuantitas.toString() : "",
      satuan: orderData.satuan || "meter",
      
      // Print Information
      jumlahWarna: orderData.jumlah_warna ? orderData.jumlah_warna.toString() : "",
      repeatedPrint: orderData.repeated_print || "",
      tipeRibbon: orderData.tipe_ribbon || "",
      
      // Design Information
      isCanvasAvailable: orderData.is_canvas_available ? "yes" : "no",
      designImages: parsedDesignImages,
      designDetails: orderData.design_details || "",
      
      // Delivery Information
      deliveryAddress: orderData.delivery_address || "",
      isSuratJalan: orderData.is_surat_jalan ? "yes" : "no",
      deliveryNotes: orderData.delivery_notes || "",
      
      // Payment Information
      paymentTerm: orderData.payment_term || "",
      totalPrice: orderData.total_price ? orderData.total_price.toString() : "",
      
      // Additional Information
      externalJobId: orderData.external_job_id || "",
      additionalNotes: orderData.additional_notes || "",
      
      // Images
      images: parsedImages
    } as Partial<OrderFormValues>
    
    // Set form values
    Object.entries(mappedValues).forEach(([key, value]) => {
      if (value !== undefined) {
        form.setValue(key as keyof OrderFormValues, value)
      }
    })
    
    console.log("Form values set:", mappedValues)
  } catch (error) {
    console.error("Error setting initial data:", error)
  }
} 