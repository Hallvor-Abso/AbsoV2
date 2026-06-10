-- Correction orthographique : « haut-niveau » → « haut niveau » dans les
-- contenus déjà présents en base (articles seedés, textes du site, événements).
UPDATE "News" SET
  "title"   = REPLACE("title",   'haut-niveau', 'haut niveau'),
  "excerpt" = REPLACE("excerpt", 'haut-niveau', 'haut niveau'),
  "content" = REPLACE("content", 'haut-niveau', 'haut niveau')
WHERE "title" LIKE '%haut-niveau%' OR "excerpt" LIKE '%haut-niveau%' OR "content" LIKE '%haut-niveau%';

UPDATE "SiteContent" SET "value" = REPLACE("value", 'haut-niveau', 'haut niveau')
WHERE "value" LIKE '%haut-niveau%';

UPDATE "Event" SET
  "title"       = REPLACE("title",       'haut-niveau', 'haut niveau'),
  "description" = REPLACE("description", 'haut-niveau', 'haut niveau')
WHERE "title" LIKE '%haut-niveau%' OR "description" LIKE '%haut-niveau%';
