import { useEffect } from 'react';

export interface RouteConfig {
  id: string;
  path: string;
  title: string;
  aliases?: string[];
}

export const APP_ROUTES: RouteConfig[] = [
  {
    id: 'hero',
    path: '/',
    title: 'Deolinda Pizzaria Napoletana | Fermentação Lenta & Tradição',
    aliases: ['/home', '/inicio', '/deolinda']
  },
  {
    id: 'fermentacao',
    path: '/processo',
    title: 'Processo & Massa 72h | Deolinda Pizzaria Napoletana',
    aliases: ['/fermentacao', '/massa', '/processo-massa']
  },
  {
    id: 'cardapio',
    path: '/cardapio',
    title: 'Cardápio Tradicional & Especialidades | Deolinda Pizzaria Napoletana',
    aliases: ['/menu', '/pizzas', '/cardapio-napoletano']
  },
  {
    id: 'historia',
    path: '/historia',
    title: 'Nossa Tradição & História | Deolinda Pizzaria Napoletana',
    aliases: ['/tradicao', '/sobre', '/nossa-historia']
  },
  {
    id: 'galeria',
    path: '/galeria',
    title: 'Fotos & Momentos (#DeolindaNapoletana) | Deolinda Pizzaria Napoletana',
    aliases: ['/fotos', '/momentos', '/instagram', '/feed']
  },
  {
    id: 'localizacao',
    path: '/localizacao',
    title: 'Localização & Horários de Atendimento | Deolinda Pizzaria Napoletana',
    aliases: ['/contato', '/onde-estamos', '/horarios', '/endereco', '/onde-nos-encontrar']
  },
  {
    id: 'admin',
    path: '/admin',
    title: 'Área do Administrador & Gestão | Deolinda Pizzaria Napoletana',
    aliases: ['/gestao', '/painel', '/dashboard']
  }
];

export function getRouteByPath(pathname: string): RouteConfig | undefined {
  const clean = pathname.toLowerCase().replace(/\/$/, '') || '/';
  return APP_ROUTES.find(r => r.path === clean || r.aliases?.includes(clean));
}

export function getRouteById(id: string): RouteConfig | undefined {
  return APP_ROUTES.find(r => r.id === id);
}

/**
 * Smoothly scrolls to section and updates URL and document title
 */
export function navigateToSection(id: string, pathOverride?: string, pushHistory = true) {
  const route = getRouteById(id);
  const targetPath = pathOverride || (route ? route.path : `/${id}`);
  const targetTitle = route ? route.title : 'Deolinda Pizzaria Napoletana';

  if (typeof window !== 'undefined') {
    if (pushHistory && window.location.pathname !== targetPath) {
      window.history.pushState({ section: id }, '', targetPath);
    }
    document.title = targetTitle;

    if (id === 'hero' || id === 'inicio') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const el = document.getElementById(id);
    if (el) {
      const offset = 80;
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  }
}
