import PaymentModel from '../models/Payment.js';
import Pedido from '../models/Pedido.js';
import Carrito from '../models/Carrito.js';
import {
  createPreference,
  processWebhook,
  getMerchantOrder,
} from '../services/mercadopagoService.js';

/**
 * Crea una preferencia de pago para Checkout PRO
 * El frontend usará el init_point para abrir el checkout de MercadoPago
 */
export const crearPreferencia = async (req, res) => {
  try {
    const {
      transaction_amount,
      description,
      payer,
      pedidoId,
      productos,
      back_urls,
    } = req.body;

    // Validaciones
    if (!transaction_amount || transaction_amount <= 0) {
      return res
        .status(400)
        .json({ message: 'El monto debe ser mayor a 0' });
    }
    if (!payer?.email) {
      return res
        .status(400)
        .json({ message: 'El email del pagador es requerido' });
    }
    if (!pedidoId) {
      return res
        .status(400)
        .json({ message: 'El ID del pedido es requerido' });
    }

    // Verificar que el pedido existe
    const pedido = await Pedido.findById(pedidoId);
    if (!pedido) {
      return res.status(404).json({ message: 'Pedido no encontrado' });
    }

    // Obtener la URL base del backend para los callbacks
    const baseUrl =
      process.env.BACKEND_URL ||
      req.protocol + '://' + req.get('host');

    // Construir URLs de callback
    const callbackUrls = {
      success:
        back_urls?.success || `${baseUrl}/api/payments/success`,
      failure:
        back_urls?.failure || `${baseUrl}/api/payments/failure`,
      pending:
        back_urls?.pending || `${baseUrl}/api/payments/pending`,
    };

    // Crear la preferencia de pago
    const preferenceData = {
      items:
        productos && productos.length > 0
          ? productos.map((p) => ({
              title: p.nombre || `Producto ${p.productoId}`,
              quantity: p.cantidad || 1,
              unit_price: Number(p.precioUnitario || 0),
            }))
          : [
              {
                title:
                  description ||
                  `Compra - Pedido #${pedidoId}`,
                quantity: 1,
                unit_price: Number(transaction_amount),
              },
            ],
      payer: {
        email: payer.email,
        name:
          payer.name ||
          (payer.email ? payer.email.split('@')[0] : ''),
        surname: payer.surname || '',
      },
      back_urls: callbackUrls,
      auto_return: 'approved', // Redirige automáticamente cuando el pago es aprobado
      external_reference: pedidoId.toString(), // Referencia externa para identificar el pedido
      notification_url: `${baseUrl}/api/payments/webhook`, // URL del webhook
      statement_descriptor: 'ELECTROSTORE', // Descripción que aparece en el resumen de tarjeta
      metadata: {
        pedido_id: pedidoId.toString(),
        usuario_id: req.usuario.id.toString(),
        productos: JSON.stringify(productos || []),
      },
    };

    const preference = await createPreference(preferenceData);

    // La respuesta puede estar en preference.body o directamente en preference
    const preferenceBody = preference?.body || preference || {};
    const preferenceId = preferenceBody.id;
    const initPoint =
      preferenceBody.init_point ||
      preferenceBody.sandbox_init_point;

    // Log para debugging
    console.log('Preference response structure:', {
      hasBody: !!preference?.body,
      hasDirect: !!preference?.id,
      preferenceId: preferenceId || 'NOT FOUND',
      initPoint: initPoint || 'NOT FOUND',
      allKeys: Object.keys(preferenceBody || {}),
    });

    if (!preferenceId) {
      console.error('Preferencia creada pero falta ID:', {
        preferenceStructure: preference,
        preferenceBody: preferenceBody,
        allKeys: Object.keys(preferenceBody || {}),
      });
      throw new Error(
        'No se pudo crear la preferencia de pago: falta el ID de la preferencia'
      );
    }

    if (!initPoint) {
      console.error('Preferencia creada pero falta init_point:', {
        preferenceId,
        preferenceBody: preferenceBody,
        availableKeys: Object.keys(preferenceBody || {}),
      });
      throw new Error(
        'No se pudo crear la preferencia de pago: falta el init_point'
      );
    }

    // Guardar información de la preferencia en el pedido (opcional)
    await Pedido.findByIdAndUpdate(pedidoId, {
      preferenceId: preferenceId,
    });

    res.status(201).json({
      id: preferenceId,
      init_point: initPoint,
      checkout_url: initPoint, // Alias para compatibilidad
    });
  } catch (error) {
    console.error('Error creando preferencia de pago:', error);

    let errorMessage =
      'Error al crear la preferencia de pago';

    // Manejo de errores de MercadoPago
    if (
      error.cause &&
      Array.isArray(error.cause) &&
      error.cause.length > 0
    ) {
      errorMessage = error.cause[0].description || errorMessage;
    } else if (error.message) {
      errorMessage = error.message;
    } else if (error.body && error.body.message) {
      errorMessage = error.body.message;
    }

    res.status(400).json({
      message: errorMessage,
      error:
        process.env.NODE_ENV === 'development'
          ? {
              message: error.message,
              cause: error.cause,
              status: error.status,
            }
          : undefined,
    });
  }
};

/**
 * Helper: crea/actualiza un registro Payment en base a la info de Mercado Pago
 * Devuelve datos clave para actualizar el Pedido.
 */
const upsertPaymentFromMP = async (paymentInfo) => {
  const {
    id,
    status,
    status_detail,
    metadata,
    external_reference,
    transaction_amount,
    payment_method_id,
    payment_type_id,
    payer,
    date_approved,
    date_created,
  } = paymentInfo;

  const pedidoId =
    metadata?.pedido_id || external_reference;

  if (!pedidoId) {
    console.warn(
      `No se encontró pedidoId en metadata o external_reference para pago ${id}`
    );
    return null;
  }

  let pagoDB = await PaymentModel.findOne({ paymentId: id });

  if (!pagoDB) {
    pagoDB = new PaymentModel({
      paymentId: id,
      status,
      status_detail: status_detail || null,
      pedidoId,
      usuarioId: metadata?.usuario_id || null,
      transaction_amount: transaction_amount || 0,
      payment_method: payment_method_id || 'unknown',
      payment_type: payment_type_id || null,
      payer_email: payer?.email || null,
      date_created: date_created
        ? new Date(date_created)
        : new Date(),
      date_approved: date_approved
        ? new Date(date_approved)
        : null,
    });
  } else {
    pagoDB.status = status;
    pagoDB.status_detail =
      status_detail || pagoDB.status_detail;
    if (date_approved) {
      pagoDB.date_approved = new Date(date_approved);
    }
  }

  await pagoDB.save();

  return {
    pedidoId,
    status,
    paymentId: id,
    date_approved,
  };
};

/**
 * Helper: actualiza el estado del Pedido según el estado del pago.
 */
const updatePedidoFromPaymentStatus = async ({
  pedidoId,
  status,
  paymentId,
  date_approved,
}) => {
  const pedido = await Pedido.findById(pedidoId);

  if (!pedido) {
    console.warn(`Pedido ${pedidoId} no encontrado en BD`);
    return;
  }

  if (status === 'approved') {
    await Pedido.findByIdAndUpdate(pedidoId, {
      estado: 'pagado',
      paymentId,
      fechaPago: date_approved
        ? new Date(date_approved)
        : new Date(),
    });

    // Vaciar carrito cuando el pago es aprobado
    await Carrito.findOneAndUpdate(
      { usuarioId: pedido.usuarioId },
      { $set: { productos: [] } }
    );

    console.log(
      `Pedido ${pedidoId} pagado y carrito vaciado`
    );
  } else if (status === 'pending') {
    await Pedido.findByIdAndUpdate(pedidoId, {
      estado: 'pendiente_pago',
      paymentId,
    });
    console.log(
      `Pedido ${pedidoId} pendiente de pago (status: pending)`
    );
  } else if (
    status === 'rejected' ||
    status === 'cancelled'
  ) {
    await Pedido.findByIdAndUpdate(pedidoId, {
      estado: 'pago_rechazado',
      paymentId,
    });
    console.log(
      `Pago del pedido ${pedidoId} rechazado o cancelado`
    );
  }
};

/**
 * Webhook para recibir notificaciones de MercadoPago
 * Soporta type: "payment" y type: "merchant_order"
 */
export const receiveWebhook = async (req, res) => {
  try {
    const { type, data } = req.body;

    console.log('Webhook recibido:', { type, data });

    // Notificación de un pago puntual
    if (type === 'payment') {
      const paymentId = data?.id;

      if (!paymentId) {
        console.warn('Webhook payment sin payment ID');
        return res.status(200).send('OK');
      }

      // Obtener información actualizada del pago
      const paymentInfo = await processWebhook(paymentId);
      if (!paymentInfo) {
        console.warn(
          `No se pudo obtener información del pago ${paymentId}`
        );
        return res.status(200).send('OK');
      }

      const upsertResult = await upsertPaymentFromMP(
        paymentInfo
      );
      if (upsertResult) {
        await updatePedidoFromPaymentStatus(upsertResult);
      }
    }

    // Notificación de una merchant order (puede agrupar varios pagos)
    if (type === 'merchant_order') {
      const merchantOrderId = data?.id;

      if (!merchantOrderId) {
        console.warn('Webhook merchant_order sin id');
        return res.status(200).send('OK');
      }

      const merchantOrderInfo =
        await getMerchantOrder(merchantOrderId);
      if (!merchantOrderInfo) {
        console.warn(
          `No se pudo obtener información de merchant_order ${merchantOrderId}`
        );
        return res.status(200).send('OK');
      }

      const payments = merchantOrderInfo.payments || [];

      for (const mpPayment of payments) {
        if (!mpPayment?.id) continue;

        const paymentInfo = await processWebhook(
          mpPayment.id.toString()
        );
        if (!paymentInfo) continue;

        const upsertResult = await upsertPaymentFromMP(
          paymentInfo
        );
        if (upsertResult) {
          await updatePedidoFromPaymentStatus(upsertResult);
        }
      }
    }

    // Siempre responder 200 OK a MercadoPago para evitar reintentos
    return res.status(200).send('OK');
  } catch (error) {
    console.error('Error en webhook:', error);
    // Aun así responder OK para que MercadoPago no reintente
    return res.status(200).send('OK');
  }
};

// Listar pagos guardados
export const listPayments = async (req, res) => {
  try {
    const pagos = await PaymentModel.find().sort({
      date_created: -1,
    });
    res.json(pagos);
  } catch (error) {
    res.status(500).json({ error: error.message || error });
  }
};

// Verificar estado de un pago específico (opcional pero recomendado)
export const verificarPago = async (req, res) => {
  try {
    const { paymentId } = req.params;

    if (!paymentId) {
      return res.status(400).json({
        message: 'El ID del pago es requerido',
      });
    }

    const paymentInfo = await processWebhook(paymentId);
    if (!paymentInfo) {
      return res
        .status(404)
        .json({ message: 'Pago no encontrado en MercadoPago' });
    }

    res.json({
      id: paymentInfo.id,
      status: paymentInfo.status,
      status_detail: paymentInfo.status_detail,
      transaction_amount: paymentInfo.transaction_amount,
      date_approved: paymentInfo.date_approved,
    });
  } catch (error) {
    console.error('Error verificando pago:', error);
    res.status(500).json({
      message: 'Error al verificar el pago',
      error:
        process.env.NODE_ENV === 'development'
          ? error.message
          : undefined,
    });
  }
};
