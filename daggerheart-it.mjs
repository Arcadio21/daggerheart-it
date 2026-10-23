// module/scripts/constants.mjs
var MODULE_ID = "daggerheart-it";
var SETTINGS = {
  FIRST_STARTUP: "firstStartup",
  AUTO_REGISTER_BABELE: "autoRegisterBabele"
};

// module/scripts/settings.mjs
var registerSettings = () => {
  game.settings.register(MODULE_ID, SETTINGS.FIRST_STARTUP, {
    scope: "world",
    config: false,
    default: true,
    type: Boolean
  });
  game.settings.register(MODULE_ID, SETTINGS.AUTO_REGISTER_BABELE, {
    name: "Attivazione automatica della traduzione tramite Babele",
    hint: "Implementa automaticamente le traduzioni di Babele senza dover specificare manualmente la cartella.",
    scope: "world",
    config: true,
    default: true,
    type: Boolean,
    requiresReload: true
  });
};

// module/scripts/module.mjs
var { getProperty, setProperty } = foundry.utils;
Hooks.once("init", () => {
  registerSettings();
  if (game.modules.get("babele")?.active) {
    if (game.settings.get(MODULE_ID, SETTINGS.AUTO_REGISTER_BABELE)) {
      game.babele.register({
        module: MODULE_ID,
        lang: "it",
        dir: "compendium/it"
      });
    }

    game.babele.registerConverters({
      backgroundQuestions: (value, translations) => {
        return translations || value;
      },
      connections: (value, translations) => {
        return translations || value;
      },

      actions: (actions, translations) => {
        if (!translations)
          return;
        for (const [key, action] of Object.entries(actions)) {
          registerTranslations(action, translations[key], {
            name: "name",
            description: "description"
          });
        }
      },
      effects: (effects, translations) => {
        if (!translations)
          return;
        for (const effect of effects) {
          registerTranslations(effect, translations[effect._id], {
            name: "name",
            description: "description"
          });
        }
      },
      experiences: (experiences, translations) => {
        if (!translations)
          return;
        for (const [key, experience] of Object.entries(experiences)) {
          registerTranslations(experience, translations[key], {
            name: "name",
            description: "description"
          });
        }
      },
      items: (items, translations) => {
        if (!translations)
          return;
        for (const item of items) {
          registerTranslations(item, translations[item._id], {
            name: "name",
            "system.description": "description"
          });
          for (const effect of item.effects) {
            registerTranslations(effect, translations[item._id]?.effects?.[effect._id], {
              name: "name",
              description: "description"
            });
          }
          for (const [key, action] of Object.entries(item.system.actions)) {
            registerTranslations(action, translations[item._id]?.actions?.[key], {
              name: "name",
              description: "description"
            });
          }
        }
      },
      advantageOn: (advantageOn, translations) => {
        if (!translations)
          return;
        for (const [key, advantage] of Object.entries(advantageOn)) {
          registerTranslations(advantage, translations[key], { value: "value" });
        }
      },
      potentialAdversaries: (potentialAdversaries, translations) => {
        if (!translations)
          return;
        for (const [key, adversary] of Object.entries(potentialAdversaries)) {
          registerTranslations(adversary, translations[key], { label: "label" });
        }
      }
    });
  }
});

var registerTranslations = (original, other = {}, keys = {}) => {
  if (!original || !other || !keys)
    return;
  for (const [originalKey, otherKey] of Object.entries(keys)) {
    const originalValue = getProperty(original, originalKey);
    const otherValue = getProperty(other, otherKey);
    if (originalValue == null || otherValue == null)
      continue; // Corretto: passa alla chiave successiva invece di interrompere la funzione
    setProperty(original, originalKey, otherValue);
  }
};

// --- Valuta in italiano di default (Impostazioni Homebrew del sistema) ---
var CURRENCY_DEFAULTS_EN = { title: "Gold", coins: "Coins", handfuls: "Handfuls", bags: "Bags", chests: "Chests" };
var currencyIT = () => ({
  title: game.i18n.localize("DAGGERHEART.CONFIG.Gold.title"),
  coins: game.i18n.localize("DAGGERHEART.CONFIG.Gold.coins"),
  handfuls: game.i18n.localize("DAGGERHEART.CONFIG.Gold.handfuls"),
  bags: game.i18n.localize("DAGGERHEART.CONFIG.Gold.bags"),
  chests: game.i18n.localize("DAGGERHEART.CONFIG.Gold.chests")
});
var homebrewKey = () => `${game.system.id}.Homebrew`;

// 1) Valori iniziali dello schema: i mondi che non hanno mai salvato le impostazioni le vedono già in italiano
Hooks.once("setup", () => {
  try {
    if (game.i18n.lang !== "it") return;
    const cfg = game.settings.settings.get(homebrewKey());
    const fields = cfg?.type?.schema?.fields?.currency?.fields;
    if (!fields) return;
    const it = currencyIT();
    if (fields.title) fields.title.initial = it.title;
    for (const k of ["coins", "handfuls", "bags", "chests"]) {
      if (fields[k]?.fields?.label) fields[k].fields.label.initial = it[k];
    }
  } catch (err) {
    console.warn("daggerheart-it | impossibile impostare la valuta italiana di default", err);
  }
});

// 2) Mondi esistenti: sostituisce solo i nomi rimasti ai valori inglesi di default (le scelte del GM non vengono toccate)
Hooks.once("ready", async () => {
  try {
    if (game.i18n.lang !== "it" || !game.user.isGM) return;
    const current = game.settings.get(game.system.id, "Homebrew");
    if (!current?.currency) return;
    const data = current.toObject ? current.toObject() : foundry.utils.deepClone(current);
    const it = currencyIT();
    let changed = false;
    if (data.currency.title === CURRENCY_DEFAULTS_EN.title) { data.currency.title = it.title; changed = true; }
    for (const k of ["coins", "handfuls", "bags", "chests"]) {
      if (data.currency[k]?.label === CURRENCY_DEFAULTS_EN[k]) { data.currency[k].label = it[k]; changed = true; }
    }
    if (changed) await game.settings.set(game.system.id, "Homebrew", data);
  } catch (err) {
    console.warn("daggerheart-it | impossibile aggiornare i nomi della valuta", err);
  }
});
