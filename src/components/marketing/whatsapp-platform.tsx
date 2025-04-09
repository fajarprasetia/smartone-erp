'use client'

import { useState, useEffect, useRef } from 'react'
import { Customer } from '@prisma/client'
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
  customerId: string
  content: string
  timestamp: Date
  isIncoming: boolean
}

type CustomerWithChats = Customer & {
  formattedPhone: string
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
    const loadCustomers = async () => {
      try {
        setIsLoading(true)
        const res = await fetch('/api/marketing/customers', { cache: 'no-store' })
        if (!res.ok) throw new Error('Failed to fetch customers')
        
        const customersData = await res.json()
        
        // Format customers with empty messages array for now
        const formattedCustomers = customersData.map((customer: Customer) => ({
          ...customer,
          formattedPhone: customer.phone ? `62${customer.phone}` : '',
          messages: []
        }))
        
        setCustomers(formattedCustomers)
        
        // Load chat history for all customers
        await Promise.all(
          formattedCustomers.map(async (customer: CustomerWithChats) => {
            try {
              const chatRes = await fetch(`/api/marketing/whatsapp/chats/${customer.id}`)
              if (chatRes.ok) {
                const chatData = await chatRes.json()
                customer.messages = chatData
              }
            } catch (error) {
              console.error(`Error loading chats for customer ${customer.id}:`, error)
            }
          })
        )
        
        setIsLoading(false)
        
        // Select first customer if available
        if (formattedCustomers.length > 0 && !selectedCustomerId) {
          setSelectedCustomerId(formattedCustomers[0].id)
        }
      } catch (error) {
        console.error('Error loading customers:', error)
        setIsLoading(false)
        toast({
          title: "Error",
          description: "Failed to load customers. Please try again.",
          variant: "destructive"
        })
      }
    }
    
    loadCustomers()
  }, [])
  
  // Scroll to bottom of messages when new message is added
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selectedCustomerId, customers])
  
  // Filter customers based on search term
  const filteredCustomers = customers.filter(customer => 
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.formattedPhone.includes(searchTerm)
  )
  
  // Get selected customer
  const selectedCustomer = customers.find(c => c.id === selectedCustomerId)
  
  // Handle sending a message
  const handleSendMessage = async () => {
    if (!messageText.trim() || !selectedCustomerId) return
    
    const customer = customers.find(c => c.id === selectedCustomerId)
    if (!customer?.phone) {
      toast({
        title: "No phone number",
        description: "This customer doesn't have a phone number.",
        variant: "destructive"
      })
      return
    }
    
    try {
      // Create a temporary message to show immediately
      const tempMessage: ChatMessage = {
        id: `temp-${Date.now()}`,
        customerId: selectedCustomerId,
        content: messageText,
        timestamp: new Date(),
        isIncoming: false
      }
      
      // Add message to UI immediately
      setCustomers(prev => 
        prev.map(c => 
          c.id === selectedCustomerId 
            ? { ...c, messages: [...c.messages, tempMessage] } 
            : c
        )
      )
      
      // Clear input
      setMessageText('')
      
      // Send message to API
      const res = await fetch('/api/marketing/whatsapp/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerId: selectedCustomerId,
          message: messageText,
          phone: customer.phone
        }),
      })
      
      if (!res.ok) throw new Error('Failed to send message')
      
      // Update with actual message from API
      const sentMessage = await res.json()
      
      // Replace temp message with actual message
      setCustomers(prev => 
        prev.map(c => 
          c.id === selectedCustomerId 
            ? { 
                ...c, 
                messages: c.messages
                  .filter(m => m.id !== tempMessage.id)
                  .concat(sentMessage) 
              } 
            : c
        )
      )
    } catch (error) {
      console.error('Error sending message:', error)
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      })
      
      // Remove temp message on error
      setCustomers(prev => 
        prev.map(c => 
          c.id === selectedCustomerId 
            ? { ...c, messages: c.messages.filter(m => !m.id.startsWith('temp-')) } 
            : c
        )
      )
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
                  key={customer.id}
                  className={`flex items-center p-3 cursor-pointer hover:bg-muted/50 ${selectedCustomerId === customer.id ? 'bg-muted' : ''}`}
                  onClick={() => setSelectedCustomerId(customer.id)}
                >
                  <Avatar className="h-10 w-10 mr-3">
                    <AvatarFallback>{customer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline">
                      <p className="font-medium truncate">{customer.name}</p>
                      {customer.messages.length > 0 && (
                        <span className="text-xs text-muted-foreground">
                          {formatTime(customer.messages[customer.messages.length - 1].timestamp)}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground truncate">
                      {customer.messages.length > 0 
                        ? customer.messages[customer.messages.length - 1].content
                        : customer.formattedPhone || 'No phone number'}
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
                <AvatarFallback>{selectedCustomer.name.substring(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium">{selectedCustomer.name}</p>
                <p className="text-xs text-muted-foreground">
                  {selectedCustomer.formattedPhone || 'No phone number'}
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
                      className={`flex ${message.isIncoming ? 'justify-start' : 'justify-end'}`}
                    >
                      <div
                        className={`max-w-[70%] px-4 py-2 rounded-lg ${
                          message.isIncoming
                            ? 'bg-muted text-foreground'
                            : 'bg-primary text-primary-foreground'
                        }`}
                      >
                        <p>{message.content}</p>
                        <p className={`text-xs mt-1 ${
                          message.isIncoming
                            ? 'text-muted-foreground'
                            : 'text-primary-foreground/70'
                        }`}>
                          {formatTime(message.timestamp)}
                        </p>
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