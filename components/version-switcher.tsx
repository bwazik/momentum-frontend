"use client"

import * as React from "react"
import type { LucideIcon } from "lucide-react"
import { ChevronsUpDownIcon, CheckIcon } from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function VersionSwitcher({
  versions,
  defaultVersion,
  appName,
  icon: Icon,
  locale = 'ar',
  versionLabel,
}: {
  versions: string[]
  defaultVersion: string
  appName?: string
  icon?: LucideIcon
  locale?: 'ar' | 'en'
  versionLabel?: string
}) {
  const [selectedVersion, setSelectedVersion] = React.useState(defaultVersion)
  const IconComponent = Icon

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              {IconComponent && (
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IconComponent className="size-4" />
                </div>
              )}
              <div className="flex flex-col gap-1 leading-none text-start">
                {appName && <span className="font-medium">{appName}</span>}
                <span className="">{versionLabel ?? `v${selectedVersion}`}</span>
              </div>
              <ChevronsUpDownIcon className="ms-auto" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width)"
            align="start"
          >
            {versions.map((version) => (
              <DropdownMenuItem
                key={version}
                onSelect={() => setSelectedVersion(version)}
              >
                {versionLabel ?? `v${version}`}{" "}
                {version === selectedVersion && (
                  <CheckIcon className="ms-auto" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
