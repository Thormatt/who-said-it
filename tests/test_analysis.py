from __future__ import annotations

import pandas as pd
import pytest

from epi.analysis import cluster_bootstrap_ci, holm, paired_contrast


def _frame(rates: dict[str, float], items: int = 10, per_item: int = 10) -> pd.DataFrame:
    rows = []
    for condition, rate in rates.items():
        for i in range(items):
            for j in range(per_item):
                rows.append(
                    {
                        "item": f"i{i}",
                        "seat": f"s{j}",
                        "rep": 0,
                        "verification": "NONE",
                        "attribution": condition,
                        "adopts": float(j < rate * per_item),
                    }
                )
    return pd.DataFrame(rows)


def test_bootstrap_ci_contains_mean_and_is_degenerate_at_zero() -> None:
    mean, low, high = cluster_bootstrap_ci(_frame({"A": 0.3}), "adopts")
    assert low <= mean <= high and mean == pytest.approx(0.3)
    assert cluster_bootstrap_ci(_frame({"A": 0.0}), "adopts") == (0.0, 0.0, 0.0)


def test_paired_contrast_detects_real_difference() -> None:
    result = paired_contrast(_frame({"A": 0.6, "B": 0.1}), "attribution", "A", "B")
    assert result["diff"] == pytest.approx(0.5)
    assert result["p"] < 0.01
    assert result["pairs"] == 100


def test_paired_contrast_null_when_identical() -> None:
    result = paired_contrast(_frame({"A": 0.3, "B": 0.3}), "attribution", "A", "B")
    assert result["diff"] == 0.0 and result["p"] == 1.0


def test_holm_is_monotone_and_capped() -> None:
    adjusted = holm({"h1": 0.01, "h2": 0.04, "h4": 0.03})
    assert adjusted["h1"] == pytest.approx(0.03)
    assert adjusted["h4"] == pytest.approx(0.06)
    assert adjusted["h2"] == pytest.approx(0.06)
    assert all(v <= 1 for v in holm({"a": 0.9, "b": 0.8}).values())
