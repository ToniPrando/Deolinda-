import { SocialPost } from '../types';

export const SOCIAL_POSTS: SocialPost[] = [
  {
    id: 'post-1',
    imageUrl: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?auto=format&fit=crop&w=800&q=80',
    caption: 'Saindo agora do forno a lenha a 450°C! Nossa Deolinda Suprema com stracciatella e perfume de trufas negras. 🍕🔥 #DeolindaNapoletana #VeraPizza #FornoALegna',
    author: '@deolindapizzaria',
    likes: 384,
    timestamp: 'Há 18 minutos',
    isHotOutOfOven: true,
    tags: ['#FornoALegna', '#Cornicione', '#450Graus']
  },
  {
    id: 'post-2',
    imageUrl: 'https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=800&q=80',
    caption: 'Mortadella Bologna I.G.P. & Pistacchio di Bronte com Burrata generosa. O contraste de texturas e temperatura que encanta Nápoles! 🇮🇹💚 #Pistacchio #BurrataLover',
    author: '@deolindapizzaria',
    likes: 512,
    timestamp: 'Há 1 hora',
    isHotOutOfOven: true,
    tags: ['#MortadellaIGP', '#PistacchioDiBronte']
  },
  {
    id: 'post-3',
    imageUrl: 'https://images.unsplash.com/photo-1604382355076-af4b0eb60143?auto=format&fit=crop&w=800&q=80',
    caption: 'A simplicidade da perfeição: Margherita Verace com San Marzano D.O.P. e Mozzarella di Bufala fresca. 72h de fermentação natural. #LievitoMadre #Napoletana',
    author: '@marcellogourmet',
    likes: 290,
    timestamp: 'Há 3 horas',
    isHotOutOfOven: false,
    tags: ['#MargheritaDOP', '#SanMarzano']
  },
  {
    id: 'post-4',
    imageUrl: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb22521?auto=format&fit=crop&w=800&q=80',
    caption: 'Aquele momento em que a Burrata ao Forno chega à mesa ainda borbulhando com nossa focaccia crocante... Incomparável! 🧀✨ #Antipasti',
    author: '@giulia_foodie',
    likes: 428,
    timestamp: 'Há 5 horas',
    isHotOutOfOven: true,
    tags: ['#BurrataAlForno', '#Focaccia']
  },
  {
    id: 'post-5',
    imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
    caption: 'O autêntico Tiramisù da Nonna Deolinda com mascarpone aveludado e café espresso tirado na hora. Impossível resistir! ☕🍰 #DolciItaliani',
    author: '@deolindapizzaria',
    likes: 671,
    timestamp: 'Há 1 dia',
    isHotOutOfOven: false,
    tags: ['#Tiramisu', '#NonnaDeolinda']
  },
  {
    id: 'post-6',
    imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=800&q=80',
    caption: 'Noite mágica no nosso Jardim do Forno a Lenha! Vinho Chianti, luz de velas e o calor das chamas da tradição napolitana. 🍷🍕 #ExperienciaDeolinda',
    author: '@casal_gastronomico',
    likes: 835,
    timestamp: 'Há 1 dia',
    isHotOutOfOven: false,
    tags: ['#JardimDoForno', '#VinhoItaliano']
  }
];
