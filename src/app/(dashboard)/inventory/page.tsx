"use client"

import { useRouter } from "next/navigation"
import { PackageOpen, Box, ArrowRightLeft, ChevronRight } from "lucide-react"

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export default function InventoryPage() {
  const router = useRouter()
  
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold tracking-tight">Inventory Management</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="overflow-hidden">
          <CardHeader className="bg-blue-50 dark:bg-blue-950 pb-2">
            <CardTitle className="flex items-center">
              <PackageOpen className="mr-2 h-5 w-5 text-blue-600 dark:text-blue-400" />
              Inbound Inventory
            </CardTitle>
            <CardDescription>
              Manage fabric inventory and track incoming materials
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Track and manage all incoming fabric inventory. Add new items, update existing inventory, and view detailed information.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Add new fabric inventory
              </li>
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Track fabric sources and details
              </li>
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Search and filter inventory items
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-blue-50/50 dark:bg-blue-950/50 pt-2">
            <Button 
              className="w-full" 
              onClick={() => router.push("/inventory/inbound")}
            >
              Go to Inbound Inventory
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="bg-green-50 dark:bg-green-950 pb-2">
            <CardTitle className="flex items-center">
              <Box className="mr-2 h-5 w-5 text-green-600 dark:text-green-400" />
              Outbound Inventory
            </CardTitle>
            <CardDescription>
              Manage orders ready for handover and track outgoing inventory
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground mb-4">
              Manage orders that are approved and ready for handover to customers. Process handovers and handle quality control rejections.
            </p>
            <ul className="space-y-2">
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                View orders ready for handover
              </li>
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Process order handovers to customers
              </li>
              <li className="flex items-center text-sm">
                <ChevronRight className="mr-2 h-4 w-4 text-muted-foreground" />
                Manage quality control rejections
              </li>
            </ul>
          </CardContent>
          <CardFooter className="bg-green-50/50 dark:bg-green-950/50 pt-2">
            <Button 
              className="w-full" 
              onClick={() => router.push("/inventory/outbound")}
            >
              Go to Outbound Inventory
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            Inventory Overview
          </CardTitle>
          <CardDescription>
            Current inventory status and activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-blue-50 dark:bg-blue-950/40 rounded-lg p-4">
              <h3 className="font-medium mb-1">Inbound Items</h3>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground mt-1">Total inventory items</p>
            </div>
            <div className="bg-green-50 dark:bg-green-950/40 rounded-lg p-4">
              <h3 className="font-medium mb-1">Ready for Handover</h3>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground mt-1">Orders pending handover</p>
            </div>
            <div className="bg-amber-50 dark:bg-amber-950/40 rounded-lg p-4">
              <h3 className="font-medium mb-1">Recently Added</h3>
              <p className="text-2xl font-bold">-</p>
              <p className="text-xs text-muted-foreground mt-1">New items in last 7 days</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
} 