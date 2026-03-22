"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { useComments } from "@/hooks/use-comments";
import { Skeleton } from "@/components/ui/skeleton";
import { AddressDisplay } from "@/components/shared/address-display";
import { MessageSquare } from "lucide-react";

interface CommentsSectionProps {
  contract: string;
  tokenId: string;
}

export function CommentsSection({ contract, tokenId }: CommentsSectionProps) {
  const { comments, total, isLoading } = useComments(contract, tokenId);

  if (isLoading) {
    return (
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
    );
  }

  if (comments.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
        <MessageSquare className="h-10 w-10 text-muted-foreground/40" />
        <p className="text-sm text-muted-foreground">No comments yet.</p>
        <p className="text-xs text-muted-foreground/60">
          Comments are posted on-chain and indexed automatically.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <p className="text-xs text-muted-foreground">
        {total} on-chain comment{total !== 1 ? "s" : ""}
      </p>
      <div className="space-y-4">
        {comments.map((comment) => (
          <div key={comment.id} className="flex gap-3 group">
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
    </div>
  );
}
