import * as React from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={cn('rounded-xl border border-gray-200 bg-white p-6 shadow-sm', className)}>{children}</div>;
}

export function CardTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return <h3 className={cn('mb-3 text-base font-semibold text-brand-900', className)}>{children}</h3>;
}

export function Button({
  children,
  variant = 'primary',
  className,
  type = 'submit',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'ghost' | 'danger' }) {
  const styles = {
    primary: 'bg-brand-900 text-white hover:bg-brand-800 focus-visible:ring-brand-600',
    secondary: 'bg-white text-brand-900 border border-brand-900 hover:bg-brand-50 focus-visible:ring-brand-600',
    ghost: 'bg-transparent text-brand-900 hover:bg-brand-50 focus-visible:ring-brand-600',
    danger: 'bg-risk-alto text-white hover:opacity-90 focus-visible:ring-risk-alto',
  } as const;
  return (
    <button
      type={type}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50',
        styles[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function LinkButton({ href, children, variant = 'primary', className }: { href: string; children: React.ReactNode; variant?: 'primary' | 'secondary' | 'ghost'; className?: string }) {
  const styles = {
    primary: 'bg-brand-900 text-white hover:bg-brand-800',
    secondary: 'bg-white text-brand-900 border border-brand-900 hover:bg-brand-50',
    ghost: 'bg-transparent text-brand-900 hover:bg-brand-50',
  } as const;
  return (
    <Link href={href} className={cn('inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors', styles[variant], className)}>
      {children}
    </Link>
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cn(
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
        props.className,
      )}
    />
  );
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cn(
        'w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
        props.className,
      )}
    />
  );
}

export function Select(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      {...props}
      className={cn(
        'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-brand-600 focus:outline-none focus:ring-1 focus:ring-brand-600',
        props.className,
      )}
    />
  );
}

export function Label({ children, htmlFor }: { children: React.ReactNode; htmlFor?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-sm font-medium text-gray-700">
      {children}
    </label>
  );
}

function slugifyForId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function Field({ children, label, hint }: { children: React.ReactNode; label: string; hint?: string }) {
  const generatedId = `field-${slugifyForId(label)}`;
  const child = React.isValidElement(children)
    ? React.cloneElement(children as React.ReactElement<{ id?: string }>, {
        id: (children as React.ReactElement<{ id?: string }>).props.id ?? generatedId,
      })
    : children;
  const childId = React.isValidElement(child) ? (child.props as { id?: string }).id : undefined;

  return (
    <div>
      <Label htmlFor={childId}>{label}</Label>
      {child}
      {hint && <p className="mt-1 text-xs text-gray-500">{hint}</p>}
    </div>
  );
}

export function EmptyState({ title, description, action }: { title: string; description: string; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
      <p className="text-base font-medium text-gray-700">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function Alert({ children, variant = 'error' }: { children: React.ReactNode; variant?: 'error' | 'warning' | 'info' | 'success' }) {
  const styles = {
    error: 'border-risk-alto/30 bg-risk-alto/5 text-risk-alto',
    warning: 'border-risk-medio/30 bg-risk-medio/5 text-risk-medio',
    info: 'border-brand-600/30 bg-brand-50 text-brand-800',
    success: 'border-risk-bajo/30 bg-risk-bajo/5 text-risk-bajo',
  } as const;
  return <div className={cn('rounded-lg border px-4 py-3 text-sm', styles[variant])}>{children}</div>;
}
