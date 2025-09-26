// src/models/Carrito.js
import mongoose from "mongoose";

const carritoSchema = new mongoose.Schema(
  {
    usuarioId: { type: mongoose.Schema.Types.ObjectId, ref: "Usuario", required: true, unique: true },
    productos: [
      {
        productoId: { type: mongoose.Schema.Types.ObjectId, ref: "Producto", required: true },
        cantidad: { type: Number, required: true, min: 1, default: 1 },
      },
    ],
  },
  { timestamps: true }
);

const Carrito = mongoose.model("Carrito", carritoSchema);

export default Carrito;
