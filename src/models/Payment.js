import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  paymentId: { type: String, required: true, unique: true, index: true },
  pedidoId: { type: mongoose.Schema.Types.ObjectId, ref: "Pedido", required: true },
  usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true },
  transaction_amount: { type: Number, required: true },
  payment_method: { type: String, required: true },
  payment_type: { type: String },
  payer_email: { type: String },
  status: { type: String, required: true },
  status_detail: { type: String },
  date_created: { type: Date, default: Date.now },
  date_approved: { type: Date, default: null },
});

export default mongoose.model('Payment', paymentSchema);
