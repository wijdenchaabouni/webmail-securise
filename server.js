const express = require('express');
const client = require('prom-client');

const app = express();
const port = 3000;

// Collecte des métriques par défaut (CPU, mémoire, event loop)
client.collectDefaultMetrics();

// Compteur de requêtes HTTP
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Nombre total de requêtes HTTP',
  labelNames: ['method', 'route', 'status']
});

// Histogramme de durée des requêtes
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Durée des requêtes HTTP en secondes',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.01, 0.05, 0.1, 0.5, 1, 2, 5]
});

// Middleware pour mesurer chaque requête
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

// Route de santé
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Endpoint de métriques pour Prometheus
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

// Formulaire de login
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

// Traitement du login (simplifié, sans vraie authentification)
app.post('/login', (req, res) => {
  res.redirect('/inbox');
});

// Boîte de réception factice
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

app.listen(port, () => {// Route vulnérable (pour test de sécurité)
app.get('/search', (req, res) => {
  const email = req.query.email;
  // ⚠️ FAILLE VOLONTAIRE : Concaténation directe (Injection SQL)
  const query = "SELECT * FROM users WHERE email = '" + email + "'";
  
  // On simule l'exécution de la requête
  res.send("Recherche effectuée avec la requête : " + query);
});
