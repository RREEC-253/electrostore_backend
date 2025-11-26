import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  transaction_amount: { type: Number, required: true },

  // Método específico de pago (visa, master, pagoefectivo_atm, yape, etc.)
  payment_method: { type: String, required: true },

  // Tipo de pago (credit_card, debit_card, ticket, bank_transfer, account_money, etc.)
  payment_type: { type: String },

  payer_email: { type: String },

  // Estado general del pago (approved, pending, rejected, cancelled, etc.)
  status: { type: String, required: true },

  // Detalle del estado (accredited, pending_waiting_payment, etc.)
  status_detail: { type: String },

  date_created: { type: Date, default: Date.now },
  date_approved: { type: Date, default: null },
});

export default mongoose.model('Payment', paymentSchema);
