// server.js
import dotenv from "dotenv";
import app from "./src/app.js";
import connectDB from "./src/config/db.js";

dotenv.config();

// Conexión a MongoDB Atlas
connectDB();

// Arrancar servidor
const PORT = process.env.PORT || 5000;
app.listen(PORT,'0.0.0.0', () => {
  console.log(`✅ Servidor corriendo en puerto ${PORT}`);
});
