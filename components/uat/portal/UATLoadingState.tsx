'use client';

interface UATLoadingStateProps {
  message?: string;
  fullPage?: boolean;
}

export default function UATLoadingState({ message = 'Loading...', fullPage = false }: UATLoadingStateProps) {
  const spinner = (
    <div className="w-8 h-8 border-[3px] border-[#2878d0]/20 border-t-[#2878d0] rounded-full animate-spin" />
  );

  if (fullPage) {
    return (
      <div className="min-h-screen bg-[#f8fafc] flex items-center justify-center">
        {spinner}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3">
      {spinner}
      <p className="text-sm text-slate-500">{message}</p>
    </div>
  );
}