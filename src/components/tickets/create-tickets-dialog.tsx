"use client";

// Create tickets — the ip-tickets service action on the collection page.
// One transaction: pins the ticket metadata to IPFS, then calls create_ticket
// on the (immutable) collection. Everything the ticket is — supply, validity
// window, royalty, metadata — is permanent on-chain once created.

import { useState, useRef, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Image from "next/image";
import { Ticket, Loader2, ImagePlus, X, ShieldCheck, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { Contract, cairo, type Abi } from "starknet";
import { normalizeAddress, IPTicketCollectionABI } from "@medialane/sdk";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useWriteAction } from "@/hooks/use-write-action";
import { TransactionDialog } from "@/components/transaction/transaction-dialog";
import { WalletSetupGate } from "@/components/transaction/wallet-setup-gate";
import { uploadImageToIpfs } from "@/lib/upload-image";
import { rewardToast } from "@/lib/reward-toast";
import { starknetProvider } from "@/lib/starknet";
import { cn } from "@/lib/utils";
import { LICENSE_TYPES, GEOGRAPHIC_SCOPES, AI_POLICIES, DERIVATIVES_OPTIONS } from "@/types/ip";

const schema = z.object({
  name: z.string().min(1, "Ticket name required").max(100),
  description: z.string().max(1000).optional(),
  external_url: z
    .string()
    .max(500)
    .refine((v) => !v || v.startsWith("http://") || v.startsWith("https://"), {
      message: "Must start with http:// or https://",
    })
    .optional(),
  maxSupply: z
    .string()
    .min(1, "Supply required")
    .regex(/^\d+$/, "Must be a positive integer")
    .refine((v) => parseInt(v, 10) >= 1, "Minimum supply is 1"),
  royalty: z.coerce.number().min(0).max(50).default(2.5),
  licenseType: z.string().min(1),
  commercialUse: z.enum(["Yes", "No"]),
  derivatives: z.enum(["Allowed", "Not Allowed", "Share-Alike"]),
  attribution: z.enum(["Required", "Not Required"]),
  geographicScope: z.string(),
  aiPolicy: z.enum(["Allowed", "Not Allowed", "Training Only"]),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});
type FormValues = z.infer<typeof schema>;

function dateToUnixTimestamp(dateStr: string | undefined): number | undefined {
  if (!dateStr) return undefined;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return undefined;
  return Math.floor(d.getTime() / 1000);
}

function ToggleGroup({
  value,
  options,
  onChange,
}: {
  value: string;
  options: readonly string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-border overflow-hidden w-full">
      {options.map((opt, i) => (
        <button
          key={opt}
          type="button"
          onClick={() => onChange(opt)}
          className={cn(
            "flex-1 px-3 py-2 text-sm transition-colors",
            i > 0 && "border-l border-border",
            value === opt
              ? "bg-primary text-primary-foreground font-medium"
              : "bg-background hover:bg-muted text-muted-foreground"
          )}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export function CreateTicketsDialog({
  contractAddress,
  open,
  onOpenChange,
  onCreated,
}: {
  contractAddress: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Called from the success state — the mint flow reopens with the fresh list. */
  onCreated?: () => void;
}) {
  const contract = normalizeAddress("STARKNET", contractAddress);
  const action = useWriteAction();

  const [licensingOpen, setLicensingOpen] = useState(false);
  const [advancedOpen, setAdvancedOpen] = useState(false);

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageUploading, setImageUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      description: "",
      external_url: "",
      maxSupply: "100",
      royalty: 2.5,
      licenseType: "CC BY-SA",
      commercialUse: "Yes",
      derivatives: "Share-Alike",
      attribution: "Required",
      geographicScope: "Worldwide",
      aiPolicy: "Not Allowed",
    },
  });

  const handleCreateMore = () => {
    action.reset();
    form.reset({ ...form.getValues(), name: "", description: "", maxSupply: "100" });
    setImagePreview(null);
    setImageUri(null);
  };

  const handleDone = () => {
    action.reset();
    if (onCreated) {
      onCreated();
    } else {
      onOpenChange(false);
    }
  };

  const handleLicenseChange = (value: string) => {
    form.setValue("licenseType", value);
    const def = LICENSE_TYPES.find((l) => l.value === value);
    if (def) {
      form.setValue("commercialUse", def.commercialUse);
      form.setValue("derivatives", def.derivatives);
      form.setValue("attribution", def.attribution);
    }
  };

  const handleImageSelect = async (file: File) => {
    if (file.size > 10 * 1024 * 1024) { toast.error("Max 10 MB"); return; }
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const url = URL.createObjectURL(file);
    previewRef.current = url;
    setImagePreview(url);
    setImageUri(null);
    setImageUploading(true);
    try {
      const uri = await uploadImageToIpfs(file);
      setImageUri(uri);
      toast.success("Image uploaded");
    } catch (err) {
      if (previewRef.current) { URL.revokeObjectURL(previewRef.current); previewRef.current = null; }
      setImagePreview(null);
      toast.error("Image upload failed", { description: err instanceof Error ? err.message : undefined });
    } finally {
      setImageUploading(false);
    }
  };

  const onSubmit = (values: FormValues) => {
    if (!imageUri) { toast.error("Upload a ticket image first"); return; }
    // Pass `values` through the closure (synchronous-passkey rule).
    void action.run((secret) => handleUnlocked(values, secret));
  };

  const handleUnlocked = async (values: FormValues, secret: string) => {
    // Pin the ticket metadata first — it goes on-chain in the same action, so a
    // failed pin is fatal.
    const metadataForm = new FormData();
    metadataForm.set("name", values.name);
    metadataForm.set("description", values.description ?? "");
    metadataForm.set("imageUri", imageUri!);
    if (values.external_url) metadataForm.set("external_url", values.external_url);
    metadataForm.set("ipType", "NFT");
    metadataForm.set("licenseType", values.licenseType);
    metadataForm.set("commercialUse", values.commercialUse);
    metadataForm.set("derivatives", values.derivatives);
    metadataForm.set("attribution", values.attribution);
    metadataForm.set("geographicScope", values.geographicScope);
    metadataForm.set("aiPolicy", values.aiPolicy);
    metadataForm.set("royalty", String(values.royalty));
    metadataForm.append("tmpl_Type", "IP Ticket");
    metadataForm.append("tmpl_Token Standard", "ERC-1155");
    metadataForm.append("tmpl_Max Supply", values.maxSupply);
    metadataForm.append("tmpl_Collection Contract", contract);

    const uploadRes = await fetch("/api/pinata", { method: "POST", body: metadataForm });
    const uploadData = await uploadRes.json();
    if (!uploadRes.ok || uploadData.error || !uploadData.uri) {
      throw new Error(uploadData.error ?? "Metadata upload failed");
    }
    const metadataUri: string = uploadData.uri;

    const startTime = dateToUnixTimestamp(values.startDate);
    const endTime = dateToUnixTimestamp(values.endDate);
    const royaltyBps = Math.round(values.royalty * 100);

    const col = new Contract(IPTicketCollectionABI as unknown as Abi, contract, starknetProvider);
    const call = col.populate("create_ticket", [
      cairo.uint256(values.maxSupply),
      startTime != null ? { Some: startTime } : { None: undefined },
      endTime != null ? { Some: endTime } : { None: undefined },
      royaltyBps,
      metadataUri,
    ]);

    const result = await action.executeTransaction({
      pin: secret,
      calls: [{ contractAddress: contract, entrypoint: "create_ticket", calldata: call.calldata as string[] }],
    });
    if (result.status !== "confirmed") {
      throw new Error(result.revertReason ?? "Transaction reverted");
    }
    rewardToast("launch_launchpad");
    return result;
  };

  return (
    <>
      <TransactionDialog
        action={action}
        title="Create tickets"
        processingLabel="Creating tickets…"
        firstStepLabel="Upload ticket metadata"
        successTitle="Tickets created!"
        pinDescription="Enter your PIN to create these tickets on-chain."
      >
        <p className="text-sm text-muted-foreground text-center">
          <span className="font-medium text-foreground">{form.getValues("name") || "Your tickets"}</span> are
          live — mint them to your audience whenever you&apos;re ready.
        </p>
        {imagePreview && (
          <div className="h-24 w-24 rounded-xl overflow-hidden border border-border shadow-md">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imagePreview} alt={form.getValues("name")} className="h-full w-full object-cover" />
          </div>
        )}
        <div className="flex flex-col sm:flex-row gap-2 w-full pt-1">
          <Button variant="outline" className="flex-1" onClick={handleCreateMore}>
            Create more tickets
          </Button>
          <Button className="flex-1 bg-teal-600 hover:bg-teal-700 text-white" onClick={handleDone}>
            {onCreated ? "Mint these tickets" : "Done"}
          </Button>
        </div>
      </TransactionDialog>
      <WalletSetupGate action={action} />

      <Dialog open={open && action.status === "idle"} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Ticket className="h-4 w-4 text-teal-500" />
              Create tickets
            </DialogTitle>
            <DialogDescription>
              Set supply, an optional validity window, and royalty — permanent, on-chain.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">

              {/* Image */}
              <div className="space-y-2">
                <p className="text-sm font-medium">
                  Ticket image <span className="text-destructive">*</span>
                </p>
                <div className="flex items-center gap-4">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => !imageUploading && fileInputRef.current?.click()}
                    onKeyDown={(e) => { if (e.key === "Enter") fileInputRef.current?.click(); }}
                    className="relative h-20 w-20 rounded-2xl border-2 border-dashed border-border bg-muted flex items-center justify-center overflow-hidden shrink-0 cursor-pointer hover:border-teal-500/50 transition-colors"
                  >
                    {imagePreview
                      ? <Image src={imagePreview} alt="Ticket" fill className="object-cover" />
                      : <ImagePlus className="h-6 w-6 text-muted-foreground" />}
                    {imageUploading && (
                      <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                        <Loader2 className="h-4 w-4 animate-spin" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleImageSelect(f); }} />
                    <Button type="button" variant="outline" size="sm" disabled={imageUploading}
                      onClick={() => fileInputRef.current?.click()}>
                      {imageUploading
                        ? <><Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />Uploading…</>
                        : imagePreview ? "Change" : "Upload image"}
                    </Button>
                    {imagePreview && (
                      <button type="button" onClick={() => { setImagePreview(null); setImageUri(null); }}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors">
                        <X className="h-3 w-3" /> Remove
                      </button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {imageUri
                        ? <span className="text-teal-500">✓ Uploaded</span>
                        : "JPG, PNG, SVG or WebP · max 10 MB"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Name */}
              <FormField control={form.control} name="name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Ticket name <span className="text-destructive">*</span></FormLabel>
                  <FormControl><Input placeholder="Summer Concert 2026 — General Admission" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Description */}
              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel>Description <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Textarea placeholder="What does this ticket admit or unlock?" rows={3} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* External URL */}
              <FormField control={form.control} name="external_url" render={({ field }) => (
                <FormItem>
                  <FormLabel>External link <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                  <FormControl>
                    <Input placeholder="https://yourwebsite.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              {/* Licensing */}
              <Collapsible open={licensingOpen} onOpenChange={setLicensingOpen}>
                <div className="sm:overflow-hidden sm:rounded-xl sm:border sm:border-border">
                  <CollapsibleTrigger asChild>
                    <button
                      type="button"
                      className="w-full flex items-center justify-between px-0 py-3 sm:px-5 sm:py-4 hover:bg-muted/30 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold">Licensing Terms</span>
                        <span className="text-xs text-muted-foreground font-normal">Optional · Berne Convention</span>
                      </div>
                      <ChevronDown className={cn("h-4 w-4 text-muted-foreground transition-transform", licensingOpen && "rotate-180")} />
                    </button>
                  </CollapsibleTrigger>
                  <CollapsibleContent>
                    <div className="px-0 pb-4 sm:px-5 sm:pb-5 space-y-4 border-t border-border/60 pt-4">
                      <p className="text-xs text-muted-foreground">
                        Set how others can use this IP — saved permanently with it.
                      </p>
                      <FormField control={form.control} name="licenseType" render={({ field }) => (
                        <FormItem>
                          <FormLabel>License</FormLabel>
                          <Select value={field.value} onValueChange={handleLicenseChange}>
                            <FormControl>
                              <SelectTrigger><SelectValue /></SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {LICENSE_TYPES.map((l) => (
                                <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          {(() => {
                            const def = LICENSE_TYPES.find((l) => l.value === field.value);
                            return def ? <p className="text-xs text-muted-foreground mt-1">{def.description}</p> : null;
                          })()}
                          <FormMessage />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="commercialUse" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commercial Use</FormLabel>
                          <ToggleGroup value={field.value} options={["Yes", "No"]} onChange={field.onChange} />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="derivatives" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Derivatives</FormLabel>
                          <ToggleGroup value={field.value} options={DERIVATIVES_OPTIONS} onChange={field.onChange} />
                        </FormItem>
                      )} />
                      <FormField control={form.control} name="attribution" render={({ field }) => (
                        <FormItem>
                          <FormLabel>Attribution</FormLabel>
                          <ToggleGroup value={field.value} options={["Required", "Not Required"]} onChange={field.onChange} />
                        </FormItem>
                      )} />
                      <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <ChevronDown className={cn("h-3.5 w-3.5 transition-transform", advancedOpen && "rotate-180")} />
                            Advanced options
                          </button>
                        </CollapsibleTrigger>
                        <CollapsibleContent className="space-y-4 pt-3">
                          <FormField control={form.control} name="geographicScope" render={({ field }) => (
                            <FormItem>
                              <FormLabel>Territory</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger><SelectValue /></SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  {GEOGRAPHIC_SCOPES.map((s) => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </FormItem>
                          )} />
                          <FormField control={form.control} name="aiPolicy" render={({ field }) => (
                            <FormItem>
                              <FormLabel>AI &amp; Data Mining</FormLabel>
                              <ToggleGroup value={field.value} options={AI_POLICIES} onChange={field.onChange} />
                            </FormItem>
                          )} />
                        </CollapsibleContent>
                      </Collapsible>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>

              {/* Supply + Royalty */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="maxSupply" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max supply <span className="text-destructive">*</span></FormLabel>
                    <FormControl>
                      <Input type="number" min="1" placeholder="100" {...field} />
                    </FormControl>
                    <FormDescription>Total tickets available.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="royalty" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Royalty % (0–50)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={0}
                        max={50}
                        step={0.5}
                        placeholder="2.5"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>On secondary sales.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Validity window */}
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="startDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid from <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="endDate" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valid until <span className="text-muted-foreground font-normal">(optional)</span></FormLabel>
                    <FormControl><Input type="datetime-local" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={action.status !== "idle" || imageUploading}
                className="w-full bg-teal-600 hover:bg-teal-700 text-white"
              >
                <Ticket className="h-4 w-4 mr-2" />
                Create tickets
              </Button>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  );
}
