// Client-side AI service interfacing with server-side Gemini endpoints

export interface AiSearchFilter {
  field: string;
  operator: 'like' | 'eq' | 'gt' | 'lt' | 'gte' | 'lte';
  value: string | number;
}

export interface AiSearchResult {
  target: 'vendors' | 'orders' | 'payments' | 'products';
  filters: AiSearchFilter[];
  sql: string;
  explanation: string;
}

export interface ProcurementInsightResponse {
  insights: string[];
  recommendation: string;
}

export interface PaymentReminderResponse {
  subject: string;
  body: string;
}

export interface ProductSuggestionResponse {
  type: 'Goods' | 'Service';
  hsnCode?: string;
  serviceHours?: number;
  estimatedPrice?: number;
  confidenceReason?: string;
}

export interface AskAssistantResponse {
  answer: string;
  relatedSql?: string;
}

async function fetchWithTimeout(url: string, options: RequestInit, timeoutMs = 15000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

export async function queryAiSearch(query: string): Promise<AiSearchResult | null> {
  try {
    const res = await fetchWithTimeout('/api/gemini/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!res.ok) {
      throw new Error(`AI search HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('AI search unavailable, falling back:', err);
    return null;
  }
}

export async function fetchProcurementInsights(summary: any): Promise<ProcurementInsightResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/gemini/procurement-insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ summary }),
    });

    if (!res.ok) {
      throw new Error(`Insights HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('AI procurement insights unavailable:', err);
    return null;
  }
}

export async function draftPaymentReminder(payload: {
  vendorName: string;
  orderId: string;
  amount: number;
  remainingBalance: number;
  paymentDate: string;
  installmentsCount: number;
}): Promise<PaymentReminderResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/gemini/draft-reminder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Draft reminder HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Draft reminder AI unavailable:', err);
    return null;
  }
}

export async function suggestProductDetails(
  productName: string,
  vendorCategory: string
): Promise<ProductSuggestionResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/gemini/suggest-product', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productName, vendorCategory }),
    });

    if (!res.ok) {
      throw new Error(`Product suggest HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Product suggestion AI unavailable:', err);
    return null;
  }
}

export async function askVendorNest(
  question: string,
  databaseSnapshot: any
): Promise<AskAssistantResponse | null> {
  try {
    const res = await fetchWithTimeout('/api/gemini/ask-vendornest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question, databaseSnapshot }),
    });

    if (!res.ok) {
      throw new Error(`Ask Assistant HTTP ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Ask VendorNest AI unavailable:', err);
    return null;
  }
}
