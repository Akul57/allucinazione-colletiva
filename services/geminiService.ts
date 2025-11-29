
import { GameData } from '../types';

// DATABASE DI PAROLE STATICHE
// Regola: Stessa categoria, ma forma/funzione diversa. NO sinonimi stretti.
const WORD_PAIRS: GameData[] = [
  // Oggetti Casa
  {
    category: 'Illuminazione',
    normalWord: 'Lampadina',
    similarWord: 'Candela',
  },
  { category: 'Sedute', normalWord: 'Sedia', similarWord: 'Sgabello' },
  { category: 'Sedute Comode', normalWord: 'Divano', similarWord: 'Poltrona' },
  { category: 'Posate', normalWord: 'Forchetta', similarWord: 'Cucchiaio' },
  { category: 'Cucina', normalWord: 'Pentola', similarWord: 'Padella' },
  { category: 'Pulizia', normalWord: 'Scopa', similarWord: 'Aspirapolvere' },
  {
    category: 'Contenitori Liquidi',
    normalWord: 'Bicchiere',
    similarWord: 'Tazza',
  },
  { category: 'Dormire', normalWord: 'Cuscino', similarWord: 'Coperta' },
  { category: 'Arredamento', normalWord: 'Tappeto', similarWord: 'Zerbino' },
  { category: 'Bagno', normalWord: 'Sapone', similarWord: 'Shampoo' },
  { category: 'Igiene', normalWord: 'Spazzolino', similarWord: 'Dentifricio' },
  { category: 'Scrittura', normalWord: 'Penna', similarWord: 'Matita' },
  { category: 'Cartoleria', normalWord: 'Quaderno', similarWord: 'Diario' },
  {
    category: 'Tempo',
    normalWord: 'Orologio da Polso',
    similarWord: 'Sveglia',
  },
  {
    category: 'Accessori Pioggia',
    normalWord: 'Ombrello',
    similarWord: 'Impermeabile',
  },

  // Cibo e Bevande
  { category: 'Colazione', normalWord: 'Pancake', similarWord: 'Waffle' },
  { category: 'Colazione Dolce', normalWord: 'Cornetto', similarWord: 'Ciambella' },
  { category: 'Frutta Tonda', normalWord: 'Arancia', similarWord: 'Pesca' },
  { category: 'Frutta Piccola', normalWord: 'Fragola', similarWord: 'Ciliegia' },
  { category: 'Bevande Calde', normalWord: 'Caffè', similarWord: 'Tè' },
  { category: 'Fast Food', normalWord: 'Hamburger', similarWord: 'Hot Dog' },
  { category: 'Lievitati Salati', normalWord: 'Pizza', similarWord: 'Focaccia' },
  { category: 'Dolci Freddi', normalWord: 'Gelato', similarWord: 'Ghiacciolo' },
  { category: 'Dessert', normalWord: 'Torta', similarWord: 'Crostata' },
  { category: 'Carboidrati', normalWord: 'Pasta', similarWord: 'Riso' },
  { category: 'Condimenti', normalWord: 'Ketchup', similarWord: 'Maionese' },
  { category: 'Verdura', normalWord: 'Cetriolo', similarWord: 'Zucchina' },
  { category: 'Ortaggi', normalWord: 'Patata', similarWord: 'Carota' },
  { category: 'Frutta Estiva', normalWord: 'Anguria', similarWord: 'Melone' },
  { category: 'Latticini', normalWord: 'Latte', similarWord: 'Yogurt' },

  // Trasporti
  { category: 'Aria', normalWord: 'Aereo', similarWord: 'Elicottero' },
  { category: 'Rotaie', normalWord: 'Treno', similarWord: 'Tram' },
  { category: 'Acqua', normalWord: 'Nave', similarWord: 'Sottomarino' },
  { category: 'Piccole Imbarcazioni', normalWord: 'Barca a remi', similarWord: 'Canoa' },
  {
    category: 'Due Ruote',
    normalWord: 'Bicicletta',
    similarWord: 'Monopattino',
  },
  { category: 'Motore a 2 Ruote', normalWord: 'Moto', similarWord: 'Scooter' },
  {
    category: 'Emergenza',
    normalWord: 'Ambulanza',
    similarWord: 'Auto della Polizia',
  },
  { category: 'Pubblici', normalWord: 'Autobus', similarWord: 'Taxi' },
  { category: 'Neve', normalWord: 'Sci', similarWord: 'Snowboard' },
  { category: 'Spazio', normalWord: 'Razzo', similarWord: 'Satellite' },

  // Animali
  { category: 'Volatili', normalWord: 'Aquila', similarWord: 'Pipistrello' },
  { category: 'Grandi Felini', normalWord: 'Leone', similarWord: 'Tigre' },
  { category: 'Insetti Volanti', normalWord: 'Ape', similarWord: 'Mosca' },
  { category: 'Insetti Colorati', normalWord: 'Farfalla', similarWord: 'Libellula' },
  { category: 'Acquatici', normalWord: 'Delfino', similarWord: 'Squalo' },
  { category: 'Lenti', normalWord: 'Tartaruga', similarWord: 'Lumaca' },
  { category: 'Domestici', normalWord: 'Cane', similarWord: 'Gatto' },
  { category: 'Fattoria', normalWord: 'Mucca', similarWord: 'Cavallo' },
  { category: 'Striscianti', normalWord: 'Serpente', similarWord: 'Verme' },
  { category: 'Artici', normalWord: 'Pinguino', similarWord: 'Foca' },
  { category: 'Bosco', normalWord: 'Orso', similarWord: 'Lupo' },

  // Tecnologia & Elettronica
  { category: 'Computer', normalWord: 'Tastiera', similarWord: 'Mouse' },
  { category: 'Schermi', normalWord: 'Monitor', similarWord: 'Televisore' },
  { category: 'Dispositivi', normalWord: 'Smartphone', similarWord: 'Tablet' },
  { category: 'Audio', normalWord: 'Cuffie', similarWord: 'Altoparlante' },
  {
    category: 'Immagini',
    normalWord: 'Fotocamera',
    similarWord: 'Videocamera',
  },
  {
    category: 'Archiviazione',
    normalWord: 'Chiavetta USB',
    similarWord: 'Hard Disk',
  },

  // Abbigliamento
  { category: 'Mani', normalWord: 'Guanti', similarWord: 'Muffole' },
  { category: 'Testa', normalWord: 'Cappello', similarWord: 'Casco' },
  { category: 'Piedi Estivi', normalWord: 'Sandali', similarWord: 'Infradito' },
  {
    category: 'Piedi Invernali',
    normalWord: 'Stivali',
    similarWord: 'Scarponi',
  },
  { category: 'Gambe', normalWord: 'Pantaloni', similarWord: 'Pantaloncini' },
  { category: 'Gambe Donna', normalWord: 'Gonna', similarWord: 'Vestito' },
  { category: 'Sopra', normalWord: 'Felpa', similarWord: 'Maglione' },
  { category: 'Elegante', normalWord: 'Giacca', similarWord: 'Camicia' },
  { category: 'Collo', normalWord: 'Sciarpa', similarWord: 'Cravatta' },

  // Sport e Hobby
  { category: 'Racchette', normalWord: 'Tennis', similarWord: 'Ping Pong' },
  { category: 'Palla a squadre', normalWord: 'Calcio', similarWord: 'Basket' },
  { category: 'Rete', normalWord: 'Pallavolo', similarWord: 'Beach Volley' },
  { category: 'Acqua', normalWord: 'Nuoto', similarWord: 'Pallanuoto' },
  { category: 'Combattimento', normalWord: 'Pugilato', similarWord: 'Karate' },
  { category: 'Musica Corde', normalWord: 'Chitarra', similarWord: 'Violino' },
  {
    category: 'Musica Tasti',
    normalWord: 'Pianoforte',
    similarWord: 'Fisarmonica',
  },
  { category: 'Musica Fiato', normalWord: 'Tromba', similarWord: 'Sassofono' },
  { category: 'Ritmo', normalWord: 'Batteria', similarWord: 'Tamburo' },
  { category: 'Gioco da Tavolo', normalWord: 'Scacchi', similarWord: 'Dama' },
  { category: 'Azzardo', normalWord: 'Carte', similarWord: 'Dadi' },

  // Luoghi
  { category: 'Spettacolo', normalWord: 'Cinema', similarWord: 'Teatro' },
  { category: 'Studio', normalWord: 'Biblioteca', similarWord: 'Libreria' },
  { category: 'Acqua', normalWord: 'Mare', similarWord: 'Piscina' },
  { category: 'Acqua Dolce', normalWord: 'Lago', similarWord: 'Fiume' },
  { category: 'Cibo Fuori', normalWord: 'Ristorante', similarWord: 'Mensa' },
  { category: 'Verde', normalWord: 'Parco', similarWord: 'Foresta' },
  { category: 'Altezze', normalWord: 'Montagna', similarWord: 'Collina' },
  { category: 'Abitazione', normalWord: 'Castello', similarWord: 'Palazzo' },
  { category: 'Culto', normalWord: 'Chiesa', similarWord: 'Cattedrale' },

  // Strumenti da Lavoro
  { category: 'Taglio', normalWord: 'Forbici', similarWord: 'Coltello' },
  { category: 'Fissaggio', normalWord: 'Martello', similarWord: 'Cacciavite' },
  { category: 'Giardinaggio', normalWord: 'Pala', similarWord: 'Rastrello' },
  {
    category: 'Medicale',
    normalWord: 'Stetoscopio',
    similarWord: 'Termometro',
  },
  { category: 'Pittura', normalWord: 'Pennello', similarWord: 'Rullo' },

  // Natura
  { category: 'Fiori', normalWord: 'Rosa', similarWord: 'Tulipano' },
  { category: 'Alberi', normalWord: 'Quercia', similarWord: 'Pino' },
  { category: 'Meteo Avverso', normalWord: 'Neve', similarWord: 'Grandine' },

  // Concetti Astratti / Vari
  { category: 'Eventi', normalWord: 'Matrimonio', similarWord: 'Funerale' },
  { category: 'Feste', normalWord: 'Natale', similarWord: 'Capodanno' },
  { category: 'Astri', normalWord: 'Sole', similarWord: 'Luna' },
  { category: 'Elementi', normalWord: 'Fuoco', similarWord: 'Fulmine' },
  { category: 'Soldi', normalWord: 'Banconota', similarWord: 'Moneta' },
  { category: 'Favole', normalWord: 'Strega', similarWord: 'Fata' },
  { category: 'Eroi', normalWord: 'Cavaliere', similarWord: 'Principe' },
];

// Funzione helper per mescolare l'array (Fisher-Yates shuffle)
// Utile se volessimo evitare ripetizioni nella stessa sessione,
// ma per ora prendiamo solo un elemento random.
const getRandomElement = <T>(arr: T[]): T => {
  return arr[Math.floor(Math.random() * arr.length)];
};

export const generateGameScenario = async (): Promise<GameData> => {
  // Simuliamo un piccolo ritardo per dare feedback visivo all'utente (caricamento)
  // Anche se i dati sono locali, l'UX è migliore se non è istantaneo a 0ms.
  return new Promise((resolve) => {
    setTimeout(() => {
      const scenario = getRandomElement(WORD_PAIRS);

      // Decidiamo casualmente chi prende la parola A e chi la B per variare ancora di più
      // Esempio: A volte i buoni hanno "Chitarra", a volte "Violino".
      const flip = Math.random() > 0.5;

      if (flip) {
        resolve({
          category: scenario.category,
          normalWord: scenario.similarWord,
          similarWord: scenario.normalWord,
        });
      } else {
        resolve(scenario);
      }
    }, 600); // 600ms di "fake loading"
  });
};
