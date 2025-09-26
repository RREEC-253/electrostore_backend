// src/controllers/PedidoController.js
import Pedido from "../models/Pedido.js";

// Crear pedido
export const crearPedido = async (req, res) => {
  try {
    const pedido = new Pedido(req.body);
    await pedido.save();
    res.status(201).json(pedido);
  } catch (error) {
    res.status(400).json({ message: error.message });
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
