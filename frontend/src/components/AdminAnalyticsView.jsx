export default function AdminAnalyticsView({
  statistics,
  officers = [],
  complaints = []
}) {
  if (!statistics) return <div>Loading Analytics...</div>;

  const exportCSV = () => {
    if (!complaints.length) return;
    const headers = ["ID", "Title", "Category", "Severity", "Urgency_Score", "Status", "Address", "Created_At"];
    const rows = complaints.map(c => [
      c.id,
      `"${(c.title || "").replace(/"/g, '""')}"`,
      c.issue_type,
      c.severity,
      c.ai_urgency_score || 50,
      c.status,
      `"${(c.address || "").replace(/"/g, '""')}"`,
      c.created_at
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `CivicAI_Municipal_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categoryCounts = statistics.category_counts || {};
  const maxCategoryCount = Math.max(...Object.values(categoryCounts), 1);

  const severities = statistics.severities || {};

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <div>
          <h2>📊 Municipal Analytics & Operational Intelligence</h2>
          <p>Real-time city governance performance, resolution SLAs, and officer allocation.</p>
        </div>
        <button className="export-btn" onClick={exportCSV}>
          📥 Export Municipal CSV Report
        </button>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-grid">
        <div className="kpi-card accent-blue">
          <span className="kpi-icon">📝</span>
          <div>
            <span className="kpi-title">Total Reports</span>
            <strong className="kpi-value">{statistics.total_complaints}</strong>
          </div>
        </div>

        <div className="kpi-card accent-green">
          <span className="kpi-icon">🎯</span>
          <div>
            <span className="kpi-title">Resolution Rate</span>
            <strong className="kpi-value">{statistics.resolution_rate}%</strong>
          </div>
        </div>

        <div className="kpi-card accent-amber">
          <span className="kpi-icon">⏳</span>
          <div>
            <span className="kpi-title">Active / In Progress</span>
            <strong className="kpi-value">{(statistics.assigned || 0) + (statistics.in_progress || 0)}</strong>
          </div>
        </div>

        <div className="kpi-card accent-red">
          <span className="kpi-icon">🚨</span>
          <div>
            <span className="kpi-title">Critical Urgency</span>
            <strong className="kpi-value">{severities.critical || 0}</strong>
          </div>
        </div>

        <div className="kpi-card accent-purple">
          <span className="kpi-icon">👮</span>
          <div>
            <span className="kpi-title">Field Officers</span>
            <strong className="kpi-value">{statistics.total_officers || officers.length}</strong>
          </div>
        </div>
      </div>

      <div className="charts-grid">
        {/* Category Breakdown Bar Chart */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>📈 Civic Issues by Department Category</h3>
            <span className="chart-badge">Live Triage Data</span>
          </div>
          <div className="category-bars">
            {Object.entries(categoryCounts).map(([cat, count]) => {
              const pct = Math.round((count / maxCategoryCount) * 100);
              return (
                <div key={cat} className="bar-row">
                  <div className="bar-label">
                    <span>{cat.replace("_", " ").toUpperCase()}</span>
                    <b>{count} cases</b>
                  </div>
                  <div className="bar-track">
                    <div
                      className={`bar-fill cat-color-${cat}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Severity & SLA Distribution */}
        <div className="chart-card">
          <div className="chart-card-header">
            <h3>⚡ Severity & Urgency Distribution</h3>
            <span className="chart-badge">AI Risk Scoring</span>
          </div>
          <div className="severity-distribution">
            <div className="sev-item">
              <div className="sev-header">
                <span className="sev-indicator sev-crit"></span>
                <span>Critical / Emergency</span>
                <b>{severities.critical || 0}</b>
              </div>
              <p className="sev-sla">SLA: Target 6-12h Response</p>
            </div>
            <div className="sev-item">
              <div className="sev-header">
                <span className="sev-indicator sev-high"></span>
                <span>High Severity</span>
                <b>{severities.high || 0}</b>
              </div>
              <p className="sev-sla">SLA: Target 24-48h Action</p>
            </div>
            <div className="sev-item">
              <div className="sev-header">
                <span className="sev-indicator sev-med"></span>
                <span>Medium Priority</span>
                <b>{severities.medium || 0}</b>
              </div>
              <p className="sev-sla">SLA: Target 3-5 Working Days</p>
            </div>
            <div className="sev-item">
              <div className="sev-header">
                <span className="sev-indicator sev-low"></span>
                <span>Low Routine</span>
                <b>{severities.low || 0}</b>
              </div>
              <p className="sev-sla">SLA: Target 7-10 Days</p>
            </div>
          </div>
        </div>
      </div>

      {/* Officers Leaderboard */}
      <div className="chart-card officer-leaderboard">
        <div className="chart-card-header">
          <h3>🏆 Municipal Field Officer Performance Leaderboard</h3>
          <span className="chart-badge">{officers.length} Active Officers</span>
        </div>
        <div className="table-responsive">
          <table className="officer-table">
            <thead>
              <tr>
                <th>Officer</th>
                <th>Department</th>
                <th>Assigned Tasks</th>
                <th>Resolved</th>
                <th>Resolution Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {officers.map((off) => (
                <tr key={off.id}>
                  <td>
                    <div className="officer-profile-cell">
                      <div className="avatar-circle">
                        {off.name?.slice(0, 2).toUpperCase() || "OF"}
                      </div>
                      <div>
                        <strong>{off.name}</strong>
                        <span>{off.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>{off.department}</td>
                  <td><b>{off.assigned_count}</b></td>
                  <td><span className="resolved-pill">{off.resolved_count}</span></td>
                  <td>
                    <div className="rate-cell">
                      <div className="rate-bar-track">
                        <div
                          className="rate-bar-fill"
                          style={{ width: `${off.resolution_rate}%` }}
                        />
                      </div>
                      <span>{off.resolution_rate}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-pill ${off.assigned_count > 0 ? "active" : "idle"}`}>
                      {off.assigned_count > 0 ? "On Duty" : "Available"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
