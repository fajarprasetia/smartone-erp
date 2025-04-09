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
  tanggal?: Date | string | null;
  created_at?: Date | string | null;
  produk?: string | null;
  asal_bahan?: string | null;
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
  targetSelesai?: Date | string | null;
}

// Main component
export default function ViewOrderPage() {
  const router = useRouter();
  const params = useParams();
  const orderId = params?.id as string;
  
  const [order, setOrder] = useState<OrderWithCustomer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Only fetch when we have an orderId
    if (!orderId) return;
    
    const fetchOrder = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/orders/${orderId}`);
        
        if (!response.ok) {
          throw new Error("Failed to fetch order");
        }
        
        const data = await response.json();
        setOrder(data);
      } catch (err) {
        console.error("Error fetching order:", err);
        setError("Failed to load order details");
      } finally {
        setLoading(false);
      }
    };
    
    fetchOrder();
  }, [orderId]);

  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return "N/A";
    try {
      return format(new Date(dateString), "dd/MM/yyyy");
    } catch (error) {
      return "Invalid date";
    }
  };

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

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-lg">Loading order details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto py-8">
        <div className="mb-6 flex items-center">
          <Button variant="outline" onClick={() => router.back()} className="mr-2">
            <ArrowLeft className="h-4 w-4 mr-2" /> Back
          </Button>
        </div>
        <div className="bg-red-50 text-red-700 p-4 rounded-md">
          <p className="text-lg">{error || "Order not found"}</p>
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
        {/* Header */}
        <table className="w-full border-collapse border mb-4">
          <thead>
            <tr>
              <th colSpan={5} className="text-center border py-1.5 px-2 bg-muted/20">
                <h2 className="text-lg font-bold">Surat Perintah Kerja</h2>
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td rowSpan={3} className="text-center border p-1.5 w-[80px]">
                <div className="relative h-[70px] w-[70px] mx-auto">
                  <Image
                    src="/logo.png"
                    alt="SmartOne Logo"
                    width={70}
                    height={70}
                    style={{ objectFit: "contain" }}
                  />
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

        {/* Detail Order Section */}
        <h1 className="text-base font-bold mb-1.5">1. Detail Order</h1>
        <table className="w-full border-collapse border mb-4 table-fixed">
          <thead>
            <tr className="bg-muted/20">
              <th className="border p-1.5 text-center w-[30%] text-sm font-medium">KETERANGAN</th>
              <th className="border p-1.5 text-center w-[40%] text-sm font-medium">DESKRIPSI</th>
              <th className="border p-1.5 text-center w-[30%] text-sm font-medium">CATATAN</th>
            </tr>
          </thead>
          <tbody className="text-sm">
            <tr>
              <td className="border p-1.5">1. Asal Bahan</td>
              <td className="border p-1.5">{order.asal_bahan || "N/A"}</td>
              <td rowSpan={8} className="border p-1.5 align-top">
                {order.catatan_design ? (
                  <>
                    <span className="text-xs font-medium">Catatan Designer:</span>
                    <p className="text-sm font-bold text-red-600 mt-1">{order.catatan_design}</p>
                  </>
                ) : null}
              </td>
            </tr>
            <tr>
              <td className="border p-1.5">2. Nama Kain</td>
              <td className="border p-1.5">{order.nama_kain || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5">3. Jumlah Kain</td>
              <td className="border p-1.5">{order.jumlah_kain || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5">4. Lebar Kertas</td>
              <td className="border p-1.5">{order.lebar_kertas || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5">5. Aplikasi Produk</td>
              <td className="border p-1.5">{order.nama_produk || order.produk || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5">6. Quantity Produksi</td>
              <td className="border p-1.5">{order.qty || "N/A"}</td>
            </tr>
            <tr>
              <td className="border p-1.5">7. Panjang Layout</td>
              <td className="border p-1.5">
                {order.lebar_kertas && order.qty
                  ? `${order.lebar_kertas} X ${order.qty}`
                  : "N/A"}
              </td>
            </tr>
            <tr>
              <td className="border p-1.5">8. Nama File</td>
              <td className="border p-1.5">{order.path || "N/A"}</td>
            </tr>
          </tbody>
        </table>

        {/* Preview Project Section */}
        <h1 className="text-base font-bold mb-1.5">2. Preview Project</h1>
        <table className="w-full border-collapse border mb-4 table-fixed">
          <tbody className="text-sm">
            <tr>
              <td rowSpan={2} colSpan={3} className="border p-1.5 text-center">
                <p className="text-base font-medium">
                  {order.customer?.nama || "N/A"}
                </p>
              </td>
              <td className="border p-1.5 font-medium">Marketing</td>
            </tr>
            <tr>
              <td className="border p-1.5">
                {order.marketingInfo?.name || order.marketing || "N/A"}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="border p-1.5 text-center">
                <p className="text-base font-bold text-red-600">
                  {order.produk || "N/A"}
                </p>
                <p className="text-sm font-bold text-red-600 mt-0.5">
                  {order.kategori || "N/A"}
                </p>
                <div className="flex justify-center gap-3 my-3 flex-wrap">
                  {order.capture && (
                    <div className="relative h-[150px] w-[200px] flex-shrink-0">
                      <Image
                        src={`/uploads/${order.capture}`}
                        alt="Design preview"
                        width={200}
                        height={150}
                        style={{ objectFit: "contain" }}
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
                        style={{ objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>
              </td>
              <td className="border p-1.5">
                <table className="w-full border-collapse text-xs">
                  <tbody>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Lebar Kertas</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.lebar_kertas || ""}
                          disabled
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Gramasi Kertas</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.gramasi || ""}
                          disabled
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Lebar Kain</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.lebar_kain || ""}
                          disabled
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Lebar File</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.lebar_file || ""}
                          disabled
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Warna Acuan</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.warna_acuan || ""}
                          disabled
                        />
                      </td>
                    </tr>
                    <tr>
                      <td className="pr-1 py-0.5 font-medium">Status Produksi</td>
                      <td>
                        <input
                          type="text"
                          className="border border-green-500 p-0.5 w-full text-xs"
                          value={order.statusprod || order.status || ""}
                          disabled
                        />
                      </td>
                    </tr>
                  </tbody>
                </table>
                <div className="mt-2">
                  <p className="text-xs font-medium">Catatan:</p>
                  <p className="text-sm font-medium text-red-600 break-words mt-0.5">
                    {order.catatan || "N/A"}
                  </p>
                </div>
              </td>
            </tr>
            <tr className="text-center text-xs">
              <td className="border p-1 w-[25%]">
                <span className="font-medium">Created by</span><br />
                {order.createdBy?.name || "N/A"}
              </td>
              <td className="border p-1 w-[25%]">
                <span className="font-medium">Designed by</span><br />
                {"N/A"} {/* This field might not be available in your data */}
              </td>
              <td className="border p-1 w-[25%]">
                <span className="font-medium">Operation Approval by</span><br />
                {"N/A"} {/* This field might not be available in your data */}
              </td>
              <td className="border p-1 w-[25%]">
                <span className="font-medium">Approved by</span><br />
                {"N/A"} {/* This field might not be available in your data */}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Footer */}
        <p className="text-center text-xs mt-4 print:mt-2">
          smartone.id
        </p>
      </div>

      {/* Add styles for printing */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4;
            margin: 10mm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          html, body {
            height: 100%;
            overflow: visible !important;
            font-size: 11pt;
          }
          .print\\:a4 {
            width: 210mm;
            min-height: 297mm;
            padding: 10mm !important;
            margin: 0 auto !important;
            background: white !important;
          }
          /* Hide unnecessary elements */
          header, footer, nav, aside, .print\\:hidden {
            display: none !important;
          }
          /* Ensure table fits the page */
          table {
            page-break-inside: auto;
            font-size: 10pt;
          }
          tr {
            page-break-inside: avoid;
            page-break-after: auto;
          }
          td {
            page-break-inside: avoid;
          }
          thead {
            display: table-header-group;
          }
          tfoot {
            display: table-footer-group;
          }
          input {
            font-size: 9pt !important;
          }
          h1, h2 {
            font-size: 12pt !important;
          }
        }
        
        /* Add styles for better scrolling */
        .overflow-auto {
          -webkit-overflow-scrolling: touch;
        }
        
        /* Ensure tables don't overflow horizontally on smaller screens */
        @media (max-width: 768px) {
          table {
            overflow-x: auto;
            display: block;
            max-width: 100%;
          }
        }
      `}</style>
    </div>
  );
} 