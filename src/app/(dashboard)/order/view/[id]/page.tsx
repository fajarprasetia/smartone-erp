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
  targetSelesai?: Date | string | null;
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
  keterangan?: string | null;
  prioritas?: string | null;
  tipe_produk?: string | null;
  harga_satuan?: string | number | null;
  diskon?: string | number | null;
  nominal?: string | number | null;
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
        setError(null);
        
        console.log(`Attempting to fetch order with ID: ${orderId}`);
        
        // Check if the ID is in the format of a UUID, numeric ID, or SPK
        // UUID pattern: 8-4-4-4-12 characters separated by hyphens
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(orderId);
        // Check if it's a pure numeric ID
        const isNumericId = /^\d+$/.test(orderId) && orderId.length <= 6; // Typical database IDs are shorter
        
        let response;
        let failedAttempts = [];
        
        // Try multiple approaches to fetch the order
        
        // Attempt 1: Direct order ID endpoint
        try {
          console.log(`Attempt 1: Fetching by direct ID: ${orderId}`);
          const directResponse = await fetch(`/api/orders/${orderId}`);
          
          if (directResponse.ok) {
            console.log('Direct ID fetch successful');
            response = directResponse;
          } else {
            const errorText = await directResponse.text();
            failedAttempts.push({method: 'direct ID', status: directResponse.status, error: errorText});
            console.log(`Direct ID fetch failed: ${directResponse.status}`, errorText);
          }
        } catch (err) {
          failedAttempts.push({method: 'direct ID', error: String(err)});
          console.error('Error in direct ID fetch:', err);
        }
        
        // Attempt 2: Numeric ID endpoint (if numeric and first attempt failed)
        if (!response && isNumericId) {
          try {
            console.log(`Attempt 2: Fetching as numeric ID: ${orderId}`);
            const numericResponse = await fetch(`/api/orders/id?id=${encodeURIComponent(orderId)}`);
            
            console.log('Numeric ID fetch response status:', numericResponse.status);
            const responseText = await numericResponse.text();
            console.log('Numeric ID fetch response text:', responseText);
            
            // We need to re-parse the text since we read it
            if (numericResponse.ok) {
              console.log('Numeric ID fetch successful');
              try {
                const responseData = JSON.parse(responseText);
                setOrder(responseData);
                return; // Exit early since we've set the order
              } catch (parseError) {
                console.error('Error parsing numeric ID response:', parseError);
                failedAttempts.push({method: 'numeric ID parse', error: String(parseError)});
              }
            } else {
              failedAttempts.push({method: 'numeric ID', status: numericResponse.status, error: responseText});
              console.log(`Numeric ID fetch failed: ${numericResponse.status}`, responseText);
            }
          } catch (err) {
            failedAttempts.push({method: 'numeric ID', error: String(err)});
            console.error('Error in numeric ID fetch:', err);
          }
        }
        
        // Attempt 3: SPK endpoint (if first two attempts failed)
        if (!response) {
          try {
            console.log(`Attempt 3: Fetching by SPK: ${orderId}`);
            const spkResponse = await fetch(`/api/orders/spk?spk=${encodeURIComponent(orderId)}`);
            
            console.log('SPK fetch response status:', spkResponse.status);
            const responseText = await spkResponse.text();
            console.log('SPK fetch response text:', responseText);
            
            // We need to re-parse the text since we read it
            if (spkResponse.ok) {
              console.log('SPK fetch successful');
              try {
                const responseData = JSON.parse(responseText);
                setOrder(responseData);
                return; // Exit early since we've set the order
              } catch (parseError) {
                console.error('Error parsing SPK response:', parseError);
                failedAttempts.push({method: 'SPK parse', error: String(parseError)});
              }
            } else {
              failedAttempts.push({method: 'SPK', status: spkResponse.status, error: responseText});
              console.log(`SPK fetch failed: ${spkResponse.status}`, responseText);
            }
          } catch (err) {
            failedAttempts.push({method: 'SPK', error: String(err)});
            console.error('Error in SPK fetch:', err);
          }
        }
        
        // If we got a response from the first attempt, process it
        if (response) {
          try {
            const data = await response.json();
            console.log("Successfully fetched order data");
            setOrder(data);
          } catch (parseError) {
            console.error("Error parsing response:", parseError);
            setError(`Error parsing response: ${parseError instanceof Error ? parseError.message : String(parseError)}`);
          }
        } else {
          // If all attempts failed, throw a comprehensive error
          console.error('All fetch attempts failed:', failedAttempts);
          throw new Error(`Failed to fetch order after multiple attempts. Details: ${JSON.stringify(failedAttempts)}`);
        }
      } catch (err) {
        console.error("Error fetching order:", err);
        setError(err instanceof Error ? err.message : "Failed to load order details");
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
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-4xl mx-auto mt-8">
        {/* Header with back button */}
        <div className="flex justify-between items-center mb-6">
          <Button
            onClick={() => router.back()}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          {order && !loading && !error && (
            <Button
              onClick={handlePrint}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <Printer className="w-4 h-4" />
              Print
            </Button>
          )}
        </div>

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mb-4"></div>
            <p className="text-lg font-medium">Loading Order...</p>
          </div>
        )}

        {/* Error state */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
            <h2 className="text-red-600 text-xl font-semibold mb-4">Error Loading Order</h2>
            <p className="text-gray-700 mb-4">
              We couldn't load the order you're looking for. Please check if the order ID is correct.
            </p>
            <div className="mt-4 text-sm text-red-800 p-3 bg-red-100 rounded">
              <p>{error}</p>
            </div>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => router.push('/order')} variant="default">
                Return to Orders
              </Button>
            </div>
          </div>
        )}

        {/* When there's no order but also no error - likely means the order was not found */}
        {!loading && !error && !order && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-6">
            <h2 className="text-yellow-600 text-xl font-semibold mb-4">Order Not Found</h2>
            <p className="text-gray-700 mb-4">
              We couldn't find an order with ID: <span className="font-mono bg-gray-100 p-1 rounded">{orderId}</span>
            </p>
            <p className="text-gray-700 mb-4">
              The order may have been deleted or you might have entered an incorrect ID.
            </p>
            <div className="flex gap-3 mt-6">
              <Button onClick={() => router.back()} variant="outline">
                Go Back
              </Button>
              <Button onClick={() => router.push('/order')} variant="default">
                Return to Orders
              </Button>
            </div>
          </div>
        )}

        {/* Order details content - only shown when there's an order and no loading/error */}
        {order && !loading && !error && (
          <div className="print:mt-0" id="printable-content">
            {/* Order header */}
            <div className="mb-8 print:mb-6">
              <h1 className="text-2xl font-bold mb-2 print:text-xl">
                {order.spk ? `Order: ${order.spk}` : `Order #${order.id}`}
              </h1>
              <div className="text-sm text-gray-500 print:text-xs">
                {order.no_project && (
                  <span className="mr-4">Project: {order.no_project}</span>
                )}
                <span className="mr-4">
                  Date: {formatDate(order.tanggal || order.created_at)}
                </span>
                {order.est_order && (
                  <span>Target: {formatDate(order.est_order)}</span>
                )}
              </div>
            </div>

            {/* Order information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 print:gap-4 mb-8 print:text-sm">
              {/* Customer and Marketing */}
              <div className="space-y-4 print:space-y-2">
                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Customer</h2>
                  <p>{order.customer?.nama || 'N/A'}</p>
                  {order.customer?.telp && <p className="text-gray-600">{order.customer.telp}</p>}
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Marketing</h2>
                  <p>{order.marketingInfo?.name || order.marketing || 'N/A'}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Category</h2>
                  <p>{order.kategori || 'N/A'}</p>
                </div>
              </div>

              {/* Statuses */}
              <div className="space-y-4 print:space-y-2">
                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Status</h2>
                  <div className="flex flex-wrap gap-2">
                    {order.status && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-sm">
                        {order.status}
                      </span>
                    )}
                    {order.statusm && (
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm">
                        {order.statusm}
                      </span>
                    )}
                    {order.statusprod && (
                      <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-sm">
                        {order.statusprod}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Invoice Status</h2>
                  <p>{order.keterangan || 'N/A'}</p>
                </div>

                <div>
                  <h2 className="text-lg font-semibold mb-2 print:text-base">Priority</h2>
                  <p>{order.prioritas === 'YES' ? '⭐ High Priority' : 'Standard'}</p>
                </div>
              </div>
            </div>

            {/* Product Information */}
            <div className="mb-8 print:mb-4">
              <h2 className="text-lg font-semibold mb-4 print:text-base border-b pb-2">
                Product Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 print:text-sm">
                <div>
                  <p className="mb-2"><strong>Product Type:</strong> {order.produk || 'N/A'}</p>
                  {order.tipe_produk && (
                    <p className="mb-2"><strong>Specific Type:</strong> {order.tipe_produk}</p>
                  )}
                  <p className="mb-2"><strong>Application:</strong> {order.nama_produk || 'N/A'}</p>
                  <p className="mb-2"><strong>Fabric Origin:</strong> {
                    order.asal_bahan_rel ? order.asal_bahan_rel.nama : 
                    (order.asal_bahan || 'N/A')
                  }</p>
                  <p className="mb-2"><strong>Fabric Name:</strong> {order.nama_kain || 'N/A'}</p>
                </div>
                <div>
                  <p className="mb-2"><strong>Quantity:</strong> {order.qty || 'N/A'}</p>
                  <p className="mb-2"><strong>GSM:</strong> {order.gramasi || 'N/A'}</p>
                  <p className="mb-2"><strong>Paper Width:</strong> {order.lebar_kertas || 'N/A'}</p>
                  <p className="mb-2"><strong>File Width:</strong> {order.lebar_file || 'N/A'}</p>
                  <p className="mb-2"><strong>Color Matching:</strong> {order.warna_acuan || 'N/A'}</p>
                </div>
              </div>
            </div>

            {/* Design File */}
            {order.path && (
              <div className="mb-8 print:mb-4">
                <h2 className="text-lg font-semibold mb-4 print:text-base border-b pb-2">
                  Design File
                </h2>
                <div className="max-w-sm print:max-w-xs">
                  <Image
                    src={order.path}
                    alt="Design Preview"
                    width={300}
                    height={200}
                    className="object-contain rounded-lg border border-gray-200"
                  />
                </div>
              </div>
            )}

            {/* Pricing Information */}
            <div className="mb-8 print:mb-4">
              <h2 className="text-lg font-semibold mb-4 print:text-base border-b pb-2">
                Pricing Information
              </h2>
              <div className="space-y-2 print:text-sm">
                <p><strong>Unit Price:</strong> {order.harga_satuan ? `Rp ${order.harga_satuan}` : 'N/A'}</p>
                {order.diskon && order.diskon !== "0" && (
                  <p><strong>Discount:</strong> {order.diskon}</p>
                )}
                <p className="text-lg font-semibold">
                  <strong>Total Price:</strong> {order.nominal ? `Rp ${order.nominal}` : 'N/A'}
                </p>
              </div>
            </div>

            {/* Notes */}
            {order.catatan && (
              <div className="mb-8 print:mb-4">
                <h2 className="text-lg font-semibold mb-4 print:text-base border-b pb-2">
                  Notes
                </h2>
                <div className="p-4 bg-gray-50 rounded-lg print:bg-gray-100 print:text-sm">
                  <p>{order.catatan}</p>
                </div>
              </div>
            )}

            {/* Design Notes */}
            {order.catatan_design && (
              <div className="mb-8 print:mb-4">
                <h2 className="text-lg font-semibold mb-4 print:text-base border-b pb-2">
                  Design Notes
                </h2>
                <div className="p-4 bg-gray-50 rounded-lg print:bg-gray-100 print:text-sm">
                  <p>{order.catatan_design}</p>
                </div>
              </div>
            )}

            {/* Created By */}
            <div className="text-sm text-gray-500 mt-8 print:mt-4 print:text-xs">
              <p>Created by: {order.createdBy?.name || 'Unknown'}</p>
            </div>
          </div>
        )}
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