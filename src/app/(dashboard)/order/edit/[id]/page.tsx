"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { ChevronLeft } from "lucide-react"
import { MainOrderPage } from "../../add/components/main-order-page"

export default function EditOrderPage() {
  const router = useRouter()
  const params = useParams()
  const [isLoading, setIsLoading] = useState(true)
  const [orderData, setOrderData] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  // Fetch order data
  useEffect(() => {
    // Safe access using params
    const orderId = Array.isArray(params?.id) ? params.id[0] : params?.id;
    
    const fetchOrder = async () => {
      if (!orderId) {
        toast.error("No order ID provided");
        router.push("/order");
        return;
      }

      try {
        setIsLoading(true);
        setError(null);
        
        console.log("Fetching order with ID:", orderId);

        const response = await fetch(`/api/orders/${orderId}`, {
          headers: {
            'Accept': 'application/json',
            'Cache-Control': 'no-cache',
          },
          cache: 'no-store',
        });
        
        console.log("Response status:", response.status);
        
        // Get the raw text first to debug potential JSON issues
        const rawText = await response.text();
        console.log("Raw response text length:", rawText.length);
        
        if (rawText.trim() === '') {
          console.error("Empty response received from API");
          throw new Error("Server returned an empty response");
        }
        
        let data;
        try {
          // Parse the text as JSON
          data = JSON.parse(rawText);
          console.log("Response parsed successfully");
        } catch (jsonError) {
          console.error("JSON parsing error:", jsonError);
          console.error("Raw response:", rawText);
          throw new Error(`Invalid JSON response: ${jsonError instanceof Error ? jsonError.message : 'Unknown parsing error'}`);
        }
        
        if (!response.ok) {
          console.error("API Error Response:", data);
          const errorMessage = data?.error || data?.details || `Failed to fetch order (status ${response.status})`;
          
          // If the error is about not being authorized or not finding the order
          if (response.status === 401 || response.status === 404) {
            toast.error(errorMessage);
            setTimeout(() => router.push("/order"), 1500);
            throw new Error(errorMessage);
          }
          
          // For database errors or other server errors, try the ID endpoint or SPK endpoints as fallback
          if (response.status === 500 && /^\d+$/.test(orderId)) {
            console.log("Trying fallback to numeric ID endpoint");
            try {
              // Try the ID endpoint first
              const idResponse = await fetch(`/api/orders/id?id=${encodeURIComponent(orderId)}`, {
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                cache: 'no-store',
              });
              
              if (idResponse.ok) {
                const idData = await idResponse.json();
                if (idData && idData.id) {
                  console.log("Successfully retrieved order from ID endpoint");
                  setOrderData(idData);
                  return;
                }
              }
              
              // If that fails, try the SPK endpoint
              const spkResponse = await fetch(`/api/orders/spk?spk=${encodeURIComponent(orderId)}`, {
                headers: {
                  'Accept': 'application/json',
                  'Cache-Control': 'no-cache',
                },
                cache: 'no-store',
              });
              
              if (spkResponse.ok) {
                const spkData = await spkResponse.json();
                if (spkData && spkData.id) {
                  console.log("Successfully retrieved order from SPK endpoint");
                  setOrderData(spkData);
                  return;
                }
              }
            } catch (fallbackError) {
              console.error("Error in fallback fetch:", fallbackError);
            }
          }
          
          throw new Error(errorMessage);
        }
        
        console.log("Order data received:", data ? "Success" : "Empty");
        
        if (!data || !data.id) {
          throw new Error("Received invalid order data (missing ID)");
        }
        
        setOrderData(data);
      } catch (error) {
        console.error("Error fetching order:", error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setError(errorMessage);
        toast.error(`Failed to load order: ${errorMessage}`);
        // Redirect back to orders page after error, but with a delay
        setTimeout(() => router.push("/order"), 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (orderId) {
    fetchOrder();
    } else {
      setIsLoading(false);
      setError("No order ID provided");
    }
  }, [params, router]);

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-[250px]" />
          <Skeleton className="h-10 w-[120px]" />
        </div>
        <Skeleton className="h-[600px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-10 space-y-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold tracking-tight text-red-600">Error Loading Order</h1>
          <Button 
            variant="outline" 
            onClick={() => router.push("/order")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Orders
          </Button>
        </div>
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 mb-4">{error}</p>
          <Button onClick={() => router.push("/order")}>
            Return to Order List
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Edit Order</h1>
        <Button 
          variant="outline" 
          onClick={() => router.push("/order")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          Back to Orders
        </Button>
      </div>

      {orderData && <MainOrderPage mode="edit" initialData={orderData} />}
    </div>
  );
} 