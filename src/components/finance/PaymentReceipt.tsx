import React, { useRef } from 'react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';

interface PaymentReceiptProps {
  transaction: any;
  onClose: () => void;
}

export function PaymentReceipt({ transaction, onClose }: PaymentReceiptProps) {
  const printRef = useRef<HTMLDivElement>(null);
  
  // Format currency to IDR
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value).replace('Rp', 'Rp.');
  };
  
  // Format number with thousand separator
  const formatNumber = (num: number): string => {
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };
  
  // Format date 
  const formatDate = (date: string | Date | null | undefined): string => {
    if (!date) return '-';
    return format(new Date(date), 'dd/MM/yyyy');
  };
  
  // Handle print functionality
  const handlePrint = () => {
    const content = printRef.current;
    const originalContents = document.body.innerHTML;
    
    if (content) {
      const printContent = content.innerHTML;
      document.body.innerHTML = printContent;
      window.print();
      document.body.innerHTML = originalContents;
      window.location.reload();
    }
  };
  
  // Get transaction and related data
  const {
    invoiceNumber,
    date,
    amount,
    paymentMethod,
    orderId,
    order,
    customerName,
  } = transaction;
  
  return (
    <div className="bg-white p-4 rounded-lg max-w-4xl mx-auto print-container" style={{ backgroundColor: 'white' }}>
      <div className="flex justify-between items-center mb-4 print:hidden">
        <h2 className="text-xl font-bold">Payment Receipt</h2>
        <Button variant="ghost" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
      </div>
      
      <div ref={printRef} className="print-content" style={{ backgroundColor: 'white' }}>
        <style dangerouslySetInnerHTML={{ __html: `
          @media screen {
            .print-content {
              background-color: white;
            }
          }
          
          @media print {
            @page {
              size: A4;
              margin: 10mm;
            }
            
            .print-container {
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 9999;
              background: white !important;
            }
            
            .print-content {
              background: white !important;
              padding: 0;
              margin: 0;
            }
            
            body, html, :root, .print-container, .print-content {
              background: white !important;
              background-color: white !important;
              background-image: none !important;
            }
            
            /* Only allow specific elements to have color */
            .bg-orange, tr.bg-orange th {
              background-color: #ec9238 !important;
              color: black !important;
            }
            
            /* Rest of styles remain the same */
            h1,h3,h4,h5,h6,p,span,label {
              font-family: sans-serif;
              font-size: 11px;
            }
            h2 {
              font-family: sans-serif;
              font-size: 30px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 0px !important;
              background-color: white !important;
            }
            table thead th {
              height: 14px;
              text-align: center;
              font-size: 12px;
              font-family: sans-serif;
              background-color: white !important;
            }
            table, th, td {
              border: 1px solid #ddd;
              padding: 8px;
              font-size: 11px;
              border-collapse: collapse;
            }
            .heading {
              font-size: 12px;
              margin-top: 12px;
              margin-bottom: 12px;
              font-family: sans-serif;
            }
            .small-heading {
              font-size: 18px;
              font-family: sans-serif;
            }
            .total-heading {
              font-size: 12px;
              font-weight: 700;
              font-family: sans-serif;
            }
            .text-start { text-align: left; }
            .text-end { text-align: right; }
            .text-center { text-align: center; }
            .company-data span {
              margin-bottom: 4px;
              display: inline-block;
              font-family: sans-serif;
              font-size: 11px;
              font-weight: 400;
            }
            .no-border { border: 1px solid #fff !important; }
          }
        `}} />
        
        <table className="w-full border-collapse" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th width="50%" colSpan={2} className="text-left" style={{ border: '1px solid #ddd', padding: '8px' }}>
                <div className="flex items-center">
                  <img 
                    src="https://erp.smartone.id/vendor/crudbooster/avatar.jpg" 
                    alt="SmartOne" 
                    style={{ float: 'left', width: '80px' }} 
                    className="mr-4" 
                  />
                  <h2 className="text-4xl font-bold">INVOICE</h2>
                </div>
              </th>
              <th width="50%" colSpan={2} className="text-right" style={{ border: '1px solid #ddd', padding: '8px' }}>
                <div className="text-sm space-y-1">
                  <div>Project No.: {order?.spk || orderId}</div>
                  <div>Order Date: {formatDate(date)}</div>
                </div>
              </th>
            </tr>
            <tr className="bg-orange" style={{ backgroundColor: '#ec9238', border: '1px solid #ddd' }}>
              <th width="50%" colSpan={2} style={{ border: '1px solid #ddd', padding: '8px' }}>Detail Invoice</th>
              <th width="50%" colSpan={2} style={{ border: '1px solid #ddd', padding: '8px' }}>Detail Customer</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>No. Invoice:</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order?.invoice || invoiceNumber}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Nama:</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{customerName}</td>
            </tr>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>Tanggal Invoice:</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatDate(date)}</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>No. Hp</td>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order?.customer?.phone || '-'}</td>
            </tr>
          </tbody>
        </table>
        
        <br />
        
        <table className="w-full border-collapse" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th colSpan={5} className="text-left no-border" style={{ borderColor: '#fff', padding: '8px' }}>
                <div className="text-sm font-medium">Detail Order</div>
              </th>
            </tr>
            <tr className="bg-orange" style={{ backgroundColor: '#ec9238', border: '1px solid #ddd' }}>
              <th colSpan={2} style={{ border: '1px solid #ddd', padding: '8px' }}>Deskripsi Barang</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>QTY</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Harga</th>
              <th style={{ border: '1px solid #ddd', padding: '8px' }}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={2} style={{ border: '1px solid #ddd', padding: '8px' }}>
                {order?.produk || transaction?.description || 'Payment'}
              </td>
              <td width="10%" style={{ border: '1px solid #ddd', padding: '8px' }}>
                {order?.qty || 1}
              </td>
              <td width="10%" style={{ border: '1px solid #ddd', padding: '8px' }}>
                {formatCurrency(order?.harga_satuan || amount)}
              </td>
              <td width="15%" className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                {formatCurrency((order?.harga_satuan || amount) * (order?.qty || 1))}
              </td>
            </tr>
            
            {order?.tambah_bahan && (
              <tr>
                <td colSpan={2} style={{ border: '1px solid #ddd', padding: '8px' }}>{order.tambah_bahan}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{order.qty_bahan || 0}</td>
                <td style={{ border: '1px solid #ddd', padding: '8px' }}>{formatCurrency(order.satuan_bahan || 0)}</td>
                <td className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right' }}>
                  {formatCurrency(order.total_bahan || 0)}
                </td>
              </tr>
            )}
            
            {/* Cutting items would be rendered dynamically based on data availability */}
            
            <tr>
              <td colSpan={3} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                Total
              </td>
              <td colSpan={2} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatCurrency(order?.nominal || amount)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                DP :
              </td>
              <td colSpan={2} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatCurrency(order?.dp || 0)}
              </td>
            </tr>
            <tr>
              <td colSpan={3} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                Sisa Pembayaran :
              </td>
              <td colSpan={2} className="font-bold text-right" style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'right', fontWeight: 'bold' }}>
                {formatCurrency(order?.sisa || 0)}
              </td>
            </tr>
          </tbody>
        </table>
        
        <br />
        
        <table className="w-full border-collapse" style={{ borderCollapse: 'collapse' }}>
          <tbody>
            <tr>
              <td style={{ border: '1px solid #ddd', padding: '8px' }}>
                Note: Pembayaran dapat dilakukan melalui:<br />
                BCA: 775-3838777 a.n Wendi Tanujaya
              </td>
              <td style={{ border: '1px solid #ddd', padding: '8px', textAlign: 'center' }}>
                Dibuat oleh<br /><br /><br /><br /><br />Admin Smartone
              </td>
            </tr>
          </tbody>
        </table>
        
        <p className="text-center mt-4" style={{ textAlign: 'center' }}>
          smartone.id
        </p>
      </div>
      
      <div className="flex justify-end mt-4">
        <Button variant="outline" onClick={onClose} className="mr-2">
          Close
        </Button>
        <Button onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>
    </div>
  );
} 