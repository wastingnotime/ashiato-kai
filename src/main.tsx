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
  formatCount,
  getGroup,
  nameStats,
  prefectureGeo,
  prefectureStats,
  readable,
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
import "./style.css";

const labels: Record<SearchKey, string> = {
  NameRomaji: "Nome",
  SurnameRomaji: "Sobrenome",
  Year: "Ano de chegada",
  PrefectureName: "Província de origem",
  ShipName: "Nome do navio",
};
const placeholders: Record<SearchKey, string> = {
  NameRomaji: "Ex.: Tadao",
  SurnameRomaji: "Ex.: Ueda",
  Year: "Ex.: 1955",
  PrefectureName: "Ex.: Yamaguchi",
  ShipName: "Ex.: America-Maru",
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
        <A href="/" class="brand" aria-label="Ashiato Kai — início">
          <span class="brand-mark">足</span>
          <span>
            <strong>ashiato kai</strong>
            <small>caminhos de origem</small>
          </span>
        </A>
        <nav class="desktop-nav" aria-label="Navegação principal">
          <A href="/" end activeClass="active">
            Pesquisar
          </A>
          <A href="/statistics" activeClass="active">
            Estatísticas
          </A>
        </nav>
        <span class="header-japanese" lang="ja">
          足跡会
        </span>
      </header>
      <main>{props.children}</main>
      <footer class="site-footer">
        <span>
          ASHIATO KAI <i>·</i> HISTÓRIAS QUE SE ENCONTRAM
        </span>
        <span>
          Os registros são pistas para pesquisa, não prova de parentesco.
        </span>
      </footer>
      <nav class="mobile-nav" aria-label="Navegação principal">
        <A href="/" end activeClass="active">
          <Icon name="search" size={21} />
          <span>Pesquisar</span>
        </A>
        <A href="/statistics" activeClass="active">
          <Icon name="chart" size={21} />
          <span>Estatísticas</span>
        </A>
      </nav>
    </div>
  );
}

function BackLink(props: { href: string; label?: string }) {
  return (
    <A class="back-link" href={props.href}>
      <Icon name="back" size={17} />
      {props.label || "Voltar"}
    </A>
  );
}
function Loading() {
  return (
    <div class="loading" role="status">
      <span class="spinner" />
      Buscando registros...
    </div>
  );
}
function ErrorBox(props: { error: unknown }) {
  return (
    <div class="message error" role="alert">
      {props.error instanceof Error
        ? props.error.message
        : "Não foi possível carregar os dados."}
    </div>
  );
}
function Empty(props: { title: string; body: string }) {
  return (
    <div class="empty-state">
      <span class="empty-symbol">探</span>
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
  const [error, setError] = createSignal("");
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
      setError("Informe pelo menos um nome ou sobrenome para começar.");
      return;
    }
    setError("");
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
              <span>{labels[key]}</span>
              <input
                value={values()[key]}
                onInput={(event) => update(key, event.currentTarget.value)}
                placeholder={placeholders[key]}
                maxlength="200"
                inputmode={key === "Year" ? "numeric" : "text"}
                autocomplete="off"
              />
            </label>
          )}
        </For>
      </div>
      <p class="form-help">
        Informe um nome ou sobrenome. Use os demais campos para refinar a busca.
      </p>
      <Show when={error()}>
        <div class="form-error" role="alert">
          {error()}
        </div>
      </Show>
      <div class="form-actions">
        <button class="button primary" type="submit">
          <Icon name="search" size={19} />
          Buscar registros
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
            setError("");
          }}
        >
          Limpar campos
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
              MEMÓRIA DA IMIGRAÇÃO JAPONESA
            </div>
            <h1>
              Um nome pode abrir
              <br />
              <em>muitos caminhos.</em>
            </h1>
            <p>
              Explore registros de pessoas que vieram do Japão ao Brasil.
              Encontre nomes, viagens e lugares de origem para seguir sua
              pesquisa.
            </p>
          </div>
          <div class="hero-art" aria-hidden="true">
            <div class="sun" />
            <span class="kanji-one">足</span>
            <span class="kanji-two">跡</span>
            <span class="art-caption">ASHIATO · PEGADAS</span>
          </div>
        </section>
        <section class="search-section">
          <div class="section-heading">
            <span class="section-index">01 / COMEÇAR</span>
            <h2>Quem você procura?</h2>
            <p>Pesquise pelo nome registrado nos documentos de imigração.</p>
          </div>
          <div class="surface search-surface">
            <SearchForm />
          </div>
        </section>
        <section class="explore-section">
          <div class="section-heading">
            <span class="section-index">02 / EXPLORAR</span>
            <h2>Outras formas de descobrir</h2>
          </div>
          <div class="explore-grid">
            <A href="/statistics/surnames" class="explore-card">
              <span class="explore-icon">姓</span>
              <div>
                <h3>Sobrenomes</h3>
                <p>
                  Conheça os sobrenomes mais frequentes e suas grafias em
                  japonês.
                </p>
              </div>
              <Icon name="arrow" />
            </A>
            <A href="/statistics/prefectures" class="explore-card">
              <span class="explore-icon">
                <Icon name="map" size={27} />
              </span>
              <div>
                <h3>Lugares de origem</h3>
                <p>Veja as províncias de origem registradas na base.</p>
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
  const fields = [
    [
      "Nome em romaji",
      `${props.record.NameRomaji} ${props.record.SurnameRomaji}`,
    ],
    [
      "Nome em japonês",
      `${readable(props.record.NameKanji)} ${readable(props.record.SurnameKanji)}`,
    ],
    ["Ano de chegada", props.record.Year],
    ["Província", props.record.PrefectureName],
    ["Navio", props.record.ShipName],
    ["Partida", props.record.DepartureDate],
    ["Chegada", props.record.ArrivalDate],
    ["Destino", props.record.Destination],
    ["Fazenda", props.record.Farm],
  ] as const;
  return (
    <div class="detail-overlay" onClick={props.onClose}>
      <section
        class="detail-panel"
        role="dialog"
        aria-modal="true"
        aria-label={`Registro de ${props.record.NameRomaji} ${props.record.SurnameRomaji}`}
        onClick={(event) => event.stopPropagation()}
      >
        <div class="detail-top">
          <div>
            <span class="section-index">REGISTRO DE IMIGRAÇÃO</span>
            <h2>
              {props.record.NameRomaji} {props.record.SurnameRomaji}
            </h2>
            <p class="japanese-name" lang="ja">
              {props.record.SurnameKanji} {props.record.NameKanji}
            </p>
          </div>
          <button
            class="icon-button"
            onClick={props.onClose}
            aria-label="Fechar detalhes"
          >
            <Icon name="close" />
          </button>
        </div>
        <div class="detail-content">
          <div class="detail-intro">
            <span class="detail-intro-icon">
              <Icon name="person" size={29} />
            </span>
            <p>
              Este registro é uma pista para sua pesquisa. Confira os detalhes
              com outras fontes antes de estabelecer uma ligação familiar.
            </p>
          </div>
          <h3>Dados do registro</h3>
          <dl class="facts">
            <For each={fields}>
              {([label, value]) => (
                <div>
                  <dt>{label}</dt>
                  <dd>{readable(value)}</dd>
                </div>
              )}
            </For>
          </dl>
          <h3>Grupo de viagem</h3>
          <Suspense fallback={<Loading />}>
            <Show when={group.error}>
              <ErrorBox error={group.error} />
            </Show>
            <Show when={group()}>
              {(data) => (
                <div class="group-card">
                  <p>
                    {data().immigrants.length}{" "}
                    {data().immigrants.length === 1
                      ? "pessoa registrada"
                      : "pessoas registradas"}{" "}
                    no mesmo grupo de viagem
                  </p>
                  <ul>
                    <For each={data().immigrants}>
                      {(person) => (
                        <li>
                          <strong>
                            {person.NameRomaji} {person.SurnameRomaji}
                          </strong>
                          <span lang="ja">
                            {person.SurnameKanji} {person.NameKanji}
                          </span>
                        </li>
                      )}
                    </For>
                  </ul>
                  <small>
                    Viajar no mesmo grupo não indica, por si só, parentesco.
                  </small>
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
          <BackLink href="/" label="Nova pesquisa" />
          <span class="section-index">RESULTADOS DA PESQUISA</span>
          <h1>Histórias encontradas.</h1>
          <p>Registros que correspondem aos termos pesquisados.</p>
        </div>
        <div class="results-layout">
          <aside class="surface filter-panel">
            <div class="aside-heading">
              <h2>Refinar pesquisa</h2>
              <span>検索</span>
            </div>
            <SearchForm initial={params()} compact />
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
                      <strong>{formatCount(data().length)}</strong>{" "}
                      {data().length === 1
                        ? "registro encontrado"
                        : "registros encontrados"}
                    </div>
                    <Show
                      when={data().length}
                      fallback={
                        <Empty
                          title="Nenhum registro encontrado"
                          body="Tente outra grafia ou retire um dos filtros da pesquisa."
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
                              <span class="result-avatar" lang="ja">
                                {record.SurnameKanji?.[0] || "人"}
                              </span>
                              <span class="result-main">
                                <strong>
                                  {record.NameRomaji} {record.SurnameRomaji}
                                </strong>
                                <small>
                                  {record.Year} <i>·</i>{" "}
                                  {readable(record.PrefectureName)} <i>·</i>{" "}
                                  {readable(record.ShipName)}
                                </small>
                              </span>
                              <span class="result-japanese" lang="ja">
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
                          Mostrar mais registros <Icon name="arrow" size={16} />
                        </button>
                      </Show>
                    </Show>
                    <p class="result-note">
                      Um nome semelhante não confirma identidade ou
                      ancestralidade. Compare outras informações do registro.
                    </p>
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
    title: "Sobrenomes",
    body: "Grafias e sobrenomes mais frequentes",
    glyph: "姓",
  },
  {
    kind: "names",
    title: "Nomes",
    body: "Nomes próprios presentes nos registros",
    glyph: "名",
  },
  {
    kind: "prefectures",
    title: "Províncias",
    body: "Lugares de origem no Japão",
    glyph: "県",
  },
];

function StatisticsHome() {
  const [prefectures] = createResource(topPrefectures);
  return (
    <Layout>
      <div class="page statistics-home">
        <div class="page-heading">
          <span class="section-index">UM OLHAR SOBRE OS REGISTROS</span>
          <h1>Histórias em números.</h1>
          <p>
            Explore nomes e lugares registrados na imigração japonesa ao Brasil.
          </p>
        </div>
        <div class="stat-hero">
          <div>
            <span class="stat-hero-label">CADA REGISTRO GUARDA UM CAMINHO</span>
            <strong>245.677</strong>
            <p>registros de imigrantes na base consultada</p>
          </div>
          <span lang="ja">縁</span>
        </div>
        <div class="category-grid">
          <For each={categories}>
            {(category) => (
              <A href={`/statistics/${category.kind}`} class="category-card">
                <span class="category-glyph" lang="ja">
                  {category.glyph}
                </span>
                <span class="category-text">
                  <strong>{category.title}</strong>
                  <small>{category.body}</small>
                </span>
                <Icon name="arrow" />
              </A>
            )}
          </For>
        </div>
        <section class="preview-section">
          <div class="section-heading inline">
            <div>
              <span class="section-index">LUGARES DE ORIGEM</span>
              <h2>De onde vieram?</h2>
            </div>
            <A href="/statistics/prefectures" class="text-link">
              Ver todas <Icon name="arrow" size={16} />
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
                        <strong>{item.PrefectureName}</strong>
                        <small>{formatCount(item.Count)} registros</small>
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
          <BackLink href="/statistics" label="Estatísticas" />
          <span class="section-index">ESTATÍSTICAS / TOP 10</span>
          <h1>
            {config()?.title || "Estatísticas"}
            <span class="accent-period">.</span>
          </h1>
          <p>{config()?.body}.</p>
        </div>
        <div class="list-toolbar">
          <span>OS 10 MAIS FREQUENTES</span>
          <label>
            <Icon name="search" size={17} />
            <input
              value={filter()}
              onInput={(event) => setFilter(event.currentTarget.value)}
              placeholder="Filtrar esta lista"
              aria-label="Filtrar esta lista"
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
                        <strong>{name}</strong>
                        <small>{formatCount(item.Count)} registros</small>
                      </span>
                      <span class="rank-kanji" lang="ja">
                        {japanese}
                      </span>
                      <Icon name="arrow" size={18} />
                    </A>
                  );
                }}
              </For>
              <Show when={!filtered().length}>
                <Empty
                  title="Nada nesta lista"
                  body="Experimente outro termo para filtrar o top 10."
                />
              </Show>
            </div>
          </Show>
        </Suspense>
        <p class="result-note">
          As contagens se referem aos registros desta base, não a todas as
          famílias ou pessoas de origem japonesa no Brasil.
        </p>
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
      <svg viewBox="0 0 800 480" role="img" aria-label="Mapa da província">
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
            Capital · {feature().properties.CapitalName}{" "}
            <span lang="ja">{feature().properties.CapitalNameJapanese}</span>
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
  const title = () =>
    kind() === "names"
      ? "Nome"
      : kind() === "surnames"
        ? "Sobrenome"
        : "Província";
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
            label={`Voltar para ${title().toLowerCase()}s`}
          />
          <span class="section-index">{title().toUpperCase()} / DETALHES</span>
          <h1>
            {term()}
            <span class="accent-period">.</span>
          </h1>
          <p>Grafias e informações encontradas nos registros.</p>
        </div>
        <Suspense fallback={<Loading />}>
          <Show when={stats.error}>
            <ErrorBox error={stats.error} />
          </Show>
          <Show when={stats()}>
            {(data) => (
              <Show
                when={data().length}
                fallback={
                  <Empty
                    title="Nenhum dado encontrado"
                    body="Confira a grafia e tente novamente."
                  />
                }
              >
                <div class="variant-list">
                  <For each={data()}>
                    {(item) => (
                      <div class="variant-card">
                        <div class="variant-info">
                          <span>GRAFIA REGISTRADA</span>
                          <strong>
                            {"PrefectureName" in item
                              ? item.PrefectureName
                              : "SurnameRomaji" in item
                                ? item.SurnameRomaji
                                : item.NameRomaji}
                          </strong>
                          <small>
                            {formatCount(item.Count)} registros <i>·</i> posição
                            #{formatCount(item.Rank)}
                          </small>
                        </div>
                        <Show
                          when={"SurnameKanji" in item || "NameKanji" in item}
                        >
                          <span class="variant-kanji" lang="ja">
                            {"SurnameKanji" in item
                              ? item.SurnameKanji
                              : "NameKanji" in item
                                ? item.NameKanji
                                : ""}
                          </span>
                        </Show>
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
              <span class="section-index">NO MAPA</span>
              <h2>Onde fica {term()}?</h2>
            </div>
            <Suspense fallback={<Loading />}>
              <Show when={geo()}>{(data) => <MapGraphic data={data()} />}</Show>
            </Suspense>
          </section>
        </Show>
        <div class="context-note">
          <span>大切なこと</span>
          <p>
            Grafias semelhantes podem representar pessoas diferentes. Use estes
            dados como ponto de partida e confirme as informações com outras
            fontes.
          </p>
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
          <span class="section-index">PÁGINA NÃO ENCONTRADA</span>
          <h1>Este caminho não existe.</h1>
          <p>Volte ao início para continuar sua pesquisa.</p>
          <A href="/" class="button primary">
            Ir para o início <Icon name="arrow" />
          </A>
        </div>
      </div>
    </Layout>
  );
}

render(
  () => (
    <Router>
      <Route path="/" component={Home} />
      <Route path="/search" component={Results} />
      <Route path="/statistics" component={StatisticsHome} />
      <Route path="/statistics/:kind" component={StatList} />
      <Route path="/statistics/:kind/:term" component={StatDetail} />
      <Route path="*" component={NotFound} />
    </Router>
  ),
  document.getElementById("root")!,
);
