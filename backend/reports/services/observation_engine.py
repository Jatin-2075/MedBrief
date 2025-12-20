def generate_observations(vitals_comparison: list) -> list:
    """
    Generate short, human-readable observations
    from vitals comparison table.
    """

    if not vitals_comparison:
        return []

    observations = []
    seen = set()

    for item in vitals_comparison:
        vital = item.get("vital")
        status = item.get("status")

        if not vital or vital in seen:
            continue

        if status == "High":
            observations.append(
                f"{vital} is higher than the normal range."
            )

        elif status == "Low":
            observations.append(
                f"{vital} is lower than the normal range."
            )

        elif status == "Abnormal":
            observations.append(
                f"{vital} result is abnormal."
            )

        seen.add(vital)

    # Safety: limit number of observations
    return observations[:6]
