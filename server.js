const express = require('express');
const client = require('prom-client');

const app = express();
const port = 3000;

client.collectDefaultMetrics();

const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status']
});

const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestsTotal.inc({ method: req.method, route: req.path, status: res.statusCode });
    httpRequestDuration.observe({ method: req.method, route: req.path, status: res.statusCode }, duration);
  });
  next();
});

app.use(express.urlencoded({ extended: true }));

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.get('/login', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Webmail Sécurisé - Connexion</h1>
        <form method="POST" action="/login">
          <input type="text" name="email" placeholder="Email" required />
          <input type="password" name="password" placeholder="Mot de passe" required />
          <button type="submit">Se connecter</button>
        </form>
      </body>
    </html>
  `);
});

app.post('/login', (req, res) => {
  res.redirect('/inbox');
});

app.get('/inbox', (req, res) => {
  res.send(`
    <html>
      <body>
        <h1>Boîte de réception</h1>
        <ul>
          <li>Message de test 1</li>
          <li>Message de test 2</li>
          <li>Message de test 3</li>
        </ul>
      </body>
    </html>
  `);
});

// ✅ ROUTE SÉCURISÉE (Validée par Semgrep)
app.get('/search', (req, res) => {
  const email = req.query.email;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!email || !emailRegex.test(email)) {
    return res.status(400).send("Format d'email invalide");
  }

  const safeEmail = encodeURIComponent(email);
  res.send("Recherche sécurisée effectuée pour l'email : " + safeEmail);
});

// LIGNE IMPORTANTE : Démarrer le serveur
app.listen(port, () => {
  console.log(`Webmail démarré sur http://localhost:${port}`);
});