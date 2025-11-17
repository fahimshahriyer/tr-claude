'use client';

import { EnterpriseScheduler } from "../components/enterprise-scheduler";
import {
  generateSampleResources,
  generateSampleEvents,
  generateSampleDependencies,
} from "../components/enterprise-scheduler/utils/sampleData";

export default function SchedulerPage() {
  const resources = generateSampleResources();
  const events = generateSampleEvents();
  const dependencies = generateSampleDependencies();

  return (
    <EnterpriseScheduler
      resources={resources}
      events={events}
      dependencies={dependencies}
      config={{
        enableDragDrop: true,
        enableResize: true,
        enableCreate: true,
        enableDependencies: true,
        snapIncrement: 15,
        rowHeight: 50,
        sidebarWidth: 250,
      }}
    />
  );
}
