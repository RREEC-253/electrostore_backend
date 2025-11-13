import express from 'express';
import { crearPreferencia, receiveWebhook, listPayments, verificarPago } from '../controllers/paymentController.js';
import { authMiddleware } from '../middleware/authMiddleware.js';

const router = express.Router();

// Crear preferencia de pago para Checkout PRO
router.post('/crear-preferencia', authMiddleware, crearPreferencia);

// Callbacks de redirección después del pago (sin auth - MercadoPago redirige aquí)
router.get('/success', (req, res) => {
  // Redirigir al frontend con el estado de éxito
  const preferenceId = req.query.preference_id;
  const paymentId = req.query.payment_id;
  res.redirect(`electrostore://payment/success?preference_id=${preferenceId || ''}&payment_id=${paymentId || ''}`);
});

router.get('/failure', (req, res) => {
  // Redirigir al frontend con el estado de fallo
  const preferenceId = req.query.preference_id;
  res.redirect(`electrostore://payment/failure?preference_id=${preferenceId || ''}`);
});

router.get('/pending', (req, res) => {
  // Redirigir al frontend con el estado pendiente
  const preferenceId = req.query.preference_id;
  res.redirect(`electrostore://payment/pending?preference_id=${preferenceId || ''}`);
});

// Recibir webhook (sin auth - MercadoPago lo llama directamente)
router.post('/webhook', receiveWebhook);

// Verificar estado de un pago (opcional pero recomendado)
router.get('/verificar/:paymentId', authMiddleware, verificarPago);

// Listar pagos guardados
router.get('/', authMiddleware, listPayments);

export default router;
