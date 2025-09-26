import Usuario from "../models/Usuario.js";
import Carrito from "../models/Carrito.js";
import jwt from "jsonwebtoken";


import {
  generarAccessToken,
  generarRefreshToken,
  verificarRefreshToken,
} from "../config/config.js";

// 📌 Registro

export const registrar = async (req, res) => {
  try {
    const { nombres, email, contraseña } = req.body;

    // Validar campos obligatorios
    if (!nombres || !email || !contraseña) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }

    // Validación de unicidad
    const existeEmail = await Usuario.findOne({ email });
    if (existeEmail) {
      return res.status(400).json({ error: "Email ya registrado" });
    }

    // Crear usuario (hook pre("save") se encarga de hashear contraseña)
    const usuario = await Usuario.create({
      nombres,
      email,
      contraseña,
      rol: "cliente", // siempre cliente al registrarse
    });

    // 🚀 Crear carrito vacío automáticamente
    await Carrito.create({ usuarioId: usuario._id, productos: [] });

    // Generar tokens
    const payload = { id: usuario._id, rol: usuario.rol };
    const accessToken = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(payload);

    // Guardar refresh token
    usuario.refreshToken = refreshToken;
    await usuario.save();

    res.status(201).json({
      usuario: {
        id: usuario._id,
        nombres: usuario.nombres,
        email: usuario.email,
        rol: usuario.rol,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// 📌 Login
export const login = async (req, res) => {
  try {
    const { email, contraseña } = req.body;

    const usuario = await Usuario.findOne({ email });
    if (!usuario) return res.status(400).json({ error: "Credenciales inválidas" });

    // Verificamos contraseña usando método del modelo
    const esValido = await usuario.compararPassword(contraseña);
    if (!esValido) return res.status(400).json({ error: "Credenciales inválidas" });

    // Generamos tokens
    const payload = { id: usuario._id, rol: usuario.rol };
    const accessToken = generarAccessToken(payload);
    const refreshToken = generarRefreshToken(payload);

    // Rotamos refresh token en cada login
    usuario.refreshToken = refreshToken;
    await usuario.save();

    res.json({
      usuario: {
        id: usuario._id,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        rol: usuario.rol,
      },
      accessToken,
      refreshToken,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Refresh (rotación segura de tokens)
export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken requerido" });

    const decoded = verificarRefreshToken(refreshToken);

    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) return res.status(401).json({ error: "Usuario no encontrado" });

    // Verificamos que coincida con el último almacenado
    if (usuario.refreshToken !== refreshToken) {
      return res.status(401).json({ error: "Refresh token inválido (rotado o revocado)" });
    }

    // Emitimos nuevos tokens y rotamos refresh
    const payload = { id: usuario._id, rol: usuario.rol };
    const nuevoAccess = generarAccessToken(payload);
    const nuevoRefresh = generarRefreshToken(payload);

    usuario.refreshToken = nuevoRefresh;
    await usuario.save();

    res.json({ accessToken: nuevoAccess, refreshToken: nuevoRefresh });
  } catch (error) {
    return res.status(401).json({ error: "Refresh token inválido o expirado" });
  }
};

// 📌 Logout (revoca refresh token)
export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "refreshToken requerido" });

    const decoded = verificarRefreshToken(refreshToken);
    const usuario = await Usuario.findById(decoded.id);
    if (!usuario) return res.status(200).json({ mensaje: "Sesión cerrada" }); // idempotente

    // Solo invalida si coincide
    if (usuario.refreshToken === refreshToken) {
      usuario.refreshToken = null;
      await usuario.save();
    }

    res.json({ mensaje: "Sesión cerrada" });
  } catch {
    // Siempre respondemos sesión cerrada (logout idempotente)
    res.status(200).json({ mensaje: "Sesión cerrada" });
  }
};


// 📌 Verificar usuario logueado (usando accessToken)
export const me = async (req, res) => {
  try {
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ error: "No token provided" });

    const token = authHeader.split(" ")[1];
    if (!token) return res.status(401).json({ error: "Invalid token format" });

    // 🔑 Verificamos el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Buscamos al usuario en la DB
    const usuario = await Usuario.findById(decoded.id).select("-contraseña -refreshToken");
    if (!usuario) return res.status(404).json({ error: "Usuario no encontrado" });

    res.json({ usuario });
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};