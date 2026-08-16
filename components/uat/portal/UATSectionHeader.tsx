'use client';

interface UATSectionHeaderProps {
  title: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
  actionOnClick?: () => void;
}

export default function UATSectionHeader({ title, description, actionLabel, actionHref, actionOnClick }: UATSectionHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h2 className="font-serif text-2xl font-semibold text-[#17325c]">{title}</h2>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actionLabel && (actionHref || actionOnClick) && (
        actionHref ? (
          <a href={actionHref} className="text-sm font-semibold text-[#2878d0] hover:underline whitespace-nowrap">
            {actionLabel}
          </a>
        ) : (
          <button onClick={actionOnClick} className="text-sm font-semibold text-[#2878d0] hover:underline whitespace-nowrap cursor-pointer">
            {actionLabel}
          </button>
        )
      )}
    </div>
  );
}