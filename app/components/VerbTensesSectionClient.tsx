"use client";

import { useCallback, useMemo, useState } from "react";
import { shuffle } from "../../src/application/shuffle";
import type { VerbTenseExercise } from "../../src/domain/verb-tenses";
import { RegisterPracticeFilters, type OrderMode } from "./FilterDrawerProvider";
import { VerbTensesPracticeClient } from "./VerbTensesPracticeClient";

export function VerbTensesSectionClient({ exercises, pathname }: {
  exercises: VerbTenseExercise[];
  pathname: string;
}) {
  const [form, setForm] = useState<string | undefined>();
  const [mode, setMode] = useState<OrderMode>("shuffled");
  const [reshuffleCount, setReshuffleCount] = useState(0);
  const options = useMemo(
    () => [...new Set(exercises.flatMap((exercise) => exercise.forms))],
    [exercises],
  );
  const filtered = useMemo(
    () => exercises.filter((exercise) => form === undefined || exercise.forms.some((item) => item === form)),
    [exercises, form],
  );
  const visible = useMemo(
    () => mode === "ordered" ? filtered : shuffle(filtered),
    // reshuffleCount forces a fresh shuffle on demand.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [filtered, mode, reshuffleCount],
  );
  const changeMode = useCallback((next: OrderMode) => {
    setMode(next);
    if (next === "shuffled") setReshuffleCount((count) => count + 1);
  }, []);
  const changeForm = useCallback((next?: string) => setForm(next), []);
  const order = useMemo(() => ({ mode, onModeChange: changeMode }), [mode, changeMode]);
  const formFilter = useMemo(() => ({ options, selected: form, onChange: changeForm }), [options, form, changeForm]);

  return (
    <>
      <RegisterPracticeFilters
        cards={[]}
        filter={{}}
        pathname={pathname}
        order={order}
        hideFilters
        formFilter={formFilter}
      />
      <VerbTensesPracticeClient
        key={`${form ?? "all"}:${mode}:${reshuffleCount}`}
        exercises={visible}
        accent="var(--accent-grammar)"
      />
    </>
  );
}
