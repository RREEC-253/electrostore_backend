// src/routes/UsuarioRoutes.js
import { Router } from "express";
import {
  crearUsuario,
  listarUsuarios,
  obtenerUsuario,
  actualizarUsuario,
  eliminarUsuario,
  obtenerPerfil,
  actualizarPerfil,
} from "../controllers/UsuarioController.js";

import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// 📌 Registro público
router.post("/", crearUsuario);

// 📌 Admin: listar todos los usuarios
router.get("/", authMiddleware, authorizeRoles("admin"), listarUsuarios);

// 📌 Usuario autenticado: ver su perfil
router.get("/perfil", authMiddleware, obtenerPerfil);

// 📌 Usuario autenticado: actualizar su perfil
router.put("/perfil", authMiddleware, actualizarPerfil);

// 📌 Admin: ver cualquier usuario
router.get("/:id", authMiddleware, authorizeRoles("admin"), obtenerUsuario);

// 📌 Admin: actualizar o eliminar cualquier usuario
router.put("/:id", authMiddleware, authorizeRoles("admin"), actualizarUsuario);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), eliminarUsuario);

export default router;
