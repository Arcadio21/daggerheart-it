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
    name: "Activation automatique de la traduction via Babele",
    hint: "Implémente automatiquement les traductions Babele sans qu'il soit nécessaire de désigner le répertoire contenant les traductions.",
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
      return;
    setProperty(original, originalKey, otherValue);
  }
};
