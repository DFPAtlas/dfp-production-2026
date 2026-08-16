import { Suspense } from 'react';
import StaffShell from '../../../components/staff/StaffShell';
import TasksSkeleton from '../../../components/staff/TasksSkeleton';
import TasksPageInner from './TasksPageInner';

export default function StaffTasksPage() {
  return (
    <StaffShell>
      <Suspense fallback={<TasksSkeleton />}>
        <TasksPageInner />
      </Suspense>
    </StaffShell>
  );
}