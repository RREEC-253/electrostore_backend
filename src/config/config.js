// src/config/config.js
import jwt from "jsonwebtoken";

// Generar Access Token (vida corta)
export const generarAccessToken = (payload) => {
  return jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.ACCESS_TOKEN_EXPIRES || "15m", // por defecto 15 minutos
  });
};

// Generar Refresh Token (vida larga)
export const generarRefreshToken = (payload) => {
  return jwt.sign(payload, process.env.REFRESH_TOKEN_SECRET, {
    expiresIn: process.env.REFRESH_TOKEN_EXPIRES || "15d", // por defecto 15 días
  });
};

// Verificar Access Token
export const verificarAccessToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return null; // inválido o expirado
  }
};

// Verificar Refresh Token
export const verificarRefreshToken = (token) => {
  try {
    return jwt.verify(token, process.env.REFRESH_TOKEN_SECRET);
  } catch {
    return null; // inválido o expirado
  }
};
