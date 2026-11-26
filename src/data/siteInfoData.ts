import { SiteInfo, WeeklyHourEntry } from '../types';

export const DEFAULT_WEEKLY_HOURS: WeeklyHourEntry[] = [
  { id: 'mon', day: 'Segunda-feira', hours: 'Fechado para descanso da equipe e maturação dos fermentos' },
  { id: 'tue', day: 'Terça-feira', hours: '18h00 às 23h00' },
  { id: 'wed', day: 'Quarta-feira', hours: '18h00 às 23h00' },
  { id: 'thu', day: 'Quinta-feira', hours: '18h00 às 23h00' },
  { id: 'fri', day: 'Sexta-feira', hours: '18h00 às 00h00' },
  { id: 'sat', day: 'Sábado', hours: '18h00 às 00h00' },
  { id: 'sun', day: 'Domingo', hours: '18h00 às 23h00' }
];

export const DEFAULT_SITE_INFO: SiteInfo = {
  // Identidade & Contatos
  restaurantName: 'Deolinda Pizzaria Napoletana',
  slogan: 'Pizzaria Napoletana • Tradição Centenária',
  phone: '(11) 91533-1853',
  whatsappNumber: '5511915331853',
  whatsappMessage: 'Olá Deolinda Pizzaria! Gostaria de informações.',
  instagramHandle: '@deolindapizzaria',
  instagramUrl: 'https://www.instagram.com/deolindapizzaria/',
  facebookUrl: 'https://www.facebook.com/p/Deolinda-Pizzeria-61593126269315/',
  email: 'contato@deolindapizzaria.com.br',
  address: 'Rua Santa Cruz, 232',
  addressNeighborhood: 'Centro',
  addressCityState: 'Itu - SP',
  mapsUrl: 'https://maps.app.goo.gl/WXxuE14BxN9RBDmh8?g_st=ac',
  openingHoursSummary: 'Terça a Domingo das 18h às 23h30',

  // Hero (Cabeçalho)
  heroBadge: 'Tradição Napoletana Desde 1924',
  heroSubBadge: 'Pizzaria Napoletana',
  heroSubtitle: 'Fermentação natural lenta de 72 horas e o fogo intenso da pedra vulcânica a 430 °C.\n\nPorque aqui não fazemos apenas pizza. Criamos experiências com o verdadeiro sabor da Itália. ❤️',
  heroCtaMenuText: 'Explorar Cardápio',
  heroCtaWhatsappText: 'WhatsApp (11) 91533-1853',
  heroFermentationHighlight: '72 Horas Lenta',
  heroFermentationSubtext: 'Leve e digestiva',
  heroOvenHighlight: '430°C em 90s',
  heroOvenSubtext: 'Pedra vulcânica',
  heroFlourHighlight: 'Caputo Tipo 00',
  heroFlourSubtext: 'Importada de Nápoles',
  heroTomatoHighlight: 'San Marzano',
  heroTomatoSubtext: 'Cultivado no Vesúvio',

  // Fermentação
  fermentationBadge: 'Processo & Tradição Napolitana',
  fermentationTitle: 'O Segredo das 72 Horas de Fermentação Lenta',
  fermentationSubtitle: 'Nossa massa não é apenas feita; ela é maturada pacientemente. Esse repouso prolongado a frio quebra os amidos complexos e as proteínas do glúten, resultando em uma borda aerada (cornicione), massa levíssima e digestão impecável.',
  fermentationStep1Title: '1. Farinha Italiana Tipo 00 Caputo & Água Mineral',
  fermentationStep1Time: 'Hora 0',
  fermentationStep1Desc: 'Utilizamos exclusivamente farinha de trigo de moagem lenta, livre de aditivos químicos, com alto teor proteico para suportar a longa maturação.',
  fermentationStep2Title: '',
  fermentationStep2Desc: '',
  fermentationStep2Time: '',
  fermentationStep3Title: '2. Maturação Lenta a Frio (72 Horas)',
  fermentationStep3Time: 'Hora 24 a 72',
  fermentationStep3Desc: 'O segredo da leveza! Em temperatura controlada a 4°C, as enzimas transformam os açúcares complexos e quebram a rede de glúten.',
  fermentationStep4Title: '3. Cocção a 430°C em 90 Segundos',
  fermentationStep4Time: 'Momento Mágico',
  fermentationStep4Desc: 'O choque térmico do forno a lenha napolitano sela a massa instantaneamente, criando os alvéolos gigantes no cornicione e preservando a suculência do molho.',

  // História & Nonna
  storyBadge: 'Nossa História • Desde 1924',
  storyTitle: 'Uma Tradição que Atravessou o Mediterrâneo',
  storySubtitle: 'O legado napolitano cultivado através de quatro gerações.',
  storyParagraph1: 'A história da nossa pizzaria começou nos becos ensolarados de Nápoles, nos pés do Vesúvio. Foi lá que Nonna Deolinda aprendeu os segredos da verdadeira pizza napoletana: paciência, respeito aos ingredientes simples e muito fogo na pedra vulcânica.',
  storyParagraph2: 'Quando a família decidiu atravessar o Atlântico rumo ao Brasil, o bem mais precioso na bagagem era um pote de vidro protegido com o fermento natural da bisavó. Esse mesmo fermento biológico vivo é alimentado todos os dias em nossa cozinha há mais de um século, dando vida à massa de 72 horas que você saboreia hoje.',
  storyQuote: 'A pizza napoletana não é só comida, è un atto d\'amore. O tempo não é pressa, é o ingrediente secreto que transforma farinha, água e alma em arte.',
  storyQuoteAuthor: 'Nonna Deolinda — Matriarca & Pizzaiola (1902-1988)',
  storyImageUrl: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=800&q=80',

  // Horários & Localização
  locationBadge: 'Onde Nos Encontrar',
  locationTitle: 'Visite a Deolinda Pizzaria Napoletana',
  locationSubtitle: 'Um refúgio italiano aconchegante com aroma de lenha queimando, vinhos selecionados e a verdadeira hospitalidade de Nápoles.',
  hoursTueThu: '18h00 às 23h00',
  hoursFriSat: '18h00 às 00h00',
  hoursSun: '18h00 às 23h00',
  hoursMon: 'Fechado para descanso da equipe e maturação dos fermentos',
  weeklyHours: DEFAULT_WEEKLY_HOURS,
  valetInfo: 'Serviço de Valet cortesia na porta e convênio com estacionamento ao lado.',
  environmentInfo: 'Salão principal com ar condicionado e Jardim do Forno a Lenha ao ar livre pet-friendly.',

  // Rodapé
  footerCopyright: 'Deolinda Pizzaria Napoletana. Fatta con amore, lievito madre e farina pura.',
  footerAssociationText: ''
};

export function getWeeklyHoursFromSiteInfo(siteInfo?: Partial<SiteInfo> | null): WeeklyHourEntry[] {
  if (siteInfo && Array.isArray(siteInfo.weeklyHours) && siteInfo.weeklyHours.length > 0) {
    return siteInfo.weeklyHours.map((entry, idx) => ({
      id: entry?.id || `day-${idx}`,
      day: typeof entry?.day === 'string' ? entry.day : (DEFAULT_WEEKLY_HOURS[idx]?.day || ''),
      hours: typeof entry?.hours === 'string' ? entry.hours : (DEFAULT_WEEKLY_HOURS[idx]?.hours || '')
    }));
  }

  const mon = siteInfo?.hoursMon || DEFAULT_SITE_INFO.hoursMon;
  const tueThu = siteInfo?.hoursTueThu || DEFAULT_SITE_INFO.hoursTueThu;
  const friSat = siteInfo?.hoursFriSat || DEFAULT_SITE_INFO.hoursFriSat;
  const sun = siteInfo?.hoursSun || DEFAULT_SITE_INFO.hoursSun;

  return [
    { id: 'mon', day: 'Segunda-feira', hours: mon },
    { id: 'tue', day: 'Terça-feira', hours: tueThu },
    { id: 'wed', day: 'Quarta-feira', hours: tueThu },
    { id: 'thu', day: 'Quinta-feira', hours: tueThu },
    { id: 'fri', day: 'Sexta-feira', hours: friSat },
    { id: 'sat', day: 'Sábado', hours: friSat },
    { id: 'sun', day: 'Domingo', hours: sun }
  ];
}
