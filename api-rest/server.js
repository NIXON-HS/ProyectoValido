const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.json({ message: `API REST funcionando en puerto ${port}`, server: process.env.HOSTNAME });
});

// Endpoints mock para productos
app.get('/productos', (req, res) => {
  res.json([{ id: 1, nombre: 'Producto 1', precio: 100 }]);
});

app.listen(port, () => {
  console.log(`API REST escuchando en http://localhost:${port}`);
});
