// src/controllers/ProductoController.js
import Producto from "../models/Producto.js";

// Crear producto
export const crearProducto = async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();
    res.status(201).json(nuevoProducto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Listar productos (con filtros opcionales)
export const listarProductos = async (req, res) => {
  try {
    const { categoriaId, nombre } = req.query;
    let filter = {};

    if (nombre) {
      filter.nombre = { $regex: nombre, $options: "i" }; // búsqueda insensible a mayúsculas
    }

    if (categoriaId) {
      filter.categorias = categoriaId; // busca si el categoriaId está en el array
    }

    const productos = await Producto.find(filter)
      .populate("categorias", "nombre");

    res.json(productos);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener producto por ID
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id)
      .populate("categorias", "nombre");
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar producto
export const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate("categorias", "nombre");

    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json(producto);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Eliminar producto
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });
    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
