const {onRequest} = require("firebase-functions/v2/https");
const {getFirestore} = require("firebase-admin/firestore");
const {initializeApp} = require("firebase-admin/app");
const {v4: uuidv4} = require("uuid");
const cors = require("cors")({origin: true});
require("dotenv").config();

initializeApp();

const REQUIRED_HEADERS = ["x-api-key", "x-user-id", "x-password"];
function checkAuth(req) {
  return (
    req.get("x-api-key") === process.env.SECRET_TOKEN_ID &&
    req.get("x-user-id") === process.env.SECRET_USER_ID &&
    req.get("x-password") === process.env.SECRET_PASSWORD_ID
  );
}

function isoNow() {
  return new Date().toISOString();
}
function maskCard(num) {
  const digits = String(num).replace(/\s/g, "");
  return "**** **** **** " + digits.slice(-4);
}
function maskAccount(acc) {
  const s = String(acc);
  return "****" + s.slice(-4);
}
function ensureArrayField(obj, field) {
  const value = obj[field];
  if (!value) return;
  if (Array.isArray(value)) return;
  obj[field] = [value];
}

function validateCARD(body) {
  ensureArrayField(body, "cards");
  const cards = body.cards;
  if (!Array.isArray(cards) || cards.length === 0) return "cards must be a non-empty array";
  const c = cards[0];
  if (!c || !c.number || !c.month || !c.year || !c.ccv) return "cards[0] requires number, month, year, ccv";
  if (!/^\d{2}$/.test(c.month) || Number(c.month) < 1 || Number(c.month) > 12) return "invalid month";
  if (!/^\d{4}$/.test(c.year)) return "invalid year";
  if (!/^\d{3,4}$/.test(c.ccv)) return "invalid ccv";
  return null;
}

function validateDEPOSITS(body) {
  const deposit = body.deposit;
  if (!Array.isArray(deposit) || deposit.length === 0) return "deposit must be a non-empty array";
  const d = deposit[0];
  if (!d || !d.account || !d.type) return "deposit[0] requires account and type";
  if (!/^\d{6,20}$/.test(String(d.account))) return "invalid account format";
  return null;
}

function validateALECREDITS(body) {
  const alecredits = body.alecredits;
  if (!Array.isArray(alecredits) || alecredits.length === 0) return "alecredits must be a non-empty array";
  const a = alecredits[0];
  if (a && a.goal && ["SELL", "BUY"].indexOf(a.goal) === -1) return "alecredits[0].goal must be SELL or BUY";
  if (a && a.total_credit != null && isNaN(Number(a.total_credit))) return "total_credit must be numeric";
  return null;
}

function buildByType(type, body) {
  if (type === "CARD") {
    const c0 = body.cards[0];
    return {card: {numberMasked: maskCard(c0.number), month: c0.month, year: c0.year}};
  }
  if (type === "DEPOSITS") {
    const d0 = body.deposit[0];
    return {deposit: [{accountMasked: maskAccount(d0.account), type: d0.type}]};
  }
  if (type === "ALECREDITS") {
    const a0 = body.alecredits[0];
    let dateISO = a0.date_solicitud;
    if (a0 && typeof a0.date_solicitud === "string" && /^\d{2}\/\d{2}\/\d{4}$/.test(a0.date_solicitud)) {
      const parts = a0.date_solicitud.split("/");
      const dd = parts[0]; const mm = parts[1]; const yyyy = parts[2];
      dateISO = new Date(yyyy + "-" + mm + "-" + dd + "T00:00:00Z").toISOString();
    }
    const hireFlag = a0 ? a0["want_you_hire_please?"] : false;
    return {alecredits: [{total_credit: a0 && a0.total_credit != null ? Number(a0.total_credit) : undefined, goal: a0 ? a0.goal : undefined, date_solicitud: dateISO, want_you_hire_please: Boolean(hireFlag)}]};
  }
  return {};
}

exports.saveTransaction = onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      for (let i = 0; i < REQUIRED_HEADERS.length; i++) {
        const h = REQUIRED_HEADERS[i];
        if (!req.get(h)) return res.status(400).json({message: "Missing auth headers"});
      }
      if (!checkAuth(req)) return res.status(403).json({message: "Unauthorized"});
      if (req.method !== "POST" || !req.body) return res.status(400).json({message: "Invalid request"});

      const userName = req.body.userName;
      const status = req.body.status;
      const type = req.body.type ? String(req.body.type) : "CARD";
      const amount = req.body.amount;

      const validators = {CARD: validateCARD, DEPOSITS: validateDEPOSITS, ALECREDITS: validateALECREDITS};
      const validate = validators[type];
      if (!validate) return res.status(400).json({message: "Unsupported type: " + type});
      const err = validate(req.body);
      if (err) return res.status(400).json({message: err});

      const txn = {id: uuidv4(), userName: userName || "user_" + Math.floor(Math.random() * 1000), status: status || "PENDING", createdAt: isoNow(), type: type};

      if (amount && typeof amount === "object") {
        const aVal = Number(amount.amount);
        const curr = amount.currency || "COP";
        if (!Number.isNaN(aVal)) txn.amount = {amount: aVal, currency: curr};
      }

      Object.assign(txn, buildByType(type, req.body));

      const result = await getFirestore().collection("transaction-automation-k6-test").add(txn);
      return res.status(200).json({message: "Transaction saved", id: result.id, data: txn});
    } catch (e) {
      return res.status(500).json({message: "Internal server error"});
    }
  });
});
