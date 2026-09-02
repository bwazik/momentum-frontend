"use client";

import { useLocale, useTranslations } from "next-intl";
import { RtlTable } from "@/components/shared/rtl-table";
import { ActiveBadge } from "@/components/shared/active-badge";
import { DualDateDisplay } from "@/components/shared/dual-date-display";
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AdminRowActions } from "./admin-row-actions";
import { localizeName, type PlatformAdmin } from "@/lib/utils/platform-utils";

interface AdminsTableProps {
  admins: PlatformAdmin[];
  currentAdminId?: string;
  onEdit: (admin: PlatformAdmin) => void;
  onDeactivate: (admin: PlatformAdmin) => void;
  onReactivate: (admin: PlatformAdmin) => void;
}

export function AdminsTable({
  admins,
  currentAdminId,
  onEdit,
  onDeactivate,
  onReactivate,
}: AdminsTableProps) {
  const t = useTranslations("platform.admins");
  const c = useTranslations("platform.common");
  const locale = useLocale();
  return (
    <RtlTable aria-label={t("table_aria_label")}>
      <TableHeader>
        <TableRow>
          <TableHead className="text-start">{t("name")}</TableHead>
          <TableHead className="text-start">{t("email")}</TableHead>
          <TableHead className="text-start">{t("account_type")}</TableHead>
          <TableHead className="text-start">{t("status")}</TableHead>
          <TableHead className="text-start">{t("created_at")}</TableHead>
          <TableHead className="text-end">{c("actions")}</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {admins.map((admin) => (
          <TableRow key={admin.public_id}>
            <TableCell>
              {localizeName(locale, admin.name_ar, admin.name_en)}
            </TableCell>
            <TableCell dir="ltr">{admin.email}</TableCell>
            <TableCell>{admin.account_type}</TableCell>
            <TableCell>
              <ActiveBadge
                isActive={admin.is_active}
                activeLabel={c("active")}
                inactiveLabel={c("inactive")}
              />
            </TableCell>
            <TableCell>
              <DualDateDisplay gregorian={admin.created_at} />
            </TableCell>
            <TableCell className="text-end">
              <AdminRowActions
                admin={admin}
                currentAdminId={currentAdminId}
                onEdit={() => onEdit(admin)}
                onDeactivate={() => onDeactivate(admin)}
                onReactivate={() => onReactivate(admin)}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </RtlTable>
  );
}
