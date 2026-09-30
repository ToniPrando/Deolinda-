export interface StoryMilestone {
  year: string;
  title: string;
  location: string;
  description: string;
  image: string;
}

export const STORY_MILESTONES: StoryMilestone[] = [
  {
    year: '1952',
    title: 'O Primeiro Forno nos Bairros de Nápoles',
    location: 'Spaccanapoli, Nápoles, Itália',
    description: 'Nonna Deolinda cresceu aos pés do Vesúvio aprendendo com seus pais a arte da panificação e o cultivo diário do Lievito Madre. O segredo sempre foi o respeito absoluto ao tempo de maturação da massa.',
    image: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '1978',
    title: 'A Travessia do Oceano & O Fermento Centenário',
    location: 'Chegada ao Brasil',
    description: 'Ao emigrar para o Brasil, a família trouxe consigo uma pequena porção protegida do fermento natural original de 1952, mantido vivo com carinho, água mineral e farinhas puras até os dias de hoje.',
    image: 'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&w=800&q=80'
  },
  {
    year: '2016',
    title: 'O Forno em Pedra Vulcânica & Tradição AVPN',
    location: 'Fundação da Deolinda',
    description: 'Construímos nosso forno napolitano tijolo a tijolo com pedras vulcânicas importadas do Vesúvio para manter a cúpula a 450°C constantes, assando cada pizza em exatos 60 a 90 segundos com o autêntico aspecto leopardado.',
    image: 'https://images.unsplash.com/photo-1541745537411-b8046dc6d66c?auto=format&fit=crop&w=800&q=80'
  },
  {
    year: 'Hoje',
    title: 'A Terceira Geração de Mestres Pizzaiolos',
    location: 'Deolinda Pizzaria Napoletana',
    description: 'Hoje, netos e mestres pizzaiolos continuam o ritual sagrado: massa aberta apenas com as mãos (sem rolo), tomates San Marzano D.O.P. esmagados manualmente e a certeza de que a melhor pizza é a que une as famílias.',
    image: 'https://images.unsplash.com/photo-1579684947550-22e945225d9a?auto=format&fit=crop&w=800&q=80'
  }
];

export const ARTISAN_PILLARS = [
  {
    title: 'Fermentação Lenta de 48 Horas',
    subtitle: 'Digestibilidade Incomparável',
    description: 'Nosso processo de bi-fermentação decompõe os açúcares e glúten complexos, garantindo uma massa extremamente leve, que não pesa no estômago e realça aromas florais e frutados.',
    icon: 'Clock'
  },
  {
    title: 'Farinha Italiana Caputo 00',
    subtitle: 'Grãos 100% Selecionados',
    description: 'Moída finamente nos moinhos tradicionais de Nápoles com alto teor de proteína para proporcionar elasticidade única e um cornicione perfeitamente alveolado.',
    icon: 'Wheat'
  },
  {
    title: 'Forno a Lenha a 450°C',
    subtitle: 'Pedra Vulcânica do Vesúvio',
    description: 'O choque térmico fulminante em 90 segundos sela a umidade interna mantendo o centro macio e a borda crocante com as famosas manchas de leopardo.',
    icon: 'Flame'
  },
  {
    title: 'Ingredientes Certificados D.O.P.',
    subtitle: 'Denominação de Origem Protegida',
    description: 'Mozzarella de búfala fresca da Campânia e tomates San Marzano colhidos aos pés do Vesúvio em solo vulcânico rico em minerais.',
    icon: 'Award'
  }
];
