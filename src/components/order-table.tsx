// @ts-nocheck
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Order, Customer } from '@prisma/client'
import { ColumnDef, createColumnHelper, useReactTable, getCoreRowModel, flexRender } from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import Image from 'next/image'
import { Badge } from '@/components/ui/badge'
import { Eye } from 'lucide-react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'

type OrderWithCustomer = Order & {
  customer: Customer | null
}

type OrderTableProps = {
  orders?: OrderWithCustomer[]
  approvalStatus?: string
  rejectionStatus?: string
  role?: any
  showActions?: boolean
  showStatus?: boolean
  showRejectActions?: boolean
}

const columnHelper = createColumnHelper<OrderWithCustomer>()

export function OrderTable({ 
  orders = [], 
  approvalStatus,
  rejectionStatus,
  role,
  showActions = false, 
  showStatus = false,
  showRejectActions = false
}: OrderTableProps) {
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null)
  const [currentAction, setCurrentAction] = useState<'approve' | 'reject'>('approve')
  const router = useRouter()

  const columns: ColumnDef<OrderWithCustomer>[] = [
    columnHelper.accessor('tanggal', {
      header: 'Date',
      cell: ({ row }) => new Date(row.original.tanggal).toLocaleDateString()
    }),
    columnHelper.accessor('spk', {
      header: 'SPK',
      cell: ({ row }) => (
        <Button
          variant="link"
          className="p-0"
          onClick={() => router.push(`/orders/${row.original.id}`)}
        >
          {row.original.spk}
        </Button>
      )
    }),
    columnHelper.accessor('customer.nama', {
      header: 'Customer',
      cell: ({ row }) => row.original.customer?.nama || 'N/A'
    }),
    columnHelper.accessor('nama_produk', {
      header: 'Product'
    }),
    columnHelper.accessor('tipe_produk', {
      header: 'Product Type'
    }),
    columnHelper.accessor('qty', {
      header: 'Quantity'
    }),
    columnHelper.accessor('kategori', {
      header: 'Category'
    }),
    columnHelper.accessor('catatan', {
      header: 'Note'
    }),
    columnHelper.accessor('capture_name', {
      header: 'Capture',
      cell: ({ row }) => row.original.capture_name ? (
        <Image
          src={`/uploads/${row.original.capture_name}`}
          alt="Capture"
          width={50}
          height={50}
          className="cursor-pointer rounded"
          onClick={() => console.log('View image:', row.original.capture_name)}
        />
      ) : 'N/A'
    }),
    {
      header: 'Actions',
      accessor: 'id',
      cell: ({ value }) => {
        return showActions ? (
          <div className="flex space-x-2">
            <Button variant="destructive" onClick={() => {
              setCurrentAction('reject');
              setSelectedOrderId(value);
              setOpenDialog(true);
            }}>Reject</Button>
            <Button onClick={() => {
              setCurrentAction('approve');
              setSelectedOrderId(value);
              setOpenDialog(true);
            }}>Approve</Button>
          </div>
        ) : null;
      }
    },
    {
      header: 'Status',
      accessor: 'status',
      cell: ({ row }) => {
        return showStatus ? (
          <Badge variant="outline">APPROVED</Badge>
        ) : null;
      }
    }
  ]

  const table = useReactTable({
    data: orders,
    columns,
    getCoreRowModel: getCoreRowModel(),
    initialState: {
      columnVisibility: {
        // Hide customer_id from table display
        customer_id: false
      }
    }
  })

  return (
    <>
      <AlertDialog open={openDialog} onOpenChange={setOpenDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {currentAction === 'approve' ? 'Approve Order' : 'Reject Order'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to {currentAction} this order?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                // Handle approval/rejection logic here
                setOpenDialog(false)
              }}
            >
              Confirm {currentAction}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <div className="rounded-md border">
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <TableHead key={header.id}>
                  {header.isPlaceholder
                    ? null
                    : flexRender(
                        header.column.columnDef.header,
                        header.getContext()
                      )}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows?.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow
                key={row.id}
                data-state={row.getIsSelected() && 'selected'}
              >
                {row.getVisibleCells().map((cell) => (
                  <TableCell key={cell.id}>
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={columns.length} className="h-24 text-center">
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
    </>
  )
}