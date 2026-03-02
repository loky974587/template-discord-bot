const path = require('node:path');
const fs = require('node:fs/promises');
const readline = require('node:readline');

const args = process.argv.slice(2);

function usage() {
  console.error('Usage: node scripts/create-command.js <name> <description> [--category <folder>]');
  console.error('       node scripts/create-command.js --interactive');
}

function takeOption(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return null;
  const value = args[index + 1];
  if (!value || value.startsWith('-')) return null;
  args.splice(index, 2);
  return value;
}

function takeFlag(flag) {
  const index = args.indexOf(flag);
  if (index === -1) return false;
  args.splice(index, 1);
  return true;
}

function normalizeName(name) {
  return String(name || '').trim().toLowerCase();
}

function validateName(name) {
  return /^[\w-]{1,32}$/.test(name);
}

function escapeDescription(text) {
  return String(text || '').replace(/'/g, "\\'");
}

function escapeName(text) {
  return String(text || '').replace(/'/g, "\\'");
}

function parseMaybeNumber(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  if (Number.isNaN(parsed)) return null;
  return parsed;
}

async function promptLine(rl, question) {
  return new Promise((resolve) => rl.question(question, resolve));
}

async function promptYesNo(rl, question, defaultValue) {
  const suffix = defaultValue ? ' [O/n]' : ' [o/N]';
  const raw = (await promptLine(rl, `${question}${suffix} `)).trim().toLowerCase();
  if (!raw) return defaultValue;
  return raw === 'o' || raw === 'oui' || raw === 'y' || raw === 'yes';
}

async function promptChoice(rl, question, choices) {
  const list = choices.map((choice, index) => `${index + 1}) ${choice}`).join('\n');
  while (true) {
    const raw = (await promptLine(rl, `${question}\n${list}\n> `)).trim();
    const index = Number.parseInt(raw, 10);
    if (!Number.isNaN(index) && index >= 1 && index <= choices.length) {
      return choices[index - 1];
    }
    if (choices.includes(raw)) return raw;
    console.log('Choix invalide.');
  }
}

async function collectInteractive(initial) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  try {
    const nameInput = initial.name || await promptLine(rl, 'Nom de la commande: ');
    const normalizedName = normalizeName(nameInput);
    if (normalizedName !== nameInput) {
      console.warn(`[create-command] Le nom a ete normalise en "${normalizedName}".`);
    }
    if (!validateName(normalizedName)) {
      throw new Error('Nom invalide. Utilise uniquement lettres, chiffres, _ ou -, 1 a 32 caracteres.');
    }

    const descriptionInput = initial.description || await promptLine(rl, 'Description: ');
    const finalDescription = descriptionInput.trim() || 'Description de la commande';

    const categoryInput = initial.category || await promptLine(rl, 'Categorie (optionnel): ');
    const category = categoryInput.trim() || null;

  const options = [];
  const optionTypes = [
    'string',
    'integer',
    'boolean',
    'user',
    'channel',
    'role',
    'mentionable',
    'number',
    'attachment'
  ];

  while (await promptYesNo(rl, 'Ajouter un argument ?', false)) {
      const optNameInput = await promptLine(rl, 'Nom de l\'argument: ');
      const optName = normalizeName(optNameInput);
      if (!validateName(optName)) {
        console.log('Nom invalide pour l\'argument, il sera ignore.');
        continue;
      }
    const optDescriptionInput = await promptLine(rl, 'Description de l\'argument: ');
    const optDescription = optDescriptionInput.trim() || 'Argument de la commande';
    const optType = await promptChoice(rl, 'Type de l\'argument:', optionTypes);
    const optRequired = await promptYesNo(rl, 'Obligatoire ?', false);
    let optMin = null;
    let optMax = null;
    let optAutocomplete = false;
    const optChoices = [];

    if (optType === 'integer' || optType === 'number') {
      const minInput = await promptLine(rl, 'Valeur min (optionnel): ');
      const maxInput = await promptLine(rl, 'Valeur max (optionnel): ');
      optMin = parseMaybeNumber(minInput);
      optMax = parseMaybeNumber(maxInput);
    }

    if (optType === 'string' || optType === 'integer' || optType === 'number') {
      optAutocomplete = await promptYesNo(rl, 'Autocomplete ?', false);
      if (optAutocomplete) {
        console.log("Note: l'autocomplete est incompatible avec les choix predefinis.");
      }
      if (!optAutocomplete && await promptYesNo(rl, 'Ajouter des choix predefinis ?', false)) {
        while (true) {
          const choiceName = (await promptLine(rl, 'Nom du choix (laisser vide pour finir): ')).trim();
          if (!choiceName) break;
          let choiceValue = choiceName;
          if (optType === 'integer' || optType === 'number') {
            const valueInput = await promptLine(rl, 'Valeur numerique: ');
            const parsedValue = parseMaybeNumber(valueInput);
            if (parsedValue === null) {
              console.log('Valeur numerique invalide, choix ignore.');
              continue;
            }
            choiceValue = parsedValue;
          }
          optChoices.push({ name: choiceName, value: choiceValue });
        }
      }
    }

    options.push({
      name: optName,
      description: optDescription,
      type: optType,
      required: optRequired,
      min: optMin,
      max: optMax,
      autocomplete: optAutocomplete,
      choices: optChoices
    });
  }

    return { name: normalizedName, description: finalDescription, category, options };
  } finally {
    rl.close();
  }
}

function buildOptionLines(options) {
  const typeMap = {
    string: 'addStringOption',
    integer: 'addIntegerOption',
    boolean: 'addBooleanOption',
    user: 'addUserOption',
    channel: 'addChannelOption',
    role: 'addRoleOption',
    mentionable: 'addMentionableOption',
    number: 'addNumberOption',
    attachment: 'addAttachmentOption'
  };

  const lines = [];
  for (const option of options) {
    const method = typeMap[option.type] || typeMap.string;
    const requiredLine = option.required ? '      .setRequired(true)' : null;
    const minLine = option.min !== null && option.min !== undefined ? `      .setMinValue(${option.min})` : null;
    const maxLine = option.max !== null && option.max !== undefined ? `      .setMaxValue(${option.max})` : null;
    const autocompleteLine = option.autocomplete && (!option.choices || option.choices.length === 0)
      ? '      .setAutocomplete(true)'
      : null;

    lines.push(`    .${method}((option) =>`);
    lines.push(`      option.setName('${option.name}')`);
    lines.push(`        .setDescription('${escapeDescription(option.description)}')`);
    if (requiredLine) lines.push(requiredLine);
    if (minLine) lines.push(minLine);
    if (maxLine) lines.push(maxLine);
    if (autocompleteLine) lines.push(autocompleteLine);
    if (Array.isArray(option.choices) && option.choices.length > 0) {
      const choices = option.choices
        .map((choice) => {
          const name = escapeName(choice.name);
          const value = typeof choice.value === 'number' ? choice.value : `'${escapeName(choice.value)}'`;
          return `{ name: '${name}', value: ${value} }`;
        })
        .join(', ');
      lines.push(`        .addChoices(${choices})`);
    }
    lines.push('    )');
  }

  return lines;
}

async function run() {
  const interactive = takeFlag('--interactive') || takeFlag('-i');
  const categoryFlag = takeOption('--category') || takeOption('-c');
  const nameArg = args[0];
  const descriptionArg = args.slice(1).join(' ').trim();

  let payload = null;

  if (!nameArg || interactive) {
    payload = await collectInteractive({
      name: nameArg,
      description: descriptionArg,
      category: categoryFlag
    });
  } else {
    const normalizedName = normalizeName(nameArg);
    if (normalizedName !== nameArg) {
      console.warn(`[create-command] Le nom a ete normalise en "${normalizedName}".`);
    }
    if (!validateName(normalizedName)) {
      console.error('[create-command] Nom invalide. Utilise uniquement lettres, chiffres, _ ou -, 1 a 32 caracteres.');
      process.exit(1);
    }
    payload = {
      name: normalizedName,
      description: descriptionArg || 'Description de la commande',
      category: categoryFlag,
      options: []
    };
  }

  const commandsDir = path.join(__dirname, '..', 'src', 'commands');
  const targetDir = payload.category ? path.join(commandsDir, payload.category) : commandsDir;
  const targetFile = path.join(targetDir, `${payload.name}.js`);

  await fs.mkdir(targetDir, { recursive: true });

  try {
    await fs.access(targetFile);
    console.error(`[create-command] Le fichier existe deja: ${targetFile}`);
    process.exit(1);
  } catch (error) {
    if (error && error.code !== 'ENOENT') throw error;
  }

  const optionLines = buildOptionLines(payload.options);
  const content = [
    "const { SlashCommandBuilder } = require('discord.js');",
    '',
    'module.exports = {',
    '  data: new SlashCommandBuilder()',
    `    .setName('${payload.name}')`,
    `    .setDescription('${escapeDescription(payload.description)}')`,
    ...optionLines,
    '  ,',
    '  async execute(interaction) {',
    "    await interaction.reply('TODO');",
    '  }',
    '};',
    ''
  ].join('\n');

  await fs.writeFile(targetFile, content, 'utf8');
  console.log(`[create-command] Cree: ${targetFile}`);
}

run().catch((error) => {
  console.error('[create-command] Erreur', error);
  process.exit(1);
});
