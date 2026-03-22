"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { byteArray, CallData } from "starknet";
import { encodeTokenId } from "@/hooks/use-transfer";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useComments } from "@/hooks/use-comments";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddressDisplay } from "@/components/shared/address-display";
import { COMMENTS_CONTRACT } from "@/lib/constants";
import { MessageSquare, Loader2, Send } from "lucide-react";
import { toast } from "sonner";

const MAX_LEN = 1000;

interface CommentsSectionProps {
  contract: string;
  tokenId: string;
}

export function CommentsSection({ contract, tokenId }: CommentsSectionProps) {
  const { isSignedIn } = useAuth();
  const { walletAddress, hasWallet } = useSessionKey();
  const { comments, total, isLoading, mutate } = useComments(contract, tokenId);
  const { executeTransaction, isSubmitting } = useChipiTransaction();

  const [text, setText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);

  const canSubmit = text.trim().length > 0 && text.length <= MAX_LEN && !!COMMENTS_CONTRACT;

  const handleSubmit = () => {
    if (!canSubmit) return;
    setPinOpen(true);
  };

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    try {
      const encoded = byteArray.byteArrayFromString(text.trim());
      const [tokenIdLow, tokenIdHigh] = encodeTokenId(tokenId);
      // add_comment(nft_contract: ContractAddress, token_id: u256, content: ByteArray)
      const calldata = CallData.compile([contract, { low: tokenIdLow, high: tokenIdHigh }, encoded]);

      const result = await executeTransaction({
        pin,
        contractAddress: COMMENTS_CONTRACT,
        calls: [{ contractAddress: COMMENTS_CONTRACT, entrypoint: "add_comment", calldata }],
      });

      if (result.status === "confirmed") {
        setText("");
        toast.success("Comment posted on-chain", {
          description: "It will appear here once indexed (~30s).",
        });
        // Re-fetch after indexer lag
        setTimeout(() => mutate(), 30_000);
      } else {
        toast.error("Transaction reverted", { description: result.revertReason });
      }
    } catch (err: unknown) {
      toast.error("Failed to post comment", {
        description: err instanceof Error ? err.message : "Unknown error",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Compose box */}
      <div className="space-y-2">
        {!isSignedIn ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center space-y-2">
            <p className="text-sm text-muted-foreground">Sign in to post a comment on-chain.</p>
            <SignInButton mode="modal">
              <Button variant="secondary" size="sm">Sign in</Button>
            </SignInButton>
          </div>
        ) : !hasWallet ? (
          <div className="rounded-lg border border-dashed border-border p-4 text-center">
            <p className="text-sm text-muted-foreground">Set up your wallet to post comments.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <Textarea
              placeholder="Write a comment… (posted on Starknet)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isSubmitting}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${text.length > MAX_LEN ? "text-destructive" : "text-muted-foreground"}`}>
                {text.length}/{MAX_LEN}
              </span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!canSubmit || isSubmitting}
              >
                {isSubmitting ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> Posting…</>
                ) : (
                  <><Send className="h-3.5 w-3.5 mr-1.5" /> Post on-chain</>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Comments list */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex gap-3">
              <Skeleton className="h-8 w-8 rounded-full shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-3 w-28" />
                <Skeleton className="h-4 w-full" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center gap-3">
          <MessageSquare className="h-9 w-9 text-muted-foreground/40" />
          <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            {total} on-chain comment{total !== 1 ? "s" : ""}
          </p>
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <div className="shrink-0 h-8 w-8 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-xs font-mono font-bold select-none">
                {comment.author.slice(2, 4).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2 flex-wrap">
                  <Link
                    href={`/creator/${comment.author}`}
                    className="text-xs font-medium hover:underline underline-offset-2"
                  >
                    <AddressDisplay address={comment.author} chars={4} showCopy={false} />
                  </Link>
                  <span className="text-[10px] text-muted-foreground" title={comment.postedAt}>
                    {formatDistanceToNow(new Date(comment.postedAt), { addSuffix: true })}
                  </span>
                </div>
                <p className="text-sm mt-1 break-words leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Post comment on-chain"
        description="Enter your PIN to publish this comment to Starknet."
      />
    </div>
  );
}
