export function ActiveBadge({ isActive, activeLabel, inactiveLabel }: { isActive: boolean; activeLabel: string; inactiveLabel: string }) {
  return (
    <span className={isActive ? 'text-sm text-emerald-600 dark:text-emerald-400' : 'text-sm text-muted-foreground'}>
      {isActive ? activeLabel : inactiveLabel}
    </span>
  );
}
