"use client"

import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react"
import { Button } from "@/components/ui/button"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  maxDisplayed?: number
}

export function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  maxDisplayed = 5,
}: PaginationProps) {
  if (totalPages <= 1) {
    return null
  }

  // Generate the array of page numbers to display
  const getPageNumbers = () => {
    const pageNumbers = []
    const sidePages = Math.floor(maxDisplayed / 2)
    
    let startPage = Math.max(1, currentPage - sidePages)
    let endPage = Math.min(totalPages, startPage + maxDisplayed - 1)
    
    if (endPage - startPage + 1 < maxDisplayed) {
      startPage = Math.max(1, endPage - maxDisplayed + 1)
    }
    
    // Add first page
    if (startPage > 1) {
      pageNumbers.push(1)
      if (startPage > 2) {
        pageNumbers.push("ellipsis1")
      }
    }
    
    // Add pages in the middle
    for (let i = startPage; i <= endPage; i++) {
      pageNumbers.push(i)
    }
    
    // Add last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        pageNumbers.push("ellipsis2")
      }
      pageNumbers.push(totalPages)
    }
    
    return pageNumbers
  }

  const pageNumbers = getPageNumbers()

  return (
    <nav className="flex items-center space-x-1" aria-label="Pagination">
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(Math.max(1, currentPage - 1))}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>
      
      <div className="flex items-center space-x-1">
        {pageNumbers.map((page, index) => {
          if (page === "ellipsis1" || page === "ellipsis2") {
            return (
              <div key={`ellipsis-${index}`} className="flex items-center justify-center">
                <MoreHorizontal className="h-4 w-4" />
              </div>
            )
          }
          
          return (
            <Button
              key={`page-${page}`}
              variant={currentPage === page ? "default" : "outline"}
              size="icon"
              className="h-8 w-8"
              onClick={() => onPageChange(page as number)}
              aria-label={`Page ${page}`}
              aria-current={currentPage === page ? "page" : undefined}
            >
              {page}
            </Button>
          )
        })}
      </div>
      
      <Button
        variant="outline"
        size="icon"
        className="h-8 w-8"
        onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>
    </nav>
  )
} 