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

function CharacterPlayer(props: { character: string }) {
  const id = createUniqueId();
  const [strokes, { refetch }] = createResource(
    () => props.character,
    loadCharacter,
  );
  const [step, setStep] = createSignal(0);
  const [playing, setPlaying] = createSignal(false);
  createEffect(() => {
    props.character;
    setPlaying(false);
    setStep(0);
  });
  createEffect(() => {
    if (!playing()) return;
    if (step() >= (strokes()?.length ?? 0)) {
      setPlaying(false);
      return;
    }
    const timer = window.setTimeout(() => setStep((value) => value + 1), 900);
    onCleanup(() => window.clearTimeout(timer));
  });
  const move = (next: number) => {
    setPlaying(false);
    setStep(next);
  };
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
                          <Show when={playing() && index() === step()}>
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
            <p role="status" aria-live={playing() ? "off" : "polite"}>
              {t("strokeProgress", { current: step(), total: data().length })}
            </p>
            <div class="stroke-controls">
              <button
                type="button"
                disabled={step() === 0}
                onClick={() => move(step() - 1)}
              >
                {t("strokePrevious")}
              </button>
              <button
                type="button"
                onClick={() => {
                  if (playing()) {
                    setPlaying(false);
                    return;
                  }
                  if (step() === data().length) setStep(0);
                  setPlaying(true);
                }}
              >
                {t(
                  playing()
                    ? "strokePause"
                    : step() === data().length
                      ? "strokeReplay"
                      : "strokePlay",
                )}
              </button>
              <button
                type="button"
                disabled={step() === data().length}
                onClick={() => move(step() + 1)}
              >
                {t("strokeNext")}
              </button>
              <button type="button" onClick={() => move(0)}>
                {t("strokeReset")}
              </button>
            </div>
          </>
        )}
      </Show>
    </>
  );
}

export function StrokeOrder(props: { text: string }) {
  const characters = createMemo(() => [
    ...new Set(
      Array.from(props.text).filter((character) =>
        /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(
          character,
        ),
      ),
    ),
  ]);
  const [open, setOpen] = createSignal(false);
  const [selected, setSelected] = createSignal("");
  const current = () =>
    characters().includes(selected()) ? selected() : characters()[0];
  return (
    <Show when={characters().length}>
      <details
        class="stroke-order"
        onToggle={(event) => setOpen(event.currentTarget.open)}
      >
        <summary>{t("strokeTitle")}</summary>
        <Show when={open()}>
          <p>{t("strokeHelp")}</p>
          <div
            class="stroke-characters"
            role="group"
            aria-label={t("strokeSelect")}
          >
            <For each={characters()}>
              {(character) => (
                <button
                  type="button"
                  lang="ja"
                  translate="no"
                  aria-pressed={current() === character}
                  onClick={() => setSelected(character)}
                >
                  {character}
                </button>
              )}
            </For>
          </div>
          <Show when={current()} keyed>
            {(character) => <CharacterPlayer character={character} />}
          </Show>
          <small class="stroke-credit">
            <a href="https://github.com/parsimonhi/animCJK">AnimCJK</a> ·{" "}
            <a href="/strokes/README.md">Arphic / LGPL</a>
          </small>
        </Show>
      </details>
    </Show>
  );
}
