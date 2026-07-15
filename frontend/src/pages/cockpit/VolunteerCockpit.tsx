import { CheckCircle2, GraduationCap, MapPin, Radio } from "lucide-react";

import { usePublicExperience } from "@/hooks/useExperience";
import { Panel } from "@/pages/cockpit/shared";
import type { FanEvent } from "@/types/api";

interface VolunteerTask {
  id: string;
  title: string;
  detail: string;
}

const fallbackShifts: FanEvent[] = [
  {
    eventId: "shift-1",
    title: "North Gate B",
    location: "Wayfinding",
    startsAt: "2026-07-15T16:00:00Z",
    description: "Simulated volunteer shift",
    ticketRequired: false,
  },
  {
    eventId: "shift-2",
    title: "Concourse 210",
    location: "Language Assist",
    startsAt: "2026-07-15T17:00:00Z",
    description: "Simulated volunteer shift",
    ticketRequired: false,
  },
  {
    eventId: "shift-3",
    title: "Family Zone",
    location: "Accessibility Buddy",
    startsAt: "2026-07-15T15:30:00Z",
    description: "Simulated volunteer shift",
    ticketRequired: false,
  },
];

const fallbackTasks: VolunteerTask[] = [
  {
    id: "task-1",
    title: "Escort mobility guest to Section 118",
    detail: "Due 17:20",
  },
  {
    id: "task-2",
    title: "Verify Spanish signage - Concourse 210",
    detail: "Due 18:00",
  },
  {
    id: "task-3",
    title: "Water station refill - West B",
    detail: "Due 19:30",
  },
];

const trainingModules = [
  { label: "Crowd flow basics", progress: 100 },
  { label: "Accessibility etiquette", progress: 80 },
  { label: "Emergency protocols", progress: 45 },
  { label: "Multilingual phrases", progress: 20 },
];

const scenarioComms = [
  {
    sender: "Supervisor - N-Gate",
    message: "Turnstile 4 slow. Redirect groups to 3 and 5.",
    time: "17:12",
  },
  {
    sender: "Med Team",
    message: "Ambulance access clear at Ramp 2.",
    time: "17:04",
  },
  {
    sender: "Ops",
    message: "Language support requested - Concourse 210.",
    time: "16:52",
  },
];

const taskBorders = ["border-secondary", "border-accent", "border-primary"];
const taskPriorities = ["high", "med", "low"];

function ShiftRow({ shift, index }: { shift: FanEvent; index: number }) {
  const pending = index === 2;
  const startTime = new Date(shift.startsAt).toLocaleTimeString("en", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="flex items-center gap-3 py-3">
      <span className="grid size-10 place-content-center rounded-lg border border-border text-secondary">
        <MapPin aria-hidden="true" className="size-4" />
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{shift.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {shift.location}
        </p>
      </div>
      <div className="text-right">
        <p className="font-mono text-xs">{startTime}</p>
        <p
          className={`font-mono text-[0.58rem] uppercase ${pending ? "text-accent" : "text-primary"}`}
        >
          {pending ? "pending" : "confirmed"}
        </p>
      </div>
    </div>
  );
}

function ShiftsPanel({ shifts }: { shifts: FanEvent[] }): JSX.Element {
  const visibleShifts = shifts.length ? shifts : fallbackShifts;
  return (
    <Panel
      eyebrow="TODAY - CONNECTED SNAPSHOT"
      icon={
        <span className="size-3 rounded-full bg-primary shadow-[0_0_12px_var(--primary)]" />
      }
      title="Your shifts"
    >
      <div className="mt-4 divide-y divide-border">
        {visibleShifts.map((shift, index) => (
          <ShiftRow index={index} key={shift.eventId} shift={shift} />
        ))}
      </div>
    </Panel>
  );
}

function TaskRow({ task, index }: { task: VolunteerTask; index: number }) {
  return (
    <li
      className={`rounded-r-lg border-l-2 ${taskBorders[index]} bg-background/35 p-3`}
    >
      <div className="flex gap-2">
        <CheckCircle2
          aria-hidden="true"
          className="mt-0.5 size-4 shrink-0 text-muted-foreground"
        />
        <div>
          <p className="text-sm font-semibold">{task.title}</p>
          <p className="mt-1 font-mono text-[0.58rem] uppercase text-muted-foreground">
            {task.detail} - {taskPriorities[index]}
          </p>
        </div>
      </div>
    </li>
  );
}

function TasksPanel({ tasks }: { tasks: VolunteerTask[] }): JSX.Element {
  const visibleTasks = tasks.length ? tasks : fallbackTasks;
  return (
    <Panel eyebrow="SIMULATED SNAPSHOT - 3 OPEN" title="Assigned tasks">
      <ul className="mt-4 grid gap-3">
        {visibleTasks.map((task, index) => (
          <TaskRow index={index} key={task.id} task={task} />
        ))}
      </ul>
    </Panel>
  );
}

function TrainingPanel(): JSX.Element {
  return (
    <Panel
      eyebrow="DEMO PROGRESS - BEFORE KICKOFF"
      icon={<GraduationCap aria-hidden="true" className="size-4" />}
      title="Training modules"
    >
      <div className="mt-5 grid gap-4">
        {trainingModules.map((module) => (
          <div key={module.label}>
            <div className="flex justify-between text-sm">
              <span>{module.label}</span>
              <span className="font-mono text-xs text-muted-foreground">
                {module.progress}%
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,var(--brand-cyan),var(--brand-magenta))]"
                style={{ width: `${module.progress}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </Panel>
  );
}

function CommsPanel(): JSX.Element {
  return (
    <Panel
      eyebrow="ZONE B - SIMULATED"
      icon={<Radio aria-hidden="true" className="size-4 text-secondary" />}
      title="Scenario comms"
    >
      <div className="mt-4 grid gap-2">
        {scenarioComms.map((item) => (
          <div
            className="rounded-lg border border-border p-3"
            key={item.sender}
          >
            <div className="flex justify-between font-mono text-[0.58rem] uppercase tracking-wider text-primary">
              <span>{item.sender}</span>
              <span className="text-muted-foreground">{item.time}</span>
            </div>
            <p className="mt-2 text-sm">{item.message}</p>
          </div>
        ))}
      </div>
    </Panel>
  );
}

export function VolunteerCockpit(): JSX.Element {
  const { data } = usePublicExperience();
  const shifts = data?.fanEvents.slice(0, 3) ?? [];
  const tasks = [
    ...(data?.alerts ?? []).map((alert) => ({
      id: alert.alertId,
      title: alert.title,
      detail: alert.zone,
    })),
    ...(data?.amenities ?? []).map((amenity) => ({
      id: amenity.amenityId,
      title: `Verify ${amenity.name}`,
      detail: amenity.zone,
    })),
  ].slice(0, 3);

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <ShiftsPanel shifts={shifts} />
      <TasksPanel tasks={tasks} />
      <TrainingPanel />
      <CommsPanel />
    </div>
  );
}
