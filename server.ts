import express, { Request, Response, NextFunction } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
const portArgIndex = process.argv.indexOf("--port");
const argPort = portArgIndex !== -1 && process.argv[portArgIndex + 1] ? Number(process.argv[portArgIndex + 1]) : null;
// Port 3000 is strictly required by the AI Studio environment and nginx reverse-proxy.
// Port 8080 is used by nginx in the container and must be avoided.
const PORT = argPort || (process.env.PORT && process.env.PORT !== "8080" ? Number(process.env.PORT) : 3000);

// Process-level resilience against transient async errors under high concurrency
process.on("unhandledRejection", (reason) => {
  console.error("[Server] Unhandled promise rejection:", reason);
});
process.on("uncaughtException", (err) => {
  console.error("[Server] Uncaught exception:", err);
});

app.disable("x-powered-by");
// Trust only local container/reverse-proxy hops so arbitrary clients cannot spoof X-Forwarded-For
app.set("trust proxy", "loopback, linklocal, uniquelocal");

// Security headers for all HTTP responses (X-Frame-Options intentionally omitted for AI Studio iframe compatibility)
app.use((_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  next();
});

// Strict origin allowlist CORS for /api
function isAllowedApiOrigin(originHeader: string, reqHost?: string): boolean {
  try {
    const parsed = new URL(originHeader);
    const host = parsed.host.toLowerCase();
    const hostname = parsed.hostname.toLowerCase();

    if (reqHost && host === reqHost.toLowerCase()) {
      return true;
    }

    if (process.env.APP_URL) {
      try {
        const appUrl = new URL(process.env.APP_URL);
        if (host === appUrl.host.toLowerCase()) {
          return true;
        }
      } catch {
        // ignore invalid APP_URL
      }
    }

    if (hostname === "localhost" || hostname === "127.0.0.1") {
      return parsed.protocol === "http:" || parsed.protocol === "https:";
    }

    if (
      parsed.protocol === "https:" &&
      (hostname.endsWith(".run.app") ||
        hostname.endsWith(".aistudio.google.com") ||
        hostname.endsWith(".googleusercontent.com"))
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

app.use("/api", (req, res, next) => {
  const origin = typeof req.headers.origin === "string" ? req.headers.origin : "";
  if (origin) {
    if (isAllowedApiOrigin(origin, req.headers.host)) {
      res.setHeader("Access-Control-Allow-Origin", origin);
      res.setHeader("Vary", "Origin");
      res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
      res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma");
    } else if (req.method === "OPTIONS") {
      return res.sendStatus(403);
    }
  }

  const isPublicCacheableGet =
    req.method === "GET" &&
    (req.path === "/health" || req.path.startsWith("/settings/"));

  if (isPublicCacheableGet) {
    res.setHeader("Cache-Control", "public, max-age=5, stale-while-revalidate=30");
  } else {
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }
  next();
});

// ==========================================
// BOUNDED SLIDING-WINDOW RATE LIMITER
// ==========================================
interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const MAX_RATE_LIMIT_BUCKETS = 5000;

function getClientIp(req: Request): string {
  return String(req.ip || req.socket?.remoteAddress || "unknown");
}

function createRateLimiter(options: {
  windowMs: number;
  max: number;
  message: string;
}) {
  const buckets = new Map<string, RateLimitBucket>();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = getClientIp(req);

    let bucket = buckets.get(key);
    if (!bucket || bucket.resetAt <= now) {
      if (buckets.size >= MAX_RATE_LIMIT_BUCKETS) {
        // Evict oldest insertion entry to prevent unbounded memory growth
        const oldestKey = buckets.keys().next().value;
        if (oldestKey !== undefined) {
          buckets.delete(oldestKey);
        }
      }
      bucket = { count: 1, resetAt: now + options.windowMs };
      buckets.set(key, bucket);
    } else {
      bucket.count += 1;
    }

    const remaining = Math.max(0, options.max - bucket.count);
    res.setHeader("X-RateLimit-Limit", String(options.max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (bucket.count > options.max) {
      const retryAfterSec = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSec));
      return res.status(429).json({
        error: options.message,
        retryAfterSeconds: retryAfterSec
      });
    }

    next();
  };
}

const authRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 10,
  message: "Muitas tentativas de autenticação. Aguarde um minuto antes de tentar novamente."
});

const publicWriteRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 60,
  message: "Limite temporário de solicitações atingido. Tente novamente em instantes."
});

const apiReadRateLimiter = createRateLimiter({
  windowMs: 60_000,
  max: 1200,
  message: "Muitas requisições em sequência. Aguarde alguns segundos."
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
  menuItems?: any[];
  menuCategories?: any[];
  siteInfo?: any;
  customLogo?: string | null;
  customEmblem?: string | null;
  customEmblemEnabled?: boolean;
  adminPasswordHash?: string;
  galleryPosts?: any[];
  messages?: any[];
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

// ==========================================
// PASSWORD HASHING & ADMIN TOKEN AUTH
// ==========================================
const ENV_ADMIN_PASSCODE = (process.env.ADMIN_PASSCODE || "").trim();
const SESSION_SECRET =
  (process.env.SESSION_SECRET || "").trim() ||
  crypto.randomBytes(32).toString("hex");
const ADMIN_TOKEN_TTL_SEC = 8 * 60 * 60; // 8 hours
const revokedAdminTokenIds = new Set<string>();

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString("hex");
  const derived = crypto.scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${derived}`;
}

function verifyPasswordHash(password: string, storedHash: string): boolean {
  try {
    const parts = storedHash.split(":");
    if (parts.length !== 3 || parts[0] !== "scrypt") return false;
    const [, salt, expectedHex] = parts;
    if (!salt || !expectedHex) return false;
    const derived = crypto.scryptSync(password, salt, 64);
    const expectedBuf = Buffer.from(expectedHex, "hex");
    if (derived.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(derived, expectedBuf);
  } catch {
    return false;
  }
}

function timingSafeStringEqual(a: string, b: string): boolean {
  const hashA = crypto.createHash("sha256").update(a, "utf8").digest();
  const hashB = crypto.createHash("sha256").update(b, "utf8").digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

interface AdminTokenPayload {
  role: "admin";
  iat: number;
  exp: number;
  jti: string;
}

function issueAdminToken(): { token: string; expiresAt: string } {
  const nowSec = Math.floor(Date.now() / 1000);
  const payload: AdminTokenPayload = {
    role: "admin",
    iat: nowSec,
    exp: nowSec + ADMIN_TOKEN_TTL_SEC,
    jti: crypto.randomBytes(12).toString("hex")
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload), "utf8").toString("base64url");
  const sigB64 = crypto
    .createHmac("sha256", SESSION_SECRET)
    .update(payloadB64)
    .digest("base64url");
  return {
    token: `${payloadB64}.${sigB64}`,
    expiresAt: new Date(payload.exp * 1000).toISOString()
  };
}

function verifyAdminToken(token: string): AdminTokenPayload | null {
  try {
    if (!token || typeof token !== "string") return null;
    const dotIdx = token.indexOf(".");
    if (dotIdx <= 0) return null;
    const payloadB64 = token.slice(0, dotIdx);
    const sigB64 = token.slice(dotIdx + 1);
    if (!payloadB64 || !sigB64) return null;

    const expectedSig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(payloadB64)
      .digest();
    const providedSig = Buffer.from(sigB64, "base64url");
    if (expectedSig.length !== providedSig.length) return null;
    if (!crypto.timingSafeEqual(expectedSig, providedSig)) return null;

    const payload = JSON.parse(Buffer.from(payloadB64, "base64url").toString("utf8")) as AdminTokenPayload;
    if (!payload || payload.role !== "admin" || typeof payload.exp !== "number" || typeof payload.jti !== "string") {
      return null;
    }
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (revokedAdminTokenIds.has(payload.jti)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function extractBearerToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (typeof authHeader !== "string") return null;
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  return match ? match[1].trim() : null;
}

function getValidAdminSession(req: Request): AdminTokenPayload | null {
  const token = extractBearerToken(req);
  return token ? verifyAdminToken(token) : null;
}

function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const session = getValidAdminSession(req);
  if (!session) {
    return res.status(401).json({
      error: "Autenticação administrativa necessária."
    });
  }
  (req as any).adminSession = session;
  next();
}

// ==========================================
// NON-BLOCKING ATOMIC DB PERSISTENCE & CACHE
// ==========================================
let db: InternalDatabase = {
  orders: [...initialOrders],
  reservations: [...initialReservations],
  customers: [...initialCustomers],
  logs: []
};

let isDbWriting = false;
let isDbDirty = false;
const publicSettingsCache = new Map<string, string>();

function invalidateSettingsCache(key?: string) {
  if (key) {
    publicSettingsCache.delete(key);
  } else {
    publicSettingsCache.clear();
  }
}

async function flushDatabaseWriteQueue(): Promise<void> {
  if (isDbWriting) return;
  isDbWriting = true;
  try {
    while (isDbDirty) {
      isDbDirty = false;
      const snapshot = JSON.stringify(db, null, 2);
      await fs.promises.mkdir(DATA_DIR, { recursive: true });
      const tmpFile = `${DB_FILE}.${process.pid}.tmp`;
      await fs.promises.writeFile(tmpFile, snapshot, "utf-8");
      await fs.promises.rename(tmpFile, DB_FILE);
    }
  } catch (err) {
    console.error("[Internal DB] Failed async atomic database save:", err);
  } finally {
    isDbWriting = false;
    if (isDbDirty) {
      void flushDatabaseWriteQueue();
    }
  }
}

function saveDatabase() {
  isDbDirty = true;
  void flushDatabaseWriteQueue();
}

function sanitizeCustomerRecordForStorage(c: any): any {
  if (!c || typeof c !== "object") return c;
  const copy: Record<string, any> = {};
  const allowedFields = [
    "id",
    "name",
    "email",
    "phone",
    "cpf",
    "address",
    "neighborhood",
    "city",
    "cep",
    "complement",
    "isGoogleAuth",
    "googleId",
    "avatarUrl",
    "createdAt",
    "loyaltyPoints",
    "tier",
    "memberCode",
    "totalOrdersCount",
    "passwordHash"
  ];
  for (const field of allowedFields) {
    if (c[field] !== undefined) {
      copy[field] = c[field];
    }
  }
  if (typeof c.password === "string" && c.password.trim() && !copy.passwordHash) {
    copy.passwordHash = hashPassword(c.password.trim());
  }
  return copy;
}

function toPublicCustomer(c: any): Record<string, any> {
  const safe = { ...c };
  delete safe.password;
  delete safe.passwordHash;
  return safe;
}

function initDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, "utf-8");
      const parsed = JSON.parse(raw);
      if (parsed) {
        let needsMigrationSave = false;
        let adminPasswordHash = typeof parsed.adminPasswordHash === "string" ? parsed.adminPasswordHash : undefined;

        if (typeof parsed.adminPassword === "string" && parsed.adminPassword.trim()) {
          if (!adminPasswordHash) {
            adminPasswordHash = hashPassword(parsed.adminPassword.trim());
          }
          needsMigrationSave = true;
        }

        const rawCustomers = Array.isArray(parsed.customers) ? parsed.customers : [...initialCustomers];
        const migratedCustomers = rawCustomers.map((c: any) => {
          if (c && typeof c.password === "string") {
            needsMigrationSave = true;
          }
          return sanitizeCustomerRecordForStorage(c);
        });

        db = {
          orders: Array.isArray(parsed.orders) ? parsed.orders : [...initialOrders],
          reservations: Array.isArray(parsed.reservations) ? parsed.reservations : [...initialReservations],
          customers: migratedCustomers,
          logs: Array.isArray(parsed.logs) ? parsed.logs : [],
          menuItems: Array.isArray(parsed.menuItems) ? parsed.menuItems : undefined,
          menuCategories: Array.isArray(parsed.menuCategories) ? parsed.menuCategories : undefined,
          siteInfo: parsed.siteInfo || undefined,
          customLogo: parsed.customLogo !== undefined ? parsed.customLogo : null,
          customEmblem: parsed.customEmblem !== undefined ? parsed.customEmblem : null,
          customEmblemEnabled: parsed.customEmblemEnabled !== undefined ? parsed.customEmblemEnabled : true,
          adminPasswordHash,
          galleryPosts: Array.isArray(parsed.galleryPosts) ? parsed.galleryPosts : undefined,
          messages: Array.isArray(parsed.messages) ? parsed.messages : []
        };
        if (needsMigrationSave) {
          saveDatabase();
        }
        console.log(`[Internal DB] Loaded database from file with ${db.orders.length} orders, ${db.reservations.length} reservations, ${db.customers.length} customers, ${db.menuItems ? db.menuItems.length : 0} custom menu items.`);
        return;
      }
    }

    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2), "utf-8");
    console.log("[Internal DB] Initialized new file-backed database.");
  } catch (err) {
    console.error("[Internal DB] Error initializing database file:", err);
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
// SELECTIVE BODY PARSING & AUTH ORDERING
// ==========================================
const defaultJsonParser = express.json({ limit: "256kb" });
const defaultUrlParser = express.urlencoded({ limit: "256kb", extended: true });
const largeMediaJsonParser = express.json({ limit: "8mb" });

const LARGE_MEDIA_POST_PATHS = new Set([
  "/api/settings/logo",
  "/api/settings/emblem",
  "/api/settings/upload-menu-image",
  "/api/settings/upload-gallery-image",
  "/api/settings/menu",
  "/api/settings/menu-item",
  "/api/settings/gallery",
  "/api/settings/site-info"
]);

app.use(defaultUrlParser);
app.use((req, res, next) => {
  if (req.method === "POST" && LARGE_MEDIA_POST_PATHS.has(req.path)) {
    // Reject unauthenticated media/menu uploads BEFORE buffering/parsing large payloads
    return requireAdmin(req, res, () => {
      largeMediaJsonParser(req, res, next);
    });
  }
  return defaultJsonParser(req, res, next);
});

app.use("/api", (req, res, next) => {
  if (req.method === "GET") {
    return apiReadRateLimiter(req, res, next);
  }
  return next();
});

// ==========================================
// API ROUTES (Internal Database Integrated)
// ==========================================
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    restaurant: "Deolinda Pizzaria Napoletana",
    database: "Internal JSON Store Active"
  });
});

// ==========================================
// ADMIN AUTHENTICATION ROUTES (Scrypt + HMAC)
// ==========================================
app.get("/api/auth/admin/status", (_req, res) => {
  const usesEnvPasscode = Boolean(ENV_ADMIN_PASSCODE);
  const configured = usesEnvPasscode || Boolean(db.adminPasswordHash);
  res.json({
    configured,
    requiresSetup: !configured,
    usesEnvPasscode
  });
});

app.post("/api/auth/admin/setup", authRateLimiter, (req, res) => {
  if (ENV_ADMIN_PASSCODE || db.adminPasswordHash) {
    return res.status(409).json({
      error: "A senha de administrador já foi configurada."
    });
  }

  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  if (password.length < 4 || password.length > 128) {
    return res.status(400).json({
      error: "A senha inicial deve conter entre 4 e 128 caracteres."
    });
  }

  db.adminPasswordHash = hashPassword(password);
  logDatabaseEvent("ADMIN_PASSWORD_CONFIGURED", { mode: "first_run_setup" });
  saveDatabase();

  const { token, expiresAt } = issueAdminToken();
  return res.status(201).json({
    success: true,
    token,
    expiresAt
  });
});

app.post("/api/auth/admin/login", authRateLimiter, (req, res) => {
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";
  if (!password || password.length > 128) {
    return res.status(400).json({ error: "Informe a senha de acesso." });
  }

  if (!ENV_ADMIN_PASSCODE && !db.adminPasswordHash) {
    return res.status(428).json({
      error: "Configure a senha de administrador inicial antes de entrar.",
      requiresSetup: true
    });
  }

  const valid = ENV_ADMIN_PASSCODE
    ? timingSafeStringEqual(password, ENV_ADMIN_PASSCODE)
    : Boolean(db.adminPasswordHash && verifyPasswordHash(password, db.adminPasswordHash));

  if (!valid) {
    return res.status(401).json({
      error: "Senha incorreta. Acesso restrito a gestores."
    });
  }

  const { token, expiresAt } = issueAdminToken();
  return res.json({
    success: true,
    token,
    expiresAt
  });
});

app.post("/api/auth/admin/logout", requireAdmin, (req, res) => {
  const session = (req as any).adminSession as AdminTokenPayload | undefined;
  if (session?.jti) {
    if (revokedAdminTokenIds.size >= 5000) {
      revokedAdminTokenIds.clear();
    }
    revokedAdminTokenIds.add(session.jti);
  }
  return res.json({ success: true });
});

app.post("/api/auth/admin/change-password", authRateLimiter, requireAdmin, (req, res) => {
  if (ENV_ADMIN_PASSCODE) {
    return res.status(400).json({
      error: "A senha é controlada pela variável de ambiente ADMIN_PASSCODE."
    });
  }

  const currentPassword = typeof req.body?.currentPassword === "string" ? req.body.currentPassword.trim() : "";
  const newPassword = typeof req.body?.newPassword === "string" ? req.body.newPassword.trim() : "";

  if (newPassword.length < 4 || newPassword.length > 128) {
    return res.status(400).json({
      error: "A nova senha deve conter entre 4 e 128 caracteres."
    });
  }

  if (db.adminPasswordHash) {
    if (!currentPassword || !verifyPasswordHash(currentPassword, db.adminPasswordHash)) {
      return res.status(401).json({
        error: "A senha atual digitada está incorreta."
      });
    }
  }

  db.adminPasswordHash = hashPassword(newPassword);
  logDatabaseEvent("ADMIN_PASSWORD_CHANGED");
  saveDatabase();

  return res.json({
    success: true,
    message: "Senha administrativa atualizada com sucesso."
  });
});

// ==========================================
// CONTACT FORM API - PERSISTÊNCIA & ENVIO
// ==========================================
app.post(["/api/contact", "/api/contact/"], publicWriteRateLimiter, async (req, res) => {
  try {
    const { name, email, phone, subject, message, website } = req.body || {};

    // Campo invisível anti-spam (honeypot)
    if (website) {
      return res.status(200).json({
        success: true,
        message: "Mensagem recebida com sucesso!"
      });
    }

    // Validar campos obrigatórios
    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof message !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !message.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Por favor, preencha nome, e-mail e sua mensagem."
      });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim();
    const cleanPhone = typeof phone === "string" ? phone.trim() : "";
    const cleanSubject = typeof subject === "string" && subject.trim() ? subject.trim() : "Contato pelo site";
    const cleanMessage = message.trim();

    // Limites de segurança
    if (
      cleanName.length > 100 ||
      cleanEmail.length > 254 ||
      cleanPhone.length > 30 ||
      cleanSubject.length > 120 ||
      cleanMessage.length > 5000
    ) {
      return res.status(400).json({
        success: false,
        message: "Algum campo ultrapassou o tamanho permitido."
      });
    }

    // Validar formato do e-mail
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanEmail) || /[\r\n]/.test(cleanEmail)) {
      return res.status(400).json({
        success: false,
        message: "Informe um endereço de e-mail válido."
      });
    }

    // 1. Persistir mensagem de contato no banco de dados interno
    const messageRecord = {
      id: `MSG-${Date.now()}-${Math.floor(100 + Math.random() * 900)}`,
      name: cleanName,
      email: cleanEmail,
      phone: cleanPhone,
      subject: cleanSubject,
      message: cleanMessage,
      createdAt: new Date().toISOString(),
      read: false
    };

    if (!Array.isArray(db.messages)) {
      db.messages = [];
    }
    db.messages.unshift(messageRecord);
    if (db.messages.length > 500) db.messages.pop(); // Limite razoável

    logDatabaseEvent("CONTACT_MESSAGE_RECEIVED", { 
      id: messageRecord.id, 
      name: cleanName, 
      email: cleanEmail,
      subject: cleanSubject 
    });
    saveDatabase();

    // 2. Envio de e-mail opcional (se SMTP estiver configurado)
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = Number(process.env.SMTP_PORT || 465);
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const contactTo = process.env.CONTACT_TO || "antonioestefanoprando@gmail.com";

    if (smtpHost && smtpUser && smtpPass && contactTo) {
      try {
        const transporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass
          }
        });

        const escapeHtml = (value: string) =>
          value.replace(/[&<>"']/g, (char) => {
            const entities: Record<string, string> = {
              "&": "&amp;",
              "<": "&lt;",
              ">": "&gt;",
              '"': "&quot;",
              "'": "&#39;"
            };
            return entities[char];
          });

        await transporter.sendMail({
          from: `"Site Deolinda Pizzaria" <${smtpUser}>`,
          to: contactTo,
          replyTo: cleanEmail,
          subject: `Contato pelo site: ${cleanSubject.replace(/[\r\n]/g, " ")}`,
          text: [
            "Nova mensagem recebida pelo site da Deolinda Pizzaria.",
            "",
            `Nome: ${cleanName}`,
            `E-mail: ${cleanEmail}`,
            `Telefone: ${cleanPhone || "Não informado"}`,
            `Assunto: ${cleanSubject}`,
            "",
            "Mensagem:",
            cleanMessage
          ].join("\n"),
          html: `
            <h2>Nova mensagem pelo site da Deolinda Pizzaria</h2>
            <p><strong>Nome:</strong> ${escapeHtml(cleanName)}</p>
            <p><strong>E-mail:</strong> ${escapeHtml(cleanEmail)}</p>
            <p><strong>Telefone:</strong> ${escapeHtml(cleanPhone || "Não informado")}</p>
            <p><strong>Assunto:</strong> ${escapeHtml(cleanSubject)}</p>
            <hr />
            <p><strong>Mensagem:</strong></p>
            <p>${escapeHtml(cleanMessage).replace(/\n/g, "<br>")}</p>
          `
        });
        console.log(`[CONTACT] Mensagem ${messageRecord.id} enviada por e-mail com sucesso.`);
      } catch (mailError) {
        console.warn(`[CONTACT] Aviso: Envio por e-mail falhou, mas mensagem ${messageRecord.id} foi salva com segurança no banco:`, mailError);
      }
    } else {
      console.log(`[CONTACT] Mensagem ${messageRecord.id} salva no banco interno (SMTP não configurado).`);
    }

    return res.status(200).json({
      success: true,
      message: "Mensagem enviada com sucesso! Em breve entraremos em contato.",
      messageId: messageRecord.id
    });

  } catch (error: any) {
    console.error("[CONTACT] Erro inesperado ao processar mensagem:", error);
    return res.status(200).json({
      success: true,
      message: "Mensagem recebida com sucesso! Em breve entraremos em contato."
    });
  }
});

// Messages API (Protected admin management of contact messages)
app.get("/api/messages", requireAdmin, (_req, res) => {
  res.json({ messages: db.messages || [] });
});

app.patch("/api/messages/:id/read", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (Array.isArray(db.messages)) {
    const msg = db.messages.find((m) => m.id === id);
    if (msg) {
      msg.read = true;
      saveDatabase();
      return res.json({ success: true, message: msg });
    }
  }
  return res.status(404).json({ error: "Mensagem não encontrada" });
});

app.delete("/api/messages/:id", requireAdmin, (req, res) => {
  const { id } = req.params;
  if (Array.isArray(db.messages)) {
    db.messages = db.messages.filter((m) => m.id !== id);
    saveDatabase();
    return res.json({ success: true, deletedId: id });
  }
  return res.json({ success: true });
});

// Database stats (Admin-only, no internal filesystem paths exposed)
app.get("/api/db/stats", requireAdmin, (_req, res) => {
  res.json({
    ordersCount: db.orders.length,
    reservationsCount: db.reservations.length,
    customersCount: db.customers.length,
    lastLogs: db.logs.slice(0, 10)
  });
});

// Safe image validation & path-confined disk storage helpers
const ALLOWED_IMAGE_MIMES = new Set(["png", "jpeg", "jpg", "webp", "gif"]);
const MAX_UPLOAD_IMAGE_BYTES = 5 * 1024 * 1024; // 5MB decoded binary limit

function sanitizeUploadId(rawId: unknown, fallbackPrefix: string): string {
  const cleaned = String(rawId || "")
    .replace(/[^a-zA-Z0-9_-]/g, "")
    .slice(0, 64);
  return cleaned || `${fallbackPrefix}_${Date.now()}`;
}

function isSafeImageReference(url: string): boolean {
  const trimmed = url.trim();
  if (!trimmed || trimmed.length > 2_000_000) return false;
  if (/^data:image\/(png|jpeg|jpg|webp|gif);base64,[A-Za-z0-9+/=\s]+$/i.test(trimmed)) {
    return true;
  }
  if (/^\/[a-zA-Z0-9_./-]+(\?[a-zA-Z0-9_=&-]+)?$/.test(trimmed) && !trimmed.includes("..")) {
    return true;
  }
  try {
    const parsed = new URL(trimmed);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

async function saveSafeImageAsset(
  imageBase64: string,
  targetDir: string,
  filenameBase: string
): Promise<{ filename: string }> {
  const match = imageBase64.match(/^data:image\/([a-zA-Z0-9]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!match) {
    throw Object.assign(new Error("Formato de imagem base64 inválido."), { statusCode: 400 });
  }

  const rawExt = match[1].toLowerCase();
  if (!ALLOWED_IMAGE_MIMES.has(rawExt)) {
    throw Object.assign(new Error("Tipo de imagem não permitido. Use PNG, JPG, WebP ou GIF."), { statusCode: 400 });
  }

  const buffer = Buffer.from(match[2], "base64");
  if (buffer.length === 0 || buffer.length > MAX_UPLOAD_IMAGE_BYTES) {
    throw Object.assign(new Error("Tamanho da imagem excede o limite de 5MB."), { statusCode: 413 });
  }

  const ext = rawExt === "jpeg" ? "jpg" : rawExt;
  const safeBase = sanitizeUploadId(filenameBase, "asset");
  const filename = `${safeBase}.${ext}`;

  const resolvedDir = path.resolve(targetDir);
  await fs.promises.mkdir(resolvedDir, { recursive: true });
  const resolvedPath = path.resolve(resolvedDir, filename);
  if (!resolvedPath.startsWith(resolvedDir + path.sep)) {
    throw Object.assign(new Error("Caminho de destino inválido."), { statusCode: 400 });
  }

  await fs.promises.writeFile(resolvedPath, buffer);
  return { filename };
}

function sendCachedJson(res: Response, cacheKey: string, computePayload: () => unknown) {
  let serialized = publicSettingsCache.get(cacheKey);
  if (!serialized) {
    serialized = JSON.stringify(computePayload());
    publicSettingsCache.set(cacheKey, serialized);
  }
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  return res.status(200).send(serialized);
}

// Custom Header Logo API
app.get("/api/settings/logo", (_req, res) => {
  try {
    return sendCachedJson(res, "logo", () => ({ logoUrl: db.customLogo || null }));
  } catch {
    return res.json({ logoUrl: null });
  }
});

app.post("/api/settings/logo", requireAdmin, async (req, res) => {
  try {
    const { imageBase64, logoUrl } = req.body || {};

    if (typeof imageBase64 === "string" && imageBase64.trim()) {
      const normalizedBase64 = imageBase64.startsWith("data:image/")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;
      const { filename } = await saveSafeImageAsset(
        normalizedBase64,
        path.join(process.cwd(), "public"),
        "deolinda_custom_logo"
      );
      const publicUrl = `/${filename}?v=${Date.now()}`;
      db.customLogo = publicUrl;
      invalidateSettingsCache("logo");
      saveDatabase();
      return res.json({ success: true, logoUrl: publicUrl });
    } else if (typeof logoUrl === "string" && logoUrl.trim()) {
      if (!isSafeImageReference(logoUrl)) {
        return res.status(400).json({ error: "URL de imagem inválida." });
      }
      db.customLogo = logoUrl.trim();
      invalidateSettingsCache("logo");
      saveDatabase();
      return res.json({ success: true, logoUrl: db.customLogo });
    } else {
      db.customLogo = null;
      invalidateSettingsCache("logo");
      saveDatabase();
      return res.json({ success: true, logoUrl: null });
    }
  } catch (error: any) {
    const status = typeof error?.statusCode === "number" ? error.statusCode : 500;
    if (status >= 500) console.error("Error saving custom logo:", error);
    return res.status(status).json({ error: status < 500 ? error.message : "Erro ao salvar logotipo." });
  }
});

// Custom Attached Emblem / Lettering API
app.get("/api/settings/emblem", (_req, res) => {
  try {
    return sendCachedJson(res, "emblem", () => ({
      emblemUrl: db.customEmblem || null,
      emblemEnabled: db.customEmblemEnabled !== false
    }));
  } catch {
    return res.json({ emblemUrl: null, emblemEnabled: true });
  }
});

app.post("/api/settings/emblem", requireAdmin, async (req, res) => {
  try {
    const { imageBase64, emblemUrl, enabled } = req.body || {};

    if (enabled !== undefined) {
      db.customEmblemEnabled = Boolean(enabled);
    }

    if (typeof imageBase64 === "string" && imageBase64.trim()) {
      const normalizedBase64 = imageBase64.startsWith("data:image/")
        ? imageBase64
        : `data:image/png;base64,${imageBase64}`;
      const { filename } = await saveSafeImageAsset(
        normalizedBase64,
        path.join(process.cwd(), "public"),
        "deolinda_custom_emblem"
      );
      const publicUrl = `/${filename}?v=${Date.now()}`;
      db.customEmblem = publicUrl;
      if (enabled === undefined) {
        db.customEmblemEnabled = true;
      }
      invalidateSettingsCache("emblem");
      saveDatabase();
      return res.json({
        success: true,
        emblemUrl: publicUrl,
        emblemEnabled: db.customEmblemEnabled
      });
    } else if (emblemUrl !== undefined) {
      if (emblemUrl !== null && (typeof emblemUrl !== "string" || !isSafeImageReference(emblemUrl))) {
        return res.status(400).json({ error: "URL de emblema inválida." });
      }
      db.customEmblem = emblemUrl ? emblemUrl.trim() : null;
      invalidateSettingsCache("emblem");
      saveDatabase();
      return res.json({
        success: true,
        emblemUrl: db.customEmblem,
        emblemEnabled: db.customEmblemEnabled !== false
      });
    } else {
      invalidateSettingsCache("emblem");
      saveDatabase();
      return res.json({
        success: true,
        emblemUrl: db.customEmblem || null,
        emblemEnabled: db.customEmblemEnabled !== false
      });
    }
  } catch (error: any) {
    const status = typeof error?.statusCode === "number" ? error.statusCode : 500;
    if (status >= 500) console.error("Error saving custom emblem:", error);
    return res.status(status).json({ error: status < 500 ? error.message : "Erro ao salvar emblema." });
  }
});

// Custom Menu Items API
function getServerCategorySortOrder(category: any): number {
  const normalized = normalizeServerItemCategory(category).trim().toLowerCase();
  switch (normalized) {
    case "entrada":
    case "antipasti":
      return 0;
    case "pizzas_napoletanas":
      return 1;
    case "dolci":
      return 2;
    case "bevande":
    case "bebidas_sem_alcool":
    case "cervejas":
      return 3;
    default:
      return 4;
  }
}

app.get("/api/settings/menu", (_req, res) => {
  try {
    return sendCachedJson(res, "menu", () => {
      const rawItems = db.menuItems;
      const normalizedItems = Array.isArray(rawItems)
        ? rawItems
            .map((it: any) => ({
              ...it,
              category: normalizeServerItemCategory(it?.category)
            }))
            .sort((a: any, b: any) => {
              const orderA = getServerCategorySortOrder(a.category);
              const orderB = getServerCategorySortOrder(b.category);
              if (orderA !== orderB) return orderA - orderB;
              return String(a.name || "").localeCompare(String(b.name || ""), "pt-BR");
            })
        : null;
      return { items: normalizedItems };
    });
  } catch {
    return res.json({ items: null });
  }
});

function processMenuItemImage(item: any): any {
  return item;
}

// Dedicated Fast Upload Menu Image API (Protected + Path-confined)
app.post("/api/settings/upload-menu-image", requireAdmin, async (req, res) => {
  try {
    const { imageBase64, itemId } = req.body || {};
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return res.status(400).json({ error: "Dados de imagem ausentes." });
    }
    const { filename } = await saveSafeImageAsset(
      imageBase64,
      path.join(process.cwd(), "public", "menu_images"),
      itemId ? String(itemId) : `upload_${Date.now()}`
    );
    const publicUrl = `/menu_images/${filename}?v=${Date.now()}`;
    return res.json({ success: true, url: publicUrl, imageUrl: publicUrl });
  } catch (err: any) {
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    if (status >= 500) console.error("Menu image upload error:", err);
    return res.status(status).json({ error: status < 500 ? err.message : "Erro ao enviar imagem." });
  }
});

function processGalleryPostImage(post: any): any {
  return post;
}

app.post("/api/settings/upload-gallery-image", requireAdmin, async (req, res) => {
  try {
    const { imageBase64, postId } = req.body || {};
    if (typeof imageBase64 !== "string" || !imageBase64) {
      return res.status(400).json({ error: "Dados de imagem ausentes." });
    }
    const { filename } = await saveSafeImageAsset(
      imageBase64,
      path.join(process.cwd(), "public", "gallery_images"),
      postId ? String(postId) : `moment_${Date.now()}`
    );
    const publicUrl = `/gallery_images/${filename}?v=${Date.now()}`;
    return res.json({ success: true, url: publicUrl, imageUrl: publicUrl });
  } catch (err: any) {
    const status = typeof err?.statusCode === "number" ? err.statusCode : 500;
    if (status >= 500) console.error("Gallery image upload error:", err);
    return res.status(status).json({ error: status < 500 ? err.message : "Erro ao enviar imagem da galeria." });
  }
});

app.post("/api/settings/menu", requireAdmin, (req, res) => {
  try {
    const { items } = req.body || {};
    if (Array.isArray(items) && items.length <= 500) {
      const processedItems = items.map(processMenuItemImage);
      db.menuItems = processedItems;
      invalidateSettingsCache("menu");
      saveDatabase();
      return res.json({ success: true, count: processedItems.length });
    }
    return res.status(400).json({ error: "Lista de itens inválida." });
  } catch (error: any) {
    console.error("Error saving menu items:", error);
    return res.status(500).json({ error: "Erro ao salvar itens do cardápio." });
  }
});

// Single Menu Item Upsert (Add/Edit individual item)
app.post("/api/settings/menu-item", requireAdmin, (req, res) => {
  try {
    const { item } = req.body || {};
    if (item && typeof item === "object" && typeof item.id === "string" && item.id.trim()) {
      const processedItem = processMenuItemImage(item);
      if (!Array.isArray(db.menuItems)) {
        db.menuItems = [];
      }
      const existingIdx = db.menuItems.findIndex((it: any) => it.id === processedItem.id);
      if (existingIdx !== -1) {
        db.menuItems[existingIdx] = processedItem;
      } else {
        db.menuItems = [processedItem, ...db.menuItems];
      }
      invalidateSettingsCache("menu");
      saveDatabase();
      return res.json({ success: true, item: processedItem, totalCount: db.menuItems.length });
    }
    return res.status(400).json({ error: "Item inválido." });
  } catch (error: any) {
    console.error("Error saving single menu item:", error);
    return res.status(500).json({ error: "Erro ao salvar item do cardápio." });
  }
});

// Single Menu Item Delete
app.delete("/api/settings/menu-item/:id", requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    if (id && Array.isArray(db.menuItems)) {
      db.menuItems = db.menuItems.filter((it: any) => it.id !== id);
      invalidateSettingsCache("menu");
      saveDatabase();
      return res.json({ success: true, deletedId: id, totalCount: db.menuItems.length });
    }
    return res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting menu item:", error);
    return res.status(500).json({ error: "Erro ao excluir item do cardápio." });
  }
});

// Custom Gallery / Fotos & Momentos API
app.get("/api/settings/gallery", (_req, res) => {
  try {
    return sendCachedJson(res, "gallery", () => ({ posts: db.galleryPosts || null }));
  } catch {
    return res.json({ posts: null });
  }
});

app.post("/api/settings/gallery", requireAdmin, (req, res) => {
  try {
    const { posts } = req.body || {};
    if (Array.isArray(posts) && posts.length <= 200) {
      const processedPosts = posts.map(processGalleryPostImage);
      db.galleryPosts = processedPosts;
      invalidateSettingsCache("gallery");
      saveDatabase();
      return res.json({ success: true, count: processedPosts.length, posts: processedPosts });
    }
    return res.status(400).json({ error: "Lista de fotos inválida." });
  } catch (error: any) {
    console.error("Error saving gallery posts:", error);
    return res.status(500).json({ error: "Erro ao salvar galeria." });
  }
});

// Custom Menu Categories API (Botões do Cardápio)
const DEFAULT_SERVER_CATEGORIES = [
  { id: "entrada", label: "Entradas", icon: "🥗" },
  { id: "pizzas_napoletanas", label: "Pizzas Napoletanas", icon: "🍕" },
  { id: "dolci", label: "Sobremesas", icon: "🍰" },
  { id: "bevande", label: "Bebidas", icon: "🍷" }
];

function normalizeServerItemCategory(category: any): string {
  const raw = String(category || "").trim().toLowerCase();
  if (
    !raw ||
    raw === "tradizionali" ||
    raw === "speciali" ||
    raw === "pizzas tradicionais" ||
    raw === "pizzas especiais" ||
    raw === "napolitane_moderne" ||
    raw === "pizzas napolitanas moderna" ||
    raw === "pizzas napolitanas modernas" ||
    raw === "pizzas_napoletanas" ||
    raw === "pizzas napoletanas"
  ) {
    return "pizzas_napoletanas";
  }
  return String(category);
}

function normalizeServerCategories(cats: any[]): any[] {
  if (!Array.isArray(cats) || cats.length === 0) return DEFAULT_SERVER_CATEGORIES;
  const out: any[] = [];
  let hasPizzasNapoletanas = false;
  for (const c of cats) {
    if (!c) continue;
    const idLower = String(c.id || "").trim().toLowerCase();
    const labelLower = String(c.label || "").trim().toLowerCase();
    if (
      idLower === "antipasti" ||
      labelLower === "entradas & aperitivos" ||
      idLower === "bebidas_sem_alcool" ||
      labelLower === "bebidas sem alcool" ||
      labelLower === "bebidas sem álcool" ||
      idLower === "cervejas" ||
      labelLower === "cervejas"
    ) {
      continue;
    }
    if (
      idLower === "tradizionali" ||
      idLower === "speciali" ||
      idLower === "napolitane_moderne" ||
      idLower === "pizzas_napoletanas" ||
      labelLower === "pizzas tradicionais" ||
      labelLower === "pizzas especiais" ||
      labelLower === "pizzas napolitanas moderna" ||
      labelLower === "pizzas napolitanas modernas" ||
      labelLower === "pizzas napoletanas"
    ) {
      if (!hasPizzasNapoletanas) {
        out.push({ id: "pizzas_napoletanas", label: "Pizzas Napoletanas", icon: c.icon || "🍕" });
        hasPizzasNapoletanas = true;
      }
      continue;
    }
    if (idLower === "entrada" || labelLower === "entrada" || labelLower === "entradas") {
      out.push({ ...c, id: "entrada", label: "Entradas" });
      continue;
    }
    if (idLower === "bevande") {
      out.push({ ...c, label: "Bebidas" });
      continue;
    }
    out.push(c);
  }
  return out.length > 0 ? out : DEFAULT_SERVER_CATEGORIES;
}

app.get("/api/settings/categories", (_req, res) => {
  try {
    return sendCachedJson(res, "categories", () => {
      let cats = db.menuCategories;
      cats = normalizeServerCategories(cats || []);
      db.menuCategories = cats;
      return { categories: cats };
    });
  } catch {
    return res.json({ categories: DEFAULT_SERVER_CATEGORIES });
  }
});

app.post("/api/settings/categories", requireAdmin, (req, res) => {
  try {
    const { categories } = req.body || {};
    if (Array.isArray(categories) && categories.length <= 50) {
      const sanitizedCats = normalizeServerCategories(categories);
      db.menuCategories = sanitizedCats;
      invalidateSettingsCache("categories");
      saveDatabase();
      return res.json({ success: true, count: sanitizedCats.length, categories: sanitizedCats });
    }
    return res.status(400).json({ error: "Lista de categorias inválida." });
  } catch (error: any) {
    console.error("Error saving menu categories:", error);
    return res.status(500).json({ error: "Erro ao salvar categorias do cardápio." });
  }
});

// Custom Site Information & Content API
app.get("/api/settings/site-info", (_req, res) => {
  try {
    return sendCachedJson(res, "site-info", () => ({ siteInfo: db.siteInfo || null }));
  } catch {
    return res.json({ siteInfo: null });
  }
});

app.post("/api/settings/site-info", requireAdmin, (req, res) => {
  try {
    const { siteInfo } = req.body || {};
    if (siteInfo && typeof siteInfo === "object" && !Array.isArray(siteInfo)) {
      const sanitizedInfo = { ...siteInfo };
      if (typeof sanitizedInfo.backgroundImageUrl === "string") {
        const trimmedBg = sanitizedInfo.backgroundImageUrl.trim();
        if (trimmedBg && !isSafeImageReference(trimmedBg)) {
          return res.status(400).json({ error: "URL da imagem de fundo inválida." });
        }
        sanitizedInfo.backgroundImageUrl = trimmedBg;
      }
      if (sanitizedInfo.backgroundOpacity !== undefined) {
        const parsedOpacity = Number(sanitizedInfo.backgroundOpacity);
        sanitizedInfo.backgroundOpacity = Number.isFinite(parsedOpacity)
          ? Math.max(0, Math.min(100, Math.round(parsedOpacity)))
          : 15;
      }
      db.siteInfo = sanitizedInfo;
      invalidateSettingsCache("site-info");
      saveDatabase();
      return res.json({ success: true });
    }
    return res.status(400).json({ error: "Objeto siteInfo inválido." });
  } catch (error: any) {
    console.error("Error saving site info:", error);
    return res.status(500).json({ error: "Erro ao salvar informações do site." });
  }
});

// Customer Accounts (Admin list + safe public registration + customer sign-in without exposing all customers)
app.get("/api/customers", requireAdmin, (_req, res) => {
  res.json({ customers: db.customers.map(toPublicCustomer) });
});

app.post("/api/customers/login", authRateLimiter, (req, res) => {
  const identifier = typeof req.body?.identifier === "string" ? req.body.identifier.trim() : "";
  const password = typeof req.body?.password === "string" ? req.body.password.trim() : "";

  if (!identifier || !password || identifier.length > 254 || password.length > 128) {
    return res.status(400).json({ error: "Informe identificador e senha válidos." });
  }

  const cleanIdent = identifier.toLowerCase();
  const cleanPhone = identifier.replace(/\D/g, "");

  const customer = db.customers.find(
    (c) =>
      (typeof c.email === "string" && c.email.toLowerCase() === cleanIdent) ||
      (typeof c.phone === "string" && cleanPhone.length >= 8 && c.phone.replace(/\D/g, "") === cleanPhone)
  );

  if (!customer) {
    return res.status(404).json({ error: "Cadastro não encontrado." });
  }

  if (typeof customer.passwordHash === "string" && customer.passwordHash) {
    if (!verifyPasswordHash(password, customer.passwordHash)) {
      return res.status(401).json({ error: "Senha incorreta." });
    }
  } else {
    // Allow legacy seed customer record without passwordHash to set a password on first login
    customer.passwordHash = hashPassword(password);
    saveDatabase();
  }

  return res.json({ success: true, customer: toPublicCustomer(customer) });
});

app.post("/api/customers", publicWriteRateLimiter, (req, res) => {
  const body = req.body || {};
  const cleanName = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const cleanEmail = typeof body.email === "string" ? body.email.trim().toLowerCase().slice(0, 254) : "";
  const cleanPhone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";

  if (!cleanName || (!cleanEmail && !cleanPhone)) {
    return res.status(400).json({ error: "Nome e e-mail ou telefone são obrigatórios." });
  }

  const existingIdx = db.customers.findIndex(
    (c) =>
      (typeof body.id === "string" && c.id === body.id) ||
      (cleanEmail && typeof c.email === "string" && c.email.toLowerCase() === cleanEmail) ||
      (cleanPhone && typeof c.phone === "string" && c.phone === cleanPhone)
  );

  const sanitizedInput = sanitizeCustomerRecordForStorage({
    ...body,
    id:
      existingIdx >= 0
        ? db.customers[existingIdx].id
        : typeof body.id === "string" && /^CUST-[A-Za-z0-9_-]{1,32}$/.test(body.id)
        ? body.id
        : `CUST-${Math.floor(1000 + Math.random() * 9000)}`,
    name: cleanName,
    email: cleanEmail,
    phone: cleanPhone,
    createdAt: existingIdx >= 0 ? db.customers[existingIdx].createdAt : new Date().toISOString()
  });

  let savedCustomer: any;
  if (existingIdx >= 0) {
    savedCustomer = { ...db.customers[existingIdx], ...sanitizedInput };
    db.customers[existingIdx] = savedCustomer;
    logDatabaseEvent("CUSTOMER_UPDATED", { customerId: savedCustomer.id, name: savedCustomer.name });
  } else {
    savedCustomer = sanitizedInput;
    db.customers.unshift(savedCustomer);
    if (db.customers.length > 5000) db.customers.pop();
    logDatabaseEvent("CUSTOMER_CREATED", { customerId: savedCustomer.id, name: savedCustomer.name });
  }

  saveDatabase();
  return res.status(201).json({ success: true, customer: toPublicCustomer(savedCustomer) });
});

// Orders API
const ALLOWED_ORDER_STATUSES = new Set([
  "received",
  "preparing",
  "baking",
  "out_for_delivery",
  "completed",
  "cancelled"
]);
const ALLOWED_ORDER_TYPES = new Set(["delivery", "pickup", "table"]);

app.get("/api/orders", requireAdmin, (_req, res) => {
  res.json({ orders: db.orders });
});

// Single Order Lookup (Admin gets full order; public tracker gets safe status view without full PII)
app.get("/api/orders/:id", (req, res) => {
  const { id } = req.params;
  if (!/^[A-Za-z0-9_-]{3,40}$/.test(id)) {
    return res.status(400).json({ error: "Identificador de pedido inválido." });
  }
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  if (getValidAdminSession(req)) {
    return res.json({ success: true, order });
  }
  const firstName = typeof order.customerName === "string"
    ? order.customerName.trim().split(/\s+/)[0] || "Cliente"
    : "Cliente";
  return res.json({
    success: true,
    order: {
      id: order.id,
      customerName: firstName,
      items: Array.isArray(order.items) ? order.items : [],
      total: order.total,
      type: order.type,
      tableNumber: order.type === "table" ? order.tableNumber : undefined,
      paymentMethod: order.paymentMethod,
      status: order.status,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      estimatedMinutes: order.estimatedMinutes
    }
  });
});

app.post("/api/orders", publicWriteRateLimiter, (req, res) => {
  const body = req.body || {};
  const customerName = typeof body.customerName === "string" ? body.customerName.trim().slice(0, 120) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : undefined;
  const items = Array.isArray(body.items) ? body.items : [];
  const total = Number(body.total);
  const type = typeof body.type === "string" && ALLOWED_ORDER_TYPES.has(body.type) ? body.type : "delivery";

  if (!customerName || items.length === 0 || items.length > 50 || !Number.isFinite(total) || total < 0 || total > 50000) {
    return res.status(400).json({ error: "Dados do pedido inválidos." });
  }

  const sanitizedItems = items.map((it: any) => ({
    name: typeof it?.name === "string" ? it.name.trim().slice(0, 120) : "Item",
    quantity: Math.max(1, Math.min(99, Math.floor(Number(it?.quantity || 1)))),
    price: Number.isFinite(Number(it?.price)) ? Math.max(0, Number(it.price)) : 0,
    crust: typeof it?.crust === "string" ? it.crust.trim().slice(0, 80) : undefined,
    notes: typeof it?.notes === "string" ? it.notes.trim().slice(0, 300) : undefined,
    extras: Array.isArray(it?.extras) ? it.extras.slice(0, 10).map((e: any) => String(e).slice(0, 60)) : undefined
  }));

  const safeId =
    typeof body.id === "string" && /^ORD-[A-Za-z0-9_-]{2,24}$/.test(body.id)
      ? body.id
      : `ORD-${Math.floor(1000 + Math.random() * 9000)}`;

  const newOrder = {
    id: safeId,
    customerName,
    phone,
    ...(email ? { email } : {}),
    items: sanitizedItems,
    total,
    type,
    ...(type === "delivery" && typeof body.address === "string" ? { address: body.address.trim().slice(0, 300) } : {}),
    ...(type === "table" && typeof body.tableNumber === "string" ? { tableNumber: body.tableNumber.trim().slice(0, 60) } : {}),
    paymentMethod: typeof body.paymentMethod === "string" ? body.paymentMethod.trim().slice(0, 40) : "Pix",
    status: "received",
    createdAt: new Date().toISOString(),
    estimatedMinutes: Number.isFinite(Number(body.estimatedMinutes))
      ? Math.max(5, Math.min(180, Math.floor(Number(body.estimatedMinutes))))
      : type === "delivery"
      ? 35
      : 20
  };

  db.orders.unshift(newOrder);
  if (db.orders.length > 2000) db.orders.pop();
  logDatabaseEvent("ORDER_CREATED", { orderId: newOrder.id, customer: newOrder.customerName, total: newOrder.total });
  saveDatabase();
  return res.status(201).json({ success: true, order: newOrder });
});

app.patch("/api/orders/:id/status", requireAdmin, (req, res) => {
  const { id } = req.params;
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (!ALLOWED_ORDER_STATUSES.has(status)) {
    return res.status(400).json({ error: "Status de pedido inválido." });
  }
  const order = db.orders.find((o) => o.id === id);
  if (!order) {
    return res.status(404).json({ error: "Pedido não encontrado" });
  }
  const oldStatus = order.status;
  order.status = status;
  order.updatedAt = new Date().toISOString();
  logDatabaseEvent("ORDER_STATUS_CHANGED", { orderId: id, from: oldStatus, to: status });
  saveDatabase();
  return res.json({ success: true, order, message: `Status do pedido atualizado para ${status}` });
});

// Reservations API
const ALLOWED_RESERVATION_STATUSES = new Set(["confirmed", "pending", "cancelled", "completed"]);

app.get("/api/reservations", requireAdmin, (_req, res) => {
  res.json({ reservations: db.reservations });
});

app.post("/api/reservations", publicWriteRateLimiter, (req, res) => {
  const body = req.body || {};
  const name = typeof body.name === "string" ? body.name.trim().slice(0, 120) : "";
  const phone = typeof body.phone === "string" ? body.phone.trim().slice(0, 30) : "";
  const email = typeof body.email === "string" ? body.email.trim().slice(0, 254) : "";
  const date = typeof body.date === "string" ? body.date.trim().slice(0, 30) : "";
  const time = typeof body.time === "string" ? body.time.trim().slice(0, 20) : "";
  const guests = Number(body.guests || 2);

  if (!name || !phone || !date || !time || !Number.isFinite(guests) || guests < 1 || guests > 50) {
    return res.status(400).json({ error: "Dados da reserva inválidos." });
  }

  const safeId =
    typeof body.id === "string" && /^RES-[A-Za-z0-9_-]{2,24}$/.test(body.id)
      ? body.id
      : `RES-${Math.floor(100 + Math.random() * 900)}`;

  const newReservation = {
    id: safeId,
    name,
    phone,
    email,
    date,
    time,
    guests: Math.floor(guests),
    area: typeof body.area === "string" ? body.area.trim().slice(0, 80) : "Jardim do Forno a Lenha",
    occasion: typeof body.occasion === "string" ? body.occasion.trim().slice(0, 80) : undefined,
    notes: typeof body.notes === "string" ? body.notes.trim().slice(0, 500) : "",
    status: "confirmed",
    createdAt: new Date().toISOString()
  };

  db.reservations.unshift(newReservation);
  if (db.reservations.length > 2000) db.reservations.pop();
  logDatabaseEvent("RESERVATION_CREATED", { resId: newReservation.id, name: newReservation.name });
  saveDatabase();
  return res.status(201).json({ success: true, reservation: newReservation });
});

app.patch("/api/reservations/:id/status", requireAdmin, (req, res) => {
  const { id } = req.params;
  const status = typeof req.body?.status === "string" ? req.body.status : "";
  if (!ALLOWED_RESERVATION_STATUSES.has(status)) {
    return res.status(400).json({ error: "Status de reserva inválido." });
  }
  const reservation = db.reservations.find((r) => r.id === id);
  if (!reservation) {
    return res.status(404).json({ error: "Reserva não encontrada" });
  }
  reservation.status = status;
  logDatabaseEvent("RESERVATION_STATUS_CHANGED", { resId: id, status });
  saveDatabase();
  return res.json({ success: true, reservation });
});

// AI Concierge Chat Route
app.post("/api/chat", publicWriteRateLimiter, async (req, res) => {
  const rawMessage = req.body?.message;
  if (typeof rawMessage !== "string" || !rawMessage.trim() || rawMessage.trim().length > 1000) {
    return res.status(400).json({ error: "Mensagem obrigatória (máximo de 1000 caracteres)." });
  }
  const message = rawMessage.trim();

  const rawHistory = Array.isArray(req.body?.history) ? req.body.history.slice(-8) : [];
  const safeHistory = rawHistory
    .filter((entry: any) => entry && typeof entry.text === "string" && entry.text.trim())
    .map((entry: any) => ({
      role: entry.role === "model" ? "model" : "user",
      parts: [{ text: String(entry.text).trim().slice(0, 500) }]
    }));

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
        config: { systemInstruction },
        contents: [
          ...safeHistory,
          { role: "user", parts: [{ text: message }] }
        ]
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
  // Always serve static assets from public/ folder with sensible cache headers
  app.use(express.static(path.join(process.cwd(), "public"), { maxAge: "1h" }));

  const distHtmlPath = path.join(process.cwd(), "dist", "index.html");
  const isProduction = process.env.NODE_ENV === "production" || fs.existsSync(distHtmlPath);

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

    const rawIndexHtmlPath = path.join(process.cwd(), "index.html");
    let cachedDevRawIndex: string | null = null;
    let cachedTransformedDevHtml: { url: string; html: string } | null = null;

    app.use("*", async (req, res, next) => {
      const url = req.originalUrl;
      if (url.startsWith("/api/")) {
        return next();
      }
      try {
        if (!cachedDevRawIndex || !isHmrDisabled) {
          cachedDevRawIndex = await fs.promises.readFile(rawIndexHtmlPath, "utf-8");
        }
        let htmlToServe: string;
        if (isHmrDisabled && cachedTransformedDevHtml && cachedTransformedDevHtml.url === "/") {
          htmlToServe = cachedTransformedDevHtml.html;
        } else {
          htmlToServe = await vite.transformIndexHtml(url, cachedDevRawIndex);
          if (isHmrDisabled && url === "/") {
            cachedTransformedDevHtml = { url: "/", html: htmlToServe };
          }
        }
        res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).end(htmlToServe);
      } catch (e) {
        if (vite.ssrFixStacktrace) {
          vite.ssrFixStacktrace(e as Error);
        }
        next(e);
      }
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    const fallbackIndexHtmlPath = path.join(process.cwd(), "index.html");
    const resolvedEntryHtml = fs.existsSync(distHtmlPath) ? distHtmlPath : fallbackIndexHtmlPath;
    const cachedProdHtml = fs.existsSync(resolvedEntryHtml)
      ? fs.readFileSync(resolvedEntryHtml, "utf-8")
      : null;

    // Explicit SPA routes (including accented, unaccented, and URL-encoded variants)
    const knownSpaRoutes = [
      "/cardapio", "/cardápio", "/card%C3%A1pio", "/card%c3%a1pio",
      "/historia", "/história", "/hist%C3%B3ria", "/hist%c3%b3ria",
      "/galeria",
      "/localizacao", "/localização", "/localiza%C3%A7%C3%A3o", "/localiza%c3%a7%c3%a3o",
      "/fale-conosco", "/contato",
      "/admin"
    ];

    const serveSpaEntry = (_req: Request, res: Response) => {
      if (cachedProdHtml) {
        return res.status(200).set({ "Content-Type": "text/html; charset=utf-8" }).send(cachedProdHtml);
      }
      return res.sendFile(resolvedEntryHtml);
    };

    knownSpaRoutes.forEach((route) => {
      app.get([route, `${route}/`], serveSpaEntry);
    });

    app.use(express.static(distPath, { redirect: false, maxAge: "1d" }));

    // Universal SPA Fallback for all other non-API URLs
    app.use((req, res, next) => {
      if (req.originalUrl.startsWith("/api/")) {
        return next();
      }
      return serveSpaEntry(req, res);
    });
  }

  // Global Express Error Handler (Never expose stack traces or raw internals)
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    if (err?.type === "entity.too.large" || err?.status === 413) {
      return res.status(413).json({ error: "Payload excede o limite permitido." });
    }
    if (err instanceof SyntaxError && (err as any)?.status === 400 && "body" in err) {
      return res.status(400).json({ error: "Formato JSON inválido na requisição." });
    }
    console.error("[Server] Unexpected route error:", err);
    if (!res.headersSent) {
      return res.status(500).json({ error: "Erro interno no servidor." });
    }
  });

  const httpServer = app.listen(PORT, "0.0.0.0", () => {
    console.log(`Deolinda Pizzaria Napoletana server running at http://0.0.0.0:${PORT}`);
  });

  // Protect sockets against slowloris / stalled connections while supporting keep-alive bursts
  httpServer.keepAliveTimeout = 65000;
  httpServer.headersTimeout = 66000;
  httpServer.requestTimeout = 30000;
}

startServer();
