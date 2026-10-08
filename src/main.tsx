import { render } from "solid-js/web";
import { A, Route, Router } from "@solidjs/router";
import {
  createEffect,
  createMemo,
  createResource,
  createSignal,
  For,
  Show,
  Suspense,
} from "solid-js";
import type { JSX } from "solid-js";
import { useNavigate, useParams, useSearchParams } from "@solidjs/router";
import {
  ApiError,
  getGroup,
  nameStats,
  prefectureGeo,
  prefectureStats,
  searchImmigrants,
  searchKeys,
  surnameStats,
  topNames,
  topPrefectures,
  topSurnames,
  type GeoFeature,
  type Geolocation,
  type Immigrant,
  type SearchKey,
  type NameStat,
  type SurnameStat,
  type PrefectureStat,
} from "./api";
import { formatCount, locale, readable, setLocale, t } from "./i18n";
import "./style.css";
import { StrokeOrder } from "./StrokeOrder";

const labelKeys = {
  NameRomaji: "name",
  SurnameRomaji: "surname",
  Year: "arrivalYear",
  PrefectureName: "originPrefecture",
  ShipName: "shipName",
} as const;
const examples: Record<SearchKey, string> = {
  NameRomaji: "Tadao",
  SurnameRomaji: "Ueda",
  Year: "1955",
  PrefectureName: "Yamaguchi",
  ShipName: "America-Maru",
};

function Icon(props: {
  name:
    "search" | "chart" | "arrow" | "back" | "person" | "map" | "close" | "ship";
  size?: number;
}) {
  const paths: Record<string, JSX.Element> = {
    search: (
      <>
        <circle cx="10.8" cy="10.8" r="6.7" />
        <path d="m16 16 4.5 4.5" />
      </>
    ),
    chart: (
      <>
        <path d="M4 20V11h3v9M10.5 20V4h3v16M17 20v-7h3v7M2 20h20" />
      </>
    ),
    arrow: (
      <>
        <path d="M5 12h14m-6-6 6 6-6 6" />
      </>
    ),
    back: (
      <>
        <path d="m15 5-7 7 7 7" />
      </>
    ),
    person: (
      <>
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-4 3-6 7-6s7 2 7 6" />
      </>
    ),
    map: (
      <>
        <path d="m3 6 6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14m6-12v14" />
      </>
    ),
    close: (
      <>
        <path d="M5 5 19 19M19 5 5 19" />
      </>
    ),
    ship: (
      <>
        <path d="m3 15 9 3 9-3-3 5H6zM12 4v11M6 11h12l-2-5H8z" />
      </>
    ),
  };
  return (
    <svg
      width={props.size || 20}
      height={props.size || 20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      {paths[props.name]}
    </svg>
  );
}

function Layout(props: { children?: JSX.Element }) {
  return (
    <div class="app-shell">
      <header class="site-header">
        <A href="/" class="brand" aria-label={`Ashiato Kai — ${t("goHome")}`}>
          <span class="brand-mark" lang="ja" translate="no">
            足
          </span>
          <span>
            <strong>ashiato kai</strong>
            <small>{t("brandTagline")}</small>
          </span>
        </A>
        <nav class="desktop-nav" aria-label={t("navigation")}>
          <A href="/" end activeClass="active">
            {t("search")}
          </A>
          <A href="/statistics" activeClass="active">
            {t("statistics")}
          </A>
        </nav>
        <div class="header-actions">
          <span class="header-japanese" lang="ja" translate="no">
            足跡会
          </span>
          <div class="language-switch" role="group" aria-label={t("language")}>
            <button
              type="button"
              lang="pt-BR"
              aria-pressed={locale() === "pt-BR"}
              classList={{ active: locale() === "pt-BR" }}
              onClick={() => setLocale("pt-BR")}
            >
              PT
            </button>
            <button
              type="button"
              lang="en-US"
              aria-pressed={locale() === "en-US"}
              classList={{ active: locale() === "en-US" }}
              onClick={() => setLocale("en-US")}
            >
              EN
            </button>
          </div>
        </div>
      </header>
      <main>{props.children}</main>
      <footer class="site-footer">
        <span>
          ASHIATO KAI <i>·</i> {t("footerTagline")}
        </span>
        <span>{t("footerCaution")}</span>
      </footer>
      <nav class="mobile-nav" aria-label={t("navigation")}>
        <A href="/" end activeClass="active">
          <Icon name="search" size={21} />
          <span>{t("search")}</span>
        </A>
        <A href="/statistics" activeClass="active">
          <Icon name="chart" size={21} />
          <span>{t("statistics")}</span>
        </A>
      </nav>
    </div>
  );
}

function BackLink(props: { href: string; label?: string }) {
  return (
    <A class="back-link" href={props.href}>
      <Icon name="back" size={17} />
      {props.label || t("back")}
    </A>
  );
}
function Loading() {
  return (
    <div class="loading" role="status">
      <span class="spinner" />
      {t("loading")}
    </div>
  );
}
function ErrorBox(props: { error: unknown }) {
  return (
    <div class="message error" role="alert">
      {props.error instanceof ApiError ? t(props.error.code) : t("loadError")}
    </div>
  );
}
function Empty(props: { title: string; body: string }) {
  return (
    <div class="empty-state">
      <span class="empty-symbol" lang="ja" translate="no">
        探
      </span>
      <h3>{props.title}</h3>
      <p>{props.body}</p>
    </div>
  );
}

function SearchForm(props: { initial?: URLSearchParams; compact?: boolean }) {
  const navigate = useNavigate();
  const [values, setValues] = createSignal<Record<SearchKey, string>>(
    Object.fromEntries(
      searchKeys.map((key) => [key, props.initial?.get(key) || ""]),
    ) as Record<SearchKey, string>,
  );
  const [hasError, setHasError] = createSignal(false);
  createEffect(() => {
    const query = props.initial?.toString();
    if (query !== undefined)
      setValues(
        Object.fromEntries(
          searchKeys.map((key) => [
            key,
            new URLSearchParams(query).get(key) || "",
          ]),
        ) as Record<SearchKey, string>,
      );
  });
  const update = (key: SearchKey, value: string) =>
    setValues((old) => ({ ...old, [key]: value }));
  const submit = (event: SubmitEvent) => {
    event.preventDefault();
    const params = new URLSearchParams();
    for (const key of searchKeys) {
      const value = values()[key].trim();
      if (value) params.set(key, value);
    }
    if (!params.has("NameRomaji") && !params.has("SurnameRomaji")) {
      setHasError(true);
      return;
    }
    setHasError(false);
    navigate(`/search?${params.toString()}`);
  };
  return (
    <form
      class={`search-form ${props.compact ? "compact" : ""}`}
      onSubmit={submit}
    >
      <div class="field-grid">
        <For each={searchKeys}>
          {(key) => (
            <label class="field">
              <span>{t(labelKeys[key])}</span>
              <input
                value={values()[key]}
                onInput={(event) => update(key, event.currentTarget.value)}
                placeholder={t("example", { value: examples[key] })}
                maxlength="200"
                inputmode={key === "Year" ? "numeric" : "text"}
                autocomplete="off"
              />
            </label>
          )}
        </For>
      </div>
      <p class="form-help">{t("searchHelp")}</p>
      <Show when={hasError()}>
        <div class="form-error" role="alert">
          {t("searchNeedsName")}
        </div>
      </Show>
      <div class="form-actions">
        <button class="button primary" type="submit">
          <Icon name="search" size={19} />
          {t("searchRecords")}
          <Icon name="arrow" size={18} />
        </button>
        <button
          class="button text"
          type="button"
          onClick={() => {
            setValues(
              Object.fromEntries(searchKeys.map((key) => [key, ""])) as Record<
                SearchKey,
                string
              >,
            );
            setHasError(false);
          }}
        >
          {t("clearFields")}
        </button>
      </div>
    </form>
  );
}

function Home() {
  return (
    <Layout>
      <div class="page home-page">
        <section class="hero">
          <div class="hero-copy">
            <div class="eyebrow">
              <span class="eyebrow-dot" />
              {t("homeEyebrow")}
            </div>
            <h1>
              {t("homeTitleFirst")}
              <br />
              <em>{t("homeTitleSecond")}</em>
            </h1>
            <p>{t("homeIntroduction")}</p>
          </div>
          <div class="hero-art">
            <img
              src="/ak.jpeg"
              alt={t("artworkAlt")}
              width="1024"
              height="1024"
              fetchpriority="high"
            />
          </div>
        </section>
        <section class="search-section">
          <div class="section-heading">
            <span class="section-index">{t("startSection")}</span>
            <h2>{t("whoSearch")}</h2>
            <p>{t("searchIntroduction")}</p>
          </div>
          <div class="surface search-surface">
            <SearchForm />
          </div>
        </section>
        <section class="explore-section">
          <div class="section-heading">
            <span class="section-index">{t("exploreSection")}</span>
            <h2>{t("otherWays")}</h2>
          </div>
          <div class="explore-grid">
            <A href="/statistics/surnames" class="explore-card">
              <span class="explore-icon" lang="ja" translate="no">
                姓
              </span>
              <div>
                <h3>{t("surnames")}</h3>
                <p>{t("surnamesDescription")}</p>
              </div>
              <Icon name="arrow" />
            </A>
            <A href="/statistics/prefectures" class="explore-card">
              <span class="explore-icon">
                <Icon name="map" size={27} />
              </span>
              <div>
                <h3>{t("origins")}</h3>
                <p>{t("originsDescription")}</p>
              </div>
              <Icon name="arrow" />
            </A>
          </div>
        </section>
      </div>
    </Layout>
  );
}

function RecordDetail(props: { record: Immigrant; onClose: () => void }) {
  const [group] = createResource(() => props.record.groupID, getGroup);
  const fields = createMemo(
    () =>
      [
        [
          "romajiName",
          `${props.record.NameRomaji} ${props.record.SurnameRomaji}`,
        ],
        [
          "japaneseName",
          `${readable(props.record.SurnameKanji)} ${readable(props.record.NameKanji)}`,
        ],
        ["arrivalYear", props.record.Year],
        ["prefecture", props.record.PrefectureName],
        ["ship", props.record.ShipName],
        ["departure", props.record.DepartureDate],
        ["arrival", props.record.ArrivalDate],
        ["destination", props.record.Destination],
        ["farm", props.record.Farm],
      ] as const,
  );
  return (
    <div class="detail-overlay" onClick={props.onClose}>
      <section
        class="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={t("recordDialog", {
          name: `${props.record.NameRomaji} ${props.record.SurnameRomaji}`,
        })}
        onClick={(event) => event.stopPropagation()}
      >
        <div class="detail-top">
          <div>
            <span class="section-index">{t("recordEyebrow")}</span>
            <h2 translate="no">
              {props.record.NameRomaji} {props.record.SurnameRomaji}
            </h2>
            <p class="japanese-name" lang="ja" translate="no">
              {props.record.SurnameKanji} {props.record.NameKanji}
            </p>
          </div>
          <button
            class="icon-button"
            onClick={props.onClose}
            aria-label={t("closeDetails")}
          >
            <Icon name="close" />
          </button>
        </div>
        <div class="detail-content">
          <div class="detail-intro">
            <span class="detail-intro-icon">
              <Icon name="person" size={29} />
            </span>
            <p>{t("recordCaution")}</p>
          </div>
          <StrokeOrder
            text={`${props.record.SurnameKanji || ""}${props.record.NameKanji || ""}`}
          />
          <h3>{t("recordData")}</h3>
          <dl class="facts">
            <For each={fields()}>
              {([label, value]) => (
                <div>
                  <dt>{t(label)}</dt>
                  <dd
                    lang={label === "japaneseName" ? "ja" : undefined}
                    translate="no"
                  >
                    {readable(value)}
                  </dd>
                </div>
              )}
            </For>
          </dl>
          <h3>{t("travelGroup")}</h3>
          <Suspense fallback={<Loading />}>
            <Show when={group.error}>
              <ErrorBox error={group.error} />
            </Show>
            <Show when={group()}>
              {(data) => (
                <div class="group-card">
                  <p>
                    {t(
                      data().immigrants.length === 1
                        ? "groupCountOne"
                        : "groupCountMany",
                      { count: formatCount(data().immigrants.length) },
                    )}
                  </p>
                  <ul>
                    <For each={data().immigrants}>
                      {(person) => (
                        <li>
                          <strong translate="no">
                            {person.NameRomaji} {person.SurnameRomaji}
                          </strong>
                          <span lang="ja" translate="no">
                            {person.SurnameKanji} {person.NameKanji}
                          </span>
                        </li>
                      )}
                    </For>
                  </ul>
                  <small>{t("groupCaution")}</small>
                </div>
              )}
            </Show>
          </Suspense>
        </div>
      </section>
    </div>
  );
}

function Results() {
  const [search, setSearch] = useSearchParams();
  const [visibleCount, setVisibleCount] = createSignal(50);
  const [filtersOpen, setFiltersOpen] = createSignal(false);
  const params = createMemo(() => {
    const query = new URLSearchParams();
    for (const key of searchKeys) {
      const value = search[key];
      if (typeof value === "string" && value.trim()) query.set(key, value);
    }
    return query;
  });
  const [results] = createResource(
    () => params().toString(),
    (query) => searchImmigrants(new URLSearchParams(query)),
  );
  const selected = createMemo(() =>
    results()?.find((record) => record.immigrantID === Number(search.record)),
  );
  const closeDetail = () => setSearch({ record: undefined });
  return (
    <Layout>
      <div class="page results-page">
        <div class="page-heading">
          <BackLink href="/" label={t("newSearch")} />
          <span class="section-index">{t("resultsEyebrow")}</span>
          <h1>{t("resultsTitle")}</h1>
          <p>{t("resultsDescription")}</p>
        </div>
        <div class="results-layout">
          <aside class="surface filter-panel">
            <div class="aside-heading">
              <h2>{t("refineSearch")}</h2>
              <span class="filter-japanese" lang="ja" translate="no">
                検索
              </span>
              <button
                class="filter-toggle"
                type="button"
                aria-expanded={filtersOpen()}
                onClick={() => setFiltersOpen((value) => !value)}
              >
                {filtersOpen() ? t("hideFilters") : t("openFilters")}
              </button>
            </div>
            <div class={`filter-form ${filtersOpen() ? "open" : ""}`}>
              <SearchForm initial={params()} compact />
            </div>
          </aside>
          <section class="result-list">
            <Suspense fallback={<Loading />}>
              <Show when={results.error}>
                <ErrorBox error={results.error} />
              </Show>
              <Show when={results()}>
                {(data) => (
                  <>
                    <div class="result-count">
                      {t(
                        data().length === 1
                          ? "resultsCountOne"
                          : "resultsCountMany",
                        { count: formatCount(data().length) },
                      )}
                    </div>
                    <Show
                      when={data().length}
                      fallback={
                        <Empty
                          title={t("noResults")}
                          body={t("noResultsHelp")}
                        />
                      }
                    >
                      <div class="surface result-items">
                        <For each={data().slice(0, visibleCount())}>
                          {(record) => (
                            <button
                              class="result-row"
                              onClick={() =>
                                setSearch({
                                  record: String(record.immigrantID),
                                })
                              }
                            >
                              <span
                                class="result-avatar"
                                lang="ja"
                                translate="no"
                              >
                                {record.SurnameKanji?.[0] || "人"}
                              </span>
                              <span class="result-main">
                                <strong translate="no">
                                  {record.NameRomaji} {record.SurnameRomaji}
                                </strong>
                                <small translate="no">
                                  {record.Year} <i>·</i>{" "}
                                  {readable(record.PrefectureName)} <i>·</i>{" "}
                                  {readable(record.ShipName)}
                                </small>
                              </span>
                              <span
                                class="result-japanese"
                                lang="ja"
                                translate="no"
                              >
                                {record.SurnameKanji} {record.NameKanji}
                              </span>
                              <Icon name="arrow" size={18} />
                            </button>
                          )}
                        </For>
                      </div>
                      <Show when={data().length > visibleCount()}>
                        <button
                          class="load-more"
                          onClick={() => setVisibleCount((count) => count + 50)}
                        >
                          {t("showMore")} <Icon name="arrow" size={16} />
                        </button>
                      </Show>
                    </Show>
                    <p class="result-note">{t("resultsCaution")}</p>
                  </>
                )}
              </Show>
            </Suspense>
          </section>
        </div>
        <Show when={selected()}>
          {(record) => <RecordDetail record={record()} onClose={closeDetail} />}
        </Show>
      </div>
    </Layout>
  );
}

const categories = [
  {
    kind: "surnames",
    titleKey: "surnames",
    bodyKey: "surnamesShortDescription",
    glyph: "姓",
  },
  {
    kind: "names",
    titleKey: "givenNames",
    bodyKey: "givenNamesDescription",
    glyph: "名",
  },
  {
    kind: "prefectures",
    titleKey: "prefectures",
    bodyKey: "prefecturesDescription",
    glyph: "県",
  },
] as const;

function StatisticsHome() {
  const [prefectures] = createResource(topPrefectures);
  return (
    <Layout>
      <div class="page statistics-home">
        <div class="page-heading">
          <span class="section-index">{t("statsEyebrow")}</span>
          <h1>{t("statsTitle")}</h1>
          <p>{t("statsDescription")}</p>
        </div>
        <div class="stat-hero">
          <div>
            <span class="stat-hero-label">{t("statsHeroEyebrow")}</span>
            <strong>{formatCount(245677)}</strong>
            <p>{t("statsHeroCount")}</p>
          </div>
          <span lang="ja" translate="no">
            縁
          </span>
        </div>
        <div class="category-grid">
          <For each={categories}>
            {(category) => (
              <A href={`/statistics/${category.kind}`} class="category-card">
                <span class="category-glyph" lang="ja" translate="no">
                  {category.glyph}
                </span>
                <span class="category-text">
                  <strong>{t(category.titleKey)}</strong>
                  <small>{t(category.bodyKey)}</small>
                </span>
                <Icon name="arrow" />
              </A>
            )}
          </For>
        </div>
        <section class="preview-section">
          <div class="section-heading inline">
            <div>
              <span class="section-index">{t("originEyebrow")}</span>
              <h2>{t("whereFrom")}</h2>
            </div>
            <A href="/statistics/prefectures" class="text-link">
              {t("viewAll")} <Icon name="arrow" size={16} />
            </A>
          </div>
          <Suspense fallback={<Loading />}>
            <Show when={prefectures()}>
              {(items) => (
                <div class="surface preview-list">
                  <For each={items().slice(0, 5)}>
                    {(item) => (
                      <A
                        href={`/statistics/prefectures/${encodeURIComponent(item.PrefectureName)}`}
                      >
                        <span>{String(item.Rank).padStart(2, "0")}</span>
                        <strong translate="no">{item.PrefectureName}</strong>
                        <small>
                          {t("recordsCount", {
                            count: formatCount(item.Count),
                          })}
                        </small>
                        <Icon name="arrow" size={16} />
                      </A>
                    )}
                  </For>
                </div>
              )}
            </Show>
          </Suspense>
        </section>
      </div>
    </Layout>
  );
}

function StatList() {
  const route = useParams<{ kind: string }>();
  const kind = () => route.kind;
  const config = createMemo(() =>
    categories.find((item) => item.kind === kind()),
  );
  const [items] = createResource(kind, async (value) =>
    value === "names"
      ? topNames()
      : value === "surnames"
        ? topSurnames()
        : topPrefectures(),
  );
  const [filter, setFilter] = createSignal("");
  const filtered = createMemo(() =>
    (items() || []).filter((item) =>
      ("PrefectureName" in item
        ? item.PrefectureName
        : "SurnameRomaji" in item
          ? item.SurnameRomaji
          : item.NameRomaji
      )
        .toLowerCase()
        .includes(filter().toLowerCase()),
    ),
  );
  return (
    <Layout>
      <div class="page narrow-page">
        <div class="page-heading">
          <BackLink href="/statistics" label={t("statistics")} />
          <span class="section-index">{t("statsTopTen")}</span>
          <h1>
            {config() ? t(config()!.titleKey) : t("statistics")}
            <span class="accent-period">.</span>
          </h1>
          <p>{config() ? t(config()!.bodyKey) : ""}.</p>
        </div>
        <div class="list-toolbar">
          <span>{t("topTenLabel")}</span>
          <label>
            <Icon name="search" size={17} />
            <input
              value={filter()}
              onInput={(event) => setFilter(event.currentTarget.value)}
              placeholder={t("filterList")}
              aria-label={t("filterList")}
            />
          </label>
        </div>
        <Suspense fallback={<Loading />}>
          <Show when={items.error}>
            <ErrorBox error={items.error} />
          </Show>
          <Show when={items()}>
            <div class="surface ranking-list">
              <For each={filtered()}>
                {(item) => {
                  const name =
                    "PrefectureName" in item
                      ? item.PrefectureName
                      : "SurnameRomaji" in item
                        ? item.SurnameRomaji
                        : item.NameRomaji;
                  const japanese =
                    "SurnameKanji" in item
                      ? item.SurnameKanji
                      : "NameKanji" in item
                        ? item.NameKanji
                        : "";
                  return (
                    <A
                      href={`/statistics/${kind()}/${encodeURIComponent(name)}`}
                      class="ranking-row"
                    >
                      <span class="rank-number">
                        {String(item.Rank).padStart(2, "0")}
                      </span>
                      <span class="rank-name">
                        <strong translate="no">{name}</strong>
                        <small>
                          {t("recordsCount", {
                            count: formatCount(item.Count),
                          })}
                        </small>
                      </span>
                      <span class="rank-kanji" lang="ja" translate="no">
                        {japanese}
                      </span>
                      <Icon name="arrow" size={18} />
                    </A>
                  );
                }}
              </For>
              <Show when={!filtered().length}>
                <Empty title={t("emptyTopTen")} body={t("emptyTopTenHelp")} />
              </Show>
            </div>
          </Show>
        </Suspense>
        <p class="result-note">{t("statsCaution")}</p>
      </div>
    </Layout>
  );
}

function MapGraphic(props: { data: Geolocation }) {
  const paths = createMemo(() => {
    const feature = props.data.features.find(
      (item) =>
        item.geometry.type === "Polygon" ||
        item.geometry.type === "MultiPolygon",
    );
    if (!feature) return [];
    const polygons: number[][][][] =
      feature.geometry.type === "Polygon"
        ? [feature.geometry.coordinates]
        : feature.geometry.coordinates;
    const [minX, minY, maxX, maxY] = props.data.bbox;
    const scaleX = (x: number) => (800 * (x - minX)) / (maxX - minX);
    const scaleY = (y: number) => (480 * (maxY - y)) / (maxY - minY);
    return polygons.flatMap((polygon) =>
      polygon.map(
        (ring) =>
          ring
            .map(
              (point, index) =>
                `${index ? "L" : "M"}${scaleX(point[0]).toFixed(1)},${scaleY(point[1]).toFixed(1)}`,
            )
            .join(" ") + " Z",
      ),
    );
  });
  const capital = createMemo(() =>
    props.data.features.find(
      (item: GeoFeature) => item.geometry.type === "Point",
    ),
  );
  const marker = createMemo(() => {
    const point = capital()?.geometry.coordinates as number[] | undefined;
    if (!point) return undefined;
    const [minX, minY, maxX, maxY] = props.data.bbox;
    return {
      x: (800 * (point[0] - minX)) / (maxX - minX),
      y: (480 * (maxY - point[1])) / (maxY - minY),
    };
  });
  return (
    <div class="map-card">
      <svg viewBox="0 0 800 480" role="img" aria-label={t("mapAlt")}>
        <For each={paths()}>
          {(path) => (
            <path
              d={path}
              fill="#e7dfd0"
              stroke="#4b4843"
              stroke-width="1.5"
              fill-rule="evenodd"
            />
          )}
        </For>
        <Show when={marker()}>
          {(point) => (
            <>
              <circle
                cx={point().x}
                cy={point().y}
                r="10"
                fill="#c25c4a"
                opacity=".2"
              />
              <circle cx={point().x} cy={point().y} r="4" fill="#b94d3a" />
            </>
          )}
        </Show>
      </svg>
      <Show when={capital()}>
        {(feature) => (
          <div class="map-caption">
            {t("capital")} ·{" "}
            <span translate="no">{feature().properties.CapitalName}</span>{" "}
            <span lang="ja" translate="no">
              {feature().properties.CapitalNameJapanese}
            </span>
          </div>
        )}
      </Show>
    </div>
  );
}

function StatDetail() {
  const route = useParams<{ kind: string; term: string }>();
  const kind = () => route.kind;
  const term = () => decodeURIComponent(route.term);
  const categoryName = () =>
    t(
      kind() === "names"
        ? "givenNames"
        : kind() === "surnames"
          ? "surnames"
          : "prefectures",
    );
  const [stats] = createResource<
    (NameStat | SurnameStat | PrefectureStat)[],
    string
  >(
    () => `${kind()}:${term()}`,
    () =>
      kind() === "names"
        ? nameStats(term())
        : kind() === "surnames"
          ? surnameStats(term())
          : prefectureStats(term()),
  );
  const [geo] = createResource(
    () => (kind() === "prefectures" ? term() : null),
    (name) => prefectureGeo(name),
  );
  return (
    <Layout>
      <div class="page narrow-page">
        <div class="page-heading">
          <BackLink
            href={`/statistics/${kind()}`}
            label={t("backToCategory", {
              category: categoryName().toLowerCase(),
            })}
          />
          <span class="section-index">
            {t("detailEyebrow", { category: categoryName().toUpperCase() })}
          </span>
          <h1>
            <span translate="no">{term()}</span>
            <span class="accent-period">.</span>
          </h1>
          <p>{t("detailDescription")}</p>
        </div>
        <Suspense fallback={<Loading />}>
          <Show when={stats.error}>
            <ErrorBox error={stats.error} />
          </Show>
          <Show when={stats()}>
            {(data) => (
              <Show
                when={data().length}
                fallback={<Empty title={t("noData")} body={t("noDataHelp")} />}
              >
                <div class="variant-list">
                  <For each={data()}>
                    {(item) => (
                      <div class="variant-card">
                        <div class="variant-info">
                          <span>{t("recordedSpelling")}</span>
                          <strong translate="no">
                            {"PrefectureName" in item
                              ? item.PrefectureName
                              : "SurnameRomaji" in item
                                ? item.SurnameRomaji
                                : item.NameRomaji}
                          </strong>
                          <small>
                            {t("rankCount", {
                              count: formatCount(item.Count),
                              rank: formatCount(item.Rank),
                            })}
                          </small>
                        </div>
                        <Show
                          when={"SurnameKanji" in item || "NameKanji" in item}
                        >
                          <span class="variant-kanji" lang="ja" translate="no">
                            {"SurnameKanji" in item
                              ? item.SurnameKanji
                              : "NameKanji" in item
                                ? item.NameKanji
                                : ""}
                          </span>
                        </Show>
                        <StrokeOrder
                          text={
                            "SurnameKanji" in item
                              ? item.SurnameKanji
                              : "NameKanji" in item
                                ? item.NameKanji
                                : ""
                          }
                        />
                      </div>
                    )}
                  </For>
                </div>
              </Show>
            )}
          </Show>
        </Suspense>
        <Show when={kind() === "prefectures"}>
          <section class="geo-section">
            <div class="section-heading">
              <span class="section-index">{t("onMap")}</span>
              <h2>{t("whereIs", { name: term() })}</h2>
            </div>
            <Suspense fallback={<Loading />}>
              <Show when={geo()}>{(data) => <MapGraphic data={data()} />}</Show>
            </Suspense>
          </section>
        </Show>
        <div class="context-note">
          <span lang="ja" translate="no">
            大切なこと
          </span>
          <p>{t("detailCaution")}</p>
        </div>
      </div>
    </Layout>
  );
}

function NotFound() {
  return (
    <Layout>
      <div class="page narrow-page">
        <div class="page-heading">
          <span class="section-index">{t("notFoundEyebrow")}</span>
          <h1>{t("notFoundTitle")}</h1>
          <p>{t("notFoundDescription")}</p>
          <A href="/" class="button primary">
            {t("goHome")} <Icon name="arrow" />
          </A>
        </div>
      </div>
    </Layout>
  );
}

function AppRoot() {
  createEffect(() => {
    document.documentElement.lang = locale();
    document.title = t("pageTitle");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", t("pageDescription"));
  });
  return (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/search" component={Results} />
      <Route path="/statistics" component={StatisticsHome} />
      <Route path="/statistics/:kind" component={StatList} />
      <Route path="/statistics/:kind/:term" component={StatDetail} />
      <Route path="*" component={NotFound} />
    </Router>
  );
}

render(() => <AppRoot />, document.getElementById("root")!);
