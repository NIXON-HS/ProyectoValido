require('dotenv').config();
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');
const { createClient } = require('@supabase/supabase-js');
const twilio = require('twilio');
const axios = require('axios');
const soap = require('soap');

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// ==========================================
// CONEXIÓN A SUPABASE
// ==========================================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_KEY
);

// ==========================================
// FIREBASE ADMIN (validar JWT)
// ==========================================
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

// ==========================================
// TWILIO
// ==========================================
const twilioClient = twilio(process.env.TWILIO_SID, process.env.TWILIO_TOKEN);

// ==========================================
// 🚨 MONITOREO Y ALERTAS DE SISTEMA (Fase 1.6)
// ==========================================
let requestCountThisSecond = 0;
let lastResetTime = Date.now();
let lastLoadAlertTime = 0;
const LOAD_THRESHOLD = 30; // Más de 30 req/seg es considerado alta carga
const ALERT_COOLDOWN = 1000 * 60 * 5; // Cooldown de 5 minutos

// Helper: Alerta de Alta Carga
async function enviarAlertaAltaCarga(reqSec) {
  if (!process.env.BREVO_API_KEY) return;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL;
  try {
    await axios.post(
      'https://api.brevo.com/v3/smtp/email',
      {
        sender: { name: 'Alerta TechStore 360', email: process.env.BREVO_SENDER_EMAIL || 'alerta@techstore360.com' },
        to: [{ email: adminEmail }],
        subject: `🚨 ALERTA: Alta Carga Detectada en API`,
        htmlContent: `
          <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #f5c6cb; background-color: #f8d7da; color: #721c24; border-radius: 5px;">
            <h2 style="margin-top: 0;">🚨 Alerta de Rendimiento: Alta Carga</h2>
            <p>Se ha detectado una tasa de peticiones inusualmente alta en el servidor API.</p>
            <hr style="border-top: 1px solid #f5c6cb;">
            <p><strong>Peticiones por segundo actuales:</strong> <span style="font-size: 18px; font-weight: bold;">${reqSec} req/seg</span></p>
            <p><strong>Límite configurado:</strong> ${LOAD_THRESHOLD} req/seg</p>
            <p><strong>Fecha y Hora:</strong> ${new Date().toISOString()}</p>
          </div>
        `
      },
      {
        headers: {
          'accept': 'application/json',
          'api-key': process.env.BREVO_API_KEY,
          'content-type': 'application/json'
        }
      }
    );
    console.log('🚨 Alerta de alta carga enviada por correo al administrador.');
  } catch (err) {
    console.error('Error enviando alerta de alta carga:', err.message);
  }
}

// Helper: Alerta de Fallo en SOAP
async function enviarAlertaFalloSOAP(idCompra, errorMsg) {
  const adminPhone = process.env.ADMIN_PHONE;
  const adminEmail = process.env.ADMIN_EMAIL || process.env.BREVO_SENDER_EMAIL;

  // 1. SMS de alerta
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    try {
      await twilioClient.messages.create({
        body: `🚨 ALERTA TechStore 360: Fallo critico en SOAP de facturacion para compra #${idCompra}. Error: ${errorMsg.slice(0, 80)}`,
        from: process.env.TWILIO_PHONE,
        to: adminPhone,
      });
      console.log('🚨 SMS de alerta de fallo SOAP enviado.');
    } catch (smsErr) {
      console.error('Error enviando SMS de alerta SOAP:', smsErr.message);
    }
  }

  // 2. Correo de alerta
  if (process.env.BREVO_API_KEY) {
    try {
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'Alerta TechStore 360', email: process.env.BREVO_SENDER_EMAIL || 'alerta@techstore360.com' },
          to: [{ email: adminEmail }],
          subject: `🚨 ALERTA: Fallo en Servicio SOAP de Facturación`,
          htmlContent: `
            <div style="font-family: Arial, sans-serif; padding: 20px; border: 1px solid #ffeeba; background-color: #fff3cd; color: #856404; border-radius: 5px;">
              <h2 style="margin-top: 0; color: #856404;">⚠️ Fallo de Comunicación con SOAP</h2>
              <p>Se ha detectado un fallo al comunicarse con el microservicio SOAP de facturación.</p>
              <hr style="border-top: 1px solid #ffeeba;">
              <p><strong>ID de Compra afectado:</strong> #${idCompra}</p>
              <p><strong>Detalle del error:</strong> ${errorMsg}</p>
              <p><strong>Fecha y Hora:</strong> ${new Date().toISOString()}</p>
            </div>
          `
        },
        {
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
      console.log('🚨 Correo de alerta de fallo SOAP enviado.');
    } catch (err) {
      console.error('Error enviando correo de alerta SOAP:', err.message);
    }
  }
}

// Middleware para contar peticiones y detectar alta carga
app.use((req, res, next) => {
  const now = Date.now();
  if (now - lastResetTime >= 1000) {
    requestCountThisSecond = 0;
    lastResetTime = now;
  }
  requestCountThisSecond++;

  if (requestCountThisSecond > LOAD_THRESHOLD && (now - lastLoadAlertTime > ALERT_COOLDOWN)) {
    lastLoadAlertTime = now;
    enviarAlertaAltaCarga(requestCountThisSecond);
  }
  next();
});

// ==========================================
// MIDDLEWARE: Verificar token JWT de Firebase
// ==========================================
const verificarToken = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionado' });
  }
  const token = authHeader.split('Bearer ')[1];
  try {
    const decoded = await admin.auth().verifyIdToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Token inválido o expirado' });
  }
};

// ==========================================
// HEALTH CHECK (Monitorea Supabase y alerta caída)
// ==========================================
app.get('/health', async (req, res) => {
  try {
    // Intentar consulta simple a Supabase para verificar estado de la base de datos
    const { error } = await supabase.from('productos').select('id').limit(1);
    if (error) throw error;

    res.json({
      status: 'OK',
      database: 'CONNECTED',
      server: process.env.HOSTNAME || 'api-rest'
    });
  } catch (err) {
    console.error('🚨 SISTEMA CAÍDO / ERROR DB:', err.message);

    // Enviar SMS de alerta al administrador
    const adminPhone = process.env.ADMIN_PHONE;
    if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
      try {
        await twilioClient.messages.create({
          body: `🚨 ALERTA TechStore 360: El sistema o la base de datos se encuentra CAIDO. Error: ${err.message.slice(0, 100)}`,
          from: process.env.TWILIO_PHONE,
          to: adminPhone,
        });
        console.log('🚨 SMS de alerta de caída enviado al administrador.');
      } catch (smsErr) {
        console.error('Error enviando SMS de caída:', smsErr.message);
      }
    }

    res.status(500).json({
      status: 'ERROR',
      message: 'Base de datos o servidor no disponible'
    });
  }
});

// ==========================================
// USUARIOS
// ==========================================
app.get('/usuarios', verificarToken, async (req, res) => {
  const { data, error } = await supabase.from('usuarios').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/usuarios/:id', verificarToken, async (req, res) => {
  const { id } = req.params;
  const { data, error } = await supabase
    .from('usuarios')
    .select('*')
    .eq('id', id)
    .single();
  if (error) return res.status(404).json({ error: 'Usuario no encontrado' });
  res.json(data);
});

app.post('/usuarios', verificarToken, async (req, res) => {
  const { id, nombre, email, rol } = req.body;
  const { data, error } = await supabase
    .from('usuarios')
    .upsert([{ id, nombre, email, rol }])
    .select();
  if (error) {
    console.error('Error insertando usuario en Supabase:', error);
    return res.status(500).json({ error: error.message });
  }
  res.status(201).json(data[0]);
});

app.delete('/usuarios/:id', verificarToken, async (req, res) => {
  const { error } = await supabase
    .from('usuarios')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Usuario eliminado' });
});

// ==========================================
// PRODUCTOS
// ==========================================
app.get('/productos', async (req, res) => {
  const { data, error } = await supabase.from('productos').select('*');
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.post('/productos', verificarToken, async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const { data, error } = await supabase
    .from('productos')
    .insert([{ nombre, descripcion, precio, stock }])
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json(data[0]);
});

app.put('/productos/:id', verificarToken, async (req, res) => {
  const { nombre, descripcion, precio, stock } = req.body;
  const { data, error } = await supabase
    .from('productos')
    .update({ nombre, descripcion, precio, stock })
    .eq('id', req.params.id)
    .select();
  if (error) return res.status(500).json({ error: error.message });
  res.json(data[0]);
});

app.delete('/productos/:id', verificarToken, async (req, res) => {
  const { error } = await supabase
    .from('productos')
    .delete()
    .eq('id', req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ message: 'Producto eliminado' });
});

// ==========================================
// COMPRAS
// ==========================================
app.get('/compras', verificarToken, async (req, res) => {
  const { data, error } = await supabase
    .from('compras')
    .select('*, productos(nombre, precio), usuarios(nombre, email)')
    .order('fecha', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

app.get('/compras/:usuarioId', verificarToken, async (req, res) => {
  const { data, error } = await supabase
    .from('compras')
    .select('*, productos(nombre, precio)')
    .eq('usuario_id', req.params.usuarioId)
    .order('fecha', { ascending: false });
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Endpoint para obtener y visualizar la factura en formato XML (Público, para accesos de correos sin token)
app.get('/factura-xml/:idCompra', async (req, res) => {
  try {
    const { idCompra } = req.params;
    const { data: compra, error } = await supabase
      .from('compras')
      .select('*, productos(nombre, precio, descripcion), usuarios(nombre, email)')
      .eq('id', idCompra)
      .maybeSingle();
      
    if (error || !compra) {
      return res.status(404).send('<Error>Factura no encontrada</Error>');
    }
    
    const id = compra.id;
    const claveAcceso = `FAC-${new Date(compra.fecha).getFullYear()}-${id.toString().padStart(5, '0')}`;
    const total = Number(compra.total).toFixed(2);
    const cantidad = compra.cantidad || 1;
    const prodName = compra.productos?.nombre || 'Producto';
    const prodPrice = Number(compra.productos?.precio || total).toFixed(2);
    const userEmail = compra.usuarios?.email || compra.email_cliente || 'cliente@techstore360.com';
    const userName = compra.usuarios?.nombre || 'Cliente';

    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>TECHSTORE 360 S.A.</razonSocial>
    <ruc>1792345678001</ruc>
    <claveAcceso>${claveAcceso}</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>${id.toString().padStart(9, '0')}</secuencial>
    <dirMatriz>Av. Los Chasquis y Rio Payamino - Ambato, Ecuador</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>${new Date(compra.fecha).toLocaleDateString('es-ES')}</fechaEmision>
    <dirEstablecimiento>Av. Los Chasquis y Rio Payamino - Ambato, Ecuador</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionComprador>05</tipoIdentificacionComprador>
    <razonSocialComprador>${userName}</razonSocialComprador>
    <identificacionComprador>1724567890</identificacionComprador>
    <direccionComprador>Quito, Ecuador</direccionComprador>
    <totalSinImpuestos>${(prodPrice * cantidad).toFixed(2)}</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>2</codigoPorcentaje>
        <baseImponible>${(prodPrice * cantidad).toFixed(2)}</baseImponible>
        <valor>0.00</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>${total}</importeTotal>
    <moneda>USD</moneda>
  </infoFactura>
  <detalles>
    <detalle>
      <codigoPrincipal>${compra.producto_id}</codigoPrincipal>
      <descripcion>${prodName}</descripcion>
      <cantidad>${cantidad}</cantidad>
      <precioUnitario>${prodPrice}</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>${(prodPrice * cantidad).toFixed(2)}</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>2</codigoPorcentaje>
          <tarifa>12.0</tarifa>
          <baseImponible>${(prodPrice * cantidad).toFixed(2)}</baseImponible>
          <valor>${(total - (prodPrice * cantidad)).toFixed(2)}</valor>
        </impuesto>
      </impuestos>
    </detalle>
  </detalles>
  <infoAdicional>
    <campoAdicional nombre="Email">${userEmail}</campoAdicional>
    <campoAdicional nombre="Sistema">TECHSTORE 360 - Sistemas Distribuidos</campoAdicional>
    <campoAdicional nombre="Fecha">${new Date(compra.fecha).toISOString()}</campoAdicional>
  </infoAdicional>
</factura>`;

    res.header('Content-Type', 'application/xml');
    res.send(xmlContent);
  } catch (err) {
    console.error('Error al generar XML de factura:', err.message);
    res.status(500).send('<Error>Error al generar XML</Error>');
  }
});

app.post('/compras', verificarToken, async (req, res) => {
  const { usuario_id, producto_id, cantidad, total, email_cliente, telefono_cliente } = req.body;
  const cantidadNormalizada = Number.parseInt(cantidad, 10);

  if (!usuario_id || !producto_id || !Number.isInteger(cantidadNormalizada) || cantidadNormalizada <= 0) {
    return res.status(400).json({ error: 'Datos de compra inválidos' });
  }

  const { data: productoActual, error: productoError } = await supabase
    .from('productos')
    .select('id, nombre, stock')
    .eq('id', producto_id)
    .maybeSingle();

  if (productoError) {
    return res.status(500).json({ error: productoError.message });
  }

  if (!productoActual) {
    return res.status(404).json({ error: 'Producto no encontrado' });
  }

  const stockAnterior = Number.parseInt(productoActual.stock ?? 0, 10) || 0;

  // 1. Descontar stock de forma atómica: la primera compra que llegue gana.
  const { data: stockActualizado, error: stockError } = await supabase
    .from('productos')
    .update({ stock: stockAnterior - cantidadNormalizada })
    .eq('id', producto_id)
    .gte('stock', cantidadNormalizada)
    .select('id, stock');

  if (stockError) {
    return res.status(500).json({ error: stockError.message });
  }

  if (!stockActualizado || stockActualizado.length === 0) {
    return res.status(409).json({
      error: `No hay stock suficiente para ${productoActual.nombre}. Stock disponible: ${stockAnterior}`,
      stock_disponible: stockAnterior,
    });
  }

  // 2. Guardar compra solo después de asegurar el inventario.
  const { data: compra, error: compraError } = await supabase
    .from('compras')
    .insert([{ usuario_id, producto_id, cantidad: cantidadNormalizada, total, estado_factura: 'PENDIENTE' }])
    .select();

  if (compraError) {
    await supabase
      .from('productos')
      .update({ stock: stockAnterior })
      .eq('id', producto_id);
    return res.status(500).json({ error: compraError.message });
  }

  const idCompra = compra[0].id;

  // 3. Llamar al servicio SOAP para generar factura con reintentos y tolerancia a fallos
  let claveAcceso = null;
  let soapErrorOccurred = false;
  let lastSoapError = '';

  const baseSoapUrl = process.env.SOAP_URL || 'http://soap-service:8000/wsdl';
  // Usar WSDL local para evitar errores de conexión / 503 en cold starts de Render
  const wsdlPath = './factura.wsdl';

  // Intentar crear el cliente SOAP y llamar al servicio con hasta 3 reintentos
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      console.log(`[SOAP] Intentando llamar al servicio de facturación (Intento ${attempt}/3)...`);
      const client = await soap.createClientAsync(wsdlPath);
      client.setEndpoint(baseSoapUrl);
      
      // Pasar el timeout (15000ms) directamente en las opciones de la llamada para soportar el cold start de Render
      const [soapResult] = await client.GenerarFacturaXMLAsync(
        { idCompra: idCompra.toString() },
        { timeout: 15000 }
      );
      claveAcceso = soapResult?.ClaveAcceso || null;
      soapErrorOccurred = false;
      break; // Éxito, salir del bucle de reintentos!
    } catch (err) {
      soapErrorOccurred = true;
      lastSoapError = err.message;
      console.warn(`[SOAP Warning] Intento ${attempt} fallido: ${err.message}`);
      if (attempt < 3) {
        // Esperar 3 segundos antes del próximo intento (dar tiempo a Render para despertar)
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  if (soapErrorOccurred) {
    console.error('Error al llamar SOAP tras 3 intentos:', lastSoapError);
    await supabase.from('compras').delete().eq('id', idCompra);
    await supabase
      .from('productos')
      .update({ stock: stockAnterior })
      .eq('id', producto_id);
    enviarAlertaFalloSOAP(idCompra, lastSoapError);
    return res.status(503).json({ error: `El sistema de facturación no está disponible. Error: ${lastSoapError}` });
  }

  // Actualizar estado de factura en Supabase
  try {
    await supabase
      .from('compras')
      .update({ estado_factura: 'VALIDADA' })
      .eq('id', idCompra);
  } catch (dbErr) {
    console.error('Error actualizando factura en DB:', dbErr.message);
  }

  // 4. Enviar SMS y WhatsApp con Twilio
  const telefonoDestino = telefono_cliente || process.env.TWILIO_TO_TEST;
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    // 3.1 Enviar SMS
    try {
      await twilioClient.messages.create({
        body: `TechStore 360: Tu compra fue registrada. Factura: ${claveAcceso || 'PROCESANDO'}`,
        from: process.env.TWILIO_PHONE,
        to: telefonoDestino,
      });
      console.log(`✉️ SMS enviado exitosamente a ${telefonoDestino}`);
    } catch (smsErr) {
      console.error('Error Twilio SMS:', smsErr.message);
    }

    // 3.2 Enviar WhatsApp (Twilio Sandbox por defecto)
    try {
      const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM || 'whatsapp:+14155238886';
      await twilioClient.messages.create({
        body: `*TechStore 360*\n\n¡Hola! Tu compra ha sido registrada exitosamente.\n\n*Factura:* ${claveAcceso || 'PROCESANDO'}\n*Total:* $${total}\n*Estado:* VALIDADA`,
        from: whatsappFrom,
        to: `whatsapp:${telefonoDestino}`,
      });
      console.log(`💬 WhatsApp enviado exitosamente a ${telefonoDestino}`);
    } catch (waErr) {
      console.error('Error Twilio WhatsApp:', waErr.message);
    }
  }

  // 5. Enviar correo con Brevo
  if (email_cliente && process.env.BREVO_API_KEY) {
    try {
      const xmlUrl = `${process.env.PUBLIC_API_URL || 'http://localhost:8080'}/factura-xml/${idCompra}`;
      await axios.post(
        'https://api.brevo.com/v3/smtp/email',
        {
          sender: { name: 'TechStore 360', email: process.env.BREVO_SENDER_EMAIL || 'facturacion@techstore360.com' },
          to: [{ email: email_cliente }],
          subject: `Factura de compra - ${claveAcceso || idCompra}`,
          htmlContent: `
            <!DOCTYPE html>
            <html lang="es">
            <head>
              <meta charset="UTF-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>
                body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background-color: #0b0f19; margin: 0; padding: 0; -webkit-font-smoothing: antialiased; }
                .wrapper { background-color: #0b0f19; width: 100%; padding: 40px 0; }
                .container { max-width: 580px; margin: 0 auto; background-color: #111827; border-radius: 24px; overflow: hidden; border: 1px solid #1f2937; box-shadow: 0 20px 25px -5px rgba(0,0,0,0.4), 0 10px 10px -5px rgba(0,0,0,0.4); }
                .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 36px 30px; text-align: center; border-bottom: 1px solid #1f2937; }
                .header .logo { font-size: 26px; font-weight: 900; letter-spacing: -0.5px; color: #ffffff; margin: 0; display: inline-flex; align-items: center; }
                .header .logo span { color: #3b82f6; }
                .content { padding: 40px 36px; color: #9ca3af; }
                .greeting { font-size: 20px; font-weight: 800; color: #ffffff; margin-bottom: 12px; }
                .subtext { font-size: 14px; line-height: 1.6; color: #9ca3af; margin-bottom: 32px; }
                .receipt-box { background-color: #1f2937; border: 1px solid #374151; border-radius: 16px; padding: 24px; margin-bottom: 32px; }
                .receipt-row { display: flex; justify-content: space-between; border-bottom: 1px solid #374151; padding: 14px 0; font-size: 14px; }
                .receipt-row:last-child { border-bottom: none; padding-bottom: 0; padding-top: 18px; margin-top: 6px; border-top: 2px dashed #4b5563; }
                .label { color: #9ca3af; font-weight: 500; }
                .value { color: #ffffff; font-weight: 700; text-align: right; }
                .status-badge { background-color: rgba(16,185,129,0.12); color: #10b981; border: 1px solid rgba(16,185,129,0.25); padding: 4px 14px; border-radius: 30px; font-size: 12px; font-weight: 800; text-transform: uppercase; display: inline-block; letter-spacing: 0.5px; }
                .total-value { color: #3b82f6; font-size: 22px; font-weight: 900; }
                .btn-container { text-align: center; margin: 10px 0 20px 0; }
                .btn { display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); color: #ffffff !important; text-decoration: none; padding: 16px 36px; border-radius: 14px; font-weight: 800; font-size: 15px; letter-spacing: 0.5px; box-shadow: 0 10px 20px -5px rgba(59,130,246,0.3); border: 1px solid rgba(59,130,246,0.2); text-transform: uppercase; }
                .footer { background-color: #0f172a; padding: 24px; text-align: center; font-size: 12px; color: #6b7280; border-top: 1px solid #1f2937; }
                .footer p { margin: 6px 0; line-height: 1.5; }
                .footer a { color: #3b82f6; text-decoration: none; font-weight: 600; }
              </style>
            </head>
            <body>
              <div class="wrapper">
                <div class="container">
                  <div class="header">
                    <h1 class="logo">⚡ TECHSTORE <span>360</span></h1>
                  </div>
                  <div class="content">
                    <div class="greeting">¡Compra Procesada Exitosamente! 🛒</div>
                    <p class="subtext">Tu pago ha sido validado de forma distribuida en nuestro cluster de resiliencia. Tu factura electrónica XML ha sido autorizada por el Servicio de Facturación SOAP.</p>
                    
                    <div class="receipt-box">
                      <div class="receipt-row">
                        <span class="label">N° de Comprobante</span>
                        <span class="value">${claveAcceso || idCompra}</span>
                      </div>
                      <div class="receipt-row">
                        <span class="label">Fecha de Emisión</span>
                        <span class="value">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                      </div>
                      <div class="receipt-row">
                        <span class="label">Estado de Transacción</span>
                        <span class="value"><span class="status-badge">VALIDADA</span></span>
                      </div>
                      <div class="receipt-row">
                        <span class="label" style="font-size: 16px; color: #ffffff; font-weight: 700; padding-top: 4px;">Total Cancelado</span>
                        <span class="value total-value">$${total}</span>
                      </div>
                    </div>
                    
                    <div class="btn-container">
                      <a href="${xmlUrl}" target="_blank" class="btn">VER FACTURA XML 📑</a>
                    </div>
                  </div>
                  <div class="footer">
                    <p>Este comprobante es un documento legal electrónico de alta disponibilidad.</p>
                    <p>&copy; ${new Date().getFullYear()} <a href="http://localhost:3000">TechStore 360</a>. Universidad Técnica de Ambato.</p>
                    <p style="font-size: 10px; color: #4b5563; margin-top: 10px;">FISEI - Sistemas Distribuidos &bull; Entorno Redundante NGINX</p>
                  </div>
                </div>
              </div>
            </body>
            </html>
          `
        },
        {
          headers: {
            'accept': 'application/json',
            'api-key': process.env.BREVO_API_KEY,
            'content-type': 'application/json'
          }
        }
      );
    } catch (emailErr) {
      console.error('Error Brevo:', emailErr.response?.data || emailErr.message);
    }
  }

  res.status(201).json({
    compra: compra[0],
    factura: { ClaveAcceso: claveAcceso, Estado: 'VALIDADA' },
    stock_restante: stockActualizado[0].stock
  });
});

// ==========================================
// ARRANQUE
// ==========================================
app.listen(port, () => {
  console.log(`✅ API REST TechStore 360 corriendo en http://localhost:${port}`);
});
