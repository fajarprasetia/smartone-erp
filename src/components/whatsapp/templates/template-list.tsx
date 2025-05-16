"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { 
  Edit, 
  Eye, 
  MoreHorizontal, 
  Trash2
} from "lucide-react"
import { formatDate } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from "@/components/ui/alert-dialog"
import {
  Badge
} from "@/components/ui/badge"
import { toast } from "sonner"

interface Template {
  id: string
  name: string
  description?: string
  language: string
  components: any
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

interface TemplateListProps {
  initialTemplates?: Template[]
}

export function TemplateList({ initialTemplates = [] }: TemplateListProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<string | null>(null)
  const [templates, setTemplates] = useState<Template[]>(initialTemplates)
  const [isLoading, setIsLoading] = useState(false)

  // Fetch templates if none were provided initially
  useEffect(() => {
    if (initialTemplates.length === 0) {
      fetchTemplates()
    }
  }, [initialTemplates])

  const fetchTemplates = async () => {
    try {
      setIsLoading(true)
      const response = await fetch('/api/marketing/whatsapp/templates')
      
      if (!response.ok) {
        throw new Error('Failed to fetch templates')
      }
      
      const data = await response.json()
      setTemplates(data)
    } catch (error) {
      console.error('Error fetching templates:', error)
      toast.error('Failed to load templates')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = (templateId: string) => {
    setTemplateToDelete(templateId)
    setOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    try {
      setIsLoading(true)
      const response = await fetch(`/api/marketing/whatsapp/templates/${templateToDelete}`, {
        method: "DELETE",
      })

      if (!response.ok) {
        throw new Error('Failed to delete template')
      }

      // Remove the deleted template from the state
      setTemplates(templates.filter(template => template.id !== templateToDelete))
      
      toast.success("Template deleted successfully")
    } catch (error) {
      console.error('Error deleting template:', error)
      toast.error("Failed to delete the template. Please try again.")
    } finally {
      setOpen(false)
      setTemplateToDelete(null)
      setIsLoading(false)
    }
  }

  // Generate a status badge based on isActive property
  const getStatusBadge = (isActive: boolean) => {
    if (isActive) {
      return <Badge className="bg-green-100 text-green-800 dark:bg-green-700 dark:text-green-100">Active</Badge>
    } else {
      return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-700 dark:text-yellow-100">Inactive</Badge>
    }
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Language</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created At</TableHead>
              <TableHead>Updated At</TableHead>
              <TableHead className="w-[70px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  Loading templates...
                </TableCell>
              </TableRow>
            ) : templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>{template.language}</TableCell>
                  <TableCell>{getStatusBadge(template.isActive)}</TableCell>
                  <TableCell>{formatDate(new Date(template.createdAt))}</TableCell>
                  <TableCell>{formatDate(new Date(template.updatedAt))}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Open menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/marketing/whatsapp/templates/${template.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild>
                          <Link href={`/marketing/whatsapp/templates/${template.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 focus:text-red-600"
                          onClick={() => handleDelete(template.id)}
                          disabled={isLoading}
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the template.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
              disabled={isLoading}
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
} 