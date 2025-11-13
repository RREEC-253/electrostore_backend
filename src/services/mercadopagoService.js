// src/services/mercadopagoService.js
import { MercadoPagoConfig, Preference, Payment as MP_Payment } from "mercadopago";
import dotenv from "dotenv";
dotenv.config();

// Configuración de MercadoPago
// IMPORTANTE: En producción, usa MERCADOPAGO_ACCESS_TOKEN con tu token de producción (APP_USR-...)
const client = new MercadoPagoConfig({
  accessToken: process.env.MERCADOPAGO_ACCESS_TOKEN || process.env.MP_ACCESS_TOKEN_SANDBOX || "TEST-..."
});

const preference = new Preference(client);
const payment = new MP_Payment(client);

/**
 * Crea una preferencia de pago para Checkout PRO
 * @param {Object} preferenceData - Datos de la preferencia
 * @returns {Promise<Object>} - Respuesta con id e init_point
 */
export const createPreference = async (preferenceData) => {
  try {
    console.log("MercadoPago -> createPreference request:", JSON.stringify(preferenceData, null, 2));
    const response = await preference.create({ body: preferenceData });
    console.log("MercadoPago -> createPreference response:", response && response.body ? response.body : response);
    return response;
  } catch (error) {
    console.error("MercadoPago -> createPreference error (detailed):", {
      message: error?.message,
      status: error?.status,
      cause: error?.cause,
      response: error?.response,
      stack: error?.stack,
    });
    throw error.response || error;
  }
};

/**
 * Obtiene información de un pago por su ID (para webhooks)
 * @param {string} paymentId - ID del pago
 * @returns {Promise<Object|null>} - Información del pago o null si hay error
 */
export const processWebhook = async (paymentId) => {
  try {
    const result = await payment.get({ id: paymentId });
    console.log("Pago obtenido desde MercadoPago:", result);
    return result.body; // contiene toda la información del pago
  } catch (error) {
    console.error("Error al obtener pago en processWebhook:", error);
    return null;
  }
};
