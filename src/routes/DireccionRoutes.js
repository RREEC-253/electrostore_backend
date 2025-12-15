// src/routes/DireccionRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  crearDireccion,
  listarDirecciones,
  obtenerDireccion,
  actualizarDireccion,
  eliminarDireccion,
  marcarPrincipal,
} from "../controllers/DireccionController.js";

const router = express.Router();

// Crear direcci?n (usuario autenticado)
router.post("/", authMiddleware, crearDireccion);

// Listar direcciones
router.get("/", authMiddleware, listarDirecciones);

// Obtener direcci?n por ID
router.get("/:id", authMiddleware, obtenerDireccion);

// Actualizar direcci?n
router.put("/:id", authMiddleware, actualizarDireccion);

// Eliminar direcci?n
router.delete("/:id", authMiddleware, eliminarDireccion);

// Marcar como principal
router.patch("/:id/principal", authMiddleware, marcarPrincipal);

export default router;
