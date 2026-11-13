from __future__ import annotations

from pathlib import Path

import pytest

from epi import config
from epi.items import load_items
from epi.pipeline import RunSpec
from epi.prompts import SeatAnswer, attribution_labels, round2_messages

ITEM = load_items(Path(__file__).resolve().parents[1] / "items" / "dev")[0]


@pytest.mark.parametrize("n_wrong", [1, 2, 3])
def test_viewer_always_sees_five_others_including_every_confederate(n_wrong: int) -> None:
    spec = RunSpec(n_wrong=n_wrong)
    for viewer in spec.real_seats:
        visible = spec.visible_others(ITEM.id, viewer, rep=0)
        assert len(visible) == config.VISIBLE_OTHERS
        assert viewer not in visible
        assert set(spec.confederate_seats) <= set(visible)
        assert len(set(visible) - set(spec.confederate_seats)) == config.VISIBLE_OTHERS - n_wrong


def test_visible_set_does_not_depend_on_condition_fields() -> None:
    a = RunSpec(n_wrong=3, attributions=("ANON",), verifications=("NONE",))
    b = RunSpec(n_wrong=3, attributions=("NAMED-HIGH",), verifications=("ORC",))
    assert a.visible_others(ITEM.id, "gpt", 1) == b.visible_others(ITEM.id, "gpt", 1)


def test_synth_dropped_when_several_confederates() -> None:
    spec = RunSpec(n_wrong=3)
    assert "SYNTH" not in spec.attributions and spec.notes


def test_panels_have_distinct_seats_and_models() -> None:
    for name, panel in config.PANELS.items():
        assert len({p.seat for p in panel}) == len(panel), name
        assert len({p.model for p in panel}) == len(panel), name


def test_named_labels_give_each_confederate_a_different_name() -> None:
    spec = RunSpec(n_wrong=3)
    labels = attribution_labels("NAMED-HIGH", spec.panelists, spec.confederate_seats)
    confederate_names = [labels[s] for s in spec.confederate_seats]
    assert len(set(confederate_names)) == 3


def test_no_evidence_round2_omits_packet_but_keeps_question() -> None:
    spec = RunSpec()
    answers = {s: SeatAnswer(s, f"answer {s}", None) for s in spec.all_seats}
    messages = round2_messages(
        item=ITEM,
        own=answers["gpt"],
        attribution="ANON",
        verification="NONE",
        answers=answers,
        order=spec.visible_others(ITEM.id, "gpt", 0),
        synthesis=None,
        include_evidence=False,
    )
    user = messages[1]["content"]
    assert ITEM.question in user
    assert ITEM.packet[0].text not in user
    assert "not available" in messages[0]["content"]
