// src/routes/ProductoRoutes.js
import { Router } from "express";
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
} from "../controllers/ProductoController.js";

import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

// Rutas de productos
router.post("/", authMiddleware, authorizeRoles("admin"), crearProducto);   // Crear producto (admin)
router.get("/", listarProductos);                                           // Listar productos (con filtros opcionales)
router.get("/:id", obtenerProducto);                                        // Obtener producto por ID
router.put("/:id", authMiddleware, authorizeRoles("admin"), actualizarProducto); // Actualizar producto (admin)
router.delete("/:id", authMiddleware, authorizeRoles("admin"), eliminarProducto); // Eliminar producto (admin)

export default router;
