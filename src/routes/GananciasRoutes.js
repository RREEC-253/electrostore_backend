// src/routes/GananciasRoutes.js
import express from "express";
import {
  resumenGanancias,
  reporteGanancias,
} from "../controllers/GananciasController.js";
import {
  authMiddleware,
  authorizeRoles,
} from "../middleware/authMiddleware.js";

const router = express.Router();

// Solo admin
router.get(
  "/resumen",
  authMiddleware,
  authorizeRoles("admin"),
  resumenGanancias
);

router.get(
  "/reporte",
  authMiddleware,
  authorizeRoles("admin"),
  reporteGanancias
);

export default router;
