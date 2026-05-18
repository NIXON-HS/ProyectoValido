const express = require('express');
const soap = require('soap');
const fs = require('fs');
const app = express();

const port = 8000;

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', service: 'SOAP Facturación' });
});

const service = {
  FacturaService: {
    FacturaPort: {
      ValidarFactura: function(args) {
        return {
          Estado: 'VALIDADA',
          Mensaje: 'Factura generada correctamente',
          ClaveAcceso: `FAC-${new Date().getFullYear()}-${String(Date.now()).slice(-5)}`
        };
      },
      GenerarFacturaXML: function(args) {
        const idCompra = args.idCompra || '001';
        return {
          Estado: 'GENERADA',
          Mensaje: `Factura XML generada para compra ${idCompra}`,
          ClaveAcceso: `FAC-${new Date().getFullYear()}-${idCompra.toString().padStart(5, '0')}`
        };
      },
      ConsultarComprobante: function(args) {
        return {
          Estado: 'ENCONTRADA',
          Mensaje: `Comprobante de compra ${args.idCompra} encontrado`,
          ClaveAcceso: `FAC-${new Date().getFullYear()}-00001`
        };
      }
    }
  }
};

const xml = fs.readFileSync('factura.wsdl', 'utf8');

app.listen(port, function() {
  console.log(`✅ Servicio SOAP TechStore 360 corriendo en http://localhost:${port}`);
  console.log(`📄 WSDL disponible en http://localhost:${port}/wsdl?wsdl`);
  soap.listen(app, '/wsdl', service, xml, function(){
    console.log(`🔌 SOAP listo con operaciones: ValidarFactura, GenerarFacturaXML, ConsultarComprobante`);
  });
});
