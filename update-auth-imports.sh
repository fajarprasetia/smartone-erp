#!/bin/bash

# Function to update import statement in a file
update_file() {
  local file=$1
  # Use sed to replace the import statement
  sed -i 's|import { authOptions } from "@/app/api/auth/\[...nextauth\]/route"|import { authOptions } from "@/lib/auth"|g' "$file"
  echo "Updated $file"
}

# List of files to update
files=(
  "src/app/api/orders/[id]/status/route.ts"
  "src/app/api/orders/payment/settle/route.ts"
  "src/app/api/orders/payment/dp/route.ts"
  "src/app/api/orders/payment/no-dp/route.ts"
  "src/app/api/orders/approved/cancel/route.ts"
  "src/app/api/orders/draft/submit/route.ts"
  "src/app/api/orders/draft/[id]/route.ts"
  "src/app/api/orders/complete/route.ts"
  "src/app/api/production/orders/route.ts"
  "src/app/api/production/print/route.ts"
  "src/app/api/design/process/route.ts"
  "src/app/api/dtf/ready-orders/route.ts"
  "src/app/api/upload/route.ts"
  "src/app/api/inventory/others-request/approve/route.ts"
  "src/app/api/inventory/others-request/reject/route.ts"
  "src/app/api/inventory/others-request/route.ts"
  "src/app/api/inventory/others-request/log/route.ts"
  "src/app/api/inventory/ink-stock/validate/route.ts"
  "src/app/api/inventory/ink-stock/next-barcode/route.ts"
  "src/app/api/inventory/ink-stock/route.ts"
  "src/app/api/manager/approval/route.ts"
  "src/app/api/settings/dashboard-cards/[id]/route.ts"
  "src/app/api/settings/roles/route.ts"
  "src/app/api/settings/dashboard-cards/route.ts"
  "src/app/api/settings/roles/[id]/route.ts"
  "src/app/api/settings/whatsapp/route.ts"
  "src/app/api/settings/users/route.ts"
  "src/app/api/inventory/ink/route.ts"
  "src/app/api/inventory/ink-request/route.ts"
  "src/app/api/inventory/ink-request/validate/route.ts"
  "src/app/api/inventory/ink-request/[id]/route.ts"
  "src/app/api/inventory/ink-request/approve/route.ts"
  "src/app/api/inventory/ink-request/reject/route.ts"
  "src/app/api/inventory/others-used/route.ts"
  "src/app/api/inventory/ink-request/log/route.ts"
  "src/app/api/inventory/paper-request/log/route.ts"
  "src/app/api/inventory/paper-request/approve/route.ts"
  "src/app/api/inventory/paper-request/validate/route.ts"
  "src/app/api/inventory/paper-request/[id]/route.ts"
  "src/app/api/inventory/paper-request/route.ts"
  "src/app/api/inventory/paper/route.ts"
  "src/app/api/inventory/paper/[id]/route.ts"
  "src/app/api/inventory/others-log/route.ts"
)

# Update each file
for file in "${files[@]}"; do
  if [ -f "$file" ]; then
    update_file "$file"
  else
    echo "Warning: File $file not found"
  fi
done

echo "All files updated" 