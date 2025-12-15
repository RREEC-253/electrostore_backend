// src/controllers/DireccionController.js
import Direccion from "../models/Direccion.js";
import { ZONAS_ENVIO } from "../config/config.js";

const estaEnZonaEnvio = (departamento, provincia) => {
  if (!departamento || !provincia) return false;
  if (!ZONAS_ENVIO || ZONAS_ENVIO.length === 0) return false;

  const dep = (departamento || "").toLowerCase().trim();
  const prov = (provincia || "").toLowerCase().trim();

  return ZONAS_ENVIO.some(
    (z) => z.departamento === dep && z.provincia === prov
  );
};

const esAdmin = (req) => req.usuario?.rol === "admin";

const filtroPorUsuario = (req) => {
  if (esAdmin(req)) {
    if (req.query?.usuarioId) {
      return { usuarioId: req.query.usuarioId };
    }
    return {};
  }
  return { usuarioId: req.usuario.id };
};

const filtroPorId = (req) => {
  if (esAdmin(req)) {
    return { _id: req.params.id };
  }
  return { _id: req.params.id, usuarioId: req.usuario.id };
};

export const listarZonasEnvio = (req, res) => {
  res.json(ZONAS_ENVIO);
};

// Crear dirección
export const crearDireccion = async (req, res) => {
  try {
    const data = { ...req.body, usuarioId: req.usuario.id };

    data.enZonaEnvio = estaEnZonaEnvio(data.departamento, data.provincia);

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

// Listar direcciones del usuario autenticado (o todas si es admin)
export const listarDirecciones = async (req, res) => {
  try {
    const filtro = filtroPorUsuario(req);
    const direcciones = await Direccion.find(filtro).sort({
      principal: -1,
      createdAt: -1,
    });
    res.json(direcciones);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Obtener una dirección por ID
export const obtenerDireccion = async (req, res) => {
  try {
    const filtro = filtroPorId(req);
    const dir = await Direccion.findOne(filtro);
    if (!dir)
      return res.status(404).json({ message: "Dirección no encontrada" });
    res.json(dir);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Actualizar dirección
export const actualizarDireccion = async (req, res) => {
  try {
    const filtro = filtroPorId(req);
    const direccion = await Direccion.findOne(filtro);
    if (!direccion) {
      return res.status(404).json({ message: "Dirección no encontrada" });
    }

    if (req.body.principal === true) {
      await Direccion.updateMany(
        { usuarioId: direccion.usuarioId, principal: true },
        { $set: { principal: false } }
      );
    }

    Object.assign(direccion, req.body);

    if (
      req.body.departamento !== undefined ||
      req.body.provincia !== undefined
    ) {
      const dep = req.body.departamento ?? direccion.departamento;
      const prov = req.body.provincia ?? direccion.provincia;
      direccion.enZonaEnvio = estaEnZonaEnvio(dep, prov);
    }

    const guardada = await direccion.save();
    res.json(guardada);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Eliminar dirección
export const eliminarDireccion = async (req, res) => {
  try {
    const filtro = filtroPorId(req);
    const dir = await Direccion.findOneAndDelete(filtro);
    if (!dir)
      return res.status(404).json({ message: "Dirección no encontrada" });
    res.json({ message: "Dirección eliminada" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Marcar como principal
export const marcarPrincipal = async (req, res) => {
  try {
    const { id } = req.params;
    const filtro = esAdmin(req)
      ? { _id: id }
      : { _id: id, usuarioId: req.usuario.id };

    const existe = await Direccion.findOne(filtro);
    if (!existe)
      return res.status(404).json({ message: "Dirección no encontrada" });

    await Direccion.updateMany(
      { usuarioId: existe.usuarioId, principal: true },
      { $set: { principal: false } }
    );

    existe.principal = true;
    await existe.save();

    res.json(existe);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
