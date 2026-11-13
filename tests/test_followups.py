"""Post-hoc follow-ups: confederate-only labels (CONF-*) and evidence-style flags (*-EV).
Existing conditions must render exactly as before, so frozen-run prompts are unchanged."""

from __future__ import annotations

from pathlib import Path

from epi import config
from epi.items import load_items
from epi.pipeline import RunSpec
from epi.prompts import (
    Flag,
    SeatAnswer,
    attribution_labels,
    render_flags,
    round2_messages,
)
from epi.verify import parse_orc_flags, parse_plain_ev_flags

ITEM = load_items(Path(__file__).resolve().parents[1] / "items" / "dev")[0]  # dev-01, E3 target
SPEC = RunSpec(n_wrong=3)


def _messages(attribution: str, verification: str = "NONE") -> str:
    flags = (
        (Flag("capacity is 68 million litres per day", "contradicted", "E3", ITEM.packet[2].text),)
        if verification != "NONE"
        else None
    )
    answers = {s: SeatAnswer(s, f"answer from {s}", flags) for s in SPEC.all_seats}
    labels = attribution_labels(attribution, SPEC.panelists, SPEC.confederate_seats)
    msgs = round2_messages(
        item=ITEM,
        own=answers["gpt"],
        attribution=attribution,
        verification=verification,
        answers=answers,
        order=SPEC.visible_others(ITEM.id, "gpt", 0),
        synthesis=None,
        labels=labels,
        include_evidence=False,
    )
    return msgs[0]["content"] + "\n" + msgs[1]["content"]


def test_conf_labels_name_only_confederates_and_not_the_viewer() -> None:
    text = _messages("CONF-HIGH")
    assert config.CONFEDERATE_LABELS["NAMED-HIGH"][0] in text
    assert all(p.display_name not in text for p in config.PANELS[config.DEFAULT_PANEL])
    assert not any(f"You are {p.display_name}" in text for p in SPEC.panelists)
    assert text.startswith("You are one of several AI analysts")
    assert "--- Another panelist ---" in text


def test_conf_low_uses_low_labels() -> None:
    text = _messages("CONF-LOW")
    assert config.CONFEDERATE_LABELS["NAMED-LOW"][0] in text
    assert config.CONFEDERATE_LABELS["NAMED-HIGH"][0] not in text


def test_quote_style_flags_render_exactly_as_in_the_frozen_run() -> None:
    flag = Flag("x was 16%", "contradicted", "E3", "some evidence")
    assert render_flags((flag,)) == (
        '[Automated evidence check:\n- CONTRADICTED by the evidence packet: "x was 16%"]'
    )


def test_evidence_style_attributes_quote_to_answer_and_states_evidence() -> None:
    text = _messages("ANON", "ORC-EV")
    assert 'This answer says: "capacity is 68 million litres per day"' in text
    assert f'The evidence packet (E3) says: "{ITEM.packet[2].text}"' in text
    assert "CONTRADICTED by the evidence packet:" not in text


def test_orc_evidence_taken_from_reasoning_only_when_requested() -> None:
    payload = {
        "results": [
            {
                "claim": "68 million",
                "label": "contradicted",
                "reasoning": "Chunk 01ABC, item E3, states 62 million.",
            }
        ]
    }
    assert parse_orc_flags(payload)[0].evidence_id is None
    flag = parse_orc_flags(payload, ITEM)[0]
    assert flag.evidence_id == "E3" and flag.evidence_text == ITEM.packet[2].text


def test_plain_ev_ignores_unknown_or_none_evidence_ids() -> None:
    raw = (
        '{"issues": [{"claim": "a", "verdict": "contradicted", "evidence_id": "e3"},'
        '{"claim": "b", "verdict": "contradicted", "evidence_id": "E99"},'
        '{"claim": "c", "verdict": "not_in_evidence", "evidence_id": "none"}]}'
    )
    flags = parse_plain_ev_flags(raw, ITEM)
    assert flags[0].evidence_id == "E3"
    assert flags[1].evidence_text is None and flags[2].evidence_text is None
