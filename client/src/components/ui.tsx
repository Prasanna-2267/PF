import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode } from 'react';

export function AuthCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4 text-slate-100">
      <div className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/60 p-8 shadow-xl">
        <p className="bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-xl font-semibold tracking-tight text-transparent">
          Parallax Flow
        </p>
        <h1 className="mt-5 text-lg font-medium">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-slate-400">{subtitle}</p> : null}
        <div className="mt-6 space-y-4">{children}</div>
      </div>
    </div>
  );
}

export function TextInput({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label?: string }) {
  return (
    <label className="block space-y-1">
      {label ? <span className="text-xs font-medium text-slate-400">{label}</span> : null}
      <input
        {...props}
        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm outline-none transition-colors focus:border-violet-500"
      />
    </label>
  );
}

export function Button({ children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className="w-full rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  return children ? <p className="text-sm text-rose-400">{children}</p> : null;
}

export function Spinner() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-slate-400">
      <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-700 border-t-violet-500" />
    </div>
  );
}
