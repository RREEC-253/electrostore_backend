// src/routes/DireccionRoutes.js
import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  crearDireccion,
  listarDirecciones,
  obtenerDireccion,
  actualizarDireccion,
  eliminarDireccion,
  marcarPrincipal,
} from "../controllers/DireccionController.js";

const router = express.Router();

// 📌 Crear dirección (usuario autenticado)
router.post("/", authMiddleware, crearDireccion);

// 📌 Listar direcciones
router.get("/", authMiddleware, (req, res, next) => {
  if (req.usuario.rol === "admin") {
    // admin ve todas
    return listarDirecciones(req, res, next);
  } else {
    // cliente ve solo las suyas
    req.query.usuarioId = req.usuario.id;
    return listarDirecciones(req, res, next);
  }
});

// 📌 Obtener dirección por ID
// - Admin puede ver cualquiera
// - Cliente solo sus direcciones
router.get("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.params.usuarioId) {
    return res.status(403).json({ message: "No tienes permisos para ver esta dirección" });
  }
  next();
}, obtenerDireccion);

// 📌 Actualizar dirección (dueño o admin)
router.put("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.body.usuarioId) {
    return res.status(403).json({ message: "No tienes permisos para actualizar esta dirección" });
  }
  next();
}, actualizarDireccion);

// 📌 Eliminar dirección (dueño o admin)
router.delete("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.body.usuarioId) {
    return res.status(403).json({ message: "No tienes permisos para eliminar esta dirección" });
  }
  next();
}, eliminarDireccion);

// 📌 Marcar como principal (solo dueño o admin)
router.patch("/:id/principal", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.body.usuarioId) {
    return res.status(403).json({ message: "No tienes permisos para modificar esta dirección" });
  }
  next();
}, marcarPrincipal);

export default router;
