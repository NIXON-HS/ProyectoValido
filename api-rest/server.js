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
// HEALTH CHECK (docker-compose lo requiere)
// ==========================================
app.get('/health', (req, res) => {
  res.json({ status: 'OK', server: process.env.HOSTNAME || 'api-rest' });
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

app.post('/compras', verificarToken, async (req, res) => {
  const { usuario_id, producto_id, cantidad, total, email_cliente, telefono_cliente } = req.body;

  // 1. Guardar compra en Supabase
  const { data: compra, error: compraError } = await supabase
    .from('compras')
    .insert([{ usuario_id, producto_id, cantidad, total, estado_factura: 'PENDIENTE' }])
    .select();
  if (compraError) return res.status(500).json({ error: compraError.message });

  const idCompra = compra[0].id;

  // 2. Llamar al servicio SOAP para generar factura
  let claveAcceso = null;
  try {
    const baseSoapUrl = process.env.SOAP_URL || 'http://soap-service:8000/wsdl';
    const soapUrl = baseSoapUrl.endsWith('?wsdl') ? baseSoapUrl : `${baseSoapUrl}?wsdl`;
    const xmlFactura = `<Factura><IdCompra>${idCompra}</IdCompra><Total>${total}</Total></Factura>`;
    const client = await soap.createClientAsync(soapUrl);
    client.setEndpoint(baseSoapUrl);
    const [soapResult] = await client.GenerarFacturaXMLAsync({ idCompra: idCompra.toString() });
    claveAcceso = soapResult?.ClaveAcceso || null;

    // Actualizar estado de factura en Supabase
    await supabase
      .from('compras')
      .update({ estado_factura: 'VALIDADA' })
      .eq('id', idCompra);
  } catch (soapErr) {
    console.error('Error al llamar SOAP:', soapErr.message);
  }

  // 3. Enviar SMS con Twilio
  const telefonoDestino = telefono_cliente || process.env.TWILIO_TO_TEST || '+593967318298';
  if (process.env.TWILIO_SID && process.env.TWILIO_TOKEN) {
    try {
      await twilioClient.messages.create({
        body: `TechStore 360: Tu compra fue registrada. Factura: ${claveAcceso || 'PROCESANDO'}`,
        from: process.env.TWILIO_PHONE,
        to: telefonoDestino,
      });
      console.log(`✉️ SMS enviado exitosamente a ${telefonoDestino}`);
    } catch (smsErr) {
      console.error('Error Twilio:', smsErr.message);
    }
  }

  // 4. Enviar correo con Brevo
  if (email_cliente && process.env.BREVO_API_KEY) {
    try {
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
                body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f7f6; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 40px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05); }
                .header { background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); padding: 30px 20px; text-align: center; color: #ffffff; }
                .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: 1px; }
                .content { padding: 40px 30px; color: #334155; }
                .greeting { font-size: 18px; margin-bottom: 20px; }
                .receipt-box { background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 20px; margin-bottom: 30px; }
                .receipt-row { display: flex; justify-content: space-between; border-bottom: 1px solid #e2e8f0; padding: 12px 0; font-size: 15px; }
                .receipt-row:last-child { border-bottom: none; font-weight: bold; font-size: 18px; color: #0f172a; padding-bottom: 0; }
                .label { color: #64748b; font-weight: 500; }
                .value { color: #0f172a; font-weight: 600; text-align: right; }
                .status-badge { background-color: #10b981; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; display: inline-block; }
                .footer { background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 13px; color: #64748b; }
                .footer p { margin: 5px 0; }
                .btn { display: inline-block; background-color: #3b82f6; color: white; text-decoration: none; padding: 12px 25px; border-radius: 6px; font-weight: 600; margin-top: 10px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>TECHSTORE 360</h1>
                </div>
                <div class="content">
                  <div class="greeting">¡Hola! Gracias por tu compra.</div>
                  <p>Hemos procesado exitosamente tu pago y tu factura electrónica ha sido validada. Aquí tienes los detalles de tu transacción:</p>
                  
                  <div class="receipt-box">
                    <div class="receipt-row">
                      <span class="label">N° de Comprobante</span>
                      <span class="value">${claveAcceso || idCompra}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="label">Fecha</span>
                      <span class="value">${new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                    </div>
                    <div class="receipt-row">
                      <span class="label">Estado de Factura</span>
                      <span class="value"><span class="status-badge">VALIDADA</span></span>
                    </div>
                    <div class="receipt-row" style="margin-top: 10px; border-top: 2px dashed #cbd5e1; padding-top: 15px;">
                      <span class="label" style="color: #0f172a;">Total Pagado</span>
                      <span class="value" style="color: #10b981;">$${total}</span>
                    </div>
                  </div>
                  
                  <p style="text-align: center; margin-top: 30px;">
                    <a href="#" class="btn">Ver en la aplicación</a>
                  </p>
                </div>
                <div class="footer">
                  <p>Este es un correo automático, por favor no respondas a esta dirección.</p>
                  <p>&copy; ${new Date().getFullYear()} TechStore 360. Todos los derechos reservados.</p>
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
    factura: { ClaveAcceso: claveAcceso, Estado: 'VALIDADA' }
  });
});

// ==========================================
// ARRANQUE
// ==========================================
app.listen(port, () => {
  console.log(`✅ API REST TechStore 360 corriendo en http://localhost:${port}`);
});
