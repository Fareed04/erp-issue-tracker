# ERP Tracker

A full-stack issue, bug, and task tracking platform built to monitor workflows, delays, dependencies, and time spent across an in-house ERP system.

## Features

### Views & Workflow
- **Dashboard Overview**: Live summary cards (Total Items, Active Bugs, Blocked, Completed) alongside interactive status and type breakdown charts.
- **Kanban Board**: Drag-and-drop task management across `Draft`, `To Do`, `In Progress`, `Blocked`, and `Done` columns, with optional **Assignee** and **Priority** swimlanes.
  - Displays **assignment date & time** along with a **live pending duration** indicator (with age-based color cues) on each card.
  - Displays **total logged time** directly on every issue card, with an hour/minute breakdown on hover.
  - Highlights active **blocker dependencies** and **delay causes**.
- **Issue List**: Sortable tabular overview with multi-select bulk updates (status and priority), overdue indicators, dependency chips, a **Logged** hours column, and one-click **Excel (`.xlsx`) export**.
- **Refined Filter Bar**: Unified search and filtering across Dashboard and Issue List views with `/` keyboard shortcut focus, icon-labeled dropdowns (Type, Status, Priority, Assignee, Reporter), a cohesive date range picker, dismissible active filter chips, and a dynamic reset counter.

### Issue Management & Time Tracking
- **Time Tracking**:
  - Log hours spent on any issue from the **Time Log** tab (or via the quick **Log Hours** shortcut in the Details view).
  - Supports quick-add presets (`+0.25h`, `+0.5h`, `+1h`, `+2h`), custom decimal hours, work dates, and optional notes.
  - Uses atomic Firestore transactions to keep each issue's `totalLoggedHours` synchronized across Kanban cards, the Issue List, and Excel exports, while automatically recording entries in the Activity Log.
  - Entry authors and Admins can delete time entries.
- **Issue Dependencies**: Link issues with `Blocks`, `Blocked By`, and `Relates To` relationships, displayed across the Issue Modal, Kanban Board cards, and Issue List.
- **Voice Notes & Dictation**: Record audio voice notes on issues with playback speed controls, plus browser speech-to-text dictation for issue descriptions.
- **Comments & Activity Audit Trail**: Real-time threaded comments and chronological activity logs per issue.

### Administration, Security & UX
- **Google Authentication & RBAC**: Firebase Google sign-in with `Admin`, `Manager`, and `Developer` roles and a dedicated **Manage Users** view.
- **Admin Database Explorer**: Built-in Firestore records viewer for Admins to inspect issues, users, comments, audit logs, and email logs.
- **Notifications & Email Alerts**: In-app notification center for assignments, status changes, comments, and approaching deadlines, backed by optional SMTP email delivery (with simulated logging fallback when SMTP is not configured).
- **Smooth Scrolling & Dark Mode**: Frame-rate-independent wheel momentum scrolling (`Shift + Wheel` supported for horizontal boards/tables), light/dark theme toggle, and guided onboarding tutorial.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS v4, Lucide Icons, Recharts, `@dnd-kit`, Motion, `date-fns`, SheetJS (`xlsx`)
- **Backend**: Express (`server.ts`), Nodemailer, Helmet, Express Rate Limit
- **Database & Auth**: Firebase Authentication & Cloud Firestore

## Firestore Data Model

| Collection Path | Description |
| --- | --- |
| `/users/{userId}` | User profiles, roles (`Admin`, `Manager`, `Developer`), and notification preferences |
| `/users/{userId}/notifications/{notificationId}` | Per-user in-app notifications |
| `/issues/{issueId}` | Tasks, bugs, and issues (`status`, `priority`, `assignedAt`, `totalLoggedHours`, `links`, `delay_cause`, `dueDate`, `voiceNoteUrl`) |
| `/issues/{issueId}/timeLogs/{timeLogId}` | Individual time-tracking entries (`hours`, `date`, `note`, `userId`, `timestamp`) |
| `/issues/{issueId}/comments/{commentId}` | Threaded discussion comments |
| `/issues/{issueId}/activities/{activityId}` | Chronological audit trail of issue updates and time logs |

## Getting Started

### Prerequisites
- Node.js 20+
- A configured Firebase project (`firebase-applet-config.json` in the project root)

### Installation
```bash
npm install
```

### Environment Variables
Create a `.env` file based on `.env.example` (optional SMTP variables enable live email delivery):

```env
# Server
PORT=3000
NODE_ENV=development
APP_URL=http://localhost:3000

# Optional SMTP Email Notifications
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
SMTP_FROM="TaskFlow Notifications <notifications@example.com>"
```

### Available Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Express + Vite development server on port `3000` |
| `npm run build` | Build the production frontend bundle into `dist/` |
| `npm run start` | Start the production server (`node server.ts`) |
| `npm run lint` | Run TypeScript type checking (`tsc --noEmit`) |

## Keyboard Shortcuts

- `n` — Open the **Create New Issue** modal
- `/` — Focus the issue search input
- `Shift + Mouse Wheel` — Scroll horizontally on the Kanban Board and Issue List table
