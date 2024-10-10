export const mockRes = {
  response: [
    {
      questionText:
        "Šta ispisuje sledeći program na programskom jeziku Python?",
      questionNumber: 3,
      type: "coding",
      parameters: null,
      code: "def foo(numList): \n    pos = numList.index(max(numList)) \n    return max(numList[pos + 1:]) \n\nnumList = [[1, 5, 4, 2, 3], [2, 1, 5, 6, 4, 3], [0, 3, 1, 2]] \nnumList.append([i for i in range(5, 0, -2) if i != 3]) \nnewList = list(map(foo, numList)) \nprint(*newList)",
      formattedCode:
        "```python\ndef foo(numList): \n    pos = numList.index(max(numList)) \n    return max(numList[pos + 1:]) \n\nnumList = [[1, 5, 4, 2, 3], [2, 1, 5, 6, 4, 3], [0, 3, 1, 2]] \nnumList.append([i for i in range(5, 0, -2) if i != 3]) \nnewList = list(map(foo, numList)) \nprint(*newList)\n```",
      executionResult: "4 4 2 1",
      executionSuccess: true,
      explanation:
        "Kod definiše funkciju `foo` koja prima listu brojeva `numList`. Unutar funkcije, koristi se `max` da se pronađe maksimalna vrednost u listi i njen indeks. Zatim se vraća maksimalna vrednost iz podliste koja se nalazi desno od tog maksimuma.\n\nU glavnom delu koda, `numList` se inicijalizuje kao lista lista, a zatim se dodaje nova lista koja sadrži brojeve od 5 do 1, preskočivši 3. Funkcija `foo` se zatim primenjuje na svaku listu unutar `numList` koristeći `map`, što rezultira novom listom `newList`. Na kraju, rezultati se ispisuju.\n\nRezultat `4 4 2 1` dolazi iz sledećih koraka:\n1. Prva lista `[1, 5, 4, 2, 3]` - maksimum je 5, a sledeći maksimum je 4.\n2. Druga lista `[2, 1, 5, 6, 4, 3]` - maksimum je 6, a sledeći maksimum je 4.\n3. Treća lista `[0, 3, 1, 2]` - maksimum je 3, a sledeći maksimum je 2.\n4. Četvrta lista `[5, 1]` - maksimum je 5, a sledeći maksimum je 1.\n\nTako dobijamo rezultate 4, 4, 2 i 1.",
      reflectionLoopCount: 1,
    },
    {
      questionText:
        "Šta ispisuje sledeći program na programskom jeziku Python ukoliko se unese: 9xyzzw87ywyyx?",
      questionNumber: 4,
      type: "coding",
      parameters: ["9xyzzw87ywyyx"],
      code: "def process(s): \n    a = [x for x in s.strip() if x.isalpha() and not s.count(x) > 2] \n    b = a.copy() \n    b.reverse() \n    c = {} \n    for x in a: \n        if a.index(x) != len(a) - (b.index(x) + 1): \n            if x not in c: \n                c[2*x] = a.index(x) \n            else: \n                c[2*x] -= b.index(x) ,        else: \n            c[x] = 0 \n    return c \n\ndef write(d): \n    e = [k for k, v in d.items() if v] \n    e.sort(reverse=True) \n    print(' '.join(e)) \n\nwrite(process(input()))",
      formattedCode:
        "```python\ndef process(s): \n    a = [x for x in s.strip() if x.isalpha() and not s.count(x) > 2] \n    b = a.copy() \n    b.reverse() \n    c = {} \n    for x in a: \n        if a.index(x) != len(a) - (b.index(x) + 1): \n            if x not in c: \n                c[2*x] = a.index(x) \n            else: \n                c[2*x] -= b.index(x) \n        else: \n            c[x] = 0 \n    return c \n\ndef write(d): \n    e = [k for k, v in d.items() if v] \n    e.sort(reverse=True) \n    print(' '.join(e)) \n\n# Parameters\ninput_string = \"9xyzzw87ywyyx\"\nwrite(process(input_string))\n```",
      executionResult: "zz ww",
      executionSuccess: true,
      explanation:
        'Kod koji ste pružili se sastoji od dve funkcije: `process` i `write`. \n\n1. **Funkcija `process(s)`**:\n   - Prvo, uklanja sve nepotrebne razmake iz stringa `s` i filtrira karaktere tako da zadrži samo slova koja se pojavljuju najviše dva puta. Rezultat se čuva u listi `a`.\n   - Zatim, pravi kopiju liste `a` i obrće je, čuvajući je u listi `b`.\n   - Kreira se prazan rečnik `c` koji će sadržati rezultate.\n   - U petlji se prolazi kroz listu `a`, i za svaki karakter se proverava da li se nalazi na odgovarajućoj poziciji u obrnutom nizu `b`. Ako nije, dodaje se u rečnik `c` sa duplim karakterom kao ključem, a vrednost se ažurira na osnovu pozicije u `b`. Ako jeste, dodaje se u rečnik sa vrednošću 0.\n   - Na kraju, funkcija vraća rečnik `c`.\n\n2. **Funkcija `write(d)`**:\n   - Ova funkcija uzima rečnik `d`, filtrira ključeve koji imaju vrednost različitu od nule, sortira ih u opadajućem redosledu i ispisuje ih kao string.\n\nKada se pozove `write(process(input_string))` sa `input_string` kao "9xyzzw87ywyyx", funkcija `process` prvo obrađuje string i vraća rečnik sa ključevima koji su slova koja se pojavljuju najviše dva puta. U ovom slučaju, to su `zz` i `ww`, koji se zatim ispisuju u funkciji `write`. Rezultat izvršavanja je "zz ww".',
      reflectionLoopCount: 1,
    },
    {
      questionText:
        "Šta ispisuje sledeći program na programskom jeziku Python?",
      questionNumber: 5,
      type: "coding",
      parameters: null,
      code: 'def init (word): \n    chars = {} \n    for i in word: \n        chars[i] = 0 \n    return chars \n\n\ndef process (string, chars): \n    for i in string: \n        try: \n            chars[i] += 1 \n        except KeyError: \n            continue \n    return \nsentence = "rok u januaru"  \nmonth = "januar" \nchars = init(month) \nprocess (sentence, chars) \nfor k in month: \n    print(chars[k], end = "")',
      formattedCode:
        '```python\ndef init(word): \n    chars = {} \n    for i in word: \n        chars[i] = 0 \n    return chars \n\ndef process(string, chars): \n    for i in string: \n        try: \n            chars[i] += 1 \n        except KeyError: \n            continue \n    return \n\nsentence = "rok u januaru"  \nmonth = "januar" \nchars = init(month) \nprocess(sentence, chars) \n\nfor k in month: \n    print(chars[k], end="")\n```',
      executionResult: "121322",
      executionSuccess: true,
      explanation:
        "Ovaj kod broji koliko se puta svako slovo iz reči \"januar\" pojavljuje u rečenici \"rok u januaru\".\n\n1. Funkcija `init(word)` inicijalizuje rečnik `chars`, gde se svako slovo iz reči \"januar\" postavlja kao ključ sa početnom vrednošću 0. Tako dobijamo rečnik `{'j': 0, 'a': 0, 'n': 0, 'u': 0, 'r': 0}`.\n\n2. Funkcija `process(string, chars)` prolazi kroz svako slovo u rečenici \"rok u januaru\". Ako slovo postoji u rečniku `chars`, povećava njegovu vrednost za 1. Ako slovo ne postoji, nastavlja dalje bez greške.\n\n3. Na kraju, kod prolazi kroz svako slovo u reči \"januar\" i štampa broj pojavljivanja svakog slova u rečenici, bez razmaka. Rezultat je \"121322\", što znači da se:\n   - 'j' pojavljuje 1 put,\n   - 'a' 2 puta,\n   - 'n' 1 put,\n   - 'u' 2 puta,\n   - 'r' 2 puta. \n\nTako se dolazi do krajnjeg rezultata.",
      reflectionLoopCount: 1,
    },
  ],
};
