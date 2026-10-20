import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini client with telemetry header
const apiKey = process.env.GEMINI_API_KEY;
const ai = apiKey
  ? new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    })
  : null;

// API routes for Gemini AI
// 1. Natural Language Search query translator
app.post('/api/gemini/search', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { query, schemaSummary } = req.body;
    const prompt = `You are an expert SQL & query translator for "VendorNest", an in-browser relational database with 10 tables:
1. PINCODE_CITY (Pincode, City)
2. VENDOR (VendorID, VendorName, Category, Street, Pincode)
3. VENDOR_CONTACT (VendorID, ContactNo)
4. PRODUCT (ProductID, ProductName, Price, VendorID)
5. GOODS (ProductID, HSNCode)
6. SERVICE (ProductID, ServiceHours)
7. PURCHASE_ORDER (OrderID, OrderDate, Status: Pending|Delivered, VendorID)
8. CONTAINS (OrderID, ProductID, Quantity)
9. PAYMENT (PaymentID, Amount, PaymentDate, Status: Paid|Pending, OrderID)
10. PAYMENT_INSTALLMENT (PaymentID, InstallmentNo, InstallmentAmount)

User Query: "${query}"

Return a valid JSON object matching this schema:
{
  "target": "vendors" | "orders" | "payments" | "products",
  "filters": [
    {
      "field": "VendorName" | "Category" | "City" | "Pincode" | "Status" | "ProductName" | "Price" | "Amount" | "OrderID" | "VendorID",
      "operator": "like" | "eq" | "gt" | "lt" | "gte" | "lte",
      "value": string | number
    }
  ],
  "sql": "A syntactically valid SQL SELECT query that reflects the user intent",
  "explanation": "A one-sentence plain English explanation of how the search is interpreted"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Gemini Search error:', err);
    return res.status(500).json({ error: err.message || 'AI search error' });
  }
});

// 2. Procurement Insights
app.post('/api/gemini/procurement-insights', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { summary } = req.body;
    const prompt = `You are a Senior Procurement Analyst evaluating current vendor management metrics in VendorNest.
Current database state summary:
${JSON.stringify(summary, null, 2)}

Provide concise, highly realistic procurement insights.
Format strictly as JSON:
{
  "insights": [
    "Insight 1 (concise, highlighting vendor distribution, bottlenecks, or costs)",
    "Insight 2 (highlighting pending orders, delivered ratios, or payment schedules)",
    "Insight 3 (highlighting category concentration or cash flow outstanding)"
  ],
  "recommendation": "One specific, high-priority procurement action to take immediately."
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.3,
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Procurement insights error:', err);
    return res.status(500).json({ error: err.message || 'AI insight error' });
  }
});

// 3. Draft Payment Reminder
app.post('/api/gemini/draft-reminder', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { vendorName, orderId, amount, remainingBalance, paymentDate, installmentsCount } = req.body;
    const prompt = `Draft a polite, professional, concise email payment reminder to vendor "${vendorName}".
Context:
- Order Reference: ${orderId}
- Total Billed: ₹${amount}
- Outstanding Balance: ₹${remainingBalance}
- Payment Record Date: ${paymentDate}
- Installments Recorded: ${installmentsCount}

Rules:
- Keep it under 100 words.
- Professional, respectful, clear about the reference numbers and outstanding dues.
- Include a subject line and body.

Respond with JSON:
{
  "subject": "Email subject line",
  "body": "Email body content"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.4,
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Draft reminder error:', err);
    return res.status(500).json({ error: err.message || 'AI reminder error' });
  }
});

// 4. Smart Product Helper
app.post('/api/gemini/suggest-product', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { productName, vendorCategory } = req.body;
    const prompt = `For the product/service named "${productName}" under vendor category "${vendorCategory}":
Determine if this is "Goods" or "Service" (disjoint specialization).
If Goods: provide a realistic 4-8 digit Indian GST HSN code (e.g. 8471, 4802, 8544, etc.) and brief description.
If Service: provide typical service hours (positive number) and SAC service code.

Return JSON:
{
  "type": "Goods" | "Service",
  "hsnCode": string (e.g. "84713010" or "" if service),
  "serviceHours": number (e.g. 24 or 0 if goods),
  "estimatedPrice": number,
  "confidenceReason": string
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Suggest product error:', err);
    return res.status(500).json({ error: err.message || 'AI product helper error' });
  }
});

// 5. Ask VendorNest QA Assistant
app.post('/api/gemini/ask-vendornest', async (req, res) => {
  if (!ai) {
    return res.status(503).json({ error: 'Gemini API key is not configured.' });
  }

  try {
    const { question, databaseSnapshot } = req.body;
    const prompt = `You are "VendorNest AI Assistant", an accurate database intelligence bot for VendorNest.
Below is the accurate live snapshot of the relational database:
${JSON.stringify(databaseSnapshot, null, 2)}

User question: "${question}"

Strict Rules:
1. Answer strictly based on the provided database snapshot.
2. If data is not present or cannot be determined, say so clearly. NEVER make up figures or vendors.
3. Be concise (2-4 sentences max), clear, and professional.
4. Mention exact IDs or names (e.g. V01, PO002, ₹45,000) where relevant.

Format JSON:
{
  "answer": "Your concise response here",
  "relatedSql": "SELECT ... relevant query or empty string"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        temperature: 0.2,
      },
    });

    const text = response.text || '{}';
    return res.json(JSON.parse(text));
  } catch (err: any) {
    console.error('Ask VendorNest error:', err);
    return res.status(500).json({ error: err.message || 'AI assistant error' });
  }
});

// Set up Vite in development or serve static in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`VendorNest server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
