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

## Fait

### Phase 1 — Base de données
- [x] Colonne `clients_table.folder` (texte, nullable, `null` = racine)
- [x] Migration `0009_sleepy_sprite.sql` + snapshot, vérifiée sur une base vierge et au démarrage

### Phase 2 — Dossiers
- [x] `FolderPathSchema` : segments non vides, bornés, espaces autour des `/` normalisés
- [x] `shared/utils/folders.ts` : `buildFolderTree`, `inBranch`, `FOLDER_DEPTH_WARNING`
- [x] `FolderService` : `setEnabled` (branche entière), `rename` (réécriture de préfixe, refus vers un descendant)
- [x] Ressource `folders` dans `permissions.ts`, action `manage`, admin uniquement
- [x] `POST /api/folder/toggle`, `POST /api/folder/rename`, `POST /api/client/[clientId]/folder`
- [x] `folder` exposé dans les listes, et pris en compte par la recherche

### Phase 3 — Multi-appareils
- [x] `userId: 1` en dur supprimé ; l'admin choisit le propriétaire, un non-admin est forcé sur lui-même
- [x] `GET /api/admin/users` (sans hash de mot de passe ni secret TOTP)
- [x] Propriétaire joint aux listes d'appareils

### Phase 4 — Interface
- [x] `Folders/Node.vue` : arbre récursif, repliable, compteurs, avertissement au-delà de 5 niveaux
- [x] Interrupteur de branche : allumé dès qu'un appareil l'est, un clic coupe toute la branche
- [x] `Folders/RenameDialog.vue`
- [x] `Clients/List.vue` regroupé par dossier, racine = « Non classés »
- [x] Champ dossier dans la fiche d'appareil et à la création
- [x] Propriétaire affiché sur la carte dès qu'il y a plus d'un utilisateur
- [x] Traductions anglais + français

### Phase 5 — Vérification
- [x] 7 tests unitaires sur l'arbre et `inBranch` (67 tests au total au vert)
- [x] `typecheck`, `lint`, `build` au vert
- [x] Essai réel sur une instance dev isolée : couper `Client A/Paris` a fait tomber 3 appareils
      sur 5 et les peers de `wg show` sont passés de 5 à 2 ; réactivation et déplacement corrects
- [x] Frontière de sécurité vérifiée : un non-admin reçoit 403 sur toutes les opérations de dossier
- [x] Multi-appareils vérifié : 3 appareils attribués à un second utilisateur, qui ne voit que les siens

---

## Écarts par rapport au plan initial

- **Pas de `GET /api/folder`.** La liste des appareils porte déjà le chemin de chaque appareil,
  donc l'arbre est construit côté client. Un aller-retour réseau en moins, et l'arbre reste
  synchronisé avec le rafraîchissement automatique de la page.
- **Le calcul de l'arbre vit dans `shared/utils/folders.ts`**, partagé entre l'interface et les tests,
  plutôt que dans le service serveur.
- **Les chemins sont normalisés au lieu d'être refusés.** Taper `Client A / Paris` enregistre
  `Client A/Paris`, plutôt que de renvoyer une erreur.
- **`docker-compose.dev.yml` écoute sur 51830/51831 en 127.0.0.1.** Permet de développer sur une
  machine où une instance wg-easy de production tourne déjà, ce qui est le cas de msi.

---

## Reste ouvert

- Il n'existe aucune interface de création d'utilisateur dans wg-easy : le sélecteur de propriétaire
  ne propose que les comptes déjà présents en base. À décider si ce fork doit en ajouter une.
- Déplacer un appareil d'un dossier à l'autre se fait par le champ texte de sa fiche. Un
  glisser-déposer dans l'arbre serait plus direct.
- Le DNS des conteneurs Docker est cassé sur msi (règle ufw, connue depuis le 21/08) : le build
  de l'image dev a dû passer par `--network=host`.
