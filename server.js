// Archivo: server.js

const express = require('express');
const bodyParser = require('body-parser');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const apiRoutes = require('./routes/apiRoutes');
const verifyToken = require('./middleware/auth'); // Importar el middleware para verificar JWT
const app = express();
const PORT = 3000;

// Clave secreta para JWT
const SECRET_KEY = 'mi_secreta_llave';

// Archivo JSON de usuarios
const usersFile = path.join(__dirname, 'data', 'users.json');

app.use(bodyParser.json());
app.use(express.static('public')); // Servir archivos estáticos de la carpeta public

// Ruta pública para registrar clientes
app.post('/customer/signup', (req, res) => {
  const { username, password } = req.body;

  // Validación de datos de entrada
  if (!username || !password) {
    return res.status(400).json({ message: 'Se requieren username y password' });
  }

  // Leer el archivo de usuarios
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersFile));
  } catch (err) {
    console.error('Error leyendo el archivo de usuarios:', err);
  }

  // Verificar si el usuario ya existe
  if (users.find(user => user.username === username)) {
    return res.status(400).json({ message: 'El usuario ya existe' });
  }

  // Registrar al nuevo usuario
  const newUser = { username, password, role: 'customer', cart: [], orders: [] };
  users.push(newUser);

  // Escribir el nuevo usuario en el archivo JSON
  try {
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
  } catch (err) {
    return res.status(500).json({ message: 'Error al guardar el usuario' });
  }

  // Generar el token JWT para el nuevo usuario registrado
  const token = jwt.sign({ username, role: 'customer' }, SECRET_KEY, { expiresIn: '1h' });

  res.status(201).json({ message: 'Registro exitoso', token });
});

// Ruta pública para iniciar sesión como administrador
app.post('/admin/login', (req, res) => {
  const { username, password } = req.body;
  // Verificar las credenciales del administrador
  if (username === 'admin' && password === 'admin123') {
    const token = jwt.sign({ username, role: 'admin' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

// Ruta pública para iniciar sesión como cliente
app.post('/customer/login', (req, res) => {
  const { username, password } = req.body;

  // Leer el archivo de usuarios
  let users = [];
  try {
    users = JSON.parse(fs.readFileSync(usersFile));
  } catch (err) {
    console.error('Error leyendo el archivo de usuarios:', err);
  }

  // Verificar las credenciales del cliente
  const user = users.find(user => user.username === username && user.password === password && user.role === 'customer');
  if (user) {
    const token = jwt.sign({ username: user.username, role: 'customer' }, SECRET_KEY, { expiresIn: '1h' });
    res.json({ token });
  } else {
    res.status(401).json({ message: 'Credenciales inválidas' });
  }
});

// Rutas protegidas con JWT
app.use('/api', verifyToken, apiRoutes); // Proteger las rutas de la API con el middleware

// Ruta de prueba para verificar que el servidor funciona
app.get('/', (req, res) => {
  res.send('Servidor funcionando');
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor escuchando en http://localhost:${PORT}`);
});
