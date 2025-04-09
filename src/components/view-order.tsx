import { Button } from '@/components/ui/button'
import { OrderWithCustomer } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { Printer } from 'lucide-react'
import Image from 'next/image'
import { format } from 'date-fns'

export default function ViewOrderData({ order }: { order: OrderWithCustomer }) {
  return (
    <div className="p-4 bg-white">
      <div className="flex justify-between mb-4">
        <h1 className="text-2xl font-bold">Order Details - {order.spk}</h1>
        <Button onClick={() => window.print()}>
          <Printer className="mr-2 h-4 w-4" />
          Print
        </Button>
      </div>

      {/* Order Details Table */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">1. Detail Order</h2>
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 w-1/3">KETERANGAN</th>
              <th className="border p-2">DESKRIPSI</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border p-2">Asal Bahan</td>
              <td className="border p-2">{order.asal_bahan}</td>
            </tr>
            <tr>
  <td className="border p-2">Nama Kain</td>
  <td className="border p-2">{order.nama_kain}</td>
</tr>
<tr>
  <td className="border p-2">Jumlah Kain</td>
  <td className="border p-2">{order.jumlah_kain}</td>
</tr>
<tr>
  <td className="border p-2">Lebar Kertas</td>
  <td className="border p-2">{order.lebar_kertas}</td>
</tr>
<tr>
  <td className="border p-2">Aplikasi Produk</td>
  <td className="border p-2">{order.nama_produk}</td>
</tr>
<tr>
  <td className="border p-2">Quantity Produksi</td>
  <td className="border p-2">{order.qty}</td>
</tr>
<tr>
  <td className="border p-2">Panjang Layout</td>
  <td className="border p-2">{order.lebar_kertas} X {order.qty}</td>
</tr>
          </tbody>
        </table>
      </div>

      {/* Preview Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold mb-2">2. Preview Project</h2>
        <div className="grid grid-cols-2 gap-4">
  {order.capture && (
    <Image
      src={`/uploads/${order.capture}`}
      alt="Design preview"
      width={300}
      height={180}
      className="border rounded mx-auto"
    />
  )}
  {order.capture_name && (
    <Image
      src={`/uploads/${order.capture_name}`}
      alt="Name preview"
      width={280}
      height={120}
      className="border rounded mx-auto"
    />
  )}
</div>
      </div>

      {/* Approval Signatures */}
      <div className="grid grid-cols-4 gap-4 mt-8">
        <div className="text-center">
          <p className="font-medium">Created by</p>
          <p>{order.createdBy?.name}</p>
        </div>
        {/* Add other signatures similarly */}
      </div>
    </div>
  )
}