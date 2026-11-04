import { MenuItem, LoyaltyReward, MenuCategory } from "../types";

export const DEFAULT_MENU_CATEGORIES: MenuCategory[] = [
  { id: "tradizionali", label: "Pizzas Tradicionais", icon: "🍕" },
  { id: "speciali", label: "Pizzas Especiais", icon: "✨" },
  { id: "dolci", label: "Sobremesas", icon: "🍰" },
  { id: "bevande", label: "Bebidas", icon: "🍷" }
];

export const MENU_ITEMS: MenuItem[] = [
  {
    "tags": [],
    "id": "item-1793658378706",
    "pointsToRedeem": 390,
    "name": "BOLOGNA",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isPopular": false,
    "pointsEarned": 65,
    "price": 65,
    "updatedAt": "2026-11-03T16:31:37.656Z",
    "category": "tradizionali",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723497,
      "nanoseconds": 503000000
    },
    "image": "/menu_images/item-1793658378706.jpg",
    "description": "Mozarrella Fior de latte do laticínio Fior D'italia, \nMolho pesto de manjericão, mortadela Bologna e \nstracciatella Fior D'italia do lacticínio Fior D'italia, \ngranulado de pistache."
  },
  {
    "pointsEarned": 65,
    "name": "EMILIA ROMANA",
    "price": 65,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "tags": [],
    "isPopular": false,
    "image": "/menu_images/item-1793658245021.jpg",
    "description": "Cremoso Queijo Brie, Intenso Queijo Gorgonzolla, \nPêras e Favo de Mel.",
    "id": "item-1793658245021",
    "updatedAt": "2026-11-03T16:31:37.656Z",
    "category": "tradizionali",
    "pointsToRedeem": 390,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723501,
      "nanoseconds": 751000000
    }
  },
  {
    "id": "item-1793732895049",
    "name": "NÁPOLES",
    "pointsEarned": 60,
    "isPopular": false,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793732958,
      "nanoseconds": 128000000
    },
    "tags": [],
    "description": "Mozarella Fior D'latte do lacticínio Fior D'italia, \nTomate pelati San Marzano e manjericão.",
    "price": 60,
    "category": "tradizionali",
    "pointsToRedeem": 360,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "updatedAt": "2026-11-03T19:08:15.240Z",
    "image": "/menu_images/item-1793732895049.jpg"
  },
  {
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793732430,
      "nanoseconds": 48000000
    },
    "image": "/menu_images/item-1793732389388.jpg",
    "description": "Tomate pelati San Marzano, confit de alho, ervas \nfrecas e manjericão.",
    "pointsEarned": 60,
    "category": "tradizionali",
    "pointsToRedeem": 360,
    "isPopular": false,
    "price": 60,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "id": "item-1793732389388",
    "name": "POLISINE",
    "updatedAt": "2026-11-03T18:59:49.808Z",
    "tags": []
  },
  {
    "description": "Berinjela assada na lenha, Mozzarella e ricota \nlaticínio Fior D'italia, queijo de cabra da Fazenda \nAtalaia, tomate pelati italiano, manjericão e \npimenta do reino.",
    "pointsEarned": 65,
    "id": "item-1793732328548",
    "updatedAt": "2026-11-03T18:58:48.906Z",
    "isPopular": false,
    "name": "PUGLIA",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793732329,
      "nanoseconds": 276000000
    },
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "image": "/menu_images/item-1793732328548.jpg",
    "price": 65,
    "tags": [],
    "category": "tradizionali",
    "pointsToRedeem": 390
  },
  {
    "description": "Tomate pelati San Marzano, Mozarella Fior D'latte \ndo lacticínio Fior D'italia, abobrinha Italiana, alho \nconfit, alecrim, parmesão, stracciatella Fior D'italia \ndo lacticínio Fior D'itali, raspas de limão de \nsiciliano.",
    "image": "/menu_images/item-1793732250442.jpg",
    "isPopular": false,
    "price": 65,
    "category": "tradizionali",
    "pointsToRedeem": 390,
    "pointsEarned": 65,
    "name": "ROSE IN ITALIA",
    "updatedAt": "2026-11-03T18:57:30.973Z",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793732251,
      "nanoseconds": 429000000
    },
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "id": "item-1793732250442",
    "tags": []
  },
  {
    "id": "item-1793658314659",
    "isPopular": false,
    "tags": [],
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723501,
      "nanoseconds": 876000000
    },
    "description": "Figos Doces, presunto cru italiano, gorgonzola, \nrúcula selvática, nozes.",
    "pointsToRedeem": 390,
    "price": 65,
    "image": "/menu_images/item-1793658314659.jpg",
    "category": "tradizionali",
    "name": "SICÍLIA",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "updatedAt": "2026-11-03T16:31:37.657Z",
    "pointsEarned": 65
  },
  {
    "image": "/menu_images/item-1793724294044.jpg",
    "pointsEarned": 65,
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "tags": [],
    "isPopular": false,
    "name": "VENICE",
    "pointsToRedeem": 390,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793724454,
      "nanoseconds": 167000000
    },
    "price": 65,
    "id": "item-1793724294044",
    "description": "Mozarella Fior D'latte do lacticínio Fior D'italia , \npresunto cru italiano, rúcula selvática, azeite e \nGrana Padano.",
    "category": "tradizionali",
    "updatedAt": "2026-11-03T16:47:34.302Z"
  },
  {
    "tags": [],
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "isPopular": false,
    "category": "speciali",
    "price": 55,
    "pointsEarned": 55,
    "pointsToRedeem": 330,
    "image": "/menu_images/item-1793658088769.jpg",
    "name": "APÚLIA PICCOLO",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723501,
      "nanoseconds": 990000000
    },
    "description": "Mozarrella Fior de latte do laticínio Fior D'italia, \nTomate pelati San Marzano.",
    "id": "item-1793658088769",
    "updatedAt": "2026-11-03T16:31:37.657Z"
  },
  {
    "isPopular": false,
    "id": "item-1793658008343",
    "description": "Mozzarella Fior de latte, Tomate pelati San \nMarzano, Iinguiça calabresa com leve toque de \nerva-doce.",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723502,
      "nanoseconds": 23000000
    },
    "image": "/menu_images/item-1793658008343.jpg",
    "name": "CALÁBRIA PICCOLO",
    "category": "speciali",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "pointsToRedeem": 330,
    "price": 55,
    "updatedAt": "2026-11-03T16:31:37.657Z",
    "tags": [],
    "pointsEarned": 55
  },
  {
    "updatedAt": "2026-11-03T16:31:37.658Z",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723502,
      "nanoseconds": 59000000
    },
    "name": "GIAVENO *VEGANA",
    "description": "Mix de cogumelos Portobello, Shitake e Paris, \ncebola caramelizada, queijo a base de castanha de \ncaju, cebolinha, alho confit e pimenta calabresa.",
    "tags": [],
    "id": "item-1793658171530",
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "price": 65,
    "category": "speciali",
    "pointsEarned": 65,
    "isPopular": false,
    "image": "/menu_images/item-1793658171530.jpg",
    "pointsToRedeem": 390
  },
  {
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723502,
      "nanoseconds": 107000000
    },
    "category": "dolci",
    "description": "Pannacotta a base de creme de leite fresco, \nbaunilha, cereja amarena silvestre italiana Fabbri.",
    "isPopular": false,
    "id": "item-1793657919649",
    "updatedAt": "2026-11-03T16:31:37.658Z",
    "name": "PANACOTA DE AMARENA (150GM)",
    "pointsToRedeem": 180,
    "image": "/menu_images/item-1793657919649.jpg",
    "pointsEarned": 30,
    "price": 30,
    "tags": [],
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ]
  },
  {
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "pointsToRedeem": 180,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723502,
      "nanoseconds": 350000000
    },
    "category": "dolci",
    "isPopular": false,
    "id": "item-1793657812936",
    "image": "/menu_images/item-1793657812936.jpg",
    "name": "PANACOTA DE FRUTAS VERMELHAS  (150G)",
    "description": "Pannacotta a base de creme de leite fresco, \nbaunilha, calda de frutas vermelhas da casa.",
    "updatedAt": "2026-11-03T16:31:37.658Z",
    "price": 30,
    "tags": [],
    "pointsEarned": 30
  },
  {
    "description": "Clássica sobremesa italiana, preparada com \ncamadas de biscoitos embebidos em café, creme \naveludado de Mascarpone saborizado com \nautêntico Marsala e finalizada com cacau em pó.",
    "name": "TIRAMISSÚ (150G)",
    "updatedAt": "2026-11-03T16:31:37.657Z",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723501,
      "nanoseconds": 929000000
    },
    "tags": [],
    "pointsToRedeem": 180,
    "price": 30,
    "pointsEarned": 30,
    "category": "dolci",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "id": "item-1793655784717",
    "isPopular": false,
    "image": "/menu_images/item-1793655784717.jpg"
  },
  {
    "pointsToRedeem": 36,
    "category": "bevande",
    "name": "Agua Mineral com Gás (garrafa 500ml)",
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723502,
      "nanoseconds": 370000000
    },
    "pointsEarned": 6,
    "tags": [],
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "id": "item-1793583118950",
    "image": "/menu_images/item-1793583118950.jpg",
    "price": 6,
    "isPopular": false,
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados."
  },
  {
    "category": "bevande",
    "name": "Agua Mineral sem Gás (garrafa 500ml)",
    "isPopular": false,
    "pointsEarned": 6,
    "image": "/menu_images/item-1793583306734.jpg",
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "price": 6,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723503,
      "nanoseconds": 133000000
    },
    "tags": [],
    "pointsToRedeem": 36,
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "id": "item-1793583306734"
  },
  {
    "pointsToRedeem": 60,
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "id": "item-1793583700113",
    "tags": [],
    "price": 10,
    "pointsEarned": 10,
    "image": "/menu_images/item-1793583700113.jpg",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "name": "Coca-cola (lata 350ml)",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723504,
      "nanoseconds": 771000000
    },
    "category": "bevande",
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isAvailable": true,
    "isPopular": false
  },
  {
    "image": "/menu_images/item-1793583646634.jpg",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "isPopular": false,
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723504,
      "nanoseconds": 805000000
    },
    "price": 10,
    "pointsEarned": 10,
    "tags": [],
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "pointsToRedeem": 60,
    "id": "item-1793583646634",
    "name": "Coca-cola zero (lata 350ml)",
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "category": "bevande"
  },
  {
    "pointsEarned": 10,
    "tags": [],
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "isPopular": false,
    "category": "bevande",
    "name": "Guaraná Antartica (lata 350ml)",
    "image": "/menu_images/item-1793583570843.jpg",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723504,
      "nanoseconds": 913000000
    },
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "pointsToRedeem": 60,
    "id": "item-1793583570843",
    "price": 10
  },
  {
    "tags": [],
    "pointsToRedeem": 60,
    "id": "item-1793583510728",
    "pointsEarned": 10,
    "name": "Guaraná Antartica zero (lata 350ml)",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "category": "bevande",
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "isPopular": false,
    "price": 10,
    "image": "/menu_images/item-1793583510728.jpg",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723504,
      "nanoseconds": 963000000
    },
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ]
  },
  {
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "image": "/menu_images/item-1793583439819.jpg",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "id": "item-1793583439819",
    "price": 10,
    "category": "bevande",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "name": "Sprite (lata 350ml)",
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723561,
      "nanoseconds": 240000000
    },
    "pointsEarned": 10,
    "tags": [],
    "isPopular": false,
    "pointsToRedeem": 60
  },
  {
    "name": "Sprite Zero (lata 350ml)",
    "updatedAt": "2026-11-03T16:31:37.659Z",
    "description": "Prato artesanal preparado com ingredientes frescos e selecionados.",
    "tags": [],
    "pointsToRedeem": 60,
    "price": 10,
    "pointsEarned": 10,
    "id": "item-1793583381617",
    "isPopular": false,
    "category": "bevande",
    "image": "/menu_images/item-1793583381617.jpg",
    "isAvailable": true,
    "ingredients": [
      "Ingredientes frescos da casa"
    ],
    "_serverTimestamp": {
      "type": "firestore/timestamp/1.0",
      "seconds": 1793723561,
      "nanoseconds": 290000000
    }
  }
];

export const CRUST_OPTIONS = [
  { id: 'tradizionale', name: 'Massa Tradizionale Napoletana (72h)', price: 0 },
  { id: 'integrale', name: 'Massa Integral com Grãos Antigos', price: 6 },
  { id: 'borda-recheada', name: 'Borda Vulcânica com Stracciatella', price: 14 }
];

export const EXTRA_TOPPINGS = [
  { id: 'bufala', name: 'Mozzarella di Bufala D.O.P. extra', price: 12 },
  { id: 'tartufo', name: 'Azeite Trufado Italiano', price: 10 },
  { id: 'basilico', name: 'Manjericão Fresco da Horta', price: 0 },
  { id: 'pomodoro', name: 'Pomodoro San Marzano Extra', price: 8 }
];

export const LOYALTY_REWARDS: LoyaltyReward[] = [
  {
    id: 'rew-bruschetta',
    title: 'Bruschetta Tradizionale',
    description: 'Pão sourdough da casa com tomates confitados e manjericão fresco.',
    pointsRequired: 180,
    category: 'Entrada',
    iconName: 'utensils'
  },
  {
    id: 'rew-tiramisu',
    title: 'Tiramisù della Nonna',
    description: 'Receita artesanal centenária com mascarpone e café expresso.',
    pointsRequired: 260,
    category: 'Sobremesa',
    iconName: 'cake'
  },
  {
    id: 'rew-margherita',
    title: 'Pizza Margherita D.O.P.',
    description: 'A clássica rainha de Nápoles com Pomodoro San Marzano e Mozzarella di Bufala.',
    pointsRequired: 400,
    category: 'Pizza Clássica',
    iconName: 'pizza'
  },
  {
    id: 'rew-chianti',
    title: 'Garrafa Vinho Chianti',
    description: 'Vinho tinto italiano selecionado da Toscana para acompanhar seu momento.',
    pointsRequired: 550,
    category: 'Bebidas & Vinhos',
    iconName: 'wine'
  }
];

