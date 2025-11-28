// src/models/Pedido.js
import mongoose from "mongoose";

const pedidoSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
    },
    direccionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Direccion",
      required: false,
    },
    productos: [
      {
        productoId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Producto",
          required: true,
        },
        cantidad: {
          type: Number,
          required: true,
          min: 1,
        },
        precioUnitario: {
          type: Number,
          required: true,
        },
      },
    ],
    estado: {
      type: String,
      enum: [
        "pendiente",
        "pagado",
        "pendiente_pago",
        "pago_rechazado",
        "enviado",
        "entregado",
        "cancelado",
      ],
      default: "pendiente_pago",
    },
    total: {
      type: Number,
      required: true,
    },

    // Ganancia total del pedido (en dinero), calculada al aprobar el pago
    gananciaTotal: {
      type: Number,
      default: 0,
    },

    paymentId: {
      type: String,
      default: null,
    },
    preferenceId: {
      type: String,
      default: null,
    },
    fechaPago: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Pedido", pedidoSchema);
