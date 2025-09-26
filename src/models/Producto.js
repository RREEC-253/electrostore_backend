// src/models/Producto.js
import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    precio: { type: Number, required: true },
    stock: { type: Number, default: 0 },
    categorias: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }
    ],
    imagen: { type: String, trim: true },
  },
  { timestamps: true }
);

const Producto = mongoose.model("Producto", productoSchema);
export default Producto;
