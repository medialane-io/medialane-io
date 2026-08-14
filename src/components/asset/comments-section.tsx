"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { formatDistanceToNow } from "date-fns";
import { CallData } from "starknet";
import { normalizeAddress } from "@medialane/sdk";
import type { StarknetVenueSigner } from "@medialane/sdk/starknet";
import { encodeTokenId } from "@/hooks/use-transfer";
import { useComments } from "@/hooks/use-comments";
import { useWalletNativeSession } from "@/hooks/use-wallet-native-session";
import { useWalletWriteAction } from "@/hooks/use-wallet-write-action";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { AddressDisplay } from "@/components/shared/address-display";
import { LevelBadge } from "@medialane/ui";
import { useRewardsBatch } from "@/hooks/use-rewards";
import { rewardToast } from "@/lib/reward-toast";
import { STARKNET_NFTCOMMENTS_CONTRACT, EXPLORER_URL } from "@/lib/constants";
import { MessageCircle, Loader2, Send, CheckCircle, X, ExternalLink, Flag, Zap } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ReportDialog, type ReportTarget } from "@/components/report-dialog";
import { cn } from "@/lib/utils";

const MAX_LEN = 1000;

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

interface CommentsSectionProps {
  contract: string;
  tokenId: string;
  className?: string;
}

export function CommentsSection({ contract, tokenId, className }: CommentsSectionProps) {
  const { hasWallet, address: walletAddress } = useWalletNativeSession();
  const pathname = usePathname();
  const { comments, total, isLoading, mutate } = useComments(contract, tokenId);

  const { data: authorLevels } = useRewardsBatch(comments.map((c) => c.author));
  const action = useWalletWriteAction();

  const [text, setText] = useState("");
  const [reportTarget, setReportTarget] = useState<ReportTarget | null>(null);

  const messagesRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const composeRef = useRef<HTMLTextAreaElement>(null);

  const byteLen = new TextEncoder().encode(text).length;
  const canSubmit = text.trim().length > 0 && byteLen <= MAX_LEN && !!STARKNET_NFTCOMMENTS_CONTRACT;
  const isProcessing = action.status === "processing" || action.status === "confirming";

  const isOwn = (author: string) =>
    !!walletAddress && normalizeAddress("STARKNET", author) === normalizeAddress("STARKNET", walletAddress);

  const isNearBottom = () => {
    const el = messagesRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight < 100;
  };

  useEffect(() => {
    if (isNearBottom()) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }

  }, [comments.length]);

  const handleTextInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 96) + "px";
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && canSubmit && !isProcessing) {
      e.preventDefault();
      void action.run(handleUnlocked);
    }
  };

  const handleUnlocked = async (signer: StarknetVenueSigner) => {
    const encoded = byteArrayFromUtf8(text.trim());
    const [tokenIdLow, tokenIdHigh] = encodeTokenId(tokenId);
    const calldata = CallData.compile([contract, { low: tokenIdLow, high: tokenIdHigh }, encoded]);

    const result = await signer.execute([
      { contractAddress: STARKNET_NFTCOMMENTS_CONTRACT, entrypoint: "add_comment", calldata },
    ]);

    setText("");
    if (composeRef.current) composeRef.current.style.height = "auto";
    setTimeout(() => mutate(), 30_000);
    rewardToast("comment");
    return result;
  };

  const handleStartConversation = () => {
    if (hasWallet) composeRef.current?.focus();
  };

  return (
    <div className={cn("flex flex-col h-[480px] overflow-hidden", className)}>

      <div ref={messagesRef} className="flex-1 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <div className="space-y-4">
            {([
              { own: false, w: "w-40" },
              { own: true,  w: "w-56" },
              { own: false, w: "w-48" },
              { own: true,  w: "w-32" },
            ] as const).map((item, i) => (
              <div key={i} className={`flex ${item.own ? "justify-end" : "justify-start"} gap-2`}>
                {!item.own && <Skeleton className="h-8 w-8 rounded-full shrink-0" />}
                <Skeleton
                  className={`h-10 ${item.w} rounded-2xl ${item.own ? "rounded-tr-sm" : "rounded-tl-sm"}`}
                />
              </div>
            ))}
          </div>
        ) : comments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-full" style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue) / 0.15), hsl(var(--brand-purple) / 0.15))" }}>
              <MessageCircle className="h-7 w-7" style={{ color: "hsl(var(--brand-blue))" }} />
            </div>
            <div>
              <p className="text-sm font-semibold">Nothing here yet</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed max-w-[220px]">
                Your comment will be minted onchain — attached to this NFT forever.
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleStartConversation}
              className="rounded-full text-white px-5"
              style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-purple)))" }}
            >
              Write the first comment
            </Button>
          </div>
        ) : (
          <div className="space-y-5">
            {comments.map((comment) => {
              const own = isOwn(comment.author);
              const avatarSeed = parseInt(comment.author.slice(2, 8), 16) % 360;
              const avatarBg = own
                ? "linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-purple)))"
                : `linear-gradient(135deg, hsl(${avatarSeed}, 65%, 45%), hsl(${(avatarSeed + 60) % 360}, 65%, 55%))`;

              return (
                <div
                  key={comment.id}
                  className={`group flex gap-2.5 ${own ? "flex-row-reverse" : "flex-row"}`}
                >

                  <Link href={`/creator/${comment.author}`} className="shrink-0 mt-0.5">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white select-none ring-2 ring-background hover:ring-primary/40 transition-all"
                      style={{ background: avatarBg }}
                    >
                      {comment.author.slice(2, 5).toUpperCase()}
                    </div>
                  </Link>

                  <div className={`flex flex-col max-w-[75%] gap-1 ${own ? "items-end" : "items-start"}`}>

                    <div className={`flex items-center gap-2 px-1 ${own ? "flex-row-reverse" : "flex-row"}`}>
                      <Link
                        href={`/creator/${comment.author}`}
                        className="text-xs font-semibold text-foreground hover:underline underline-offset-2"
                      >
                        {own ? "You" : <AddressDisplay address={comment.author} chars={5} showCopy={false} />}
                      </Link>
                      {!own && (() => {
                        const level = authorLevels?.get(comment.author);
                        if (!level || level.totalXp <= 0) return null;
                        return (
                          <LevelBadge
                            level={level.currentLevel}
                            name={level.currentLevelName}
                            badgeColor={level.badgeColor}
                            size="sm"
                          />
                        );
                      })()}
                      <span className="text-[10px] text-muted-foreground" title={comment.postedAt}>
                        {formatDistanceToNow(new Date(comment.postedAt), { addSuffix: true })}
                      </span>
                    </div>

                    <div className="relative">
                      {own ? (
                        <div
                          className="px-3.5 py-2.5 text-sm leading-relaxed break-words rounded-2xl rounded-tr-sm text-white"
                          style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-purple)))" }}
                        >
                          {comment.content}
                        </div>
                      ) : (
                        <div className="px-3.5 py-2.5 text-sm leading-relaxed break-words bg-muted rounded-2xl rounded-tl-sm border border-border/50">
                          {comment.content}
                        </div>
                      )}
                      {!own && hasWallet && (
                        <button
                          className="absolute -top-1 -right-5 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground/40 hover:text-destructive/70"
                          title="Report comment"
                          aria-label="Report comment"
                          onClick={() => setReportTarget({ type: "COMMENT", commentId: comment.id })}
                        >
                          <Flag className="h-3 w-3" />
                        </button>
                      )}
                    </div>

                    {comment.txHash && (
                      <a
                        href={`${EXPLORER_URL}/tx/${comment.txHash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-1 text-[10px] font-medium transition-colors"
                        style={{ color: "hsl(var(--brand-blue) / 0.55)" }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = "hsl(var(--brand-blue))")}
                        onMouseLeave={(e) => (e.currentTarget.style.color = "hsl(var(--brand-blue) / 0.55)")}
                      >
                        <span>⛓</span>
                        <span>onchain proof</span>
                        <ExternalLink className="h-2.5 w-2.5" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border/60 shrink-0">
        {!hasWallet ? (
          <div className="flex items-center justify-center px-4 h-16">
            <Link
              href={`/connect?redirect_url=${encodeURIComponent(pathname)}`}
              className="text-sm text-primary hover:underline"
            >
              Secure your account to comment
            </Link>
          </div>
        ) : (
          <div className="px-3 pt-2 pb-3 space-y-2">

            <div className="flex items-center gap-1.5">
              <Zap className="h-3 w-3" style={{ color: "hsl(var(--brand-blue))" }} />
              <span className="text-[10px] font-semibold" style={{ color: "hsl(var(--brand-blue))" }}>
                Mint your message onchain
              </span>
            </div>

            <div
              className="rounded-xl border bg-background/60 transition-all focus-within:ring-2"
              style={{
                borderColor: "hsl(var(--border))",
              }}
              onFocusCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--brand-blue) / 0.6)";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "0 0 0 3px hsl(var(--brand-blue) / 0.12)";
              }}
              onBlurCapture={(e) => {
                (e.currentTarget as HTMLDivElement).style.borderColor = "hsl(var(--border))";
                (e.currentTarget as HTMLDivElement).style.boxShadow = "";
              }}
            >
              <Textarea
                ref={composeRef}
                placeholder="Say something onchain… it's permanent."
                value={text}
                onChange={handleTextInput}
                onKeyDown={handleKeyDown}
                rows={2}
                className="resize-none min-h-[52px] max-h-[120px] w-full border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-3 pt-2.5 pb-1 text-sm rounded-xl"
                disabled={isProcessing}
              />
              <div className="flex items-center justify-between px-3 pb-2.5">
                <span className="text-[10px] text-muted-foreground/40 flex items-center gap-1">
                  Enter ↵ to post
                </span>
                <div className="flex items-center gap-2">
                  {byteLen > 800 && (
                    <span className={`text-[10px] ${byteLen > MAX_LEN ? "text-destructive" : "text-muted-foreground"}`}>
                      {byteLen}/{MAX_LEN}
                    </span>
                  )}
                  <TooltipProvider delayDuration={300}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className={!canSubmit && !isProcessing ? "cursor-not-allowed" : undefined}>
                          <button
                            onClick={() => void action.run(handleUnlocked)}
                            disabled={!canSubmit || isProcessing}
                            className="flex items-center gap-1.5 h-7 px-3 text-xs font-semibold rounded-full text-white transition-all hover:opacity-90 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ background: "linear-gradient(135deg, hsl(var(--brand-blue)), hsl(var(--brand-purple)))" }}
                          >
                            {isProcessing ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                            Post onchain
                          </button>
                        </span>
                      </TooltipTrigger>
                      {!STARKNET_NFTCOMMENTS_CONTRACT && (
                        <TooltipContent side="top" className="text-xs max-w-[200px] text-center">
                          On-chain comments are not available on this network
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {reportTarget && (
        <ReportDialog
          target={reportTarget}
          open={!!reportTarget}
          onOpenChange={(open) => { if (!open) setReportTarget(null); }}
        />
      )}

      <Dialog open={action.status !== "idle"} onOpenChange={(v) => { if (!v) action.reset(); }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>
              {isProcessing && "Posting comment…"}
              {action.status === "success" && "Comment posted!"}
              {action.status === "error" && "Failed to post"}
            </DialogTitle>
            {isProcessing && (
              <DialogDescription>
                Submitting your comment to Starknet. Please wait.
              </DialogDescription>
            )}
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            {isProcessing && (
              <Loader2 className="h-10 w-10 animate-spin text-primary" />
            )}
            {action.status === "success" && (
              <>
                <CheckCircle className="h-10 w-10 text-green-500" />
                <p className="text-sm text-center text-muted-foreground">
                  Your comment is onchain and will appear here once indexed (~30s).
                </p>
                {action.txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${action.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button className="w-full" onClick={action.reset}>Done</Button>
              </>
            )}
            {action.status === "error" && (
              <>
                <X className="h-10 w-10 text-destructive" />
                <p className="text-sm text-center text-muted-foreground">
                  {action.error ?? "Something went wrong. Please try again."}
                </p>
                {action.txHash && (
                  <a
                    href={`${EXPLORER_URL}/tx/${action.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:underline"
                  >
                    View transaction <ExternalLink className="h-3 w-3" />
                  </a>
                )}
                <Button variant="outline" className="w-full" onClick={action.reset}>Dismiss</Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
