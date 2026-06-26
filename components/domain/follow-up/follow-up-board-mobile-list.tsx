'use client';

import type { BoardTaskResource } from './follow-up-types';
import { FollowUpTaskCard } from './follow-up-task-card';

interface FollowUpBoardMobileListProps {
  tasks: BoardTaskResource[];
  onLogFollowUp: (task: BoardTaskResource) => void;
  onEscalate: (task: BoardTaskResource) => void;
}

export function FollowUpBoardMobileList({ tasks, onLogFollowUp, onEscalate }: FollowUpBoardMobileListProps) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <FollowUpTaskCard
          key={task.public_id}
          task={task}
          onLogFollowUp={() => onLogFollowUp(task)}
          onEscalate={() => onEscalate(task)}
        />
      ))}
    </div>
  );
}
