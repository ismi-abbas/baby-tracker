import * as React from 'react';
import { DayPicker } from 'react-day-picker';
import { cn } from '../lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

export function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn('p-3', className)}
      classNames={{
        root: 'w-full',
        months: 'flex flex-col gap-4',
        month: 'space-y-4',
        month_caption: 'relative flex items-center justify-center pt-1',
        caption_label: 'text-sm font-semibold text-ink',
        nav: 'flex items-center gap-1',
        button_previous: cn(
          'absolute left-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-[10px]',
          'border border-rule bg-card text-ink-soft transition-colors hover:bg-parchment'
        ),
        button_next: cn(
          'absolute right-0 top-0 inline-flex h-8 w-8 items-center justify-center rounded-[10px]',
          'border border-rule bg-card text-ink-soft transition-colors hover:bg-parchment'
        ),
        month_grid: 'w-full border-collapse space-y-1',
        weekdays: 'flex',
        weekday: 'w-9 rounded-md text-[10.5px] font-semibold uppercase tracking-[0.4px] text-ink-mute',
        week: 'mt-2 flex w-full',
        day: cn(
          'relative h-9 w-9 p-0 text-center text-sm',
          '[&:has([aria-selected])]:rounded-[10px] [&:has([aria-selected])]:bg-terracotta-soft'
        ),
        day_button: cn(
          'inline-flex h-9 w-9 items-center justify-center rounded-[10px] text-[13px] font-semibold text-ink',
          'transition-colors hover:bg-parchment focus:outline-none focus:ring-2 focus:ring-terracotta/30'
        ),
        selected: 'bg-terracotta text-card hover:bg-terracotta hover:text-card focus:bg-terracotta focus:text-card',
        today: 'bg-honey-soft text-ink',
        outside: 'text-ink-mute opacity-40',
        disabled: 'text-ink-mute opacity-35',
        range_middle: 'aria-selected:bg-terracotta-soft aria-selected:text-ink',
        hidden: 'invisible',
        ...classNames,
      }}
      {...props}
    />
  );
}
