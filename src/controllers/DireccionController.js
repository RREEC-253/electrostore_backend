// src/controllers/DireccionController.js
import Direccion from "../models/Direccion.js";

// Crear dirección
export const crearDireccion = async (req, res) => {
  try {
    const data = { ...req.body, usuarioId: req.usuario.id };

    // Si marcan como principal, desmarcamos otras
    if (data.principal === true) {
      await Direccion.updateMany(
        { usuarioId: req.usuario.id, principal: true },
        { $set: { principal: false } }
      );
    }

    const dir = await Direccion.create(data);
    res.status(201).json(dir);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Listar direcciones del usuario autenticado
export const listarDirecciones = async (req, res) => {
  try {
    const direcciones = await Direccion.find({ usuarioId: req.usuario.id })
      .sort({ principal: -1, createdAt: -1 });
    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una dirección por ID (del usuario)
export const obtenerDireccion = async (req, res) => {
  try {
    const dir = await Direccion.findOne({
      _id: req.params.id,
      usuarioId: req.usuario.id,
    });
    if (!dir) return res.status(404).json({ message: "Dirección no encontrada" });
    res.json(dir);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar dirección
export const actualizarDireccion = async (req, res) => {
  try {
    // Si actualizan a principal, desmarcamos las demás primero
    if (req.body.principal === true) {
      await Direccion.updateMany(
        { usuarioId: req.usuario.id, principal: true },
        { $set: { principal: false } }
      );
    }

    const dir = await Direccion.findOneAndUpdate(
      { _id: req.params.id, usuarioId: req.usuario.id },
      req.body,
      { new: true }
    );

    if (!dir) return res.status(404).json({ message: "Dirección no encontrada" });
    res.json(dir);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar dirección
export const eliminarDireccion = async (req, res) => {
  try {
    const dir = await Direccion.findOneAndDelete({
      _id: req.params.id,
      usuarioId: req.usuario.id,
    });
    if (!dir) return res.status(404).json({ message: "Dirección no encontrada" });
    res.json({ message: "Dirección eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marcar como principal (y desmarcar otras)
export const marcarPrincipal = async (req, res) => {
  try {
    const { id } = req.params;

    // Verificamos que la dirección exista y pertenezca al usuario
    const existe = await Direccion.findOne({ _id: id, usuarioId: req.usuario.id });
    if (!existe) return res.status(404).json({ message: "Dirección no encontrada" });

    await Direccion.updateMany(
      { usuarioId: req.usuario.id, principal: true },
      { $set: { principal: false } }
    );

    existe.principal = true;
    await existe.save();

    res.json(existe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
