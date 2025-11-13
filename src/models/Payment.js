import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  transaction_amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  payer_email: { type: String },
  status: { type: String, required: true },
  date_created: { type: Date, default: Date.now },
  date_approved: { type: Date, default: null },
});

export default mongoose.model('Payment', paymentSchema);
