import express from "express";
import fetch from "node-fetch";

const app = express();

// On garde le body BRUT (important : KKiaPay envoie du JSON, on ne veut pas le déformer)
app.use(express.raw({ type: "*/*", limit: "5mb" }));

// Route qui imite exactement ton ancienne URL InfinityFree
// On reçoit en POST (comme KKiaPay envoie), mais on RENVOIE en GET vers InfinityFree
// pour contourner le challenge anti-bot qui ne bloque (a priori) que les POST.
app.post("/special_callback.php", async (req, res) => {
  const bodyString = req.body.toString();

  console.log("=== Webhook reçu (POST) ===");
  console.log("Heure:", new Date().toISOString());
  console.log("Body brut:", bodyString);

  try {
    // On garde les query params déjà présents (ex: ?i=1)
    const params = new URLSearchParams(req.query);
    // On glisse tout le JSON original dans un seul paramètre "body"
    params.set("body", bodyString);

    const targetUrl = "https://specialwifipro.page.gd/special_callback.php?" + params.toString();

    console.log("→ Forward en GET (longueur URL:", targetUrl.length, "car.)");

    const response = await fetch(targetUrl, { method: "GET" });
    const text = await response.text();

    console.log("Statut réponse InfinityFree:", response.status);
    console.log("Réponse InfinityFree (300 premiers car.):", text.substring(0, 300));

    res.status(200).send("OK - relayé en GET");
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