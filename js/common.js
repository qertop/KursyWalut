/**
 * KursyWalut - Wspólna logika dla wszystkich podstron
 * Obsługa motywu (jasny / ciemny) z zapisem w localStorage.
 */

// Klucz używany w pamięci podręcznej przeglądarki do zapamiętania motywu
const KLUCZ_MOTYWU = "kursywalut_motyw";

/**
 * Pobiera zapisany motyw z localStorage lub sprawdza preferencje systemowe.
 * @returns {string} "dark" lub "light"
 */
function pobierzPoczatkowyMotyw() {
  const zapisany = localStorage.getItem(KLUCZ_MOTYWU);
  if (zapisany === "dark" || zapisany === "light") {
    return zapisany;
  }
  const preferujeCiemny = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
  return preferujeCiemny ? "dark" : "light";
}

/**
 * Ustawia wybrany motyw na elemencie <html> i aktualizuje etykietę przycisku.
 * @param {string} motyw - "dark" lub "light"
 */
function ustawMotyw(motyw) {
  if (motyw === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
  } else {
    document.documentElement.removeAttribute("data-theme");
  }

  const przycisk = document.getElementById("przelacznik-motywu");
  if (przycisk) {
    if (motyw === "dark") {
      przycisk.textContent = "☀️ Motyw jasny";
      przycisk.setAttribute("aria-label", "Przełącz na motyw jasny");
    } else {
      przycisk.textContent = "🌙 Motyw ciemny";
      przycisk.setAttribute("aria-label", "Przełącz na motyw ciemny");
    }
  }

  localStorage.setItem(KLUCZ_MOTYWU, motyw);
}

/**
 * Przełącza bieżący motyw na przeciwny.
 */
function przelaczMotyw() {
  const aktualny = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
  const nowy = aktualny === "dark" ? "light" : "dark";
  ustawMotyw(nowy);
}

// Inicjalizacja motywu po załadowaniu drzewa DOM
document.addEventListener("DOMContentLoaded", function() {
  const motyw = pobierzPoczatkowyMotyw();
  ustawMotyw(motyw);

  const przycisk = document.getElementById("przelacznik-motywu");
  if (przycisk) {
    przycisk.addEventListener("click", przelaczMotyw);
  }
});
