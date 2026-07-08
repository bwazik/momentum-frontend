'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { FileSearch } from 'lucide-react';
import { Field, FieldLabel } from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

interface ExternalReferenceFilterInputProps {
  value?: string;
}

export function ExternalReferenceFilterInput({ value }: ExternalReferenceFilterInputProps) {
  const t = useTranslations('tasks.board.filters');
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [input, setInput] = useState(value ?? '');
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      const current = searchParams.get('externalReference') ?? '';
      if (input !== current) {
        const params = new URLSearchParams(searchParams.toString());
        if (input.trim()) params.set('externalReference', input.trim());
        else params.delete('externalReference');
        router.replace(`${pathname}?${params.toString()}`);
      }
    }, 300);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [input, pathname, router, searchParams]);

  return (
    <Field>
      <FieldLabel className="sr-only">{t('external_reference')}</FieldLabel>
      <InputGroup>
        <InputGroupInput
          value={input}
          placeholder={t('external_reference_placeholder')}
          onChange={(e) => setInput(e.target.value)}
        />
        <InputGroupAddon><FileSearch aria-hidden="true" className="size-4" /></InputGroupAddon>
      </InputGroup>
    </Field>
  );
}
