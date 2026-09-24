import { env } from '../config/env';

export function absoluteUrl(path: string | null | undefined) {
  if (!path) return null;
  return path.startsWith('/') ? `${env.PUBLIC_BASE_URL}${path}` : path;
}

export function referralLink(code: string) {
  return `${env.PUBLIC_BASE_URL}/r/${code}`;
}

export function competitionLink(slug: string) {
  return `${env.PUBLIC_BASE_URL}/c/${slug}`;
}
