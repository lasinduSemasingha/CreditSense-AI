"""
run_all.py  —  CreditSense-AI Unified Backend Launcher
=======================================================

Starts all four backend services as separate child processes, each from its
own working directory so that relative model-file paths resolve correctly.

Services
--------
  ┌──────────────────────────────────────────────────────────────────────┐
  │  Service                      │  Folder            │  Port           │
  ├──────────────────────────────────────────────────────────────────────┤
  │  Credit Default Risk          │  Kaveesha/         │  8000           │
  │  Impairment & ECL Prediction  │  Lasindu/          │  8001           │
  │  Branch Performance Hybrid    │  Manuji/Branch/    │  8002           │
  │  Customer Branch Prediction   │  Manuji/Customer/  │  8003           │
  └──────────────────────────────────────────────────────────────────────┘

Usage
-----
  # From the repo root:
  python backend/run_all.py

  # Or from inside the backend/ folder:
  python run_all.py

  # Disable auto-restart on crash:
  python run_all.py --no-restart

  # Enable uvicorn --reload (dev mode, not recommended with large pkl files):
  python run_all.py --reload
"""

import os
import sys
import time
import signal
import argparse
import subprocess

# ---------------------------------------------------------------------------
# Resolve the backend/ directory regardless of where this script is invoked
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

SERVICES = [
    {
        "name":   "Credit Default Risk Prediction",
        "module": "api:app",
        "cwd":    os.path.join(BASE_DIR, "Kaveesha"),
        "port":   8000,
        "host":   "0.0.0.0",
    },
    {
        "name":   "Impairment & ECL Prediction",
        "module": "main:app",
        "cwd":    os.path.join(BASE_DIR, "Lasindu"),
        "port":   8001,
        "host":   "0.0.0.0",
    },
    {
        "name":   "Branch Performance Hybrid",
        "module": "main:app",
        "cwd":    os.path.join(BASE_DIR, "Manuji", "Branch"),
        "port":   8002,
        "host":   "0.0.0.0",
    },
    {
        "name":   "Customer Branch Prediction",
        "module": "api:app",
        "cwd":    os.path.join(BASE_DIR, "Manuji", "Customer"),
        "port":   8003,
        "host":   "0.0.0.0",
    },
]


def _build_cmd(svc: dict, reload: bool) -> list[str]:
    cmd = [
        sys.executable, "-m", "uvicorn",
        svc["module"],
        "--host", svc["host"],
        "--port", str(svc["port"]),
    ]
    if reload:
        cmd.append("--reload")
    return cmd


def _start(svc: dict, reload: bool) -> subprocess.Popen:
    return subprocess.Popen(
        _build_cmd(svc, reload),
        cwd=svc["cwd"],
        # Inherit the parent's stdout/stderr so all logs appear in one terminal.
        # Each service prefixes its own log lines with the port number (uvicorn
        # default), making them easy to distinguish.
    )


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Start all CreditSense-AI backend services.",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__,
    )
    parser.add_argument(
        "--no-restart",
        action="store_true",
        help="Do not automatically restart a service if it crashes.",
    )
    parser.add_argument(
        "--reload",
        action="store_true",
        help="Pass --reload to uvicorn (hot-reload on code changes, dev only).",
    )
    args = parser.parse_args()

    processes: list[dict] = []

    # ── Banner ──────────────────────────────────────────────────────────────
    print()
    print("=" * 68)
    print("   CreditSense-AI  —  Starting all backend services")
    print("=" * 68)

    # ── Start each service ──────────────────────────────────────────────────
    for svc in SERVICES:
        try:
            proc = _start(svc, args.reload)
            processes.append({"svc": svc, "proc": proc})
            print(
                f"  [OK]  {svc['name']:<38} "
                f"http://{svc['host']}:{svc['port']}"
            )
        except Exception as exc:
            print(f"  [FAIL] {svc['name']:<37} {exc}")
        # Slight stagger so each service can bind its port before the next starts
        time.sleep(0.4)

    print("=" * 68)
    docs_info = "  Swagger docs: " + "  |  ".join(
        f":{p['svc']['port']}/docs" for p in processes
    )
    print(docs_info)
    print("  Press Ctrl+C to stop all services.")
    print("=" * 68)
    print()

    # ── Shutdown handler ────────────────────────────────────────────────────
    def _shutdown(sig=None, frame=None) -> None:
        print("\n[run_all] Shutting down …", flush=True)
        for entry in processes:
            entry["proc"].terminate()
        for entry in processes:
            try:
                entry["proc"].wait(timeout=10)
            except subprocess.TimeoutExpired:
                entry["proc"].kill()
                entry["proc"].wait()
        print("[run_all] All services stopped.", flush=True)
        sys.exit(0)

    signal.signal(signal.SIGINT, _shutdown)
    signal.signal(signal.SIGTERM, _shutdown)

    # ── Watch-loop — optionally restart crashed services ────────────────────
    while True:
        for entry in processes:
            ret = entry["proc"].poll()
            if ret is None:
                continue  # still running

            if args.no_restart:
                print(
                    f"[run_all] ⚠  '{entry['svc']['name']}' exited "
                    f"(code {ret}). Not restarting (--no-restart).",
                    flush=True,
                )
                entry["proc"] = None  # mark as permanently stopped
            else:
                print(
                    f"[run_all] ⚠  '{entry['svc']['name']}' exited "
                    f"(code {ret}). Restarting in 3 s …",
                    flush=True,
                )
                time.sleep(3)
                try:
                    entry["proc"] = _start(entry["svc"], args.reload)
                    print(
                        f"[run_all] ✓  '{entry['svc']['name']}' restarted "
                        f"on port {entry['svc']['port']}.",
                        flush=True,
                    )
                except Exception as exc:
                    print(
                        f"[run_all] ✗  Could not restart "
                        f"'{entry['svc']['name']}': {exc}",
                        flush=True,
                    )

        time.sleep(5)


if __name__ == "__main__":
    main()
