// src/controllers/DashboardController.js
import Producto from "../models/Producto.js";
import Pedido from "../models/Pedido.js";

// øŸ‰ Resumen principal para el panel de administrador
export const obtenerDashboardResumen = async (req, res) => {
  try {
    const [productosActivos, productosConOferta, pedidosPagados] = await Promise.all([
      Producto.countDocuments({ activo: true }),
      Producto.countDocuments({
        activo: true,
        oferta: true,
        porcentajeOferta: { $gt: 0 },
      }),
      Pedido.countDocuments({ estado: "pagado" }),
    ]);

    res.json({
      productosActivos,
      productosConOferta,
      pedidosPagados,
    });
  } catch (error) {
    console.error("øŸ› Error en obtenerDashboardResumen:", error);
    res.status(500).json({ message: "No se pudo cargar el resumen" });
  }
};
