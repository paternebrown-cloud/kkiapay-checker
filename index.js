import express from "express";
import fetch from "node-fetch";

const app = express();

// On garde le body BRUT (important : KKiaPay envoie du JSON, on ne veut pas le déformer)
app.use(express.raw({ type: "*/*", limit: "5mb" }));

// Route qui imite exactement ton ancienne URL InfinityFree
app.post("/special_callback.php", async (req, res) => {
  const fullUrl = req.originalUrl; // garde les query params, ex: ?i=1

  console.log("=== Webhook reçu ===");
  console.log("Heure:", new Date().toISOString());
  console.log("URL complète:", fullUrl);
  console.log("Headers:", JSON.stringify(req.headers));
  console.log("Body brut:", req.body.toString());

  try {
    const targetUrl = "https://specialwifipro.page.gd" + fullUrl;

    const response = await fetch(targetUrl, {
      method: "POST",
      headers: {
        "Content-Type": req.headers["content-type"] || "application/json",
      },
      body: req.body,
    });

    const text = await response.text();

    console.log("Statut réponse InfinityFree:", response.status);
    console.log("Réponse InfinityFree (300 premiers car.):", text.substring(0, 300));

    // On répond OK à KKiaPay quoi qu'il arrive côté InfinityFree,
    // pour qu'il ne réessaie pas inutilement. Le vrai statut est dans les logs Render.
    res.status(200).send("OK - relayé");
  } catch (err) {
    console.error("Erreur relais:", err.message);
    res.status(500).send("Erreur relais: " + err.message);
  }
});

// Page de test pour vérifier que le service tourne
app.get("/", (req, res) => {
  res.send("Relay KKiaPay actif ✅ - " + new Date().toISOString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay démarré sur le port " + PORT));
