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
    aliases: ['/home', '/inicio', '/início', '/deolinda', '/processo', '/fermentacao', '/fermentação', '/massa']
  },
  {
    id: 'cardapio',
    path: '/cardapio',
    title: 'Cardápio Tradicional & Especialidades | Deolinda Pizzaria Napoletana',
    aliases: ['/cardápio', '/menu', '/pizzas', '/cardapio-napoletano', '/cardápio-napoletano']
  },
  {
    id: 'historia',
    path: '/historia',
    title: 'Nossa Tradição & História | Deolinda Pizzaria Napoletana',
    aliases: ['/história', '/tradicao', '/tradição', '/sobre', '/nossa-historia', '/nossa-história']
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
    aliases: ['/localização', '/contato', '/onde-estamos', '/horarios', '/horários', '/endereco', '/endereço', '/onde-nos-encontrar']
  },
  {
    id: 'admin',
    path: '/admin',
    title: 'Área do Administrador & Gestão | Deolinda Pizzaria Napoletana',
    aliases: ['/gestao', '/gestão', '/painel', '/dashboard']
  }
];

function stripAccents(str: string): string {
  try {
    return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  } catch {
    return str;
  }
}

export function getRouteByPath(pathname: string): RouteConfig | undefined {
  if (!pathname) return APP_ROUTES[0];
  let raw = pathname;
  try {
    raw = decodeURIComponent(pathname);
  } catch {
    // ignore decode error
  }

  // Handle hash-based deep links like #cardapio, #/cardapio, #cardápio
  if (raw.startsWith('#/')) raw = raw.replace('#/', '/');
  else if (raw.startsWith('#')) raw = raw.replace('#', '/');

  // Strip query string, trailing slash and hashes
  const withoutParams = raw.split('?')[0].split('#')[0];
  let clean = withoutParams.toLowerCase().trim().replace(/\/+$/, '');
  if (!clean.startsWith('/')) clean = '/' + clean;
  if (!clean || clean === '') clean = '/';

  const cleanUnaccented = stripAccents(clean);

  return APP_ROUTES.find(r => {
    const routePath = r.path.toLowerCase();
    const routePathUnaccented = stripAccents(routePath);
    if (routePath === clean || routePathUnaccented === cleanUnaccented) return true;

    if (r.aliases && r.aliases.length > 0) {
      return r.aliases.some(alias => {
        const al = alias.toLowerCase();
        return al === clean || stripAccents(al) === cleanUnaccented;
      });
    }
    return false;
  });
}

export function getRouteById(id: string): RouteConfig | undefined {
  return APP_ROUTES.find(r => r.id === id);
}

/**
 * Navigates to a specific page route, updating history, title and scrolling to top
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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
