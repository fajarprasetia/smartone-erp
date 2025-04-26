import { format } from "date-fns";

// Asset options
export const assetTypes = [
  "Production Equipment",
  "Office Equipment",
  "IT Hardware",
  "Vehicle",
  "Furniture",
  "Building",
  "Software License",
  "Other"
];

export const assetStatuses = [
  "Active",
  "Maintenance",
  "Retired",
  "Reserved",
  "Under Repair"
];

export const assetLocations = [
  "Production Floor",
  "Office - Main",
  "Office - Remote",
  "Warehouse",
  "Storage",
  "Workshop"
];

export function getStatusColor(status: string | null) {
  if (!status) return "secondary";
  
  const statusColors: Record<string, "default" | "success" | "secondary" | "destructive" | "outline" | "warning"> = {
    "Active": "success",
    "Maintenance": "warning",
    "Retired": "secondary",
    "Reserved": "outline",
    "Under Repair": "destructive",
  };
  
  return statusColors[status] || "secondary";
}

export function formatDate(dateString: Date | string | null | undefined) {
  if (!dateString) return "-";
  try {
    return format(new Date(dateString), "MMM d, yyyy");
  } catch (error) {
    console.error("Error formatting date:", error);
    return "-";
  }
} 