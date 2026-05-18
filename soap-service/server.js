const express = require('express');
const soap = require('soap');
const fs = require('fs');
const app = express();

const port = 8000;

// Servicio SOAP MOCK
const service = {
  FacturaService: {
    FacturaPort: {
      ValidarFactura: function(args) {
        return {
          Estado: 'VALIDADA',
          Mensaje: 'Factura generada correctamente',
          ClaveAcceso: 'FAC-2026-00001'
        };
      }
    }
  }
};

const xml = fs.readFileSync('factura.wsdl', 'utf8');

app.listen(port, function() {
  console.log('Servicio SOAP iniciado en el puerto ' + port);
  soap.listen(app, '/wsdl', service, xml, function(){
    console.log('SOAP WSDL disponible en http://localhost:' + port + '/wsdl?wsdl');
  });
});
