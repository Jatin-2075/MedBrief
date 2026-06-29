export const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

type HttpRequest = "POST" | "GET" | "DELETE" | "PUT" | "PATCH";

let isRefreshing = false;
let refreshQueue: Array<{
    resolve: (success: boolean) => void;
}> = [];

const processQueue = (success: boolean) => {
    refreshQueue.forEach((p) => p.resolve(success));
    refreshQueue = [];
};

async function refreshToken(): Promise<boolean> {
    const refresh = localStorage.getItem("refresh");
    if (!refresh) return false;

    try {
        const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ refresh_token: refresh }),
        });

        if (!res.ok) return false;

        const data = await res.json();
        localStorage.setItem("access", data.access_token);
        if (data.refresh_token) localStorage.setItem("refresh", data.refresh_token);
        return true;
    } catch {
        return false;
    }
}

function forceLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    if (!window.location.pathname.includes("/login")) {
        window.location.href = "/login";
    }
}

export async function API<T = any>(
    method: HttpRequest,
    url: string,
    data?: unknown
): Promise<T> {
    const makeRequest = async (): Promise<Response> => {
        const access = localStorage.getItem("access");
        const isFormData = data instanceof FormData;

        return fetch(`${API_BASE_URL}${url}`, {
            method,
            headers: {
                ...(isFormData ? {} : { "Content-Type": "application/json" }),
                ...(access ? { Authorization: `Bearer ${access}` } : {}),
            },
            ...(method !== "GET" && data
                ? { body: isFormData ? data : JSON.stringify(data) }
                : {}),
        });
    };

    let res = await makeRequest();

    if (res.status === 401) {
        if (isRefreshing) {
            const success = await new Promise<boolean>((resolve) => {
                refreshQueue.push({ resolve });
            });
            if (!success) {
                forceLogout();
                throw new Error("Session expired");
            }
            res = await makeRequest();
        } else {
            isRefreshing = true;
            const refreshed = await refreshToken();
            isRefreshing = false;
            processQueue(refreshed);

            if (!refreshed) {
                forceLogout();
                throw new Error("Session expired");
            }
            res = await makeRequest();
        }
    }

    if (!res.ok) {
        if (res.status === 429) {
            throw new Error("Rate limit exceeded. Please wait a moment before sending another message.");
        }
        const errorBody = await res.json().catch(() => null);
        throw new Error(errorBody?.detail || `API Error ${res.status}`);
    }

    return res.json();
}