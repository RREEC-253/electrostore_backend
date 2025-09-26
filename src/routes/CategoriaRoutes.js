// src/routes/CategoriaRoutes.js
import { Router } from "express";
import {
  crearCategoria,
  listarCategorias,
  obtenerCategoria,
  actualizarCategoria,
  eliminarCategoria,
} from "../controllers/CategoriaController.js";

const router = Router();

router.post("/", crearCategoria);         // Crear categoría
router.get("/", listarCategorias);        // Listar categorías
router.get("/:id", obtenerCategoria);     // Obtener categoría por ID
router.put("/:id", actualizarCategoria);  // Actualizar categoría
router.delete("/:id", eliminarCategoria); // Eliminar categoría

export default router;
