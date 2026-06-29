import express from "express";
import fetch from "node-fetch";
import https from "https";

const app = express();
app.use(express.raw({ type: "*/*", limit: "5mb" }));

// Agent HTTPS qui ignore les erreurs de cert (InfinityFree parfois capricieux)
const agent = new https.Agent({ rejectUnauthorized: false });

// Headers qui imitent un vrai navigateur Chrome
const BROWSER_HEADERS = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "fr-FR,fr;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Connection": "keep-alive",
  "Cache-Control": "no-cache",
  "Pragma": "no-cache",
};

app.post("/special_callback.php", async (req, res) => {
  const bodyString = req.body.toString();
  console.log("=== Webhook reçu ===", new Date().toISOString());
  console.log("Body:", bodyString);

  try {
    const params = new URLSearchParams(req.query);
    params.set("body", bodyString);
    const targetUrl = "http://jadformartion.byethost8.com/test.php?" + params.toString();

    console.log("→ Étape 1 : récupération cookie anti-bot...");

    // ÉTAPE 1 : première requête pour obtenir le cookie du challenge
    let cookieJar = "";
    try {
      const r1 = await fetch(targetUrl, {
        method: "GET",
        headers: BROWSER_HEADERS,
        agent,
        redirect: "manual",
      });
      const setCookie = r1.headers.raw()["set-cookie"] || [];
      cookieJar = setCookie.map(c => c.split(";")[0]).join("; ");
      console.log("Cookies obtenus:", cookieJar || "(aucun)");
    } catch (e) {
      console.log("Étape 1 ignorée:", e.message);
    }

    // ÉTAPE 2 : vraie requête avec cookie
    await new Promise(r => setTimeout(r, 800)); // petite pause humaine

    console.log("→ Étape 2 : envoi GET avec cookie...");
    const response = await fetch(targetUrl, {
      method: "GET",
      headers: {
        ...BROWSER_HEADERS,
        ...(cookieJar ? { Cookie: cookieJar } : {}),
        Referer: "https://specialwifipro.page.gd/",
      },
      agent,
    });

    const text = await response.text();
    console.log("Statut:", response.status);
    console.log("Réponse (300 car.):", text.substring(0, 300));

    // Détecte si on a encore le challenge JS
    if (text.includes("aes.js")) {
      console.log("⚠️  Challenge anti-bot encore actif — InfinityFree bloque toujours");
      res.status(200).send("WARN - challenge non résolu");
    } else {
      console.log("✅ PHP exécuté correctement");
      res.status(200).send("OK - relayé");
    }

  } catch (err) {
    console.error("Erreur relais:", err.message);
    res.status(500).send("Erreur: " + err.message);
  }
});

app.get("/", (req, res) => {
  res.send("Relay KKiaPay actif ✅ - " + new Date().toISOString());
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Relay démarré sur le port " + PORT));
