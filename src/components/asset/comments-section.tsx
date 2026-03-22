"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { CallData } from "starknet";
import { encodeTokenId } from "@/hooks/use-transfer";
import { useAuth, SignInButton, useClerk } from "@clerk/nextjs";
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
import { MessageSquare, Loader2, Send, CheckCircle, X, ExternalLink, Flag, Zap } from "lucide-react";
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
  const { openSignIn } = useClerk();
  const { hasWallet, walletAddress } = useSessionKey();
  const { comments, total, isLoading, mutate } = useComments(contract, tokenId);
  const { executeTransaction } = useChipiTransaction();

  const [text, setText] = useState("");
  const [pinOpen, setPinOpen] = useState(false);
  const [postStep, setPostStep] = useState<PostStep>("idle");
  const [postTxHash, setPostTxHash] = useState<string | null>(null);
  const [postError, setPostError] = useState<string | null>(null);
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  const byteLen = new TextEncoder().encode(text).length;
  const canSubmit = text.trim().length > 0 && byteLen <= MAX_LEN && !!COMMENTS_CONTRACT;
  const isProcessing = postStep === "processing";

  const isOwn = (author: string) =>
    !!walletAddress && author.toLowerCase() === walletAddress.toLowerCase();

  const isNearBottom = () => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comments.length]);

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isProcessing) {
      e.preventDefault();
      setPinOpen(true);
    }
  };

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
        if (composeRef.current) composeRef.current.style.height = "auto";
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

  const handleStartConversation = () => {
    if (!isSignedIn) {
      openSignIn();
    } else {
      composeRef.current?.focus();
    }
  };

  return (
    <div className="flex flex-col h-[480px] rounded-xl border border-border bg-card/50 overflow-hidden">

      {/* ── Header ── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-4 w-4 text-muted-foreground" />
          {isLoading ? (
            <Skeleton className="h-3 w-24" />
          ) : (
            <span className="text-sm font-medium">
              {total} on-chain comment{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>
        <span className="text-[10px] font-medium bg-primary/10 text-primary border border-primary/20 rounded-full px-2 py-0.5">
          ⛓ Starknet
        </span>
      </div>

      {/* ── Messages ── */}
      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-3">
        {isLoading ? (
          <div className="space-y-3">
            {([
              { own: false, w: "w-40" },
              { own: true,  w: "w-56" },
              { own: false, w: "w-48" },
              { own: true,  w: "w-32" },
            ] as const).map((item, i) => (
              <div key={i} className={`flex ${item.own ? "justify-end" : "justify-start"} gap-2`}>
                {!item.own && <Skeleton className="h-7 w-7 rounded-full shrink-0" />}
                <Skeleton
                  className={`h-10 ${item.w} rounded-2xl ${item.own ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
            <MessageSquare className="h-10 w-10 text-muted-foreground/30" />
            <div>
              <p className="text-sm font-medium">No messages yet</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Be the first to leave a permanent comment on Starknet
              </p>
            </div>
            <Button size="sm" variant="outline" onClick={handleStartConversation}>
              Start the conversation
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => {
              const own = isOwn(comment.author);
              return (
                <div
                  key={comment.id}
                  className={`group flex items-end gap-2 ${own ? "justify-end" : "justify-start"}`}
                >
                  {/* Avatar — others only */}
                  {!own && (
                    <Link href={`/creator/${comment.author}`} className="shrink-0 mb-1">
                      <div className="h-7 w-7 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-[10px] font-mono font-bold select-none">
                        {comment.author.slice(2, 4).toUpperCase()}
                      </div>
                    </Link>
                  )}

                  <div className={`flex flex-col max-w-[78%] ${own ? "items-end" : "items-start"}`}>
                    {/* Author label — others only */}
                    {!own && (
                      <Link
                        href={`/creator/${comment.author}`}
                        className="text-[10px] font-medium text-muted-foreground mb-1 ml-1 hover:underline underline-offset-2"
                      >
                        <AddressDisplay address={comment.author} chars={4} showCopy={false} />
                      </Link>
                    )}

                    {/* Bubble */}
                    <div className="relative">
                      <div
                        className={`px-3 py-2 text-sm leading-relaxed break-words ${
                          own
                            ? "bg-primary/20 border border-primary/30 rounded-2xl rounded-tr-sm text-foreground"
                            : "bg-muted rounded-2xl rounded-tl-sm"
                        }`}
                      >
                        {comment.content}
                      </div>

                      {/* Flag — others only, visible on row hover */}
                      {!own && isSignedIn && (
                        <button
                          className="absolute -top-1 -right-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive/70"
                          title="Report comment"
                          onClick={() => setReportTarget({ type: "COMMENT", commentId: comment.id })}
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {/* Metadata row: timestamp + on-chain proof link */}
                    <div className={`flex items-center gap-2 mt-1 ${own ? "mr-1 flex-row-reverse" : "ml-1"}`}>
                      <span className="text-[10px] text-muted-foreground" title={comment.postedAt}>
                        {formatDistanceToNow(new Date(comment.postedAt), { addSuffix: true })}
                      </span>
                      {comment.txHash && (
                        <a
                          href={`${EXPLORER_URL}/tx/${comment.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          title="View on Voyager"
                          className="flex items-center gap-0.5 text-[10px] text-primary/60 hover:text-primary transition-colors"
                        >
                          <span>⛓</span>
                          <ExternalLink className="h-2.5 w-2.5" />
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* ── Compose bar ── */}
      <div className="border-t border-border shrink-0">
        {!isSignedIn ? (
          <div className="flex items-center justify-center gap-2 px-4 h-14">
            <p className="text-sm text-muted-foreground">Sign in to join the conversation</p>
            <SignInButton mode="modal">
              <Button variant="ghost" size="sm">Sign in</Button>
            </SignInButton>
          </div>
        ) : !hasWallet ? (
          <div className="flex items-center justify-center px-4 h-14">
            <p className="text-sm text-muted-foreground">Set up your wallet to comment</p>
          </div>
        ) : (
          <div className="px-3 py-3 space-y-2">
            {/* CTA label */}
            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3 text-primary/70" />
              <span className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">
                Leave a permanent mark on Starknet
              </span>
            </div>
            {/* Input area */}
            <div className="rounded-xl border border-border bg-background/60 focus-within:border-primary/60 focus-within:ring-2 focus-within:ring-primary/15 transition-all">
              <Textarea
                ref={composeRef}
                placeholder="Say something on-chain… it's permanent."
                value={text}
                onChange={handleTextInput}
                onKeyDown={handleKeyDown}
                rows={2}
                className="resize-none min-h-[56px] max-h-[120px] w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 pt-2.5 pb-1 text-sm rounded-xl"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between px-3 pb-2.5">
                <span className="text-[10px] text-muted-foreground/50 flex items-center gap-1">
                  <span>⛓</span> Starknet · Enter to post
                </span>
                <div className="flex items-center gap-2">
                  {byteLen > 800 && (
                    <span className={`text-[10px] ${byteLen > MAX_LEN ? "text-destructive" : "text-muted-foreground"}`}>
                      {byteLen}/{MAX_LEN}
                    </span>
                  )}
                  <Button
                    size="sm"
                    className="h-7 px-3 text-xs gap-1.5"
                    onClick={() => setPinOpen(true)}
                    disabled={!canSubmit || isProcessing}
                  >
                    {isProcessing ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                    Post on-chain
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PIN entry ── */}
      <PinDialog
        open={pinOpen}
        onSubmit={handlePin}
        onCancel={() => setPinOpen(false)}
        title="Post comment on-chain"
        description="Enter your PIN to publish this comment permanently to Starknet."
      />

      {/* ── Report dialog ── */}
      {reportTarget && (
        <ReportDialog
          target={reportTarget}
          open={!!reportTarget}
          onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        />
      )}

      {/* ── Transaction status ── */}
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
