import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

// OrderWithCustomer type to match our schema
interface OrderWithCustomer {
  id: string
  spk?: string | null
  no_project?: string | null
  tanggal?: Date | string | null
  created_at?: Date | string | null
  produk?: string | null
  asal_bahan?: string | null
  nama_kain?: string | null
  jumlah_kain?: string | null
  lebar_kertas?: string | null
  nama_produk?: string | null
  qty?: number | null
  catatan?: string | null
  status?: string | null
  statusm?: string | null
  customer_id?: number | null
  marketing?: string | null // String field for marketing name
  marketingInfo?: { // Added from API processing
    name: string
  } | null
  capture?: string | null
  capture_name?: string | null
  createdBy?: {
    id: string
    name: string
  } | null
  customer?: {
    id: string | number
    nama: string
    telp?: string | null
  } | null
}

export default function ViewOrderData({ order }: { order: OrderWithCustomer }) {
  const formatDate = (dateString: string | Date | null | undefined) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch (error) {
      return 'Invalid date';
    }
  };

  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Details - {order.spk || 'N/A'}</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Order Details Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">1. Order Information</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/3">Field</th>
              <th className="border p-2">Value</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Order Date</td>
              <td className="border p-2">{formatDate(order.created_at || order.tanggal)}</td>
            </tr>
            <tr>
              <td className="border p-2">No Project</td>
              <td className="border p-2">{order.no_project || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">SPK</td>
              <td className="border p-2">{order.spk || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Customer</td>
              <td className="border p-2">{order.customer?.nama || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Phone</td>
              <td className="border p-2">
                {order.customer?.telp 
                  ? `62${order.customer.telp.startsWith('8') ? order.customer.telp : order.customer.telp.replace(/^0+/, '')}`
                  : 'N/A'}
              </td>
            </tr>
            <tr>
              <td className="border p-2">Product</td>
              <td className="border p-2">{order.produk || order.nama_produk || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Fabric Origins</td>
              <td className="border p-2">{order.asal_bahan || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Fabric Name</td>
              <td className="border p-2">{order.nama_kain || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Fabric Quantity</td>
              <td className="border p-2">{order.jumlah_kain || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Paper Width</td>
              <td className="border p-2">{order.lebar_kertas || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Status</td>
              <td className="border p-2">{order.status || order.statusm || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Quantity</td>
              <td className="border p-2">{order.qty || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Notes</td>
              <td className="border p-2">{order.catatan || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Marketing</td>
              <td className="border p-2">{order.marketingInfo?.name || order.marketing || 'N/A'}</td>
            </tr>
            <tr>
              <td className="border p-2">Layout Length</td>
              <td className="border p-2">
                {order.lebar_kertas && order.qty 
                  ? `${order.lebar_kertas} X ${order.qty}`
                  : 'N/A'}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Preview Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">2. Preview Project</h2>
        <div className="grid grid-cols-2 gap-4">
          {order.capture && (
            <div className="border rounded p-2">
              <p className="text-sm text-gray-500 mb-2">Design Preview</p>
              <div className="relative h-[180px] w-full">
                <Image
                  src={`/uploads/${order.capture}`}
                  alt="Design preview"
                  layout="fill"
                  objectFit="contain"
                  className="rounded"
                />
              </div>
            </div>
          )}
          {order.capture_name && (
            <div className="border rounded p-2">
              <p className="text-sm text-gray-500 mb-2">Name Preview</p>
              <div className="relative h-[180px] w-full">
                <Image
                  src={`/uploads/${order.capture_name}`}
                  alt="Name preview"
                  layout="fill"
                  objectFit="contain"
                  className="rounded"
                />
              </div>
            </div>
          )}
          {!order.capture && !order.capture_name && (
            <div className="col-span-2 text-center py-8 border rounded">
              No preview images available
            </div>
          )}
        </div>
      </div>

      {/* Approval Signatures */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="text-center border-t pt-4">
          <p className="font-medium">Created by</p>
          <p>{order.createdBy?.name || 'N/A'}</p>
          <p className="text-sm text-gray-500 mt-2">
            {order.created_at ? formatDate(order.created_at) : 'N/A'}
          </p>
        </div>
        <div className="text-center border-t pt-4">
          <p className="font-medium">Manager Approval</p>
          <p className="text-sm text-gray-500 mt-2">
            {order.statusm === 'APPROVED' ? 'Approved' : (order.statusm === 'REJECT' ? 'Rejected' : 'Pending')}
          </p>
        </div>
        <div className="text-center border-t pt-4">
          <p className="font-medium">Production Approval</p>
          <p className="text-sm text-gray-500 mt-2">
            {order.status === 'APPROVED' ? 'Approved' : (order.status === 'REJECT' ? 'Rejected' : 'Pending')}
          </p>
        </div>
        <div className="text-center border-t pt-4">
          <p className="font-medium">Marketing</p>
          <p>{order.marketingInfo?.name || order.marketing || 'N/A'}</p>
        </div>
      </div>
    </div>
  )
}