import express from "express";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";
import {
  obtenerPedidos,
  obtenerPedido,
  actualizarPedido,
  eliminarPedido,
  crearPedidoDesdeCarrito,
  obtenerMisPedidos,        // <-- añade esto
} from "../controllers/PedidoController.js";

const router = express.Router();

// Crear pedido (cliente autenticado)
router.post("/checkout", authMiddleware, crearPedidoDesdeCarrito);

// Listar pedidos del propio usuario (cliente autenticado)
router.get("/mis-pedidos", authMiddleware, obtenerMisPedidos);

// Listar todos (solo admin)
router.get("/", authMiddleware, authorizeRoles("admin"), obtenerPedidos);

// Obtener pedido por ID (admin o dueño)
router.get("/:id", authMiddleware, (req, res, next) => {
  if (req.usuario.rol !== "admin" && req.usuario.id !== req.params.usuarioId) {
    return res.status(403).json({ message: "No tienes permisos para ver este pedido" });
  }
  next();
}, obtenerPedido);

// Actualizar pedido (solo admin)
router.put("/:id", authMiddleware, authorizeRoles("admin"), actualizarPedido);

// Eliminar pedido (solo admin)
router.delete("/:id", authMiddleware, authorizeRoles("admin"), eliminarPedido);

export default router;
