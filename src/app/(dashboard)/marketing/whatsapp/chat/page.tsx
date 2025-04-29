"use client";

import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Search, Send, Loader2, MessageSquare, Plus } from "lucide-react";
import { formatDate, formatTime } from "@/lib/utils";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface CustomerContact {
  id: string;
  name: string;
  phoneNumber: string;
  avatar?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
}

interface Message {
  id: string;
  content: string;
  timestamp: Date;
  isSent: boolean;
  status: "sent" | "delivered" | "read" | "failed";
}

interface Template {
  id: string;
  name: string;
  description: string;
  parameterCount: number;
}

function WhatsAppChatContent() {
  const searchParams = useSearchParams();
  const contactId = searchParams.get("contact");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  const [contacts, setContacts] = useState<CustomerContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<CustomerContact | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateDialogOpen, setTemplateDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [templateParams, setTemplateParams] = useState<string[]>([]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch customers for WhatsApp contacts
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setIsLoading(true);
        const res = await fetch('/api/marketing/customers', { cache: 'no-store' });
        
        if (!res.ok) {
          throw new Error('Failed to fetch customers');
        }
        
        const customers = await res.json();
        
        // Convert customers to chat contacts format
        const contacts: CustomerContact[] = customers
          .filter((customer: any) => customer.telp) // Only use customers with phone numbers
          .map((customer: any) => ({
            id: customer.id,
            name: customer.nama,
            phoneNumber: customer.telp.startsWith('62') ? customer.telp : `62${customer.telp}`,
          }));
          
        setContacts(contacts);
        
        // If contactId is provided in URL, select that contact
        if (contactId) {
          const selectedContact = contacts.find(c => c.id === contactId);
          if (selectedContact) {
            setSelectedContact(selectedContact);
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching customers:", error);
        toast.error("Failed to load customer contacts");
        setIsLoading(false);
      }
    };
    
    fetchCustomers();
  }, [contactId]);

  // Fetch templates from WhatsApp Business Platform
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        // Fetch templates from the API endpoint with proper error handling
        const response = await fetch('/api/marketing/whatsapp/templates', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
          cache: 'no-store'
        });
        
        if (!response.ok) {
          const errorData = await response.text();
          console.error('Template fetch response not OK:', response.status, errorData);
          throw new Error(`Failed to fetch templates: ${response.status} ${errorData}`);
        }
        
        const data = await response.json();
        
        if (!Array.isArray(data)) {
          console.error('Template data is not an array:', data);
          throw new Error('Template data format is invalid');
        }
        
        // Format templates to match our interface
        const formattedTemplates: Template[] = data.map((template: any) => {
          // Count parameters in components
          let paramCount = 0;
          if (template.components && Array.isArray(template.components)) {
            for (const component of template.components) {
              if (component.text) {
                // Count occurrences of {{n}} where n is a number
                const matches = component.text.match(/\{\{[0-9]+\}\}/g);
                if (matches) {
                  paramCount = Math.max(paramCount, matches.length);
                }
              }
            }
          }
          
          return {
            id: template.id,
            name: template.name,
            description: template.language || "en",
            parameterCount: paramCount,
          };
        });
        
        setTemplates(formattedTemplates);
      } catch (error) {
        console.error("Error fetching templates:", error);
        // Show error toast to inform user
        toast.error("Failed to load templates. Please try again later.");
        // Fallback to empty templates array
        setTemplates([]);
      }
    };
    
    fetchTemplates();
  }, []);

  // Fetch chat history when selected contact changes
  useEffect(() => {
    const fetchChatHistory = async () => {
      if (!selectedContact) return;
      
      try {
        // Fetch messages from the API using the correct endpoint
        const response = await fetch(`/api/marketing/whatsapp/chats/${selectedContact.id}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch messages');
        }
        
        const data = await response.json();
        
        // Format messages to match our interface
        const formattedMessages: Message[] = data.map((msg: any) => ({
          id: msg.id,
          content: msg.content,
          timestamp: new Date(msg.timestamp || msg.createdAt),
          isSent: !msg.isIncoming,
          status: msg.status || "sent",
        }));
        
        setMessages(formattedMessages);
        // Scroll to bottom after messages load
        setTimeout(scrollToBottom, 100);
      } catch (error) {
        console.error("Error fetching chat history:", error);
        toast.error("Failed to load chat history");
        // If API fails, set empty messages
        setMessages([]);
      }
    };
    
    fetchChatHistory();
  }, [selectedContact]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedContact || isSending) return;

    setIsSending(true);
    const messageContent = newMessage.trim();

    try {
      // Use the correct API endpoint
      const response = await fetch("/api/marketing/whatsapp/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedContact.id,
          phoneNumber: selectedContact.phoneNumber,
          message: messageContent,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send message");
      }
      
      // Get the message data from the response
      const data = await response.json();
      
      // Create a temporary message object for the UI
      const newMessageObj: Message = {
        id: data.message?.id || `temp-${Date.now()}`,
        content: messageContent,
        timestamp: new Date(),
        isSent: true,
        status: "sent",
      };

      setMessages((prev) => [...prev, newMessageObj]);
      setNewMessage("");
      
      // Scroll to bottom to show the new message
      setTimeout(scrollToBottom, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      toast.error("Failed to send message");
    } finally {
      setIsSending(false);
    }
  };

  const handleSendTemplate = async () => {
    if (!selectedContact || !selectedTemplate) return;
    
    setIsSending(true);
    
    try {
      // Get the selected template
      const template = templates.find(t => t.id === selectedTemplate);
      
      if (!template) {
        throw new Error("Selected template not found");
      }
      
      // Send the template message via API
      const response = await fetch("/api/marketing/whatsapp/send-template", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          customerId: selectedContact.id,
          phoneNumber: selectedContact.phoneNumber,
          templateName: template.name,
          parameters: templateParams,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send template message");
      }
      
      // Get the response data
      const data = await response.json();
      
      // Create a message object to display in the chat
      const content = data.message?.content || `[Template: ${template.name}]${templateParams.length > 0 ? ` With params: ${templateParams.join(", ")}` : ''}`;
      
      const newMessageObj: Message = {
        id: data.message?.id || `temp-${Date.now()}`,
        content: content,
        timestamp: new Date(),
        isSent: true,
        status: "sent",
      };

      setMessages((prev) => [...prev, newMessageObj]);
      
      // Close dialog and reset form
      setTemplateDialogOpen(false);
      setSelectedTemplate("");
      setTemplateParams([]);
      
      // Scroll to bottom to show the new message
      setTimeout(scrollToBottom, 100);
      
      toast.success("Template message sent successfully!");
    } catch (error) {
      console.error("Error sending template message:", error);
      toast.error("Failed to send template message");
    } finally {
      setIsSending(false);
    }
  };

  const filteredContacts = contacts.filter((contact) =>
    contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    contact.phoneNumber.includes(searchQuery)
  );

  const selectedTemplateObj = templates.find(t => t.id === selectedTemplate);

  return (
    <div className="h-[calc(100vh-8rem)] p-0">
      <div className="h-full flex flex-col rounded-lg border bg-white/20 dark:bg-white/5 backdrop-blur-xl border-white/30 dark:border-white/10 shadow-lg overflow-hidden">
        <div className="flex h-full">
          {/* Sidebar - Made more compact */}
          <div className="w-56 border-r border-white/20 dark:border-white/10 p-0.5 flex flex-col">
            <div className="mb-0.5">
              <div className="relative">
                <Input
                  placeholder="Search contacts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10 h-6 text-xs pl-6"
                />
                <Search className="absolute left-1.5 top-1/2 transform -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              </div>
            </div>
            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex justify-center items-center h-12">
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />
                </div>
              ) : filteredContacts.length === 0 ? (
                <div className="flex justify-center items-center h-12 text-xs text-muted-foreground">
                  No contacts found
                </div>
              ) : (
                <div className="space-y-0.5 pr-0.5">
                  {filteredContacts.map((contact) => (
                    <div
                      key={contact.id}
                      className={cn(
                        "flex items-center gap-1 rounded-md p-0.5 cursor-pointer hover:bg-white/10 dark:hover:bg-white/5 transition-colors",
                        selectedContact?.id === contact.id && "bg-white/10 dark:bg-white/5"
                      )}
                      onClick={() => setSelectedContact(contact)}
                    >
                      <Avatar className="h-5 w-5 border border-white/20">
                        <AvatarFallback className="text-[9px]">
                          {contact.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[10px] truncate">
                          {contact.name}
                        </p>
                        <p className="text-[8px] text-muted-foreground">
                          {contact.phoneNumber}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className="flex-1 flex flex-col bg-white/5 dark:bg-black/10 backdrop-blur-sm overflow-hidden">
            {selectedContact ? (
              <>
                {/* Contact Header - Made more compact */}
                <div className="border-b border-white/20 dark:border-white/10 py-0.5 px-1.5">
                  <div className="flex items-center gap-1">
                    <Avatar className="h-5 w-5 border border-white/20">
                      <AvatarFallback className="text-[9px]">
                        {selectedContact.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium text-[10px]">{selectedContact.name}</p>
                      <p className="text-[8px] text-muted-foreground">
                        {selectedContact.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chat Messages - Fixed positioning to fill the container properly */}
                <div 
                  className="flex-1 overflow-auto p-1.5 bg-slate-50/10 dark:bg-slate-900/20 flex flex-col justify-end"
                >
                  {messages.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center">
                      <p className="text-[10px] text-center text-muted-foreground bg-white/10 dark:bg-black/20 backdrop-blur-sm py-0.5 px-2 rounded-full">
                        Send a message to start the conversation
                      </p>
                    </div>
                  ) : (
                    <div className="flex-1 flex flex-col justify-end">
                      <div className="flex flex-col space-y-1">
                        {messages.map((message, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex",
                              message.isSent ? "justify-end" : "justify-start"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-[70%] rounded-lg py-0.5 px-1.5",
                                message.isSent
                                  ? "bg-[#d9fdd3] text-gray-800 dark:bg-[#005c4b] dark:text-gray-100"
                                  : "bg-white text-gray-800 dark:bg-[#202c33] dark:text-gray-100"
                              )}
                            >
                              <p className="text-[10px]">{message.content}</p>
                              <div className="flex justify-end items-center gap-0.5 mt-0.5">
                                <p className="text-[8px] text-gray-500 dark:text-gray-400">
                                  {formatTime(message.timestamp)}
                                </p>
                                {message.isSent && (
                                  <span className="text-[8px]">
                                    {message.status === "sent" && "✓"}
                                    {message.status === "delivered" && "✓✓"}
                                    {message.status === "read" && (
                                      <span className="text-blue-600 dark:text-blue-400">✓✓</span>
                                    )}
                                    {message.status === "failed" && (
                                      <span className="text-red-500">!</span>
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                        <div ref={messagesEndRef} />
                      </div>
                    </div>
                  )}
                </div>

                {/* Message Input Box - Made more compact */}
                <div className="border-t border-white/20 dark:border-white/10 p-0.5 bg-white/10 dark:bg-black/20">
                  <div className="flex gap-0.5">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-6 w-6 p-0 bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10"
                      onClick={() => setTemplateDialogOpen(true)}
                      title="Send template message"
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Input
                      placeholder="Type a message..."
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSendMessage()}
                      className="h-6 text-[10px] bg-white/10 dark:bg-black/20 border-white/20 dark:border-white/10"
                    />
                    <Button 
                      onClick={handleSendMessage} 
                      disabled={isSending || !newMessage.trim()}
                      className="h-6 w-6 p-0 rounded-full bg-primary/90 hover:bg-primary/80"
                      size="icon"
                    >
                      {isSending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Send className="h-3 w-3" />}
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center h-full">
                <div className="text-center p-3 max-w-xs">
                  <div className="bg-white/10 dark:bg-black/20 backdrop-blur-md p-3 rounded-lg">
                    <MessageSquare className="h-8 w-8 mx-auto mb-1.5 text-muted-foreground" />
                    <h3 className="text-xs font-medium mb-0.5">Select a contact</h3>
                    <p className="text-[10px] text-muted-foreground">
                      Choose a contact from the sidebar to start messaging
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Template Dialog - Fixed positioning to appear in the middle of viewport */}
      <Dialog open={templateDialogOpen} onOpenChange={setTemplateDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Send Template Message</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label htmlFor="template" className="text-xs font-medium">
                Select Template
              </label>
              <Select
                value={selectedTemplate}
                onValueChange={value => {
                  setSelectedTemplate(value);
                  // Reset params array with empty strings based on parameter count
                  const template = templates.find(t => t.id === value);
                  if (template) {
                    setTemplateParams(Array(template.parameterCount).fill(""));
                  }
                }}
              >
                <SelectTrigger className="h-7 text-xs">
                  <SelectValue placeholder="Select a template" />
                </SelectTrigger>
                <SelectContent>
                  {templates.map(template => (
                    <SelectItem key={template.id} value={template.id} className="text-xs">
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTemplateObj && selectedTemplateObj.parameterCount > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-medium">Template Parameters</p>
                {Array.from({ length: selectedTemplateObj.parameterCount }).map((_, index) => (
                  <div key={index} className="space-y-0.5">
                    <label className="text-[10px] font-medium">
                      Parameter {index + 1}
                    </label>
                    <Input
                      value={templateParams[index] || ""}
                      onChange={e => {
                        const newParams = [...templateParams];
                        newParams[index] = e.target.value;
                        setTemplateParams(newParams);
                      }}
                      placeholder={`Enter parameter ${index + 1}`}
                      className="h-7 text-xs"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTemplateDialogOpen(false)}
              className="h-7 text-xs"
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSendTemplate}
              disabled={!selectedTemplate || isSending}
              className="h-7 text-xs"
            >
              {isSending ? (
                <>
                  <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="mr-1.5 h-3 w-3" />
                  Send Template
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function WhatsAppChatPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <WhatsAppChatContent />
    </Suspense>
  );
}