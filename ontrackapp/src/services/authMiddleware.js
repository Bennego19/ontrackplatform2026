const API_BASE_URL = "";

/* =========================
   TOKEN MANAGER
========================= */

export const tokenManager = {
  getToken: () => {
    try {
      return localStorage.getItem("authToken");
    } catch {
      return null;
    }
  },

  setToken: (token) => {
    try {
      localStorage.setItem("authToken", token);
    } catch {}
  },

  removeToken: () => {
    try {
      localStorage.removeItem("authToken");
    } catch {}
  },

  getStoredUser: () => {
    try {
      const user = localStorage.getItem("user");
      return user ? JSON.parse(user) : null;
    } catch {
      return null;
    }
  },

  setStoredUser: (user) => {
    try {
      localStorage.setItem("user", JSON.stringify(user));
    } catch {}
  },

  removeStoredUser: () => {
    try {
      localStorage.removeItem("user");
    } catch {}
  },

  clearAuth: () => {
    try {
      localStorage.removeItem("authToken");
      localStorage.removeItem("user");
    } catch {}
  },

  isAuthenticated: () => {
    try {
      return !!(
        localStorage.getItem("authToken") &&
        localStorage.getItem("user")
      );
    } catch {
      return false;
    }
  }
};

/* =========================
   AUTH API (STUDENTS)
========================= */

const authFetch = async (endpoint, options = {}) => {
  const token = tokenManager.getToken();
  if (!token) throw new Error("No authentication token");

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  const data = await response.json();

  if (!response.ok) {
    if (response.status === 403 && data.accessDenied) {
      tokenManager.clearAuth();
    }
    throw new Error(data.message || "Request failed");
  }

  return data;
};

export const authAPI = {
  /* ---------- AUTH ---------- */
  login: async (username, password) => {
    // Clear any existing authentication data for secure login
    tokenManager.clearAuth();

    // Send ONLY username, not email
    const payload = { username, password };

    const response = await fetch(
      `/api/onboardstudents/login`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Login failed");
    }

    // Store token and user data
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setStoredUser(data.user);
    }

    return data;
  },

  adminLogin: async (username, password) => {
    // Clear any existing authentication data for secure login
    tokenManager.clearAuth();

    const payload = { username, password };

    const response = await fetch(
      `/api/adminlogin/adminlogin`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || "Admin login failed");
    }

    // Store token and user data
    if (data.token) {
      tokenManager.setToken(data.token);
      tokenManager.setStoredUser(data.user);
    }

    return data;
  },

  // Verify token by calling backend /api/adminlogin/verify; falls back to local decode if server unreachable
  verifyToken: async () => {
    try {
      const token = tokenManager.getToken();
      if (!token) return { success: false, message: 'No token' };

      // Call backend verify endpoint
      const resp = await fetch(`/api/adminlogin/verify`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        return { success: false, message: errData.message || 'Server verification failed' };
      }

      const data = await resp.json();
      if (data && data.success) {
        // Update stored user if returned
        if (data.user) tokenManager.setStoredUser(data.user);
        return { success: true, user: data.user };
      }

      return { success: false, message: 'Invalid token' };
    } catch (err) {
      // Fallback: attempt local decode (useful during development or when server unreachable)
      try {
        const token = tokenManager.getToken();
        if (!token) return { success: false, message: 'No token' };
        const parts = token.split('.');
        if (parts.length !== 3) return { success: false, message: 'Invalid token format' };
        const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
        if (payload.exp && typeof payload.exp === 'number') {
          const now = Math.floor(Date.now() / 1000);
          if (payload.exp < now) {
            tokenManager.clearAuth();
            return { success: false, message: 'Token expired' };
          }
        }
        const storedUser = tokenManager.getStoredUser();
        return { success: true, user: storedUser || payload };
      } catch (e) {
        tokenManager.clearAuth();
        return { success: false, message: 'Token verification failed' };
      }
    }
  },

  getProfile: () => authFetch("/api/onboardstudents/profile"),

  logout: () => {
    tokenManager.clearAuth();
  },

  /* ---------- USER CONTENT ---------- */

  getUserTasks: () => authFetch("/api/assessments/tasks"),

  getUserModules: () => authFetch("/api/assessments/modules"),

  getUserAssignments: () => authFetch("/api/assessments/assignments"),

  getUserProjects: () => authFetch("/api/assessments/projects"),

  getUserResources: () => authFetch("/api/assessments/resources"),

  getUserAssessments: () => authFetch("/api/assessments"),

  /* ---------- MENTOR ---------- */

  getStudentMentor: () =>
    authFetch("/api/mentorstudentassignment/student"),

  getAllMentors: async () => {
    const response = await fetch("/api/onboardmentors");

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Failed to fetch mentors");
    }

    return data;
  },

  /* ---------- HELP REQUESTS ---------- */

  getHelpRequests: () => authFetch("/api/help-requests"),

  createHelpRequest: (helpRequestData) =>
    authFetch("/api/help-requests", {
      method: "POST",
      body: JSON.stringify(helpRequestData)
    })
};
