"use client"

import { useState } from "react"

export function OthersTab() {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Other Consumables</h3>
      </div>
      <p className="text-muted-foreground">
        This section will contain inventory management for other consumable materials such as cleaning supplies, spare parts, and miscellaneous items. It will include stocks, available items, stock outs, requests, and logs.
      </p>
    </div>
  )
} 