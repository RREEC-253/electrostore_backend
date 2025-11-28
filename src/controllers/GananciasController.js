// src/controllers/GananciasController.js
import Pedido from "../models/Pedido.js";

const startOfDay = (d) => {
  const date = new Date(d);
  date.setHours(0, 0, 0, 0);
  return date;
};

const endOfDay = (d) => {
  const date = new Date(d);
  date.setHours(23, 59, 59, 999);
  return date;
};

const sumarGananciasEnRango = async (desde, hasta) => {
  const pedidos = await Pedido.find({
    estado: "pagado",
    fechaPago: {
      $gte: desde,
      $lte: hasta,
    },
  }).select("gananciaTotal");

  let totalGanancia = 0;
  for (const p of pedidos) {
    totalGanancia += p.gananciaTotal || 0;
  }

  return {
    totalGanancia,
    totalPedidos: pedidos.length,
  };
};

// GET /api/ganancias/resumen
export const resumenGanancias = async (req, res) => {
  try {
    const ahora = new Date();

    // Hoy
    const hoyDesde = startOfDay(ahora);
    const hoyHasta = endOfDay(ahora);

    // Últimos 7 días (incluyendo hoy)
    const semanaDesde = startOfDay(
      new Date(ahora.getTime() - 6 * 24 * 60 * 60 * 1000)
    );
    const semanaHasta = hoyHasta;

    // Mes actual: desde el día 1 hasta hoy
    const mesDesde = startOfDay(
      new Date(ahora.getFullYear(), ahora.getMonth(), 1)
    );
    const mesHasta = hoyHasta;

    const [hoy, semana, mes] = await Promise.all([
      sumarGananciasEnRango(hoyDesde, hoyHasta),
      sumarGananciasEnRango(semanaDesde, semanaHasta),
      sumarGananciasEnRango(mesDesde, mesHasta),
    ]);

    res.json({
      hoy,
      semana,
      mes,
    });
  } catch (error) {
    console.error("Error en resumenGanancias:", error);
    res.status(500).json({
      message: "Error al obtener resumen de ganancias",
    });
  }
};

// GET /api/ganancias/reporte?desde=YYYY-MM-DD&hasta=YYYY-MM-DD&groupBy=dia|mes
export const reporteGanancias = async (req, res) => {
  try {
    const { desde, hasta, groupBy = "dia" } = req.query;

    if (!desde || !hasta) {
      return res.status(400).json({
        message: "Los parámetros 'desde' y 'hasta' son requeridos",
      });
    }

    const desdeDate = startOfDay(new Date(desde));
    const hastaDate = endOfDay(new Date(hasta));

    if (isNaN(desdeDate.getTime()) || isNaN(hastaDate.getTime())) {
      return res.status(400).json({
        message: "Formato de fecha inválido. Usa YYYY-MM-DD",
      });
    }

    const pedidos = await Pedido.find({
      estado: "pagado",
      fechaPago: {
        $gte: desdeDate,
        $lte: hastaDate,
      },
    }).select("gananciaTotal fechaPago");

    let totalGanancia = 0;
    const grupos = new Map();

    for (const p of pedidos) {
      const fechaPago = p.fechaPago || p.createdAt;
      if (!fechaPago) continue;

      let key;
      const d = new Date(fechaPago);
      const year = d.getFullYear();
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const day = d.getDate().toString().padStart(2, "0");

      if (groupBy === "mes") {
        key = `${year}-${month}`;
      } else {
        // 'dia' por defecto
        key = `${year}-${month}-${day}`;
      }

      const gActual = grupos.get(key) || {
        key,
        ganancia: 0,
        pedidos: 0,
      };

      const gPedido = p.gananciaTotal || 0;
      gActual.ganancia += gPedido;
      gActual.pedidos += 1;

      grupos.set(key, gActual);
      totalGanancia += gPedido;
    }

    const series = Array.from(grupos.values()).sort((a, b) =>
      a.key.localeCompare(b.key)
    );

    res.json({
      desde: desdeDate,
      hasta: hastaDate,
      groupBy,
      totalGanancia,
      totalPedidos: pedidos.length,
      series,
    });
  } catch (error) {
    console.error("Error en reporteGanancias:", error);
    res.status(500).json({
      message: "Error al obtener reporte de ganancias",
    });
  }
};
