"use client";

import { MoreHorizontal, Pencil } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { PlatformAdmin } from "@/lib/utils/platform-utils";

export function AdminRowActions({
    admin,
    currentAdminId,
    onEdit,
    onDeactivate,
    onReactivate,
}: {
    admin: PlatformAdmin;
    currentAdminId?: string;
    onEdit: () => void;
    onDeactivate: () => void;
    onReactivate: () => void;
}) {
    const t = useTranslations("platform");
    const locale = useLocale();
    return (
        <DropdownMenu dir={locale === 'ar' ? 'rtl' : 'ltr'}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="size-8" aria-label={t("common.actions")}>
                    <MoreHorizontal />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onEdit}>
                    <Pencil />
                    {t("common.edit")}
                </DropdownMenuItem>
                {currentAdminId !== admin.public_id &&
                    (admin.is_active ? (
                        <DropdownMenuItem variant="destructive" onClick={onDeactivate}>
                            {t("common.suspend")}
                        </DropdownMenuItem>
                    ) : (
                        <DropdownMenuItem onClick={onReactivate}>
                            {t("common.reactivate")}
                        </DropdownMenuItem>
                    ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
