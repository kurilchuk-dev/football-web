"""Writes seasons calculated by the REAL server code, for the parity test of the browser calculation.

The simulator recalculates the table in the browser (src/features/standings/calculate.ts). To be
sure it follows the same rules as the server, `calculate.test.ts` compares it with the tables
that football-api's `calculate_standings()` produces for the seasons written here.

Run it after any change of the standings rules (in both places), from this repository:

    <football-api>/.venv/Scripts/python.exe scripts/standings_fixtures.py <path to football-api>

and commit the changed `src/features/standings/fixtures/standings-parity.json`.
"""

import json
import os
import random
import sys
from datetime import date, time
from pathlib import Path

NAMES = [
    "Темп", "Барс", "Бейкері", "Черкаські Козаки", "Штурм", "Autodoc", "Олімп", "Росава",
    "Молодь", "FC SV", "авангард", "Динамо", "Ятрань", "Зірка",
]  # fmt: skip


def main(api_path: str, out_path: str) -> None:
    sys.path.insert(0, api_path)
    os.environ["DJANGO_SETTINGS_MODULE"] = "config.settings"
    os.environ["DATABASE_URL"] = "sqlite://:memory:"
    os.environ.setdefault("SECRET_KEY", "fixtures")

    import django

    django.setup()
    from django.core.management import call_command

    call_command("migrate", verbosity=0)

    from matches.models import Match
    from standings.services import calculate_standings
    from teams.models import Team

    rng = random.Random(20261116)
    days = [date(2026, 11, d) for d in range(7, 22)]
    scenarios = []

    for index in range(40):
        Match.objects.all().delete()
        Team.objects.all().delete()

        count = rng.randint(3, 10)
        names = rng.sample(NAMES, count)
        teams = [
            Team.objects.create(name=name, is_our_team=(i == 0)) for i, name in enumerate(names)
        ]
        # Low scores and few distinct results make teams tie on points (and on the mini table).
        top_score = rng.choice([1, 2, 3, 5])
        played_share = rng.choice([0.0, 0.3, 0.6, 0.9, 1.0])

        pairs = [(h, a) for h in teams for a in teams if h is not a]  # a double round robin
        rng.shuffle(pairs)  # ids no longer follow the dates
        for home, away in pairs:
            played = rng.random() < played_share
            match_date = None if rng.random() < 0.15 else rng.choice(days)
            match_time = (
                None
                if match_date is None or rng.random() < 0.3
                else time(rng.choice([10, 12, 14, 16, 18]), rng.choice([0, 30]))
            )
            Match.objects.create(
                home_team=home,
                away_team=away,
                home_score=rng.randint(0, top_score) if played else None,
                away_score=rng.randint(0, top_score) if played else None,
                match_date=match_date,
                match_time=match_time,
                round=rng.randint(1, 22),
            )

        expected = [
            {
                "position": row["position"],
                "team": {
                    "id": row["team"]["id"],
                    "name": row["team"]["name"],
                    "is_our_team": row["team"]["is_our_team"],
                    "logo": None,
                },
                "played": row["played"],
                "won": row["won"],
                "drawn": row["drawn"],
                "lost": row["lost"],
                "goals_for": row["goals_for"],
                "goals_against": row["goals_against"],
                "goal_difference": row["goal_difference"],
                "points": row["points"],
                "form": row["form"],
            }
            for row in calculate_standings()
        ]
        scenarios.append(
            {
                "name": f"season {index + 1}: {count} teams, scores up to {top_score}",
                "teams": [
                    {"id": t.id, "name": t.name, "is_our_team": t.is_our_team, "logo": None}
                    for t in teams
                ],
                "matches": [
                    {
                        "id": m.id,
                        "home_id": m.home_team_id,
                        "away_id": m.away_team_id,
                        "home_score": m.home_score,
                        "away_score": m.away_score,
                        "date": m.match_date.isoformat() if m.match_date else None,
                        "time": m.match_time.strftime("%H:%M") if m.match_time else None,
                    }
                    for m in Match.objects.all().order_by("id")
                ],
                "expected": expected,
            }
        )

    Path(out_path).parent.mkdir(parents=True, exist_ok=True)
    Path(out_path).write_text(
        json.dumps(scenarios, ensure_ascii=False, separators=(",", ":")) + "\n",
        encoding="utf-8",
        newline="\n",
    )
    print(f"{len(scenarios)} seasons written to {out_path}")


if __name__ == "__main__":
    api = sys.argv[1] if len(sys.argv) > 1 else "../football-api"
    main(
        str(Path(api).resolve()),
        str(Path(__file__).resolve().parents[1] / "src/features/standings/fixtures/standings-parity.json"),
    )
