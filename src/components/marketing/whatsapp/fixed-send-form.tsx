"use client"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

interface SendFormProps {
  onSuccess?: () => void
}

export function FixedSendForm({ onSuccess }: SendFormProps) {
  const handleClick = () => {
    if (onSuccess) onSuccess();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Send Test Message</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleClick}>Send Test</Button>
      </CardContent>
    </Card>
  )
}

export default FixedSendForm; 