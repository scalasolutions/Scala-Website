import React from 'react';
import { cn } from '@/lib/utils';

type DividerProps = React.HTMLAttributes<HTMLHRElement>;

export default function Divider({ className, ...props }: DividerProps) {
  return <hr className={cn('border-t border-border my-6', className)} {...props} />;
}
