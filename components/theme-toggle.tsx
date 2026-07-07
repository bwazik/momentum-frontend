"use client"

import { useLocale, useTranslations } from 'next-intl';
import { Moon, Sun } from "lucide-react"
import { useTheme } from "next-themes"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

const themes = ['light', 'dark', 'system'] as const;

export function ModeToggle() {
  const { theme, setTheme } = useTheme()
  const locale = useLocale()
  const t = useTranslations('shell')

  return (
    <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="icon" className="cursor-pointer">
          <Sun className="h-[1.2rem] w-[1.2rem] scale-100 rotate-0 transition-all dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute h-[1.2rem] w-[1.2rem] scale-0 rotate-90 transition-all dark:scale-100 dark:rotate-0" />
          <span className="sr-only">{t('toggle_theme')}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {themes.map((mode) => (
          <DropdownMenuItem key={mode} onClick={() => setTheme(mode)} className={`cursor-pointer ${mode === theme ? 'bg-accent' : ''}`}>
            {mode === 'light' && <Sun data-slot="sidebar-menu-button-icon" />}
            {mode === 'dark' && <Moon data-slot="sidebar-menu-button-icon" />}
            {mode === 'system' && <Sun data-slot="sidebar-menu-button-icon" />}
            <span>{t(mode)}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
