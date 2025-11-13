// src/app.js
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
// Importar rutas
import UsuarioRoutes from "./routes/UsuarioRoutes.js";
import ProductoRoutes from "./routes/ProductoRoutes.js";
import CategoriaRoutes from "./routes/CategoriaRoutes.js";
import AuthRoutes from "./routes/AuthRoutes.js";
import PedidoRoutes from "./routes/PedidoRoutes.js";
import DireccionRoutes from "./routes/DireccionRoutes.js";
import CarritoRoutes from "./routes/CarritoRoutes.js";
import paymentRoutes from './routes/payments.js';

dotenv.config();

const app = express();

// ===== Middlewares =====
app.use(cors());             // Permitir peticiones desde otros orígenes
app.use(express.json());     // Leer JSON en las requests

// ===== Rutas =====

// (aquí irán las rutas importadas, ejemplo: usuarios, productos, pedidos, etc.)
app.use("/api/usuarios", UsuarioRoutes);
app.use("/api/productos", ProductoRoutes);
app.use("/api/categorias", CategoriaRoutes);
app.use("/api/auth", AuthRoutes);
app.use("/api/pedidos", PedidoRoutes);
app.use("/api/direcciones", DireccionRoutes);
app.use("/api/carrito", CarritoRoutes);
app.use('/api/payments', paymentRoutes);


app.get("/", (req, res) => {
  res.send("API ElectroStore funcionando 🚀");
});

// Exportamos la app para que server.js la use
export default app;
