import type { ButtonHTMLAttributes, ReactNode } from 'react';

export function ActionButton({ children, className = '', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { children: ReactNode }) {
  return <button className={`action-button ${className}`} {...props}>{children}</button>;
}
