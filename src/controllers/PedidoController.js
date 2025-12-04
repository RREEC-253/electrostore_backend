// src/controllers/PedidoController.js
import Pedido from "../models/Pedido.js";
import Carrito from "../models/Carrito.js";

export const crearPedidoDesdeCarrito = async (req, res) => {
  try {
    const usuarioId = req.usuario.id;

    const carrito = await Carrito.findOne({ usuarioId }).populate("productos.productoId");
    if (!carrito || carrito.productos.length === 0) {
      return res.status(400).json({ message: "Carrito vacío" });
    }

    // Construir productos con precio final (considerando ofertas)
    const productosPedido = carrito.productos.map(item => {
      const producto = item.productoId;
      const precioUnitario =
        producto.oferta && producto.precioOferta
          ? producto.precioOferta
          : producto.precioVenta;

      return {
        productoId: producto._id,
        cantidad: item.cantidad,
        precioUnitario,
      };
    });

    const total = productosPedido.reduce(
      (acc, item) => acc + item.cantidad * item.precioUnitario,
      0
    );

    const tipoEntrega = req.body.tipoEntrega || "recojo_tienda";
    const direccionId = req.body.direccionId || null;

    // Si es delivery, validar dirección
    if (tipoEntrega === "delivery") {
      if (!direccionId) {
        return res.status(400).json({
          message: "Debes seleccionar una dirección para delivery",
        });
      }

      const direccion = await Direccion.findOne({
        _id: direccionId,
        usuarioId,
      });

      if (!direccion) {
        return res.status(404).json({
          message: "Dirección de entrega no encontrada",
        });
      }

      if (!direccion.enZonaEnvio) {
        return res.status(400).json({
          message:
            "Por ahora solo hacemos delivery dentro de las zonas disponibles.",
        });
      }
    }

    const pedido = new Pedido({
      usuarioId,
      direccionId,
      productos: productosPedido,
      total,
      estado: "pendiente_pago",
      tipoEntrega,
    });



    await pedido.save();

    res.status(201).json({
      message: "Pedido creado correctamente (sin dirección por ahora)",
      pedido,
    });
  } catch (error) {
    console.error("Error al crear pedido desde carrito:", error);
    res.status(500).json({ message: error.message });
  }
};


// Helper para construir filtros dinámicos
const buildPedidoFilters = (query) => {
  const filtros = {};

  // Por defecto, solo pedidos pagados
  if (query.estado) {
    filtros.estado = query.estado;
  } else {
    filtros.estado = "pagado";
  }

  // Filtro por rango de fechas (createdAt)
  const rangoFechas = {};
  if (query.desde) {
    const desde = new Date(query.desde);
    if (!isNaN(desde.getTime())) {
      rangoFechas.$gte = desde;
    }
  }
  if (query.hasta) {
    const hasta = new Date(query.hasta);
    if (!isNaN(hasta.getTime())) {
      rangoFechas.$lte = hasta;
    }
  }
  if (Object.keys(rangoFechas).length > 0) {
    filtros.createdAt = rangoFechas;
  }

  // Opcional: filtrar por usuarioId si algún día lo quieres
  if (query.usuarioId) {
    filtros.usuarioId = query.usuarioId;
  }

  if (query.codigo) {
    const codigo = query.codigo.trim();
    if (codigo) {
      filtros.codigo = { $regex: codigo, $options: "i" };
    }
  }

  return filtros;
};


// Helper para filtros de pedidos de un usuario (cliente)
const buildPedidoFiltersCliente = (query, usuarioId) => {
  const filtros = { usuarioId };

  // Estados que mostramos al cliente
  const estadosVisibles = [
    "pendiente_pago",
    "pagado",
    "pago_rechazado",
  ];

  // Si viene estado y está dentro de los visibles, filtramos por ese estado
  if (query.estado && estadosVisibles.includes(query.estado)) {
    filtros.estado = query.estado;
  } else {
    // Por defecto: solo esos tres estados
    filtros.estado = { $in: estadosVisibles };
  }

  // Rango de fechas (createdAt)
  const rangoFechas = {};
  if (query.desde) {
    const desde = new Date(query.desde);
    if (!isNaN(desde.getTime())) {
      rangoFechas.$gte = desde;
    }
  }
  if (query.hasta) {
    const hasta = new Date(query.hasta);
    if (!isNaN(hasta.getTime())) {
      rangoFechas.$lte = hasta;
    }
  }
  if (Object.keys(rangoFechas).length > 0) {
    filtros.createdAt = rangoFechas;
  }

  return filtros;
};


// Listar pedidos del cliente autenticado ("mis pedidos")
export const obtenerMisPedidos = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);

    const filtros = buildPedidoFiltersCliente(req.query, req.usuario._id);

    const [pedidos, total] = await Promise.all([
      Pedido.find(filtros)
        .populate("usuarioId", "nombres apellidos email")
        .populate("direccionId")
        .populate("productos.productoId", "nombre precio")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Pedido.countDocuments(filtros),
    ]);

    res.json({
      total,
      page,
      limit,
      data: pedidos,
    });
  } catch (error) {
    console.error("Error al obtener mis pedidos:", error);
    res.status(500).json({ message: error.message });
  }
};



// Listar pedidos
export const obtenerPedidos = async (req, res) => {
  try {
    const page = parseInt(req.query.page || "1", 10);
    const limit = parseInt(req.query.limit || "20", 10);

    const filtros = buildPedidoFilters(req.query);

    const [pedidos, total] = await Promise.all([
      Pedido.find(filtros)
        .populate("usuarioId", "nombres apellidos email")
        .populate("direccionId")
        .populate("productos.productoId", "nombre precio")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Pedido.countDocuments(filtros),
    ]);

    res.json({
      total,
      page,
      limit,
      data: pedidos,
    });
  } catch (error) {
    console.error("Error al obtener pedidos:", error);
    res.status(500).json({ message: error.message });
  }
};

// Obtener pedido por ID
export const obtenerPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findById(req.params.id)
      .populate("usuarioId", "nombres apellidos email")
      .populate("direccionId")
      .populate("productos.productoId", "nombre precio");
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json(pedido);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar pedido
export const actualizarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar pedido
export const eliminarPedido = async (req, res) => {
  try {
    const pedido = await Pedido.findByIdAndDelete(req.params.id);
    if (!pedido) return res.status(404).json({ message: "Pedido no encontrado" });
    res.json({ message: "Pedido eliminado" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
