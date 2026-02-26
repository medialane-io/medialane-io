"use client";

export const dynamic = "force-dynamic";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { WalletSetupDialog } from "@/components/chipi/wallet-setup-dialog";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { TxStatus } from "@/components/chipi/tx-status";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { useSessionKey } from "@/hooks/use-session-key";
import { COLLECTION_CONTRACT } from "@/lib/constants";
import { Upload, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "sonner";

const IP_TYPES = ["Art", "Music", "Video", "Documents", "Posts", "Patents", "Code", "NFT"] as const;
const LICENSE_TYPES = ["All Rights Reserved", "CC BY", "CC BY-SA", "CC BY-NC", "MIT", "Apache 2.0"] as const;

const schema = z.object({
  name: z.string().min(1, "Name required").max(100),
  description: z.string().max(1000).optional(),
  ipType: z.enum(IP_TYPES),
  licenseType: z.enum(LICENSE_TYPES),
  image: z.instanceof(File).optional(),
});

type FormValues = z.infer<typeof schema>;

export default function CreateAssetPage() {
  const { executeTransaction, status, txHash, error, statusMessage } = useChipiTransaction();
  const { walletAddress, wallet } = useSessionKey();

  const [walletSetupOpen, setWalletSetupOpen] = useState(false);
  const [pinOpen, setPinOpen] = useState(false);
  const [pendingValues, setPendingValues] = useState<FormValues | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const hasWallet = !!walletAddress;

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", description: "", ipType: "Art", licenseType: "All Rights Reserved" },
  });

  const onSubmit = (values: FormValues) => {
    setPendingValues(values);
    if (!hasWallet) {
      setWalletSetupOpen(true);
      return;
    }
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    if (!pendingValues) return;

    try {
      // 1. Upload metadata to IPFS
      const formData = new FormData();
      if (pendingValues.image) formData.append("file", pendingValues.image);
      formData.append("name", pendingValues.name);
      formData.append("description", pendingValues.description || "");
      formData.append("ipType", pendingValues.ipType);
      formData.append("licenseType", pendingValues.licenseType);

      const uploadRes = await fetch("/api/pinata", { method: "POST", body: formData });
      const { uri } = await uploadRes.json();

      if (!uri) throw new Error("IPFS upload failed");

      // 2. Mint via ChipiPay
      const walletOverride = wallet
        ? { publicKey: wallet.publicKey, encryptedPrivateKey: wallet.encryptedPrivateKey }
        : undefined;
      await executeTransaction({
        pin,
        contractAddress: COLLECTION_CONTRACT,
        calls: [
          {
            contractAddress: COLLECTION_CONTRACT,
            entrypoint: "mint",
            calldata: [walletAddress ?? "", uri],
          },
        ],
        wallet: walletOverride,
      });

      toast.success("Asset created!", { description: `${pendingValues.name} has been minted.` });
      form.reset();
      setImagePreview(null);
    } catch (err: any) {
      toast.error("Creation failed", { description: err?.message });
    }
  };

  if (status === "confirmed") {
    return (
      <div className="container max-w-lg mx-auto px-4 py-16 text-center space-y-6">
        <CheckCircle2 className="h-16 w-16 text-emerald-500 mx-auto" />
        <h1 className="text-2xl font-bold">Asset created!</h1>
        <p className="text-muted-foreground">{pendingValues?.name} has been minted on Starknet.</p>
        <div className="flex gap-3 justify-center">
          <Button onClick={() => { form.reset(); window.location.reload(); }}>Create another</Button>
          <Button variant="outline" asChild>
            <a href="/portfolio">View portfolio</a>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="container max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Create IP Asset</h1>
          <p className="text-muted-foreground mt-1">Mint your creative work as a programmable NFT on Starknet.</p>
        </div>

        {(status === "submitting" || status === "confirming") && (
          <TxStatus status={status} txHash={txHash} statusMessage={statusMessage} />
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            {/* Image upload */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Cover image</label>
              <div
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => document.getElementById("image-upload")?.click()}
              >
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="mx-auto max-h-40 rounded-lg object-contain" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-muted-foreground">
                    <Upload className="h-8 w-8" />
                    <p className="text-sm">Click to upload (JPG, PNG, GIF, SVG)</p>
                  </div>
                )}
                <input
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/gif", "image/svg+xml", "image/webp"];
                    if (file.size > 10 * 1024 * 1024) {
                      toast.error("File too large", { description: "Maximum file size is 10 MB." });
                      e.target.value = "";
                      return;
                    }
                    if (!ALLOWED_TYPES.includes(file.type)) {
                      toast.error("Unsupported format", { description: "Please upload a JPG, PNG, GIF, SVG, or WebP image." });
                      e.target.value = "";
                      return;
                    }
                    form.setValue("image", file);
                    setImagePreview(URL.createObjectURL(file));
                  }}
                />
              </div>
            </div>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="My Creative Work" {...field} />
                  </FormControl>
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
                    <Textarea
                      placeholder="Describe your work, its story, and what rights buyers receive…"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="ipType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>IP Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {IP_TYPES.map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="licenseType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>License</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {LICENSE_TYPES.map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="w-full h-12 text-base"
              disabled={status === "submitting" || status === "confirming"}
            >
              {status === "submitting" ? (
                <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Minting…</>
              ) : (
                "Mint asset"
              )}
            </Button>
            <p className="text-xs text-center text-muted-foreground">
              Gas is free. Your PIN signs the mint transaction.
            </p>
          </form>
        </Form>
      </div>

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Confirm mint"
        description="Enter your PIN to mint this asset on Starknet."
      />

      <WalletSetupDialog
        open={walletSetupOpen}
        onOpenChange={setWalletSetupOpen}
        onSuccess={() => {
          setWalletSetupOpen(false);
          setPinOpen(true);
        }}
      />
    </>
  );
}
