'use client';

import { useLocale } from 'next-intl';
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
} from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { localizeName } from './task-detail-utils';
import type { TaskStageAssignmentResource } from './task-detail-types';

interface AssigneeAvatarStackProps {
  assignments: TaskStageAssignmentResource[];
  max?: number;
}

export function AssigneeAvatarStack({
  assignments,
  max = 3,
}: AssigneeAvatarStackProps) {
  const locale = useLocale();
  const visible = assignments.slice(0, max);

  return (
    <AvatarGroup>
      {visible.map((a) => {
        const name = localizeName(locale, a.user_name_ar, a.user_name_en);
        return (
          <Tooltip key={a.user_id}>
            <TooltipTrigger asChild>
              <Avatar size="sm">
                <AvatarFallback>{name.charAt(0)}</AvatarFallback>
              </Avatar>
            </TooltipTrigger>
            <TooltipContent side="top">{name}</TooltipContent>
          </Tooltip>
        );
      })}
      {assignments.length > max && (
        <AvatarGroupCount>+{assignments.length - max}</AvatarGroupCount>
      )}
    </AvatarGroup>
  );
}
