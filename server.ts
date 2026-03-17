import express from 'express';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';

const db = new Database('erp_tracker.db');

// Initialize DB schema
db.exec(`
  CREATE TABLE IF NOT EXISTS issues (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL, -- 'task', 'bug', 'issue'
    status TEXT NOT NULL, -- 'todo', 'in_progress', 'blocked', 'done'
    priority TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
    assignee TEXT,
    delay_cause TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Seed data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM issues').get() as { count: number };
if (count.count === 0) {
  const seedIssues = [
    { id: uuidv4(), title: 'Implement OAuth Login', description: 'Add Google and GitHub login options', type: 'task', status: 'done', priority: 'high', assignee: 'Alice', delay_cause: null },
    { id: uuidv4(), title: 'Fix memory leak in Dashboard', description: 'Dashboard crashes after 10 minutes of usage', type: 'bug', status: 'in_progress', priority: 'critical', assignee: 'Bob', delay_cause: null },
    { id: uuidv4(), title: 'Update ERP API Integration', description: 'Migrate to v2 of the internal ERP API', type: 'task', status: 'blocked', priority: 'high', assignee: 'Charlie', delay_cause: 'Waiting for API documentation from the backend team' },
    { id: uuidv4(), title: 'Design new reporting module', description: 'Create wireframes for the new reports', type: 'task', status: 'todo', priority: 'medium', assignee: 'Diana', delay_cause: null },
    { id: uuidv4(), title: 'Data sync failing occasionally', description: 'Sync job fails with timeout error', type: 'issue', status: 'todo', priority: 'medium', assignee: null, delay_cause: null },
  ];

  const insert = db.prepare(`
    INSERT INTO issues (id, title, description, type, status, priority, assignee, delay_cause)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((issues) => {
    for (const issue of issues) {
      insert.run(issue.id, issue.title, issue.description, issue.type, issue.status, issue.priority, issue.assignee, issue.delay_cause);
    }
  });

  insertMany(seedIssues);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json());

  // API Routes
  app.get('/api/issues', (req, res) => {
    const issues = db.prepare('SELECT * FROM issues ORDER BY created_at DESC').all();
    res.json(issues);
  });

  app.post('/api/issues', (req, res) => {
    const { title, description, type, status, priority, assignee, delay_cause } = req.body;
    const id = uuidv4();
    const stmt = db.prepare(`
      INSERT INTO issues (id, title, description, type, status, priority, assignee, delay_cause)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(id, title, description, type, status, priority, assignee, delay_cause);
    const newIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    res.status(201).json(newIssue);
  });

  app.put('/api/issues/:id', (req, res) => {
    const { id } = req.params;
    const { title, description, type, status, priority, assignee, delay_cause } = req.body;
    const stmt = db.prepare(`
      UPDATE issues 
      SET title = COALESCE(?, title),
          description = COALESCE(?, description),
          type = COALESCE(?, type),
          status = COALESCE(?, status),
          priority = COALESCE(?, priority),
          assignee = COALESCE(?, assignee),
          delay_cause = COALESCE(?, delay_cause),
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `);
    stmt.run(title, description, type, status, priority, assignee, delay_cause, id);
    const updatedIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
    res.json(updatedIssue);
  });

  app.delete('/api/issues/:id', (req, res) => {
    const { id } = req.params;
    db.prepare('DELETE FROM issues WHERE id = ?').run(id);
    res.status(204).send();
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
