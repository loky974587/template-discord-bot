# Discord Bot Template

Template minimal pour creer rapidement un bot Discord avec :
- 1 fichier par commande (slash command)
- 1 fichier par reaction a un event (plusieurs fichiers pour le meme event)
- scan automatique des dossiers `commands/` et `events/`

## Installation

```bash
npm install
```

## Configuration

Copie `.env.example` vers `.env` et renseigne :
- `TOKEN`
- `CLIENT_ID`
- `GUILD_ID` (optionnel)
- `DEBUG` (optionnel)

## Lancer

```bash
npm start
```

## Creer une commande

Mode interactif (recommande) :
```bash
npm run create:command -- --interactive
```

Mode rapide :
```bash
npm run create:command -- <name> <description> [--category <folder>]
```

Le script peut aussi configurer des arguments (type, obligatoire, choices, min/max, autocomplete).

## Structure

- `index.js` : point d'entree
- `src/bootstrap/` : creation client + chargement commandes/events + registration
- `src/commands/` : une commande par fichier (peut contenir des sous-dossiers)
- `src/events/` : plusieurs fichiers par event possible

## Events multiples

Deux options :
- Option A : chaque fichier exporte `event: 'messageCreate'`
- Option B : place les fichiers dans `src/events/messageCreate/` (le loader deduit le nom)

Exemple :
```
src/events/messageCreate/log.js
src/events/messageCreate/autoReply.js
```

Chaque fichier contient `execute(...)` et sera attache a `messageCreate`.
