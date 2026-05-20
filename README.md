# ERP Tracker

A comprehensive platform to track tasks, bugs, and issues, as well as delays and causes, specifically designed for managing an in-house ERP system workflow. The project leverages Firebase for seamless real-time syncing and robust backend management.

**Live Application:** [https://gen-lang-client-0739057189.web.app/](https://gen-lang-client-0739057189.web.app/)

## Features

- **Dashboard**: A high-level overview of the ERP system's health, displaying vital statistics such as total items, active bugs, and blocked/completed issues. Includes visual charts for issue tracking by status and type.
- **Kanban Board**: A visual layout for tracking task progress across multiple stages (To Do, In Progress, Blocked, Done).
- **Issue Management**: Create, edit, update, delete, and view comprehensive issue details including types, priorities, status, and assignment.
- **Related Issues**: Establish relationships between distinct issues such as noting when a bug "blocks", "is blocked by", or simply "relates to" another specific task.
- **Role-Based Access Control**: Admins, Managers, and Developers have differing permissions (e.g., only Admis can manage certain user roles or delete tickets).
- **Real-Time Database**: Powered by Firebase Firestore for robust persistence and multi-user live synchronization.
- **Dark Mode Support**: Beautiful standard UI built with React and Tailwind CSS featuring dynamic responsive theming.
- **Activity & Comments Log**: Real-time notifications and comment logging for complete tracking transparency throughout issue lifecycles.

## Tech Stack

- **React & Vite**: Fast frontend framework and build tool.
- **Firebase**: Firestore for real-time NoSQL data holding, and Firebase Auth for secure login and management.
- **Tailwind CSS**: Modern utility-first CSS framework for pristine layouts and user interfaces.
- **Express Backend**: Custom server running parallel to the client application for secure backend processing capabilities.
