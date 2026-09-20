# wg-easy-business — plan de développement

Fork de `wg-easy/wg-easy`. Deux fonctionnalités :

1. Des dossiers (et sous-dossiers) désactivables en 1 clic.
2. Un VPN par appareil pour un même utilisateur, chacun gérable individuellement, rangeable dans les dossiers.

---

## État des lieux

| Constat | Fichier |
|---|---|
| `client` a déjà un `userId` et une relation `user.clients: many(client)` | `repositories/client/schema.ts` |
| À la création, `userId: 1` est mis en dur (TODO amont) | `repositories/client/service.ts:193` |
| Idem dans `createFromExisting` | `repositories/client/service.ts:266` |
| `client.enabled` est lu directement pour générer la conf et les règles firewall | `utils/WireGuard.ts:63,272`, `utils/firewall.ts:278` |
| Pas de page admin « utilisateurs » | `src/app/pages/admin/` |
| Permissions déclaratives par ressource/action | `src/shared/utils/permissions.ts` |

Un « appareil » = un `client` existant, déjà individuellement gérable (conf, QR, on/off, suppression).
Il manque donc : l'attribut dossier, et le rattachement réel du client à son utilisateur.

---

## Décisions d'architecture

### Le dossier est un attribut, pas une entité

Une colonne `folder` (texte, nullable) sur `clients_table`, contenant un chemin :
`Client A/Site Paris/Postes`. L'arbre est **déduit** des chemins distincts en base.

Conséquences, toutes voulues :
- un dossier vide n'existe pas — il disparaît dès que son dernier appareil le quitte ;
- pas de table, pas de FK, pas de suppression en cascade, pas de cycle possible ;
- renommer ou déplacer un dossier = un `UPDATE` de préfixe sur les chemins concernés ;
- `WireGuard.ts` et `firewall.ts` ne sont pas touchés du tout.

### Désactivation de masse, pas d'état de dossier

Le dossier n'ayant pas de ligne en base, il n'a pas d'état `enabled` à lui.
L'interrupteur d'un dossier est une **action de masse** : il écrit `enabled` sur
tous les appareils de la branche (le dossier et ses sous-dossiers).

L'interrupteur affiche trois états : tout allumé, tout éteint, ou mixte.
Un clic sur « mixte » ou « tout allumé » éteint toute la branche ; un clic sur
« tout éteint » la rallume entièrement.

À noter : rallumer une branche rallume aussi les appareils qui étaient éteints
individuellement avant la coupure — c'est la contrepartie assumée de ne pas
stocker d'état de dossier.

### Droits et profondeur

- Création / renommage / déplacement / désactivation de masse : **admin uniquement**.
  Un utilisateur non-admin voit le dossier de ses appareils en lecture seule.
- Profondeur d'imbrication **illimitée**, avec un avertissement dans l'UI au-delà de 5 niveaux.

---

## Todo

### Phase 1 — Base de données
- [ ] 1.1 Colonne `clients_table.folder` (texte, nullable, `null` = racine)
- [ ] 1.2 Migration `0009_*.sql` + snapshot meta via `drizzle-kit generate`
- [ ] 1.3 Vérifier que la migration passe sur une base existante non vide

### Phase 2 — Backend dossiers
- [ ] 2.1 `FolderPathSchema` (zod) : segments non vides, pas de `/` en tête ni en queue, pas de `//`, longueur bornée, passe par `safeStringRefine` + `controlStringRefine`
- [ ] 2.2 `FolderService` (ou méthodes sur `ClientService`) : `getTree` (chemins distincts → arbre + compteurs + état agrégé), `rename`, `move`, `setEnabled`
- [ ] 2.3 Ressource `folders` dans `permissions.ts` : admin = tout, client = `view` sur ses propres appareils
- [ ] 2.4 `GET /api/folder` — l'arbre avec, par nœud : nombre d'appareils, nombre d'allumés, profondeur
- [ ] 2.5 `POST /api/folder/toggle` — `{ path, enabled }`, bulk `UPDATE` sur `folder = path OR folder LIKE path || '/%'`, puis `WireGuard.saveConfig()`
- [ ] 2.6 `POST /api/folder/rename` — `{ from, to }`, `UPDATE` de préfixe, refus si `to` est un descendant de `from`
- [ ] 2.7 `POST /api/client/[clientId]/folder` — ranger un appareil (`null` = racine)
- [ ] 2.8 Exposer `folder` dans `getAllPublic` / `getAllForUser` + filtre `folder` sur `ClientQuerySchema`

### Phase 3 — Backend multi-appareils
- [ ] 3.1 Supprimer le `userId: 1` en dur : `ClientCreateSchema` accepte un `userId` optionnel
- [ ] 3.2 Admin → peut créer pour n'importe quel utilisateur ; non-admin → forcé sur son propre `user.id`
- [ ] 3.3 Idem dans `createFromExisting` (import de conf)
- [ ] 3.4 `GET /api/admin/users` — liste pour le sélecteur de propriétaire
- [ ] 3.5 Filtre `userId` sur `ClientQuerySchema`
- [ ] 3.6 Vérifier l'isolation : un non-admin ne doit ni voir ni modifier les appareils d'un autre

### Phase 4 — Frontend
- [ ] 4.1 Store `folders` (pinia) + fetch de l'arbre
- [ ] 4.2 `Folders/Tree.vue` — arbre repliable, compteur d'appareils, avertissement au-delà de 5 niveaux
- [ ] 4.3 Interrupteur de dossier à trois états (tout / rien / mixte) + confirmation au-delà de N appareils
- [ ] 4.4 Dialogues : créer (= ranger un premier appareil), renommer, déplacer
- [ ] 4.5 `Clients/List.vue` regroupé par dossier, racine = « Non classés »
- [ ] 4.6 Sélecteur de dossier dans `ClientCard/Edit.vue` (saisie libre avec autocomplétion des chemins existants)
- [ ] 4.7 Propriétaire affiché sur la carte + sélecteur d'utilisateur dans `Clients/CreateDialog.vue`
- [ ] 4.8 Traductions `src/i18n/locales/` (en + fr au minimum)

### Phase 5 — Vérification
- [ ] 5.1 Tests unitaires (`src/test/unit/`) : construction de l'arbre, renommage de préfixe, refus du déplacement dans un descendant, bulk toggle
- [ ] 5.2 Essai réel via `docker-compose.dev.yml` : couper un dossier → les peers disparaissent de `wg show`
- [ ] 5.3 `pnpm lint` + typecheck
