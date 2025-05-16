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

export function getStatusColor(status: string) {
  const statusColors: Record<string, string> = {
    "Active": "text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400",
    "Maintenance": "text-amber-600 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400",
    "Retired": "text-gray-600 bg-gray-100 dark:bg-gray-700/40 dark:text-gray-400",
    "Reserved": "text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400",
    "Under Repair": "text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400",
  };
  
  return statusColors[status] || "text-gray-600 bg-gray-100";
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