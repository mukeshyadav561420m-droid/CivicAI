const API_BASE_URL = "http://127.0.0.1:8001";

export const getToken = () => {
  return localStorage.getItem("civicai_token");
};

export const setToken = (token) => {
  localStorage.setItem("civicai_token", token);
};

export const removeToken = () => {
  localStorage.removeItem("civicai_token");
  localStorage.removeItem("civicai_user");
};

export const getCurrentUserStored = () => {
  const user = localStorage.getItem("civicai_user");
  return user ? JSON.parse(user) : null;
};

export const setCurrentUserStored = (user) => {
  localStorage.setItem("civicai_user", JSON.stringify(user));
};

export const getAuthHeaders = () => {
  const token = getToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const loginUser = async (email, password) => {
  const response = await fetch(`${API_BASE_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Login failed");
  }

  setToken(data.access_token);
  setCurrentUserStored({
    id: data.user_id,
    name: data.name,
    email: data.email,
    role: data.role,
    department: data.department
  });

  return data;
};

export const registerUser = async (userData) => {
  const response = await fetch(`${API_BASE_URL}/users/register`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(userData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Registration failed");
  }

  return data;
};

export const getComplaints = async (filters = {}) => {
  const query = new URLSearchParams();
  if (filters.status && filters.status !== "all") query.append("status", filters.status);
  if (filters.issue_type && filters.issue_type !== "all") query.append("issue_type", filters.issue_type);
  if (filters.search) query.append("search", filters.search);

  const url = `${API_BASE_URL}/complaints/${query.toString() ? `?${query.toString()}` : ""}`;
  const response = await fetch(url, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch complaints");
  }

  return data;
};

export const getComplaintById = async (id) => {
  const response = await fetch(`${API_BASE_URL}/complaints/${id}`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch complaint details");
  }

  return data;
};

export const createComplaint = async (complaint) => {
  const response = await fetch(`${API_BASE_URL}/complaints/`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify(complaint),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to create complaint");
  }

  return data;
};

export const updateComplaintStatus = async (complaintId, status, notes = "") => {
  const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/status`, {
    method: "PATCH",
    headers: getAuthHeaders(),
    body: JSON.stringify({ status, notes }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update complaint status");
  }

  return data;
};

export const submitComplaintFeedback = async (complaintId, rating, feedback) => {
  const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/feedback`, {
    method: "POST",
    headers: getAuthHeaders(),
    body: JSON.stringify({ rating, feedback }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to submit feedback");
  }

  return data;
};

export const getComplaintHistory = async (complaintId) => {
  const response = await fetch(`${API_BASE_URL}/complaints/${complaintId}/history`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch complaint history");
  }

  return data;
};

export const analyzeIssueAI = async (analysisData) => {
  const response = await fetch(`${API_BASE_URL}/ai/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(analysisData),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "AI analysis failed");
  }

  return data;
};

export const getOfficers = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/officers`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch officers");
  }

  return data;
};

export const assignComplaint = async (complaintId, officerId) => {
  const response = await fetch(
    `${API_BASE_URL}/admin/complaints/${complaintId}/assign?officer_id=${officerId}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to assign complaint");
  }

  return data;
};

export const getAdminDashboard = async () => {
  const response = await fetch(`${API_BASE_URL}/admin/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch admin dashboard");
  }

  return data;
};

export const getOfficerDashboard = async () => {
  const response = await fetch(`${API_BASE_URL}/officer/dashboard`, {
    method: "GET",
    headers: getAuthHeaders(),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to fetch officer dashboard");
  }

  return data;
};

export const updateOfficerComplaintStatus = async (complaintId, newStatus, notes = "") => {
  const query = new URLSearchParams({ new_status: newStatus });
  if (notes) query.append("notes", notes);

  const response = await fetch(
    `${API_BASE_URL}/officer/complaints/${complaintId}/status?${query.toString()}`,
    {
      method: "PATCH",
      headers: getAuthHeaders(),
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.detail || "Failed to update complaint status");
  }

  return data;
};