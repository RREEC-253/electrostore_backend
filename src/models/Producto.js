// src/models/Producto.js
import mongoose from "mongoose";

const productoSchema = new mongoose.Schema(
  {
    nombre: { type: String, required: true, trim: true },
    descripcion: { type: String, trim: true },
    codigoSKU: { type: String, unique: true, required: true, trim: true },
    // 📦 Precios
    precioCompra: { type: Number, required: true },   // interno
    margenGanancia: { type: Number, default: 0 },     // % de ganancia
    precioVenta: { type: Number },    // calculado automáticamente

    // 🏷️ Oferta
    oferta: { type: Boolean, default: false },
    porcentajeOferta: { type: Number, default: 0 },   // ej. 15 → 15% de descuento
    precioOferta: { type: Number },                   // se calcula automáticamente si oferta = true

    stock: { type: Number, default: 0 },

    categorias: [
      { type: mongoose.Schema.Types.ObjectId, ref: "Categoria" }
    ],

    imagen: { type: String, trim: true },

    // ⚙️ Estado y control
    activo: { type: Boolean, default: true },          // para ocultar sin eliminar
    destacado: { type: Boolean, default: false },      // para mostrar en banners o "más vendidos"

  },
  { timestamps: true }
);

// =============================
// 🔁 Cálculos automáticos
// =============================
productoSchema.pre("save", function (next) {
  // Recalcular precioVenta
  if (this.isModified("precioCompra") || this.isModified("margenGanancia")) {
    this.precioVenta =
      this.precioCompra + (this.precioCompra * this.margenGanancia) / 100;
  }
  if (this.oferta === false) {
    this.porcentajeOferta = 0;  // o null, según prefieras
    this.precioOferta = null;
  }

  // Calcular precioOferta si hay oferta activa
  if (this.oferta && this.porcentajeOferta > 0) {
    this.precioOferta =
      this.precioVenta - (this.precioVenta * this.porcentajeOferta) / 100;
  } else {
    this.precioOferta = null;
  }

  next();
});

// =============================
//  findOneAndUpdate
// =============================
productoSchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  // Usar $set si no existe
  if (!update.$set) {
    update.$set = {};
  }

  // Acceder a los valores
  const precioCompra = update.precioCompra ?? update.$set?.precioCompra;
  const margenGanancia = update.margenGanancia ?? update.$set?.margenGanancia;
  const oferta = update.oferta ?? update.$set?.oferta;
  const porcentajeOferta = update.porcentajeOferta ?? update.$set?.porcentajeOferta;

  let precioVentaCalculado = null;

  //  CALCULAR PRECIO VENTA SI TENEMOS LOS DATOS
  if (precioCompra !== undefined && margenGanancia !== undefined) {
    precioVentaCalculado = precioCompra + (precioCompra * margenGanancia) / 100;
    update.$set.precioVenta = precioVentaCalculado;
   // console.log(' precioVenta calculado:', precioVentaCalculado);
  }

  //  MANEJO DE OFERTAS
  if (oferta === false) {
    // Si se desactiva la oferta, limpiar campos
    update.$set.porcentajeOferta = 0;
    update.$set.precioOferta = null;
    //console.log(' Oferta desactivada - limpiando campos');
  }
  else if (oferta === true && porcentajeOferta > 0) {
    // Si hay oferta activa y porcentaje, calcular precioOferta
    const precioVentaParaOferta = precioVentaCalculado || this._update.$set?.precioVenta;
    if (precioVentaParaOferta) {
      const precioOfertaCalculado = precioVentaParaOferta - (precioVentaParaOferta * porcentajeOferta) / 100;
      update.$set.precioOferta = precioOfertaCalculado;
      //console.log(' precioOferta calculado:', precioOfertaCalculado);
    }
  }
  else if (oferta === true && (porcentajeOferta === 0 || porcentajeOferta === null)) {
    // Si oferta está activa pero sin porcentaje, limpiar precioOferta
    update.$set.precioOferta = null;
  }

  this.setUpdate(update);
  console.log('📤 Update final:', update);
  next();
});
const Producto = mongoose.model("Producto", productoSchema);
export default Producto;
