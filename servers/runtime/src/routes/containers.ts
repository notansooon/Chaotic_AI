import { Router } from 'express';


const router = Router();

router.get('/hypervisor', (req, res) => {
    res.send('Hypervisor routes');
});
          

export default router;