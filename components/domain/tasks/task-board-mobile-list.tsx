'use client';

import type { BoardTaskResource } from './task-board-types';
import { TaskCard } from './task-card';

interface TaskBoardMobileListProps {
  tasks: BoardTaskResource[];
}

export function TaskBoardMobileList({ tasks }: TaskBoardMobileListProps) {
  return (
    <div className="flex flex-col gap-3">
      {tasks.map((task) => (
        <TaskCard key={task.public_id} task={task} />
      ))}
    </div>
  );
}
