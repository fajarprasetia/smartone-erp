export interface OrderFormValues {
  customerId: string;
  spk: string;
  jenisProduk: {
    PRINT: boolean;
    PRESS: boolean;
    CUTTING: boolean;
    DTF: boolean;
    SEWING: boolean;
  };
  dtfPass?: "4 PASS" | "6 PASS";
  jumlah: string;
  unit: "meter" | "yard";
  asalBahan: string;
  namaBahan: string;
  aplikasiProduk: string;
  gsmKertas?: string;
  lebarKertas?: string;
  fileWidth?: string;
  matchingColor?: string;
  statusProduksi: "NEW" | "REPEAT";
  kategori: string;
  targetSelesai?: Date;
  notes?: string;
  harga: string;
  discountType: "none" | "fixed" | "percentage";
  discountValue?: string;
  tax: boolean;
  taxPercentage?: string;
  totalPrice: string;
  additionalCosts?: string;
  fileDesain?: string;
  productTypes?: string;
  priority: boolean;
  marketing?: string;
} 