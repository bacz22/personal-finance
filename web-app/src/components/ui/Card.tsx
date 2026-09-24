import React from 'react'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'overlay' | 'subtle' | 'outline' | 'interactive'
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  className = '',
  ...props
}) => {
  const variantStyles = {
    // Glass Tier 1 — Surface (Cards, Table container, standard surfaces)
    default:
      'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.06)]',
    // Glass Tier 2 — Elevated (Panels, KPI, Sticky surfaces)
    elevated:
      'bg-[var(--glass-surface,rgba(255,255,255,0.92))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/90 shadow-[0_8px_28px_rgba(15,23,42,0.08)]',
    // Glass Tier 3 — Overlay (Popovers, floating cards)
    overlay:
      'bg-[var(--glass-surface,rgba(255,255,255,0.95))] backdrop-blur-[var(--glass-blur,20px)] border border-slate-200 shadow-[0_16px_48px_rgba(15,23,42,0.14)]',
    subtle: 'bg-[var(--glass-surface,rgba(255,255,255,0.70))] backdrop-blur-[var(--glass-blur,12px)] border border-slate-200/80',
    outline: 'bg-transparent border border-slate-300',
    interactive:
      'bg-[var(--glass-surface,rgba(255,255,255,0.88))] backdrop-blur-[var(--glass-blur,16px)] border border-slate-200/80 shadow-[0_4px_24px_rgba(15,23,42,0.06)] hover:border-slate-300 hover:shadow-[0_8px_28px_rgba(15,23,42,0.10)] transition-all duration-200 cursor-pointer',
  }

  return (
    <div
      className={`rounded-[28px] p-5 md:p-6 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`flex items-center justify-between gap-4 mb-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <h3
      className={`text-base font-bold text-slate-900 tracking-tight leading-snug ${className}`}
      {...props}
    >
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <p className={`text-xs text-slate-500 mt-0.5 leading-normal ${className}`} {...props}>
      {children}
    </p>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`space-y-4 ${className}`} {...props}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <div className={`mt-5 pt-4 border-t border-slate-200 flex items-center justify-between ${className}`} {...props}>
      {children}
    </div>
  )
}
