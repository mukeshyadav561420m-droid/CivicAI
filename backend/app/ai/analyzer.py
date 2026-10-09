import re
import math

ISSUE_KEYWORDS = {
    "water": [
        "water", "pipeline", "pipe", "leak", "leaking", "contaminated", "drinking water",
        "pressure", "burst", "tap", "valve", "supply", "chlorine", "dirty water", "muddy water"
    ],
    "drainage": [
        "drain", "drainage", "sewer", "sewerage", "manhole", "overflow", "gutter",
        "stormwater", "clogged", "blocked drain", "stagnant", "flooding", "sludge"
    ],
    "road": [
        "road", "pothole", "potholes", "asphalt", "pavement", "ditch", "speed breaker",
        "tar", "crater", "pedestrian", "footpath", "sidewalk", "crack", "cracked", "divider"
    ],
    "electricity": [
        "electricity", "power", "power cut", "blackout", "transformer", "wire", "wires",
        "hanging wire", "electric pole", "voltage", "spark", "sparking", "short circuit", "meter"
    ],
    "street_light": [
        "streetlight", "street light", "lamp", "lamp post", "dark road", "bulb",
        "pole", "flickering", "lighting", "unlit", "darkness"
    ],
    "garbage": [
        "garbage", "trash", "waste", "dump", "dumping", "rubbish", "litter",
        "debris", "dumpster", "stench", "smell", "rotten", "uncollected", "sweep", "bin"
    ],
    "public_safety": [
        "encroachment", "illegal", "hazard", "danger", "falling tree", "wall collapse",
        "sinkhole", "stray dogs", "open pit", "fire", "obstruction"
    ]
}

DEPARTMENT_MAP = {
    "water": "Municipal Water & Sewerage Board",
    "drainage": "Stormwater Drainage & Sanitation Dept",
    "road": "Public Works & Road Maintenance (PWD)",
    "electricity": "City Power Distribution Corp",
    "street_light": "Urban Electrical & Lighting Authority",
    "garbage": "Solid Waste Management Division",
    "public_safety": "Municipal Safety & Enforcement Cell",
    "other": "General Civic Administration"
}

SLA_MAP = {
    "critical": "6 to 12 Hours (Emergency Dispatch)",
    "high": "24 to 48 Hours",
    "medium": "3 to 5 Working Days",
    "low": "7 Working Days"
}

CRITICAL_TRIGGERS = [
    "sparking", "fire", "electrocution", "accident", "dying", "hospital",
    "school", "poisonous", "life threatening", "collapsed", "sinkhole", "emergency", "open manhole"
]

HIGH_TRIGGERS = [
    "deep pothole", "flooded", "overflowing", "completely dark", "burst pipe",
    "foul smell", "hazard", "dangerous", "unusable", "blocked traffic", "severe"
]

MODERATE_TRIGGERS = [
    "broken", "bad", "slow", "delay", "dirty", "uncollected", "flickering", "leak", "crack"
]


def analyze_civic_text(title: str, description: str, manual_type: str = None) -> dict:
    """
    NLP Semantic Classifier and Urgency Predictor for Civic Complaints.
    """
    text = f"{title} {description}".lower()
    words = set(re.findall(r"\b[a-z]{3,}\b", text))

    # 1. Category Classification
    scores = {}
    for category, kws in ISSUE_KEYWORDS.items():
        score = sum(1 for kw in kws if kw in text or any(k in words for k in kw.split()))
        scores[category] = score

    best_category, max_match = max(scores.items(), key=lambda x: x[1])
    
    # If confidence is low, fall back to manual_type if provided
    if max_match == 0:
        detected_category = manual_type if manual_type in ISSUE_KEYWORDS else "other"
        confidence = 0.50
    else:
        detected_category = best_category
        confidence = min(0.98, 0.65 + (max_match * 0.08))

    # If user provided a specific category and AI scored it decently, respect user's hint
    if manual_type and manual_type in ISSUE_KEYWORDS and scores.get(manual_type, 0) > 0:
        detected_category = manual_type

    # 2. Urgency & Severity Scoring (0 - 100)
    base_urgency = 30

    critical_hits = sum(1 for trigger in CRITICAL_TRIGGERS if trigger in text)
    high_hits = sum(1 for trigger in HIGH_TRIGGERS if trigger in text)
    mod_hits = sum(1 for trigger in MODERATE_TRIGGERS if trigger in text)

    urgency_score = base_urgency + (critical_hits * 30) + (high_hits * 15) + (mod_hits * 5)
    urgency_score = min(98, max(20, urgency_score))

    if urgency_score >= 80:
        severity = "high" # backend schema allows "low", "medium", "high"
        ai_severity_label = "critical"
    elif urgency_score >= 60:
        severity = "high"
        ai_severity_label = "high"
    elif urgency_score >= 40:
        severity = "medium"
        ai_severity_label = "medium"
    else:
        severity = "low"
        ai_severity_label = "low"

    department = DEPARTMENT_MAP.get(detected_category, DEPARTMENT_MAP["other"])
    sla = SLA_MAP.get(ai_severity_label, "3 to 5 Working Days")

    # Generate AI actionable recommendation
    ai_summary = f"Detected {detected_category.replace('_', ' ').title()} incident. Automated routing assigned to {department}."
    if ai_severity_label in ("critical", "high"):
        ai_summary += f" High municipal priority flags detected ({critical_hits + high_hits} indicators). SLA target: {sla}."

    return {
        "category": detected_category,
        "confidence": round(confidence, 2),
        "severity": severity,
        "ai_severity_label": ai_severity_label,
        "urgency_score": urgency_score,
        "department": department,
        "estimated_sla": sla,
        "ai_summary": ai_summary
    }
