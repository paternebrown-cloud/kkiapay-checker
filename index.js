import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.raw({ type: "*/*", limit: "5mb" }));

// CORS pour autoriser les appels depuis le browser (InfinityFree)
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

// Stockage temporaire des webhooks en mémoire
const pendingWebhooks = {};

// Route POST — reçoit le webhook KKiaPay
app.post("/special_callback.php", async (req, res) => {
  const bodyString = req.body.toString();
  console.log("=== Webhook POST reçu ===", new Date().toISOString());
  console.log("Body:", bodyString);

  try {
    const data = JSON.parse(bodyString);
    const tid = data.transactionId;
    if (tid) {
      pendingWebhooks[tid] = data;
      console.log("✅ Stocké en mémoire, TID:", tid);
    }
  } catch (e) {
    console.log("Body non JSON, stocké brut");
  }

  res.status(200).send("OK");
});

// Route GET — reçoit le ping depuis le browser client (via InfinityFree)
app.get("/special_callback.php", async (req, res) => {
  console.log("=== Ping GET reçu depuis browser ===", new Date().toISOString());
  console.log("Params:", req.query);

  const tid = req.query.transactionId || req.query.tid || null;

  if (tid) {
    pendingWebhooks[tid] = {
      ...(pendingWebhooks[tid] || {}),
      ...req.query,
      transactionId: tid,
      receivedAt: new Date().toISOString()
    };
    console.log("✅ Ping enregistré, TID:", tid);
    console.log("Données complètes:", pendingWebhooks[tid]);
  }

  res.status(200).send("OK - ping reçu : " + (tid || "no TID"));
});

// Route pour voir ce qui est en attente (debug)
app.get("/pending", (req, res) => {
  res.json(pendingWebhooks);
});

app.get("/", (req, res) => {
  res.send("Relay KKiaPay actif ✅ - " + new Date().toISOString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay démarré sur le port " + PORT));
