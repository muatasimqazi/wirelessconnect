/**
 * Admin Reviews — server component.
 *
 * Moderation queue for product reviews.
 * Staff can approve or reject (delete) reviews.
 */

import Link from "next/link";
import { requireStaff } from "@/lib/utils/permissions";
import { getAdminReviews } from "@/features/admin/reviews/queries";
import { ReviewModerationRow } from "./review-moderation-row";

export const metadata = { title: "Reviews — Wireless Connect Admin" };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(new Date(iso));
}

interface PageProps {
  searchParams: Promise<{ filter?: string }>;
}

const FILTERS = [
  { value: "pending", label: "Pending Approval" },
  { value: "approved", label: "Approved" },
  { value: "all", label: "All" },
];

export default async function AdminReviewsPage({ searchParams }: PageProps) {
  await requireStaff();
  const { filter = "pending" } = await searchParams;

  const approvedParam =
    filter === "approved" ? true : filter === "pending" ? false : undefined;

  const reviews = await getAdminReviews({ approved: approvedParam, limit: 200 });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Product Reviews</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          {filter === "pending" ? " · Pending Approval" : filter === "approved" ? " · Approved" : ""}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        {FILTERS.map((f) => {
          const active = (filter ?? "pending") === f.value;
          return (
            <Link
              key={f.value}
              href={`/admin/reviews?filter=${f.value}`}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-card text-foreground hover:bg-muted"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </div>

      {reviews.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-muted/30 p-12 text-center text-sm text-muted-foreground">
          {filter === "pending" ? "No reviews pending approval." : "No reviews found."}
        </div>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div
              key={review.id}
              className="rounded-xl border border-border bg-card p-5 space-y-3"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    {/* Star rating display */}
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= review.rating ? "text-yellow-400" : "text-muted-foreground/30"}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-foreground">
                      {review.title ?? "(No title)"}
                    </span>
                    {review.approved && (
                      <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-800 dark:bg-green-900/30 dark:text-green-300">
                        Approved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    By {review.reviewer_name ?? "Anonymous"}
                    {review.reviewer_email ? ` · ${review.reviewer_email}` : ""}
                    {" · "}{formatDate(review.created_at)}
                  </p>
                  {review.product_title && (
                    <p className="text-xs text-muted-foreground">
                      Product:{" "}
                      {review.product_slug ? (
                        <Link
                          href={`/en/product/${review.product_slug}`}
                          target="_blank"
                          className="text-primary hover:underline"
                        >
                          {review.product_title}
                        </Link>
                      ) : (
                        review.product_title
                      )}
                    </p>
                  )}
                </div>

                {/* Moderation actions */}
                <ReviewModerationRow id={review.id} approved={review.approved} />
              </div>

              {review.body && (
                <p className="text-sm text-muted-foreground">{review.body}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
