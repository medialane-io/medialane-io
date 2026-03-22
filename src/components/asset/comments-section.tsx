"use client";

import { useState } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CallData } from "starknet";
import { encodeTokenId } from "@/hooks/use-transfer";
import { useAuth, SignInButton } from "@clerk/nextjs";
import { useComments } from "@/hooks/use-comments";
import { useSessionKey } from "@/hooks/use-session-key";
import { useChipiTransaction } from "@/hooks/use-chipi-transaction";
import { PinDialog } from "@/components/chipi/pin-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddressDisplay } from "@/components/shared/address-display";
import { COMMENTS_CONTRACT, EXPLORER_URL } from "@/lib/constants";
import { MessageSquare, Loader2, Send, CheckCircle, X, ExternalLink, Flag } from "lucide-react";
import { ReportDialog, type ReportTarget } from "@/components/report-dialog";

const MAX_LEN = 1000;

/**
 * Build a Cairo ByteArray from any Unicode string.
 * starknet.js byteArrayFromString is ASCII-only — this encodes as UTF-8 first,
 * then packs bytes into 31-byte felt252 chunks (Cairo ByteArray layout).
 */
function byteArrayFromUtf8(str: string): { data: string[]; pending_word: string; pending_word_len: number } {
  const bytes = new TextEncoder().encode(str);
  const data: string[] = [];
  let i = 0;
  while (i + 31 <= bytes.length) {
    let value = 0n;
    for (let j = 0; j < 31; j++) value = (value << 8n) | BigInt(bytes[i + j]);
    data.push("0x" + value.toString(16));
    i += 31;
  }
  const remaining = bytes.slice(i);
  let pendingWord = 0n;
  for (const byte of remaining) pendingWord = (pendingWord << 8n) | BigInt(byte);
  return { data, pending_word: "0x" + pendingWord.toString(16), pending_word_len: remaining.length };
}

type PostStep = "idle" | "processing" | "success" | "error";

interface CommentsSectionProps {
  contract: string;
  tokenId: string;
}

export function CommentsSection({ contract, tokenId }: CommentsSectionProps) {
  const { isSignedIn } = useAuth();
  const { hasWallet } = useSessionKey();
  const { comments, total, isLoading, mutate } = useComments(contract, tokenId);
  const { executeTransaction } = useChipiTransaction();

  const [text, setText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [postStep, setPostStep] = useState<PostStep>("idle");
  const [postTxHash, setPostTxHash] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const byteLen = new TextEncoder().encode(text).length;
  const canSubmit = text.trim().length > 0 && byteLen <= MAX_LEN && !!COMMENTS_CONTRACT;
  const isProcessing = postStep === "processing";

  const handlePin = async (pin: string) => {
    setPinOpen(false);
    setPostStep("processing");
    setPostTxHash(null);
    setPostError(null);
    try {
      const encoded = byteArrayFromUtf8(text.trim());
      const [tokenIdLow, tokenIdHigh] = encodeTokenId(tokenId);
      const calldata = CallData.compile([contract, { low: tokenIdLow, high: tokenIdHigh }, encoded]);

      const result = await executeTransaction({
        pin,
        contractAddress: COMMENTS_CONTRACT,
        calls: [{ contractAddress: COMMENTS_CONTRACT, entrypoint: "add_comment", calldata }],
      });

      setPostTxHash(result.txHash);
      if (result.status === "confirmed") {
        setPostStep("success");
        setText("");
        // Re-fetch after indexer lag (~30s)
        setTimeout(() => mutate(), 30_000);
      } else {
        setPostStep("error");
        setPostError(result.revertReason ?? "Transaction reverted");
      }
    } catch (err: unknown) {
      setPostStep("error");
      setPostError(err instanceof Error ? err.message : "Transaction failed");
    }
  };

  const resetPost = () => {
    setPostStep("idle");
    setPostTxHash(null);
    setPostError(null);
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
              placeholder="Write a comment… (posted permanently on Starknet)"
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={3}
              className="resize-none"
              disabled={isProcessing}
            />
            <div className="flex items-center justify-between">
              <span className={`text-xs ${byteLen > MAX_LEN ? "text-destructive" : "text-muted-foreground"}`}>
                {byteLen}/{MAX_LEN} bytes
              </span>
              <Button
                size="sm"
                onClick={() => setPinOpen(true)}
                disabled={!canSubmit || isProcessing}
              >
                {isProcessing ? (
                  <><Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />Posting…</>
                ) : (
                  <><Send className="h-3.5 w-3.5 mr-1.5" />Post on-chain</>
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
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2 flex-wrap min-w-0">
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
                  {isSignedIn && (
                    <button
                      className="shrink-0 text-muted-foreground/40 hover:text-muted-foreground transition-colors mt-0.5"
                      title="Report comment"
                      onClick={() => setReportTarget({ type: "COMMENT", commentId: comment.id })}
                    >
                      <Flag className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-sm mt-1 break-words leading-relaxed">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* PIN entry */}
      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Post comment on-chain"
        description="Enter your PIN to publish this comment permanently to Starknet."
      />

      {/* Comment report dialog */}
      {reportTarget && (
        <ReportDialog
          target={reportTarget}
          open={!!reportTarget}
          onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        />
      )}

      {/* Transaction status dialog */}
      <Dialog open={postStep !== "idle"} onOpenChange={(v) => { if (!v) resetPost(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {postStep === "processing" && "Posting comment…"}
              {postStep === "success" && "Comment posted!"}
              {postStep === "error" && "Failed to post"}
            </DialogTitle>
            {postStep === "processing" && (
              <DialogDescription>
                Submitting your comment to Starknet. Please wait.
              </DialogDescription>
            )}
          </DialogHeader>

          <div className="flex flex-col items-center gap-4 py-4">
            {postStep === "processing" && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}

            {postStep === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-center text-muted-foreground">
                  Your comment is on-chain and will appear here once indexed (~30s).
                </p>
                {postTxHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${postTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button className="w-full" onClick={resetPost}>Done</Button>
              </>
            )}

            {postStep === "error" && (
              <>
                <X className="h-10 w-10 text-destructive" />
                <p className="text-sm text-center text-muted-foreground">
                  {postError ?? "Something went wrong. Please try again."}
                </p>
                {postTxHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${postTxHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button variant="outline" className="w-full" onClick={resetPost}>Dismiss</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
