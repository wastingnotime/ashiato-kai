import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  createUniqueId,
  For,
  onCleanup,
  Show,
} from "solid-js";
import { t } from "./i18n";

type Stroke = { shape: string; line: string }[];
async function loadCharacter(character: string): Promise<Stroke[]> {
  const response = await fetch(`/strokes/${character.codePointAt(0)}.json`);
  if (!response.ok) throw new Error("Character unavailable");
  const data = await response.json();
  if (!Array.isArray(data) || !data.length)
    throw new Error("Character unavailable");
  return data;
}

function CharacterPlayer(props: { character: string; onComplete: () => void }) {
  const id = createUniqueId();
  const [strokes, { refetch }] = createResource(
    () => props.character,
    loadCharacter,
  );
  const [step, setStep] = createSignal(0);
  createEffect(() => {
    if (strokes.loading) return;
    const unavailable = !!strokes.error;
    const complete = unavailable || step() >= (strokes()?.length ?? 0);
    const timer = window.setTimeout(
      () => (complete ? props.onComplete() : setStep((value) => value + 1)),
      complete ? 1500 : 900,
    );
    onCleanup(() => window.clearTimeout(timer));
  });
  return (
    <>
      <Show when={strokes.loading}>
        <p role="status">{t("strokeLoading")}</p>
      </Show>
      <Show when={strokes.error}>
        <p role="status">
          {t("strokeUnavailable", { character: props.character })}
        </p>
        <button type="button" onClick={() => refetch()}>
          {t("strokeRetry")}
        </button>
      </Show>
      <Show when={!strokes.loading && !strokes.error && strokes()}>
        {(data) => (
          <>
            <svg
              class="stroke-canvas"
              viewBox="0 0 1024 1024"
              role="img"
              aria-label={t("strokeImage", { character: props.character })}
            >
              <path d="M512 0V1024M0 512H1024" class="stroke-grid" />
              <For each={data()}>
                {(components, index) => (
                  <For each={components}>
                    {(component, componentIndex) => {
                      const clipId = `${id}-${index()}-${componentIndex()}`;
                      return (
                        <>
                          <defs>
                            <clipPath id={clipId}>
                              <path d={component.shape} />
                            </clipPath>
                          </defs>
                          <path
                            d={component.shape}
                            fill={index() < step() ? "currentColor" : "#ded7ca"}
                          />
                          <Show when={index() === step()}>
                            <path
                              class="stroke-drawing"
                              d={component.line}
                              clip-path={`url(#${clipId})`}
                              pathLength="3333"
                            />
                          </Show>
                        </>
                      );
                    }}
                  </For>
                )}
              </For>
            </svg>
            <p role="status" aria-live="off">
              {t("strokeProgress", { current: step(), total: data().length })}
            </p>
          </>
        )}
      </Show>
    </>
  );
}

export function StrokeOrder(props: { text: string }) {
  // Keep repeated characters: this is the recorded spelling, in writing order.
  const characters = createMemo(() =>
    Array.from(props.text).filter((character) =>
      /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(character),
    ),
  );
  const [selected, setSelected] = createSignal(0);
  const [revision, setRevision] = createSignal(0);
  const current = createMemo(() => ({
    character: characters()[selected()] || characters()[0],
    revision: revision(),
  }));
  const jump = (index: number) => {
    setSelected(index);
    setRevision((value) => value + 1);
  };
  createEffect(() => {
    props.text;
    jump(0);
  });
  return (
    <Show when={characters().length}>
      <section class="stroke-order" aria-label={t("strokeTitle")}>
        <h3>{t("strokeTitle")}</h3>
        <p>{t("strokeHelp")}</p>
        <div
          class="stroke-characters"
          role="group"
          aria-label={t("strokeSelect")}
        >
          <For each={characters()}>
            {(character, index) => (
              <button
                type="button"
                lang="ja"
                translate="no"
                aria-pressed={selected() === index()}
                onClick={() => jump(index())}
              >
                {character}
              </button>
            )}
          </For>
        </div>
        <Show when={current()} keyed>
          {(entry) => (
            <CharacterPlayer
              character={entry.character}
              onComplete={() => jump((selected() + 1) % characters().length)}
            />
          )}
        </Show>
        <small class="stroke-credit">
          <a href="https://github.com/parsimonhi/animCJK">AnimCJK</a> ·{" "}
          <a href="/strokes/README.md">Arphic / LGPL</a>
        </small>
      </section>
    </Show>
  );
}
