/**
 * Kenya's 47 counties — slug + display name (aligned with backend api/kenya_counties.py).
 */
export type KenyaCountyOption = { slug: string; name: string };

export const KENYA_COUNTIES: readonly KenyaCountyOption[] = [
  { slug: 'mombasa', name: 'Mombasa' },
  { slug: 'kwale', name: 'Kwale' },
  { slug: 'kilifi', name: 'Kilifi' },
  { slug: 'tana-river', name: 'Tana River' },
  { slug: 'lamu', name: 'Lamu' },
  { slug: 'taita-taveta', name: 'Taita-Taveta' },
  { slug: 'garissa', name: 'Garissa' },
  { slug: 'wajir', name: 'Wajir' },
  { slug: 'mandera', name: 'Mandera' },
  { slug: 'marsabit', name: 'Marsabit' },
  { slug: 'isiolo', name: 'Isiolo' },
  { slug: 'meru', name: 'Meru' },
  { slug: 'tharaka-nithi', name: 'Tharaka-Nithi' },
  { slug: 'embu', name: 'Embu' },
  { slug: 'kitui', name: 'Kitui' },
  { slug: 'machakos', name: 'Machakos' },
  { slug: 'makueni', name: 'Makueni' },
  { slug: 'nyandarua', name: 'Nyandarua' },
  { slug: 'nyeri', name: 'Nyeri' },
  { slug: 'kirinyaga', name: 'Kirinyaga' },
  { slug: 'muranga', name: "Murang'a" },
  { slug: 'kiambu', name: 'Kiambu' },
  { slug: 'turkana', name: 'Turkana' },
  { slug: 'west-pokot', name: 'West Pokot' },
  { slug: 'samburu', name: 'Samburu' },
  { slug: 'trans-nzoia', name: 'Trans Nzoia' },
  { slug: 'uasin-gishu', name: 'Uasin Gishu' },
  { slug: 'elgeyo-marakwet', name: 'Elgeyo-Marakwet' },
  { slug: 'nandi', name: 'Nandi' },
  { slug: 'baringo', name: 'Baringo' },
  { slug: 'laikipia', name: 'Laikipia' },
  { slug: 'nakuru', name: 'Nakuru' },
  { slug: 'narok', name: 'Narok' },
  { slug: 'kajiado', name: 'Kajiado' },
  { slug: 'kericho', name: 'Kericho' },
  { slug: 'bomet', name: 'Bomet' },
  { slug: 'kakamega', name: 'Kakamega' },
  { slug: 'vihiga', name: 'Vihiga' },
  { slug: 'bungoma', name: 'Bungoma' },
  { slug: 'busia', name: 'Busia' },
  { slug: 'siaya', name: 'Siaya' },
  { slug: 'kisumu', name: 'Kisumu' },
  { slug: 'homa-bay', name: 'Homa Bay' },
  { slug: 'migori', name: 'Migori' },
  { slug: 'kisii', name: 'Kisii' },
  { slug: 'nyamira', name: 'Nyamira' },
  { slug: 'nairobi', name: 'Nairobi City' },
] as const;

export function getKenyaCountyName(slug: string): string {
  const f = KENYA_COUNTIES.find((c) => c.slug === slug);
  return f?.name ?? '';
}
