// src/routes/UsuarioRoutes.js
import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario,
} from "../controllers/UsuarioController.js";

import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// 📌 Registro (público, sin autenticación)
router.post("/", crearUsuario);

// 📌 Solo admin puede listar todos
router.get("/", authMiddleware, authorizeRoles("admin"), listarUsuarios);

// 📌 Obtener usuario por ID
// - Admin puede ver cualquiera
// - Un usuario solo puede ver su propio perfil
router.get("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.params.id) {
    return res.status(403).json({ message: "No tienes permisos para ver este usuario" });
  }
  next();
}, obtenerUsuario);

// 📌 Actualizar usuario
// - Admin puede editar cualquiera
// - Un usuario solo puede editar su propio perfil
router.put("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.params.id) {
    return res.status(403).json({ message: "No tienes permisos para actualizar este usuario" });
  }
  next();
}, actualizarUsuario);

// 📌 Eliminar usuario (solo admin)
router.delete("/:id", authMiddleware, authorizeRoles("admin"), eliminarUsuario);

export default router;
