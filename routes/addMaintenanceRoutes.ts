import express from 'express';

const LOCAL_HOSTS = new Set([
  '127.0.0.1',
  '::1',
  '::ffff:127.0.0.1',
  'localhost',
]);

function isLocalRequest(req) {
    const addresses = [
    req.socket?.remoteAddress,
    req.connection?.remoteAddress,
  ].filter(Boolean);

  return addresses.some((address) => LOCAL_HOSTS.has(address));
}

function normalizeRepairPath(path) {
  if (typeof path !== 'string') {
    return null;
  }

  const normalized = path.trim().replace(/^\/+/, '').replace(/\/+$/, '');

  if (normalized.length === 0 || normalized.includes('..')) {
    return null;
  }

  return normalized;
}

function addMaintenanceRoutes(app, db) {
  const maintenance = express.Router();

  maintenance.use((req, res, next) => {
    if (!isLocalRequest(req)) {
      return res.status(403).send({
        error: true,
        message: 'Maintenance routes are only available from localhost.',
      });
    }

    next();
  });

  maintenance.post('/repair-node', async (req, res) => {
    const repairPath = normalizeRepairPath(req.body?.path);
    const markAsRemoved = req.body?.markAsRemoved !== false;

    if (!repairPath) {
      return res.status(400).send({
        error: true,
        message: 'A valid database path is required.',
      });
    }

    if (!db?.recovery?.repairNode) {
      return res.status(500).send({
        error: true,
        message: 'The active database does not support node repair.',
      });
    }

    try {
      await db.ready();
      await db.recovery.repairNode(repairPath, {
        markAsRemoved,
      });

      res.send({
        error: false,
        repaired: true,
        path: repairPath,
        markAsRemoved,
      });
    }
    catch (error) {
      res.status(500).send({
        error: true,
        message: error instanceof Error ? error.message : String(error),
        path: repairPath,
      });
    }
  });

  app.use('/maintenance', maintenance);
}

export default addMaintenanceRoutes;
