import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const portArgIndex = process.argv.indexOf("--port");
const argPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
// Port 3000 is strictly required by the AI Studio environment and nginx reverse-proxy.
// Port 8080 is used by nginx in the container and must be avoided.
const PORT = argPort || (process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : 3000);

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Enable CORS and disable HTTP caching for all /api endpoints to guarantee real-time cross-device synchronization
app.use("/api", (req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
  res.header("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.header("Pragma", "no-cache");
  res.header("Expires", "0");
  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
  }
  next();
});

// ==========================================
// INTERNAL DATABASE SYSTEM (File-Backed JSON)
// ==========================================
const DATA_DIR = path.join(process.cwd(), "data");
const DB_FILE = path.join(DATA_DIR, "internal_db.json");

interface InternalDatabase {
  orders: any[];
  reservations: any[];
  customers: any[];
  logs: { timestamp: string; event: string; details?: any }[];
}

const initialOrders = [
  {
    id: "ORD-8491",
    customerName: "Matheus Silveira",
    phone: "(11) 98765-4321",
    items: [
      { name: "Margherita D.O.P.", quantity: 2, price: 68.0, crust: "Clássica Napoletana", notes: "Bastante manjericão fresco" },
      { name: "Cannoli Siciliani", quantity: 2, price: 28.0 }
    ],
    total: 164.0,
    type: "delivery",
    address: "Rua Augusta, 1420 - Apto 82, Consolação",
    paymentMethod: "Pix",
    status: "baking", // received, preparing, baking, out_for_delivery, completed
    createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    estimatedMinutes: 20,
    customerLoyaltyPoints: 340,
    pointsEarnedThisOrder: 164,
    customerTier: "Pizzaiolo Appassionato",
    customerMemberCode: "DEO-8491-FEDELTA",
    customerTotalOrders: 3
  },
  {
    id: "ORD-8492",
    customerName: "Camila Fernandes",
    phone: "(11) 97123-8899",
    items: [
      { name: "Deolinda Suprema (Tartufata)", quantity: 1, price: 89.0, crust: "Borda recheada com Ricotta de Búfala", notes: "" },
      { name: "Burrata al Forno", quantity: 1, price: 46.0 },
      { name: "Chianti Classico DOCG (Garrafa)", quantity: 1, price: 145.0 }
    ],
    total: 280.0,
    type: "table",
    tableNumber: "Mesa 04 (Jardim do Forno)",
    paymentMethod: "Cartão",
    status: "preparing",
    createdAt: new Date(Date.now() - 6 * 60 * 1000).toISOString(),
    estimatedMinutes: 25,
    customerLoyaltyPoints: 680,
    pointsEarnedThisOrder: 280,
    customerTier: "Maestro Napoletano",
    customerMemberCode: "DEO-8492-VIP",
    customerTotalOrders: 6
  },
  {
    id: "ORD-8493",
    customerName: "Luciano Rossi",
    phone: "(11) 99341-2030",
    items: [
      { name: "Mortadella & Pistacchio di Bronte", quantity: 1, price: 84.0, crust: "Clássica Napoletana", notes: "" },
      { name: "Tiramisù Tradizionale", quantity: 1, price: 32.0 }
    ],
    total: 116.0,
    type: "pickup",
    paymentMethod: "Pix",
    status: "received",
    createdAt: new Date(Date.now() - 2 * 60 * 1000).toISOString(),
    estimatedMinutes: 30,
    customerLoyaltyPoints: 210,
    pointsEarnedThisOrder: 116,
    customerTier: "Amici di Deolinda",
    customerMemberCode: "DEO-8493-FEDELTA",
    customerTotalOrders: 2
  }
];

const initialReservations = [
  {
    id: "RES-401",
    name: "Giulia Bertolli",
    email: "giulia.bertolli@gmail.com",
    phone: "(11) 98877-6655",
    date: new Date().toISOString().split("T")[0],
    time: "20:00",
    guests: 4,
    area: "Jardim do Forno a Lenha",
    occasion: "Aniversário",
    notes: "Mesa próxima ao forno para vermos os pizzaiolos.",
    status: "confirmed",
    createdAt: new Date().toISOString()
  },
  {
    id: "RES-402",
    name: "Rodrigo Mendonça",
    email: "rodrigo.m@outlook.com",
    phone: "(11) 97654-3210",
    date: new Date().toISOString().split("T")[0],
    time: "21:00",
    guests: 2,
    area: "Varanda Rústica Romântica",
    occasion: "Jantar Romântico",
    notes: "Comemoração de 5 anos de namoro.",
    status: "confirmed",
    createdAt: new Date().toISOString()
  }
];

const initialCustomers = [
  {
    id: "CUST-1001",
    name: "Matheus Silveira",
    email: "matheus.s@gmail.com",
    phone: "(11) 98765-4321",
    address: "Rua Augusta, 1420 - Apto 82, Consolação, São Paulo - SP",
    neighborhood: "Consolação",
    city: "São Paulo",
    cep: "01304-001",
    createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    loyaltyPoints: 340,
    tier: "Pizzaiolo Appassionato",
    memberCode: "DEO-8491-FEDELTA",
    totalOrdersCount: 3
  },
  {
    id: "CUST-1002",
    name: "Camila Fernandes",
    email: "camila.f@hotmail.com",
    phone: "(11) 97123-8899",
    address: "Al. dos Guatás, 310 - Saúde, São Paulo - SP",
    neighborhood: "Saúde",
    city: "São Paulo",
    cep: "04053-040",
    createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
    loyaltyPoints: 680,
    tier: "Maestro Napoletano",
    memberCode: "DEO-8492-VIP",
    totalOrdersCount: 6
  },
  {
    id: "CUST-1003",
    name: "Luciano Rossi",
    email: "luciano.rossi@uol.com.br",
    phone: "(11) 99341-2030",
    address: "Rua Bela Cintra, 890 - Jardins, São Paulo - SP",
    neighborhood: "Jardins",
    city: "São Paulo",
    cep: "01415-000",
    createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    loyaltyPoints: 210,
    tier: "Amici di Deolinda",
    memberCode: "DEO-8493-FEDELTA",
    totalOrdersCount: 2
  }
];

// Initialize DB in memory & filesystem
let db: InternalDatabase = {
  orders: [...initialOrders],
  reservations: [...initialReservations],
  customers: [...initialCustomers],
  logs: []
};

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.orders)) {
        db = {
          orders: parsed.orders || [],
          reservations: parsed.reservations || [],
          customers: parsed.customers || [],
          logs: parsed.logs || []
        };
        console.log(`[Internal DB] Loaded database from file with ${db.orders.length} orders, ${db.reservations.length} reservations, ${db.customers.length} customers.`);
        return;
      }
    }

    // Write initial database
    saveDatabase();
    console.log("[Internal DB] Initialized new file-backed database.");
  } catch (err) {
    console.error("[Internal DB] Error initializing database file:", err);
  }
}

function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
  } catch (err) {
    console.error("[Internal DB] Failed to save database file:", err);
  }
}

function logDatabaseEvent(event: string, details?: any) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    event,
    details
  };
  db.logs.unshift(logEntry);
  if (db.logs.length > 200) db.logs.pop();
}

// Start database
initDatabase();

// AI Concierge initialization
let aiClient: GoogleGenAI | null = null;
function getAIClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  }
  return aiClient;
}

// ==========================================
// API ROUTES (Internal Database Integrated)
// ==========================================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    restaurant: "Deolinda Pizzaria Napoletana",
    database: "Internal JSON Store Active",
    ordersCount: db.orders.length,
    reservationsCount: db.reservations.length,
    customersCount: db.customers.length
  });
});

// Database stats & export
app.get("/api/db/stats", (_req, res) => {
  res.json({
    ordersCount: db.orders.length,
    reservationsCount: db.reservations.length,
    customersCount: db.customers.length,
    lastLogs: db.logs.slice(0, 10),
    storageFile: DB_FILE
  });
});

// Custom Header Logo API
app.get("/api/settings/logo", (_req, res) => {
  try {
    res.json({ logoUrl: (db as any).customLogo || null });
  } catch (error: any) {
    res.json({ logoUrl: null });
  }
});

app.post("/api/settings/logo", (req, res) => {
  try {
    const { imageBase64, logoUrl } = req.body;

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `deolinda_custom_logo.png`;
      const targetPath = path.join(process.cwd(), "public", filename);
      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `/${filename}?v=${Date.now()}`;
      (db as any).customLogo = publicUrl;
      saveDatabase();
      return res.json({ success: true, logoUrl: publicUrl });
    } else if (logoUrl) {
      (db as any).customLogo = logoUrl;
      saveDatabase();
      return res.json({ success: true, logoUrl });
    } else {
      (db as any).customLogo = null;
      saveDatabase();
      return res.json({ success: true, logoUrl: null });
    }
  } catch (error: any) {
    console.error("Error saving custom logo:", error);
    res.status(500).json({ error: error.message || "Failed to save logo" });
  }
});

// Custom Attached Emblem / Lettering API (Ao lado do logo do cabeçalho e embaixo do logo na página principal)
app.get("/api/settings/emblem", (_req, res) => {
  try {
    res.json({
      emblemUrl: (db as any).customEmblem || null,
      emblemEnabled: (db as any).customEmblemEnabled !== false
    });
  } catch (error: any) {
    res.json({ emblemUrl: null, emblemEnabled: true });
  }
});

app.post("/api/settings/emblem", (req, res) => {
  try {
    const { imageBase64, emblemUrl, enabled } = req.body;

    if (enabled !== undefined) {
      (db as any).customEmblemEnabled = Boolean(enabled);
    }

    if (imageBase64) {
      const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");
      const filename = `deolinda_custom_emblem.png`;
      const targetPath = path.join(process.cwd(), "public", filename);
      fs.writeFileSync(targetPath, buffer);

      const publicUrl = `/${filename}?v=${Date.now()}`;
      (db as any).customEmblem = publicUrl;
      if (enabled === undefined) {
        (db as any).customEmblemEnabled = true;
      }
      saveDatabase();
      return res.json({ 
        success: true, 
        emblemUrl: publicUrl, 
        emblemEnabled: (db as any).customEmblemEnabled 
      });
    } else if (emblemUrl !== undefined) {
      (db as any).customEmblem = emblemUrl;
      saveDatabase();
      return res.json({ 
        success: true, 
        emblemUrl, 
        emblemEnabled: (db as any).customEmblemEnabled !== false 
      });
    } else {
      saveDatabase();
      return res.json({ 
        success: true, 
        emblemUrl: (db as any).customEmblem || null, 
        emblemEnabled: (db as any).customEmblemEnabled !== false 
      });
    }
  } catch (error: any) {
    console.error("Error saving custom emblem:", error);
    res.status(500).json({ error: error.message || "Failed to save emblem" });
  }
});

// Custom Menu Items API (Adicionar, Editar e Excluir itens do cardápio)
app.get("/api/settings/menu", (_req, res) => {
  try {
    res.json({ items: (db as any).menuItems || null });
  } catch (error: any) {
    res.json({ items: null });
  }
});

app.post("/api/settings/menu", (req, res) => {
  try {
    const { items } = req.body;
    if (Array.isArray(items)) {
      (db as any).menuItems = items;
      saveDatabase();
      return res.json({ success: true, count: items.length });
    }
    return res.status(400).json({ error: "Invalid items array" });
  } catch (error: any) {
    console.error("Error saving menu items:", error);
    res.status(500).json({ error: error.message || "Failed to save menu items" });
  }
});

// Custom Gallery / Fotos & Momentos API
app.get("/api/settings/gallery", (_req, res) => {
  try {
    res.json({ posts: (db as any).galleryPosts || null });
  } catch (error: any) {
    res.json({ posts: null });
  }
});

app.post("/api/settings/gallery", (req, res) => {
  try {
    const { posts } = req.body;
    if (Array.isArray(posts)) {
      (db as any).galleryPosts = posts;
      saveDatabase();
      return res.json({ success: true, count: posts.length });
    }
    return res.status(400).json({ error: "Invalid posts array" });
  } catch (error: any) {
    console.error("Error saving gallery posts:", error);
    res.status(500).json({ error: error.message || "Failed to save gallery posts" });
  }
});

// Custom Menu Categories API (Botões do Cardápio)
app.get("/api/settings/categories", (_req, res) => {
  try {
    res.json({ categories: (db as any).menuCategories || null });
  } catch (error: any) {
    res.json({ categories: null });
  }
});

app.post("/api/settings/categories", (req, res) => {
  try {
    const { categories } = req.body;
    if (Array.isArray(categories)) {
      (db as any).menuCategories = categories;
      saveDatabase();
      return res.json({ success: true, count: categories.length });
    }
    return res.status(400).json({ error: "Invalid categories array" });
  } catch (error: any) {
    console.error("Error saving menu categories:", error);
    res.status(500).json({ error: error.message || "Failed to save menu categories" });
  }
});

// Custom Site Information & Content API
app.get("/api/settings/site-info", (_req, res) => {
  try {
    res.json({ siteInfo: (db as any).siteInfo || null });
  } catch (error: any) {
    res.json({ siteInfo: null });
  }
});

app.post("/api/settings/site-info", (req, res) => {
  try {
    const { siteInfo } = req.body;
    if (siteInfo && typeof siteInfo === "object") {
      (db as any).siteInfo = siteInfo;
      saveDatabase();
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Invalid siteInfo object" });
  } catch (error: any) {
    console.error("Error saving site info:", error);
    res.status(500).json({ error: error.message || "Failed to save site info" });
  }
});

app.get("/api/customers", (_req, res) => {
  res.json({ customers: db.customers });
});

app.post("/api/customers", (req, res) => {
  const newCustomer = {
    id: req.body.id || `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    createdAt: new Date().toISOString(),
    ...req.body
  };
  // Update or insert
  const existingIdx = db.customers.findIndex(c => c.id === newCustomer.id || c.email === newCustomer.email || c.phone === newCustomer.phone);
  if (existingIdx >= 0) {
    db.customers[existingIdx] = { ...db.customers[existingIdx], ...newCustomer };
    logDatabaseEvent("CUSTOMER_UPDATED", { customerId: newCustomer.id, name: newCustomer.name });
  } else {
    db.customers.unshift(newCustomer);
    logDatabaseEvent("CUSTOMER_CREATED", { customerId: newCustomer.id, name: newCustomer.name });
  }
  saveDatabase();
  res.status(201).json({ success: true, customer: newCustomer });
});

// Orders API
app.get("/api/orders", (_req, res) => {
  res.json({ orders: db.orders });
});

// Single Order Lookup (Crucial for Live Customer Order Tracking Window)
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  res.json({ success: true, order });
});

app.post("/api/orders", (req, res) => {
  const newOrder = {
    id: req.body.id || `ORD-${Math.floor(1000 + Math.random() * 9000)}`,
    status: req.body.status || "received",
    createdAt: new Date().toISOString(),
    estimatedMinutes: req.body.estimatedMinutes || (req.body.type === "delivery" ? 35 : 20),
    ...req.body
  };
  db.orders.unshift(newOrder);
  logDatabaseEvent("ORDER_CREATED", { orderId: newOrder.id, customer: newOrder.customerName, total: newOrder.total });
  saveDatabase();
  res.status(201).json({ success: true, order: newOrder });
});

app.patch("/api/orders/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  logDatabaseEvent("ORDER_STATUS_CHANGED", { orderId: id, from: oldStatus, to: status });
  saveDatabase();
  res.json({ success: true, order, message: `Status do pedido atualizado para ${status}` });
});

// Reservations API
app.get("/api/reservations", (_req, res) => {
  res.json({ reservations: db.reservations });
});

app.post("/api/reservations", (req, res) => {
  const newReservation = {
    id: `RES-${Math.floor(100 + Math.random() * 900)}`,
    status: "confirmed",
    createdAt: new Date().toISOString(),
    ...req.body
  };
  db.reservations.unshift(newReservation);
  logDatabaseEvent("RESERVATION_CREATED", { resId: newReservation.id, name: newReservation.name });
  saveDatabase();
  res.status(201).json({ success: true, reservation: newReservation });
});

app.patch("/api/reservations/:id/status", (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const reservation = db.reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: "Reserva não encontrada" });
  }
  reservation.status = status;
  logDatabaseEvent("RESERVATION_STATUS_CHANGED", { resId: id, status });
  saveDatabase();
  res.json({ success: true, reservation });
});

// AI Concierge Chat Route
app.post("/api/chat", async (req, res) => {
  const { message, history } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: "Mensagem obrigatória" });
  }

  const systemInstruction = `Você é o "Mastro Deolinda", o concierge gastronômico e sommelier virtual da 'Deolinda Pizzaria Napoletana'.
Você atende os clientes em Português com carisma italiano, elegância e profunda paixão por pizza napoletana tradicional.

INFORMAÇÕES DA PIZZARIA DEOLINDA:
- Filosofia: Fermentação lenta natural de 48 horas com Lievito Madre centenário da família, farinha italiana Caputo Tipo 00, hidratação 70%, cozimento a 450°C em forno a lenha napoletano de pedra vulcânica (assa em 60-90 segundos).
- Ingredientes D.O.P.: Pomodoro San Marzano dell'Agro Sarnese-Nocerino, Mozzarella di Bufala Campana, Parmigiano Reggiano 24 meses, Fior di Latte di Agerola, Azeite EVOO toscano, Pistacchio di Bronte, Presunto di Parma 18 meses.
- Especialidades da Casa:
  * Margherita D.O.P. (Molho San Marzano, Mozzarella de Búfala, Parmigiano, Manjericão fresco, Azeite EVOO) - R$ 68
  * Deolinda Suprema (Creme de trufas negras, Stracciatella de búfala fresca, Prosciutto di Parma crocante, raspas de limão siciliano) - R$ 89
  * Mortadella & Pistacchio (Fior di latte, Mortadella Bologna I.G.P., Pesto de Pistacchio di Bronte, raspas de pistache) - R$ 84
  * Diavola Piccante (Molho San Marzano, Fior di latte, Salame tipo Spianata Piccante artesanal, flocos de pimenta calabresa) - R$ 74
  * Quattro Formaggi di Bufala (Gorgonzola Dolce, Mozzarella di Bufala, Provolone defumado, Parmigiano Reggiano) - R$ 78
  * Marinara Antica (San Marzano, alho confitado laminado, orégano selvagem do Vesúvio, azeite EVOO) - R$ 56
- Entradas: Burrata al Forno com Focaccia (R$ 46), Bruschetta Caprese (R$ 36), Arancini al Pomodoro (R$ 38).
- Sobremesas: Tiramisù Tradizionale al Mascarpone (R$ 32), Cannoli Siciliani com Ricotta & Pistache (R$ 28).
- Vinhos: Chianti Classico DOCG (R$ 145), Primitivo di Manduria (R$ 160), Prosecco Valdobbiadene (R$ 130).
- Localização: Rua Santa Cruz, 232, Centro, Itu, SP | https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac
- Horário: Terça a Domingo das 18h às 23h30 (Sexta e Sábado até 00h). Segunda fechado para descanso da massa.
- Programa de Fidelidade: Club Deolinda (ganha 10 pts a cada R$ 10, resgates a partir de 100 pts).

Suas respostas devem ser gentis, cultas, gastronômicas, dando dicas de harmonização de vinhos e explicando a leveza da nossa fermentação de 72h. Se o cliente quiser pedir ou reservar, oriente-o a usar os botões do site ou o WhatsApp direto. Use expressões italianas suaves como 'Buon appetito!', 'Benvenuto!', 'Piacere!'. Responda de forma concisa e acolhedora.`;

  try {
    const ai = getAIClient();
    if (ai) {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          { role: "user", parts: [{ text: `${systemInstruction}\n\nHistórico recente: ${JSON.stringify(history || [])}\n\nCliente: ${message}` }] }
        ],
      });
      return res.json({ reply: response.text });
    }
  } catch (err) {
    console.error("Gemini API error, fallbacking to smart assistant engine:", err);
  }

  // Smart fallback when key is not configured or network error
  const lower = message.toLowerCase();
  let fallbackReply = "Benvenuto alla Deolinda! Sou o Mastro Deolinda, seu concierge gastronômico. ";

  if (lower.includes("fermenta") || lower.includes("massa") || lower.includes("digest")) {
    fallbackReply += "Nossa massa passa por uma maturação lenta de 72 horas com Lievito Madre centenário e 70% de hidratação. Por isso, ao assar a 450°C no forno a lenha, ela fica levíssima, aerada ('cornicione' alto) e incrivelmente digestível!";
  } else if (lower.includes("vinho") || lower.includes("harmoniz") || lower.includes("bebida")) {
    fallbackReply += "Para a clássica Margherita D.O.P., recomendo um belo Chianti Classico DOCG toscano. Se você escolher a nossa Deolinda Suprema com trufas e stracciatella, um Primitivo di Manduria encorpado fica sublime!";
  } else if (lower.includes("reserva") || lower.includes("mesa") || lower.includes("horario")) {
    fallbackReply += "Atendemos de Terça a Domingo a partir das 18h00! Você pode garantir sua mesa diretamente na aba 'Reservas' no menu superior, escolhendo entre o Salão Principal, Jardim do Forno ou Varanda Romântica.";
  } else if (lower.includes("fidelidade") || lower.includes("ponto") || lower.includes("club")) {
    fallbackReply += "No nosso Club Deolinda, você acumula 10 pontos a cada R$ 10 consumidos e pode resgatar desde Cannoli crocantes até pizzas Margherita D.O.P. inteiras! Confira a seção 'Club Fidelidade' no site.";
  } else if (lower.includes("endereço") || lower.includes("local") || lower.includes("onde")) {
    fallbackReply += "Estamos localizados na Rua Santa Cruz, 232, Centro, Itu - SP! Você pode ver nossa localização exata e traçar rotas pelo Google Maps no rodapé ou pelo link: https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac";
  } else if (lower.includes("preço") || lower.includes("cardapio") || lower.includes("menu")) {
    fallbackReply += "Nossas pizzas clássicas começam a partir de R$ 56 (Marinara) e R$ 68 (Margherita D.O.P. com búfala fresca). Todas feitas com ingredientes autênticos importados da Itália!";
  } else {
    fallbackReply += "Será um imenso prazer receber você! Nossas pizzas napolitanas levam apenas ingredientes D.O.P. e são assadas em 90 segundos a 450°C. Deseja uma recomendação do nosso pizzaiolo ou ajuda para fazer seu pedido/reserva?";
  }

  return res.json({ reply: fallbackReply });
});

async function startServer() {
  // Always serve static assets from public/ folder with proper mime types
  app.use(express.static(path.join(process.cwd(), "public")));

  const isProduction = process.env.NODE_ENV === "production" && fs.existsSync(path.join(process.cwd(), "dist", "index.html"));

  if (!isProduction) {
    const { createServer: createViteServer } = await import("vite");
    const isHmrDisabled = process.env.DISABLE_HMR === "true";
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: !isHmrDisabled,
        watch: isHmrDisabled ? null : {},
      },
      appType: "spa",
    });
    app.use(vite.middlewares);

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api/")) {
        return next();
      }
      try {
        const rawIndex = fs.readFileSync(path.join(process.cwd(), "index.html"), "utf-8");
        const transformedHtml = await vite.transformIndexHtml(url, rawIndex);
        res.status(200).set({ "Content-Type": "text/html" }).end(transformedHtml);
      } catch (e) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      const indexPath = path.join(distPath, "index.html");
      if (fs.existsSync(indexPath)) {
        res.sendFile(indexPath);
      } else {
        res.sendFile(path.join(process.cwd(), "index.html"));
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deolinda Pizzaria Napoletana server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
