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

    codigo: {
      type: String,
      unique: true,
      required: true,
    },

    total: {
      type: Number,
      required: true,
    },

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

pedidoSchema.pre("save", function (next) {
  if (!this.codigo) {
    const idStr = this._id.toString();
    const suffix = idStr.slice(-4).toUpperCase(); // últimos 4 chars del _id

    const prefixes = ["FKE", "PED"];
    const prefix =
      prefixes[Math.floor(Math.random() * prefixes.length)];

    this.codigo = `${prefix}-${suffix}`;
  }
  next();
});


export default mongoose.model("Pedido", pedidoSchema);
