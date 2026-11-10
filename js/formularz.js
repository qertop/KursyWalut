/**
 * KursyWalut - Obsługa formularza zlecenia alertu kursowego
 * Plik przypisany do Osoby B zgodnie z CONTRIBUTING.md.
 * Realizuje walidację HTML5 + min. 2 dodatkowe warunki w JavaScript,
 * obsługę zdarzeń (submit, input, change, click) oraz generowanie podsumowania.
 */

// Aktualne kursy referencyjne NBP do weryfikacji progów alertów
const KURSY_REFERENCYJNE = {
  EUR: 4.3873,
  USD: 3.9199,
  GBP: 5.2593,
  CHF: 4.7925,
  NOK: 0.4179,
  SEK: 0.3989,
  CZK: 0.1802,
  HUF: 1.2080,
  JPY: 2.5840,
  CAD: 2.8712
};

/**
 * Sprawdza, czy podany numer telefonu ma poprawny polski format komórkowy.
 * @param {string} telefon - Wprowadzony numer telefonu
 * @returns {boolean} True, jeśli numer jest poprawny
 */
function czyPoprawnyTelefon(telefon) {
  if (!telefon) return false;
  // Akceptuje formaty: 600123456, 600 123 456, 600-123-456, +48 600 123 456 itp.
  const regex = /^(\+48\s?)?[0-9]{3}[\s-]?[0-9]{3}[\s-]?[0-9]{3}$/;
  return regex.test(telefon.trim());
}

/**
 * Sprawdza, czy podana data nie jest weekendem (sobota = 6, niedziela = 0).
 * NBP publikuje notowania wyłącznie w dni robocze.
 * @param {string} dataTekst - Data w formacie RRRR-MM-DD
 * @returns {boolean} True, jeśli data przypada w dzień roboczy (pon-pt)
 */
function czyDzienRoboczy(dataTekst) {
  if (!dataTekst) return false;
  const data = new Date(dataTekst + "T12:00:00");
  const dzienTygodnia = data.getDay();
  return dzienTygodnia !== 0 && dzienTygodnia !== 6;
}

/**
 * Wyświetla komunikat błędu w dedykowanym kontenerze alertu.
 * @param {string} tresc - Treść komunikatu
 */
function pokazBlad(tresc) {
  const kontener = document.getElementById("alert-komunikat");
  if (!kontener) return;
  kontener.textContent = tresc;
  kontener.className = "alert-komunikat alert-komunikat-blad";
  kontener.removeAttribute("hidden");
  kontener.scrollIntoView({ behavior: "smooth", block: "center" });
}

/**
 * Ukrywa kontener komunikatów.
 */
function ukryjBlad() {
  const kontener = document.getElementById("alert-komunikat");
  if (!kontener) return;
  kontener.setAttribute("hidden", "true");
  kontener.textContent = "";
}

/**
 * Waliduje formularz pod kątem dodatkowych reguł biznesowych JavaScript.
 * Warunek 1: Weryfikacja telefonu, gdy wybrano powiadomienie SMS lub E-mail+SMS.
 * Warunek 2: Weryfikacja, czy data ważności przypada w dzień roboczy oraz w przyszłości.
 * Warunek 3: Weryfikacja progu kursowego względem aktualnego kursu rynkowego NBP.
 * @param {HTMLFormElement} form - Obiekt formularza
 * @returns {boolean} True, jeśli walidacja przeszła pomyślnie
 */
function walidujFormularzJS(form) {
  ukryjBlad();

  // Sprawdzenie walidacji standardowej HTML5
  if (!form.checkValidity()) {
    pokazBlad("Proszę uzupełnić wszystkie wymagane pola formularza poprawnymi danymi.");
    return false;
  }

  // Pobranie wartości kontrolek
  const kanal = form.querySelector('input[name="kanal"]:checked')?.value || "email";
  const telefon = document.getElementById("alert-telefon")?.value.trim() || "";
  const dataWaznosci = document.getElementById("alert-data-waznosci")?.value || "";
  const waluta = document.getElementById("alert-waluta")?.value || "";
  const prog = parseFloat(document.getElementById("alert-prog")?.value || "0");
  const kierunek = document.getElementById("alert-kierunek")?.value || "powyzej";

  // WARUNEK DODATKOWY 1: Weryfikacja kanału SMS
  if ((kanal === "sms" || kanal === "oba") && !czyPoprawnyTelefon(telefon)) {
    pokazBlad("Dla wybranego kanału SMS wymagane jest podanie poprawnego 9-cyfrowego numeru telefonu komórkowego (np. 600 123 456).");
    document.getElementById("alert-telefon")?.focus();
    return false;
  }

  // WARUNEK DODATKOWY 2: Weryfikacja daty (tylko dni robocze)
  const dzis = new Date().toISOString().split("T")[0];
  if (dataWaznosci < dzis) {
    pokazBlad("Data ważności alertu nie może być datą z przeszłości.");
    document.getElementById("alert-data-waznosci")?.focus();
    return false;
  }

  if (!czyDzienRoboczy(dataWaznosci)) {
    pokazBlad("Wybrana data ważności przypada w weekend. Narodowy Bank Polski publikuje oficjalne tabele notowań wyłącznie w dni robocze (poniedziałek – piątek). Proszę wskazać dzień roboczy.");
    document.getElementById("alert-data-waznosci")?.focus();
    return false;
  }

  // WARUNEK DODATKOWY 3: Logiczna weryfikacja progu kursowego
  if (waluta && KURSY_REFERENCYJNE[waluta]) {
    const kursAktualny = KURSY_REFERENCYJNE[waluta];
    if (kierunek === "powyzej" && prog <= kursAktualny * 0.7) {
      pokazBlad(`Docelowy próg kursowy (${prog.toFixed(4)} zł) jest znacznie niższy od obecnego kursu rynkowego ${waluta} (${kursAktualny.toFixed(4)} zł) dla warunku 'powyżej'. Sprawdź poprawność wprowadzonej wartości.`);
      document.getElementById("alert-prog")?.focus();
      return false;
    }
    if (kierunek === "ponizej" && prog >= kursAktualny * 1.3) {
      pokazBlad(`Docelowy próg kursowy (${prog.toFixed(4)} zł) jest znacznie wyższy od obecnego kursu rynkowego ${waluta} (${kursAktualny.toFixed(4)} zł) dla warunku 'poniżej'. Sprawdź poprawność wprowadzonej wartości.`);
      document.getElementById("alert-prog")?.focus();
      return false;
    }
  }

  return true;
}

/**
 * Generuje i prezentuje podsumowanie zlecenia alertu na stronie.
 * Wypełnia pola wyłącznie za pomocą textContent (ochrona przed XSS).
 * @param {HTMLFormElement} form - Obiekt formularza
 */
function pokazPodsumowanieAlertu(form) {
  const nazwisko = document.getElementById("alert-nazwisko")?.value.trim() || "";
  const email = document.getElementById("alert-email")?.value.trim() || "";
  const telefon = document.getElementById("alert-telefon")?.value.trim() || "";
  const kanal = form.querySelector('input[name="kanal"]:checked')?.value || "email";
  const waluta = document.getElementById("alert-waluta")?.value || "";
  const rodzajKursu = document.getElementById("alert-rodzaj-kursu")?.value || "sredni";
  const kierunek = document.getElementById("alert-kierunek")?.value || "powyzej";
  const prog = parseFloat(document.getElementById("alert-prog")?.value || "0");
  const kwota = parseFloat(document.getElementById("alert-kwota")?.value || "0");
  const dataWaznosci = document.getElementById("alert-data-waznosci")?.value || "";

  // Mapowanie czytelnych etykiet
  const etykietyKanalu = {
    email: `E-mail (${email})`,
    sms: `SMS (${telefon})`,
    oba: `E-mail (${email}) oraz SMS (${telefon})`
  };

  const etykietyRodzaju = {
    sredni: "kurs średni NBP (Tabela A)",
    sprzedaz: "kurs sprzedaży (Tabela C)",
    kupno: "kurs kupna (Tabela C)"
  };

  const kierunekTekst = kierunek === "powyzej" ? "Wzrost powyżej (≥)" : "Spadek poniżej (≤)";

  // Wypełnianie pól podsumowania (użycie textContent!)
  const poleOsoba = document.getElementById("podsumowanie-osoba");
  if (poleOsoba) poleOsoba.textContent = nazwisko;

  const poleKontakt = document.getElementById("podsumowanie-kontakt");
  if (poleKontakt) poleKontakt.textContent = etykietyKanalu[kanal] || email;

  const poleWaluta = document.getElementById("podsumowanie-waluta");
  if (poleWaluta) poleWaluta.textContent = `${waluta} / PLN (${etykietyRodzaju[rodzajKursu] || rodzajKursu})`;

  const poleWarunek = document.getElementById("podsumowanie-warunek");
  if (poleWarunek) poleWarunek.textContent = `${kierunekTekst} ${prog.toFixed(4)} PLN`;

  const poleTermin = document.getElementById("podsumowanie-termin");
  if (poleTermin) poleTermin.textContent = `Do dnia ${dataWaznosci} r. (dni robocze sesji NBP)`;

  const poleSzacowana = document.getElementById("podsumowanie-wartosc-szacowana");
  if (poleSzacowana) {
    if (kwota > 0) {
      const wartoscPln = (kwota * prog).toFixed(2);
      poleSzacowana.textContent = `${kwota.toLocaleString("pl-PL")} ${waluta} ≈ ${parseFloat(wartoscPln).toLocaleString("pl-PL")} PLN`;
    } else {
      poleSzacowana.textContent = "Nie podano kwoty wymiany (tylko powiadomienie kursowe)";
    }
  }

  // Prezentacja karty podsumowania
  const kartaPodsumowania = document.getElementById("alert-podsumowanie");
  if (kartaPodsumowania) {
    kartaPodsumowania.removeAttribute("hidden");
    kartaPodsumowania.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  // Ukrycie formularza po wysłaniu
  form.style.display = "none";
}

/**
 * Resetuje widok formularza, umożliwiając dodanie kolejnego alertu.
 */
function resetujDoNowegoAlertu() {
  const form = document.getElementById("formularz-alertu");
  const kartaPodsumowania = document.getElementById("alert-podsumowanie");
  ukryjBlad();

  if (form) {
    form.reset();
    form.style.display = "flex";
    form.scrollIntoView({ behavior: "smooth", block: "start" });
  }
  if (kartaPodsumowania) {
    kartaPodsumowania.setAttribute("hidden", "true");
  }
}

// Inicjalizacja zdarzeń po załadowaniu DOM
document.addEventListener("DOMContentLoaded", function() {
  const form = document.getElementById("formularz-alertu");
  if (!form) return;

  // Obsługa zatwierdzenia formularza (submit)
  form.addEventListener("submit", function(zdarzenie) {
    zdarzenie.preventDefault();

    if (walidujFormularzJS(form)) {
      pokazPodsumowanieAlertu(form);
    }
  });

  // Obsługa przycisku powrotu / nowego alertu (click)
  const przyciskNowy = document.getElementById("przycisk-nowy-alert");
  if (przyciskNowy) {
    przyciskNowy.addEventListener("click", resetujDoNowegoAlertu);
  }

  // Obsługa wyczyszczenia błędów przy zmianie pól (input / change)
  form.addEventListener("input", function() {
    ukryjBlad();
  });

  // Podpowiedź progu przy zmianie waluty
  const selectWaluta = document.getElementById("alert-waluta");
  const inputProg = document.getElementById("alert-prog");
  if (selectWaluta && inputProg) {
    selectWaluta.addEventListener("change", function() {
      const kod = selectWaluta.value;
      if (kod && KURSY_REFERENCYJNE[kod]) {
        // Domyślnie sugerujemy próg o 1% wyższy od aktualnego
        const sugerowany = (KURSY_REFERENCYJNE[kod] * 1.01).toFixed(4);
        inputProg.placeholder = `np. ${sugerowany}`;
      }
    });
  }
});
