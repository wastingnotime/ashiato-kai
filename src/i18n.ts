import { translator, resolveTemplate } from "@solid-primitives/i18n";
import { createSignal } from "solid-js";

export type Locale = "pt-BR" | "en-US";
const preferenceKey = "ashiato-kai-locale";

const ptBR = {
  pageTitle: "Ashiato Kai — Caminhos de origem",
  pageDescription:
    "Pesquise registros da imigração japonesa no Brasil e descubra nomes, viagens e lugares de origem.",
  brandTagline: "caminhos de origem",
  navigation: "Navegação principal",
  search: "Pesquisar",
  statistics: "Estatísticas",
  language: "Idioma",
  footerTagline: "HISTÓRIAS QUE SE ENCONTRAM",
  footerCaution:
    "Os registros são pistas para pesquisa, não prova de parentesco.",
  back: "Voltar",
  loading: "Buscando registros...",
  loadError: "Não foi possível carregar os dados. Tente novamente.",
  validationError: "Confira os termos da pesquisa e tente novamente.",
  notRecorded: "Não consta",
  name: "Nome",
  surname: "Sobrenome",
  arrivalYear: "Ano de chegada",
  originPrefecture: "Província de origem",
  shipName: "Nome do navio",
  example: "Ex.: {{value}}",
  searchHelp:
    "Informe um nome ou sobrenome. Use os demais campos para refinar a busca.",
  searchNeedsName: "Informe pelo menos um nome ou sobrenome para começar.",
  searchRecords: "Buscar registros",
  clearFields: "Limpar campos",
  homeEyebrow: "MEMÓRIA DA IMIGRAÇÃO JAPONESA",
  homeTitleFirst: "Um nome pode abrir",
  homeTitleSecond: "muitos caminhos.",
  homeIntroduction:
    "Explore registros de pessoas que vieram do Japão ao Brasil. Encontre nomes, viagens e lugares de origem para seguir sua pesquisa.",
  artworkAlt:
    "Ashiato Kai: caligrafia japonesa, pegadas e paisagens do Japão e do Brasil",
  startSection: "01 / COMEÇAR",
  whoSearch: "Quem você procura?",
  searchIntroduction:
    "Pesquise pelo nome registrado nos documentos de imigração.",
  exploreSection: "02 / EXPLORAR",
  otherWays: "Outras formas de descobrir",
  surnames: "Sobrenomes",
  surnamesDescription:
    "Conheça os sobrenomes mais frequentes e suas grafias em japonês.",
  origins: "Lugares de origem",
  originsDescription: "Veja as províncias de origem registradas na base.",
  recordDialog: "Registro de {{name}}",
  recordEyebrow: "REGISTRO DE IMIGRAÇÃO",
  closeDetails: "Fechar detalhes",
  recordCaution:
    "Este registro é uma pista para sua pesquisa. Confira os detalhes com outras fontes antes de estabelecer uma ligação familiar.",
  recordData: "Dados do registro",
  romajiName: "Nome em romaji",
  japaneseName: "Nome em japonês",
  prefecture: "Província",
  ship: "Navio",
  departure: "Partida",
  arrival: "Chegada",
  destination: "Destino",
  farm: "Fazenda",
  travelGroup: "Grupo de viagem",
  groupCountOne: "{{count}} pessoa registrada no mesmo grupo de viagem",
  groupCountMany: "{{count}} pessoas registradas no mesmo grupo de viagem",
  groupCaution: "Viajar no mesmo grupo não indica, por si só, parentesco.",
  newSearch: "Nova pesquisa",
  resultsEyebrow: "RESULTADOS DA PESQUISA",
  resultsTitle: "Histórias encontradas.",
  resultsDescription: "Registros que correspondem aos termos pesquisados.",
  refineSearch: "Refinar pesquisa",
  hideFilters: "Ocultar",
  openFilters: "Abrir filtros",
  resultsCountOne: "{{count}} registro encontrado",
  resultsCountMany: "{{count}} registros encontrados",
  noResults: "Nenhum registro encontrado",
  noResultsHelp: "Tente outra grafia ou retire um dos filtros da pesquisa.",
  showMore: "Mostrar mais registros",
  resultsCaution:
    "Um nome semelhante não confirma identidade ou ancestralidade. Compare outras informações do registro.",
  statsEyebrow: "UM OLHAR SOBRE OS REGISTROS",
  statsTitle: "Histórias em números.",
  statsDescription:
    "Explore nomes e lugares registrados na imigração japonesa ao Brasil.",
  statsHeroEyebrow: "CADA REGISTRO GUARDA UM CAMINHO",
  statsHeroCount: "registros de imigrantes na base consultada",
  givenNames: "Nomes",
  givenNamesDescription: "Nomes próprios presentes nos registros",
  surnamesShortDescription: "Grafias e sobrenomes mais frequentes",
  prefectures: "Províncias",
  prefecturesDescription: "Lugares de origem no Japão",
  originEyebrow: "LUGARES DE ORIGEM",
  whereFrom: "De onde vieram?",
  viewAll: "Ver todas",
  recordsCount: "{{count}} registros",
  statsTopTen: "ESTATÍSTICAS / TOP 10",
  topTenLabel: "OS 10 MAIS FREQUENTES",
  filterList: "Filtrar esta lista",
  emptyTopTen: "Nada nesta lista",
  emptyTopTenHelp: "Experimente outro termo para filtrar o top 10.",
  statsCaution:
    "As contagens se referem aos registros desta base, não a todas as famílias ou pessoas de origem japonesa no Brasil.",
  backToCategory: "Voltar para {{category}}",
  detailEyebrow: "{{category}} / DETALHES",
  detailDescription: "Grafias e informações encontradas nos registros.",
  noData: "Nenhum dado encontrado",
  noDataHelp: "Confira a grafia e tente novamente.",
  recordedSpelling: "GRAFIA REGISTRADA",
  rankCount: "{{count}} registros · posição #{{rank}}",
  onMap: "NO MAPA",
  whereIs: "Onde fica {{name}}?",
  mapAlt: "Mapa da província",
  capital: "Capital",
  detailCaution:
    "Grafias semelhantes podem representar pessoas diferentes. Use estes dados como ponto de partida e confirme as informações com outras fontes.",
  notFoundEyebrow: "PÁGINA NÃO ENCONTRADA",
  notFoundTitle: "Este caminho não existe.",
  notFoundDescription: "Volte ao início para continuar sua pesquisa.",
  goHome: "Ir para o início",
};

const enUS: { [K in keyof typeof ptBR]: string } = {
  pageTitle: "Ashiato Kai — Paths to your origins",
  pageDescription:
    "Search Japanese immigration records in Brazil and discover names, journeys, and places of origin.",
  brandTagline: "paths to your origins",
  navigation: "Main navigation",
  search: "Search",
  statistics: "Statistics",
  language: "Language",
  footerTagline: "STORIES THAT CONNECT",
  footerCaution:
    "Records are research leads, not proof of a family relationship.",
  back: "Back",
  loading: "Searching records...",
  loadError: "Could not load the data. Please try again.",
  validationError: "Check your search terms and try again.",
  notRecorded: "Not recorded",
  name: "Given name",
  surname: "Surname",
  arrivalYear: "Arrival year",
  originPrefecture: "Prefecture of origin",
  shipName: "Ship name",
  example: "E.g. {{value}}",
  searchHelp:
    "Enter a given name or surname. Use the other fields to narrow your search.",
  searchNeedsName: "Enter at least a given name or surname to begin.",
  searchRecords: "Search records",
  clearFields: "Clear fields",
  homeEyebrow: "JAPANESE IMMIGRATION HISTORY",
  homeTitleFirst: "A name can open",
  homeTitleSecond: "many paths.",
  homeIntroduction:
    "Explore records of people who came from Japan to Brazil. Find names, journeys, and places of origin to continue your research.",
  artworkAlt:
    "Ashiato Kai artwork with Japanese calligraphy, footprints, and scenes from Japan and Brazil",
  startSection: "01 / BEGIN",
  whoSearch: "Who are you looking for?",
  searchIntroduction: "Search for the name recorded in immigration documents.",
  exploreSection: "02 / EXPLORE",
  otherWays: "Other ways to discover",
  surnames: "Surnames",
  surnamesDescription:
    "Explore common surnames and their recorded Japanese spellings.",
  origins: "Places of origin",
  originsDescription:
    "Explore the prefectures of origin recorded in the dataset.",
  recordDialog: "Record for {{name}}",
  recordEyebrow: "IMMIGRATION RECORD",
  closeDetails: "Close details",
  recordCaution:
    "This record is a research lead. Check its details against other sources before drawing a family connection.",
  recordData: "Record details",
  romajiName: "Name in Romaji",
  japaneseName: "Name in Japanese",
  prefecture: "Prefecture",
  ship: "Ship",
  departure: "Departure",
  arrival: "Arrival",
  destination: "Destination",
  farm: "Farm",
  travelGroup: "Travel group",
  groupCountOne: "{{count}} person recorded in the same travel group",
  groupCountMany: "{{count}} people recorded in the same travel group",
  groupCaution: "People in the same travel group are not necessarily related.",
  newSearch: "New search",
  resultsEyebrow: "SEARCH RESULTS",
  resultsTitle: "Stories found.",
  resultsDescription: "Records matching your search terms.",
  refineSearch: "Refine search",
  hideFilters: "Hide",
  openFilters: "Open filters",
  resultsCountOne: "{{count}} record found",
  resultsCountMany: "{{count}} records found",
  noResults: "No records found",
  noResultsHelp: "Try a different spelling or remove a search filter.",
  showMore: "Show more records",
  resultsCaution:
    "A similar name does not confirm identity or ancestry. Compare other details in the record.",
  statsEyebrow: "A VIEW OF THE RECORDS",
  statsTitle: "Stories in numbers.",
  statsDescription:
    "Explore names and places recorded for Japanese immigrants to Brazil.",
  statsHeroEyebrow: "EVERY RECORD HOLDS A PATH",
  statsHeroCount: "immigrant records in the dataset",
  givenNames: "Given names",
  givenNamesDescription: "Given names found in the records",
  surnamesShortDescription: "Common surnames and recorded spellings",
  prefectures: "Prefectures",
  prefecturesDescription: "Recorded places of origin in Japan",
  originEyebrow: "PLACES OF ORIGIN",
  whereFrom: "Where did they come from?",
  viewAll: "View all",
  recordsCount: "{{count}} records",
  statsTopTen: "STATISTICS / TOP 10",
  topTenLabel: "TEN MOST COMMON",
  filterList: "Filter this list",
  emptyTopTen: "Nothing in this list",
  emptyTopTenHelp: "Try another term to filter the top ten.",
  statsCaution:
    "Counts describe records in this dataset, not all families or people of Japanese origin in Brazil.",
  backToCategory: "Back to {{category}}",
  detailEyebrow: "{{category}} / DETAILS",
  detailDescription: "Recorded spellings and details found in the dataset.",
  noData: "No data found",
  noDataHelp: "Check the spelling and try again.",
  recordedSpelling: "RECORDED SPELLING",
  rankCount: "{{count}} records · rank #{{rank}}",
  onMap: "ON THE MAP",
  whereIs: "Where is {{name}}?",
  mapAlt: "Map of the prefecture",
  capital: "Capital",
  detailCaution:
    "Similar spellings may refer to different people. Use these records as a starting point and confirm details with other sources.",
  notFoundEyebrow: "PAGE NOT FOUND",
  notFoundTitle: "This path does not exist.",
  notFoundDescription: "Return to the start to continue your research.",
  goHome: "Go to start",
};

function preferredLocale(): Locale {
  try {
    const saved = localStorage.getItem(preferenceKey);
    if (saved === "pt-BR" || saved === "en-US") return saved;
  } catch {
    /* Storage can be unavailable in private contexts. */
  }
  for (const language of navigator.languages || [navigator.language]) {
    if (language.toLowerCase().startsWith("pt")) return "pt-BR";
    if (language.toLowerCase().startsWith("en")) return "en-US";
  }
  return "pt-BR";
}

const [locale, updateLocale] = createSignal<Locale>(preferredLocale());
const dictionaries = { "pt-BR": ptBR, "en-US": enUS };
const translate = translator(() => dictionaries[locale()], resolveTemplate);

export { locale };
export function setLocale(next: Locale) {
  updateLocale(next);
  try {
    localStorage.setItem(preferenceKey, next);
  } catch {
    /* Keep the current session's choice. */
  }
}
export function t(
  key: keyof typeof ptBR,
  params?: Record<string, string | number>,
): string {
  return translate(key, params) || ptBR[key];
}
export function formatCount(value: number): string {
  return new Intl.NumberFormat(locale()).format(value);
}
export function readable(value: string | number | undefined | null): string {
  if (value == null || value === "" || value === "NÃO CONSTA")
    return t("notRecorded");
  return String(value);
}
