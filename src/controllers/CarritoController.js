// src/controllers/CarritoController.js
import Carrito from "../models/Carrito.js";
import Producto from "../models/Producto.js";



// Obtener carrito del usuario
export const obtenerCarrito = async (req, res) => {
  try {
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id })
      .populate("productos.productoId", "nombre precio");

    // 🚀 Si no existe (caso raro), lo creamos vacío
    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: req.usuario.id, productos: [] });
    }

    res.json(carrito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Agregar producto al carrito
export const agregarProducto = async (req, res) => {
  try {

    const { productoId, cantidad } = req.body;
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: req.usuario.id, productos: [] });
    }

    const productoExistente = carrito.productos.find(
      (p) => p.productoId.toString() === productoId
    );

    if (productoExistente) {
      productoExistente.cantidad += cantidad;
    } else {
      carrito.productos.push({ productoId, cantidad });
    }

    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Actualizar cantidad de un producto
export const actualizarCantidad = async (req, res) => {
  try {
    const { productoId, cantidad } = req.body;
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: req.usuario.id, productos: [] });
    }

    const producto = carrito.productos.find(
      (p) => p.productoId.toString() === productoId
    );
    if (!producto) return res.status(404).json({ message: "Producto no encontrado en el carrito" });

    producto.cantidad = cantidad;

    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar producto del carrito
export const eliminarProducto = async (req, res) => {
  try {
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: req.usuario.id, productos: [] });
    }

    carrito.productos = carrito.productos.filter(
      (p) => p.productoId.toString() !== req.params.productoId
    );

    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Vaciar carrito
export const vaciarCarrito = async (req, res) => {
  try {
    let carrito = await Carrito.findOne({ usuarioId: req.usuario.id });

    if (!carrito) {
      carrito = await Carrito.create({ usuarioId: req.usuario.id, productos: [] });
    }

    carrito.productos = [];
    await carrito.save();
    res.json(carrito);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
