"""Frozen experiment configuration. Changing anything here after the pilot is a
design change and must be logged in docs/design.md §11."""

from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
RESULTS_DIR = ROOT / "results"
CACHE_DIR = RESULTS_DIR / "cache"
LEDGER_PATH = RESULTS_DIR / "ledger.jsonl"
ORC_DIR = ROOT.parent / "orc-sprint"
ORC_ENV_FILE = ROOT.parent / "orc" / ".env"

BUDGET_CAP_USD = 75.0  # raised from 50 for post-hoc follow-ups (design §11)
BUDGET_MARGIN_USD = 0.75  # stop launching calls this close to the cap (concurrency overshoot)
MAX_CONCURRENCY = 8


@dataclass(frozen=True)
class Panelist:
    seat: str
    model: str
    display_name: str


PANELS: dict[str, tuple[Panelist, ...]] = {
    # Newest general model per lab, comparable tier (OpenRouter catalog, 13 Nov 2026).
    "frontier-2026-11": (
        Panelist("claude", "anthropic/claude-sonnet-5.5", "Claude Sonnet 5.5 (Anthropic)"),
        Panelist("gpt", "openai/gpt-6.1-terra", "GPT-6.1 Terra (OpenAI)"),
        Panelist("gemini", "google/gemini-4-carbon", "Gemini 4 Carbon (Google)"),
        Panelist("grok", "x-ai/grok-4.7", "Grok 4.7 (xAI)"),
        Panelist("deepseek", "deepseek/deepseek-v4.1-flash-1017", "DeepSeek V4.1 Flash (DeepSeek)"),
    ),
    # The generation behind the author's spring-2026 Delphi anecdotes (Grok 3 and o1 retired).
    "frontier-2026-early": (
        Panelist("claude", "anthropic/claude-opus-4.6", "Claude Opus 4.6 (Anthropic)"),
        Panelist("gpt", "openai/gpt-5", "GPT-5 (OpenAI)"),
        Panelist("gemini", "google/gemini-2.5-pro", "Gemini 2.5 Pro (Google)"),
        Panelist("grok", "x-ai/grok-4.3", "Grok 4.3 (xAI)"),
        Panelist("deepseek", "deepseek/deepseek-r1-0528", "DeepSeek R1 (DeepSeek)"),
    ),
    # Cheap models typical of cost-driven agent pipelines; four are the author's April panel.
    "small": (
        Panelist("llama", "meta-llama/llama-4-scout", "Llama 4 Scout (Meta)"),
        Panelist(
            "mistral", "mistralai/mistral-small-3.2-24b-instruct", "Mistral Small 3.2 (Mistral)"
        ),
        Panelist("gpt", "openai/gpt-4.1-mini", "GPT-4.1 Mini (OpenAI)"),
        Panelist("qwen", "qwen/qwen3-32b", "Qwen3 32B (Alibaba)"),
        Panelist("gemini", "google/gemini-2.5-flash", "Gemini 2.5 Flash (Google)"),
    ),
}
DEFAULT_PANEL = "frontier-2026-11"
PANELISTS = PANELS[DEFAULT_PANEL]

# Confederate seats in order of use; each viewer sees the first n_wrong of them.
CONFEDERATES: tuple[tuple[str, str], ...] = (
    ("confederate", "mistralai/mistral-large-4-0"),
    ("confederate2", "z-ai/glm-5.3-flash"),
    ("confederate3", "minimax/minimax-m3"),
)
CONFEDERATE_SEAT = CONFEDERATES[0][0]
CONFEDERATE_LABELS: dict[str, tuple[str, ...]] = {
    "NAMED-HIGH": (
        "Claude Fable 5.2 (Anthropic's most capable frontier model)",
        "GPT-6.1 Sol Pro (OpenAI's flagship model)",
        "Gemini 4 Argon (Google's flagship reasoning model)",
    ),
    "NAMED-LOW": (
        "Llama 3.2 1B (Meta's small 1-billion-parameter model)",
        "Qwen2.5 0.5B (Alibaba's 0.5-billion-parameter model)",
        "SmolLM2 360M (a 360-million-parameter model)",
    ),
}
VISIBLE_OTHERS = 5  # every viewer sees five other answers, whatever the wrong share

FACILITATOR_MODEL = "qwen/qwen3.8-max-0902"
PLAIN_CHECK_MODEL = "anthropic/claude-sonnet-5.5"
ORC_VERIFY_MODEL = "anthropic/claude-sonnet-5.5"
ORC_EXTRACT_MODEL = "anthropic/claude-haiku-5.5"
JUDGE_MODEL = "anthropic/claude-haiku-5.5"
CHECK_JUDGE_MODEL = "openai/gpt-6-luna-pro"

ATTRIBUTIONS = ("ANON", "NAMED-HIGH", "NAMED-LOW", "SYNTH")
VERIFICATIONS = ("NONE", "PLAIN", "ORC")

# All generation uses provider-default sampling: Claude 5.5 models reject explicit
# temperature, and one rule for every panelist avoids a model-by-temperature confound.
PANELIST_PARAMS = {"max_tokens": 4000, "reasoning": {"effort": "low"}}
SUPPORT_PARAMS = {"max_tokens": 4000, "reasoning": {"effort": "low"}}
JUDGE_PARAMS = {"max_tokens": 1500}

# $ per million tokens (OpenRouter catalog, 13 Nov 2026), used only when a response
# carries no provider-reported cost (ORC subprocess runs).
PRICES_PER_MTOK = {
    "anthropic/claude-sonnet-5.5": (2.00, 10.00),
    "anthropic/claude-haiku-5.5": (0.10, 0.50),
}
CONFEDERATE_MAX_ATTEMPTS = 3
