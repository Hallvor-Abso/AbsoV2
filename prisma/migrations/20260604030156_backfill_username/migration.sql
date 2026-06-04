-- Pour les comptes créés avant l'ajout de la connexion par pseudo :
-- on initialise leur identifiant (username) à partir de leur pseudo (displayName),
-- uniquement si ce pseudo n'est pas déjà pris.
UPDATE "User" u
SET "username" = u."displayName"
WHERE u."username" IS NULL
  AND u."displayName" IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM "User" u2 WHERE u2."username" = u."displayName"
  );
