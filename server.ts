import express from 'express';
import Database from 'better-sqlite3';
import { v4 as uuidv4 } from 'uuid';
import cors from 'cors';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';
import dotenv from 'dotenv';

dotenv.config();

const db = new Database('erp_tracker.db');

// Configuration from environment variables
const PORT = process.env.PORT || 3000;
const RATE_LIMIT_WINDOW = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000');
const RATE_LIMIT_MAX = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

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
    reporter TEXT,
    delay_cause TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Validation Schemas
const IssueSchema = z.object({
  title: z.string().min(1).max(255),
  description: z.string().max(2000).optional().nullable(),
  type: z.enum(['task', 'bug', 'issue']),
  status: z.enum(['todo', 'in_progress', 'blocked', 'done']),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assignee: z.string().max(100).optional().nullable(),
  reporter: z.string().max(100).optional().nullable(),
  delay_cause: z.string().max(1000).optional().nullable(),
}).strict();

const UpdateIssueSchema = IssueSchema.partial().strict();

// Seed data if empty
const count = db.prepare('SELECT COUNT(*) as count FROM issues').get() as { count: number };
if (count.count === 0) {
  const seedIssues = [
    { id: uuidv4(), title: 'Implement OAuth Login', description: 'Add Google and GitHub login options', type: 'task', status: 'done', priority: 'high', assignee: 'Alice', reporter: 'Fareed', delay_cause: null },
    { id: uuidv4(), title: 'Fix memory leak in Dashboard', description: 'Dashboard crashes after 10 minutes of usage', type: 'bug', status: 'in_progress', priority: 'critical', assignee: 'Bob', reporter: 'Fareed', delay_cause: null },
    { id: uuidv4(), title: 'Update ERP API Integration', description: 'Migrate to v2 of the internal ERP API', type: 'task', status: 'blocked', priority: 'high', assignee: 'Charlie', reporter: 'Alice', delay_cause: 'Waiting for API documentation from the backend team' },
    { id: uuidv4(), title: 'Design new reporting module', description: 'Create wireframes for the new reports', type: 'task', status: 'todo', priority: 'medium', assignee: 'Diana', reporter: 'Bob', delay_cause: null },
    { id: uuidv4(), title: 'Data sync failing occasionally', description: 'Sync job fails with timeout error', type: 'issue', status: 'todo', priority: 'medium', assignee: null, reporter: 'Charlie', delay_cause: null },
  ];

  const insert = db.prepare(`
    INSERT INTO issues (id, title, description, type, status, priority, assignee, reporter, delay_cause)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const insertMany = db.transaction((issues) => {
    for (const issue of issues) {
      insert.run(issue.id, issue.title, issue.description, issue.type, issue.status, issue.priority, issue.assignee, issue.reporter, issue.delay_cause);
    }
  });

  insertMany(seedIssues);
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Trust proxy - required for express-rate-limit when behind a proxy (like nginx in this environment)
  app.set('trust proxy', 1);

  // Security Headers
  app.use(helmet({
    contentSecurityPolicy: false, // Disable CSP for Vite dev server compatibility
  }));

  // Rate Limiting
  const apiLimiter = rateLimit({
    windowMs: RATE_LIMIT_WINDOW,
    limit: RATE_LIMIT_MAX,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
    validate: { xForwardedForHeader: false }, // Suppress validation warnings as we trust the proxy
  });

  app.use('/api/', apiLimiter);
  app.use(cors());
  app.use(express.json({ limit: '10kb' })); // Limit body size

  // API Routes
  app.get('/api/issues', (req, res) => {
    try {
      const issues = db.prepare('SELECT * FROM issues ORDER BY created_at DESC').all();
      res.json(issues);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch issues' });
    }
  });

  app.post('/api/issues', (req, res) => {
    try {
      const validatedData = IssueSchema.parse(req.body);
      const id = uuidv4();
      const stmt = db.prepare(`
        INSERT INTO issues (id, title, description, type, status, priority, assignee, delay_cause)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(
        id, 
        validatedData.title, 
        validatedData.description || null, 
        validatedData.type, 
        validatedData.status, 
        validatedData.priority, 
        validatedData.assignee || null, 
        validatedData.delay_cause || null
      );
      const newIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
      res.status(201).json(newIssue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to create issue' });
    }
  });

  app.put('/api/issues/:id', (req, res) => {
    try {
      const { id } = req.params;
      const validatedData = UpdateIssueSchema.parse(req.body);
      
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
      
      stmt.run(
        validatedData.title ?? null,
        validatedData.description ?? null,
        validatedData.type ?? null,
        validatedData.status ?? null,
        validatedData.priority ?? null,
        validatedData.assignee ?? null,
        validatedData.delay_cause ?? null,
        id
      );
      
      const updatedIssue = db.prepare('SELECT * FROM issues WHERE id = ?').get(id);
      if (!updatedIssue) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      res.json(updatedIssue);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid input', details: error.issues });
      }
      res.status(500).json({ error: 'Failed to update issue' });
    }
  });

  app.delete('/api/issues/:id', (req, res) => {
    try {
      const { id } = req.params;
      const result = db.prepare('DELETE FROM issues WHERE id = ?').run(id);
      if (result.changes === 0) {
        return res.status(404).json({ error: 'Issue not found' });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete issue' });
    }
  });

  app.patch('/api/issues/bulk', (req, res) => {
    try {
      const { ids, status, priority, assignee } = req.body;
      if (!ids || !Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({ error: 'Invalid input: ids must be a non-empty array' });
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (status) {
        updates.push('status = ?');
        params.push(status);
      }
      if (priority) {
        updates.push('priority = ?');
        params.push(priority);
      }
      if (assignee) {
        updates.push('assignee = ?');
        params.push(assignee);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      
      const placeholders = ids.map(() => '?').join(',');
      const sql = `UPDATE issues SET ${updates.join(', ')} WHERE id IN (${placeholders})`;
      
      db.prepare(sql).run(...params, ...ids);
      
      res.json({ message: 'Bulk update successful', count: ids.length });
    } catch (error) {
      console.error('Bulk update error:', error);
      res.status(500).json({ error: 'Failed to perform bulk update' });
    }
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

