import express from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_FILE = path.join(__dirname, 'erp_database.json');

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // API: Load shared ERP state across devices/PCs
  app.get('/api/state', (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        res.json({ ok: true, data: parsed });
      } else {
        res.json({ ok: true, data: null });
      }
    } catch (err) {
      console.error('Error reading ERP state:', err);
      res.status(500).json({ ok: false, error: 'Failed to read state' });
    }
  });

  // API: Save shared ERP state across devices/PCs
  app.post('/api/state', (req, res) => {
    try {
      const payload = req.body;
      if (!payload || typeof payload !== 'object') {
        res.status(400).json({ ok: false, error: 'Invalid state payload' });
        return;
      }
      const nextData = {
        ...payload,
        updatedAtServer: new Date().toISOString()
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(nextData, null, 2), 'utf-8');
      res.json({ ok: true, updatedAt: nextData.updatedAtServer });
    } catch (err) {
      console.error('Error saving ERP state:', err);
      res.status(500).json({ ok: false, error: 'Failed to save state' });
    }
  });

  // API: Immediate atomic save/update of a single customer to cloud storage
  app.post('/api/customers', (req, res) => {
    try {
      const customer = req.body;
      if (!customer || !customer.id) {
        res.status(400).json({ ok: false, error: 'Invalid customer payload' });
        return;
      }
      let db: Record<string, any> = {};
      if (fs.existsSync(DB_FILE)) {
        try {
          db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch {
          db = {};
        }
      }
      const existingCustomers: any[] = Array.isArray(db.customers) ? db.customers : [];
      const idx = existingCustomers.findIndex((c: any) => c && c.id === customer.id);
      if (idx >= 0) {
        existingCustomers[idx] = customer;
      } else {
        existingCustomers.unshift(customer);
      }
      db.customers = existingCustomers;
      db.updatedAtServer = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      res.json({ ok: true, customer, customers: existingCustomers });
    } catch (err) {
      console.error('Error saving customer:', err);
      res.status(500).json({ ok: false, error: 'Failed to save customer' });
    }
  });

  // API: Immediate atomic delete of a single customer from cloud storage
  app.delete('/api/customers/:id', (req, res) => {
    try {
      const { id } = req.params;
      if (fs.existsSync(DB_FILE)) {
        const db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        if (Array.isArray(db.customers)) {
          db.customers = db.customers.filter((c: any) => c && c.id !== id);
          db.updatedAtServer = new Date().toISOString();
          fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
        }
      }
      res.json({ ok: true });
    } catch (err) {
      console.error('Error deleting customer:', err);
      res.status(500).json({ ok: false, error: 'Failed to delete customer' });
    }
  });

  // API: Immediate atomic save of updated stock calculation to database
  app.post('/api/products/batch-stock', (req, res) => {
    try {
      const { products, movements } = req.body;
      if (!Array.isArray(products)) {
        res.status(400).json({ ok: false, error: 'Invalid products array' });
        return;
      }
      let db: Record<string, any> = {};
      if (fs.existsSync(DB_FILE)) {
        try {
          db = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
        } catch {
          db = {};
        }
      }
      // Update products in database file
      db.products = products;
      if (Array.isArray(movements) && movements.length > 0) {
        const existingMovements = Array.isArray(db.stockMovements) ? db.stockMovements : [];
        db.stockMovements = [...movements, ...existingMovements].slice(0, 1000);
      }
      db.updatedAtServer = new Date().toISOString();
      fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), 'utf-8');
      res.json({ ok: true, count: products.length });
    } catch (err) {
      console.error('Error saving updated stock calculation:', err);
      res.status(500).json({ ok: false, error: 'Failed to save updated stock calculation' });
    }
  });

  if (process.env.NODE_ENV !== 'production' && !fs.existsSync(path.join(__dirname, 'dist', 'index.html'))) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Bismillah Multitrade ERP Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
