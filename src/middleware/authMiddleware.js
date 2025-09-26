// src/middleware/authMiddleware.js
import jwt from "jsonwebtoken";

// Verifica que el token JWT sea válido
export const authMiddleware = (req, res, next) => {
  const token = req.headers["authorization"]?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Acceso denegado" });

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.usuario = verified; // guardamos { id, rol } en req.usuario
    next();
  } catch (error) {
    res.status(403).json({ message: "Token inválido o expirado" });
  }
};

// Verifica que el usuario tenga ciertos roles
export const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.usuario.rol)) {
      return res.status(403).json({ message: "No tienes permisos para esta acción" });
    }
    next();
  };
};
