// src/models/Direccion.js
import mongoose from "mongoose";

const direccionSchema = new mongoose.Schema(
  {
    usuarioId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Usuario",
      required: true,
      index: true,
    },
    etiqueta: {
      type: String,
      enum: ["casa", "trabajo", "otro"],
      default: "casa",
    },
    direccion: { type: String, required: true, trim: true }, // calle/numero
    referencia: { type: String, trim: true },                // punto de referencia
    departamento: { type: String, required: true },          // e.g. Lima
    provincia: { type: String, required: true },             // e.g. Lima
    distrito: { type: String, required: true },              // e.g. Miraflores
    codigoPostal: { type: String },                           // opcional en Perú
    telefono: { type: String },                               // contacto para entrega
    principal: { type: Boolean, default: false },             // dirección por defecto
  },
  { timestamps: true }
);

export default mongoose.model("Direccion", direccionSchema);
