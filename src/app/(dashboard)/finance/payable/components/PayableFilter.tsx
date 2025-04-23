"use client";

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Search, CalendarIcon, X } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface FilterValues {
  search: string;
  vendorId: string;
  dueDateStart?: Date;
  dueDateEnd?: Date;
}

interface PayableFilterProps {
  onFilterChange?: (filters: FilterValues) => void;
  onSearch?: (query: string) => void;
  initialVendorId?: string | number | null;
  initialStatus?: string | null;
  initialDueDateStart?: Date | null;
  initialDueDateEnd?: Date | null;
  initialSearchQuery?: string;
}

interface Vendor {
  id: string;
  name: string;
}

export function PayableFilter({ 
  onFilterChange,
  onSearch,
  initialVendorId = '',
  initialStatus = '',
  initialDueDateStart,
  initialDueDateEnd,
  initialSearchQuery = ''
}: PayableFilterProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [search, setSearch] = useState(initialSearchQuery || '');
  const [vendorId, setVendorId] = useState(initialVendorId?.toString() || '');
  const [dueDateStart, setDueDateStart] = useState<Date | undefined>(initialDueDateStart || undefined);
  const [dueDateEnd, setDueDateEnd] = useState<Date | undefined>(initialDueDateEnd || undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch vendors for dropdown
  useEffect(() => {
    const fetchVendors = async () => {
      try {
        const response = await fetch('/api/vendors');
        if (response.ok) {
          const data = await response.json();
          setVendors(data.vendors || []);
        }
      } catch (error) {
        console.error('Error fetching vendors:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchVendors();
  }, []);

  // Apply filters
  const applyFilters = () => {
    const filters = {
      search,
      vendorId,
      dueDateStart,
      dueDateEnd,
    };
    
    if (onFilterChange) {
      onFilterChange(filters);
    }
    
    if (onSearch) {
      onSearch(search);
    }
  };

  // Reset filters
  const resetFilters = () => {
    setSearch('');
    setVendorId('');
    setDueDateStart(undefined);
    setDueDateEnd(undefined);
    
    const emptyFilters = {
      search: '',
      vendorId: '',
      dueDateStart: undefined,
      dueDateEnd: undefined,
    };
    
    if (onFilterChange) {
      onFilterChange(emptyFilters);
    }
    
    if (onSearch) {
      onSearch('');
    }
  };

  return (
    <div className="flex flex-wrap gap-2 items-center">
      <div className="relative max-w-xs">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Search bills..."
          className="pl-8 max-w-[200px]"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <Select value={vendorId} onValueChange={setVendorId}>
        <SelectTrigger className="w-[200px]">
          <SelectValue placeholder="Select vendor" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All vendors</SelectItem>
          {vendors.map((vendor) => (
            <SelectItem key={vendor.id} value={vendor.id}>
              {vendor.name}
            </SelectItem>
          ))}
          {isLoading && <SelectItem value="loading" disabled>Loading vendors...</SelectItem>}
        </SelectContent>
      </Select>

      <div className="flex gap-2">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !dueDateStart && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDateStart ? format(dueDateStart, "PPP") : "Due date from"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDateStart}
              onSelect={setDueDateStart}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-[180px] justify-start text-left font-normal",
                !dueDateEnd && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dueDateEnd ? format(dueDateEnd, "PPP") : "Due date to"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0">
            <Calendar
              mode="single"
              selected={dueDateEnd}
              onSelect={setDueDateEnd}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      <Button variant="secondary" onClick={applyFilters}>
        Apply Filters
      </Button>
      
      <Button variant="ghost" size="icon" onClick={resetFilters} title="Reset filters">
        <X className="h-4 w-4" />
      </Button>
    </div>
  );
} 