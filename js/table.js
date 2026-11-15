/**
 * KursyWalut - tabela kursów na podstronie dane.html.
 * Wyświetla rekordy z js/data.js, obsługuje filtry, wyszukiwarkę,
 * szybki wybór, sortowanie po kliknięciu nagłówka i paginację.
 * Wymaga wcześniejszego załadowania js/data.js (kursy, nazwyWalut, listaWalut, ostatniaData).
 */

// Liczba wierszy na jednej stronie tabeli
const WIERSZY_NA_STRONE = 20;

// Liczba ostatnich dni notowań pokazywanych domyślnie
const DOMYSLNA_LICZBA_DNI = 5;

// Bieżący stan tabeli: sortowanie i numer strony
const stanTabeli = {
  kolumna: "data",
  kierunek: "malejaco",
  strona: 1,
  szybkiWybor: null
};

/**
 * Formatuje kurs do wyświetlenia w tabeli.
 * Waluty o małym kursie (np. JPY) dostają 6 miejsc po przecinku, pozostałe 4.
 * @param {number|null} wartosc - kwota w PLN (kurs albo spread)
 * @param {number} kursSredni - kurs średni waluty, decyduje o liczbie miejsc po przecinku
 * @returns {string} sformatowany tekst albo "—", gdy brak wartości
 */
function formatujKurs(wartosc, kursSredni) {
  if (typeof wartosc !== "number") {
    return "—";
  }
  return kursSredni < 0.1 ? wartosc.toFixed(6) : wartosc.toFixed(4);
}

/**
 * Zwraca poprawną polską formę słowa „rekord” dla podanej liczby.
 * @param {number} liczba - liczba rekordów
 * @returns {string} np. "1 rekord", "3 rekordy", "25 rekordów"
 */
function odmienRekordy(liczba) {
  const reszta10 = liczba % 10;
  const reszta100 = liczba % 100;
  if (liczba === 1) {
    return "1 rekord";
  }
  if (reszta10 >= 2 && reszta10 <= 4 && (reszta100 < 12 || reszta100 > 14)) {
    return liczba + " rekordy";
  }
  return liczba + " rekordów";
}

/**
 * Buduje listę wierszy tabeli: rekordy z data.js uzupełnione o nazwę waluty,
 * spread oraz zmianę procentową kursu średniego względem poprzedniego notowania.
 * @returns {Array<Object>} wiersze gotowe do filtrowania i sortowania
 */
function przygotujWiersze() {
  const wiersze = [];
  listaWalut().forEach(function (waluta) {
    const notowania = pobierzKursyWaluty(waluta);
    notowania.forEach(function (rekord, indeks) {
      const poprzedni = indeks > 0 ? notowania[indeks - 1] : null;
      const maKupnoSprzedaz = typeof rekord.kupno === "number" && typeof rekord.sprzedaz === "number";
      wiersze.push({
        waluta: rekord.waluta,
        nazwa: nazwyWalut[rekord.waluta] || rekord.waluta,
        data: rekord.data,
        sredni: rekord.sredni,
        kupno: rekord.kupno,
        sprzedaz: rekord.sprzedaz,
        spread: maKupnoSprzedaz ? rekord.sprzedaz - rekord.kupno : null,
        zmiana: poprzedni ? (rekord.sredni - poprzedni.sredni) / poprzedni.sredni * 100 : null
      });
    });
  });
  return wiersze;
}

// Wszystkie wiersze liczone raz po załadowaniu strony
let wszystkieWiersze = [];

/**
 * Zwraca datę przesuniętą o podaną liczbę notowań wstecz od ostatniej daty w danych.
 * @param {number} liczbaDni - ile ostatnich dni notowań uwzględnić
 * @returns {string} data "RRRR-MM-DD"
 */
function dataPoczatkowaOstatnichDni(liczbaDni) {
  const daty = [];
  kursy.forEach(function (rekord) {
    if (daty.indexOf(rekord.data) === -1) {
      daty.push(rekord.data);
    }
  });
  daty.sort();
  return daty[Math.max(0, daty.length - liczbaDni)];
}

/**
 * Wypełnia listę wyboru waluty kodami występującymi w danych.
 */
function wypelnijListeWalut() {
  const lista = document.getElementById("filtr-waluta");
  const waluty = listaWalut();
  lista.textContent = "";

  const wszystkie = document.createElement("option");
  wszystkie.value = "wszystkie";
  wszystkie.textContent = "Wszystkie waluty (" + waluty.length + ")";
  lista.appendChild(wszystkie);

  waluty.forEach(function (kod) {
    const opcja = document.createElement("option");
    opcja.value = kod;
    opcja.textContent = kod + " - " + nazwyWalut[kod];
    lista.appendChild(opcja);
  });
}

/**
 * Ustawia domyślne wartości filtrów: wszystkie waluty, ostatnie dni notowań,
 * pusta wyszukiwarka. Ogranicza pola dat do zakresu dostępnych danych.
 */
function ustawDomyslneFiltry() {
  const od = document.getElementById("filtr-od");
  const doDaty = document.getElementById("filtr-do");
  const pierwsza = dataPoczatkowaOstatnichDni(Infinity);
  const ostatnia = ostatniaData();

  document.getElementById("filtr-waluta").value = "wszystkie";
  document.getElementById("filtr-szukaj").value = "";
  od.min = pierwsza;
  od.max = ostatnia;
  doDaty.min = pierwsza;
  doDaty.max = ostatnia;
  od.value = dataPoczatkowaOstatnichDni(DOMYSLNA_LICZBA_DNI);
  doDaty.value = ostatnia;
  stanTabeli.szybkiWybor = null;
  oznaczSzybkiWybor(document.querySelector(".przycisk-tag"));
}

/**
 * Odczytuje kody walut z tekstu przycisku szybkiego wyboru, np. "Główne (EUR, USD)".
 * @param {HTMLElement} przycisk - przycisk z paska szybkiego wyboru
 * @returns {Array<string>|null} lista kodów albo null dla przycisku „Wszystkie”
 */
function kodyZPrzycisku(przycisk) {
  const kody = przycisk.textContent.match(/\b[A-Z]{3}\b/g);
  return kody ? kody : null;
}

/**
 * Zaznacza wybrany przycisk szybkiego wyboru jako aktywny.
 * @param {HTMLElement|null} aktywny - przycisk do zaznaczenia
 */
function oznaczSzybkiWybor(aktywny) {
  document.querySelectorAll(".przycisk-tag").forEach(function (przycisk) {
    przycisk.classList.toggle("aktywny", przycisk === aktywny);
    przycisk.setAttribute("aria-pressed", przycisk === aktywny ? "true" : "false");
  });
}

/**
 * Przygotowuje przyciski szybkiego wyboru: ukrywa te, dla których nie ma danych,
 * i podpina obsługę kliknięcia.
 */
function przygotujSzybkiWybor() {
  const dostepne = listaWalut();
  document.querySelectorAll(".przycisk-tag").forEach(function (przycisk) {
    const kody = kodyZPrzycisku(przycisk);
    if (kody && !kody.some(function (kod) { return dostepne.indexOf(kod) !== -1; })) {
      przycisk.hidden = true;
      return;
    }
    przycisk.addEventListener("click", function () {
      stanTabeli.szybkiWybor = kody;
      document.getElementById("filtr-waluta").value = "wszystkie";
      oznaczSzybkiWybor(przycisk);
      stanTabeli.strona = 1;
      odswiezTabele();
    });
  });
}

/**
 * Zwraca wiersze spełniające aktualne filtry (waluta, zakres dat, fraza, szybki wybór).
 * @returns {Array<Object>} przefiltrowane wiersze
 */
function filtrujWiersze() {
  const waluta = document.getElementById("filtr-waluta").value;
  const od = document.getElementById("filtr-od").value;
  const doDaty = document.getElementById("filtr-do").value;
  const fraza = document.getElementById("filtr-szukaj").value.trim().toLowerCase();

  return wszystkieWiersze.filter(function (wiersz) {
    if (waluta !== "wszystkie" && wiersz.waluta !== waluta) {
      return false;
    }
    if (stanTabeli.szybkiWybor && stanTabeli.szybkiWybor.indexOf(wiersz.waluta) === -1) {
      return false;
    }
    if (od && wiersz.data < od) {
      return false;
    }
    if (doDaty && wiersz.data > doDaty) {
      return false;
    }
    if (fraza && wiersz.waluta.toLowerCase().indexOf(fraza) === -1 && wiersz.nazwa.toLowerCase().indexOf(fraza) === -1) {
      return false;
    }
    return true;
  });
}

/**
 * Sortuje wiersze według kolumny i kierunku zapisanych w stanie tabeli.
 * Puste wartości (null) zawsze trafiają na koniec.
 * @param {Array<Object>} wiersze - wiersze do posortowania (tablica jest zmieniana)
 * @returns {Array<Object>} posortowane wiersze
 */
function sortujWiersze(wiersze) {
  const kolumna = stanTabeli.kolumna;
  const mnoznik = stanTabeli.kierunek === "rosnaco" ? 1 : -1;
  return wiersze.sort(function (a, b) {
    const x = a[kolumna];
    const y = b[kolumna];
    if (x === null || x === undefined) { return 1; }
    if (y === null || y === undefined) { return -1; }
    let wynik = typeof x === "number" ? x - y : String(x).localeCompare(String(y), "pl");
    if (wynik === 0) {
      // Przy remisie kolejność stała: po walucie
      wynik = a.waluta.localeCompare(b.waluta);
    }
    return wynik * mnoznik;
  });
}

/**
 * Tworzy komórkę tabeli z tekstem.
 * @param {string} tekst - zawartość komórki
 * @param {string} klasy - klasy CSS komórki
 * @returns {HTMLTableCellElement} gotowa komórka
 */
function utworzKomorke(tekst, klasy) {
  const td = document.createElement("td");
  if (klasy) {
    td.className = klasy;
  }
  td.textContent = tekst;
  return td;
}

/**
 * Tworzy wiersz tabeli <tr> dla jednego notowania.
 * @param {Object} wiersz - dane wiersza z przygotujWiersze()
 * @returns {HTMLTableRowElement} gotowy wiersz
 */
function utworzWiersz(wiersz) {
  const tr = document.createElement("tr");

  // Kolumna waluty: flaga + kod
  const tdWaluta = document.createElement("td");
  const identyfikator = document.createElement("div");
  identyfikator.className = "waluta-identyfikator";
  const flaga = document.createElement("img");
  flaga.src = "img/flagi/" + wiersz.waluta.toLowerCase() + ".svg";
  flaga.alt = "";
  flaga.className = "flaga-ikona";
  flaga.width = 24;
  flaga.height = 18;
  const kod = document.createElement("span");
  kod.className = "waluta-kod";
  kod.textContent = wiersz.waluta;
  identyfikator.appendChild(flaga);
  identyfikator.appendChild(kod);
  tdWaluta.appendChild(identyfikator);
  tr.appendChild(tdWaluta);

  tr.appendChild(utworzKomorke(wiersz.nazwa, "waluta-nazwa"));
  tr.appendChild(utworzKomorke(wiersz.data, "komorka-data"));
  tr.appendChild(utworzKomorke(formatujKurs(wiersz.sredni, wiersz.sredni), "komorka-liczba kurs-glowny"));
  tr.appendChild(utworzKomorke(formatujKurs(wiersz.kupno, wiersz.sredni), "komorka-liczba"));
  tr.appendChild(utworzKomorke(formatujKurs(wiersz.sprzedaz, wiersz.sredni), "komorka-liczba"));
  tr.appendChild(utworzKomorke(formatujKurs(wiersz.spread, wiersz.sredni), "komorka-liczba komorka-spread"));

  // Kolumna zmiany 24h: kolorowa odznaka
  const tdZmiana = utworzKomorke("", "komorka-srodek");
  const odznaka = document.createElement("span");
  if (wiersz.zmiana === null) {
    odznaka.textContent = "—";
  } else {
    odznaka.className = "odznaka-zmiany " + (wiersz.zmiana >= 0 ? "odznaka-wzrost" : "odznaka-spadek");
    odznaka.textContent = (wiersz.zmiana >= 0 ? "+" : "") + wiersz.zmiana.toFixed(2) + "%";
  }
  tdZmiana.appendChild(odznaka);
  tr.appendChild(tdZmiana);

  return tr;
}

/**
 * Aktualizuje strzałki i atrybuty aria-sort w nagłówkach kolumn.
 */
function oznaczSortowanie() {
  document.querySelectorAll("#tabela-kursow th[data-sort]").forEach(function (th) {
    const ikona = th.querySelector(".ikona-sort");
    if (th.dataset.sort === stanTabeli.kolumna) {
      const rosnaco = stanTabeli.kierunek === "rosnaco";
      th.setAttribute("aria-sort", rosnaco ? "ascending" : "descending");
      if (ikona) { ikona.textContent = rosnaco ? "↑" : "↓"; }
    } else {
      th.removeAttribute("aria-sort");
      if (ikona) { ikona.textContent = "⇅"; }
    }
  });
}

/**
 * Tworzy przycisk paginacji.
 * @param {string} tekst - napis na przycisku
 * @param {number} strona - numer strony, na którą przycisk przenosi
 * @param {boolean} wylaczony - czy przycisk ma być nieaktywny
 * @param {boolean} aktywny - czy to bieżąca strona
 * @returns {HTMLButtonElement} gotowy przycisk
 */
function utworzPrzyciskStrony(tekst, strona, wylaczony, aktywny) {
  const przycisk = document.createElement("button");
  przycisk.type = "button";
  przycisk.className = "przycisk-paginacji" + (aktywny ? " aktywny" : "");
  przycisk.textContent = tekst;
  przycisk.disabled = wylaczony;
  if (aktywny) {
    przycisk.setAttribute("aria-current", "page");
  }
  przycisk.addEventListener("click", function () {
    stanTabeli.strona = strona;
    odswiezTabele();
  });
  return przycisk;
}

/**
 * Odświeża opis i przyciski paginacji pod tabelą.
 * @param {number} liczbaWierszy - liczba wierszy po filtrowaniu
 * @param {number} liczbaStron - łączna liczba stron
 * @param {number} pokazane - liczba wierszy na bieżącej stronie
 */
function odswiezPaginacje(liczbaWierszy, liczbaStron, pokazane) {
  const opis = document.querySelector(".paginacja-opis");
  const przyciski = document.querySelector(".paginacja-przyciski");
  const strona = stanTabeli.strona;

  if (opis) {
    opis.textContent = "Strona " + strona + " z " + liczbaStron +
      " (wyświetlanie " + pokazane + " z " + liczbaWierszy + " pozycji)";
  }
  if (przyciski) {
    przyciski.textContent = "";
    przyciski.appendChild(utworzPrzyciskStrony("« Poprzednia", strona - 1, strona <= 1, false));
    for (let i = 1; i <= liczbaStron; i++) {
      przyciski.appendChild(utworzPrzyciskStrony(String(i), i, false, i === strona));
    }
    przyciski.appendChild(utworzPrzyciskStrony("Następna »", strona + 1, strona >= liczbaStron, false));
  }
}

/**
 * Filtruje, sortuje i wyświetla bieżącą stronę tabeli razem z licznikiem i paginacją.
 */
function odswiezTabele() {
  const cialo = document.getElementById("tabela-kursow-cialo");
  const wiersze = sortujWiersze(filtrujWiersze());
  const liczbaStron = Math.max(1, Math.ceil(wiersze.length / WIERSZY_NA_STRONE));
  stanTabeli.strona = Math.min(Math.max(1, stanTabeli.strona), liczbaStron);
  const poczatek = (stanTabeli.strona - 1) * WIERSZY_NA_STRONE;
  const strona = wiersze.slice(poczatek, poczatek + WIERSZY_NA_STRONE);

  cialo.textContent = "";
  if (strona.length === 0) {
    const tr = document.createElement("tr");
    const td = utworzKomorke("Brak notowań spełniających wybrane kryteria.", "komorka-srodek");
    td.colSpan = 8;
    tr.appendChild(td);
    cialo.appendChild(tr);
  } else {
    strona.forEach(function (wiersz) {
      cialo.appendChild(utworzWiersz(wiersz));
    });
  }

  document.getElementById("licznik-rekordow").textContent = odmienRekordy(wiersze.length);
  oznaczSortowanie();
  odswiezPaginacje(wiersze.length, liczbaStron, strona.length);
}

/**
 * Obsługuje kliknięcie nagłówka kolumny: ta sama kolumna zmienia kierunek,
 * nowa kolumna sortuje rosnąco (daty i zmiany od najnowszych/największych).
 * @param {string} kolumna - nazwa kolumny z atrybutu data-sort
 */
function zmienSortowanie(kolumna) {
  if (stanTabeli.kolumna === kolumna) {
    stanTabeli.kierunek = stanTabeli.kierunek === "rosnaco" ? "malejaco" : "rosnaco";
  } else {
    stanTabeli.kolumna = kolumna;
    stanTabeli.kierunek = kolumna === "waluta" || kolumna === "nazwa" ? "rosnaco" : "malejaco";
  }
  stanTabeli.strona = 1;
  odswiezTabele();
}

/**
 * Podpina zdarzenia filtrów, przycisku resetu i nagłówków tabeli.
 */
function podepnijZdarzenia() {
  ["filtr-waluta", "filtr-od", "filtr-do", "filtr-szukaj"].forEach(function (id) {
    document.getElementById(id).addEventListener("input", function () {
      if (id === "filtr-waluta") {
        // Wybór z listy zastępuje szybki wybór
        stanTabeli.szybkiWybor = null;
        oznaczSzybkiWybor(document.querySelector(".przycisk-tag"));
      }
      stanTabeli.strona = 1;
      odswiezTabele();
    });
  });

  document.getElementById("formularz-filtrow").addEventListener("reset", function (zdarzenie) {
    zdarzenie.preventDefault();
    ustawDomyslneFiltry();
    stanTabeli.kolumna = "data";
    stanTabeli.kierunek = "malejaco";
    stanTabeli.strona = 1;
    odswiezTabele();
  });

  document.querySelectorAll("#tabela-kursow th[data-sort]").forEach(function (th) {
    th.tabIndex = 0;
    th.addEventListener("click", function () {
      zmienSortowanie(th.dataset.sort);
    });
    th.addEventListener("keydown", function (zdarzenie) {
      if (zdarzenie.key === "Enter" || zdarzenie.key === " ") {
        zdarzenie.preventDefault();
        zmienSortowanie(th.dataset.sort);
      }
    });
  });
}

/**
 * Zastępuje przykładowe wiersze ze statycznego HTML komunikatem „Brak danych”,
 * gdy nie udało się wczytać js/data.js, i wyłącza filtry.
 */
function pokazBrakDanychTabeli() {
  const cialo = document.getElementById("tabela-kursow-cialo");
  const tr = document.createElement("tr");
  const td = utworzKomorke("Brak danych o kursach. Spróbuj odświeżyć stronę.", "komorka-srodek");
  td.colSpan = 8;
  tr.appendChild(td);
  cialo.replaceChildren(tr);

  document.getElementById("licznik-rekordow").textContent = "brak danych";
  const opis = document.querySelector(".paginacja-opis");
  if (opis) {
    opis.textContent = "Brak danych do wyświetlenia";
  }
  const przyciski = document.querySelector(".paginacja-przyciski");
  if (przyciski) {
    przyciski.replaceChildren();
  }
  document.querySelectorAll("#formularz-filtrow input, #formularz-filtrow select, #formularz-filtrow button").forEach(function (pole) {
    pole.disabled = true;
  });
}

// Start po załadowaniu drzewa DOM
document.addEventListener("DOMContentLoaded", function () {
  if (!document.getElementById("tabela-kursow-cialo")) {
    return;
  }
  if (typeof kursy === "undefined" || !Array.isArray(kursy) || kursy.length === 0) {
    pokazBrakDanychTabeli();
    return;
  }
  wszystkieWiersze = przygotujWiersze();
  wypelnijListeWalut();
  przygotujSzybkiWybor();
  ustawDomyslneFiltry();
  podepnijZdarzenia();
  odswiezTabele();
});
