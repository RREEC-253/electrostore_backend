// src/routes/AuthRoutes.js
import { Router } from "express";
import { registrar, login, refresh, logout,me } from "../controllers/AuthController.js";

const router = Router();

router.post("/register", registrar);
router.post("/login", login);
router.post("/refresh", refresh);
router.post("/logout", logout);
router.get("/me",me);

export default router;
