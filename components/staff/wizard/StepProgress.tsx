'use client';

import { Check } from 'lucide-react';
import { STEPS } from '@/lib/wizard-types';

interface StepProgressProps {
  currentStep: number;
  completedSteps: number[];
  onStepClick: (step: number) => void;
}

export default function StepProgress({ currentStep, completedSteps, onStepClick }: StepProgressProps) {
  return (
    <div className="hidden lg:flex flex-col gap-1 p-4">
      {STEPS.map((step) => {
        const isActive = currentStep === step.num;
        const isDone = completedSteps.includes(step.num);
        const isClickable = isDone || step.num < currentStep;

        return (
          <button
            key={step.num}
            onClick={() => isClickable && onStepClick(step.num)}
            disabled={!isClickable}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer whitespace-nowrap ${
              isActive
                ? 'bg-[#06B6D4]/10 border border-[#06B6D4]/20'
                : isDone
                  ? 'hover:bg-white/5 border border-transparent'
                  : isClickable
                    ? 'hover:bg-white/5 border border-transparent'
                    : 'opacity-40 border border-transparent cursor-not-allowed'
            }`}
          >
            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-xs font-bold transition-all ${
              isActive ? 'bg-[#06B6D4] text-white' :
              isDone ? 'bg-[#10B981] text-white' :
              'bg-white/5 text-slate-500'
            }`}>
              {isDone ? <Check className="w-3.5 h-3.5" /> : step.num}
            </div>
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${isActive ? 'text-[#06B6D4]' : isDone ? 'text-white' : 'text-slate-400'}`}>
                {step.title}
              </p>
              <p className="text-[10px] text-slate-500 truncate">{step.subtitle}</p>
            </div>
          </button>
        );
      })}
    </div>
  );
}