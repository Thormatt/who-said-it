"""Figure 2: spread by pressure regime (ANON, no check) for each panel.
Usage: uv run python -m epi.figures results/main"""

from __future__ import annotations

import sys
from pathlib import Path

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt  # noqa: E402
import numpy as np  # noqa: E402

from epi.analysis import cluster_bootstrap_ci, load_runs  # noqa: E402
from epi.report import PANEL_NAMES, PANEL_ORDER, _drop_excluded, excluded_items  # noqa: E402

REGIMES = {  # (evidence in round 2, wrong answers of 5) -> run name
    (True, 1): "b-w1",
    (False, 1): "b-w1-noev",
    (True, 3): "b-w3",
    (False, 3): "vulnerable",
}


def regime_grid(root: Path, out: Path) -> dict[str, np.ndarray]:
    frame = load_runs(root)
    frame = _drop_excluded(frame, excluded_items(frame))
    r2 = frame[
        (frame["kind"] == "round2")
        & (frame["attribution"] == "ANON")
        & (frame["verification"] == "NONE")
    ]
    fig, axes = plt.subplots(1, 3, figsize=(9, 3.4))
    grids = {}
    for ax, panel in zip(axes, PANEL_ORDER, strict=True):
        grid = np.zeros((2, 2))
        labels = [["", ""], ["", ""]]
        for (evidence, wrong), run in REGIMES.items():
            cell = r2[(r2["panel"] == panel) & (r2["run"] == run)]
            mean, low, high = cluster_bootstrap_ci(cell, "adopts")
            i, j = (0 if evidence else 1), (0 if wrong == 1 else 1)
            grid[i, j] = mean
            labels[i][j] = f"{mean:.0%}\n[{low:.0%}, {high:.0%}]"
        grids[panel] = grid
        ax.imshow(grid, cmap="Reds", vmin=0, vmax=0.45)
        for i in range(2):
            for j in range(2):
                ax.text(
                    j,
                    i,
                    labels[i][j],
                    ha="center",
                    va="center",
                    fontsize=9,
                    color="white" if grid[i, j] > 0.25 else "black",
                )
        ax.set_xticks([0, 1], ["1 of 5\nwrong", "3 of 5\nwrong"], fontsize=9)
        first = panel == PANEL_ORDER[0]
        ax.set_yticks(
            [0, 1], ["evidence\nshown", "evidence\nwithheld"] if first else ["", ""], fontsize=9
        )
        ax.set_title(PANEL_NAMES[panel], fontsize=10)
    fig.suptitle(
        "Spread of the planted error by pressure regime (anonymous, no check)", fontsize=10
    )
    fig.tight_layout()
    fig.savefig(out, dpi=200, bbox_inches="tight")
    plt.close(fig)
    return grids


if __name__ == "__main__":
    root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("results/main")
    print(regime_grid(root, root / "figures" / "regimes.png"))
