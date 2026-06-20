'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useTranslations } from 'next-intl';

export function copyTaskLink(publicId: string): string {
  return `${window.location.origin}/tasks/${publicId}`;
}

export function copyToClipboard(text: string, successMsg: string, failMsg: string): void {
  try {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    toast.success(successMsg);
  } catch {
    try {
      navigator.clipboard.writeText(text);
      toast.success(successMsg);
    } catch {
      toast.error(failMsg);
    }
  }
}

interface CopyLinkButtonProps {
  publicId: string;
  size?: 'sm' | 'icon-sm' | 'default';
  variant?: 'ghost' | 'outline' | 'default';
  ariaLabel?: string;
}

export function CopyLinkButton({
  publicId,
  size = 'icon-sm',
  variant = 'ghost',
  ariaLabel,
}: CopyLinkButtonProps) {
  const t = useTranslations('tasks.board.columns');
  const url = copyTaskLink(publicId);

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={ariaLabel || t('copy_link')}
      onClick={() => copyToClipboard(url, t('link_copied'), t('copy_failed'))}
    >
      <Copy className="me-2 size-4" />
    </Button>
  );
}
