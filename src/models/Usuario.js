// src/models/Usuario.js
import mongoose from "mongoose";
import bcrypt from "bcrypt";

const usuarioSchema = new mongoose.Schema(
  {
    nombres: { type: String, required: true, trim: true },
    apellidos: { type: String, trim: true },
    telefono: { type: String, trim: true },

    dni: {
      type: String,
      trim: true,
      match: /^[0-9]{8}$/, // válido solo si lo envían
    
    },

    email: {
      type: String,
      required: true,
      unique: true,          // email sí debe ser único
      lowercase: true,
      trim: true,
      match: /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/, // validación regex
    },

    contraseña: {
      type: String,
      required: true,
      trim: true,
      minlength: 6,
    },

    rol: { type: String, enum: ["cliente", "admin"], default: "cliente" },

    // Para invalidar / rotar refresh tokens
    refreshToken: { type: String, default: null },
  },
  { timestamps: true }
);

// 🔒 Hash de contraseña antes de guardar si fue modificada
usuarioSchema.pre("save", async function (next) {
  if (!this.isModified("contraseña")) return next();
  const salt = await bcrypt.genSalt(10);
  this.contraseña = await bcrypt.hash(this.contraseña, salt);
  next();
});

// 🔠 Normalizar nombres y apellidos en minúsculas antes de guardar
usuarioSchema.pre("save", function (next) {
  if (this.isModified("nombres") && this.nombres) {
    this.nombres = this.nombres.toLowerCase().trim();
  }
  if (this.isModified("apellidos") && this.apellidos) {
    this.apellidos = this.apellidos.toLowerCase().trim();
  }
  next();
});

// Método para comparar contraseña en login
usuarioSchema.methods.compararPassword = function (passwordPlano) {
  return bcrypt.compare(passwordPlano, this.contraseña);
};

const Usuario = mongoose.model("Usuario", usuarioSchema);
export default Usuario;
