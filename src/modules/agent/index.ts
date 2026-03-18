import { Router } from 'express';
import * as agentController from './controller';

const router = Router();

router.get('/', agentController.getAgents);
router.post('/', agentController.createAgent);
router.get('/:id', agentController.getAgent);
router.put('/:id', agentController.updateAgent);
router.delete('/:id', agentController.deleteAgent);
router.post('/:id/execute', agentController.executeAgent);

export default router;
