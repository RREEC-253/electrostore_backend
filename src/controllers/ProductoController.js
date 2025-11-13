// src/controllers/ProductoController.js
import Producto from "../models/Producto.js";
import Categoria from "../models/Categoria.js";

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

export const buscarProductos = async (req, res) => {
  try {
    const { 
      q,                    // texto de búsqueda
      categoria,            // ID de categoría
      oferta,               // 'true' o 'false'
      destacado,            // 'true' o 'false'
      minPrecio,           // precio mínimo
      maxPrecio,           // precio máximo
      limite = 50          // límite de resultados
    } = req.query;
/*
    console.log(" Parámetros recibidos:", {
      query: q,
      categoria: categoria,
      oferta: oferta,
      destacado: destacado,
      minPrecio: minPrecio,
      maxPrecio: maxPrecio,
      limite: limite
    });
*/
    let filter = { activo: true };
    let escapedQuery;

    // 🔎 BÚSQUEDA POR TEXTO MEJORADA - AHORA INCLUYE CATEGORÍAS
    if (q) {
      escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      
      //  Buscar categorías que coincidan con el query
      const categoriasCoincidentes = await Categoria.find({
        nombre: { $regex: escapedQuery, $options: "i" }
      }).select('_id');

      const categoriasIds = categoriasCoincidentes.map(cat => cat._id);
      
     // console.log(` Categorías encontradas para "${q}": ${categoriasIds.length}`);
      
      //  Buscar productos que coincidan por nombre, SKU O categoría
      filter.$or = [
        { nombre: { $regex: escapedQuery, $options: "i" } },
        { codigoSKU: { $regex: escapedQuery, $options: "i" } }
      ];
      
      //  Si se encontraron categorías, agregar búsqueda por categoría
      if (categoriasIds.length > 0) {
        filter.$or.push({ categorias: { $in: categoriasIds } });
      }
    }

    //  Filtro por categoría (si se envía un ID específico)
    if (categoria) {
      filter.categorias = categoria;
    }

    //  Filtro por oferta
    if (oferta === 'true') {
      filter.oferta = true;
      filter.porcentajeOferta = { $gt: 0 };
    }
    //  Filtro por destacado
    if (destacado === 'true') {
      filter.destacado = true;
    }

   // console.log(" Filtro aplicado a MongoDB:", JSON.stringify(filter, null, 2));
   // console.log(" Query original:", q);
    //console.log(" Query escapado:", escapedQuery);

    //  Obtener productos con filtros básicos
    const productos = await Producto.find(filter)
      .populate("categorias", "nombre")
      .limit(parseInt(limite));

   // console.log(` Productos encontrados en DB: ${productos.length}`);

    //  CALCULAR precioFinal para todos los productos
    const productosConPrecio = productos.map(p => ({
      ...p.toObject(),
      precioFinal: calcularPrecioFinal(p),
    }));

    // Filtrar por rango de precio
    let productosFiltrados = productosConPrecio;
    
    if (minPrecio) {
      productosFiltrados = productosFiltrados.filter(
        p => p.precioFinal >= parseFloat(minPrecio)
      );
    }
    
    if (maxPrecio) {
      productosFiltrados = productosFiltrados.filter(
        p => p.precioFinal <= parseFloat(maxPrecio)
      );
    }

   // console.log(` Productos finales después de filtros: ${productosFiltrados.length}`);

    res.json({
      productos: productosFiltrados,
      total: productosFiltrados.length,
      filtrosAplicados: {
        texto: q || null,
        categoria: categoria || null,
        oferta: oferta === 'true',
        destacado: destacado === 'true',
        minPrecio: minPrecio || null,
        maxPrecio: maxPrecio || null
      }
    });

  } catch (error) {
    console.error(" Error en búsqueda avanzada:", error);
    res.status(500).json({ error: error.message });
  }
};

export const buscarSugerencias = async (req, res) => {
  try {
    const { q } = req.query;

    //console.log(" Buscando sugerencias para:", q);

    if (!q || q.trim().length < 2) {
      return res.json([]);
    }

    //  ESCAPAR caracteres especiales aquí también
    const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQuery, "i"); // Usar el query escapado

    //console.log(" Query escapado para sugerencias:", escapedQuery);

    //  Buscar coincidencias en productos
    const productos = await Producto.find(
      { $or: [{ nombre: regex }, { codigoSKU: regex }] },
      "nombre codigoSKU categorias"
    )
      .limit(8)
      .populate("categorias", "nombre");

    //  Buscar categorías
    const categorias = await Categoria.find({ nombre: regex })
      .limit(5)
      .select("nombre");

   // console.log(` Productos encontrados para sugerencias: ${productos.length}`);
   //console.log(` Categorías encontradas para sugerencias: ${categorias.length}`);

    //  Crear lista de sugerencias con tipo de coincidencia
    const sugerencias = [];

    productos.forEach((p) => {
      if (regex.test(p.nombre)) {
        sugerencias.push({
          tipo: "producto",
          coincidencia: "nombre",
          id: p._id,
          nombre: p.nombre,
          codigoSKU: p.codigoSKU,
          categoria: p.categorias?.[0]?.nombre || null,
        });
      }
      if (regex.test(p.codigoSKU)) {
        sugerencias.push({
          tipo: "producto",
          coincidencia: "sku",
          id: p._id,
          nombre: p.nombre,
          codigoSKU: p.codigoSKU,
          categoria: p.categorias?.[0]?.nombre || null,
        });
      }
    });

    categorias.forEach((c) => {
      sugerencias.push({
        tipo: "categoria",
        coincidencia: "categoria",
        id: c._id,
        nombre: c.nombre,
      });
    });

    //console.log(` Total sugerencias generadas: ${sugerencias.length}`);

    res.json(sugerencias);
  } catch (error) {
    console.error(" Error en buscarSugerencias:", error);
    res.status(500).json({ error: error.message });
  }
};

// 🆕 Obtener productos por ID de categoría
export const obtenerProductosPorCategoria = async (req, res) => {
  try {
    const { idCategoria } = req.params;

    // Buscar productos por categoría
    const productos = await Producto.find({
      categorias: idCategoria,
      activo: true,
    })
      .populate("categorias", "nombre") // opcional
      .lean();

    // ✅ Calcular precioFinal (como en destacados)
    const productosConPrecioFinal = productos.map((p) => ({
      ...p,
      precioFinal: p.oferta && p.precioOferta ? p.precioOferta : p.precioVenta,
    }));

    res.status(200).json(productosConPrecioFinal);
  } catch (error) {
    console.error("❌ Error al obtener productos por categoría:", error);
    res.status(500).json({ error: "Error del servidor" });
  }
};


