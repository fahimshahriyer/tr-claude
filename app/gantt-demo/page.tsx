'use client';

import { Gantt } from '@/app/components/gantt/Gantt';
import { MOCK_TASKS, MOCK_DEPENDENCIES } from '@/app/components/gantt/core/mockData';

export default function GanttDemoPage() {
  return (
    <div className="w-full h-screen">
      <Gantt
        tasks={MOCK_TASKS}
        dependencies={MOCK_DEPENDENCIES}
      />
    </div>
  );
}
