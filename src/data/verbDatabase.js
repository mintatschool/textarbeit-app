
import { Tense } from '../utils/verbUtils';

// Diese Datenbank ermöglicht Offline-Funktionalität.



// Hilfsfunktion für regelmäßige Verben
const createRegularVerb = (stem) => {
  return {
    [Tense.PRAESENS]: { ich: `${stem}e`, du: `${stem}st`, er_sie_es: `${stem}t`, wir: `${stem}en`, ihr: `${stem}t`, sie_Sie: `${stem}en` },
    [Tense.PRAETERITUM]: { ich: `${stem}te`, du: `${stem}test`, er_sie_es: `${stem}te`, wir: `${stem}ten`, ihr: `${stem}tet`, sie_Sie: `${stem}ten` },
    [Tense.PERFEKT]: { ich: `habe ge${stem}t`, du: `hast ge${stem}t`, er_sie_es: `hat ge${stem}t`, wir: `haben ge${stem}t`, ihr: `habt ge${stem}t`, sie_Sie: `haben ge${stem}t` },
    [Tense.PLUSQUAMPERFEKT]: { ich: `hatte ge${stem}t`, du: `hattest ge${stem}t`, er_sie_es: `hatte ge${stem}t`, wir: `hatten ge${stem}t`, ihr: `hattet ge${stem}t`, sie_Sie: `hatten ge${stem}t` },
    [Tense.FUTUR_I]: { ich: `werde ${stem}en`, du: `wirst ${stem}en`, er_sie_es: `wird ${stem}en`, wir: `werden ${stem}en`, ihr: `werdet ${stem}en`, sie_Sie: `werden ${stem}en` },
  };
};

// Hilfsfunktion für trennbare Verben (einfache Näherung für Offline-Modus: Präfix am Ende angehängt bei konjugierten Formen)
const createSeparableVerb = (prefix, stem, infinitiveStem) => {
  return {
    [Tense.PRAESENS]: { ich: `${stem}e ${prefix}`, du: `${stem}st ${prefix}`, er_sie_es: `${stem}t ${prefix}`, wir: `${prefix}${infinitiveStem}en`, ihr: `${stem}t ${prefix}`, sie_Sie: `${prefix}${infinitiveStem}en` },
    [Tense.PRAETERITUM]: { ich: `${stem}te ${prefix}`, du: `${stem}test ${prefix}`, er_sie_es: `${stem}te ${prefix}`, wir: `${stem}ten ${prefix}`, ihr: `${stem}tet ${prefix}`, sie_Sie: `${stem}ten ${prefix}` },
    // Perfekt ist komplexer (ge-kauft, ein-ge-kauft). Hier vereinfacht:
    [Tense.PERFEKT]: { ich: `habe ${prefix}ge${stem}t`, du: `hast ${prefix}ge${stem}t`, er_sie_es: `hat ${prefix}ge${stem}t`, wir: `haben ${prefix}ge${stem}t`, ihr: `habt ${prefix}ge${stem}t`, sie_Sie: `haben ${prefix}ge${stem}t` },
    [Tense.PLUSQUAMPERFEKT]: { ich: `hatte ${prefix}ge${stem}t`, du: `hattest ${prefix}ge${stem}t`, er_sie_es: `hatte ${prefix}ge${stem}t`, wir: `hatten ${prefix}ge${stem}t`, ihr: `hattet ${prefix}ge${stem}t`, sie_Sie: `hatten ${prefix}ge${stem}t` },
    [Tense.FUTUR_I]: { ich: `werde ${prefix}${infinitiveStem}en`, du: `wirst ${prefix}${infinitiveStem}en`, er_sie_es: `wird ${prefix}${infinitiveStem}en`, wir: `werden ${prefix}${infinitiveStem}en`, ihr: `werdet ${prefix}${infinitiveStem}en`, sie_Sie: `werden ${prefix}${infinitiveStem}en` },
  };
};

export const COMMON_VERBS_DB = {
  // --- A ---
  'abholen': createSeparableVerb('ab', 'hol', 'hol'),
  'achten': createRegularVerb('acht'),
  'angeln': createRegularVerb('angel'),
  'ändern': createRegularVerb('änder'),
  'ahnen': createRegularVerb('ahn'),
  'antworten': createRegularVerb('antwort'),
  'arbeiten': createRegularVerb('arbeit'),
  'atmen': createRegularVerb('atm'),
  'aufräumen': createSeparableVerb('auf', 'räum', 'räum'),
  'aufstehen': { // Stark + Trennbar
    [Tense.PRAESENS]: { ich: 'stehe auf', du: 'stehst auf', er_sie_es: 'steht auf', wir: 'stehen auf', ihr: 'steht auf', sie_Sie: 'stehen auf' },
    [Tense.PRAETERITUM]: { ich: 'stand auf', du: 'standst auf', er_sie_es: 'stand auf', wir: 'standen auf', ihr: 'standet auf', sie_Sie: 'standen auf' },
    [Tense.PERFEKT]: { ich: 'bin aufgestanden', du: 'bist aufgestanden', er_sie_es: 'ist aufgestanden', wir: 'sind aufgestanden', ihr: 'seid aufgestanden', sie_Sie: 'sind aufgestanden' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war aufgestanden', du: 'warst aufgestanden', er_sie_es: 'war aufgestanden', wir: 'waren aufgestanden', ihr: 'wart aufgestanden', sie_Sie: 'waren aufgestanden' },
    [Tense.FUTUR_I]: { ich: 'werde aufstehen', du: 'wirst aufstehen', er_sie_es: 'wird aufstehen', wir: 'werden aufstehen', ihr: 'werdet aufstehen', sie_Sie: 'werden aufstehen' },
  },
  // --- B ---
  'backen': createRegularVerb('back'),
  'baden': createRegularVerb('bad'),
  'bauen': createRegularVerb('bau'),
  'beben': createRegularVerb('beb'),
  'bedeuten': createRegularVerb('bedeut'),
  'beginnen': { // Stark
    [Tense.PRAESENS]: { ich: 'beginne', du: 'beginnst', er_sie_es: 'beginnt', wir: 'beginnen', ihr: 'beginnt', sie_Sie: 'beginnen' },
    [Tense.PRAETERITUM]: { ich: 'begann', du: 'begannst', er_sie_es: 'begann', wir: 'begannen', ihr: 'begannt', sie_Sie: 'begannen' },
    [Tense.PERFEKT]: { ich: 'habe begonnen', du: 'hast begonnen', er_sie_es: 'hat begonnen', wir: 'haben begonnen', ihr: 'habt begonnen', sie_Sie: 'haben begonnen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte begonnen', du: 'hattest begonnen', er_sie_es: 'hatte begonnen', wir: 'hatten begonnen', ihr: 'hattet begonnen', sie_Sie: 'hatten begonnen' },
    [Tense.FUTUR_I]: { ich: 'werde beginnen', du: 'wirst beginnen', er_sie_es: 'wird beginnen', wir: 'werden beginnen', ihr: 'werdet beginnen', sie_Sie: 'werden beginnen' },
  },
  'beißen': {
    [Tense.PRAESENS]: { ich: 'beiße', du: 'beißt', er_sie_es: 'beißt', wir: 'beißen', ihr: 'beißt', sie_Sie: 'beißen' },
    [Tense.PRAETERITUM]: { ich: 'biss', du: 'bissest', er_sie_es: 'biss', wir: 'bissen', ihr: 'bisst', sie_Sie: 'bissen' },
    [Tense.PERFEKT]: { ich: 'habe gebissen', du: 'hast gebissen', er_sie_es: 'hat gebissen', wir: 'haben gebissen', ihr: 'habt gebissen', sie_Sie: 'haben gebissen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gebissen', du: 'hattest gebissen', er_sie_es: 'hatte gebissen', wir: 'hatten gebissen', ihr: 'hattet gebissen', sie_Sie: 'hatten gebissen' },
    [Tense.FUTUR_I]: { ich: 'werde beißen', du: 'wirst beißen', er_sie_es: 'wird beißen', wir: 'werden beißen', ihr: 'werdet beißen', sie_Sie: 'werden beißen' },
  },
  'bellen': createRegularVerb('bell'),
  'bekommen': { // Stark
    [Tense.PRAESENS]: { ich: 'bekomme', du: 'bekommst', er_sie_es: 'bekommt', wir: 'bekommen', ihr: 'bekommt', sie_Sie: 'bekommen' },
    [Tense.PRAETERITUM]: { ich: 'bekam', du: 'bekamst', er_sie_es: 'bekam', wir: 'bekamen', ihr: 'bekamt', sie_Sie: 'bekamen' },
    [Tense.PERFEKT]: { ich: 'habe bekommen', du: 'hast bekommen', er_sie_es: 'hat bekommen', wir: 'haben bekommen', ihr: 'habt bekommen', sie_Sie: 'haben bekommen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte bekommen', du: 'hattest bekommen', er_sie_es: 'hatte bekommen', wir: 'hatten bekommen', ihr: 'hattet bekommen', sie_Sie: 'hatten bekommen' },
    [Tense.FUTUR_I]: { ich: 'werde bekommen', du: 'wirst bekommen', er_sie_es: 'wird bekommen', wir: 'werden bekommen', ihr: 'werdet bekommen', sie_Sie: 'werden bekommen' },
  },
  'besuchen': createRegularVerb('besuch'),
  'bezahlen': createRegularVerb('bezahl'),
  'bleiben': { // Stark
    [Tense.PRAESENS]: { ich: 'bleibe', du: 'bleibst', er_sie_es: 'bleibt', wir: 'bleiben', ihr: 'bleibt', sie_Sie: 'bleiben' },
    [Tense.PRAETERITUM]: { ich: 'blieb', du: 'bliebst', er_sie_es: 'blieb', wir: 'blieben', ihr: 'bliebt', sie_Sie: 'blieben' },
    [Tense.PERFEKT]: { ich: 'bin geblieben', du: 'bist geblieben', er_sie_es: 'ist geblieben', wir: 'sind geblieben', ihr: 'seid geblieben', sie_Sie: 'sind geblieben' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war geblieben', du: 'warst geblieben', er_sie_es: 'war geblieben', wir: 'waren geblieben', ihr: 'wart geblieben', sie_Sie: 'waren geblieben' },
    [Tense.FUTUR_I]: { ich: 'werde bleiben', du: 'wirst bleiben', er_sie_es: 'wird bleiben', wir: 'werden bleiben', ihr: 'werdet bleiben', sie_Sie: 'werden bleiben' },
  },
  'blicken': createRegularVerb('blick'),
  'brauchen': createRegularVerb('brauch'),
  'bringen': {
    [Tense.PRAESENS]: { ich: 'bringe', du: 'bringst', er_sie_es: 'bringt', wir: 'bringen', ihr: 'bringt', sie_Sie: 'bringen' },
    [Tense.PRAETERITUM]: { ich: 'brachte', du: 'brachtest', er_sie_es: 'brachte', wir: 'brachten', ihr: 'brachtet', sie_Sie: 'brachten' },
    [Tense.PERFEKT]: { ich: 'habe gebracht', du: 'hast gebracht', er_sie_es: 'hat gebracht', wir: 'haben gebracht', ihr: 'habt gebracht', sie_Sie: 'haben gebracht' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gebracht', du: 'hattest gebracht', er_sie_es: 'hatte gebracht', wir: 'hatten gebracht', ihr: 'hattet gebracht', sie_Sie: 'hatten gebracht' },
    [Tense.FUTUR_I]: { ich: 'werde bringen', du: 'wirst bringen', er_sie_es: 'wird bringen', wir: 'werden bringen', ihr: 'werdet bringen', sie_Sie: 'werden bringen' },
  },
  'brüllen': createRegularVerb('brüll'),
  // --- D ---
  'danken': createRegularVerb('dank'),
  'denken': {
    [Tense.PRAESENS]: { ich: 'denke', du: 'denkst', er_sie_es: 'denkt', wir: 'denken', ihr: 'denkt', sie_Sie: 'denken' },
    [Tense.PRAETERITUM]: { ich: 'dachte', du: 'dachtest', er_sie_es: 'dachte', wir: 'dachten', ihr: 'dachtet', sie_Sie: 'dachten' },
    [Tense.PERFEKT]: { ich: 'habe gedacht', du: 'hast gedacht', er_sie_es: 'hat gedacht', wir: 'haben gedacht', ihr: 'habt gedacht', sie_Sie: 'haben gedacht' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gedacht', du: 'hattest gedacht', er_sie_es: 'hatte gedacht', wir: 'hatten gedacht', ihr: 'hattet gedacht', sie_Sie: 'hatten gedacht' },
    [Tense.FUTUR_I]: { ich: 'werde denken', du: 'wirst denken', er_sie_es: 'wird denken', wir: 'werden denken', ihr: 'werdet denken', sie_Sie: 'werden denken' },
  },
  'diskutieren': createRegularVerb('diskutier'),
  'deuten': createRegularVerb('deut'),
  'drücken': createRegularVerb('drück'),
  'dürfen': {
    [Tense.PRAESENS]: { ich: 'darf', du: 'darfst', er_sie_es: 'darf', wir: 'dürfen', ihr: 'dürft', sie_Sie: 'dürfen' },
    [Tense.PRAETERITUM]: { ich: 'durfte', du: 'durftest', er_sie_es: 'durfte', wir: 'durften', ihr: 'durftet', sie_Sie: 'durften' },
    [Tense.PERFEKT]: { ich: 'habe gedurft', du: 'hast gedurft', er_sie_es: 'hat gedurft', wir: 'haben gedurft', ihr: 'habt gedurft', sie_Sie: 'haben gedurft' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gedurft', du: 'hattest gedurft', er_sie_es: 'hatte gedurft', wir: 'hatten gedurft', ihr: 'hattet gedurft', sie_Sie: 'hatten gedurft' },
    [Tense.FUTUR_I]: { ich: 'werde dürfen', du: 'wirst dürfen', er_sie_es: 'wird dürfen', wir: 'werden dürfen', ihr: 'werdet dürfen', sie_Sie: 'werden dürfen' },
  },
  // --- E ---
  'erklären': createRegularVerb('erklär'),
  'erzählen': createRegularVerb('erzähl'),
  'essen': {
    [Tense.PRAESENS]: { ich: 'esse', du: 'isst', er_sie_es: 'isst', wir: 'essen', ihr: 'esst', sie_Sie: 'essen' },
    [Tense.PRAETERITUM]: { ich: 'aß', du: 'aßest', er_sie_es: 'aß', wir: 'aßen', ihr: 'aßt', sie_Sie: 'aßen' },
    [Tense.PERFEKT]: { ich: 'habe gegessen', du: 'hast gegessen', er_sie_es: 'hat gegessen', wir: 'haben gegessen', ihr: 'habt gegessen', sie_Sie: 'haben gegessen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gegessen', du: 'hattest gegessen', er_sie_es: 'hatte gegessen', wir: 'hatten gegessen', ihr: 'hattet gegessen', sie_Sie: 'hatten gegessen' },
    [Tense.FUTUR_I]: { ich: 'werde essen', du: 'wirst essen', er_sie_es: 'wird essen', wir: 'werden essen', ihr: 'werdet essen', sie_Sie: 'werden essen' },
  },
  // --- F ---
  'fahren': {
    [Tense.PRAESENS]: { ich: 'fahre', du: 'fährst', er_sie_es: 'fährt', wir: 'fahren', ihr: 'fahrt', sie_Sie: 'fahren' },
    [Tense.PRAETERITUM]: { ich: 'fuhr', du: 'fuhrst', er_sie_es: 'fuhr', wir: 'fuhren', ihr: 'fuhrt', sie_Sie: 'fuhren' },
    [Tense.PERFEKT]: { ich: 'bin gefahren', du: 'bist gefahren', er_sie_es: 'ist gefahren', wir: 'sind gefahren', ihr: 'seid gefahren', sie_Sie: 'sind gefahren' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gefahren', du: 'warst gefahren', er_sie_es: 'war gefahren', wir: 'waren gefahren', ihr: 'wart gefahren', sie_Sie: 'waren gefahren' },
    [Tense.FUTUR_I]: { ich: 'werde fahren', du: 'wirst fahren', er_sie_es: 'wird fahren', wir: 'werden fahren', ihr: 'werdet fahren', sie_Sie: 'werden fahren' },
  },
  'fallen': {
    [Tense.PRAESENS]: { ich: 'falle', du: 'fällst', er_sie_es: 'fällt', wir: 'fallen', ihr: 'fallt', sie_Sie: 'fallen' },
    [Tense.PRAETERITUM]: { ich: 'fiel', du: 'fielst', er_sie_es: 'fiel', wir: 'fielen', ihr: 'fielt', sie_Sie: 'fielen' },
    [Tense.PERFEKT]: { ich: 'bin gefallen', du: 'bist gefallen', er_sie_es: 'ist gefallen', wir: 'sind gefallen', ihr: 'seid gefallen', sie_Sie: 'sind gefallen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gefallen', du: 'warst gefallen', er_sie_es: 'war gefallen', wir: 'waren gefallen', ihr: 'wart gefallen', sie_Sie: 'waren gefallen' },
    [Tense.FUTUR_I]: { ich: 'werde fallen', du: 'wirst fallen', er_sie_es: 'wird fallen', wir: 'werden fallen', ihr: 'werdet fallen', sie_Sie: 'werden fallen' },
  },
  'fangen': {
    [Tense.PRAESENS]: { ich: 'fange', du: 'fängst', er_sie_es: 'fängt', wir: 'fangen', ihr: 'fangt', sie_Sie: 'fangen' },
    [Tense.PRAETERITUM]: { ich: 'fing', du: 'fingst', er_sie_es: 'fing', wir: 'fingen', ihr: 'fingt', sie_Sie: 'fingen' },
    [Tense.PERFEKT]: { ich: 'habe gefangen', du: 'hast gefangen', er_sie_es: 'hat gefangen', wir: 'haben gefangen', ihr: 'habt gefangen', sie_Sie: 'haben gefangen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gefangen', du: 'hattest gefangen', er_sie_es: 'hatte gefangen', wir: 'hatten gefangen', ihr: 'hattet gefangen', sie_Sie: 'hatten gefangen' },
    [Tense.FUTUR_I]: { ich: 'werde fangen', du: 'wirst fangen', er_sie_es: 'wird fangen', wir: 'werden fangen', ihr: 'werdet fangen', sie_Sie: 'werden fangen' },
  },
  'fehlen': createRegularVerb('fehl'),
  'feiern': createRegularVerb('feier'),
  'finden': {
    [Tense.PRAESENS]: { ich: 'finde', du: 'findest', er_sie_es: 'findet', wir: 'finden', ihr: 'findet', sie_Sie: 'finden' },
    [Tense.PRAETERITUM]: { ich: 'fand', du: 'fandest', er_sie_es: 'fand', wir: 'fanden', ihr: 'fandet', sie_Sie: 'fanden' },
    [Tense.PERFEKT]: { ich: 'habe gefunden', du: 'hast gefunden', er_sie_es: 'hat gefunden', wir: 'haben gefunden', ihr: 'habt gefunden', sie_Sie: 'haben gefunden' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gefunden', du: 'hattest gefunden', er_sie_es: 'hatte gefunden', wir: 'hatten gefunden', ihr: 'hattet gefunden', sie_Sie: 'hatten gefunden' },
    [Tense.FUTUR_I]: { ich: 'werde finden', du: 'wirst finden', er_sie_es: 'wird finden', wir: 'werden finden', ihr: 'werdet finden', sie_Sie: 'werden finden' },
  },
  'fliegen': {
    [Tense.PRAESENS]: { ich: 'fliege', du: 'fliegst', er_sie_es: 'fliegt', wir: 'fliegen', ihr: 'fliegt', sie_Sie: 'fliegen' },
    [Tense.PRAETERITUM]: { ich: 'flog', du: 'flogst', er_sie_es: 'flog', wir: 'flogen', ihr: 'flogt', sie_Sie: 'flogen' },
    [Tense.PERFEKT]: { ich: 'bin geflogen', du: 'bist geflogen', er_sie_es: 'ist geflogen', wir: 'sind geflogen', ihr: 'seid geflogen', sie_Sie: 'sind geflogen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war geflogen', du: 'warst geflogen', er_sie_es: 'war geflogen', wir: 'waren geflogen', ihr: 'wart geflogen', sie_Sie: 'waren geflogen' },
    [Tense.FUTUR_I]: { ich: 'werde fliegen', du: 'wirst fliegen', er_sie_es: 'wird fliegen', wir: 'werden fliegen', ihr: 'werdet fliegen', sie_Sie: 'werden fliegen' },
  },
  'flüstern': createRegularVerb('flüster'),
  'folgen': createRegularVerb('folg'),
  'fragen': createRegularVerb('frag'),
  'fressen': {
    [Tense.PRAESENS]: { ich: 'fresse', du: 'frisst', er_sie_es: 'frisst', wir: 'fressen', ihr: 'fresst', sie_Sie: 'fressen' },
    [Tense.PRAETERITUM]: { ich: 'fraß', du: 'fraßest', er_sie_es: 'fraß', wir: 'fraßen', ihr: 'fraßt', sie_Sie: 'fraßen' },
    [Tense.PERFEKT]: { ich: 'habe gefressen', du: 'hast gefressen', er_sie_es: 'hat gefressen', wir: 'haben gefressen', ihr: 'habt gefressen', sie_Sie: 'haben gefressen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gefressen', du: 'hattest gefressen', er_sie_es: 'hatte gefressen', wir: 'hatten gefressen', ihr: 'hattet gefressen', sie_Sie: 'hatten gefressen' },
    [Tense.FUTUR_I]: { ich: 'werde fressen', du: 'wirst fressen', er_sie_es: 'wird fressen', wir: 'werden fressen', ihr: 'werdet fressen', sie_Sie: 'werden fressen' },
  },
  'freuen': createRegularVerb('freu'),
  'fühlen': createRegularVerb('fühl'),
  'fürchten': createRegularVerb('fürcht'),
  'füttern': createRegularVerb('fütter'),
  // --- G ---
  'geben': {
    [Tense.PRAESENS]: { ich: 'gebe', du: 'gibst', er_sie_es: 'gibt', wir: 'geben', ihr: 'gebt', sie_Sie: 'geben' },
    [Tense.PRAETERITUM]: { ich: 'gab', du: 'gabst', er_sie_es: 'gab', wir: 'gaben', ihr: 'gabt', sie_Sie: 'gaben' },
    [Tense.PERFEKT]: { ich: 'habe gegeben', du: 'hast gegeben', er_sie_es: 'hat gegeben', wir: 'haben gegeben', ihr: 'habt gegeben', sie_Sie: 'haben gegeben' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gegeben', du: 'hattest gegeben', er_sie_es: 'hatte gegeben', wir: 'hatten gegeben', ihr: 'hattet gegeben', sie_Sie: 'hatten gegeben' },
    [Tense.FUTUR_I]: { ich: 'werde geben', du: 'wirst geben', er_sie_es: 'wird geben', wir: 'werden geben', ihr: 'werdet geben', sie_Sie: 'werden geben' },
  },
  'gehen': {
    [Tense.PRAESENS]: { ich: 'gehe', du: 'gehst', er_sie_es: 'geht', wir: 'gehen', ihr: 'geht', sie_Sie: 'gehen' },
    [Tense.PRAETERITUM]: { ich: 'ging', du: 'gingst', er_sie_es: 'ging', wir: 'gingen', ihr: 'gingt', sie_Sie: 'gingen' },
    [Tense.PERFEKT]: { ich: 'bin gegangen', du: 'bist gegangen', er_sie_es: 'ist gegangen', wir: 'sind gegangen', ihr: 'seid gegangen', sie_Sie: 'sind gegangen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gegangen', du: 'warst gegangen', er_sie_es: 'war gegangen', wir: 'waren gegangen', ihr: 'wart gegangen', sie_Sie: 'waren gegangen' },
    [Tense.FUTUR_I]: { ich: 'werde gehen', du: 'wirst gehen', er_sie_es: 'wird gehen', wir: 'werden gehen', ihr: 'werdet gehen', sie_Sie: 'werden gehen' },
  },
  'gehören': createRegularVerb('gehör'),
  'gewinnen': {
    [Tense.PRAESENS]: { ich: 'gewinne', du: 'gewinnst', er_sie_es: 'gewinnt', wir: 'gewinnen', ihr: 'gewinnt', sie_Sie: 'gewinnen' },
    [Tense.PRAETERITUM]: { ich: 'gewann', du: 'gewannst', er_sie_es: 'gewann', wir: 'gewannen', ihr: 'gewannt', sie_Sie: 'gewannen' },
    [Tense.PERFEKT]: { ich: 'habe gewonnen', du: 'hast gewonnen', er_sie_es: 'hat gewonnen', wir: 'haben gewonnen', ihr: 'habt gewonnen', sie_Sie: 'haben gewonnen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gewonnen', du: 'hattest gewonnen', er_sie_es: 'hatte gewonnen', wir: 'hatten gewonnen', ihr: 'hattet gewonnen', sie_Sie: 'hatten gewonnen' },
    [Tense.FUTUR_I]: { ich: 'werde gewinnen', du: 'wirst gewinnen', er_sie_es: 'wird gewinnen', wir: 'werden gewinnen', ihr: 'werdet gewinnen', sie_Sie: 'werden gewinnen' },
  },
  'glauben': createRegularVerb('glaub'),
  // --- H ---
  'haben': {
    [Tense.PRAESENS]: { ich: 'habe', du: 'hast', er_sie_es: 'hat', wir: 'haben', ihr: 'habt', sie_Sie: 'haben' },
    [Tense.PRAETERITUM]: { ich: 'hatte', du: 'hattest', er_sie_es: 'hatte', wir: 'hatten', ihr: 'hattet', sie_Sie: 'hatten' },
    [Tense.PERFEKT]: { ich: 'habe gehabt', du: 'hast gehabt', er_sie_es: 'hat gehabt', wir: 'haben gehabt', ihr: 'habt gehabt', sie_Sie: 'haben gehabt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gehabt', du: 'hattest gehabt', er_sie_es: 'hatte gehabt', wir: 'hatten gehabt', ihr: 'hattet gehabt', sie_Sie: 'hatten gehabt' },
    [Tense.FUTUR_I]: { ich: 'werde haben', du: 'wirst haben', er_sie_es: 'wird haben', wir: 'werden haben', ihr: 'werdet haben', sie_Sie: 'werden haben' },
  },
  'halten': {
    [Tense.PRAESENS]: { ich: 'halte', du: 'hältst', er_sie_es: 'hält', wir: 'halten', ihr: 'haltet', sie_Sie: 'halten' },
    [Tense.PRAETERITUM]: { ich: 'hielt', du: 'hieltst', er_sie_es: 'hielt', wir: 'hielten', ihr: 'hieltet', sie_Sie: 'hielten' },
    [Tense.PERFEKT]: { ich: 'habe gehalten', du: 'hast gehalten', er_sie_es: 'hat gehalten', wir: 'haben gehalten', ihr: 'habt gehalten', sie_Sie: 'haben gehalten' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gehalten', du: 'hattest gehalten', er_sie_es: 'hatte gehalten', wir: 'hatten gehalten', ihr: 'hattet gehalten', sie_Sie: 'hatten gehalten' },
    [Tense.FUTUR_I]: { ich: 'werde halten', du: 'wirst halten', er_sie_es: 'wird halten', wir: 'werden halten', ihr: 'werdet halten', sie_Sie: 'werden halten' },
  },
  'heißen': {
    [Tense.PRAESENS]: { ich: 'heiße', du: 'heißt', er_sie_es: 'heißt', wir: 'heißen', ihr: 'heißt', sie_Sie: 'heißen' },
    [Tense.PRAETERITUM]: { ich: 'hieß', du: 'hießest', er_sie_es: 'hieß', wir: 'hießen', ihr: 'hießt', sie_Sie: 'hießen' },
    [Tense.PERFEKT]: { ich: 'habe geheißen', du: 'hast geheißen', er_sie_es: 'hat geheißen', wir: 'haben geheißen', ihr: 'habt geheißen', sie_Sie: 'haben geheißen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geheißen', du: 'hattest geheißen', er_sie_es: 'hatte geheißen', wir: 'hatten geheißen', ihr: 'hattet geheißen', sie_Sie: 'hatten geheißen' },
    [Tense.FUTUR_I]: { ich: 'werde heißen', du: 'wirst heißen', er_sie_es: 'wird heißen', wir: 'werden heißen', ihr: 'werdet heißen', sie_Sie: 'werden heißen' },
  },
  'helfen': {
    [Tense.PRAESENS]: { ich: 'helfe', du: 'hilfst', er_sie_es: 'hilft', wir: 'helfen', ihr: 'helft', sie_Sie: 'helfen' },
    [Tense.PRAETERITUM]: { ich: 'half', du: 'halfst', er_sie_es: 'half', wir: 'halfen', ihr: 'halft', sie_Sie: 'halfen' },
    [Tense.PERFEKT]: { ich: 'habe geholfen', du: 'hast geholfen', er_sie_es: 'hat geholfen', wir: 'haben geholfen', ihr: 'habt geholfen', sie_Sie: 'haben geholfen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geholfen', du: 'hattest geholfen', er_sie_es: 'hatte geholfen', wir: 'hatten geholfen', ihr: 'hattet geholfen', sie_Sie: 'hatten geholfen' },
    [Tense.FUTUR_I]: { ich: 'werde helfen', du: 'wirst helfen', er_sie_es: 'wird helfen', wir: 'werden helfen', ihr: 'werdet helfen', sie_Sie: 'werden helfen' },
  },
  'hoffen': createRegularVerb('hoff'),
  'holen': createRegularVerb('hol'),
  'hören': createRegularVerb('hör'),
  'hüpfen': createRegularVerb('hüpf'),
  // --- K ---
  'kämmen': createRegularVerb('kämm'),
  'kaufen': createRegularVerb('kauf'),
  'kauen': createRegularVerb('kau'),
  'kehren': createRegularVerb('kehr'),
  'kennen': {
    [Tense.PRAESENS]: { ich: 'kenne', du: 'kennst', er_sie_es: 'kennt', wir: 'kennen', ihr: 'kennt', sie_Sie: 'kennen' },
    [Tense.PRAETERITUM]: { ich: 'kannte', du: 'kanntest', er_sie_es: 'kannte', wir: 'kannten', ihr: 'kanntet', sie_Sie: 'kannten' },
    [Tense.PERFEKT]: { ich: 'habe gekannt', du: 'hast gekannt', er_sie_es: 'hat gekannt', wir: 'haben gekannt', ihr: 'habt gekannt', sie_Sie: 'haben gekannt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gekannt', du: 'hattest gekannt', er_sie_es: 'hatte gekannt', wir: 'hatten gekannt', ihr: 'hattet gekannt', sie_Sie: 'hatten gekannt' },
    [Tense.FUTUR_I]: { ich: 'werde kennen', du: 'wirst kennen', er_sie_es: 'wird kennen', wir: 'werden kennen', ihr: 'werdet kennen', sie_Sie: 'werden kennen' },
  },
  'kleben': createRegularVerb('kleb'),
  'klettern': createRegularVerb('kletter'),
  'kochen': createRegularVerb('koch'),
  'kommen': {
    [Tense.PRAESENS]: { ich: 'komme', du: 'kommst', er_sie_es: 'kommt', wir: 'kommen', ihr: 'kommt', sie_Sie: 'kommen' },
    [Tense.PRAETERITUM]: { ich: 'kam', du: 'kamst', er_sie_es: 'kam', wir: 'kamen', ihr: 'kamt', sie_Sie: 'kamen' },
    [Tense.PERFEKT]: { ich: 'bin gekommen', du: 'bist gekommen', er_sie_es: 'ist gekommen', wir: 'sind gekommen', ihr: 'seid gekommen', sie_Sie: 'sind gekommen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gekommen', du: 'warst gekommen', er_sie_es: 'war gekommen', wir: 'waren gekommen', ihr: 'wart gekommen', sie_Sie: 'waren gekommen' },
    [Tense.FUTUR_I]: { ich: 'werde kommen', du: 'wirst kommen', er_sie_es: 'wird kommen', wir: 'werden kommen', ihr: 'werdet kommen', sie_Sie: 'werden kommen' },
  },
  'können': {
    [Tense.PRAESENS]: { ich: 'kann', du: 'kannst', er_sie_es: 'kann', wir: 'können', ihr: 'könnt', sie_Sie: 'können' },
    [Tense.PRAETERITUM]: { ich: 'konnte', du: 'konntest', er_sie_es: 'konnte', wir: 'konnten', ihr: 'konntet', sie_Sie: 'konnten' },
    [Tense.PERFEKT]: { ich: 'habe gekonnt', du: 'hast gekonnt', er_sie_es: 'hat gekonnt', wir: 'haben gekonnt', ihr: 'habt gekonnt', sie_Sie: 'haben gekonnt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gekonnt', du: 'hattest gekonnt', er_sie_es: 'hatte gekonnt', wir: 'hatten gekonnt', ihr: 'hattet gekonnt', sie_Sie: 'hatten gekonnt' },
    [Tense.FUTUR_I]: { ich: 'werde können', du: 'wirst können', er_sie_es: 'wird können', wir: 'werden können', ihr: 'werdet können', sie_Sie: 'werden können' },
  },
  // --- L ---
  'lachen': createRegularVerb('lach'),
  'lassen': {
    [Tense.PRAESENS]: { ich: 'lasse', du: 'lässt', er_sie_es: 'lässt', wir: 'lassen', ihr: 'lasst', sie_Sie: 'lassen' },
    [Tense.PRAETERITUM]: { ich: 'ließ', du: 'ließest', er_sie_es: 'ließ', wir: 'ließen', ihr: 'ließt', sie_Sie: 'ließen' },
    [Tense.PERFEKT]: { ich: 'habe gelassen', du: 'hast gelassen', er_sie_es: 'hat gelassen', wir: 'haben gelassen', ihr: 'habt gelassen', sie_Sie: 'haben gelassen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gelassen', du: 'hattest gelassen', er_sie_es: 'hatte gelassen', wir: 'hatten gelassen', ihr: 'hattet gelassen', sie_Sie: 'hatten gelassen' },
    [Tense.FUTUR_I]: { ich: 'werde lassen', du: 'wirst lassen', er_sie_es: 'wird lassen', wir: 'werden lassen', ihr: 'werdet lassen', sie_Sie: 'werden lassen' },
  },
  'laufen': {
    [Tense.PRAESENS]: { ich: 'laufe', du: 'läufst', er_sie_es: 'läuft', wir: 'laufen', ihr: 'lauft', sie_Sie: 'laufen' },
    [Tense.PRAETERITUM]: { ich: 'lief', du: 'liefst', er_sie_es: 'lief', wir: 'liefen', ihr: 'lieft', sie_Sie: 'liefen' },
    [Tense.PERFEKT]: { ich: 'bin gelaufen', du: 'bist gelaufen', er_sie_es: 'ist gelaufen', wir: 'sind gelaufen', ihr: 'seid gelaufen', sie_Sie: 'sind gelaufen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gelaufen', du: 'warst gelaufen', er_sie_es: 'war gelaufen', wir: 'waren gelaufen', ihr: 'wart gelaufen', sie_Sie: 'waren gelaufen' },
    [Tense.FUTUR_I]: { ich: 'werde laufen', du: 'wirst laufen', er_sie_es: 'wird laufen', wir: 'werden laufen', ihr: 'werdet laufen', sie_Sie: 'werden laufen' },
  },
  'leben': createRegularVerb('leb'),
  'legen': createRegularVerb('leg'),
  'lernen': createRegularVerb('lern'),
  'lesen': {
    [Tense.PRAESENS]: { ich: 'lese', du: 'liest', er_sie_es: 'liest', wir: 'lesen', ihr: 'lest', sie_Sie: 'lesen' },
    [Tense.PRAETERITUM]: { ich: 'las', du: 'lasest', er_sie_es: 'las', wir: 'lasen', ihr: 'last', sie_Sie: 'lasen' },
    [Tense.PERFEKT]: { ich: 'habe gelesen', du: 'hast gelesen', er_sie_es: 'hat gelesen', wir: 'haben gelesen', ihr: 'habt gelesen', sie_Sie: 'haben gelesen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gelesen', du: 'hattest gelesen', er_sie_es: 'hatte gelesen', wir: 'hatten gelesen', ihr: 'hattet gelesen', sie_Sie: 'hatten gelesen' },
    [Tense.FUTUR_I]: { ich: 'werde lesen', du: 'wirst lesen', er_sie_es: 'wird lesen', wir: 'werden lesen', ihr: 'werdet lesen', sie_Sie: 'werden lesen' },
  },
  'lieben': createRegularVerb('lieb'),
  'liegen': {
    [Tense.PRAESENS]: { ich: 'liege', du: 'liegst', er_sie_es: 'liegt', wir: 'liegen', ihr: 'liegt', sie_Sie: 'liegen' },
    [Tense.PRAETERITUM]: { ich: 'lag', du: 'lagst', er_sie_es: 'lag', wir: 'lagen', ihr: 'lagt', sie_Sie: 'lagen' },
    [Tense.PERFEKT]: { ich: 'habe gelegen', du: 'hast gelegen', er_sie_es: 'hat gelegen', wir: 'haben gelegen', ihr: 'habt gelegen', sie_Sie: 'haben gelegen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gelegen', du: 'hattest gelegen', er_sie_es: 'hatte gelegen', wir: 'hatten gelegen', ihr: 'hattet gelegen', sie_Sie: 'hatten gelegen' },
    [Tense.FUTUR_I]: { ich: 'werde liegen', du: 'wirst liegen', er_sie_es: 'wird liegen', wir: 'werden liegen', ihr: 'werdet liegen', sie_Sie: 'werden liegen' },
  },
  'lächeln': createRegularVerb('lächel'),
  // --- M ---
  'machen': createRegularVerb('mach'),
  'malen': createRegularVerb('mal'),
  'mähen': createRegularVerb('mäh'),
  'mögen': {
    [Tense.PRAESENS]: { ich: 'mag', du: 'magst', er_sie_es: 'mag', wir: 'mögen', ihr: 'mögt', sie_Sie: 'mögen' },
    [Tense.PRAETERITUM]: { ich: 'mochte', du: 'mochtest', er_sie_es: 'mochte', wir: 'mochten', ihr: 'mochtet', sie_Sie: 'mochten' },
    [Tense.PERFEKT]: { ich: 'habe gemocht', du: 'hast gemocht', er_sie_es: 'hat gemocht', wir: 'haben gemocht', ihr: 'habt gemocht', sie_Sie: 'haben gemocht' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gemocht', du: 'hattest gemocht', er_sie_es: 'hatte gemocht', wir: 'hatten gemocht', ihr: 'hattet gemocht', sie_Sie: 'hatten gemocht' },
    [Tense.FUTUR_I]: { ich: 'werde mögen', du: 'wirst mögen', er_sie_es: 'wird mögen', wir: 'werden mögen', ihr: 'werdet mögen', sie_Sie: 'werden mögen' },
  },
  'müssen': {
    [Tense.PRAESENS]: { ich: 'muss', du: 'musst', er_sie_es: 'muss', wir: 'müssen', ihr: 'müsst', sie_Sie: 'müssen' },
    [Tense.PRAETERITUM]: { ich: 'musste', du: 'musstest', er_sie_es: 'musste', wir: 'mussten', ihr: 'musstet', sie_Sie: 'mussten' },
    [Tense.PERFEKT]: { ich: 'habe gemusst', du: 'hast gemusst', er_sie_es: 'hat gemusst', wir: 'haben gemusst', ihr: 'habt gemusst', sie_Sie: 'haben gemusst' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gemusst', du: 'hattest gemusst', er_sie_es: 'hatte gemusst', wir: 'hatten gemusst', ihr: 'hattet gemusst', sie_Sie: 'hatten gemusst' },
    [Tense.FUTUR_I]: { ich: 'werde müssen', du: 'wirst müssen', er_sie_es: 'wird müssen', wir: 'werden müssen', ihr: 'werdet müssen', sie_Sie: 'werden müssen' },
  },
  // --- N ---
  'naschen': createRegularVerb('nasch'),
  'nehmen': {
    [Tense.PRAESENS]: { ich: 'nehme', du: 'nimmst', er_sie_es: 'nimmt', wir: 'nehmen', ihr: 'nehmt', sie_Sie: 'nehmen' },
    [Tense.PRAETERITUM]: { ich: 'nahm', du: 'nahmst', er_sie_es: 'nahm', wir: 'nahmen', ihr: 'nahmt', sie_Sie: 'nahmen' },
    [Tense.PERFEKT]: { ich: 'habe genommen', du: 'hast genommen', er_sie_es: 'hat genommen', wir: 'haben genommen', ihr: 'habt genommen', sie_Sie: 'haben genommen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte genommen', du: 'hattest genommen', er_sie_es: 'hatte genommen', wir: 'hatten genommen', ihr: 'hattet genommen', sie_Sie: 'hatten genommen' },
    [Tense.FUTUR_I]: { ich: 'werde nehmen', du: 'wirst nehmen', er_sie_es: 'wird nehmen', wir: 'werden nehmen', ihr: 'werdet nehmen', sie_Sie: 'werden nehmen' },
  },
  'nennen': {
    [Tense.PRAESENS]: { ich: 'nenne', du: 'nennst', er_sie_es: 'nennt', wir: 'nennen', ihr: 'nennt', sie_Sie: 'nennen' },
    [Tense.PRAETERITUM]: { ich: 'nannte', du: 'nanntest', er_sie_es: 'nannte', wir: 'nannten', ihr: 'nanntet', sie_Sie: 'nannten' },
    [Tense.PERFEKT]: { ich: 'habe genannt', du: 'hast genannt', er_sie_es: 'hat genannt', wir: 'haben genannt', ihr: 'habt genannt', sie_Sie: 'haben genannt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte genannt', du: 'hattest genannt', er_sie_es: 'hatte genannt', wir: 'hatten genannt', ihr: 'hattet genannt', sie_Sie: 'hatten genannt' },
    [Tense.FUTUR_I]: { ich: 'werde nennen', du: 'wirst nennen', er_sie_es: 'wird nennen', wir: 'werden nennen', ihr: 'werdet nennen', sie_Sie: 'werden nennen' },
  },
  'niesen': createRegularVerb('nies'),
  // --- O ---
  'öffnen': createRegularVerb('öffn'),
  // --- P ---
  'packen': createRegularVerb('pack'),
  'passieren': createRegularVerb('passier'),
  'pfeifen': {
    [Tense.PRAESENS]: { ich: 'pfeife', du: 'pfeifst', er_sie_es: 'pfeift', wir: 'pfeifen', ihr: 'pfeift', sie_Sie: 'pfeifen' },
    [Tense.PRAETERITUM]: { ich: 'pfiff', du: 'pfiffst', er_sie_es: 'pfiff', wir: 'pfiffen', ihr: 'pfifft', sie_Sie: 'pfiffen' },
    [Tense.PERFEKT]: { ich: 'habe gepfiffen', du: 'hast gepfiffen', er_sie_es: 'hat gepfiffen', wir: 'haben gepfiffen', ihr: 'habt gepfiffen', sie_Sie: 'haben gepfiffen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gepfiffen', du: 'hattest gepfiffen', er_sie_es: 'hatte gepfiffen', wir: 'hatten gepfiffen', ihr: 'hattet gepfiffen', sie_Sie: 'hatten gepfiffen' },
    [Tense.FUTUR_I]: { ich: 'werde pfeifen', du: 'wirst pfeifen', er_sie_es: 'wird pfeifen', wir: 'werden pfeifen', ihr: 'werdet pfeifen', sie_Sie: 'werden pfeifen' },
  },
  'planen': createRegularVerb('plan'),
  'probieren': createRegularVerb('probier'),
  'putzen': createRegularVerb('putz'),
  // --- Q ---
  'quaken': createRegularVerb('quak'),
  'quälen': createRegularVerb('quäl'),
  'quatschen': createRegularVerb('quatsch'),
  // --- R ---
  'reden': createRegularVerb('red'),
  'regnen': createRegularVerb('regn'),
  'rechnen': createRegularVerb('rechn'),
  'reisen': createRegularVerb('reis'),
  'reiten': {
    [Tense.PRAESENS]: { ich: 'reite', du: 'reitest', er_sie_es: 'reitet', wir: 'reiten', ihr: 'reitet', sie_Sie: 'reiten' },
    [Tense.PRAETERITUM]: { ich: 'ritt', du: 'rittest', er_sie_es: 'ritt', wir: 'ritten', ihr: 'rittet', sie_Sie: 'ritten' },
    [Tense.PERFEKT]: { ich: 'bin geritten', du: 'bist geritten', er_sie_es: 'ist geritten', wir: 'sind geritten', ihr: 'seid geritten', sie_Sie: 'sind geritten' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war geritten', du: 'warst geritten', er_sie_es: 'war geritten', wir: 'waren geritten', ihr: 'wart geritten', sie_Sie: 'waren geritten' },
    [Tense.FUTUR_I]: { ich: 'werde reiten', du: 'wirst reiten', er_sie_es: 'wird reiten', wir: 'werden reiten', ihr: 'werdet reiten', sie_Sie: 'werden reiten' },
  },
  'rennen': {
    [Tense.PRAESENS]: { ich: 'renne', du: 'rennst', er_sie_es: 'rennt', wir: 'rennen', ihr: 'rennt', sie_Sie: 'rennen' },
    [Tense.PRAETERITUM]: { ich: 'rannte', du: 'ranntest', er_sie_es: 'rannte', wir: 'rannten', ihr: 'ranntet', sie_Sie: 'rannten' },
    [Tense.PERFEKT]: { ich: 'bin gerannt', du: 'bist gerannt', er_sie_es: 'ist gerannt', wir: 'sind gerannt', ihr: 'seid gerannt', sie_Sie: 'sind gerannt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gerannt', du: 'warst gerannt', er_sie_es: 'war gerannt', wir: 'waren gerannt', ihr: 'wart gerannt', sie_Sie: 'waren gerannt' },
    [Tense.FUTUR_I]: { ich: 'werde rennen', du: 'wirst rennen', er_sie_es: 'wird rennen', wir: 'werden rennen', ihr: 'werdet rennen', sie_Sie: 'werden rennen' },
  },
  'rufen': {
    [Tense.PRAESENS]: { ich: 'rufe', du: 'rufst', er_sie_es: 'ruft', wir: 'rufen', ihr: 'ruft', sie_Sie: 'rufen' },
    [Tense.PRAETERITUM]: { ich: 'rief', du: 'riefst', er_sie_es: 'rief', wir: 'riefen', ihr: 'rieft', sie_Sie: 'riefen' },
    [Tense.PERFEKT]: { ich: 'habe gerufen', du: 'hast gerufen', er_sie_es: 'hat gerufen', wir: 'haben gerufen', ihr: 'habt gerufen', sie_Sie: 'haben gerufen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gerufen', du: 'hattest gerufen', er_sie_es: 'hatte gerufen', wir: 'hatten gerufen', ihr: 'hattet gerufen', sie_Sie: 'hatten gerufen' },
    [Tense.FUTUR_I]: { ich: 'werde rufen', du: 'wirst rufen', er_sie_es: 'wird rufen', wir: 'werden rufen', ihr: 'werdet rufen', sie_Sie: 'werden rufen' },
  },
  // --- S ---
  'sagen': createRegularVerb('sag'),
  'scheinen': {
    [Tense.PRAESENS]: { ich: 'scheine', du: 'scheinst', er_sie_es: 'scheint', wir: 'scheinen', ihr: 'scheint', sie_Sie: 'scheinen' },
    [Tense.PRAETERITUM]: { ich: 'schien', du: 'schienst', er_sie_es: 'schien', wir: 'schienen', ihr: 'schient', sie_Sie: 'schienen' },
    [Tense.PERFEKT]: { ich: 'habe geschienen', du: 'hast geschienen', er_sie_es: 'hat geschienen', wir: 'haben geschienen', ihr: 'habt geschienen', sie_Sie: 'haben geschienen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschienen', du: 'hattest geschienen', er_sie_es: 'hatte geschienen', wir: 'hatten geschienen', ihr: 'hattet geschienen', sie_Sie: 'hatten geschienen' },
    [Tense.FUTUR_I]: { ich: 'werde scheinen', du: 'wirst scheinen', er_sie_es: 'wird scheinen', wir: 'werden scheinen', ihr: 'werdet scheinen', sie_Sie: 'werden scheinen' },
  },
  'schlafen': {
    [Tense.PRAESENS]: { ich: 'schlafe', du: 'schläfst', er_sie_es: 'schläft', wir: 'schlafen', ihr: 'schlaft', sie_Sie: 'schlafen' },
    [Tense.PRAETERITUM]: { ich: 'schlief', du: 'schliefst', er_sie_es: 'schlief', wir: 'schliefen', ihr: 'schlieft', sie_Sie: 'schliefen' },
    [Tense.PERFEKT]: { ich: 'habe geschlafen', du: 'hast geschlafen', er_sie_es: 'hat geschlafen', wir: 'haben geschlafen', ihr: 'habt geschlafen', sie_Sie: 'haben geschlafen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschlafen', du: 'hattest geschlafen', er_sie_es: 'hatte geschlafen', wir: 'hatten geschlafen', ihr: 'hattet geschlafen', sie_Sie: 'hatten geschlafen' },
    [Tense.FUTUR_I]: { ich: 'werde schlafen', du: 'wirst schlafen', er_sie_es: 'wird schlafen', wir: 'werden schlafen', ihr: 'werdet schlafen', sie_Sie: 'werden schlafen' },
  },
  'schlagen': {
    [Tense.PRAESENS]: { ich: 'schlage', du: 'schlägst', er_sie_es: 'schlägt', wir: 'schlagen', ihr: 'schlagt', sie_Sie: 'schlagen' },
    [Tense.PRAETERITUM]: { ich: 'schlug', du: 'schlugst', er_sie_es: 'schlug', wir: 'schlugen', ihr: 'schlugt', sie_Sie: 'schlugen' },
    [Tense.PERFEKT]: { ich: 'habe geschlagen', du: 'hast geschlagen', er_sie_es: 'hat geschlagen', wir: 'haben geschlagen', ihr: 'habt geschlagen', sie_Sie: 'haben geschlagen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschlagen', du: 'hattest geschlagen', er_sie_es: 'hatte geschlagen', wir: 'hatten geschlagen', ihr: 'hattet geschlagen', sie_Sie: 'hatten geschlagen' },
    [Tense.FUTUR_I]: { ich: 'werde schlagen', du: 'wirst schlagen', er_sie_es: 'wird schlagen', wir: 'werden schlagen', ihr: 'werdet schlagen', sie_Sie: 'werden schlagen' },
  },
  'schließen': {
    [Tense.PRAESENS]: { ich: 'schließe', du: 'schließt', er_sie_es: 'schließt', wir: 'schließen', ihr: 'schließt', sie_Sie: 'schließen' },
    [Tense.PRAETERITUM]: { ich: 'schloss', du: 'schlossest', er_sie_es: 'schloss', wir: 'schlossen', ihr: 'schlosst', sie_Sie: 'schlossen' },
    [Tense.PERFEKT]: { ich: 'habe geschlossen', du: 'hast geschlossen', er_sie_es: 'hat geschlossen', wir: 'haben geschlossen', ihr: 'habt geschlossen', sie_Sie: 'haben geschlossen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschlossen', du: 'hattest geschlossen', er_sie_es: 'hatte geschlossen', wir: 'hatten geschlossen', ihr: 'hattet geschlossen', sie_Sie: 'hatten geschlossen' },
    [Tense.FUTUR_I]: { ich: 'werde schließen', du: 'wirst schließen', er_sie_es: 'wird schließen', wir: 'werden schließen', ihr: 'werdet schließen', sie_Sie: 'werden schließen' },
  },
  'schmecken': createRegularVerb('schmeck'),
  'schneiden': {
    [Tense.PRAESENS]: { ich: 'schneide', du: 'schneidest', er_sie_es: 'schneidet', wir: 'schneiden', ihr: 'schneidet', sie_Sie: 'schneiden' },
    [Tense.PRAETERITUM]: { ich: 'schnitt', du: 'schnittest', er_sie_es: 'schnitt', wir: 'schnitten', ihr: 'schnittet', sie_Sie: 'schnitten' },
    [Tense.PERFEKT]: { ich: 'habe geschnitten', du: 'hast geschnitten', er_sie_es: 'hat geschnitten', wir: 'haben geschnitten', ihr: 'habt geschnitten', sie_Sie: 'haben geschnitten' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschnitten', du: 'hattest geschnitten', er_sie_es: 'hatte geschnitten', wir: 'hatten geschnitten', ihr: 'hattet geschnitten', sie_Sie: 'hatten geschnitten' },
    [Tense.FUTUR_I]: { ich: 'werde schneiden', du: 'wirst schneiden', er_sie_es: 'wird schneiden', wir: 'werden schneiden', ihr: 'werdet schneiden', sie_Sie: 'werden schneiden' },
  },
  'schreiben': {
    [Tense.PRAESENS]: { ich: 'schreibe', du: 'schreibst', er_sie_es: 'schreibt', wir: 'schreiben', ihr: 'schreibt', sie_Sie: 'schreiben' },
    [Tense.PRAETERITUM]: { ich: 'schrieb', du: 'schriebst', er_sie_es: 'schrieb', wir: 'schrieben', ihr: 'schriebt', sie_Sie: 'schrieben' },
    [Tense.PERFEKT]: { ich: 'habe geschrieben', du: 'hast geschrieben', er_sie_es: 'hat geschrieben', wir: 'haben geschrieben', ihr: 'habt geschrieben', sie_Sie: 'haben geschrieben' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschrieben', du: 'hattest geschrieben', er_sie_es: 'hatte geschrieben', wir: 'hatten geschrieben', ihr: 'hattet geschrieben', sie_Sie: 'hatten geschrieben' },
    [Tense.FUTUR_I]: { ich: 'werde schreiben', du: 'wirst schreiben', er_sie_es: 'wird schreiben', wir: 'werden schreiben', ihr: 'werdet schreiben', sie_Sie: 'werden schreiben' },
  },
  'schreien': {
    [Tense.PRAESENS]: { ich: 'schreie', du: 'schreist', er_sie_es: 'schreit', wir: 'schreien', ihr: 'schreit', sie_Sie: 'schreien' },
    [Tense.PRAETERITUM]: { ich: 'schrie', du: 'schriest', er_sie_es: 'schrie', wir: 'schrien', ihr: 'schriet', sie_Sie: 'schrien' },
    [Tense.PERFEKT]: { ich: 'habe geschrien', du: 'hast geschrien', er_sie_es: 'hat geschrien', wir: 'haben geschrien', ihr: 'habt geschrien', sie_Sie: 'haben geschrien' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geschrien', du: 'hattest geschrien', er_sie_es: 'hatte geschrien', wir: 'hatten geschrien', ihr: 'hattet geschrien', sie_Sie: 'hatten geschrien' },
    [Tense.FUTUR_I]: { ich: 'werde schreien', du: 'wirst schreien', er_sie_es: 'wird schreien', wir: 'werden schreien', ihr: 'werdet schreien', sie_Sie: 'werden schreien' },
  },
  'schwimmen': {
    [Tense.PRAESENS]: { ich: 'schwimme', du: 'schwimmst', er_sie_es: 'schwimmt', wir: 'schwimmen', ihr: 'schwimmt', sie_Sie: 'schwimmen' },
    [Tense.PRAETERITUM]: { ich: 'schwamm', du: 'schwammst', er_sie_es: 'schwamm', wir: 'schwammen', ihr: 'schwammt', sie_Sie: 'schwammen' },
    [Tense.PERFEKT]: { ich: 'bin geschwommen', du: 'bist geschwommen', er_sie_es: 'ist geschwommen', wir: 'sind geschwommen', ihr: 'seid geschwommen', sie_Sie: 'sind geschwommen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war geschwommen', du: 'warst geschwommen', er_sie_es: 'war geschwommen', wir: 'waren geschwommen', ihr: 'wart geschwommen', sie_Sie: 'waren geschwommen' },
    [Tense.FUTUR_I]: { ich: 'werde schwimmen', du: 'wirst schwimmen', er_sie_es: 'wird schwimmen', wir: 'werden schwimmen', ihr: 'werdet schwimmen', sie_Sie: 'werden schwimmen' },
  },
  'sehen': {
    [Tense.PRAESENS]: { ich: 'sehe', du: 'siehst', er_sie_es: 'sieht', wir: 'sehen', ihr: 'seht', sie_Sie: 'sehen' },
    [Tense.PRAETERITUM]: { ich: 'sah', du: 'sahst', er_sie_es: 'sah', wir: 'sahen', ihr: 'saht', sie_Sie: 'sahen' },
    [Tense.PERFEKT]: { ich: 'habe gesehen', du: 'hast gesehen', er_sie_es: 'hat gesehen', wir: 'haben gesehen', ihr: 'habt gesehen', sie_Sie: 'haben gesehen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gesehen', du: 'hattest gesehen', er_sie_es: 'hatte gesehen', wir: 'hatten gesehen', ihr: 'hattet gesehen', sie_Sie: 'hatten gesehen' },
    [Tense.FUTUR_I]: { ich: 'werde sehen', du: 'wirst sehen', er_sie_es: 'wird sehen', wir: 'werden sehen', ihr: 'werdet sehen', sie_Sie: 'werden sehen' },
  },
  'sein': {
    [Tense.PRAESENS]: { ich: 'bin', du: 'bist', er_sie_es: 'ist', wir: 'sind', ihr: 'seid', sie_Sie: 'sind' },
    [Tense.PRAETERITUM]: { ich: 'war', du: 'warst', er_sie_es: 'war', wir: 'waren', ihr: 'wart', sie_Sie: 'waren' },
    [Tense.PERFEKT]: { ich: 'bin gewesen', du: 'bist gewesen', er_sie_es: 'ist gewesen', wir: 'sind gewesen', ihr: 'seid gewesen', sie_Sie: 'sind gewesen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gewesen', du: 'warst gewesen', er_sie_es: 'war gewesen', wir: 'waren gewesen', ihr: 'wart gewesen', sie_Sie: 'waren gewesen' },
    [Tense.FUTUR_I]: { ich: 'werde sein', du: 'wirst sein', er_sie_es: 'wird sein', wir: 'werden sein', ihr: 'werdet sein', sie_Sie: 'werden sein' },
  },
  'setzen': createRegularVerb('setz'),
  'singen': {
    [Tense.PRAESENS]: { ich: 'singe', du: 'singst', er_sie_es: 'singt', wir: 'singen', ihr: 'singt', sie_Sie: 'singen' },
    [Tense.PRAETERITUM]: { ich: 'sang', du: 'sangst', er_sie_es: 'sang', wir: 'sangen', ihr: 'sangt', sie_Sie: 'sangen' },
    [Tense.PERFEKT]: { ich: 'habe gesungen', du: 'hast gesungen', er_sie_es: 'hat gesungen', wir: 'haben gesungen', ihr: 'habt gesungen', sie_Sie: 'haben gesungen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gesungen', du: 'hattest gesungen', er_sie_es: 'hatte gesungen', wir: 'hatten gesungen', ihr: 'hattet gesungen', sie_Sie: 'hatten gesungen' },
    [Tense.FUTUR_I]: { ich: 'werde singen', du: 'wirst singen', er_sie_es: 'wird singen', wir: 'werden singen', ihr: 'werdet singen', sie_Sie: 'werden singen' },
  },
  'sitzen': {
    [Tense.PRAESENS]: { ich: 'sitze', du: 'sitzt', er_sie_es: 'sitzt', wir: 'sitzen', ihr: 'sitzt', sie_Sie: 'sitzen' },
    [Tense.PRAETERITUM]: { ich: 'saß', du: 'saßest', er_sie_es: 'saß', wir: 'saßen', ihr: 'saßt', sie_Sie: 'saßen' },
    [Tense.PERFEKT]: { ich: 'habe gesessen', du: 'hast gesessen', er_sie_es: 'hat gesessen', wir: 'haben gesessen', ihr: 'habt gesessen', sie_Sie: 'haben gesessen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gesessen', du: 'hattest gesessen', er_sie_es: 'hatte gesessen', wir: 'hatten gesessen', ihr: 'hattet gesessen', sie_Sie: 'hatten gesessen' },
    [Tense.FUTUR_I]: { ich: 'werde sitzen', du: 'wirst sitzen', er_sie_es: 'wird sitzen', wir: 'werden sitzen', ihr: 'werdet sitzen', sie_Sie: 'werden sitzen' },
  },
  'sollen': {
    [Tense.PRAESENS]: { ich: 'soll', du: 'sollst', er_sie_es: 'soll', wir: 'sollen', ihr: 'sollt', sie_Sie: 'sollen' },
    [Tense.PRAETERITUM]: { ich: 'sollte', du: 'solltest', er_sie_es: 'sollte', wir: 'sollten', ihr: 'solltet', sie_Sie: 'sollten' },
    [Tense.PERFEKT]: { ich: 'habe gesollt', du: 'hast gesollt', er_sie_es: 'hat gesollt', wir: 'haben gesollt', ihr: 'habt gesollt', sie_Sie: 'haben gesollt' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gesollt', du: 'hattest gesollt', er_sie_es: 'hatte gesollt', wir: 'hatten gesollt', ihr: 'hattet gesollt', sie_Sie: 'hatten gesollt' },
    [Tense.FUTUR_I]: { ich: 'werde sollen', du: 'wirst sollen', er_sie_es: 'wird sollen', wir: 'werden sollen', ihr: 'werdet sollen', sie_Sie: 'werden sollen' },
  },
  'spielen': createRegularVerb('spiel'),
  'sprechen': {
    [Tense.PRAESENS]: { ich: 'spreche', du: 'sprichst', er_sie_es: 'spricht', wir: 'sprechen', ihr: 'sprecht', sie_Sie: 'sprechen' },
    [Tense.PRAETERITUM]: { ich: 'sprach', du: 'sprachst', er_sie_es: 'sprach', wir: 'sprachen', ihr: 'spracht', sie_Sie: 'sprachen' },
    [Tense.PERFEKT]: { ich: 'habe gesprochen', du: 'hast gesprochen', er_sie_es: 'hat gesprochen', wir: 'haben gesprochen', ihr: 'habt gesprochen', sie_Sie: 'haben gesprochen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gesprochen', du: 'hattest gesprochen', er_sie_es: 'hatte gesprochen', wir: 'hatten gesprochen', ihr: 'hattet gesprochen', sie_Sie: 'hatten gesprochen' },
    [Tense.FUTUR_I]: { ich: 'werde sprechen', du: 'wirst sprechen', er_sie_es: 'wird sprechen', wir: 'werden sprechen', ihr: 'werdet sprechen', sie_Sie: 'werden sprechen' },
  },
  'springen': {
    [Tense.PRAESENS]: { ich: 'springe', du: 'springst', er_sie_es: 'springt', wir: 'springen', ihr: 'springt', sie_Sie: 'springen' },
    [Tense.PRAETERITUM]: { ich: 'sprang', du: 'sprangst', er_sie_es: 'sprang', wir: 'sprangen', ihr: 'sprangt', sie_Sie: 'sprangen' },
    [Tense.PERFEKT]: { ich: 'bin gesprungen', du: 'bist gesprungen', er_sie_es: 'ist gesprungen', wir: 'sind gesprungen', ihr: 'seid gesprungen', sie_Sie: 'sind gesprungen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gesprungen', du: 'warst gesprungen', er_sie_es: 'war gesprungen', wir: 'waren gesprungen', ihr: 'wart gesprungen', sie_Sie: 'waren gesprungen' },
    [Tense.FUTUR_I]: { ich: 'werde springen', du: 'wirst springen', er_sie_es: 'wird springen', wir: 'werden springen', ihr: 'werdet springen', sie_Sie: 'werden springen' },
  },
  'staunen': createRegularVerb('staun'),
  'stehen': {
    [Tense.PRAESENS]: { ich: 'stehe', du: 'stehst', er_sie_es: 'steht', wir: 'stehen', ihr: 'steht', sie_Sie: 'stehen' },
    [Tense.PRAETERITUM]: { ich: 'stand', du: 'standst', er_sie_es: 'stand', wir: 'standen', ihr: 'standet', sie_Sie: 'standen' },
    [Tense.PERFEKT]: { ich: 'bin gestanden', du: 'bist gestanden', er_sie_es: 'ist gestanden', wir: 'sind gestanden', ihr: 'seid gestanden', sie_Sie: 'sind gestanden' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gestanden', du: 'warst gestanden', er_sie_es: 'war gestanden', wir: 'waren gestanden', ihr: 'wart gestanden', sie_Sie: 'waren gestanden' },
    [Tense.FUTUR_I]: { ich: 'werde stehen', du: 'wirst stehen', er_sie_es: 'wird stehen', wir: 'werden stehen', ihr: 'werdet stehen', sie_Sie: 'werden stehen' },
  },
  'steigen': {
    [Tense.PRAESENS]: { ich: 'steige', du: 'steigst', er_sie_es: 'steigt', wir: 'steigen', ihr: 'steigt', sie_Sie: 'steigen' },
    [Tense.PRAETERITUM]: { ich: 'stieg', du: 'stiegst', er_sie_es: 'stieg', wir: 'stiegen', ihr: 'stiegt', sie_Sie: 'stiegen' },
    [Tense.PERFEKT]: { ich: 'bin gestiegen', du: 'bist gestiegen', er_sie_es: 'ist gestiegen', wir: 'sind gestiegen', ihr: 'seid gestiegen', sie_Sie: 'sind gestiegen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gestiegen', du: 'warst gestiegen', er_sie_es: 'war gestiegen', wir: 'waren gestiegen', ihr: 'wart gestiegen', sie_Sie: 'waren gestiegen' },
    [Tense.FUTUR_I]: { ich: 'werde steigen', du: 'wirst steigen', er_sie_es: 'wird steigen', wir: 'werden steigen', ihr: 'werdet steigen', sie_Sie: 'werden steigen' },
  },
  'stellen': createRegularVerb('stell'),
  'sterben': {
    [Tense.PRAESENS]: { ich: 'sterbe', du: 'stirbst', er_sie_es: 'stirbt', wir: 'sterben', ihr: 'sterbt', sie_Sie: 'sterben' },
    [Tense.PRAETERITUM]: { ich: 'starb', du: 'starbst', er_sie_es: 'starb', wir: 'starben', ihr: 'starbt', sie_Sie: 'starben' },
    [Tense.PERFEKT]: { ich: 'bin gestorben', du: 'bist gestorben', er_sie_es: 'ist gestorben', wir: 'sind gestorben', ihr: 'seid gestorben', sie_Sie: 'sind gestorben' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gestorben', du: 'warst gestorben', er_sie_es: 'war gestorben', wir: 'waren gestorben', ihr: 'wart gestorben', sie_Sie: 'waren gestorben' },
    [Tense.FUTUR_I]: { ich: 'werde sterben', du: 'wirst sterben', er_sie_es: 'wird sterben', wir: 'werden sterben', ihr: 'werdet sterben', sie_Sie: 'werden sterben' },
  },
  'stimmen': createRegularVerb('stimm'),
  'streiten': {
    [Tense.PRAESENS]: { ich: 'streite', du: 'streitest', er_sie_es: 'streitet', wir: 'streiten', ihr: 'streitet', sie_Sie: 'streiten' },
    [Tense.PRAETERITUM]: { ich: 'stritt', du: 'strittest', er_sie_es: 'stritt', wir: 'stritten', ihr: 'strittet', sie_Sie: 'stritten' },
    [Tense.PERFEKT]: { ich: 'habe gestritten', du: 'hast gestritten', er_sie_es: 'hat gestritten', wir: 'haben gestritten', ihr: 'habt gestritten', sie_Sie: 'haben gestritten' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gestritten', du: 'hattest gestritten', er_sie_es: 'hatte gestritten', wir: 'hatten gestritten', ihr: 'hattet gestritten', sie_Sie: 'hatten gestritten' },
    [Tense.FUTUR_I]: { ich: 'werde streiten', du: 'wirst streiten', er_sie_es: 'wird streiten', wir: 'werden streiten', ihr: 'werdet streiten', sie_Sie: 'werden streiten' },
  },
  'suchen': createRegularVerb('such'),
  // --- T ---
  'tanzen': createRegularVerb('tanz'),
  'tauchen': createRegularVerb('tauch'),
  'tragen': {
    [Tense.PRAESENS]: { ich: 'trage', du: 'trägst', er_sie_es: 'trägt', wir: 'tragen', ihr: 'tragt', sie_Sie: 'tragen' },
    [Tense.PRAETERITUM]: { ich: 'trug', du: 'trugst', er_sie_es: 'trug', wir: 'trugen', ihr: 'trugt', sie_Sie: 'trugen' },
    [Tense.PERFEKT]: { ich: 'habe getragen', du: 'hast getragen', er_sie_es: 'hat getragen', wir: 'haben getragen', ihr: 'habt getragen', sie_Sie: 'haben getragen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte getragen', du: 'hattest getragen', er_sie_es: 'hatte getragen', wir: 'hatten getragen', ihr: 'hattet getragen', sie_Sie: 'hatten getragen' },
    [Tense.FUTUR_I]: { ich: 'werde tragen', du: 'wirst tragen', er_sie_es: 'wird tragen', wir: 'werden tragen', ihr: 'werdet tragen', sie_Sie: 'werden tragen' },
  },
  'träumen': createRegularVerb('träum'),
  'treffen': {
    [Tense.PRAESENS]: { ich: 'treffe', du: 'triffst', er_sie_es: 'trifft', wir: 'treffen', ihr: 'trefft', sie_Sie: 'treffen' },
    [Tense.PRAETERITUM]: { ich: 'traf', du: 'trafst', er_sie_es: 'traf', wir: 'trafen', ihr: 'traft', sie_Sie: 'trafen' },
    [Tense.PERFEKT]: { ich: 'habe getroffen', du: 'hast getroffen', er_sie_es: 'hat getroffen', wir: 'haben getroffen', ihr: 'habt getroffen', sie_Sie: 'haben getroffen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte getroffen', du: 'hattest getroffen', er_sie_es: 'hatte getroffen', wir: 'hatten getroffen', ihr: 'hattet getroffen', sie_Sie: 'hatten getroffen' },
    [Tense.FUTUR_I]: { ich: 'werde treffen', du: 'wirst treffen', er_sie_es: 'wird treffen', wir: 'werden treffen', ihr: 'werdet treffen', sie_Sie: 'werden treffen' },
  },
  'trinken': {
    [Tense.PRAESENS]: { ich: 'trinke', du: 'trinkst', er_sie_es: 'trinkt', wir: 'trinken', ihr: 'trinkt', sie_Sie: 'trinken' },
    [Tense.PRAETERITUM]: { ich: 'trank', du: 'trankst', er_sie_es: 'trank', wir: 'tranken', ihr: 'trankt', sie_Sie: 'tranken' },
    [Tense.PERFEKT]: { ich: 'habe getrunken', du: 'hast getrunken', er_sie_es: 'hat getrunken', wir: 'haben getrunken', ihr: 'habt getrunken', sie_Sie: 'haben getrunken' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte getrunken', du: 'hattest getrunken', er_sie_es: 'hatte getrunken', wir: 'hatten getrunken', ihr: 'hattet getrunken', sie_Sie: 'hatten getrunken' },
    [Tense.FUTUR_I]: { ich: 'werde trinken', du: 'wirst trinken', er_sie_es: 'wird trinken', wir: 'werden trinken', ihr: 'werdet trinken', sie_Sie: 'werden trinken' },
  },
  'tun': {
    [Tense.PRAESENS]: { ich: 'tue', du: 'tust', er_sie_es: 'tut', wir: 'tun', ihr: 'tut', sie_Sie: 'tun' },
    [Tense.PRAETERITUM]: { ich: 'tat', du: 'tatest', er_sie_es: 'tat', wir: 'taten', ihr: 'tatet', sie_Sie: 'taten' },
    [Tense.PERFEKT]: { ich: 'habe getan', du: 'hast getan', er_sie_es: 'hat getan', wir: 'haben getan', ihr: 'habt getan', sie_Sie: 'haben getan' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte getan', du: 'hattest getan', er_sie_es: 'hatte getan', wir: 'hatten getan', ihr: 'hattet getan', sie_Sie: 'hatten getan' },
    [Tense.FUTUR_I]: { ich: 'werde tun', du: 'wirst tun', er_sie_es: 'wird tun', wir: 'werden tun', ihr: 'werdet tun', sie_Sie: 'werden tun' },
  },
  // --- V ---
  'vergessen': {
    [Tense.PRAESENS]: { ich: 'vergesse', du: 'vergisst', er_sie_es: 'vergisst', wir: 'vergessen', ihr: 'vergesst', sie_Sie: 'vergessen' },
    [Tense.PRAETERITUM]: { ich: 'vergaß', du: 'vergaßest', er_sie_es: 'vergaß', wir: 'vergaßen', ihr: 'vergaßt', sie_Sie: 'vergaßen' },
    [Tense.PERFEKT]: { ich: 'habe vergessen', du: 'hast vergessen', er_sie_es: 'hat vergessen', wir: 'haben vergessen', ihr: 'habt vergessen', sie_Sie: 'haben vergessen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte vergessen', du: 'hattest vergessen', er_sie_es: 'hatte vergessen', wir: 'hatten vergessen', ihr: 'hattet vergessen', sie_Sie: 'hatten vergessen' },
    [Tense.FUTUR_I]: { ich: 'werde vergessen', du: 'wirst vergessen', er_sie_es: 'wird vergessen', wir: 'werden vergessen', ihr: 'werdet vergessen', sie_Sie: 'werden vergessen' },
  },
  'verkaufen': createRegularVerb('verkauf'),
  'verlieren': {
    [Tense.PRAESENS]: { ich: 'verliere', du: 'verlierst', er_sie_es: 'verliert', wir: 'verlieren', ihr: 'verliert', sie_Sie: 'verlieren' },
    [Tense.PRAETERITUM]: { ich: 'verlor', du: 'verlorst', er_sie_es: 'verlor', wir: 'verloren', ihr: 'verlort', sie_Sie: 'verloren' },
    [Tense.PERFEKT]: { ich: 'habe verloren', du: 'hast verloren', er_sie_es: 'hat verloren', wir: 'haben verloren', ihr: 'habt verloren', sie_Sie: 'haben verloren' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte verloren', du: 'hattest verloren', er_sie_es: 'hatte verloren', wir: 'hatten verloren', ihr: 'hattet verloren', sie_Sie: 'hatten verloren' },
    [Tense.FUTUR_I]: { ich: 'werde verlieren', du: 'wirst verlieren', er_sie_es: 'wird verlieren', wir: 'werden verlieren', ihr: 'werdet verlieren', sie_Sie: 'werden verlieren' },
  },
  'verstehen': {
    [Tense.PRAESENS]: { ich: 'verstehe', du: 'verstehst', er_sie_es: 'versteht', wir: 'verstehen', ihr: 'versteht', sie_Sie: 'verstehen' },
    [Tense.PRAETERITUM]: { ich: 'verstand', du: 'verstandest', er_sie_es: 'verstand', wir: 'verstanden', ihr: 'verstandet', sie_Sie: 'verstanden' },
    [Tense.PERFEKT]: { ich: 'habe verstanden', du: 'hast verstanden', er_sie_es: 'hat verstanden', wir: 'haben verstanden', ihr: 'habt verstanden', sie_Sie: 'haben verstanden' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte verstanden', du: 'hattest verstanden', er_sie_es: 'hatte verstanden', wir: 'hatten verstanden', ihr: 'hattet verstanden', sie_Sie: 'hatten verstanden' },
    [Tense.FUTUR_I]: { ich: 'werde verstehen', du: 'wirst verstehen', er_sie_es: 'wird verstehen', wir: 'werden verstehen', ihr: 'werdet verstehen', sie_Sie: 'werden verstehen' },
  },
  'verzeihen': {
    [Tense.PRAESENS]: { ich: 'verzeihe', du: 'verzeihst', er_sie_es: 'verzeiht', wir: 'verzeihen', ihr: 'verzeiht', sie_Sie: 'verzeihen' },
    [Tense.PRAETERITUM]: { ich: 'verzieh', du: 'verziehest', er_sie_es: 'verzieh', wir: 'verziehen', ihr: 'verziehet', sie_Sie: 'verziehen' },
    [Tense.PERFEKT]: { ich: 'habe verziehen', du: 'hast verziehen', er_sie_es: 'hat verziehen', wir: 'haben verziehen', ihr: 'habt verziehen', sie_Sie: 'haben verziehen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte verziehen', du: 'hattest verziehen', er_sie_es: 'hatte verziehen', wir: 'hatten verziehen', ihr: 'hattet verziehen', sie_Sie: 'hatten verziehen' },
    [Tense.FUTUR_I]: { ich: 'werde verzeihen', du: 'wirst verzeihen', er_sie_es: 'wird verzeihen', wir: 'werden verzeihen', ihr: 'werdet verzeihen', sie_Sie: 'werden verzeihen' },
  },
  // --- W ---
  'wachsen': {
    [Tense.PRAESENS]: { ich: 'wachse', du: 'wächst', er_sie_es: 'wächst', wir: 'wachsen', ihr: 'wachst', sie_Sie: 'wachsen' },
    [Tense.PRAETERITUM]: { ich: 'wuchs', du: 'wuchsest', er_sie_es: 'wuchs', wir: 'wuchsen', ihr: 'wuchst', sie_Sie: 'wuchsen' },
    [Tense.PERFEKT]: { ich: 'bin gewachsen', du: 'bist gewachsen', er_sie_es: 'ist gewachsen', wir: 'sind gewachsen', ihr: 'seid gewachsen', sie_Sie: 'sind gewachsen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war gewachsen', du: 'warst gewachsen', er_sie_es: 'war gewachsen', wir: 'waren gewachsen', ihr: 'wart gewachsen', sie_Sie: 'waren gewachsen' },
    [Tense.FUTUR_I]: { ich: 'werde wachsen', du: 'wirst wachsen', er_sie_es: 'wird wachsen', wir: 'werden wachsen', ihr: 'werdet wachsen', sie_Sie: 'werden wachsen' },
  },
  'warten': createRegularVerb('wart'),
  'waschen': {
    [Tense.PRAESENS]: { ich: 'wasche', du: 'wäschst', er_sie_es: 'wäscht', wir: 'waschen', ihr: 'wascht', sie_Sie: 'waschen' },
    [Tense.PRAETERITUM]: { ich: 'wusch', du: 'wuschst', er_sie_es: 'wusch', wir: 'wuschen', ihr: 'wuscht', sie_Sie: 'wuschen' },
    [Tense.PERFEKT]: { ich: 'habe gewaschen', du: 'hast gewaschen', er_sie_es: 'hat gewaschen', wir: 'haben gewaschen', ihr: 'habt gewaschen', sie_Sie: 'haben gewaschen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gewaschen', du: 'hattest gewaschen', er_sie_es: 'hatte gewaschen', wir: 'hatten gewaschen', ihr: 'hattet gewaschen', sie_Sie: 'hatten gewaschen' },
    [Tense.FUTUR_I]: { ich: 'werde waschen', du: 'wirst waschen', er_sie_es: 'wird waschen', wir: 'werden waschen', ihr: 'werdet waschen', sie_Sie: 'werden waschen' },
  },
  'weinen': createRegularVerb('wein'),
  'werden': {
    [Tense.PRAESENS]: { ich: 'werde', du: 'wirst', er_sie_es: 'wird', wir: 'werden', ihr: 'werdet', sie_Sie: 'werden' },
    [Tense.PRAETERITUM]: { ich: 'wurde', du: 'wurdest', er_sie_es: 'wurde', wir: 'wurden', ihr: 'wurdet', sie_Sie: 'wurden' },
    [Tense.PERFEKT]: { ich: 'bin geworden', du: 'bist geworden', er_sie_es: 'ist geworden', wir: 'sind geworden', ihr: 'seid geworden', sie_Sie: 'sind geworden' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'war geworden', du: 'warst geworden', er_sie_es: 'war geworden', wir: 'waren geworden', ihr: 'wart geworden', sie_Sie: 'waren geworden' },
    [Tense.FUTUR_I]: { ich: 'werde werden', du: 'wirst werden', er_sie_es: 'wird werden', wir: 'werden werden', ihr: 'werdet werden', sie_Sie: 'werden werden' },
  },
  'werfen': {
    [Tense.PRAESENS]: { ich: 'werfe', du: 'wirfst', er_sie_es: 'wirft', wir: 'werfen', ihr: 'werft', sie_Sie: 'werfen' },
    [Tense.PRAETERITUM]: { ich: 'warf', du: 'warfst', er_sie_es: 'warf', wir: 'warfen', ihr: 'warft', sie_Sie: 'warfen' },
    [Tense.PERFEKT]: { ich: 'habe geworfen', du: 'hast geworfen', er_sie_es: 'hat geworfen', wir: 'haben geworfen', ihr: 'habt geworfen', sie_Sie: 'haben geworfen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte geworfen', du: 'hattest geworfen', er_sie_es: 'hatte geworfen', wir: 'hatten geworfen', ihr: 'hattet geworfen', sie_Sie: 'hatten geworfen' },
    [Tense.FUTUR_I]: { ich: 'werde werfen', du: 'wirst werfen', er_sie_es: 'wird werfen', wir: 'werden werfen', ihr: 'werdet werfen', sie_Sie: 'werden werfen' },
  },
  'wissen': {
    [Tense.PRAESENS]: { ich: 'weiß', du: 'weißt', er_sie_es: 'weiß', wir: 'wissen', ihr: 'wisst', sie_Sie: 'wissen' },
    [Tense.PRAETERITUM]: { ich: 'wusste', du: 'wusstest', er_sie_es: 'wusste', wir: 'wussten', ihr: 'wusstet', sie_Sie: 'wussten' },
    [Tense.PERFEKT]: { ich: 'habe gewusst', du: 'hast gewusst', er_sie_es: 'hat gewusst', wir: 'haben gewusst', ihr: 'habt gewusst', sie_Sie: 'haben gewusst' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gewusst', du: 'hattest gewusst', er_sie_es: 'hatte gewusst', wir: 'hatten gewusst', ihr: 'hattet gewusst', sie_Sie: 'hatten gewusst' },
    [Tense.FUTUR_I]: { ich: 'werde wissen', du: 'wirst wissen', er_sie_es: 'wird wissen', wir: 'werden wissen', ihr: 'werdet wissen', sie_Sie: 'werden wissen' },
  },
  'wohnen': createRegularVerb('wohn'),
  'wünschen': createRegularVerb('wünsch'),
  // --- Z ---
  'zahlen': createRegularVerb('zahl'),
  'zaubern': createRegularVerb('zauber'),
  'zeigen': createRegularVerb('zeig'),
  'zelten': createRegularVerb('zelt'),
  'zerstören': createRegularVerb('zerstör'),
  'ziehen': {
    [Tense.PRAESENS]: { ich: 'ziehe', du: 'ziehst', er_sie_es: 'zieht', wir: 'ziehen', ihr: 'zieht', sie_Sie: 'ziehen' },
    [Tense.PRAETERITUM]: { ich: 'zog', du: 'zogst', er_sie_es: 'zog', wir: 'zogen', ihr: 'zogt', sie_Sie: 'zogen' },
    [Tense.PERFEKT]: { ich: 'habe gezogen', du: 'hast gezogen', er_sie_es: 'hat gezogen', wir: 'haben gezogen', ihr: 'habt gezogen', sie_Sie: 'haben gezogen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gezogen', du: 'hattest gezogen', er_sie_es: 'hatte gezogen', wir: 'hatten gezogen', ihr: 'hattet gezogen', sie_Sie: 'hatten gezogen' },
    [Tense.FUTUR_I]: { ich: 'werde ziehen', du: 'wirst ziehen', er_sie_es: 'wird ziehen', wir: 'werden ziehen', ihr: 'werdet ziehen', sie_Sie: 'werden ziehen' },
  },
  'zuhören': createSeparableVerb('zu', 'hör', 'hör'),
  'zupfen': createRegularVerb('zupf'),
  'zwingen': {
    [Tense.PRAESENS]: { ich: 'zwinge', du: 'zwingst', er_sie_es: 'zwingt', wir: 'zwingen', ihr: 'zwingt', sie_Sie: 'zwingen' },
    [Tense.PRAETERITUM]: { ich: 'zwang', du: 'zwangst', er_sie_es: 'zwang', wir: 'zwangen', ihr: 'zwangt', sie_Sie: 'zwangen' },
    [Tense.PERFEKT]: { ich: 'habe gezwungen', du: 'hast gezwungen', er_sie_es: 'hat gezwungen', wir: 'haben gezwungen', ihr: 'habt gezwungen', sie_Sie: 'haben gezwungen' },
    [Tense.PLUSQUAMPERFEKT]: { ich: 'hatte gezwungen', du: 'hattest gezwungen', er_sie_es: 'hatte gezwungen', wir: 'hatten gezwungen', ihr: 'hattet gezwungen', sie_Sie: 'hatten gezwungen' },
    [Tense.FUTUR_I]: { ich: 'werde zwingen', du: 'wirst zwingen', er_sie_es: 'wird zwingen', wir: 'werden zwingen', ihr: 'werdet zwingen', sie_Sie: 'werden zwingen' },
  },
};

export const getLocalConjugation = (lemma, tense) => {
  const lemmaLower = lemma.toLowerCase();

  return COMMON_VERBS_DB[lemmaLower]?.[tense] || null;
};


// --- Reverse Lookup Engine ---

// Map: "konjugiertes_wort" -> { lemma: "grundform", tense: "zeitform" }
let REVERSE_VERB_INDEX = null;

const buildReverseIndex = () => {
  if (REVERSE_VERB_INDEX) return;

  REVERSE_VERB_INDEX = new Map();

  Object.keys(COMMON_VERBS_DB).forEach(lemma => {
    const verbData = COMMON_VERBS_DB[lemma];
    Object.keys(verbData).forEach(tenseKey => {
      const tense = tenseKey;
      const conjugations = verbData[tense];
      if (!conjugations) return;

      Object.entries(conjugations).forEach(([personKey, conjugatedForm]) => {
        const key = conjugatedForm.toLowerCase();

        // Add to index
        if (!REVERSE_VERB_INDEX.has(key)) {
          REVERSE_VERB_INDEX.set(key, { lemma, tense });
        }

        // Handle compound tenses ("habe gemacht") -> Index "gemacht"
        if (key.includes(' ')) {
          const parts = key.split(' ');
          const participle = parts[parts.length - 1]; // Last word
          if (participle.length > 3) { // Avoid short noise
            if (!REVERSE_VERB_INDEX.has(participle)) {
              REVERSE_VERB_INDEX.set(participle, { lemma, tense: Tense.PERFEKT });
            }
          }
        }
      });
    });
  });

  // Add infinitives
  Object.keys(COMMON_VERBS_DB).forEach(lemma => {
    const lemmaLower = lemma.toLowerCase();
    if (!REVERSE_VERB_INDEX.has(lemmaLower)) {
      REVERSE_VERB_INDEX.set(lemmaLower, { lemma, tense: Tense.PRAESENS });
    }
  });
};

// Initialize asynchronously
setTimeout(buildReverseIndex, 100);

export const findVerbLemma = (word) => {
  if (!word) return null;
  buildReverseIndex(); // Ensure index is built
  const cleanWord = word.toLowerCase().trim();

  // Direct match
  let match = REVERSE_VERB_INDEX.get(cleanWord);

  // Simple heuristic for suffixes if not found
  if (!match && cleanWord.endsWith('st')) {
    match = REVERSE_VERB_INDEX.get(cleanWord.slice(0, -2));
  }

  return match ? match.lemma : null;
};


