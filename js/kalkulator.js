/**
 * KursyWalut - logika strony głównej (index.html): karty popularnych walut,
 * pasek z datą ostatniej aktualizacji, kalkulator walut i mini-wykres.
 * Karty i pasek są budowane z danych w js/data.js. Kalkulator przelicza kwotę między dwiema walutami (w tym PLN) po kursie NBP z wybranego dnia
 * i rysuje trend ostatnich notowań waluty obcej (Chart.js).
 * Wymaga wcześniejszego załadowania js/data.js (kursy, nazwyWalut, listaWalut, ostatniaData, pobierzKursyWaluty).
 */

// Liczba notowań pokazywanych na mini-wykresie
const NOTOWAN_NA_WYKRESIE = 10;

// Nazwy rodzajów kursu używane w opisie wyniku
const OPISY_RODZAJU = {
  sredni: "kurs średni",
  kupno: "kurs kupna",
  sprzedaz: "kurs sprzedaży"
};

// Kolejność walut na kartach „Popularne waluty”
const KOLEJNOSC_KART = ["EUR", "USD", "GBP", "CHF", "JPY", "AUD"];

// Opisy flag (tekst alternatywny obrazków)
const OPISY_FLAG = {
  EUR: "Flaga Unii Europejskiej",
  USD: "Flaga Stanów Zjednoczonych",
  GBP: "Flaga Wielkiej Brytanii",
  CHF: "Flaga Szwajcarii",
  JPY: "Flaga Japonii",
  AUD: "Flaga Australii"
};

// Polskie nazwy miesięcy w dopełniaczu (do zapisu „13 listopada 2026 r.”)
const MIESIACE = ["stycznia", "lutego", "marca", "kwietnia", "maja", "czerwca",
  "lipca", "sierpnia", "września", "października", "listopada", "grudnia"];

// Bieżąca instancja wykresu Chart.js (do zniszczenia przed narysowaniem nowego)
let miniWykres = null;

/**
 * Szuka notowania waluty z podanego dnia albo z ostatniego wcześniejszego dnia publikacji.
 * @param {string} waluta - kod ISO 4217, np. "EUR"
 * @param {string} data - data "RRRR-MM-DD"
 * @returns {Object|null} rekord z data.js albo null, gdy brak notowań do tej daty
 */
function znajdzNotowanie(waluta, data) {
  const notowania = pobierzKursyWaluty(waluta);
  let znalezione = null;
  for (let i = 0; i < notowania.length; i++) {
    if (notowania[i].data <= data) {
      znalezione = notowania[i];
    } else {
      break;
    }
  }
  return znalezione;
}

/**
 * Formatuje kurs: waluty o małym kursie (np. JPY) z 6 miejscami po przecinku, pozostałe z 4.
 * @param {number} kurs - kurs w PLN za 1 jednostkę
 * @returns {string} sformatowany kurs
 */
function formatujPrzelicznik(kurs) {
  return kurs < 0.1 ? kurs.toFixed(6) : kurs.toFixed(4);
}

/**
 * Formatuje kwotę pieniężną z dwoma miejscami po przecinku i spacjami między tysiącami.
 * @param {number} kwota - kwota do sformatowania
 * @returns {string} np. "1 234.56"
 */
function formatujKwote(kwota) {
  const [calosc, ulamek] = kwota.toFixed(2).split(".");
  return calosc.replace(/\B(?=(\d{3})+(?!\d))/g, " ") + "." + ulamek;
}

/**
 * Wypełnia listę wyboru walut kodami z data.js oraz PLN.
 * @param {string} id - id elementu select
 * @param {string} domyslna - kod waluty zaznaczonej na starcie
 */
function wypelnijListeKalkulatora(id, domyslna) {
  const lista = document.getElementById(id);
  const kody = listaWalut().concat(["PLN"]);
  lista.textContent = "";
  kody.forEach(function (kod) {
    const opcja = document.createElement("option");
    opcja.value = kod;
    opcja.textContent = kod + " - " + nazwyWalut[kod];
    opcja.selected = kod === domyslna;
    lista.appendChild(opcja);
  });
}

/**
 * Ustawia pole daty na ostatnie notowanie i ogranicza je do zakresu dostępnych danych.
 */
function ustawPoleDaty() {
  const pole = document.getElementById("kalk-data");
  const daty = kursy.map(function (rekord) { return rekord.data; }).sort();
  pole.min = daty[0];
  pole.max = daty[daty.length - 1];
  pole.value = ostatniaData();
}

/**
 * Wyświetla wynik albo komunikat w polu wyniku kalkulatora.
 * @param {string} wynik - tekst głównego wyniku
 * @param {string} opis - tekst pod wynikiem (przelicznik, źródło lub błąd)
 */
function pokazWynik(wynik, opis) {
  document.getElementById("kalk-wynik").textContent = wynik;
  const zrodlo = document.querySelector(".wynik-zrodlo");
  if (zrodlo) {
    zrodlo.textContent = opis;
  }
}

/**
 * Ustawia listę rodzajów kursu: kurs średni albo wymiana jak w kantorze
 * (bank kupuje walutę źródłową po kursie kupna i sprzedaje docelową po kursie sprzedaży).
 */
function ustawRodzajeKursu() {
  const lista = document.getElementById("kalk-rodzaj");
  const rodzaje = [
    { wartosc: "sredni", tekst: "Kurs średni NBP (Tabela A)" },
    { wartosc: "kantor", tekst: "Wymiana: kupno i sprzedaż NBP (Tabela C)" }
  ];
  lista.textContent = "";
  rodzaje.forEach(function (rodzaj) {
    const opcja = document.createElement("option");
    opcja.value = rodzaj.wartosc;
    opcja.textContent = rodzaj.tekst;
    lista.appendChild(opcja);
  });
}

/**
 * Odczytuje dane z formularza, przelicza kwotę i pokazuje wynik.
 * Kwota jest przeliczana przez PLN: kwota × kurs(z) / kurs(na).
 * Przy kursie średnim obie waluty liczone są po kursie średnim.
 * Przy wymianie („kantor”) walutę źródłową bank od nas kupuje (kurs kupna),
 * a docelową nam sprzedaje (kurs sprzedaży). PLN zawsze ma kurs 1.
 */
function przelicz() {
  const kwota = parseFloat(document.getElementById("kalk-kwota").value);
  const z = document.getElementById("kalk-z").value;
  const na = document.getElementById("kalk-na").value;
  const data = document.getElementById("kalk-data").value;
  const rodzaj = document.getElementById("kalk-rodzaj").value;

  if (!(kwota > 0)) {
    pokazWynik("—", "Podaj kwotę większą od zera.");
    return;
  }
  if (!data) {
    pokazWynik("—", "Wybierz datę notowania.");
    return;
  }
  if (data > ostatniaData()) {
    pokazWynik("—", "Brak kursu NBP dla wybranej daty. Dostępne dane: od " +
      document.getElementById("kalk-data").min + " do " + ostatniaData() + ".");
    return;
  }

  const notowanieZ = z === "PLN" ? null : znajdzNotowanie(z, data);
  const notowanieNa = na === "PLN" ? null : znajdzNotowanie(na, data);
  const kantor = rodzaj === "kantor";
  const rodzajZ = kantor ? "kupno" : "sredni";
  const rodzajNa = kantor ? "sprzedaz" : "sredni";
  const kursZ = z === "PLN" ? 1 : (notowanieZ ? notowanieZ[rodzajZ] : null);
  const kursNa = na === "PLN" ? 1 : (notowanieNa ? notowanieNa[rodzajNa] : null);

  if (typeof kursZ !== "number" || typeof kursNa !== "number") {
    pokazWynik("—", "Brak kursu NBP dla wybranej daty. Dostępne dane: od " +
      document.getElementById("kalk-data").min + " do " + ostatniaData() + ".");
    return;
  }

  const wynik = kwota * kursZ / kursNa;
  const przelicznik = kursZ / kursNa;
  const dataKursu = (notowanieZ || notowanieNa) ? (notowanieZ || notowanieNa).data : data;

  let opis = "Zastosowany przelicznik: 1 " + z + " = " + formatujPrzelicznik(przelicznik) + " " + na;
  if (kantor) {
    const czesci = [];
    if (z !== "PLN") {
      czesci.push("bank kupuje " + z + " po " + formatujPrzelicznik(kursZ) + " zł");
    }
    if (na !== "PLN") {
      czesci.push((czesci.length ? "" : "bank ") + "sprzedaje " + na + " po " + formatujPrzelicznik(kursNa) + " zł");
    }
    opis += " (" + czesci.join(", ") + ", kursy z " + dataKursu + ")";
  } else {
    opis += " (kurs średni z " + dataKursu + ")";
  }
  if (z === na) {
    opis = "Wybrano tę samą walutę, kwota się nie zmienia.";
  } else if (dataKursu !== data) {
    opis += ". W dniu " + data + " NBP nie publikował kursów, użyto ostatniego wcześniejszego notowania.";
  }

  pokazWynik(formatujKwote(wynik) + " " + na, opis);
  // Wykres: waluta obca i kurs, po którym jest liczona
  if (z === "PLN") {
    narysujWykres(na, data, rodzajNa);
  } else {
    narysujWykres(z, data, rodzajZ);
  }
}

/**
 * Rysuje mini-wykres ostatnich notowań waluty obcej do wybranej daty włącznie.
 * Jeśli biblioteka Chart.js się nie załadowała, wykres jest pomijany.
 * @param {string} waluta - kod waluty obcej (dla PLN→PLN wykres nie jest rysowany)
 * @param {string} data - ostatnia data na wykresie "RRRR-MM-DD"
 * @param {string} rodzaj - "sredni", "kupno" albo "sprzedaz"
 */
function narysujWykres(waluta, data, rodzaj) {
  const podpis = document.getElementById("podpis-mini-wykresu");
  const plotno = document.getElementById("mini-wykres");
  if (!plotno || typeof Chart === "undefined") {
    return;
  }
  if (waluta === "PLN") {
    // PLN → PLN: nie ma czego pokazać, usuwamy poprzedni wykres
    if (miniWykres) {
      miniWykres.destroy();
      miniWykres = null;
    }
    return;
  }

  const notowania = pobierzKursyWaluty(waluta)
    .filter(function (rekord) { return rekord.data <= data; })
    .slice(-NOTOWAN_NA_WYKRESIE);

  if (podpis) {
    podpis.textContent = "";
    const pogrubienie = document.createElement("strong");
    pogrubienie.textContent = "Trend kursu " + waluta + "/PLN:";
    podpis.appendChild(pogrubienie);
    podpis.appendChild(document.createTextNode(" ostatnie " + notowania.length + " notowań (" + OPISY_RODZAJU[rodzaj] + ")"));
  }

  const style = getComputedStyle(document.documentElement);
  const kolorLinii = style.getPropertyValue("--kolor-glowny").trim() || "#1d4ed8";
  const kolorTekstu = style.getPropertyValue("--kolor-tekst").trim() || "#14213b";
  const kolorSiatki = style.getPropertyValue("--kolor-obramowanie").trim() || "#dce3ee";

  if (miniWykres) {
    miniWykres.destroy();
  }
  miniWykres = new Chart(plotno, {
    type: "line",
    data: {
      labels: notowania.map(function (rekord) { return rekord.data.slice(5); }),
      datasets: [{
        label: waluta + "/PLN",
        data: notowania.map(function (rekord) { return rekord[rodzaj]; }),
        borderColor: kolorLinii,
        backgroundColor: kolorLinii,
        borderWidth: 2,
        pointRadius: 3,
        tension: 0.3
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
              return formatujPrzelicznik(kontekst.parsed.y) + " zł";
            }
          }
        }
      },
      scales: {
        x: { ticks: { color: kolorTekstu }, grid: { color: kolorSiatki } },
        y: {
          ticks: { color: kolorTekstu, callback: function (wartosc) { return formatujPrzelicznik(wartosc); } },
          grid: { color: kolorSiatki }
        }
      }
    }
  });
}

/**
 * Zamienia datę "RRRR-MM-DD" na zapis słowny, np. "13 listopada 2026 r.".
 * @param {string} data - data "RRRR-MM-DD"
 * @returns {string} data słownie
 */
function dataSlownie(data) {
  const czesci = data.split("-").map(Number);
  return czesci[2] + " " + MIESIACE[czesci[1] - 1] + " " + czesci[0] + " r.";
}

/**
 * Tworzy element o podanym tagu, klasie i tekście.
 * @param {string} tag - nazwa znacznika, np. "span"
 * @param {string} klasa - klasy CSS
 * @param {string} tekst - zawartość tekstowa (może być pusta)
 * @returns {HTMLElement} gotowy element
 */
function utworzElement(tag, klasa, tekst) {
  const element = document.createElement(tag);
  if (klasa) {
    element.className = klasa;
  }
  if (tekst) {
    element.textContent = tekst;
  }
  return element;
}

/**
 * Tworzy wiersz „Kupno: X zł” / „Sprzedaż: X zł” z pogrubioną kwotą.
 * @param {string} etykieta - np. "Kupno"
 * @param {number|null} kurs - kurs w PLN
 * @returns {HTMLElement} element span
 */
function utworzSzczegol(etykieta, kurs) {
  const wiersz = utworzElement("span", "szczegol-wiersz", etykieta + ": ");
  const wartosc = utworzElement("strong", "", typeof kurs === "number" ? formatujPrzelicznik(kurs) + " zł" : "—");
  wiersz.appendChild(wartosc);
  return wiersz;
}

/**
 * Tworzy kartę jednej waluty z ostatnim notowaniem i zmianą względem poprzedniego.
 * Struktura i klasy są takie same jak w statycznym HTML, więc wygląd się nie zmienia.
 * @param {string} kod - kod waluty, np. "EUR"
 * @returns {HTMLElement|null} element article albo null, gdy brak danych
 */
function utworzKarteWaluty(kod) {
  const notowania = pobierzKursyWaluty(kod);
  if (notowania.length === 0) {
    return null;
  }
  const ostatnie = notowania[notowania.length - 1];
  const poprzednie = notowania.length > 1 ? notowania[notowania.length - 2] : null;

  const karta = utworzElement("article", "karta-waluty", "");

  // Nagłówek: flaga, kod, nazwa i odznaka zmiany
  const naglowek = utworzElement("div", "karta-naglowek", "");
  const info = utworzElement("div", "karta-waluta-info", "");
  const flaga = document.createElement("img");
  flaga.src = "img/flagi/" + kod.toLowerCase() + ".svg";
  flaga.alt = OPISY_FLAG[kod] || "";
  flaga.className = "flaga-ikona";
  flaga.width = 28;
  flaga.height = 21;
  const opis = document.createElement("div");
  opis.appendChild(utworzElement("h3", "karta-kod", kod));
  opis.appendChild(utworzElement("span", "karta-pelna-nazwa", nazwyWalut[kod]));
  info.appendChild(flaga);
  info.appendChild(opis);
  naglowek.appendChild(info);

  if (poprzednie) {
    const zmiana = (ostatnie.sredni - poprzednie.sredni) / poprzednie.sredni * 100;
    const tekstZmiany = (zmiana >= 0 ? "+" : "") + zmiana.toFixed(2) + "%";
    const odznaka = utworzElement("span", "odznaka-zmiany " + (zmiana >= 0 ? "odznaka-wzrost" : "odznaka-spadek"), tekstZmiany);
    odznaka.setAttribute("aria-label", (zmiana >= 0 ? "Wzrost o " : "Spadek o ") + Math.abs(zmiana).toFixed(2) + "%");
    naglowek.appendChild(odznaka);
  }
  karta.appendChild(naglowek);

  // Kurs średni
  const kurs = utworzElement("div", "karta-kurs-wartosc", "");
  kurs.appendChild(utworzElement("span", "etykieta-kursu", "Kurs średni:"));
  kurs.appendChild(utworzElement("span", "liczba-kursu", formatujPrzelicznik(ostatnie.sredni) + " zł"));
  karta.appendChild(kurs);

  // Kupno i sprzedaż
  const szczegoly = utworzElement("div", "karta-szczegoly", "");
  szczegoly.appendChild(utworzSzczegol("Kupno", ostatnie.kupno));
  szczegoly.appendChild(utworzSzczegol("Sprzedaż", ostatnie.sprzedaz));
  karta.appendChild(szczegoly);

  return karta;
}

/**
 * Zastępuje statyczne karty „Popularne waluty” kartami zbudowanymi z data.js.
 */
function zbudujKartyWalut() {
  const siatka = document.querySelector(".siatka-kart-walut");
  if (!siatka) {
    return;
  }
  const dostepne = listaWalut();
  const kody = KOLEJNOSC_KART.filter(function (kod) { return dostepne.indexOf(kod) !== -1; });
  // Waluty z data.js, których nie ma w KOLEJNOSC_KART, trafiają na koniec
  dostepne.forEach(function (kod) {
    if (kody.indexOf(kod) === -1) {
      kody.push(kod);
    }
  });

  siatka.replaceChildren();
  kody.forEach(function (kod) {
    const karta = utworzKarteWaluty(kod);
    if (karta) {
      siatka.appendChild(karta);
    }
  });
}

/**
 * Wpisuje do paska informacyjnego datę ostatniego notowania z data.js.
 */
function ustawPasekAktualizacji() {
  const pasek = document.querySelector(".status-tekst");
  const data = ostatniaData();
  if (!pasek || !data) {
    return;
  }
  pasek.textContent = "Oficjalne notowania Narodowego Banku Polskiego (Tabela A i C) | Ostatnia aktualizacja danych: ";
  pasek.appendChild(utworzElement("strong", "", dataSlownie(data)));
}

/**
 * Sprawdza, czy dane kursów z js/data.js zostały wczytane i nie są puste.
 * @returns {boolean} true, gdy są dane do wyświetlenia
 */
function saDane() {
  return typeof kursy !== "undefined" && Array.isArray(kursy) && kursy.length > 0;
}

/**
 * Zastępuje przykładowe liczby ze statycznego HTML komunikatem „Brak danych”,
 * gdy nie udało się wczytać js/data.js. Dzięki temu strona nie pokazuje
 * nieaktualnych kursów jako prawdziwych.
 */
function pokazBrakDanych() {
  const siatka = document.querySelector(".siatka-kart-walut");
  if (siatka) {
    siatka.replaceChildren(utworzElement("p", "sekcja-podtytul", "Brak danych o kursach. Spróbuj odświeżyć stronę."));
  }

  const pasek = document.querySelector(".status-tekst");
  if (pasek) {
    pasek.textContent = "Oficjalne notowania Narodowego Banku Polskiego (Tabela A i C) | Ostatnia aktualizacja danych: ";
    pasek.appendChild(utworzElement("strong", "", "brak danych"));
  }

  if (document.getElementById("kalk-wynik")) {
    pokazWynik("Brak danych", "Nie udało się wczytać kursów NBP, więc przeliczenie jest niedostępne.");
    document.getElementById("kalk-przelicz").disabled = true;
  }

  const podpis = document.getElementById("podpis-mini-wykresu");
  if (podpis) {
    podpis.textContent = "";
    podpis.appendChild(utworzElement("strong", "", "Trend kursu waluty:"));
    podpis.appendChild(document.createTextNode(" brak danych"));
  }
}

// Start po załadowaniu drzewa DOM
document.addEventListener("DOMContentLoaded", function () {
  if (!saDane()) {
    pokazBrakDanych();
    return;
  }
  zbudujKartyWalut();
  ustawPasekAktualizacji();
  if (!document.getElementById("formularz-kalkulatora")) {
    return;
  }
  wypelnijListeKalkulatora("kalk-z", "EUR");
  wypelnijListeKalkulatora("kalk-na", "PLN");
  ustawRodzajeKursu();
  ustawPoleDaty();

  document.getElementById("kalk-przelicz").addEventListener("click", przelicz);
  // Wynik odświeża się od razu po zmianie dowolnego pola
  ["kalk-kwota", "kalk-z", "kalk-na", "kalk-data", "kalk-rodzaj"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", przelicz);
  });
  // Po przełączeniu motywu wykres jest rysowany ponownie w nowych kolorach
  const przyciskMotywu = document.getElementById("przelacznik-motywu");
  if (przyciskMotywu) {
    przyciskMotywu.addEventListener("click", przelicz);
  }

  przelicz();
});
