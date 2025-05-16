'use client'

import { useState, useEffect, useRef } from 'react'
import type { customer } from '@prisma/client'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Search, Send, Paperclip, Smile } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

// Types for chat messages
type ChatMessage = {
  id: string
  customerId: bigint
  content: string
  timestamp: Date
  isIncoming: boolean
  status?: string
  messageType: string
  mediaUrl?: string | null
  metadata?: string | null
  whatsappMessageId?: string | null
  createdAt: Date
  updatedAt: Date
}

// Define customer interface that matches what's used in the component
interface Customer {
  id: string
  name: string
  phone?: string
}

type CustomerWithChats = {
  id: bigint
  nama: string
  telp?: string | null
  messages: ChatMessage[]
}

export function WhatsAppPlatform() {
  const [customers, setCustomers] = useState<CustomerWithChats[]>([])
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [messageText, setMessageText] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Load customers on component mount
  useEffect(() => {
    async function fetchCustomers() {
      try {
        const response = await fetch('/api/marketing/whatsapp/customers')
        const data = await response.json()
        
        // Transform the data to match our types
        const customersWithChats: CustomerWithChats[] = data.map((customer: any) => ({
          id: BigInt(customer.id),
          nama: customer.nama,
          telp: customer.telp,
          messages: customer.messages.map((msg: any) => ({
            ...msg,
            customerId: BigInt(msg.customerId),
            timestamp: new Date(msg.timestamp),
            createdAt: new Date(msg.createdAt),
            updatedAt: new Date(msg.updatedAt)
          }))
        }))
        
        setCustomers(customersWithChats)
      } catch (error) {
        console.error('Error fetching customers:', error)
        toast({
          title: 'Error',
          description: 'Failed to fetch customers',
          variant: 'destructive'
        })
      }
    }
    
    fetchCustomers()
  }, [])
  
  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedCustomerId, customers])
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.telp?.includes(searchTerm) ||
    customer.id.toString().includes(searchTerm)
  )
  
  // Get selected customer
  const selectedCustomer = customers.find(c => c.id.toString() === selectedCustomerId)
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCustomerId) return
    
    const customer = customers.find(c => c.id.toString() === selectedCustomerId)
    if (!customer?.telp) {
      toast({
        title: "No phone number",
        description: "This customer has no phone number registered",
        variant: "destructive"
      })
      return
    }
    
    // Create temporary message
    const tempMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      customerId: customer.id,
      content: messageText,
      isIncoming: false,
      timestamp: new Date(),
      status: 'sending',
      messageType: 'text',
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    // Add temporary message to UI
    setCustomers(prev => 
      prev.map(c => 
        c.id.toString() === selectedCustomerId 
          ? { ...c, messages: [...c.messages, tempMessage] } 
          : c
      )
    )
    
    // Clear input
    setMessageText('')
    
    try {
      const response = await fetch('/api/marketing/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          message: messageText,
          phone: customer.telp
        }),
      })
      
      if (!response.ok) throw new Error('Failed to send message')
      
      const data = await response.json()
      
      // Update message with server response
      setCustomers(prev => 
        prev.map(c => 
          c.id.toString() === selectedCustomerId 
            ? { 
                ...c, 
                messages: c.messages.map(m => 
                  m.id === tempMessage.id 
                    ? {
                        ...data.message,
                        customerId: customer.id,
                        timestamp: new Date(data.message.timestamp),
                        createdAt: new Date(data.message.createdAt),
                        updatedAt: new Date(data.message.updatedAt)
                      }
                    : m
                )
              } 
            : c
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      
      // Remove temporary message on error
      setCustomers(prev => 
        prev.map(c => 
          c.id.toString() === selectedCustomerId 
            ? { ...c, messages: c.messages.filter((m: ChatMessage) => !m.id.startsWith('temp-')) } 
            : c
        )
      )
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
    }
  }
  
  // Format timestamp for display
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  }
  
  return (
    <div className="flex h-[calc(100vh-12rem)] border rounded-md overflow-hidden">
      {/* Contacts sidebar */}
      <div className="w-1/3 border-r flex flex-col">
        <div className="p-3 border-b">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search contacts..."
              className="pl-8"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        
        <ScrollArea className="flex-1">
          {isLoading ? (
            <div className="flex justify-center items-center h-20">
              <p>Loading contacts...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="flex justify-center items-center h-20">
              <p>No contacts found</p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredCustomers.map((customer) => (
                <div
                  key={customer.id.toString()}
                  className={`flex items-center p-3 cursor-pointer hover:bg-muted/50 ${selectedCustomerId === customer.id.toString() ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedCustomerId(customer.id.toString())}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>{customer.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{customer.nama}</p>
                      {customer.messages.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(customer.messages[customer.messages.length - 1].timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.messages.length > 0 
                        ? customer.messages[customer.messages.length - 1].content
                        : customer.telp || 'No phone number'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </div>
      
      {/* Chat area */}
      <div className="flex-1 flex flex-col">
        {selectedCustomer ? (
          <>
            {/* Chat header */}
            <div className="p-3 border-b flex items-center">
              <Avatar className="h-9 w-9 mr-2">
                <AvatarFallback>{selectedCustomer.nama.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedCustomer.nama}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.telp || 'No phone number'}
                </p>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {selectedCustomer.messages.length === 0 ? (
                  <div className="flex justify-center items-center h-32">
                    <p className="text-muted-foreground">No messages yet</p>
                  </div>
                ) : (
                  selectedCustomer.messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${!message.isIncoming ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          !message.isIncoming
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-foreground'
                        }`}
                      >
                        {message.mediaUrl && (
                          <div className="mb-2">
                            <img 
                              src={message.mediaUrl} 
                              alt="Media" 
                              className="rounded-md max-w-full h-auto"
                            />
                          </div>
                        )}
                        <p>{message.content}</p>
                        <div className="flex justify-between items-center mt-1">
                          <p className={`text-xs ${
                            !message.isIncoming
                              ? 'text-primary-foreground/70'
                              : 'text-muted-foreground'
                          }`}>
                            {new Date(message.timestamp).toLocaleTimeString()}
                          </p>
                          {message.status && (
                            <span className="text-xs text-muted-foreground">
                              {message.status}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-3 border-t flex items-center">
              <Button variant="ghost" size="icon" className="rounded-full">
                <Paperclip className="h-5 w-5" />
              </Button>
              <Input
                placeholder="Type a message..."
                className="mx-2"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSendMessage()
                  }
                }}
              />
              <Button variant="ghost" size="icon" className="rounded-full">
                <Smile className="h-5 w-5" />
              </Button>
              <Button onClick={handleSendMessage} size="icon" className="rounded-full">
                <Send className="h-5 w-5" />
              </Button>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="max-w-md text-center p-4">
              <h3 className="text-xl font-semibold mb-2">Select a contact to start messaging</h3>
              <p className="text-muted-foreground">
                Choose a contact from the list to send WhatsApp messages.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}