# CONTRIBUTING – KursyWalut

Projekt: strona z historycznymi kursami walut (HTML5, CSS3, czysty JS, Chart.js).
Ten plik zmieniamy tylko przez PR zatwierdzony przez obu autorów.

## 1. Podział pracy (kto jakie pliki zmienia)
| Osoba | Pliki |
|---|---|
| A | `data/`, `js/data.js`, `js/table.js`, `js/analiza.js`, `js/kalkulator.js` |
| B | `*.html`, `css/style.css`, `js/formularz.js`, `img/` |
| Wspólne (przez PR) | `README.md`, `docs/`, `js/common.js`, ten plik |

Nie edytujemy cudzych plików. Potrzebna zmiana → napisz do właściciela lub otwórz PR z prośbą o review.

## 2. Format danych
Plik `js/data.js` definiuje tablicę `kursy`. Jeden rekord = jedna waluta w jednym dniu:

    { waluta: "EUR", data: "2026-10-19", sredni: 4.2315, kupno: 4.2020, sprzedaz: 4.2870 }

- `waluta`: kod ISO 4217 wielkimi literami (USD, EUR, GBP, CHF, CZK, JPY)
- `data`: tekst `RRRR-MM-DD`
- `sredni`: liczba (kurs średni NBP, tabela A, w PLN za 1 jednostkę; JPY przeliczone na 1)
- `kupno`, `sprzedaz`: liczba albo `null`, jeśli NBP nie publikuje (tabela C)
- Kwoty zawsze jako liczby, nigdy jako tekst, z kropką dziesiętną.
- Każdy rekord ma wszystkie pola. Formatu nie zmieniamy bez zgody obu osób.

## 3. Nazwy elementów (HTML ↔ JS)
Nazwy `id` zapisujemy małymi literami z myślnikami. B tworzy elementy, A podpina logikę.
Zmiana nazwy bez uzgodnienia jest niedozwolona. Nowe elementy dopisujemy do tabeli.

| Strona | id | Opis |
|---|---|---|
| index | `kalk-kwota`, `kalk-z`, `kalk-na`, `kalk-data`, `kalk-rodzaj`, `kalk-przelicz`, `kalk-wynik` | kalkulator |
| index | `mini-wykres` | canvas mini-wykresu |
| dane | `filtr-waluta`, `filtr-od`, `filtr-do`, `filtr-szukaj`, `tabela-kursow` | filtry i tabela |
| dane | `th[data-sort="data"]`, `th[data-sort="sredni"]` itd. | nagłówki do sortowania |
| analiza | `wskaznik-min`, `wskaznik-max`, `wskaznik-srednia`, `wskaznik-zmiana`, `wykres-glowny` | dashboard |
| wszystkie | `przelacznik-motywu` | motyw jasny/ciemny |

Klasy CSS: `kebab-case` (np. `karta-waluty`). Funkcje i zmienne JS: `camelCase`, konsekwentnie w jednym języku w całym projekcie.

## 4. Git
- `main` jest zawsze działający i nie pushujemy do niego bezpośrednio.
- Gałąź na krok: `feat/<krok>` (np. `feat/tabela`, `feat/css-baza`).
- Jeden PR na zakończony krok, merge przez *squash*. Opis PR: co zrobiono i jak to sprawdzić.
- Drugą osobę prosimy o krótki review przed scaleniem.
- Przed rozpoczęciem pracy: `git pull` na `main` i nowa gałąź.
- Do repo nie trafiają pliki tymczasowe.

## 5. Styl kodu
- Wcięcie 2 spacje, kodowanie UTF-8.
- Komentarz przy każdej funkcji (co robi, co przyjmuje, co zwraca) – to ułatwia obronę.
- Brak powielonego kodu: wspólne rzeczy trafiają do funkcji.
- Brak `innerHTML` z danymi od użytkownika; używamy `textContent` (ochrona przed XSS).
- Żadnych błędów w konsoli przed zamknięciem PR.

## 6. Definicja „gotowe”
Krok jest zamknięty, gdy: działa w Chrome/Firefox na desktopie i w widoku mobilnym, konsola jest czysta, wszystkie linki i obrazki się ładują, a kod ma komentarze.

