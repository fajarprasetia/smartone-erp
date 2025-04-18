"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Image from "next/image";
import { format } from "date-fns";
import { ArrowLeft, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

// Define the OrderWithCustomer interface
interface OrderWithCustomer {
  id: string;
  spk?: string | null;
  no_project?: string | null;
  created_at?: Date | string | null;
  produk?: string | null;
  asal_bahan?: string | null;
  asal_bahan_id?: number | bigint | null;
  asal_bahan_rel?: {
    id: number | bigint;
    nama: string;
    telp?: string | null;
  } | null;
  nama_kain?: string | null;
  jumlah_kain?: string | null;
  lebar_kertas?: string | null;
  nama_produk?: string | null;
  qty?: number | null;
  catatan?: string | null;
  catatan_design?: string | null;
  status?: string | null;
  statusm?: string | null;
  gramasi?: string | null;
  lebar_kain?: string | null;
  lebar_file?: string | null;
  warna_acuan?: string | null;
  statusprod?: string | null;
  path?: string | null;
  kategori?: string | null;
  invoice?: string | null;
  est_order?: Date | string | null;
  marketing?: string | null;
  marketingInfo?: {
    name: string;
  } | null;
  capture?: string | null;
  capture_name?: string | null;
  createdBy?: {
    id: string;
    name: string;
  } | null;
  customer?: {
    id: string | number;
    nama: string;
    telp?: string | null;
  } | null;
  user_id?: { 
    name: string;
  } | null;
  designer_id?: {
    name: string;
  } | null;
  opr_id?: {
    name: string;
  } | null;
  manager_id?: {
    name: string;
  } | null;
  prioritas?: string | null;
}

// Main component
export default function ViewOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<OrderWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
    
  const handlePrint = () => {
    // Set specific print settings
    const originalTitle = document.title;
    document.title = `Order ${order?.spk || orderId} - Print`;
    
    // Apply A4 print-specific styles before printing
    const style = document.createElement('style');
    style.innerHTML = `
      @page {
        size: A4;
        margin: 10mm;
      }
      @media print {
        body * {
          visibility: hidden;
        }
        .print-container, .print-container * {
          visibility: visible;
        }
        .print-container {
          width: 100% !important;
          padding: 0 !important;
          position: absolute;
          left: 0;
          top: 0;
          width: 210mm;
          height: 297mm;
          padding: 10mm;
          margin: 0;
          background: white;
        }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger print
    window.print();
    
    // Clean up
    document.head.removeChild(style);
    document.title = originalTitle;
  };

  // Format date values
  const formatDate = (date: Date | string | null | undefined) => {
    if (!date) return "-";
    
    try {
      // Handle various date formats
      if (typeof date === 'string') {
        // Check if it's an ISO string or other format
        if (date === 'Invalid Date' || date === 'null') return "-";
        
        // Try to create a valid date from string
        const parsedDate = new Date(date);
        if (isNaN(parsedDate.getTime())) return "-";
        
        return format(parsedDate, 'dd/MM/yyyy');
      } 
      
      // If it's already a Date object
      if (date instanceof Date) {
        if (isNaN(date.getTime())) return "-";
        return format(date, 'dd/MM/yyyy');
      }
      
      return "-";
    } catch (error) {
      console.error("Date formatting error:", error);
      return "-";
    }
  };

  useEffect(() => {
    // Fetch order data
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch order: ${response.statusText}`);
        }
        
        const data = await response.json();
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
        setLoading(false);
      }
    };
    
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-blue-700 mb-4">Loading Order...</h2>
            <p className="text-gray-700 mb-6">
              Please wait while we fetch the order details.
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
              <div className="bg-blue-600 h-2.5 rounded-full w-full animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  if (!order && !error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-amber-700 mb-4">Order Not Found</h2>
            <p className="text-gray-700 mb-6">
              We couldn't find the order with ID: {orderId}
            </p>
            <p className="text-gray-600 mb-6">
              The order may have been deleted or you might not have permission to view it.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/order")}>
                Return to Orders List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex flex-col items-center">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold text-red-700 mb-4">Error Loading Order</h2>
            <p className="text-gray-700 mb-6">{error}</p>
            <p className="text-gray-600 mb-6">
              The order may have been deleted or you might not have permission to view it. 
              Please check the order ID and try again.
            </p>
            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => router.back()}
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Go Back
              </Button>
              <Button onClick={() => router.push("/order")}>
                Return to Orders List
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4 overflow-y-auto flex flex-col h-full">
      <div className="print:hidden mb-4 flex justify-between items-center">
        <Button variant="outline" onClick={() => router.back()}>
          <ArrowLeft className="h-3.5 w-3.5 mr-1.5" /> Back to Orders
        </Button>
        <Button onClick={handlePrint} className="print-button">
          <Printer className="h-3.5 w-3.5 mr-1.5" /> Print to A4
        </Button>
      </div>

      {/* SPK Document - styled to match the PHP template */}
      <div className="bg-white p-4 rounded-md shadow-sm border print:shadow-none print:border-0 print:p-0 print:a4 print-container overflow-auto">
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
        <td className="border p-1.5 text-sm">{order?.invoice || "-"}</td>
        <td className="border p-1.5 text-sm font-medium">No Project</td>
        <td className="border p-1.5 text-sm">{order?.no_project || "-"}</td>
      </tr>
      <tr>
        <td className="border p-1.5 text-sm font-medium">Revisi</td>
        <td className="border p-1.5 text-sm"></td>
        <td className="border p-1.5 text-sm font-medium">No. SPK</td>
        <td className="border p-1.5 text-sm">{order?.spk || "-"}</td>
      </tr>
      <tr>
        <td className="border p-1.5 text-sm font-medium">Estimasi</td>
        <td className="border p-1.5 text-sm">{formatDate(order?.est_order)}</td>
        <td className="border p-1.5 text-sm font-medium">Tanggal</td>
        <td className="border p-1.5 text-sm">{formatDate(order?.created_at)}</td>
      </tr>
    </tbody>
  </table>

  {/* 2. Detail Order Table */}
  <h1 className="text-base font-bold mb-1.5">1. Detail Order</h1>
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
      <tr><td className="border p-1.5">1. Asal Bahan</td><td className="border p-1.5">{order?.asal_bahan_rel?.nama || order?.asal_bahan || "-"}</td><td rowSpan={8} className="border p-1.5 align-top">
        {order?.catatan_design && (
          <>
            <span className="text-xs font-medium">Catatan Designer:</span>
            <p className="text-sm font-bold text-red-600 mt-1">{order?.catatan_design}</p>
          </>
        )}
      </td></tr>
      <tr><td className="border p-1.5">2. Nama Kain</td><td className="border p-1.5">{order?.nama_kain || "-"}</td></tr>
      <tr><td className="border p-1.5">3. Jumlah Kain</td><td className="border p-1.5">{order?.jumlah_kain || "-"}</td></tr>
      <tr><td className="border p-1.5">4. Lebar Kertas</td><td className="border p-1.5">{order?.lebar_kertas || "-"}</td></tr>
      <tr><td className="border p-1.5">5. Aplikasi Produk</td><td className="border p-1.5">{order?.nama_produk || order?.produk || "-"}</td></tr>
      <tr><td className="border p-1.5">6. Quantity Produksi</td><td className="border p-1.5">{order?.qty || "-"}</td></tr>
      <tr><td className="border p-1.5">7. Panjang Layout</td><td className="border p-1.5">
        {order?.lebar_file && order?.qty ? `${order?.lebar_file} X ${order?.qty}` : "-"}
      </td></tr>
      <tr><td className="border p-1.5">8. Nama File</td><td className="border p-1.5">{order?.path || "-"}</td></tr>
    </tbody>
  </table>

  {/* 3. Preview Project Table */}
<h1 className="text-base font-bold mb-1.5">2. Preview Project</h1>
<table className="w-full border-collapse border mb-4 preview-project-table">
  <colgroup>
    <col className="w-[70%]" />
    <col className="w-[30%]" />
  </colgroup>
  <tbody className="text-sm">
    <tr>
      <td rowSpan={2} className="border p-1.5 text-center">
        <p className="text-base font-medium">{order?.customer?.nama || "-"}</p>
        <p className="text-base font-bold text-red-600">
          {order?.prioritas === "YES" ? "PRIORITAS" : ""}
        </p>
      </td>
      <td className="border p-1.5 font-medium">Marketing</td>
    </tr>
    <tr>
      <td className="border p-1.5">{order?.marketingInfo?.name || order?.marketing || "-"}</td>
    </tr>
    <tr>
      <td className="border p-1.5 text-center align-middle">
        <div className="min-h-[220px] flex flex-col justify-center items-center">
          <p className="text-base font-bold text-red-600">{order?.produk || "-"}</p>
          <p className="text-sm font-bold text-red-600 mt-0.5">{order?.kategori || "-"}</p>
          <div className="flex justify-center gap-3 mt-3 flex-wrap">
            {order?.capture && (
              <div className="relative h-[150px] w-[200px] flex-shrink-0">
                <Image
                  src={`/uploads/${order?.capture}`}
                  alt="Design preview"
                  width={200}
                  height={150}
                  style={{ objectFit: "contain" }}
                />
              </div>
            )}
            {order?.capture_name && (
              <div className="relative h-[100px] w-[240px] flex-shrink-0">
                <Image
                  src={`/uploads/${order?.capture_name}`}
                  alt="Name preview"
                  width={240}
                  height={100}
                  style={{ objectFit: "contain" }}
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
            <tr><td className="pr-1 py-0.5">Lebar Kertas</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.lebar_kertas || ""} disabled /></td></tr>
            <tr><td className="pr-1 py-0.5">Gramasi Kertas</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.gramasi || ""} disabled /></td></tr>
            <tr><td className="pr-1 py-0.5">Lebar Kain</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.lebar_kain || ""} disabled /></td></tr>
            <tr><td className="pr-1 py-0.5">Lebar File</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.lebar_file || ""} disabled /></td></tr>
            <tr><td className="pr-1 py-0.5">Warna Acuan</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.warna_acuan === "YES" ? "ADA" : "TIDAK ADA"} disabled /></td></tr>
            <tr><td className="pr-1 py-0.5">Status Produksi</td><td><input className="border border-green-500 p-0.5 w-full text-xs truncate" value={order?.statusprod || order?.status || ""} disabled /></td></tr>
          </tbody>
        </table>
        <div className="mt-2">
          <p className="text-xs font-medium">Catatan:</p>
          <p className="text-sm font-medium text-red-600 break-words mt-0.5">{order?.catatan || ""}</p>
        </div>
      </td>
    </tr>
  </tbody>
</table>


  {/* 3. Approvals */}
  <h1 className="text-base font-bold mb-1.5 mt-4">3. Approval</h1>
  <table className="w-full approval-table border-collapse border mb-4">
  <thead>
    <tr className="bg-green-100 text-green-700 text-xs text-center">
      <th className="border p-1">Created by</th>
      <th className="border p-1">Designed by</th>
      <th className="border p-1">Operation Approval by</th>
      <th className="border p-1">Approved by</th>
    </tr>
  </thead>
  <tbody>
    <tr className="text-center h-10 align-center">
      <td className="border p-1 text-[10px]">{order?.user_id?.name}</td>
      <td className="border p-1 text-[10px]">{order?.designer_id?.name}</td>
      <td className="border p-1 text-[10px]">{order?.opr_id?.name}</td>
      <td className="border p-1 text-[10px]">{order?.manager_id?.name}</td>
    </tr>
  </tbody>
</table>

  {/* Footer */}
  <p className="text-center text-xs mt-4 print:mt-2">smartone.id</p>
</div>


      {/* Add styles for printing */}
      <style jsx global>{`
        @media print {
  @page {
    size: A4 portrait;
    margin: 10mm;
  }

  html, body {
    width: 210mm;
    height: 297mm;
    margin: 0 auto !important;
    padding: 0;
    overflow: hidden !important;
    background: white !important;
    font-size: 10pt;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }

  .print\\:a4 {
    width: 100% !important;
    height: auto;
    padding: 0;
    margin: 0;
    background: white !important;
    scale: 0.98; /* Scale to prevent overflow */
    transform-origin: top left;
  }

  /* Ensure all tables fit and don't break */
  table {
    width: 100% !important;
    page-break-inside: auto;
    font-size: 10pt;
    table-layout: fixed;
  }

  thead {
    display: table-header-group;
  }

  tfoot {
    display: table-footer-group;
  }

  tr, td, th {
    page-break-inside: avoid;
  }

  input {
    font-size: 9pt !important;
  }

  h1, h2 {
    font-size: 11pt !important;
  }

  /* Approval Table Full Width Fix */
  .approval-table {
    width: 100% !important;
    table-layout: fixed !important;
  }

  .approval-table th,
  .approval-table td {
    width: 25% !important;
  }

  /* Hide UI-only elements */
  header, footer, nav, aside, .print\\:hidden {
    display: none !important;
  }
}

      `}</style>
    </div>
  );
}