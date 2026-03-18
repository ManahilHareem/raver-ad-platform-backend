import { Router } from 'express';
import * as userController from './controller';

const router = Router();

router.get('/', userController.getUsers);
router.post('/', userController.createUser);
router.get('/me', userController.getMe);
router.put('/settings', userController.updateSettings);
router.get('/:id', userController.getUser);
router.put('/:id', userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
