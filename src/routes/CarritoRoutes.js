// src/routes/CarritoRoutes.js
import express from "express";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  obtenerCarrito,
  agregarProducto,
  actualizarCantidad,
  eliminarProducto,
  vaciarCarrito,
} from "../controllers/CarritoController.js";

const router = express.Router();

router.get("/", authMiddleware, obtenerCarrito);              // Ver carrito
router.post("/", authMiddleware, agregarProducto);            // Agregar producto
router.put("/", authMiddleware, actualizarCantidad);          // Actualizar cantidad
router.delete("/:productoId", authMiddleware, eliminarProducto); // Eliminar producto específico
router.delete("/", authMiddleware, vaciarCarrito);            // Vaciar carrito completo

export default router;
