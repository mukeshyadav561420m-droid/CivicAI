import { useEffect, useState } from "react";
import "./App.css";
import {
  loginUser,
  registerUser,
  getComplaints,
  createComplaint,
  removeToken,
  getToken,
  getCurrentUserStored,
  getOfficers,
  assignComplaint,
  getAdminDashboard,
  getOfficerDashboard,
  updateOfficerComplaintStatus,
  getComplaintHistory,
  analyzeIssueAI
} from "./api";
import CivicMap from "./components/CivicMap";
import ComplaintDetailModal from "./components/ComplaintDetailModal";
import AdminAnalyticsView from "./components/AdminAnalyticsView";

function App() {
  // Navigation & User State
  const [activeTab, setActiveTab] = useState("dashboard");
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);

  // Auth Form State
  const [authMode, setAuthMode] = useState("login"); // "login" or "register"
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [regName, setRegName] = useState("");
  const [regRole, setRegRole] = useState("citizen");
  const [regDept, setRegDept] = useState("");
  const [loginError, setLoginError] = useState("");
  const [authSuccessMsg, setAuthSuccessMsg] = useState("");

  // Data States
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [officers, setOfficers] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [officerData, setOfficerData] = useState({ complaints: [], stats: {} });
  const [loadingData, setLoadingData] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "map"

  // Selected Complaint for Modal
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [complaintHistory, setComplaintHistory] = useState([]);

  // Report Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [issueType, setIssueType] = useState("water");
  const [severity, setSeverity] = useState("medium");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState(26.8467);
  const [longitude, setLongitude] = useState(80.9462);
  const [photoUrl, setPhotoUrl] = useState("");
  const [pickedLocation, setPickedLocation] = useState({ lat: 26.8467, lng: 80.9462 });
  const [reportSubmitting, setReportSubmitting] = useState(false);
  const [reportSuccess, setReportSuccess] = useState("");
  const [reportError, setReportError] = useState("");

  // Live AI Triage State
  const [aiTriage, setAiTriage] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState([]);

  // Officer Resolution Action State
  const [resolutionModalComplaint, setResolutionModalComplaint] = useState(null);
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [updatingStatusId, setUpdatingStatusId] = useState(null);

  // Admin Assignment State
  const [selectedOfficers, setSelectedOfficers] = useState({});
  const [toastMessage, setToastMessage] = useState("");

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 4500);
  };

  // Restore session
  useEffect(() => {
    const token = getToken();
    const stored = getCurrentUserStored();
    if (token && stored) {
      setIsLoggedIn(true);
      setCurrentUser(stored);
    }
  }, []);

  const handleLogout = () => {
    removeToken();
    setIsLoggedIn(false);
    setCurrentUser(null);
    setActiveTab("dashboard");
  };

  // Demo Login Helper
  const handleQuickLogin = (demoEmail, demoPass) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    handleDirectLogin(demoEmail, demoPass);
  };

  const handleDirectLogin = async (loginEmail, loginPass) => {
    setLoginError("");
    try {
      const data = await loginUser(loginEmail, loginPass);
      setCurrentUser({
        id: data.user_id,
        name: data.name,
        email: data.email,
        role: data.role,
        department: data.department
      });
      setIsLoggedIn(true);
      showToast(`Welcome back, ${data.name}! Signed in as ${data.role.toUpperCase()}.`);
    } catch (err) {
      setLoginError(err.message);
    }
  };

  const handleAuthSubmit = async (e) => {
    e.preventDefault();
    setLoginError("");
    setAuthSuccessMsg("");

    if (authMode === "login") {
      await handleDirectLogin(email, password);
    } else {
      try {
        await registerUser({
          name: regName,
          email,
          password,
          role: regRole,
          department: regDept || (regRole === "officer" ? "Field Operations" : null)
        });
        setAuthSuccessMsg("Account registered successfully! Logging you in...");
        setTimeout(() => {
          handleDirectLogin(email, password);
        }, 800);
      } catch (err) {
        setLoginError(err.message);
      }
    }
  };

  // Load Main Data
  const refreshAllData = async () => {
    if (!isLoggedIn) return;
    setLoadingData(true);
    try {
      const compData = await getComplaints({
        status: filterStatus,
        issue_type: filterCategory,
        search: searchQuery
      });
      setComplaints(compData);

      if (currentUser?.role === "admin") {
        const adminDash = await getAdminDashboard();
        setAdminStats(adminDash.statistics);
        setOfficers(adminDash.officers || []);
      }

      if (currentUser?.role === "officer") {
        const offDash = await getOfficerDashboard();
        setOfficerData({
          complaints: offDash.complaints || [],
          stats: offDash.stats || {}
        });
      }
    } catch (err) {
      console.error("Error refreshing data:", err);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    refreshAllData();
  }, [isLoggedIn, currentUser?.role, filterStatus, filterCategory, searchQuery]);

  // Live AI Triage Debounce when typing complaint
  useEffect(() => {
    if (!title || title.trim().length < 4) {
      setAiTriage(null);
      setDuplicateWarning([]);
      return;
    }

    const timer = setTimeout(async () => {
      setAiLoading(true);
      try {
        const result = await analyzeIssueAI({
          title,
          description,
          issue_type: issueType,
          latitude: pickedLocation.lat,
          longitude: pickedLocation.lng
        });
        setAiTriage(result.analysis);
        setDuplicateWarning(result.potential_duplicates || []);

        if (result.analysis?.category) {
          setIssueType(result.analysis.category);
        }
        if (result.analysis?.severity) {
          setSeverity(result.analysis.severity);
        }
      } catch (err) {
        console.error("AI triage error:", err);
      } finally {
        setAiLoading(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [title, description, pickedLocation]);

  // Handle Location Pick on Map
  const handleMapLocationSelect = (loc) => {
    setPickedLocation(loc);
    setLatitude(loc.lat);
    setLongitude(loc.lng);
    setAddress(`Civic Zone (${loc.lat.toFixed(4)}, ${loc.lng.toFixed(4)})`);
  };

  // Submit Complaint
  const handleComplaintSubmit = async (e) => {
    e.preventDefault();
    setReportSubmitting(true);
    setReportError("");
    setReportSuccess("");

    try {
      const payload = {
        title,
        description,
        issue_type: issueType,
        severity,
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        address: address || `Zone Coordinates (${latitude}, ${longitude})`,
        image_url: photoUrl || null
      };

      const created = await createComplaint(payload);
      showToast(`Complaint #${created.id} submitted! AI classified under ${created.ai_department || 'Municipal triage'}.`);
      setReportSuccess(`Complaint #${created.id} registered successfully! Assigned Priority Score: ${created.ai_urgency_score}/100.`);

      // Reset form
      setTitle("");
      setDescription("");
      setPhotoUrl("");
      setAiTriage(null);
      setDuplicateWarning([]);

      refreshAllData();
      setTimeout(() => setActiveTab("complaints"), 1800);
    } catch (err) {
      setReportError(err.message);
    } finally {
      setReportSubmitting(false);
    }
  };

  // Open Details Modal
  const handleOpenDetailModal = async (complaint) => {
    setSelectedComplaint(complaint);
    try {
      const hist = await getComplaintHistory(complaint.id);
      setComplaintHistory(hist.history || []);
    } catch {
      setComplaintHistory([]);
    }
  };

  // Officer Status Progression
  const handleOfficerQuickStatus = async (complaintId, nextStatus, notes = "") => {
    setUpdatingStatusId(complaintId);
    try {
      await updateOfficerComplaintStatus(complaintId, nextStatus, notes);
      showToast(`Status updated to ${nextStatus.toUpperCase()} successfully.`);
      refreshAllData();
      if (resolutionModalComplaint) setResolutionModalComplaint(null);
    } catch (err) {
      showToast(`Error: ${err.message}`);
    } finally {
      setUpdatingStatusId(null);
    }
  };

  // Admin Officer Assignment
  const handleAssignSubmit = async (complaintId) => {
    const officerId = selectedOfficers[complaintId];
    if (!officerId) {
      alert("Please select a municipal officer first.");
      return;
    }

    try {
      await assignComplaint(complaintId, Number(officerId));
      showToast(`Complaint #${complaintId} assigned to officer successfully!`);
      refreshAllData();
    } catch (err) {
      alert(`Assignment failed: ${err.message}`);
    }
  };

  // If Not Logged In, Render Modern Auth Landing Page
  if (!isLoggedIn) {
    return (
      <div className="login-page">
        <div className="login-backdrop">
          <div className="glow glow-1"></div>
          <div className="glow glow-2"></div>
        </div>

        <div className="auth-card-wrapper">
          <div className="brand-header">
            <div className="brand-logo-icon">🏛️</div>
            <h1>CivicAI</h1>
            <p className="brand-tagline">Real-Time AI Civic Issue Resolution & Smart Governance Platform</p>
          </div>

          <div className="demo-credentials-card">
            <h4>⚡ Quick One-Click Demo Access</h4>
            <p>Select any role below to test the platform instantly:</p>
            <div className="demo-buttons">
              <button
                type="button"
                className="demo-btn admin-demo"
                onClick={() => handleQuickLogin("admin@civicai.org", "admin123")}
              >
                👑 <span>Admin</span> <small>City Commissioner</small>
              </button>
              <button
                type="button"
                className="demo-btn officer-demo"
                onClick={() => handleQuickLogin("officer.sharma@civicai.org", "officer123")}
              >
                👮 <span>Officer</span> <small>Water & Sewage</small>
              </button>
              <button
                type="button"
                className="demo-btn officer-demo"
                onClick={() => handleQuickLogin("officer.patel@civicai.org", "officer123")}
              >
                🚧 <span>Officer</span> <small>Roads & PWD</small>
              </button>
              <button
                type="button"
                className="demo-btn citizen-demo"
                onClick={() => handleQuickLogin("citizen@civicai.org", "citizen123")}
              >
                👤 <span>Citizen</span> <small>Priya Verma</small>
              </button>
            </div>
          </div>

          <div className="auth-tabs">
            <button
              className={`auth-tab ${authMode === "login" ? "active" : ""}`}
              onClick={() => { setAuthMode("login"); setLoginError(""); }}
            >
              Sign In
            </button>
            <button
              className={`auth-tab ${authMode === "register" ? "active" : ""}`}
              onClick={() => { setAuthMode("register"); setLoginError(""); }}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleAuthSubmit} className="auth-form">
            {authMode === "register" && (
              <>
                <div className="form-group">
                  <label>Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Ramesh Kumar"
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Role</label>
                    <select value={regRole} onChange={(e) => setRegRole(e.target.value)}>
                      <option value="citizen">Citizen</option>
                      <option value="officer">Municipal Officer</option>
                      <option value="admin">Administrator</option>
                    </select>
                  </div>
                  {regRole === "officer" && (
                    <div className="form-group">
                      <label>Department</label>
                      <input
                        type="text"
                        placeholder="e.g. Water Works / PWD"
                        value={regDept}
                        onChange={(e) => setRegDept(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="form-group">
              <label>Official Email</label>
              <input
                type="email"
                placeholder="name@civicai.org"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {loginError && <div className="alert-box error">{loginError}</div>}
            {authSuccessMsg && <div className="alert-box success">{authSuccessMsg}</div>}

            <button type="submit" className="primary-btn submit-auth-btn">
              {authMode === "login" ? "Sign In to CivicAI" : "Register New Account"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate High-level Dashboard Counters
  const pendingCount = complaints.filter(c => c.status === "pending").length;
  const inProgressCount = complaints.filter(c => c.status === "in_progress" || c.status === "assigned").length;
  const resolvedCount = complaints.filter(c => c.status === "resolved").length;
  const criticalCount = complaints.filter(c => (c.ai_urgency_score || 50) >= 80).length;

  return (
    <div className="app-layout">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-notification">
          <span>🔔</span> {toastMessage}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="app-sidebar">
        <div className="sidebar-brand">
          <div className="brand-icon">🏛️</div>
          <div>
            <h2>CivicAI</h2>
            <span>Smart City Engine</span>
          </div>
        </div>

        <nav className="nav-menu">
          <button
            className={`nav-item ${activeTab === "dashboard" ? "active" : ""}`}
            onClick={() => setActiveTab("dashboard")}
          >
            📊 <span>Dashboard & GIS Map</span>
          </button>

          <button
            className={`nav-item ${activeTab === "complaints" ? "active" : ""}`}
            onClick={() => setActiveTab("complaints")}
          >
            📝 <span>Civic Issues Hub</span>
            <span className="nav-badge">{complaints.length}</span>
          </button>

          <button
            className={`nav-item ${activeTab === "report" ? "active" : ""}`}
            onClick={() => setActiveTab("report")}
          >
            🚨 <span>Report Issue (AI Assisted)</span>
          </button>

          {currentUser?.role === "officer" && (
            <button
              className={`nav-item highlight-officer ${activeTab === "officer" ? "active" : ""}`}
              onClick={() => setActiveTab("officer")}
            >
              👮 <span>Officer Field Board</span>
              <span className="nav-badge">{officerData.complaints?.length || 0}</span>
            </button>
          )}

          {currentUser?.role === "admin" && (
            <button
              className={`nav-item highlight-admin ${activeTab === "admin" ? "active" : ""}`}
              onClick={() => setActiveTab("admin")}
            >
              👑 <span>Command Center</span>
            </button>
          )}
        </nav>

        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {currentUser?.name?.slice(0, 2).toUpperCase() || "US"}
            </div>
            <div className="user-details">
              <strong>{currentUser?.name}</strong>
              <small className={`role-tag role-${currentUser?.role}`}>
                {currentUser?.role?.toUpperCase()}
              </small>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout} title="Log Out">
            🚪 Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="app-main">
        {/* Top Header */}
        <header className="main-header">
          <div>
            <h1>
              {activeTab === "dashboard" && "Municipal Overview & Geographic Command"}
              {activeTab === "complaints" && "Civic Issues & Incident Resolution Hub"}
              {activeTab === "report" && "Citizen Incident Reporting & AI Triage"}
              {activeTab === "officer" && "Field Officer Resolution Board"}
              {activeTab === "admin" && "City Administrator Intelligence & Management"}
            </h1>
            <p className="header-subtitle">
              CivicAI Real-Time Civic Issue Resolution Platform • Connected to Municipal Node
            </p>
          </div>

          <div className="header-actions">
            <button
              className="refresh-btn"
              onClick={refreshAllData}
              disabled={loadingData}
              title="Refresh live data"
            >
              🔄 {loadingData ? "Syncing..." : "Refresh"}
            </button>
            {activeTab !== "report" && (
              <button className="primary-btn report-cta" onClick={() => setActiveTab("report")}>
                + Log Civic Issue
              </button>
            )}
          </div>
        </header>

        {/* TAB 1: DASHBOARD & GIS MAP */}
        {activeTab === "dashboard" && (
          <div className="tab-pane">
            {/* Top Stat Cards */}
            <div className="kpi-grid">
              <div className="kpi-card accent-blue">
                <span className="kpi-icon">📝</span>
                <div>
                  <span className="kpi-title">Total Incidents</span>
                  <strong className="kpi-value">{complaints.length}</strong>
                </div>
              </div>

              <div className="kpi-card accent-amber">
                <span className="kpi-icon">⏳</span>
                <div>
                  <span className="kpi-title">Pending Triage</span>
                  <strong className="kpi-value">{pendingCount}</strong>
                </div>
              </div>

              <div className="kpi-card accent-purple">
                <span className="kpi-icon">🛠️</span>
                <div>
                  <span className="kpi-title">In Progress</span>
                  <strong className="kpi-value">{inProgressCount}</strong>
                </div>
              </div>

              <div className="kpi-card accent-green">
                <span className="kpi-icon">✅</span>
                <div>
                  <span className="kpi-title">Resolved</span>
                  <strong className="kpi-value">{resolvedCount}</strong>
                </div>
              </div>

              <div className="kpi-card accent-red">
                <span className="kpi-icon">🚨</span>
                <div>
                  <span className="kpi-title">Critical / Urgent</span>
                  <strong className="kpi-value">{criticalCount}</strong>
                </div>
              </div>
            </div>

            {/* Live Interactive GIS Map Section */}
            <div className="content-card map-section-card">
              <div className="card-header-row">
                <div>
                  <h3>🗺️ City-Wide Incident GIS Heatmap</h3>
                  <p>Interactive OpenStreetMap showing live civic complaints pinned by GPS coordinates.</p>
                </div>
                <div className="map-legend">
                  <span className="legend-item"><span className="dot dot-crit"></span> Critical / High</span>
                  <span className="legend-item"><span className="dot dot-med"></span> Medium</span>
                  <span className="legend-item"><span className="dot dot-res"></span> Resolved</span>
                </div>
              </div>
              <CivicMap
                complaints={complaints}
                onSelectComplaint={handleOpenDetailModal}
                height="460px"
              />
            </div>

            {/* Recent Incidents Quick Grid */}
            <div className="content-card">
              <div className="card-header-row">
                <h3>⚡ Recent Critical Incidents</h3>
                <button className="link-btn" onClick={() => setActiveTab("complaints")}>
                  View All Issues ➔
                </button>
              </div>

              <div className="incident-compact-list">
                {complaints.slice(0, 4).map((comp) => (
                  <div key={comp.id} className="incident-compact-item" onClick={() => handleOpenDetailModal(comp)}>
                    <div className="compact-left">
                      <span className={`badge category-${comp.issue_type}`}>
                        {comp.issue_type?.replace("_", " ")}
                      </span>
                      <h4>#{comp.id} {comp.title}</h4>
                      <p>📍 {comp.address || `${comp.latitude}, ${comp.longitude}`}</p>
                    </div>
                    <div className="compact-right">
                      <div className="urgency-score-pill">
                        ⚡ Urgency: <b>{comp.ai_urgency_score || 50}/100</b>
                      </div>
                      <span className={`badge status-${comp.status}`}>
                        {comp.status?.replace("_", " ").toUpperCase()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: COMPLAINTS HUB */}
        {activeTab === "complaints" && (
          <div className="tab-pane">
            {/* Filter and Search Bar */}
            <div className="filter-toolbar">
              <div className="search-box">
                <span>🔍</span>
                <input
                  type="text"
                  placeholder="Search issues by title, description or street address..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="filter-controls">
                <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="all">All Categories</option>
                  <option value="water">💧 Water Supply</option>
                  <option value="drainage">🌊 Drainage & Sewage</option>
                  <option value="road">🚧 Roads & Potholes</option>
                  <option value="electricity">⚡ Electricity</option>
                  <option value="street_light">💡 Street Lighting</option>
                  <option value="garbage">🗑️ Garbage & Sanitation</option>
                  <option value="public_safety">⚠️ Public Safety</option>
                </select>

                <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="all">All Statuses</option>
                  <option value="pending">⏳ Pending Triage</option>
                  <option value="assigned">👤 Assigned</option>
                  <option value="in_progress">⚙️ In Progress</option>
                  <option value="resolved">✅ Resolved</option>
                </select>

                <div className="view-toggle">
                  <button
                    className={`toggle-btn ${viewMode === "cards" ? "active" : ""}`}
                    onClick={() => setViewMode("cards")}
                    title="Grid Card View"
                  >
                    🗂️ Cards
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "map" ? "active" : ""}`}
                    onClick={() => setViewMode("map")}
                    title="Interactive GIS Map View"
                  >
                    🗺️ Map
                  </button>
                </div>
              </div>
            </div>

            {viewMode === "map" ? (
              <div className="content-card">
                <CivicMap
                  complaints={complaints}
                  onSelectComplaint={handleOpenDetailModal}
                  height="550px"
                />
              </div>
            ) : complaints.length === 0 ? (
              <div className="empty-state-card">
                <span className="empty-icon">📭</span>
                <h3>No Complaints Found</h3>
                <p>No complaints match your selected filters or search terms.</p>
                <button className="primary-btn" onClick={() => { setFilterCategory("all"); setFilterStatus("all"); setSearchQuery(""); }}>
                  Reset Filters
                </button>
              </div>
            ) : (
              <div className="complaints-grid">
                {complaints.map((comp) => (
                  <div key={comp.id} className="complaint-card">
                    <div className="card-top">
                      <span className={`badge category-${comp.issue_type}`}>
                        {comp.issue_type?.replace("_", " ")}
                      </span>
                      <span className={`badge status-${comp.status}`}>
                        {comp.status?.replace("_", " ")}
                      </span>
                    </div>

                    <h3 className="complaint-title">#{comp.id} {comp.title}</h3>
                    <p className="complaint-desc">{comp.description}</p>

                    <div className="complaint-meta">
                      <div className="meta-item">
                        📍 <span>{comp.address || `${comp.latitude}, ${comp.longitude}`}</span>
                      </div>
                      <div className="meta-item">
                        ⚡ <span>AI Urgency: <b>{comp.ai_urgency_score || 50}/100</b></span>
                      </div>
                      <div className="meta-item">
                        🏢 <span>{comp.ai_department || "Municipal Triage"}</span>
                      </div>
                    </div>

                    {comp.resolution_notes && (
                      <div className="resolution-proof-box">
                        <strong>Resolution Action:</strong> {comp.resolution_notes}
                      </div>
                    )}

                    <div className="card-footer">
                      <span className="date-tag">
                        {new Date(comp.created_at).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" })}
                      </span>
                      <button className="inspect-btn" onClick={() => handleOpenDetailModal(comp)}>
                        Inspect Case ➔
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: REPORT CIVIC ISSUE (AI ASSISTED) */}
        {activeTab === "report" && (
          <div className="tab-pane">
            <div className="report-layout-grid">
              {/* Left Column: Form */}
              <div className="content-card">
                <div className="card-header-row">
                  <div>
                    <h3>🚨 Log a New Civic Issue</h3>
                    <p>Describe what you observed. Our AI engine will automatically classify severity, detect nearby duplicates, and route to the correct municipal wing.</p>
                  </div>
                </div>

                <form onSubmit={handleComplaintSubmit} className="report-form">
                  <div className="form-group">
                    <label>Complaint Title *</label>
                    <input
                      type="text"
                      placeholder="e.g. Major water pipeline crack flooding main road"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Detailed Description *</label>
                    <textarea
                      rows={4}
                      placeholder="Detail the issue, landmarks, safety hazards, duration..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Category (Auto-Detected by AI)</label>
                      <select value={issueType} onChange={(e) => setIssueType(e.target.value)}>
                        <option value="water">💧 Water Supply</option>
                        <option value="drainage">🌊 Drainage & Sewage</option>
                        <option value="road">🚧 Roads & Potholes</option>
                        <option value="electricity">⚡ Electricity</option>
                        <option value="street_light">💡 Street Light</option>
                        <option value="garbage">🗑️ Garbage & Waste</option>
                        <option value="public_safety">⚠️ Public Safety</option>
                        <option value="other">📍 Other</option>
                      </select>
                    </div>

                    <div className="form-group">
                      <label>Severity (AI Predicted)</label>
                      <select value={severity} onChange={(e) => setSeverity(e.target.value)}>
                        <option value="low">Low Routine</option>
                        <option value="medium">Medium Priority</option>
                        <option value="high">High / Emergency</option>
                      </select>
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Street Address / Landmark</label>
                    <input
                      type="text"
                      placeholder="e.g. Sector 4, Opposite State Bank ATM"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>Photo Evidence URL (Optional)</label>
                    <input
                      type="url"
                      placeholder="https://images.unsplash.com/photo-..."
                      value={photoUrl}
                      onChange={(e) => setPhotoUrl(e.target.value)}
                    />
                  </div>

                  <div className="form-row coords-row">
                    <div className="form-group">
                      <label>Latitude</label>
                      <input
                        type="number"
                        step="any"
                        value={latitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLatitude(val);
                          setPickedLocation(prev => ({ ...prev, lat: val }));
                        }}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label>Longitude</label>
                      <input
                        type="number"
                        step="any"
                        value={longitude}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setLongitude(val);
                          setPickedLocation(prev => ({ ...prev, lng: val }));
                        }}
                        required
                      />
                    </div>
                  </div>

                  {reportError && <div className="alert-box error">{reportError}</div>}
                  {reportSuccess && <div className="alert-box success">{reportSuccess}</div>}

                  <button
                    type="submit"
                    className="primary-btn submit-complaint-btn"
                    disabled={reportSubmitting}
                  >
                    {reportSubmitting ? "Submitting & Routing Case..." : "🚀 Submit Civic Complaint"}
                  </button>
                </form>
              </div>

              {/* Right Column: AI Triage Assistant & Map Picker */}
              <div className="report-side-column">
                {/* Live AI Analysis Assistant */}
                <div className="content-card ai-assistant-card">
                  <div className="ai-card-header">
                    <span className="pulse-dot"></span>
                    <h4>CivicAI Intelligent Assistant</h4>
                  </div>

                  {aiLoading ? (
                    <div className="ai-loading-box">
                      <span className="spinner">⏳</span>
                      <p>Analyzing civic NLP context & predicting severity...</p>
                    </div>
                  ) : aiTriage ? (
                    <div className="ai-insights">
                      <div className="ai-badge-row">
                        <span className="ai-tag">Identified: <b>{aiTriage.category?.toUpperCase()}</b></span>
                        <span className="ai-tag">Confidence: <b>{Math.round(aiTriage.confidence * 100)}%</b></span>
                      </div>
                      <div className="urgency-container">
                        <span>Urgency Score:</span>
                        <div className="urgency-meter">
                          <div
                            className="urgency-bar"
                            style={{
                              width: `${aiTriage.urgency_score}%`,
                              backgroundColor: aiTriage.urgency_score > 75 ? "#ef4444" : aiTriage.urgency_score > 45 ? "#f59e0b" : "#10b981"
                            }}
                          />
                        </div>
                        <strong>{aiTriage.urgency_score} / 100</strong>
                      </div>
                      <p className="ai-dept-routing">
                        🏢 <b>Routing:</b> {aiTriage.department}<br/>
                        ⏱️ <b>Expected SLA:</b> {aiTriage.estimated_sla}
                      </p>
                      <div className="ai-summary-note">
                        💡 {aiTriage.ai_summary}
                      </div>
                    </div>
                  ) : (
                    <p className="ai-placeholder">
                      Start typing a complaint title and description on the left. The CivicAI engine will automatically identify the category, predict urgency, and calculate the response SLA in real-time.
                    </p>
                  )}

                  {/* Duplicate Detection Alert */}
                  {duplicateWarning.length > 0 && (
                    <div className="duplicate-alert-box">
                      <h5>⚠️ Potential Duplicate Detected ({duplicateWarning.length} nearby)</h5>
                      <p>A similar unresolved report was found within 250 meters:</p>
                      {duplicateWarning.slice(0, 2).map((dup) => (
                        <div key={dup.complaint_id} className="dup-item">
                          <span>#{dup.complaint_id} {dup.title}</span>
                          <small>Distance: {dup.distance_meters}m • Status: {dup.status}</small>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Location Picker Map */}
                <div className="content-card map-picker-card">
                  <h4>📍 Drop Pin on Exact Incident Location</h4>
                  <p className="map-picker-hint">Click anywhere on the map or tap "🎯 Locate Me" to auto-fill GPS coordinates.</p>
                  <CivicMap
                    pickLocationMode={true}
                    pickedLocation={pickedLocation}
                    onLocationSelect={handleMapLocationSelect}
                    height="280px"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: OFFICER RESOLUTION WORKSPACE */}
        {activeTab === "officer" && currentUser?.role === "officer" && (
          <div className="tab-pane">
            <div className="kpi-grid">
              <div className="kpi-card accent-blue">
                <span className="kpi-icon">📋</span>
                <div>
                  <span className="kpi-title">Assigned to You</span>
                  <strong className="kpi-value">{officerData.stats?.total_assigned || 0}</strong>
                </div>
              </div>

              <div className="kpi-card accent-amber">
                <span className="kpi-icon">⏳</span>
                <div>
                  <span className="kpi-title">Pending Action</span>
                  <strong className="kpi-value">{officerData.stats?.assigned || 0}</strong>
                </div>
              </div>

              <div className="kpi-card accent-purple">
                <span className="kpi-icon">⚙️</span>
                <div>
                  <span className="kpi-title">Active Field Work</span>
                  <strong className="kpi-value">{officerData.stats?.in_progress || 0}</strong>
                </div>
              </div>

              <div className="kpi-card accent-green">
                <span className="kpi-icon">✅</span>
                <div>
                  <span className="kpi-title">Resolved</span>
                  <strong className="kpi-value">{officerData.stats?.resolved || 0}</strong>
                </div>
              </div>
            </div>

            <div className="content-card">
              <div className="card-header-row">
                <div>
                  <h3>👮 Field Officer Task Board</h3>
                  <p>Update operational status, verify incident resolution on-site, and log completion proofs.</p>
                </div>
              </div>

              {(!officerData.complaints || officerData.complaints.length === 0) ? (
                <div className="empty-state-card">
                  <span className="empty-icon">🎉</span>
                  <h3>No Active Incidents Assigned</h3>
                  <p>You have resolved all assigned civic tasks. Check back when the city administrator assigns new cases.</p>
                </div>
              ) : (
                <div className="officer-task-grid">
                  {officerData.complaints.map((comp) => (
                    <div key={comp.id} className="officer-card">
                      <div className="card-top">
                        <span className={`badge category-${comp.issue_type}`}>
                          {comp.issue_type?.replace("_", " ")}
                        </span>
                        <span className={`badge status-${comp.status}`}>
                          {comp.status?.replace("_", " ").toUpperCase()}
                        </span>
                      </div>

                      <h4>#{comp.id} {comp.title}</h4>
                      <p className="task-desc">{comp.description}</p>

                      <div className="task-meta">
                        <p>📍 <b>Location:</b> {comp.address || `${comp.latitude}, ${comp.longitude}`}</p>
                        <p>⚡ <b>AI Urgency:</b> {comp.ai_urgency_score || 50} / 100</p>
                        {comp.resolution_notes && (
                          <p className="task-notes"><b>Current Notes:</b> "{comp.resolution_notes}"</p>
                        )}
                      </div>

                      <div className="task-actions">
                        <button
                          className="secondary-btn"
                          onClick={() => handleOpenDetailModal(comp)}
                        >
                          View Case
                        </button>

                        {comp.status === "assigned" && (
                          <button
                            className="primary-btn start-work-btn"
                            disabled={updatingStatusId === comp.id}
                            onClick={() => handleOfficerQuickStatus(comp.id, "in_progress", "Officer arrived on site and initiated maintenance.")}
                          >
                            🔄 Start Work
                          </button>
                        )}

                        {comp.status === "in_progress" && (
                          <button
                            className="primary-btn resolve-work-btn"
                            disabled={updatingStatusId === comp.id}
                            onClick={() => {
                              setResolutionModalComplaint(comp);
                              setResolutionNotes("");
                            }}
                          >
                            ✅ Mark Resolved
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 5: ADMIN COMMAND CENTER */}
        {activeTab === "admin" && currentUser?.role === "admin" && (
          <div className="tab-pane">
            {/* Municipal Analytics & Charts View */}
            <AdminAnalyticsView
              statistics={adminStats}
              officers={officers}
              complaints={complaints}
            />

            {/* Officer Case Assignment Section */}
            <div className="content-card assignment-card">
              <div className="card-header-row">
                <div>
                  <h3>📋 Officer Case Allocation & Reassignment</h3>
                  <p>Assign incoming unassigned civic complaints to responsible departmental officers.</p>
                </div>
              </div>

              <div className="table-responsive">
                <table className="assignment-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Incident Title</th>
                      <th>Category</th>
                      <th>AI Urgency</th>
                      <th>Status</th>
                      <th>Assign Responsible Officer</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {complaints.map((comp) => (
                      <tr key={comp.id}>
                        <td><b>#{comp.id}</b></td>
                        <td>
                          <strong>{comp.title}</strong><br/>
                          <small style={{ color: "#64748b" }}>{comp.address || `${comp.latitude}, ${comp.longitude}`}</small>
                        </td>
                        <td>
                          <span className={`badge category-${comp.issue_type}`}>
                            {comp.issue_type}
                          </span>
                        </td>
                        <td>
                          <span className={`urgency-pill score-${(comp.ai_urgency_score || 50) > 75 ? "crit" : "normal"}`}>
                            {comp.ai_urgency_score || 50}/100
                          </span>
                        </td>
                        <td>
                          <span className={`badge status-${comp.status}`}>
                            {comp.status}
                          </span>
                        </td>
                        <td>
                          <select
                            className="officer-select"
                            value={selectedOfficers[comp.id] || comp.assigned_officer_id || ""}
                            onChange={(e) => setSelectedOfficers(prev => ({
                              ...prev,
                              [comp.id]: e.target.value
                            }))}
                          >
                            <option value="">-- Choose Field Officer --</option>
                            {officers.map((off) => (
                              <option key={off.id} value={off.id}>
                                {off.name} ({off.department || 'Ops'})
                              </option>
                            ))}
                          </select>
                        </td>
                        <td>
                          <button
                            className="primary-btn assign-btn"
                            onClick={() => handleAssignSubmit(comp.id)}
                          >
                            Assign
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Complaint Details Modal */}
      {selectedComplaint && (
        <ComplaintDetailModal
          complaint={selectedComplaint}
          history={complaintHistory}
          userRole={currentUser?.role}
          userId={currentUser?.id}
          onClose={() => setSelectedComplaint(null)}
          onStatusUpdated={refreshAllData}
        />
      )}

      {/* Officer Mark Resolved Modal */}
      {resolutionModalComplaint && (
        <div className="modal-overlay" onClick={() => setResolutionModalComplaint(null)}>
          <div className="modal-content resolution-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>✅ Verify & Mark Resolved: #{resolutionModalComplaint.id}</h3>
              <button className="close-btn" onClick={() => setResolutionModalComplaint(null)}>&times;</button>
            </div>
            <div className="modal-body">
              <p>Please enter operational remarks and proof of work before marking this civic case resolved:</p>
              <textarea
                rows={4}
                placeholder="e.g. Replaced leaking valve, tested water pressure to 45 PSI, cleared all debris."
                value={resolutionNotes}
                onChange={(e) => setResolutionNotes(e.target.value)}
              />
            </div>
            <div className="modal-footer">
              <button className="secondary-btn" onClick={() => setResolutionModalComplaint(null)}>
                Cancel
              </button>
              <button
                className="primary-btn"
                onClick={() => handleOfficerQuickStatus(
                  resolutionModalComplaint.id,
                  "resolved",
                  resolutionNotes || "Issue repaired and verified on-site by field officer."
                )}
              >
                Confirm Resolution
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;