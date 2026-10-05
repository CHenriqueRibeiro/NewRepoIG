'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export interface SliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  valueDisplay: string | React.ReactNode;
  icon?: React.ReactNode;
}

export const Slider: React.FC<SliderProps> = ({
  label,
  valueDisplay,
  icon,
  className,
  ...props
}) => {
  return (
    <div className={cn('p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-3', className)}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-slate-800 flex items-center gap-2">
          {icon && <span className="text-slate-500">{icon}</span>}
          {label}
        </span>
        <span className="font-mono font-semibold text-slate-900 text-sm px-2.5 py-0.5 rounded-md bg-white border border-slate-200 shadow-xs">
          {valueDisplay}
        </span>
      </div>
      <input type="range" className="w-full" {...props} />
    </div>
  );
};
