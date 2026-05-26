const BASE_URL = import.meta.env.VITE_API_BASE || "http://localhost:8000";

const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || response.statusText);
  }
  return response.json();
};

const authHeaders = (token?: string) => {
  return token
    ? {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      }
    : { "Content-Type": "application/json" };
};

export const MedBriefAPI = {
  async login(username: string, password: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ username, password }),
      })
    );
  },

  async register(username: string, email: string, password: string, role: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/auth/signup`, {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({ username, email, password, role: role.toLowerCase() }),
      })
    );
  },

  async me(token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/auth/me`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async getProfileByUserId(userId: string, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/personal/profiles/user/${userId}`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async updateProfile(profileId: string, profileData: object, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/personal/profiles/${profileId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(profileData),
      })
    );
  },

  async getDoctors(token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/personal/doctors`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async getHealthReports(token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/reports/mydataall`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async uploadHealthReport(file: File, token: string, patient_id?: string) {
    const formData = new FormData();
    formData.append("file", file);
    const url = new URL(`${BASE_URL}/reports/upload`);
    if (patient_id) {
      url.searchParams.set("patient_id", patient_id);
    }
    return handleResponse(
      await fetch(url.toString(), {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      })
    );
  },

  async getPrescriptions(profileId: string, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/prescriptions/history/${profileId}`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async getAppointments(profileId: string, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/system/appointments?profile_id=${profileId}`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async bookAppointment(payload: object, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/system/appointments`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  async sendChatMessage(payload: object, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/system/chat`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },

  async getChatMessages(userId: string, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/system/chat/user/${userId}`, {
        method: "GET",
        headers: authHeaders(token),
      })
    );
  },

  async createPrescription(payload: object, token: string) {
    return handleResponse(
      await fetch(`${BASE_URL}/prescriptions/uploadprescription`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(payload),
      })
    );
  },
};
