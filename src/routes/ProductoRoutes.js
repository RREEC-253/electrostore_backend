import { Router } from "express";
import {
  crearProducto,
  listarProductos,
  obtenerProducto,
  actualizarProducto,
  eliminarProducto,
  productosOfertas,
  buscarProductos,
  productosDestacados,
  buscarSugerencias,
  obtenerProductosPorCategoria
} from "../controllers/ProductoController.js";

import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = Router();

//
// ======================================================
//  Rutas públicas (accesibles por clientes sin login)
// ======================================================
router.get("/", listarProductos);              // Listar productos
router.get("/ofertas", productosOfertas);      // Productos en oferta activa
router.get("/destacados", productosDestacados); // productos destacados
router.get("/:id", obtenerProducto);           // Obtener producto por ID
router.get("/buscar/avanzado", buscarProductos);
router.get("/buscar/sugerencias", buscarSugerencias);
router.get("/categoria/:idCategoria", obtenerProductosPorCategoria);
//
// ======================================================
//  Rutas privadas (solo accesibles por administradores)
// ======================================================
router.post("/", authMiddleware, authorizeRoles("admin"), crearProducto);
router.put("/:id", authMiddleware, authorizeRoles("admin"), actualizarProducto);
router.delete("/:id", authMiddleware, authorizeRoles("admin"), eliminarProducto);

export default router;
