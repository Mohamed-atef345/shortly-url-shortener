"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { Loader2, Link as LinkIcon, Plus } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/providers/AuthProvider";
import { API_ENDPOINTS } from "@/lib/config";

const createUrlSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  customSlug: z.string().min(3).optional().or(z.literal("")),
});

export function CreateUrlModal({ trigger }: { trigger?: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const queryClient = useQueryClient();
  const { token } = useAuth();

  const form = useForm<z.infer<typeof createUrlSchema>>({
    resolver: zodResolver(createUrlSchema),
    defaultValues: {
      url: "",
      customSlug: "",
    },
  });

  async function onSubmit(values: z.infer<typeof createUrlSchema>) {
    setIsLoading(true);
    try {
      // Only include customSlug if it's not empty
      const payload: { url: string; customSlug?: string } = {
        url: values.url,
      };
      if (values.customSlug && values.customSlug.trim() !== "") {
        payload.customSlug = values.customSlug.trim();
      }

      const res = await fetch(API_ENDPOINTS.urls.create, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || data.error || "Failed to create URL");
      }

      toast.success("URL created successfully!");
      queryClient.invalidateQueries({ queryKey: ["urls"] });
      setOpen(false);
      form.reset();
    } catch (error: unknown) {
      toast.error(
        error instanceof Error ? error.message : "Failed to create URL",
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold">
            <Plus className="mr-2 h-4 w-4" /> Create New Link
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Link</DialogTitle>
          <DialogDescription>
            Shorten a long URL to share it easily.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="url"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destination URL</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="https://example.com/long-url"
                        {...field}
                        className="pl-9"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="customSlug"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Custom Back-half (Optional)</FormLabel>
                  <FormControl>
                    <div className="flex items-center">
                      <span className="bg-muted px-3 py-2 rounded-l-md border border-r-0 text-sm text-muted-foreground border-input">
                        shortly.io/
                      </span>
                      <Input
                        placeholder="my-link"
                        {...field}
                        className="rounded-l-none"
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isLoading} className="w-full">
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />{" "}
                    Creating...
                  </>
                ) : (
                  "Create Short Link"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
