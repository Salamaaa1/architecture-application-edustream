"""Trace le graphique du benchmark a partir de tests/mutation/reports/benchmark.json."""
import json
import os

import matplotlib

matplotlib.use("Agg")
import matplotlib.pyplot as plt

root = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".."))
data = json.load(open(os.path.join(root, "tests/mutation/reports/benchmark.json"), encoding="utf-8"))
timing = json.load(open(os.path.join(root, "tests/mutation/reports/bench-timing.json"), encoding="utf-8"))

rows = data["files"] if "files" in data else data["rows"]
names = [os.path.basename(r["file"]) for r in rows]
custom = [r["custom"]["score"] for r in rows]
stryker = [r["stryker"]["score"] for r in rows]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(11, 4.2), gridspec_kw={"width_ratios": [3, 1.2]})
x = range(len(names))
w = 0.38
ax1.bar([i - w / 2 for i in x], custom, w, label="Moteur maison", color="#1f4e79")
ax1.bar([i + w / 2 for i in x], stryker, w, label="Stryker", color="#e07b00")
ax1.set_xticks(list(x))
ax1.set_xticklabels(names, rotation=25, ha="right", fontsize=8)
ax1.set_ylim(80, 101)
ax1.set_ylabel("Score de mutation (%)")
ax1.set_title("Score par fichier")
ax1.legend(loc="upper center", bbox_to_anchor=(0.5, -0.32), ncol=2, fontsize=8, frameon=False)
for i, (c, s) in enumerate(zip(custom, stryker)):
    ax1.text(i - w / 2, c + 0.2, f"{c:.1f}", ha="center", fontsize=7)
    ax1.text(i + w / 2, s + 0.2, f"{s:.1f}", ha="center", fontsize=7)

secs = [timing["customSec"], timing["strykerSec"]]
ax2.bar(["Moteur\nmaison", "Stryker"], secs, color=["#1f4e79", "#e07b00"])
ax2.set_ylabel("Durée (s)")
ax2.set_title("Durée totale")
for i, v in enumerate(secs):
    ax2.text(i, v + 15, f"{v} s", ha="center", fontsize=8)
ax2.set_ylim(0, max(secs) * 1.15)

for a in (ax1, ax2):
    a.spines[["top", "right"]].set_visible(False)
fig.tight_layout()
out = os.path.join(root, "fig_benchmark_scores.png")
fig.savefig(out, dpi=200)
print("ecrit", out)
