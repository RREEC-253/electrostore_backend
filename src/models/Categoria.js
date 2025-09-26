// src/models/Categoria.js
import mongoose from "mongoose";

const categoriaSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, unique: true, trim: true },
    descripcion: { type: String, trim: true },
  },
  {
    timestamps: true, // createdAt y updatedAt
  }
);

const Categoria = mongoose.model("Categoria", categoriaSchema);

export default Categoria;
