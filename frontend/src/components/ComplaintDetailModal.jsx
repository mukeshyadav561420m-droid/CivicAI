import { useState } from "react";
import CivicMap from "./CivicMap";
import { submitComplaintFeedback } from "../api";

export default function ComplaintDetailModal({
  complaint,
  history = [],
  userRole,
  userId,
  onClose,
  onStatusUpdated,
}) {
  const [rating, setRating] = useState(complaint.citizen_rating || 5);
  const [feedback, setFeedback] = useState(complaint.citizen_feedback || "");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);
  const [feedbackSuccess, setFeedbackSuccess] = useState(false);
  const [feedbackError, setFeedbackError] = useState("");

  if (!complaint) return null;

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    setFeedbackError("");
    try {
      await submitComplaintFeedback(complaint.id, rating, feedback);
      complaint.citizen_rating = rating;
      complaint.citizen_feedback = feedback;
      setFeedbackSuccess(true);
      if (onStatusUpdated) onStatusUpdated();
    } catch (err) {
      setFeedbackError(err.message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const statusSteps = [
    { key: "pending", label: "Submitted", desc: "Logged in civic queue" },
    { key: "assigned", label: "Assigned", desc: "Officer assigned" },
    { key: "in_progress", label: "In Progress", desc: "Ground team active" },
    { key: "resolved", label: "Resolved", desc: "Action completed" }
  ];

  const getStepIndex = (status) => {
    switch (status) {
      case "pending": return 0;
      case "assigned": return 1;
      case "in_progress": return 2;
      case "resolved": return 3;
      default: return 0;
    }
  };

  const currentStep = getStepIndex(complaint.status);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <div className="badge-row">
              <span className={`badge category-${complaint.issue_type}`}>
                {complaint.issue_type?.replace("_", " ")}
              </span>
              <span className={`badge severity-${complaint.severity}`}>
                {complaint.severity?.toUpperCase()} SEVERITY
              </span>
              <span className={`badge status-${complaint.status}`}>
                {complaint.status?.replace("_", " ").toUpperCase()}
              </span>
            </div>
            <h2>#{complaint.id} - {complaint.title}</h2>
          </div>
          <button className="close-btn" onClick={onClose}>&times;</button>
        </div>

        <div className="modal-body">
          {/* Stepper */}
          <div className="status-stepper-box">
            <h4>Live Incident Resolution Lifecycle</h4>
            <div className="stepper">
              {statusSteps.map((step, idx) => (
                <div key={step.key} className={`step-item ${idx <= currentStep ? "completed" : ""} ${idx === currentStep ? "active" : ""}`}>
                  <div className="step-circle">{idx < currentStep ? "✓" : idx + 1}</div>
                  <div className="step-label">
                    <strong>{step.label}</strong>
                    <span>{step.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="modal-grid">
            <div className="modal-col">
              <div className="info-block">
                <h4>Description</h4>
                <p className="description-text">{complaint.description}</p>
              </div>

              {complaint.image_url && (
                <div className="info-block">
                  <h4>Attached Photographic Evidence</h4>
                  <img src={complaint.image_url} alt="Evidence" className="evidence-img" />
                </div>
              )}

              {/* AI Triage Card */}
              <div className="ai-triage-card">
                <div className="ai-card-header">
                  <span>🤖</span>
                  <h4>CivicAI Intelligent Routing & Triage</h4>
                </div>
                <div className="ai-card-content">
                  <div className="ai-metric">
                    <span className="metric-label">AI Urgency Score</span>
                    <div className="urgency-meter">
                      <div
                        className="urgency-bar"
                        style={{
                          width: `${complaint.ai_urgency_score || 50}%`,
                          backgroundColor: (complaint.ai_urgency_score || 50) > 75 ? "#ef4444" : (complaint.ai_urgency_score || 50) > 45 ? "#f59e0b" : "#10b981"
                        }}
                      />
                    </div>
                    <strong>{complaint.ai_urgency_score || 50} / 100</strong>
                  </div>
                  <div className="ai-routing-info">
                    <p>🏢 <b>Assigned Dept:</b> {complaint.ai_department || "Municipal Operations"}</p>
                    <p>📍 <b>Location Tag:</b> {complaint.address || `${complaint.latitude}, ${complaint.longitude}`}</p>
                    {complaint.resolution_notes && (
                      <p>📋 <b>Officer Work Proof:</b> <i>"{complaint.resolution_notes}"</i></p>
                    )}
                  </div>
                </div>
              </div>

              {/* Citizen Rating & Feedback if Resolved */}
              {complaint.status === "resolved" && (
                <div className="feedback-section">
                  <h4>Citizen Satisfaction & Rating</h4>
                  {complaint.citizen_rating ? (
                    <div className="feedback-display">
                      <div className="stars">
                        {"★".repeat(complaint.citizen_rating)}{"☆".repeat(5 - complaint.citizen_rating)}
                      </div>
                      <p>"{complaint.citizen_feedback || "Resolved to satisfaction."}"</p>
                    </div>
                  ) : userRole === "citizen" ? (
                    <form onSubmit={handleFeedbackSubmit} className="feedback-form">
                      <p>How satisfied are you with the resolution of this issue?</p>
                      <div className="rating-select">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            className={`star-btn ${star <= rating ? "active" : ""}`}
                            onClick={() => setRating(star)}
                          >
                            ★
                          </button>
                        ))}
                        <span className="rating-num">({rating} of 5 Stars)</span>
                      </div>
                      <textarea
                        rows={2}
                        placeholder="Leave remarks on the municipal action..."
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                      />
                      {feedbackError && <p className="error-text">{feedbackError}</p>}
                      {feedbackSuccess && <p className="success-text">Thank you! Your feedback has been recorded.</p>}
                      <button type="submit" className="primary-btn" disabled={submittingFeedback}>
                        {submittingFeedback ? "Submitting..." : "Submit Review"}
                      </button>
                    </form>
                  ) : (
                    <p className="pending-text">Awaiting citizen feedback submission.</p>
                  )}
                </div>
              )}
            </div>

            <div className="modal-col">
              {/* Incident Map */}
              <div className="info-block">
                <h4>Incident GIS Location</h4>
                <CivicMap
                  complaints={[complaint]}
                  selectedComplaint={complaint}
                  height="260px"
                />
              </div>

              {/* Audit Timeline */}
              <div className="info-block">
                <h4>Audit Trail & Status Log</h4>
                <div className="timeline-container">
                  {history.length === 0 ? (
                    <p className="empty-history">No audit changes recorded yet.</p>
                  ) : (
                    history.map((item, idx) => (
                      <div key={item.id || idx} className="timeline-entry">
                        <div className="timeline-point" />
                        <div className="timeline-details">
                          <div className="timeline-header">
                            <span className="status-transition">
                              {item.old_status ? `${item.old_status} ➔ ` : "Logged as "}
                              <b>{item.new_status}</b>
                            </span>
                            <span className="timeline-time">
                              {new Date(item.changed_at).toLocaleString([], { dateStyle: "short", timeStyle: "short" })}
                            </span>
                          </div>
                          {item.notes && <p className="timeline-notes">"{item.notes}"</p>}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="secondary-btn" onClick={onClose}>Close Window</button>
        </div>
      </div>
    </div>
  );
}
