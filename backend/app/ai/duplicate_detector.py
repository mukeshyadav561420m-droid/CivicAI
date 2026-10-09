import math
import re


def haversine_distance_meters(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Computes geographical distance between two coordinate pairs in meters.
    """
    R = 6371000  # Earth radius in meters
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (math.sin(delta_phi / 2.0) ** 2 +
         math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2))
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))

    return R * c


def text_similarity(text1: str, text2: str) -> float:
    """
    Calculates Jaccard token similarity between two text snippets.
    """
    tokens1 = set(re.findall(r"\b\w{3,}\b", text1.lower()))
    tokens2 = set(re.findall(r"\b\w{3,}\b", text2.lower()))

    if not tokens1 or not tokens2:
        return 0.0

    intersection = tokens1.intersection(tokens2)
    union = tokens1.union(tokens2)
    return len(intersection) / len(union)


def find_potential_duplicates(
    target_title: str,
    target_description: str,
    target_lat: float,
    target_lon: float,
    target_type: str,
    existing_complaints: list,
    radius_meters: float = 250.0
) -> list:
    """
    Scans recent complaints to detect nearby duplicate civic reports.
    """
    duplicates = []
    target_combined = f"{target_title} {target_description}"

    for complaint in existing_complaints:
        # Only compare against unresolved complaints
        if getattr(complaint, "status", "") == "resolved":
            continue

        c_lat = getattr(complaint, "latitude", None)
        c_lon = getattr(complaint, "longitude", None)
        if c_lat is None or c_lon is None:
            continue

        distance = haversine_distance_meters(target_lat, target_lon, c_lat, c_lon)
        if distance <= radius_meters:
            c_combined = f"{getattr(complaint, 'title', '')} {getattr(complaint, 'description', '')}"
            sim = text_similarity(target_combined, c_combined)

            # Same issue category gives high boost to duplicate likelihood
            is_same_category = getattr(complaint, "issue_type", "") == target_type
            if is_same_category:
                sim += 0.35

            if distance < 50.0:  # extremely close geographically
                sim += 0.25

            confidence = min(0.99, sim)

            if confidence >= 0.45:
                duplicates.append({
                    "complaint_id": getattr(complaint, "id", None),
                    "title": getattr(complaint, "title", ""),
                    "status": getattr(complaint, "status", ""),
                    "issue_type": getattr(complaint, "issue_type", ""),
                    "distance_meters": round(distance, 1),
                    "confidence": round(confidence, 2),
                    "created_at": str(getattr(complaint, "created_at", ""))
                })

    # Sort by highest confidence
    duplicates.sort(key=lambda x: x["confidence"], reverse=True)
    return duplicates
