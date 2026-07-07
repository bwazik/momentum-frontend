'use client';

import { Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export function copyTaskLink(publicId: string, basePath = '/tasks/'): string {
  return `${window.location.origin}${basePath}${publicId}`;
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
  linkCopiedLabel?: string;
  copyFailedLabel?: string;
  basePath?: string;
}

export function CopyLinkButton({
  publicId,
  size = 'icon-sm',
  variant = 'ghost',
  ariaLabel,
  linkCopiedLabel = 'Link copied',
  copyFailedLabel = 'Failed to copy link',
  basePath = '/tasks/',
}: CopyLinkButtonProps) {
  const url = copyTaskLink(publicId, basePath);

  return (
    <Button
      variant={variant}
      size={size}
      aria-label={ariaLabel}
      onClick={() => copyToClipboard(url, linkCopiedLabel, copyFailedLabel)}
    >
      <Copy className="me-2 size-4" />
    </Button>
  );
}
