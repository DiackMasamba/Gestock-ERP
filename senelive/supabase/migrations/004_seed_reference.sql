-- SeneLive — référentiels : 14 régions du Sénégal, villes principales, catégories.

insert into public.regions (name, slug) values
  ('Dakar', 'dakar'),
  ('Thiès', 'thies'),
  ('Diourbel', 'diourbel'),
  ('Saint-Louis', 'saint-louis'),
  ('Louga', 'louga'),
  ('Fatick', 'fatick'),
  ('Kaolack', 'kaolack'),
  ('Kaffrine', 'kaffrine'),
  ('Tambacounda', 'tambacounda'),
  ('Kédougou', 'kedougou'),
  ('Kolda', 'kolda'),
  ('Sédhiou', 'sedhiou'),
  ('Ziguinchor', 'ziguinchor'),
  ('Matam', 'matam')
on conflict (slug) do nothing;

insert into public.cities (region_id, name, slug)
select r.id, c.name, c.slug
from (values
  ('dakar', 'Dakar', 'dakar'),
  ('dakar', 'Pikine', 'pikine'),
  ('dakar', 'Guédiawaye', 'guediawaye'),
  ('dakar', 'Rufisque', 'rufisque'),
  ('dakar', 'Keur Massar', 'keur-massar'),
  ('dakar', 'Bargny', 'bargny'),
  ('dakar', 'Diamniadio', 'diamniadio'),
  ('dakar', 'Sébikotane', 'sebikotane'),
  ('thies', 'Thiès', 'thies-ville'),
  ('thies', 'Mbour', 'mbour'),
  ('thies', 'Saly', 'saly'),
  ('thies', 'Tivaouane', 'tivaouane'),
  ('thies', 'Mékhé', 'mekhe'),
  ('diourbel', 'Diourbel', 'diourbel-ville'),
  ('diourbel', 'Touba', 'touba'),
  ('diourbel', 'Mbacké', 'mbacke'),
  ('diourbel', 'Bambey', 'bambey'),
  ('saint-louis', 'Saint-Louis', 'saint-louis-ville'),
  ('saint-louis', 'Richard-Toll', 'richard-toll'),
  ('saint-louis', 'Dagana', 'dagana'),
  ('saint-louis', 'Podor', 'podor'),
  ('louga', 'Louga', 'louga-ville'),
  ('louga', 'Kébémer', 'kebemer'),
  ('louga', 'Linguère', 'linguere'),
  ('fatick', 'Fatick', 'fatick-ville'),
  ('fatick', 'Foundiougne', 'foundiougne'),
  ('fatick', 'Gossas', 'gossas'),
  ('kaolack', 'Kaolack', 'kaolack-ville'),
  ('kaolack', 'Nioro du Rip', 'nioro-du-rip'),
  ('kaolack', 'Guinguinéo', 'guinguineo'),
  ('kaffrine', 'Kaffrine', 'kaffrine-ville'),
  ('kaffrine', 'Koungheul', 'koungheul'),
  ('tambacounda', 'Tambacounda', 'tambacounda-ville'),
  ('tambacounda', 'Bakel', 'bakel'),
  ('kedougou', 'Kédougou', 'kedougou-ville'),
  ('kolda', 'Kolda', 'kolda-ville'),
  ('kolda', 'Vélingara', 'velingara'),
  ('sedhiou', 'Sédhiou', 'sedhiou-ville'),
  ('ziguinchor', 'Ziguinchor', 'ziguinchor-ville'),
  ('ziguinchor', 'Bignona', 'bignona'),
  ('ziguinchor', 'Oussouye', 'oussouye'),
  ('matam', 'Matam', 'matam-ville'),
  ('matam', 'Ourossogui', 'ourossogui'),
  ('matam', 'Kanel', 'kanel')
) as c (region_slug, name, slug)
join public.regions r on r.slug = c.region_slug
on conflict (slug) do nothing;

insert into public.categories (name, slug, position) values
  ('Mode & Vêtements', 'mode-vetements', 1),
  ('Chaussures', 'chaussures', 2),
  ('Beauté & Cosmétiques', 'beaute-cosmetiques', 3),
  ('Téléphones & Accessoires', 'telephones-accessoires', 4),
  ('Électronique', 'electronique', 5),
  ('Maison & Déco', 'maison-deco', 6),
  ('Bijoux & Montres', 'bijoux-montres', 7),
  ('Enfants & Bébé', 'enfants-bebe', 8),
  ('Sport & Loisirs', 'sport-loisirs', 9),
  ('Alimentation', 'alimentation', 10),
  ('Livres & Papeterie', 'livres-papeterie', 11),
  ('Autres', 'autres', 99)
on conflict (slug) do nothing;
