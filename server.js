require('dotenv').config();
const express = require('express');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });

const access = fs.createWriteStream(path.join(logDir, 'access.log'), { flags: 'a' });

app.use(morgan('combined', { stream: access }));

let products = [
    { id: 1, name: 'Keyboard', price: 1200, qty: 10 },
    { id: 2, name: 'Mouse', price: 700, qty: 25 }
];

app.get('/health', (req, res) => res.json({
    status: 'UP',
    hostname: require('os').hostname(),
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage()
}));

app.get('/metrics', (req, res) => res.json({
    pid: process.pid,
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    cpu: process.cpuUsage()
}));

app.get('/products', (req, res) => res.json(products));

app.get('/products/:id', (req, res) => {
    const p = products.find(x => x.id == req.params.id);
    if (!p) return res.status(404).json({ error: 'Not found' });
    res.json(p);
});

app.post('/products', (req, res) => {
    const p = { id: Date.now(), ...req.body };
    products.push(p);
    res.status(201).json(p);
});

app.put('/products/:id', (req, res) => {
    const i = products.findIndex(x => x.id == req.params.id);
    if (i < 0) return res.status(404).json({ error: 'Not found' });
    products[i] = { ...products[i], ...req.body };
    res.json(products[i]);
});

app.delete('/products/:id', (req, res) => {
    products = products.filter(x => x.id != req.params.id);
    res.json({ deleted: true });
});

app.use((err, req, res, next) => {
    fs.appendFileSync(path.join(logDir, 'error.log'), err.stack + "\n");
    res.status(500).json({ error: 'Internal Server Error' });
});

app.listen(PORT, () => console.log(`Inventory server is running on: http://localhost:${PORT}`));