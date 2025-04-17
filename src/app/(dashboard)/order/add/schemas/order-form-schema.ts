import { z } from "zod"

// Define the order form schema
export const orderFormSchema = z.object({
  customerId: z.string().min(1, {
    message: "Please select a customer",
  }),
  spk: z.string(),
  jenisProduk: z.object({
    PRINT: z.boolean().default(false),
    PRESS: z.boolean().default(false),
    CUTTING: z.boolean().default(false),
    DTF: z.boolean().default(false),
    SEWING: z.boolean().default(false),
  }).default({
    PRINT: false,
    PRESS: false,
    CUTTING: false,
    DTF: false,
    SEWING: false,
  }),
  tipe_produk: z.string().default("SUBLIM"),
  dtfPass: z.enum(["4 PASS", "6 PASS"]).optional(),
  jumlah: z.string(),
  unit: z.enum(["meter", "yard"]),
  asalBahan: z.string().min(1, {
    message: "Please select fabric origin",
  }),
  asalBahanId: z.string().optional(),
  statusProduksi: z.enum(["NEW", "REPEAT"]),
  kategori: z.enum(["REGULAR ORDER", "ONE DAY SERVICE", "PROJECT"]),
  targetSelesai: z.union([z.date(), z.string().transform(val => new Date(val))]),
  namaBahan: z.string().optional(),
  aplikasiProduk: z.string().optional(),
  gsmKertas: z.string().optional(),
  lebarKertas: z.string().optional(),
  fileWidth: z.string().optional(),
  matchingColor: z.enum(["YES", "NO"]).default("NO"),
  notes: z.string().optional(),
  harga: z.string().min(1, { message: "Price is required" }),
  discountType: z.enum(["none", "fixed", "percentage"]).default("none"),
  discountValue: z.string().default(""),
  tax: z.boolean().default(false),
  taxPercentage: z.string().optional(),
  totalPrice: z.string().optional(),
  fileDesain: z.string().optional(),
  marketing: z.string().optional(),
  repeatOrderSpk: z.string().optional(),
  additionalCosts: z.array(
    z.object({
      item: z.string().optional(),
      pricePerUnit: z.string().optional(),
      unitQuantity: z.string().optional(),
      total: z.string().optional(),
    })
  ).default([]),
  priority: z.boolean().default(false),
})

// Define form values type
export type OrderFormValues = z.infer<typeof orderFormSchema>

// Define default values for the form
export const defaultValues: OrderFormValues = {
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
  tipe_produk: "SUBLIM",
  jumlah: "",
  unit: "meter",
  asalBahan: "",
  asalBahanId: "",
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
  repeatOrderSpk: "",
  additionalCosts: []
}

// Utility interfaces used in the form
export interface Customer {
  id: string
  nama: string
  telp: string | null
}

export interface FabricInfo {
  id: string
  name: string
  description?: string
  composition?: string
  weight?: string
  width?: string
  remainingLength?: number
  length?: string
}

export interface PaperStock {
  id: string
  paper_code: string
  gsm: string
  width: string
  remaining_length: number
  unit_price: number
  supplier: string
  created_at: string
  updated_at: string
}

export interface RepeatOrder {
  spk: string
  orderDate: string
  details: string
}

export interface PaperGSM {
  gsm: number
  remainingLength: number
}

export interface MarketingUser {
  id: string
  name: string
  email: string
} 