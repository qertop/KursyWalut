/**
 * KursyWalut - dane kursów walut i funkcje pomocnicze do ich odczytu.
 *
 * Źródło: API NBP (https://api.nbp.pl/), okres 2026-10-01 – 2026-11-13.
 *   - kurs średni: tabela A
 *   - kupno i sprzedaż: tabela C
 * Wszystkie kursy w PLN za 1 jednostkę waluty (także JPY).
 * Format rekordu opisuje CONTRIBUTING.md, sekcja 2.
 */

// Nazwy walut wyświetlane na stronie (kolumna „Nazwa waluty”, wyszukiwarka)
const nazwyWalut = {
  USD: "Dolar amerykański",
  EUR: "Euro",
  JPY: "Jen japoński",
  GBP: "Funt szterling",
  AUD: "Dolar australijski",
  CHF: "Frank szwajcarski",
  PLN: "Złoty polski"
};

// Notowania NBP: jeden rekord = jedna waluta w jednym dniu publikacji
const kursy = [
  { waluta: "USD", data: "2026-10-01", sredni: 3.8762, kupno: 3.8043, sprzedaz: 3.8811 },
  { waluta: "USD", data: "2026-10-02", sredni: 3.8881, kupno: 3.8341, sprzedaz: 3.9115 },
  { waluta: "USD", data: "2026-10-05", sredni: 3.9116, kupno: 3.8419, sprzedaz: 3.9195 },
  { waluta: "USD", data: "2026-10-06", sredni: 3.8868, kupno: 3.8747, sprzedaz: 3.9529 },
  { waluta: "USD", data: "2026-10-07", sredni: 3.9111, kupno: 3.8444, sprzedaz: 3.9220 },
  { waluta: "USD", data: "2026-10-08", sredni: 3.9132, kupno: 3.8754, sprzedaz: 3.9536 },
  { waluta: "USD", data: "2026-10-09", sredni: 3.9022, kupno: 3.8719, sprzedaz: 3.9501 },
  { waluta: "USD", data: "2026-10-12", sredni: 3.9211, kupno: 3.8813, sprzedaz: 3.9597 },
  { waluta: "USD", data: "2026-10-13", sredni: 3.9177, kupno: 3.8848, sprzedaz: 3.9632 },
  { waluta: "USD", data: "2026-10-14", sredni: 3.9042, kupno: 3.8709, sprzedaz: 3.9491 },
  { waluta: "USD", data: "2026-10-15", sredni: 3.8952, kupno: 3.8920, sprzedaz: 3.9706 },
  { waluta: "USD", data: "2026-10-16", sredni: 3.8827, kupno: 3.8581, sprzedaz: 3.9361 },
  { waluta: "USD", data: "2026-10-19", sredni: 3.8974, kupno: 3.8414, sprzedaz: 3.9190 },
  { waluta: "USD", data: "2026-10-20", sredni: 3.8959, kupno: 3.8549, sprzedaz: 3.9327 },
  { waluta: "USD", data: "2026-10-21", sredni: 3.8889, kupno: 3.8476, sprzedaz: 3.9254 },
  { waluta: "USD", data: "2026-10-22", sredni: 3.8886, kupno: 3.8434, sprzedaz: 3.9210 },
  { waluta: "USD", data: "2026-10-23", sredni: 3.9247, kupno: 3.8664, sprzedaz: 3.9446 },
  { waluta: "USD", data: "2026-10-26", sredni: 3.9293, kupno: 3.8863, sprzedaz: 3.9649 },
  { waluta: "USD", data: "2026-10-27", sredni: 3.9542, kupno: 3.8986, sprzedaz: 3.9774 },
  { waluta: "USD", data: "2026-10-28", sredni: 3.9624, kupno: 3.9054, sprzedaz: 3.9842 },
  { waluta: "USD", data: "2026-10-29", sredni: 3.9473, kupno: 3.9153, sprzedaz: 3.9943 },
  { waluta: "USD", data: "2026-10-30", sredni: 3.9251, kupno: 3.8951, sprzedaz: 3.9737 },
  { waluta: "USD", data: "2026-11-02", sredni: 3.9389, kupno: 3.9035, sprzedaz: 3.9823 },
  { waluta: "USD", data: "2026-11-03", sredni: 3.9526, kupno: 3.9023, sprzedaz: 3.9811 },
  { waluta: "USD", data: "2026-11-04", sredni: 3.9097, kupno: 3.9034, sprzedaz: 3.9822 },
  { waluta: "USD", data: "2026-11-05", sredni: 3.9101, kupno: 3.8720, sprzedaz: 3.9502 },
  { waluta: "USD", data: "2026-11-06", sredni: 3.9321, kupno: 3.8781, sprzedaz: 3.9565 },
  { waluta: "USD", data: "2026-11-09", sredni: 3.9199, kupno: 3.9021, sprzedaz: 3.9809 },
  { waluta: "USD", data: "2026-11-10", sredni: 3.9099, kupno: 3.8790, sprzedaz: 3.9574 },
  { waluta: "USD", data: "2026-11-12", sredni: 3.9676, kupno: 3.8929, sprzedaz: 3.9715 },
  { waluta: "USD", data: "2026-11-13", sredni: 3.9852, kupno: 3.9382, sprzedaz: 4.0178 },
  { waluta: "EUR", data: "2026-10-01", sredni: 4.377, kupno: 4.3202, sprzedaz: 4.4074 },
  { waluta: "EUR", data: "2026-10-02", sredni: 4.3745, kupno: 4.3312, sprzedaz: 4.4186 },
  { waluta: "EUR", data: "2026-10-05", sredni: 4.3855, kupno: 4.3321, sprzedaz: 4.4197 },
  { waluta: "EUR", data: "2026-10-06", sredni: 4.3699, kupno: 4.3355, sprzedaz: 4.4231 },
  { waluta: "EUR", data: "2026-10-07", sredni: 4.3797, kupno: 4.3251, sprzedaz: 4.4125 },
  { waluta: "EUR", data: "2026-10-08", sredni: 4.3789, kupno: 4.3353, sprzedaz: 4.4229 },
  { waluta: "EUR", data: "2026-10-09", sredni: 4.3775, kupno: 4.3346, sprzedaz: 4.4222 },
  { waluta: "EUR", data: "2026-10-12", sredni: 4.3889, kupno: 4.3447, sprzedaz: 4.4325 },
  { waluta: "EUR", data: "2026-10-13", sredni: 4.3806, kupno: 4.3422, sprzedaz: 4.4300 },
  { waluta: "EUR", data: "2026-10-14", sredni: 4.3706, kupno: 4.3304, sprzedaz: 4.4178 },
  { waluta: "EUR", data: "2026-10-15", sredni: 4.3691, kupno: 4.3261, sprzedaz: 4.4135 },
  { waluta: "EUR", data: "2026-10-16", sredni: 4.3661, kupno: 4.3285, sprzedaz: 4.4159 },
  { waluta: "EUR", data: "2026-10-19", sredni: 4.3702, kupno: 4.3250, sprzedaz: 4.4124 },
  { waluta: "EUR", data: "2026-10-20", sredni: 4.3716, kupno: 4.3263, sprzedaz: 4.4137 },
  { waluta: "EUR", data: "2026-10-21", sredni: 4.3641, kupno: 4.3228, sprzedaz: 4.4102 },
  { waluta: "EUR", data: "2026-10-22", sredni: 4.3685, kupno: 4.3159, sprzedaz: 4.4031 },
  { waluta: "EUR", data: "2026-10-23", sredni: 4.3917, kupno: 4.3281, sprzedaz: 4.4155 },
  { waluta: "EUR", data: "2026-10-26", sredni: 4.4026, kupno: 4.3525, sprzedaz: 4.4405 },
  { waluta: "EUR", data: "2026-10-27", sredni: 4.4056, kupno: 4.3601, sprzedaz: 4.4481 },
  { waluta: "EUR", data: "2026-10-28", sredni: 4.409, kupno: 4.3539, sprzedaz: 4.4419 },
  { waluta: "EUR", data: "2026-10-29", sredni: 4.3951, kupno: 4.3597, sprzedaz: 4.4477 },
  { waluta: "EUR", data: "2026-10-30", sredni: 4.3955, kupno: 4.3473, sprzedaz: 4.4351 },
  { waluta: "EUR", data: "2026-11-02", sredni: 4.4185, kupno: 4.3547, sprzedaz: 4.4427 },
  { waluta: "EUR", data: "2026-11-03", sredni: 4.4233, kupno: 4.3758, sprzedaz: 4.4642 },
  { waluta: "EUR", data: "2026-11-04", sredni: 4.4014, kupno: 4.3709, sprzedaz: 4.4593 },
  { waluta: "EUR", data: "2026-11-05", sredni: 4.3916, kupno: 4.3564, sprzedaz: 4.4444 },
  { waluta: "EUR", data: "2026-11-06", sredni: 4.3925, kupno: 4.3494, sprzedaz: 4.4372 },
  { waluta: "EUR", data: "2026-11-09", sredni: 4.3873, kupno: 4.3510, sprzedaz: 4.4390 },
  { waluta: "EUR", data: "2026-11-10", sredni: 4.3895, kupno: 4.3433, sprzedaz: 4.4311 },
  { waluta: "EUR", data: "2026-11-12", sredni: 4.4018, kupno: 4.3514, sprzedaz: 4.4394 },
  { waluta: "EUR", data: "2026-11-13", sredni: 4.407, kupno: 4.3615, sprzedaz: 4.4497 },
  { waluta: "JPY", data: "2026-10-01", sredni: 0.024476, kupno: 0.024263, sprzedaz: 0.024753 },
  { waluta: "JPY", data: "2026-10-02", sredni: 0.024677, kupno: 0.024277, sprzedaz: 0.024767 },
  { waluta: "JPY", data: "2026-10-05", sredni: 0.02478, kupno: 0.024395, sprzedaz: 0.024887 },
  { waluta: "JPY", data: "2026-10-06", sredni: 0.024567, kupno: 0.0245, sprzedaz: 0.024994 },
  { waluta: "JPY", data: "2026-10-07", sredni: 0.024725, kupno: 0.024314, sprzedaz: 0.024806 },
  { waluta: "JPY", data: "2026-10-08", sredni: 0.024729, kupno: 0.0245, sprzedaz: 0.024994 },
  { waluta: "JPY", data: "2026-10-09", sredni: 0.024681, kupno: 0.024485, sprzedaz: 0.024979 },
  { waluta: "JPY", data: "2026-10-12", sredni: 0.024746, kupno: 0.024509, sprzedaz: 0.025005 },
  { waluta: "JPY", data: "2026-10-13", sredni: 0.024818, kupno: 0.024489, sprzedaz: 0.024983 },
  { waluta: "JPY", data: "2026-10-14", sredni: 0.024638, kupno: 0.024438, sprzedaz: 0.024932 },
  { waluta: "JPY", data: "2026-10-15", sredni: 0.024678, kupno: 0.024487, sprzedaz: 0.024981 },
  { waluta: "JPY", data: "2026-10-16", sredni: 0.024574, kupno: 0.024481, sprzedaz: 0.024975 },
  { waluta: "JPY", data: "2026-10-19", sredni: 0.02464, kupno: 0.024349, sprzedaz: 0.024841 },
  { waluta: "JPY", data: "2026-10-20", sredni: 0.024633, kupno: 0.024345, sprzedaz: 0.024837 },
  { waluta: "JPY", data: "2026-10-21", sredni: 0.024591, kupno: 0.024353, sprzedaz: 0.024845 },
  { waluta: "JPY", data: "2026-10-22", sredni: 0.024764, kupno: 0.024322, sprzedaz: 0.024814 },
  { waluta: "JPY", data: "2026-10-23", sredni: 0.025026, kupno: 0.024587, sprzedaz: 0.025083 },
  { waluta: "JPY", data: "2026-10-26", sredni: 0.024969, kupno: 0.024794, sprzedaz: 0.025294 },
  { waluta: "JPY", data: "2026-10-27", sredni: 0.025068, kupno: 0.024753, sprzedaz: 0.025253 },
  { waluta: "JPY", data: "2026-10-28", sredni: 0.025104, kupno: 0.024762, sprzedaz: 0.025262 },
  { waluta: "JPY", data: "2026-10-29", sredni: 0.02499, kupno: 0.024753, sprzedaz: 0.025253 },
  { waluta: "JPY", data: "2026-10-30", sredni: 0.024953, kupno: 0.024674, sprzedaz: 0.025172 },
  { waluta: "JPY", data: "2026-11-02", sredni: 0.024936, kupno: 0.024819, sprzedaz: 0.025321 },
  { waluta: "JPY", data: "2026-11-03", sredni: 0.024998, kupno: 0.024753, sprzedaz: 0.025253 },
  { waluta: "JPY", data: "2026-11-04", sredni: 0.024681, kupno: 0.024663, sprzedaz: 0.025161 },
  { waluta: "JPY", data: "2026-11-05", sredni: 0.024695, kupno: 0.024429, sprzedaz: 0.024923 },
  { waluta: "JPY", data: "2026-11-06", sredni: 0.024832, kupno: 0.024529, sprzedaz: 0.025025 },
  { waluta: "JPY", data: "2026-11-09", sredni: 0.024802, kupno: 0.024648, sprzedaz: 0.025146 },
  { waluta: "JPY", data: "2026-11-10", sredni: 0.024729, kupno: 0.024538, sprzedaz: 0.025034 },
  { waluta: "JPY", data: "2026-11-12", sredni: 0.024843, kupno: 0.024532, sprzedaz: 0.025028 },
  { waluta: "JPY", data: "2026-11-13", sredni: 0.024927, kupno: 0.024635, sprzedaz: 0.025133 },
  { waluta: "GBP", data: "2026-10-01", sredni: 5.1214, kupno: 5.0532, sprzedaz: 5.1552 },
  { waluta: "GBP", data: "2026-10-02", sredni: 5.1353, kupno: 5.0745, sprzedaz: 5.1771 },
  { waluta: "GBP", data: "2026-10-05", sredni: 5.1759, kupno: 5.0895, sprzedaz: 5.1923 },
  { waluta: "GBP", data: "2026-10-06", sredni: 5.1468, kupno: 5.1135, sprzedaz: 5.2169 },
  { waluta: "GBP", data: "2026-10-07", sredni: 5.1785, kupno: 5.1001, sprzedaz: 5.2031 },
  { waluta: "GBP", data: "2026-10-08", sredni: 5.1635, kupno: 5.1181, sprzedaz: 5.2215 },
  { waluta: "GBP", data: "2026-10-09", sredni: 5.1655, kupno: 5.1161, sprzedaz: 5.2195 },
  { waluta: "GBP", data: "2026-10-12", sredni: 5.1906, kupno: 5.1337, sprzedaz: 5.2375 },
  { waluta: "GBP", data: "2026-10-13", sredni: 5.1857, kupno: 5.1403, sprzedaz: 5.2441 },
  { waluta: "GBP", data: "2026-10-14", sredni: 5.1775, kupno: 5.1256, sprzedaz: 5.2292 },
  { waluta: "GBP", data: "2026-10-15", sredni: 5.1647, kupno: 5.1248, sprzedaz: 5.2284 },
  { waluta: "GBP", data: "2026-10-16", sredni: 5.1746, kupno: 5.1167, sprzedaz: 5.2201 },
  { waluta: "GBP", data: "2026-10-19", sredni: 5.1946, kupno: 5.1321, sprzedaz: 5.2357 },
  { waluta: "GBP", data: "2026-10-20", sredni: 5.2003, kupno: 5.1378, sprzedaz: 5.2416 },
  { waluta: "GBP", data: "2026-10-21", sredni: 5.2112, kupno: 5.1527, sprzedaz: 5.2567 },
  { waluta: "GBP", data: "2026-10-22", sredni: 5.2133, kupno: 5.145, sprzedaz: 5.249 },
  { waluta: "GBP", data: "2026-10-23", sredni: 5.2498, kupno: 5.1704, sprzedaz: 5.2748 },
  { waluta: "GBP", data: "2026-10-26", sredni: 5.2428, kupno: 5.198, sprzedaz: 5.303 },
  { waluta: "GBP", data: "2026-10-27", sredni: 5.2654, kupno: 5.2029, sprzedaz: 5.3081 },
  { waluta: "GBP", data: "2026-10-28", sredni: 5.2645, kupno: 5.2033, sprzedaz: 5.3085 },
  { waluta: "GBP", data: "2026-10-29", sredni: 5.2545, kupno: 5.2071, sprzedaz: 5.3123 },
  { waluta: "GBP", data: "2026-10-30", sredni: 5.2701, kupno: 5.2023, sprzedaz: 5.3073 },
  { waluta: "GBP", data: "2026-11-02", sredni: 5.2869, kupno: 5.2287, sprzedaz: 5.3343 },
  { waluta: "GBP", data: "2026-11-03", sredni: 5.3037, kupno: 5.2383, sprzedaz: 5.3441 },
  { waluta: "GBP", data: "2026-11-04", sredni: 5.2737, kupno: 5.2425, sprzedaz: 5.3485 },
  { waluta: "GBP", data: "2026-11-05", sredni: 5.2644, kupno: 5.2185, sprzedaz: 5.3239 },
  { waluta: "GBP", data: "2026-11-06", sredni: 5.2630, kupno: 5.2214, sprzedaz: 5.3268 },
  { waluta: "GBP", data: "2026-11-09", sredni: 5.2593, kupno: 5.2152, sprzedaz: 5.3206 },
  { waluta: "GBP", data: "2026-11-10", sredni: 5.2490, kupno: 5.2019, sprzedaz: 5.3069 },
  { waluta: "GBP", data: "2026-11-12", sredni: 5.2659, kupno: 5.2063, sprzedaz: 5.3115 },
  { waluta: "GBP", data: "2026-11-13", sredni: 5.2737, kupno: 5.2172, sprzedaz: 5.3226 },
  { waluta: "AUD", data: "2026-10-01", sredni: 2.6894, kupno: 2.647, sprzedaz: 2.7004 },
  { waluta: "AUD", data: "2026-10-02", sredni: 2.6990, kupno: 2.6653, sprzedaz: 2.7191 },
  { waluta: "AUD", data: "2026-10-05", sredni: 2.7237, kupno: 2.6796, sprzedaz: 2.7338 },
  { waluta: "AUD", data: "2026-10-06", sredni: 2.7109, kupno: 2.694, sprzedaz: 2.7484 },
  { waluta: "AUD", data: "2026-10-07", sredni: 2.7271, kupno: 2.6827, sprzedaz: 2.7369 },
  { waluta: "AUD", data: "2026-10-08", sredni: 2.7211, kupno: 2.6944, sprzedaz: 2.7488 },
  { waluta: "AUD", data: "2026-10-09", sredni: 2.7227, kupno: 2.6924, sprzedaz: 2.7468 },
  { waluta: "AUD", data: "2026-10-12", sredni: 2.7331, kupno: 2.7075, sprzedaz: 2.7621 },
  { waluta: "AUD", data: "2026-10-13", sredni: 2.7311, kupno: 2.7069, sprzedaz: 2.7615 },
  { waluta: "AUD", data: "2026-10-14", sredni: 2.7362, kupno: 2.7002, sprzedaz: 2.7548 },
  { waluta: "AUD", data: "2026-10-15", sredni: 2.6992, kupno: 2.7074, sprzedaz: 2.762 },
  { waluta: "AUD", data: "2026-10-16", sredni: 2.7025, kupno: 2.6636, sprzedaz: 2.7174 },
  { waluta: "AUD", data: "2026-10-19", sredni: 2.7194, kupno: 2.672, sprzedaz: 2.726 },
  { waluta: "AUD", data: "2026-10-20", sredni: 2.7253, kupno: 2.6944, sprzedaz: 2.7488 },
  { waluta: "AUD", data: "2026-10-21", sredni: 2.7329, kupno: 2.6935, sprzedaz: 2.7479 },
  { waluta: "AUD", data: "2026-10-22", sredni: 2.7273, kupno: 2.6988, sprzedaz: 2.7534 },
  { waluta: "AUD", data: "2026-10-23", sredni: 2.7526, kupno: 2.7118, sprzedaz: 2.7666 },
  { waluta: "AUD", data: "2026-10-26", sredni: 2.7648, kupno: 2.7331, sprzedaz: 2.7883 },
  { waluta: "AUD", data: "2026-10-27", sredni: 2.7787, kupno: 2.7354, sprzedaz: 2.7906 },
  { waluta: "AUD", data: "2026-10-28", sredni: 2.7852, kupno: 2.7489, sprzedaz: 2.8045 },
  { waluta: "AUD", data: "2026-10-29", sredni: 2.7761, kupno: 2.7542, sprzedaz: 2.8098 },
  { waluta: "AUD", data: "2026-10-30", sredni: 2.7598, kupno: 2.737, sprzedaz: 2.7922 },
  { waluta: "AUD", data: "2026-11-02", sredni: 2.7655, kupno: 2.7461, sprzedaz: 2.8015 },
  { waluta: "AUD", data: "2026-11-03", sredni: 2.7576, kupno: 2.7391, sprzedaz: 2.7945 },
  { waluta: "AUD", data: "2026-11-04", sredni: 2.7426, kupno: 2.7273, sprzedaz: 2.7823 },
  { waluta: "AUD", data: "2026-11-05", sredni: 2.7418, kupno: 2.7168, sprzedaz: 2.7716 },
  { waluta: "AUD", data: "2026-11-06", sredni: 2.7010, kupno: 2.7065, sprzedaz: 2.7611 },
  { waluta: "AUD", data: "2026-11-09", sredni: 2.7060, kupno: 2.6893, sprzedaz: 2.7437 },
  { waluta: "AUD", data: "2026-11-10", sredni: 2.7028, kupno: 2.6773, sprzedaz: 2.7313 },
  { waluta: "AUD", data: "2026-11-12", sredni: 2.7085, kupno: 2.6775, sprzedaz: 2.7315 },
  { waluta: "AUD", data: "2026-11-13", sredni: 2.7083, kupno: 2.6845, sprzedaz: 2.7387 },
  { waluta: "CHF", data: "2026-10-01", sredni: 4.6408, kupno: 4.5595, sprzedaz: 4.6517 },
  { waluta: "CHF", data: "2026-10-02", sredni: 4.6942, kupno: 4.5997, sprzedaz: 4.6927 },
  { waluta: "CHF", data: "2026-10-05", sredni: 4.7166, kupno: 4.6405, sprzedaz: 4.7343 },
  { waluta: "CHF", data: "2026-10-06", sredni: 4.6722, kupno: 4.6583, sprzedaz: 4.7525 },
  { waluta: "CHF", data: "2026-10-07", sredni: 4.6942, kupno: 4.6188, sprzedaz: 4.7122 },
  { waluta: "CHF", data: "2026-10-08", sredni: 4.6926, kupno: 4.6526, sprzedaz: 4.7466 },
  { waluta: "CHF", data: "2026-10-09", sredni: 4.6946, kupno: 4.6452, sprzedaz: 4.7390 },
  { waluta: "CHF", data: "2026-10-12", sredni: 4.7111, kupno: 4.6684, sprzedaz: 4.7628 },
  { waluta: "CHF", data: "2026-10-13", sredni: 4.7032, kupno: 4.6620, sprzedaz: 4.7562 },
  { waluta: "CHF", data: "2026-10-14", sredni: 4.6835, kupno: 4.6461, sprzedaz: 4.7399 },
  { waluta: "CHF", data: "2026-10-15", sredni: 4.6949, kupno: 4.6415, sprzedaz: 4.7353 },
  { waluta: "CHF", data: "2026-10-16", sredni: 4.7099, kupno: 4.6636, sprzedaz: 4.7578 },
  { waluta: "CHF", data: "2026-10-19", sredni: 4.7274, kupno: 4.6706, sprzedaz: 4.7650 },
  { waluta: "CHF", data: "2026-10-20", sredni: 4.7227, kupno: 4.6730, sprzedaz: 4.7674 },
  { waluta: "CHF", data: "2026-10-21", sredni: 4.7167, kupno: 4.6708, sprzedaz: 4.7652 },
  { waluta: "CHF", data: "2026-10-22", sredni: 4.7424, kupno: 4.6621, sprzedaz: 4.7563 },
  { waluta: "CHF", data: "2026-10-23", sredni: 4.7681, kupno: 4.6924, sprzedaz: 4.7872 },
  { waluta: "CHF", data: "2026-10-26", sredni: 4.7562, kupno: 4.7174, sprzedaz: 4.8128 },
  { waluta: "CHF", data: "2026-10-27", sredni: 4.7729, kupno: 4.7113, sprzedaz: 4.8065 },
  { waluta: "CHF", data: "2026-10-28", sredni: 4.7722, kupno: 4.7149, sprzedaz: 4.8101 },
  { waluta: "CHF", data: "2026-10-29", sredni: 4.7628, kupno: 4.7165, sprzedaz: 4.8117 },
  { waluta: "CHF", data: "2026-10-30", sredni: 4.7795, kupno: 4.7102, sprzedaz: 4.8054 },
  { waluta: "CHF", data: "2026-11-02", sredni: 4.7983, kupno: 4.7352, sprzedaz: 4.8308 },
  { waluta: "CHF", data: "2026-11-03", sredni: 4.8324, kupno: 4.7649, sprzedaz: 4.8611 },
  { waluta: "CHF", data: "2026-11-04", sredni: 4.7883, kupno: 4.7606, sprzedaz: 4.8568 },
  { waluta: "CHF", data: "2026-11-05", sredni: 4.7844, kupno: 4.7380, sprzedaz: 4.8338 },
  { waluta: "CHF", data: "2026-11-06", sredni: 4.8037, kupno: 4.7547, sprzedaz: 4.8507 },
  { waluta: "CHF", data: "2026-11-09", sredni: 4.7925, kupno: 4.7555, sprzedaz: 4.8515 },
  { waluta: "CHF", data: "2026-11-10", sredni: 4.7637, kupno: 4.7218, sprzedaz: 4.8172 },
  { waluta: "CHF", data: "2026-11-12", sredni: 4.7703, kupno: 4.7219, sprzedaz: 4.8173 },
  { waluta: "CHF", data: "2026-11-13", sredni: 4.7618, kupno: 4.7221, sprzedaz: 4.8175 }
];

/**
 * Zwraca wszystkie notowania jednej waluty posortowane rosnąco po dacie.
 * @param {string} waluta - kod ISO 4217, np. "EUR"
 * @returns {Array<Object>} nowa tablica rekordów (pusta, gdy brak waluty)
 */
function pobierzKursyWaluty(waluta) {
  return kursy
    .filter(function (rekord) { return rekord.waluta === waluta; })
    .sort(function (a, b) { return a.data.localeCompare(b.data); });
}

/**
 * Zwraca kurs waluty z podanego dnia. Jeśli tego dnia NBP nie publikował
 * kursów (weekend, święto), zwraca kurs z ostatniego wcześniejszego dnia.
 * @param {string} waluta - kod ISO 4217, np. "EUR"; dla "PLN" zawsze 1
 * @param {string} data - data w formacie "RRRR-MM-DD"
 * @param {string} rodzaj - "sredni", "kupno" albo "sprzedaz"
 * @returns {number|null} kurs w PLN za 1 jednostkę albo null, gdy brak danych
 */
function znajdzKurs(waluta, data, rodzaj) {
  if (waluta === "PLN") {
    return 1;
  }
  const notowania = pobierzKursyWaluty(waluta);
  let znaleziony = null;
  // Daty "RRRR-MM-DD" można porównywać jak tekst
  for (let i = 0; i < notowania.length; i++) {
    if (notowania[i].data <= data) {
      znaleziony = notowania[i];
    } else {
      break;
    }
  }
  if (znaleziony === null || typeof znaleziony[rodzaj] !== "number") {
    return null;
  }
  return znaleziony[rodzaj];
}

/**
 * Zwraca listę kodów walut, które występują w danych.
 * @returns {Array<string>} posortowane alfabetycznie kody, np. ["AUD", "CHF", ...]
 */
function listaWalut() {
  const kody = [];
  kursy.forEach(function (rekord) {
    if (kody.indexOf(rekord.waluta) === -1) {
      kody.push(rekord.waluta);
    }
  });
  return kody.sort();
}

/**
 * Zwraca najnowszą datę notowania w danych.
 * @returns {string|null} data "RRRR-MM-DD" albo null, gdy brak danych
 */
function ostatniaData() {
  let najnowsza = null;
  kursy.forEach(function (rekord) {
    if (najnowsza === null || rekord.data > najnowsza) {
      najnowsza = rekord.data;
    }
  });
  return najnowsza;
}
