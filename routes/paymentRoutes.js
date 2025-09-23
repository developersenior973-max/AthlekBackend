import express from 'express';
import { 
  createNGeniusPayment, 
  handleNGeniusWebhook, 
  getPaymentStatus,
  handlePaymentSuccess,
  sendTestEmail
} from '../controllers/paymentController.js';

const router = express.Router();

// Public routes
router.post('/ngenius/create/:orderId', createNGeniusPayment);
router.post('/ngenius/webhook', handleNGeniusWebhook);
router.get('/status/:orderId', getPaymentStatus);
router.get('/success/:orderId', handlePaymentSuccess);
router.post('/test-email/:orderId', sendTestEmail);

export default router;
