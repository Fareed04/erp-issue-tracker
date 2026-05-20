# ERP Tracker

A powerful, purpose-built platform designed to streamline and monitor the development workflow of an in-house Enterprise Resource Planning (ERP) system. Building an ERP is complex, requiring tight coordination across multiple teams. ERP Tracker simplifies this by providing a centralized hub to manage tasks, track bugs, monitor project health, and log development delays or blockers. By leveraging Firebase, the application ensures that all teams stay synchronized in real-time, eliminating silos and communication gaps.

**Live Application:** [https://gen-lang-client-0739057189.web.app/](https://gen-lang-client-0739057189.web.app/)

## Key Features

- **Interactive Dashboard**: Gain immediate visibility into the overall health of your ERP project. The dashboard provides a high-level overview featuring critical statistics such as total active items, unresolved bugs, and blocked tasks. It also includes visual charts breaking down issues by status and type for quick analytical insights.
- **Kanban Board & List Views**: Visualize the development pipeline with an intuitive Kanban layout, allowing teams to effortlessly track task progress across distinct lifecycle stages (To Do, In Progress, Blocked, Done). 
- **Advanced Issue Management**: Create detailed tickets with rich context. Track issue types (Bug, Feature, Task), set priority levels, assign team members, and document specific causes for delays to proactively manage project timelines.
- **Issue Relationship Mapping**: Complex systems have complex dependencies. Establish clear relationships between distinct issues to keep track of dependencies. Mark an issue as "blocking," "blocked by," or "related to" another task so developers understand exactly what needs to be resolved first.
- **Role-Based Access Control (RBAC)**: Securely manage your workflow with distinct permissions tailor-made for different team members. Admins retain full control over the environment (including user management and ticket deletion), while Managers oversee progress, and Developers focus strictly on assigned tasks and updates.
- **Real-Time Collaboration**: Powered by Firebase Firestore, every update, comment, and status change is broadcast instantly to all connected users. No manual refreshing is required, ensuring teams are always working with the most up-to-date information.
- **Activity Logging & Discussions**: Maintain complete transparency throughout the entire lifecycle of an issue. Every ticket features a real-time comment thread for team discussions and an immutable activity log that tracks all state changes and edits.
- **Responsive Dark/Light Mode**: A beautifully crafted, modern user interface built with Tailwind CSS that respects user system preferences, offering both light and dark themes to reduce eye strain during long coding sessions.

## Tech Stack

- **Frontend**: React (with TypeScript) and Vite for an incredibly fast and type-safe development environment.
- **Styling**: Tailwind CSS for building a pristine, responsive user interface, paired with Lucide React for consistent iconography.
- **Backend & Database**: Firebase Firestore provides a real-time, highly scalable NoSQL database. Firebase Authentication securely handles user login and identity management.
- **Custom Server**: An Express server running on Node.js to manage secure background operations and API routing alongside the client application.
