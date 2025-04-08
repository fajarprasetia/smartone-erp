"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { MultiSelect } from "@/components/ui/multi-select";
import { toast } from "@/components/ui/use-toast";
import { Role } from "@prisma/client";

const formSchema = z.object({
  title: z.string().min(2, {
    message: "Title must be at least 2 characters.",
  }),
  description: z.string().optional(),
  component: z.string().min(2, {
    message: "Component must be at least 2 characters.",
  }),
  roleIds: z.array(z.string()).min(1, {
    message: "Select at least one role.",
  }),
});

interface DashboardCardFormProps {
  roles: Role[];
}

export function DashboardCardForm({ roles }: DashboardCardFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      component: "",
      roleIds: [],
    },
  });

  const roleOptions = roles.map((role) => ({
    label: role.name,
    value: role.id,
  }));

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsLoading(true);

    try {
      const response = await fetch("/api/settings/dashboard-cards", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      if (!response.ok) {
        throw new Error("Failed to create dashboard card");
      }

      toast({
        title: "Success",
        description: "Dashboard card created successfully.",
      });

      form.reset();
      router.refresh();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create dashboard card. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Enter card title" {...field} />
              </FormControl>
              <FormDescription>
                The title of the dashboard card.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Enter card description" {...field} />
              </FormControl>
              <FormDescription>
                A brief description of the dashboard card.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="component"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Component</FormLabel>
              <FormControl>
                <Input placeholder="Enter component name" {...field} />
              </FormControl>
              <FormDescription>
                The component name to render on the dashboard.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="roleIds"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Roles</FormLabel>
              <FormControl>
                <MultiSelect
                  options={roleOptions}
                  selected={field.value}
                  onChange={field.onChange}
                  placeholder="Select roles"
                />
              </FormControl>
              <FormDescription>
                Select which roles can see this dashboard card.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Creating..." : "Create Dashboard Card"}
        </Button>
      </form>
    </Form>
  );
} 