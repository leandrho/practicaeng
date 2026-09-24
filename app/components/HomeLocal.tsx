"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  getPracticeStorageBackend,
  loadPracticeState,
} from "../../src/infrastructure/ui/practice-storage";
import {
  homeRouteLabel,
  selectHomeState,
  type HomeSummary,
} from "../../src/infrastructure/ui/home-state";

/**
 * Región local de la portada (SPEC 33, paso 2).
 *
 * Lee las sesiones solo después del montaje para no desincronizar el render
 * del servidor: el primer render coincide con el SSR (reserva estable) y el
 * contenido local aparece tras hidratar. Sin `localStorage`, degrada a
 * estado vacío sin interrumpir la experiencia.
 */
export function HomeLocal() {
  const [summary, setSummary] = useState<HomeSummary | null>(null);

  // Lee el almacenamiento tras el montaje para no desincronizar el SSR:
  // el primer render coincide con el servidor (reserva) y el contenido
  // local aparece en una microtarea posterior, suscrito al montaje.
  useEffect(() => {
    let cancelled = false;
    function load() {
      try {
        const stored = loadPracticeState(getPracticeStorageBackend());
        if (!cancelled) {
          setSummary(selectHomeState(stored));
        }
      } catch {
        if (!cancelled) {
          setSummary(
            selectHomeState({
              version: 1,
              sessions: {},
              lastRoute: null,
              evaluations: {},
            }),
          );
        }
      }
    }
    queueMicrotask(load);
    return () => {
      cancelled = true;
    };
  }, []);

  // Reserva estable mientras se lee el almacenamiento: mismo HTML en SSR y
  // primer render cliente, sin desajustes de hidratación.
  if (summary === null) {
    return (
      <div
        className="home-local home-local--loading"
        aria-busy="true"
        aria-label="Loading saved progress"
      />
    );
  }

  if (!summary.hasLocalData) {
    return null;
  }

  const lastLabel =
    summary.lastSessionRoute === null ? null : homeRouteLabel(summary.lastSessionRoute);
  const continueLabel =
    summary.continueRoute === null ? null : homeRouteLabel(summary.continueRoute);

  return (
    <div className="home-local" aria-live="polite">
      {summary.continueRoute !== null ? (
        <Link className="btn btn--primary home-hero__continue" href={summary.continueRoute}>
          Continue: {continueLabel}
        </Link>
      ) : null}
      <section className="home-local__summary" aria-label="Saved progress on this device">
        <h2 className="home-local__title">Saved on this device</h2>
        <ul className="home-local__list">
          {lastLabel !== null ? (
            <li>
              <span>Last session:</span>{" "}
              <strong>
                {summary.lastSessionRoute !== null ? (
                  <Link href={summary.lastSessionRoute}>{lastLabel}</Link>
                ) : (
                  lastLabel
                )}
              </strong>{" "}
              <span className="home-local__meta">
                · {summary.lastSessionPending}{" "}
                {summary.lastSessionPending === 1 ? "pending" : "pending"}
              </span>
            </li>
          ) : null}
          <li>
            <span>Difficult items:</span>{" "}
            <strong>
              {summary.difficultCount}{" "}
              {summary.difficultCount === 1 ? "item" : "items"}
            </strong>
          </li>
        </ul>
        {summary.difficultCount > 0 ? (
          <Link
            className="home-local__review"
            href={summary.continueRoute ?? "/mixed"}
          >
            Review difficulties
          </Link>
        ) : null}
      </section>
    </div>
  );
}
