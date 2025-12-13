// src/routes/DashboardRoutes.js
import express from "express";
import { obtenerDashboardResumen } from "../controllers/DashboardController.js";
import { authMiddleware, authorizeRoles } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get(
  "/resumen",
  authMiddleware,
  authorizeRoles("admin"),
  obtenerDashboardResumen
);

export default router;
