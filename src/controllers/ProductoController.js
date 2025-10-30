// src/controllers/ProductoController.js
import Producto from "../models/Producto.js";

// 🛠️ Helper: calcula el precio final visible al cliente
const calcularPrecioFinal = (producto) => {
  if (producto.oferta && producto.porcentajeOferta > 0 && producto.precioOferta) {
    return producto.precioOferta;
  }
  return producto.precioVenta;
};


// Crear producto (solo admin)
export const crearProducto = async (req, res) => {
  try {
    const nuevoProducto = new Producto(req.body);
    await nuevoProducto.save();

    const productoConPrecio = {
      ...nuevoProducto.toObject(),
      precioFinal: calcularPrecioFinal(nuevoProducto),
    };

    res.status(201).json(productoConPrecio);
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
      filter.nombre = { $regex: nombre, $options: "i" };
    }

    if (categoriaId) {
      filter.categorias = categoriaId;
    }

    const productos = await Producto.find(filter).populate("categorias", "nombre");

    const productosConPrecio = productos.map((p) => ({
      ...p.toObject(),
      precioFinal: calcularPrecioFinal(p),
    }));

    res.json(productosConPrecio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Obtener producto por ID
export const obtenerProducto = async (req, res) => {
  try {
    const producto = await Producto.findById(req.params.id).populate(
      "categorias",
      "nombre"
    );

    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    const productoConPrecio = {
      ...producto.toObject(),
      precioFinal: calcularPrecioFinal(producto),
    };

    res.json(productoConPrecio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Actualizar producto (solo admin)
export const actualizarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndUpdate(req.params.id, req.body, {
      new: true,             // devuelve el documento actualizado
      runValidators: true,   // valida los campos segun el schema
      context: 'query',      // necesario para que los hooks pre('findOneAndUpdate') funcionen bien
    }).populate("categorias", "nombre");

    if (!producto) {
      return res.status(404).json({ error: "Producto no encontrado" });
    }

    const productoConPrecio = {
      ...producto.toObject(),
      precioFinal: calcularPrecioFinal(producto),
    };

    res.json(productoConPrecio);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


// Eliminar producto (solo admin)
export const eliminarProducto = async (req, res) => {
  try {
    const producto = await Producto.findByIdAndDelete(req.params.id);
    if (!producto) return res.status(404).json({ error: "Producto no encontrado" });

    res.json({ mensaje: "Producto eliminado correctamente" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 📌 Listar solo productos con oferta activa
export const productosOfertas = async (req, res) => {
  try {
    const productos = await Producto.find({
      oferta: true, // campo booleano en tu modelo
      porcentajeOferta: { $gt: 0 },
      activo: true,
    }).populate("categorias", "nombre");

    const productosConPrecio = productos.map((p) => ({
      ...p.toObject(),
      precioFinal: p.precioOferta ?? p.precioVenta,
    }));

    res.status(200).json(productosConPrecio);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ======================================================
//  Listar productos destacados
// ======================================================
export const productosDestacados = async (req, res) => {
  try {
    const productos = await Producto.find({ activo: true, destacado: true })
      .populate("categorias", "nombre") // opcional: muestra el nombre de la categoría
      .lean();

    // Agregar precioFinal (precioOferta si está en oferta, sino precioVenta)
    const productosConPrecioFinal = productos.map((p) => ({
      ...p,
      precioFinal: p.oferta && p.precioOferta ? p.precioOferta : p.precioVenta,
    }));

    res.status(200).json(productosConPrecioFinal);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};