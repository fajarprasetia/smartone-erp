"use client";

// ... existing code ...
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
// ... existing code ...

      <Dialog open={startDialogOpen} onOpenChange={setStartDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogTitle>Start Printing Process</DialogTitle>
          <DialogDescription>
            Fill out the form to begin the printing process for this order.
          </DialogDescription>
          {selectedOrder && (
            <PrintStartForm
              order={{
                id: selectedOrder.id,
                spk: selectedOrder.spk,
                customer: { nama: selectedOrder.customer.nama },
                produk: selectedOrder.produk
              }}
              onSuccess={() => {
                setStartDialogOpen(false);
                fetchPendingPrintOrders();
                if (onOrderStart) onOrderStart();
              }}
              onCancel={() => setStartDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
// ... existing code ...