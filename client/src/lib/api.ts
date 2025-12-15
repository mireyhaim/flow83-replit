import type { Journey, InsertJourney, JourneyStep, InsertJourneyStep, JourneyBlock, InsertJourneyBlock } from "@shared/schema";

const API_BASE = "/api";

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    throw new Error(error.error || "Request failed");
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const journeyApi = {
  getAll: async (): Promise<Journey[]> => {
    const res = await fetch(`${API_BASE}/journeys`);
    return handleResponse(res);
  },

  getById: async (id: string): Promise<Journey> => {
    const res = await fetch(`${API_BASE}/journeys/${id}`);
    return handleResponse(res);
  },

  getFull: async (id: string): Promise<Journey & { steps: (JourneyStep & { blocks: JourneyBlock[] })[] }> => {
    const res = await fetch(`${API_BASE}/journeys/${id}/full`);
    return handleResponse(res);
  },

  create: async (data: InsertJourney): Promise<Journey> => {
    const res = await fetch(`${API_BASE}/journeys`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: string, data: Partial<InsertJourney>): Promise<Journey> => {
    const res = await fetch(`${API_BASE}/journeys/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/journeys/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },
};

export const stepApi = {
  getByJourney: async (journeyId: string): Promise<JourneyStep[]> => {
    const res = await fetch(`${API_BASE}/journeys/${journeyId}/steps`);
    return handleResponse(res);
  },

  create: async (journeyId: string, data: Omit<InsertJourneyStep, "journeyId">): Promise<JourneyStep> => {
    const res = await fetch(`${API_BASE}/journeys/${journeyId}/steps`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: string, data: Partial<InsertJourneyStep>): Promise<JourneyStep> => {
    const res = await fetch(`${API_BASE}/steps/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/steps/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },
};

export const blockApi = {
  getByStep: async (stepId: string): Promise<JourneyBlock[]> => {
    const res = await fetch(`${API_BASE}/steps/${stepId}/blocks`);
    return handleResponse(res);
  },

  create: async (stepId: string, data: Omit<InsertJourneyBlock, "stepId">): Promise<JourneyBlock> => {
    const res = await fetch(`${API_BASE}/steps/${stepId}/blocks`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  update: async (id: string, data: Partial<InsertJourneyBlock>): Promise<JourneyBlock> => {
    const res = await fetch(`${API_BASE}/blocks/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return handleResponse(res);
  },

  delete: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE}/blocks/${id}`, { method: "DELETE" });
    return handleResponse(res);
  },
};
