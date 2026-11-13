"""The condition manipulation must change only attribution/flags, nothing else."""

from __future__ import annotations

from pathlib import Path

import pytest

from epi import config
from epi.items import load_items
from epi.prompts import (
    Flag,
    SeatAnswer,
    attribution_labels,
    others_block,
    render_flags,
    round2_messages,
    seat_order,
)

ITEM = load_items(Path(__file__).resolve().parents[1] / "items" / "dev")[0]
SEATS = [p.seat for p in config.PANELISTS] + [config.CONFEDERATE_SEAT]


def _answers(with_flags: bool) -> dict[str, SeatAnswer]:
    flags = (Flag("capacity is 68 million litres per day", "contradicted"),) if with_flags else None
    return {s: SeatAnswer(s, f"answer from {s}", flags if with_flags else None) for s in SEATS}


def _user(attribution: str, verification: str = "NONE", seat: str = "gpt") -> str:
    answers = _answers(verification != "NONE")
    msgs = round2_messages(
        item=ITEM,
        own=answers[seat],
        attribution=attribution,
        verification=verification,
        answers=answers,
        order=seat_order(ITEM.id, seat, 0, SEATS),
        synthesis="facilitator summary" if attribution == "SYNTH" else None,
        labels=attribution_labels(attribution, config.PANELISTS, [config.CONFEDERATE_SEAT]),
    )
    return msgs[0]["content"] + "\n" + msgs[1]["content"]


def test_anon_reveals_no_model_names() -> None:
    text = _user("ANON")
    for p in config.PANELISTS:
        assert p.display_name not in text
    for labels in config.CONFEDERATE_LABELS.values():
        assert all(label not in text for label in labels)


@pytest.mark.parametrize("attribution", ["NAMED-HIGH", "NAMED-LOW"])
def test_named_shows_confederate_label_for_condition(attribution: str) -> None:
    text = _user(attribution)
    assert config.CONFEDERATE_LABELS[attribution][0] in text
    other = "NAMED-LOW" if attribution == "NAMED-HIGH" else "NAMED-HIGH"
    assert config.CONFEDERATE_LABELS[other][0] not in text


def test_named_never_shows_the_confederate_generator_model() -> None:
    assert "Mistral" not in _user("NAMED-HIGH")
    assert "mistral" not in _user("NAMED-HIGH")


def test_viewer_does_not_see_own_answer_among_others() -> None:
    answers = _answers(False)
    block = others_block("ANON", answers, seat_order(ITEM.id, "gpt", 0, SEATS), None)
    assert "answer from gpt" not in block
    assert block.count("--- Another panelist ---") == len(SEATS) - 1


def test_seat_order_is_identical_across_conditions_and_varies_by_rep() -> None:
    first = seat_order(ITEM.id, "gpt", 0, SEATS)
    assert first == seat_order(ITEM.id, "gpt", 0, SEATS)
    orders = {tuple(seat_order(ITEM.id, "gpt", rep, SEATS)) for rep in range(6)}
    assert len(orders) > 1


def test_synth_shows_summary_not_raw_answers() -> None:
    text = _user("SYNTH")
    assert "facilitator summary" in text
    assert "answer from claude" not in text


def test_flags_appear_only_with_verification() -> None:
    assert "Automated evidence check" not in _user("ANON", "NONE")
    assert "CONTRADICTED by the evidence packet" in _user("ANON", "ORC")


def test_render_flags_distinguishes_none_from_empty() -> None:
    assert render_flags(None) == ""
    assert "no problems found" in render_flags(())


def test_round2_user_message_differs_only_in_attribution_between_named_conditions() -> None:
    high = _user("NAMED-HIGH").replace(config.CONFEDERATE_LABELS["NAMED-HIGH"][0], "X")
    low = _user("NAMED-LOW").replace(config.CONFEDERATE_LABELS["NAMED-LOW"][0], "X")
    assert high == low
