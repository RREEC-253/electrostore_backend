// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import Usuario from "../models/Usuario.js"; // 👈 importa tu modelo de usuario

export const authMiddleware = async (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Acceso denegado" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 🔹 Buscamos el usuario real en la base de datos
    const usuario = await Usuario.findById(decoded.id || decoded._id).select("-contraseña");
    if (!usuario) {
      return res.status(404).json({ message: "Usuario no encontrado" });
    }

    req.usuario = usuario; // 👈 Ahora contiene el documento real
    next();
  } catch (error) {
    console.error("Error en authMiddleware:", error);
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

// 🔹 Middleware opcional para roles (puedes dejarlo igual)
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ message: "No tienes permisos para esta acción" });
    }
    next();
  };
};
