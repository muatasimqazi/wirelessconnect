"use client";

/**
 * ProductReviews — client component.
 *
 * Shows approved reviews for a product and a "Write a Review" form.
 * Reviews require admin approval before appearing — this is communicated to the reviewer.
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitReview } from "@/features/reviews/actions";
import { StarIcon, MessageSquareIcon, CheckCircleIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  rating: number;
  title: string | null;
  body: string | null;
  reviewer_name: string | null;
  created_at: string;
}

interface ProductReviewsProps {
  productId: string;
  reviews: Review[];
  locale: string;
}

function StarRating({
  value,
  onChange,
  readOnly = false,
}: {
  value: number;
  onChange?: (v: number) => void;
  readOnly?: boolean;
}) {
  const [hovered, setHovered] = useState(0);
  return (
    <div className="flex gap-0.5" role={readOnly ? "img" : "radiogroup"} aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type={readOnly ? "button" : "button"}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHovered(star)}
          onMouseLeave={() => !readOnly && setHovered(0)}
          disabled={readOnly}
          aria-label={`${star} star`}
          className={cn(
            "p-0.5 transition-colors",
            readOnly ? "cursor-default" : "cursor-pointer",
          )}
        >
          <StarIcon
            className={cn(
              "h-5 w-5",
              (hovered || value) >= star
                ? "fill-yellow-400 text-yellow-400"
                : "fill-none text-muted-foreground/40",
            )}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  );
}

export function ProductReviews({ productId, reviews, locale }: ProductReviewsProps) {
  const t = useTranslations("reviews");
  const [showForm, setShowForm] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  const avgRating = reviews.length
    ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / reviews.length) * 10) / 10
    : 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const result = await submitReview({
        product_id: productId,
        rating,
        title: title || undefined,
        body: body || undefined,
        reviewer_name: name || undefined,
        reviewer_email: email || undefined,
      });
      if (!result.success) {
        setError(result.error ?? "Something went wrong.");
        return;
      }
      setSubmitted(true);
      setShowForm(false);
    });
  }

  return (
    <section aria-labelledby="reviews-heading" className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 id="reviews-heading" className="text-lg font-bold">{t("title")}</h2>
          {reviews.length > 0 && (
            <div className="mt-1 flex items-center gap-2">
              <StarRating value={avgRating} readOnly />
              <span className="text-sm text-muted-foreground">
                {avgRating} ({reviews.length} {reviews.length === 1 ? t("review") : t("reviews")})
              </span>
            </div>
          )}
        </div>
        {!submitted && (
          <Button variant="outline" size="sm" onClick={() => setShowForm((v) => !v)}>
            <MessageSquareIcon className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t("writeReview")}
          </Button>
        )}
      </div>

      {/* Write review form */}
      {showForm && !submitted && (
        <form onSubmit={handleSubmit} className="rounded-lg border border-border bg-surface p-5 space-y-4">
          <h3 className="font-semibold">{t("formTitle")}</h3>

          <div className="space-y-1.5">
            <Label>{t("yourRating")} *</Label>
            <StarRating value={rating} onChange={setRating} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="rev_name">{t("yourName")}</Label>
              <Input id="rev_name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Jane S." />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="rev_email">{t("yourEmail")}</Label>
              <Input id="rev_email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Not displayed publicly" />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rev_title">{t("reviewTitle")}</Label>
            <Input id="rev_title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Great device!" maxLength={120} />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="rev_body">{t("reviewBody")}</Label>
            <Textarea id="rev_body" value={body} onChange={(e) => setBody(e.target.value)} rows={4} placeholder="Share your experience with this device…" />
          </div>

          {error && <p role="alert" className="text-sm text-destructive">{error}</p>}

          <p className="text-xs text-muted-foreground">{t("approvalNote")}</p>

          <div className="flex gap-2">
            <Button type="submit" size="sm" disabled={isPending}>
              {isPending ? t("submitting") : t("submitReview")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => setShowForm(false)}>
              {t("cancel")}
            </Button>
          </div>
        </form>
      )}

      {submitted && (
        <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
          <CheckCircleIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
          {t("thankYou")}
        </div>
      )}

      {/* Review list */}
      {reviews.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t("noReviews")}</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="rounded-lg border border-border bg-surface p-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <StarRating value={review.rating} readOnly />
                  {review.title && <p className="mt-1 font-medium">{review.title}</p>}
                </div>
                <time
                  dateTime={review.created_at}
                  className="shrink-0 text-xs text-muted-foreground"
                >
                  {new Date(review.created_at).toLocaleDateString(locale)}
                </time>
              </div>
              {review.body && <p className="text-sm text-muted-foreground">{review.body}</p>}
              {review.reviewer_name && (
                <p className="text-xs text-muted-foreground">— {review.reviewer_name}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
