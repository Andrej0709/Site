// Link names: /r/<slug>/. Lowercase letters, digits and dashes, 1–60 chars,
// no dash at either end. Old random ids (10 letters/digits) still match.
export const SLUG = /^[a-z0-9](?:[a-z0-9-]{0,58}[a-z0-9])?$/;
