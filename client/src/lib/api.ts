import type { Journey, InsertJourney, JourneyStep, InsertJourneyStep, JourneyBlock, InsertJourneyBlock, JourneyMessage, ActivityEvent, Participant, User } from "@shared/schema";

const API_BASE = "/api";

export interface DashboardStats {
  totalJourneys: number;
  publishedJourneys: number;
  draftJourneys: number;
  totalParticipants: number;
  activeParticipants: number;
  completedParticipants: number;
  completionRate: number;
}

export interface InactiveParticipant extends Participant {
  journey: Journey;
  user: User;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Request failed" }));
    const message = error.error || error.message || "Request failed";
    throw new Error(`${response.status}: ${message}`);
  }
  if (response.status === 204) return undefined as T;
  return response.json();
}

export const journeyApi = {
  getAll: async (): Promise<Journey[]> => {
    const res = await fetch(`${API_BASE}/journeys`);
    return handleResponse(res);
  },

  getMy: async (): Promise<Journey[]> => {
    const res = await fetch(`${API_BASE}/journeys/my`);
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

  generateContent: async (id: string, content: string): Promise<{ success: boolean; daysGenerated: number }> => {
    const res = await fetch(`${API_BASE}/journeys/${id}/generate-content`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },

  autoGenerate: async (id: string): Promise<{ success: boolean; stepsExist: boolean; steps: JourneyStep[] }> => {
    const res = await fetch(`${API_BASE}/journeys/${id}/auto-generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    return handleResponse(res);
  },

  generateContentWithProgress: (
    id: string, 
    content: string,
    onProgress: (progress: number, message: string) => void
  ): Promise<{ success: boolean; daysGenerated: number }> => {
    return new Promise((resolve, reject) => {
      fetch(`${API_BASE}/journeys/${id}/generate-content`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "text/event-stream"
        },
        body: JSON.stringify({ content }),
      }).then(async response => {
        if (!response.ok) {
          reject(new Error("Failed to generate content"));
          return;
        }
        
        const contentType = response.headers.get("Content-Type") || "";
        if (!contentType.includes("text/event-stream")) {
          try {
            const data = await response.json();
            if (data.success) {
              resolve({ success: true, daysGenerated: data.daysGenerated });
            } else {
              reject(new Error(data.error || "Generation failed"));
            }
          } catch (e) {
            reject(new Error("Failed to parse response"));
          }
          return;
        }
        
        const reader = response.body?.getReader();
        if (!reader) {
          reject(new Error("No response body"));
          return;
        }
        
        const decoder = new TextDecoder();
        
        const processStream = async () => {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            
            const text = decoder.decode(value);
            const lines = text.split("\n");
            
            for (const line of lines) {
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.error) {
                    reject(new Error(data.error));
                    return;
                  }
                  if (data.progress !== undefined) {
                    onProgress(data.progress, data.message || "");
                  }
                  if (data.success) {
                    resolve({ success: true, daysGenerated: data.daysGenerated });
                    return;
                  }
                } catch (e) {
                  // Ignore parse errors for incomplete chunks
                }
              }
            }
          }
        };
        
        processStream().catch(reject);
      }).catch(reject);
    });
  },
};

export const fileApi = {
  parseFiles: async (files: File[]): Promise<{ text: string }> => {
    const formData = new FormData();
    files.forEach(file => formData.append("files", file));
    const res = await fetch(`${API_BASE}/parse-files`, {
      method: "POST",
      body: formData,
    });
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

export const statsApi = {
  getDashboard: async (): Promise<DashboardStats> => {
    const res = await fetch(`${API_BASE}/stats/dashboard`);
    return handleResponse(res);
  },
};

export const activityApi = {
  getRecent: async (): Promise<ActivityEvent[]> => {
    const res = await fetch(`${API_BASE}/activity/recent`);
    return handleResponse(res);
  },
};

export const participantsApi = {
  getInactive: async (days: number = 3): Promise<InactiveParticipant[]> => {
    const res = await fetch(`${API_BASE}/participants/inactive?days=${days}`);
    return handleResponse(res);
  },
};

export const chatApi = {
  getMessages: async (participantId: string, stepId: string): Promise<JourneyMessage[]> => {
    const res = await fetch(`${API_BASE}/participants/${participantId}/steps/${stepId}/messages`);
    return handleResponse(res);
  },

  startDay: async (participantId: string, stepId: string): Promise<JourneyMessage[]> => {
    const res = await fetch(`${API_BASE}/participants/${participantId}/steps/${stepId}/start-day`, {
      method: "POST",
    });
    return handleResponse(res);
  },

  sendMessage: async (participantId: string, stepId: string, content: string): Promise<{ userMessage: JourneyMessage; botMessage: JourneyMessage }> => {
    const res = await fetch(`${API_BASE}/participants/${participantId}/steps/${stepId}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });
    return handleResponse(res);
  },
};
