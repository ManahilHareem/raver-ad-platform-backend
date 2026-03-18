import { Router } from 'express';
import * as assetController from './controller'; // Resync TS server

const router = Router();

router.get('/', assetController.getAssets);
router.post('/upload', assetController.uploadAsset);
router.get('/:id', assetController.getAsset);
router.delete('/:id', assetController.deleteAsset);

export default router;
