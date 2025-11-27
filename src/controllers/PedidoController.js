// src/controllers/PedidoController.js
import Pedido from "../models/Pedido.js";
import Carrito from "../models/Carrito.js";



/*
// Crear pedido
export const crearPedido = async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};*/


// Crear pedido desde el carrito (sin vaciar el carrito todavía)

// src/controllers/pedidoController.js

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

    //  dirección opcional temporalmente
    const pedido = new Pedido({
      usuarioId,
      direccionId: req.body.direccionId || null,
      productos: productosPedido, // Agregar productos al pedido
      total,
      estado: "pendiente_pago", // ya refleja que está pendiente de pago
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


// Listar pedidos
export const obtenerPedidos = async (req, res) => {
  try {
    const pedidos = await Pedido.find()
      .populate("usuarioId", "nombres apellidos email")
      .populate("direccionId")
      .populate("productos.productoId", "nombre precio");
    res.json(pedidos);
  } catch (error) {
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
