"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { approveReview, rejectReview } from "@/features/admin/reviews/actions";

interface ReviewModerationRowProps {
  id: string;
  approved: boolean;
}

export function ReviewModerationRow({ id, approved }: ReviewModerationRowProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleApprove() {
    setError(null);
    startTransition(async () => {
      const result = await approveReview(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  function handleReject() {
    if (!confirm("Delete this review? This cannot be undone.")) return;
    setError(null);
    startTransition(async () => {
      const result = await rejectReview(id);
      if (result.error) setError(result.error);
      else router.refresh();
    });
  }

  return (
    <div className="flex shrink-0 flex-col items-end gap-1">
      <div className="flex gap-2">
        {!approved && (
          <Button
            size="sm"
            variant="default"
            onClick={handleApprove}
            disabled={isPending}
            className="h-7 px-2 text-xs"
          >
            Approve
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleReject}
          disabled={isPending}
          className="h-7 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
        >
          Delete
        </Button>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
