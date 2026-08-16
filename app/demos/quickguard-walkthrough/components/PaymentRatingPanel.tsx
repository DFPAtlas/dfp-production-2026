import { useState } from 'react';
import type { DemoJob } from '../lib/types';
import { RATING_TAGS } from '../lib/data';

interface PaymentRatingPanelProps {
  job: DemoJob;
  ratingSubmitted: boolean;
  onSubmitRating: (rating: number, tags: string[]) => void;
}

export default function PaymentRatingPanel({ job, ratingSubmitted, onSubmitRating }: PaymentRatingPanelProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(false);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = () => {
    if (rating === 0) return;
    setSubmitted(true);
    onSubmitRating(rating, selectedTags);
  };

  if (submitted) {
    return (
      <div id="payment-rating" className="space-y-5">
        <div className="rounded-2xl border border-emerald-500/15 bg-emerald-500/[0.03] p-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-500/15 mx-auto mb-3">
            <i className="ri-check-double-line text-emerald-400 text-2xl"></i>
          </div>
          <h2 className="text-lg font-bold text-white mb-1">Rating Submitted</h2>
          <p className="text-sm text-slate-400">Thank you for your feedback</p>
        </div>
      </div>
    );
  }

  return (
    <div id="payment-rating" className="space-y-5">
      <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.03] p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <i className="ri-bank-card-line text-blue-400 text-lg"></i>
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Payment Authorised</h2>
            <p className="text-xs text-slate-400">Demo Payment — no real transaction processed</p>
          </div>
        </div>

        <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 mb-5">
          <div className="flex justify-between py-1.5">
            <span className="text-xs text-slate-400">Security service</span>
            <span className="text-xs text-slate-300">Demo amount</span>
          </div>
          <div className="flex justify-between py-1.5">
            <span className="text-xs text-slate-400">Platform fee</span>
            <span className="text-xs text-slate-300">Demo amount</span>
          </div>
          <div className="border-t border-white/[0.06] mt-2 pt-2 flex justify-between">
            <span className="text-xs font-semibold text-white">Total</span>
            <span className="text-xs font-semibold text-white">Demo total</span>
          </div>
        </div>

        <div className="mb-5">
          <h3 className="text-sm font-bold text-white mb-3">How was your security team?</h3>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition cursor-pointer"
              >
                <i
                  className={`text-2xl ${
                    star <= (hoverRating || rating)
                      ? 'ri-star-fill text-amber-400'
                      : 'ri-star-line text-slate-600'
                  }`}
                ></i>
              </button>
            ))}
          </div>
        </div>

        <div className="mb-5">
          <div className="flex flex-wrap gap-2">
            {RATING_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleTag(tag)}
                className={`rounded-full border px-3 py-1.5 text-[11px] font-medium transition cursor-pointer ${
                  selectedTags.includes(tag)
                    ? 'border-blue-500/30 bg-blue-500/[0.10] text-blue-300'
                    : 'border-white/[0.06] bg-white/[0.02] text-slate-500 hover:text-slate-300'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0}
          className={`w-full rounded-xl px-5 py-3 text-sm font-semibold transition cursor-pointer ${
            rating > 0
              ? 'bg-blue-600 text-white hover:bg-blue-500'
              : 'bg-white/[0.03] text-slate-600 cursor-not-allowed'
          }`}
        >
          Submit Demo Rating
        </button>
      </div>
    </div>
  );
}