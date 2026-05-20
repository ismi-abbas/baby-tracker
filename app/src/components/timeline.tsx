import * as React from 'react';
import { cn } from '../lib/utils';

const Timeline = React.forwardRef<
  HTMLOListElement,
  React.HTMLAttributes<HTMLOListElement>
>(({ className, ...props }, ref) => (
  <ol ref={ref} className={cn('relative flex flex-col', className)} {...props} />
));
Timeline.displayName = 'Timeline';

const TimelineItem = React.forwardRef<
  HTMLLIElement,
  React.LiHTMLAttributes<HTMLLIElement>
>(({ className, ...props }, ref) => (
  <li
    ref={ref}
    className={cn('group relative mb-2.5 flex gap-3 last:mb-0', className)}
    {...props}
  />
));
TimelineItem.displayName = 'TimelineItem';

// w-10 (40px) time + gap-3 (12px) + half of w-3.5 dot (7px) - half of w-0.5 line (1px) = 58px
const TimelineConnector = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'absolute top-0 bottom-0 left-[58px] w-0.5 bg-rule group-last:hidden',
      className
    )}
    {...props}
  />
));
TimelineConnector.displayName = 'TimelineConnector';

const TimelineTime = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'w-10 shrink-0 pt-3 text-right font-mono text-[11px] font-semibold text-ink-soft',
      className
    )}
    {...props}
  />
));
TimelineTime.displayName = 'TimelineTime';

const TimelineDot = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('relative z-[2] shrink-0 pt-2.5', className)}
    {...props}
  />
));
TimelineDot.displayName = 'TimelineDot';

const TimelineContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('flex-1 pb-1', className)} {...props} />
));
TimelineContent.displayName = 'TimelineContent';

export {
  Timeline,
  TimelineItem,
  TimelineConnector,
  TimelineTime,
  TimelineDot,
  TimelineContent,
};
