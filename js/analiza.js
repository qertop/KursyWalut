/**
 * KursyWalut - podstrona analiza.html: wskaźniki statystyczne, główny wykres
 * szeregu czasowego (Chart.js) oraz porównywarka dwóch walut.
 * Wymaga wcześniejszego załadowania js/data.js (kursy, nazwyWalut, listaWalut, pobierzKursyWaluty).
 */

// Opisy rodzajów notowania używane w tytułach i podpisach
const OPISY_RODZAJU_ANALIZY = {
  sredni: "Oficjalne kursy średnie NBP (Tabela A)",
  kupno: "Kursy kupna NBP (Tabela C)",
  sprzedaz: "Kursy sprzedaży NBP (Tabela C)",
  spread: "Spread walutowy NBP (Tabela C)"
};

// Bieżące ustawienia analizy
const stanAnalizy = {
  zakresDni: 30,
  typWykresu: "line"
};

// Bieżąca instancja głównego wykresu Chart.js
let wykresGlowny = null;

/**
 * Formatuje kwotę w PLN: waluty o małym kursie (np. JPY) z 6 miejscami po przecinku, pozostałe z 4.
 * @param {number} wartosc - kwota w PLN
 * @param {number} skala - kurs średni waluty, decyduje o liczbie miejsc po przecinku
 * @returns {string} np. "4.4070 zł" albo "—", gdy brak wartości
 */
function formatujZl(wartosc, skala) {
  if (typeof wartosc !== "number" || isNaN(wartosc)) {
    return "—";
  }
  return wartosc.toFixed(skala < 0.1 ? 6 : 4) + " zł";
}

/**
 * Formatuje zmianę procentową ze znakiem, np. "+1.25%".
 * @param {number} procent - zmiana w procentach
 * @returns {string} sformatowany tekst
 */
function formatujProcent(procent) {
  return (procent >= 0 ? "+" : "") + procent.toFixed(2) + "%";
}

/**
 * Zamienia datę "RRRR-MM-DD" na zapis "DD.MM.RRRR".
 * @param {string} data - data "RRRR-MM-DD"
 * @returns {string} np. "13.11.2026"
 */
function dataKropkami(data) {
  const czesci = data.split("-");
  return czesci[2] + "." + czesci[1] + "." + czesci[0];
}

/**
 * Zwraca wartość wybranego rodzaju notowania z rekordu. Spread liczy jako sprzedaż - kupno.
 * @param {Object} rekord - rekord z data.js
 * @param {string} rodzaj - "sredni", "kupno", "sprzedaz" albo "spread"
 * @returns {number|null} wartość albo null, gdy brak danych
 */
function wartoscRekordu(rekord, rodzaj) {
  if (rodzaj === "spread") {
    if (typeof rekord.kupno !== "number" || typeof rekord.sprzedaz !== "number") {
      return null;
    }
    return rekord.sprzedaz - rekord.kupno;
  }
  return typeof rekord[rodzaj] === "number" ? rekord[rodzaj] : null;
}

/**
 * Zwraca notowania waluty z ostatnich N dni kalendarzowych (licząc od ostatniego notowania).
 * @param {string} waluta - kod waluty, np. "EUR"
 * @param {number} dni - długość okresu w dniach
 * @returns {Array<Object>} rekordy posortowane rosnąco po dacie
 */
function notowaniaZOkresu(waluta, dni) {
  const notowania = pobierzKursyWaluty(waluta);
  if (notowania.length === 0) {
    return [];
  }
  // Liczymy w UTC, żeby wynik nie zależał od strefy czasowej przeglądarki
  const czesci = notowania[notowania.length - 1].data.split("-").map(Number);
  const koniec = new Date(Date.UTC(czesci[0], czesci[1] - 1, czesci[2] - dni));
  const granica = koniec.toISOString().slice(0, 10);
  return notowania.filter(function (rekord) { return rekord.data > granica; });
}

/**
 * Liczy statystyki szeregu wartości: min, max (z datami), średnią, zmianę i rozstęp.
 * @param {Array<Object>} notowania - rekordy z data.js
 * @param {string} rodzaj - rodzaj notowania (patrz wartoscRekordu)
 * @returns {Object|null} statystyki albo null, gdy brak wartości
 */
function policzStatystyki(notowania, rodzaj) {
  const punkty = notowania
    .map(function (rekord) { return { data: rekord.data, wartosc: wartoscRekordu(rekord, rodzaj) }; })
    .filter(function (punkt) { return punkt.wartosc !== null; });
  if (punkty.length === 0) {
    return null;
  }
  let min = punkty[0];
  let max = punkty[0];
  let suma = 0;
  punkty.forEach(function (punkt) {
    if (punkt.wartosc < min.wartosc) { min = punkt; }
    if (punkt.wartosc > max.wartosc) { max = punkt; }
    suma += punkt.wartosc;
  });
  const pierwszy = punkty[0];
  const ostatni = punkty[punkty.length - 1];
  const srednia = suma / punkty.length;
  return {
    liczba: punkty.length,
    min: min,
    max: max,
    srednia: srednia,
    pierwszy: pierwszy,
    ostatni: ostatni,
    zmiana: ostatni.wartosc - pierwszy.wartosc,
    zmianaProcent: (ostatni.wartosc - pierwszy.wartosc) / pierwszy.wartosc * 100,
    rozstep: max.wartosc - min.wartosc,
    rozstepProcent: (max.wartosc - min.wartosc) / srednia * 100
  };
}

/**
 * Wypełnia listę wyboru kodami walut z data.js.
 * @param {string} id - id elementu select
 * @param {string} domyslna - kod waluty zaznaczonej na starcie
 */
function wypelnijListeAnalizy(id, domyslna) {
  const lista = document.getElementById(id);
  if (!lista) {
    return;
  }
  lista.textContent = "";
  listaWalut().forEach(function (kod) {
    const opcja = document.createElement("option");
    opcja.value = kod;
    opcja.textContent = kod + " - " + nazwyWalut[kod];
    opcja.selected = kod === domyslna;
    lista.appendChild(opcja);
  });
}

/**
 * Wpisuje tekst do elementu wskazanego selektorem (jeśli istnieje).
 * @param {string} selektor - selektor CSS
 * @param {string} tekst - nowa treść
 */
function ustawTekst(selektor, tekst) {
  const element = document.querySelector(selektor);
  if (element) {
    element.textContent = tekst;
  }
}

/**
 * Ustawia na odznace zmiany tekst i kolor (wzrost/spadek).
 * @param {HTMLElement|null} odznaka - element .odznaka-zmiany
 * @param {number} procent - zmiana w procentach
 */
function ustawOdznake(odznaka, procent) {
  if (!odznaka) {
    return;
  }
  odznaka.textContent = formatujProcent(procent);
  odznaka.classList.toggle("odznaka-wzrost", procent >= 0);
  odznaka.classList.toggle("odznaka-spadek", procent < 0);
}

/**
 * Aktualizuje karty wskaźników (min, max, średnia, zmiana, rozstęp) dla wybranej waluty.
 * @param {string} waluta - kod waluty
 * @param {string} rodzaj - rodzaj notowania
 * @param {Object|null} stat - wynik policzStatystyki()
 * @param {number} skala - kurs średni waluty (do liczby miejsc po przecinku)
 */
function odswiezWskazniki(waluta, rodzaj, stat, skala) {
  ustawTekst("#naglowek-wskaznikow", "Kluczowe wskaźniki statystyczne (" + waluta + " / PLN)");
  const podtytul = document.querySelector(".sekcja-wskazniki .sekcja-podtytul");

  if (!stat) {
    ["#wskaznik-min", "#wskaznik-max", "#wskaznik-srednia", "#wskaznik-zmiana", "#wskaznik-rozstep"].forEach(function (id) {
      ustawTekst(id, "brak danych");
    });
    if (podtytul) { podtytul.textContent = "Brak notowań w wybranym okresie"; }
    return;
  }

  if (podtytul) {
    podtytul.textContent = "Podsumowanie wartości z " + stat.liczba + " notowań (" +
      dataKropkami(stat.pierwszy.data) + " – " + dataKropkami(stat.ostatni.data) + ")";
  }

  ustawTekst("#wskaznik-min", formatujZl(stat.min.wartosc, skala));
  ustawTekst("#wskaznik-max", formatujZl(stat.max.wartosc, skala));
  ustawTekst("#wskaznik-srednia", formatujZl(stat.srednia, skala));
  ustawTekst("#wskaznik-rozstep", formatujZl(stat.rozstep, skala));

  const karty = document.querySelectorAll(".siatka-kart-wskaznikow .karta-wskaznika");
  const opisy = [
    "Najniższa wartość (" + dataKropkami(stat.min.data) + " r.)",
    "Najwyższa wartość (" + dataKropkami(stat.max.data) + " r.)",
    "Średnia z " + stat.liczba + " notowań",
    "",
    "Zmienność w okresie: " + stat.rozstepProcent.toFixed(2) + "%"
  ];
  if (rodzaj === "spread") {
    opisy[3] = stat.zmiana >= 0 ? "Spread wzrósł w okresie" : "Spread zmalał w okresie";
  } else {
    opisy[3] = (stat.zmiana >= 0 ? "Osłabienie PLN względem " : "Umocnienie PLN względem ") + waluta;
  }
  karty.forEach(function (karta, indeks) {
    const opis = karta.querySelector(".wskaznik-opis");
    if (opis && opisy[indeks]) {
      opis.textContent = opisy[indeks];
    }
  });

  const zmiana = document.getElementById("wskaznik-zmiana");
  if (zmiana) {
    zmiana.textContent = (stat.zmiana >= 0 ? "+" : "-") + formatujZl(Math.abs(stat.zmiana), skala);
    zmiana.classList.toggle("kolor-wzrost", stat.zmiana >= 0);
    zmiana.classList.toggle("kolor-spadek", stat.zmiana < 0);
    const karta = zmiana.closest(".karta-wskaznika");
    ustawOdznake(karta ? karta.querySelector(".odznaka-zmiany") : null, stat.zmianaProcent);
  }
}

/**
 * Rysuje główny wykres szeregu czasowego wybranej waluty.
 * Typy: "line" (liniowy), "area" (obszarowy) i "bar" (słupkowy).
 * @param {string} waluta - kod waluty
 * @param {string} rodzaj - rodzaj notowania
 * @param {Array<Object>} notowania - rekordy z wybranego okresu
 * @param {number} skala - kurs średni waluty (do liczby miejsc po przecinku)
 */
function narysujWykresGlowny(waluta, rodzaj, notowania, skala) {
  ustawTekst("#tytul-karty-wykresu", "Wykres szeregu czasowego: " + waluta + " / PLN");
  const podtytul = document.querySelector(".wykres-glowny-podtytul");
  if (podtytul) {
    podtytul.textContent = notowania.length
      ? OPISY_RODZAJU_ANALIZY[rodzaj] + " za okres " + dataKropkami(notowania[0].data) + " – " +
        dataKropkami(notowania[notowania.length - 1].data) + " r."
      : "Brak notowań w wybranym okresie";
  }

  const plotno = document.getElementById("wykres-glowny");
  if (!plotno || typeof Chart === "undefined") {
    return;
  }

  const style = getComputedStyle(document.documentElement);
  const kolorGlowny = style.getPropertyValue("--kolor-glowny").trim() || "#1d4ed8";
  const kolorTekstu = style.getPropertyValue("--kolor-tekst").trim() || "#14213b";
  const kolorSiatki = style.getPropertyValue("--kolor-obramowanie").trim() || "#dce3ee";
  const slupkowy = stanAnalizy.typWykresu === "bar";
  const obszarowy = stanAnalizy.typWykresu === "area";

  if (wykresGlowny) {
    wykresGlowny.destroy();
  }
  wykresGlowny = new Chart(plotno, {
    type: slupkowy ? "bar" : "line",
    data: {
      labels: notowania.map(function (rekord) { return dataKropkami(rekord.data).slice(0, 5); }),
      datasets: [{
        label: waluta + "/PLN",
        data: notowania.map(function (rekord) { return wartoscRekordu(rekord, rodzaj); }),
        borderColor: kolorGlowny,
        // Przezroczystość wypełnienia: 33 = ok. 20% w zapisie szesnastkowym
        backgroundColor: slupkowy || obszarowy ? kolorGlowny + "33" : kolorGlowny,
        fill: obszarowy,
        borderWidth: 2,
        pointRadius: notowania.length > 40 ? 0 : 3,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: function (kontekst) {
              return formatujZl(kontekst.parsed.y, skala);
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: kolorTekstu }, grid: { color: kolorSiatki } },
        y: {
          beginAtZero: false,
          ticks: { color: kolorTekstu, callback: function (wartosc) { return formatujZl(wartosc, skala); } },
          grid: { color: kolorSiatki }
        }
      }
    }
  });
}

/**
 * Odczytuje ustawienia analizy i odświeża wskaźniki oraz główny wykres.
 */
function odswiezAnalize() {
  const waluta = document.getElementById("analiza-waluta").value;
  const rodzaj = document.getElementById("analiza-rodzaj").value;
  const notowania = notowaniaZOkresu(waluta, stanAnalizy.zakresDni);
  const skala = notowania.length ? notowania[notowania.length - 1].sredni : 1;
  const stat = policzStatystyki(notowania, rodzaj);

  odswiezWskazniki(waluta, rodzaj, stat, skala);
  narysujWykresGlowny(waluta, rodzaj, notowania, skala);
}

/**
 * Tworzy komórkę tabeli porównania z tekstem (opcjonalnie pogrubionym albo jako odznaka zmiany).
 * @param {string} tekst - zawartość
 * @param {string} rodzajKomorki - "zwykla", "pogrubiona" albo "odznaka"
 * @param {number} procent - zmiana w procentach (tylko dla odznaki)
 * @returns {HTMLTableCellElement} gotowa komórka
 */
function utworzKomorkePorownania(tekst, rodzajKomorki, procent) {
  const td = document.createElement("td");
  td.className = "komorka-liczba";
  if (rodzajKomorki === "pogrubiona") {
    const pogrubienie = document.createElement("strong");
    pogrubienie.textContent = tekst;
    td.appendChild(pogrubienie);
  } else if (rodzajKomorki === "odznaka") {
    const odznaka = document.createElement("span");
    odznaka.className = "odznaka-zmiany";
    ustawOdznake(odznaka, procent);
    td.appendChild(odznaka);
  } else {
    td.textContent = tekst;
  }
  return td;
}

/**
 * Liczy parametry jednej waluty do porównywarki w wybranym okresie.
 * @param {string} waluta - kod waluty
 * @returns {Object|null} parametry albo null, gdy brak danych
 */
function parametryPorownania(waluta) {
  const notowania = notowaniaZOkresu(waluta, stanAnalizy.zakresDni);
  const stat = policzStatystyki(notowania, "sredni");
  if (!stat) {
    return null;
  }
  const spready = policzStatystyki(notowania, "spread");
  return {
    skala: stat.ostatni.wartosc,
    biezacy: stat.ostatni.wartosc,
    srednia: stat.srednia,
    rozstep: stat.rozstep,
    rozstepProcent: stat.rozstepProcent,
    sredniSpread: spready ? spready.srednia : null,
    dynamika: stat.zmianaProcent,
    liczba: stat.liczba
  };
}

/**
 * Odświeża tabelę porównania dwóch walut wybranych w porównywarce.
 */
function odswiezPorownanie() {
  const tabela = document.querySelector(".tabela-porownania");
  if (!tabela) {
    return;
  }
  const kodA = document.getElementById("porownaj-waluta-a").value;
  const kodB = document.getElementById("porownaj-waluta-b").value;
  const a = parametryPorownania(kodA);
  const b = parametryPorownania(kodB);

  const naglowki = tabela.querySelectorAll("thead th");
  if (naglowki.length === 3) {
    naglowki[1].textContent = kodA;
    naglowki[2].textContent = kodB;
  }

  const liczba = Math.max(a ? a.liczba : 0, b ? b.liczba : 0);
  const wiersze = [
    { etykieta: "Kurs bieżący NBP", pole: "biezacy", typ: "pogrubiona" },
    { etykieta: "Średnia z okresu (" + liczba + " notowań)", pole: "srednia", typ: "zwykla" },
    { etykieta: "Zmienność w okresie (rozstęp)", pole: "rozstep", typ: "rozstep" },
    { etykieta: "Średni spread (Tabela C)", pole: "sredniSpread", typ: "zwykla" },
    { etykieta: "Dynamika w okresie", pole: "dynamika", typ: "odznaka" }
  ];

  const cialo = tabela.querySelector("tbody");
  cialo.replaceChildren();
  wiersze.forEach(function (opis) {
    const tr = document.createElement("tr");
    const etykieta = document.createElement("td");
    etykieta.textContent = opis.etykieta;
    tr.appendChild(etykieta);
    [a, b].forEach(function (parametry) {
      if (!parametry) {
        tr.appendChild(utworzKomorkePorownania("brak danych", "zwykla", 0));
      } else if (opis.typ === "odznaka") {
        tr.appendChild(utworzKomorkePorownania("", "odznaka", parametry.dynamika));
      } else if (opis.typ === "rozstep") {
        tr.appendChild(utworzKomorkePorownania(formatujZl(parametry.rozstep, parametry.skala) +
          " (" + parametry.rozstepProcent.toFixed(1) + "%)", "zwykla", 0));
      } else {
        tr.appendChild(utworzKomorkePorownania(formatujZl(parametry[opis.pole], parametry.skala), opis.typ, 0));
      }
    });
    cialo.appendChild(tr);
  });
}

/**
 * Zaznacza aktywny przycisk w grupie (klasa „aktywny” i aria-pressed).
 * @param {string} selektor - selektor przycisków grupy
 * @param {HTMLElement} aktywny - przycisk do zaznaczenia
 */
function zaznaczPrzycisk(selektor, aktywny) {
  document.querySelectorAll(selektor).forEach(function (przycisk) {
    przycisk.classList.toggle("aktywny", przycisk === aktywny);
    przycisk.setAttribute("aria-pressed", przycisk === aktywny ? "true" : "false");
  });
}

/**
 * Podpina zdarzenia: wybór waluty i rodzaju, horyzont czasowy, typ wykresu,
 * przycisk aktualizacji, porównywarkę oraz zmianę motywu (nowe kolory wykresu).
 */
function podepnijZdarzeniaAnalizy() {
  ["analiza-waluta", "analiza-rodzaj"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", odswiezAnalize);
  });
  document.getElementById("przycisk-generuj-raport").addEventListener("click", odswiezAnalize);

  document.querySelectorAll(".przycisk-zakres").forEach(function (przycisk) {
    przycisk.addEventListener("click", function () {
      stanAnalizy.zakresDni = Number(przycisk.dataset.zakres);
      zaznaczPrzycisk(".przycisk-zakres", przycisk);
      odswiezAnalize();
      odswiezPorownanie();
    });
  });

  document.querySelectorAll(".przycisk-typ-wykresu").forEach(function (przycisk) {
    przycisk.addEventListener("click", function () {
      stanAnalizy.typWykresu = przycisk.dataset.typ;
      zaznaczPrzycisk(".przycisk-typ-wykresu", przycisk);
      odswiezAnalize();
    });
  });

  ["porownaj-waluta-a", "porownaj-waluta-b"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", odswiezPorownanie);
  });

  const przyciskMotywu = document.getElementById("przelacznik-motywu");
  if (przyciskMotywu) {
    przyciskMotywu.addEventListener("click", odswiezAnalize);
  }
}

/**
 * Pokazuje „brak danych” zamiast przykładowych liczb, gdy nie udało się wczytać js/data.js.
 */
function pokazBrakDanychAnalizy() {
  ["#wskaznik-min", "#wskaznik-max", "#wskaznik-srednia", "#wskaznik-zmiana", "#wskaznik-rozstep"].forEach(function (id) {
    ustawTekst(id, "brak danych");
  });
  document.querySelectorAll(".siatka-kart-wskaznikow .wskaznik-opis").forEach(function (opis) {
    opis.textContent = "";
  });
  document.querySelectorAll(".siatka-kart-wskaznikow .odznaka-zmiany").forEach(function (odznaka) {
    odznaka.remove();
  });
  ustawTekst(".sekcja-wskazniki .sekcja-podtytul", "Brak danych o kursach. Spróbuj odświeżyć stronę.");
  ustawTekst(".wykres-glowny-podtytul", "Brak danych o kursach");

  const cialo = document.querySelector(".tabela-porownania tbody");
  if (cialo) {
    const tr = document.createElement("tr");
    const td = document.createElement("td");
    td.colSpan = 3;
    td.textContent = "Brak danych o kursach.";
    tr.appendChild(td);
    cialo.replaceChildren(tr);
  }
  document.querySelectorAll("#formularz-analizy select, #formularz-analizy button, #formularz-porownania select, .przycisk-typ-wykresu").forEach(function (pole) {
    pole.disabled = true;
  });
}

// Start po załadowaniu drzewa DOM
document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("wykres-glowny")) {
    return;
  }
  if (typeof kursy === "undefined" || !Array.isArray(kursy) || kursy.length === 0) {
    pokazBrakDanychAnalizy();
    return;
  }
  const waluty = listaWalut();
  wypelnijListeAnalizy("analiza-waluta", "EUR");
  wypelnijListeAnalizy("porownaj-waluta-a", "EUR");
  wypelnijListeAnalizy("porownaj-waluta-b", waluty.indexOf("USD") !== -1 ? "USD" : waluty[0]);
  podepnijZdarzeniaAnalizy();
  odswiezAnalize();
  odswiezPorownanie();
});
