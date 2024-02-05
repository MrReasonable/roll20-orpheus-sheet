const attributes = [
  "intelligence",
  "wits",
  "resolve",
  "strength",
  "dexterity",
  "stamina",
  "presence",
  "manipulation",
  "composure",
];
const mentalSkills = [
  "academics",
  "computer",
  "crafts",
  "investigation",
  "medicine",
  "occult",
  "politics",
  "science",
];
const physicalSkills = [
  "athletics",
  "brawl",
  "drive",
  "firearms",
  "larceny",
  "stealth",
  "survival",
  "weaponry",
];
const socialSkills = [
  "animalken",
  "empathy",
  "expression",
  "intimidation",
  "persuasion",
  "socialize",
  "streetwise",
  "subterfuge",
];
const skills = [...mentalSkills, ...physicalSkills, ...socialSkills];
const skillsSpecializations = skills.map((skill) => `specialization_${skill}`);
const normalStats = [...attributes, ...skills];
const sizeStats = ["base_size", "giant", "small_framed"];
const woundPenaltyStats = ["iron_stamina", "incorporeal"];
const speedStats = ["species_factor", "fleet_of_foot"];
const defenseStats = ["defense_attr", "defense_skill", "defense_bonus"];
const initiativeStats = ["shoot_first"];
const allStats = [
  ...normalStats,
  ...sizeStats,
  ...speedStats,
  ...defenseStats,
  ...initiativeStats,
  ...woundPenaltyStats,
];

const derivedHealthStats = [...sizeStats, "stamina"];
const derivedSpeedStats = ["dexterity", "strength", ...speedStats];
const derivedDefenseStats = [
  "wits",
  "dexterity",
  "athletics",
  "brawl",
  "weaponry",
  ...defenseStats,
];
const derivedInitiativeStats = [
  "dexterity",
  "composure",
  "firearms",
  "shoot_first",
];
const derivedWillpowerStats = ["resolve", "composure"];
const derivedWoundPenaltyStats = ["iron_stamina"];

const maxValues = {
  fleet_of_foot: 3,
  iron_stamina: 3,
  vitality: 10,
  spite: 10,
};

allStats.forEach((attr) => {
  on(`change:${attr}`, (eventInfo) => {
    const statUpdaters = [
      [derivedHealthStats, updateHealth],
      [derivedSpeedStats, updateSpeed],
      [derivedDefenseStats, updateDefense],
      [derivedInitiativeStats, updateInitiative],
      [derivedWillpowerStats, updateWillpower],
      [derivedWoundPenaltyStats, updateWoundPenalties],
      [skillsSpecializations, updateSpecializationVisible],
    ];
    const source = eventInfo.sourceAttribute;
    fixMaxOverflow(eventInfo);
    updateDicePool();
    updateStats(statUpdaters, source);
  });

  on(`clicked:${attr}`, () => {
    updateDicePoolAttributes(attr);
  });
});

const fixMaxOverflow = (eventInfo) => {
  const source = eventInfo.sourceAttribute;
  const maxValue = maxValues[source];
  if (maxValue) {
    getAttrs([source], (v) => {
      const value = parseInt(v[source]);
      if (value > maxValue) {
        setAttrs({
          [source]: eventInfo.previousValue,
        });
      }
    });
  }
};

const updateStats = (statUpdaters, source) => {
  statUpdaters.forEach(([stats, updater]) => {
    if (stats.includes(source)) {
      updater();
    }
  });
};

const multidotTraits = ["extra_trait", "artifact"];

const dotAttrs = [
  ...attributes,
  ...skills,
  "repeating_merit:merit",
  "spite",
  ...[...Array(8).keys()].flatMap((i) =>
    multidotTraits.map((t) => `${t}_${i}`)
  ),
];

const dotButtonCount = 16;
// Set hidden attr on dot button click
dotAttrs.forEach((attr) => {
  new Array(dotButtonCount).fill(1).forEach((_, dot) => {
    on(`clicked:${attr}-${dot}`, () => {
      setAttrs({
        [attr.replace(":", "_")]: dot,
      });
    });
  });
});

const checkboxAttributes = [
  "small_framed",
  "giant",
  "shoot_first",
  "enable_profession",
  "enable_specialties",
  "armor_flag0",
  "armor_flag1",
  "armor_flag2",
  "armor_flag3",
  "projected",
  "academics_box",
  "computer_box",
  "crafts_box",
  "investigation_box",
  "medicine_box",
  "occult_box",
  "politics_box",
  "science_box",
  "athletics_box",
  "brawl_box",
  "drive_box",
  "firearms_box",
  "larceny_box",
  "stealth_box",
  "survival_box",
  "weaponry_box",
  "animalken_box",
  "empathy_box",
  "expression_box",
  "intimidation_box",
  "persuasion_box",
  "socialize_box",
  "streetwise_box",
  "subterfuge_box",
];
checkboxAttributes.forEach((checkboxAttribute) => {
  on(`clicked:${checkboxAttribute}`, () => {
    const attr = checkboxAttribute.replace(":", "_");
    getAttrs([attr], (values) => {
      const checkboxValue = ["1", "on"].includes(values[attr]);
      setAttrs({
        [attr]: checkboxValue ? "0" : "1",
      });
    });
  });
});

const attackSelectCount = 6;
const attackRadioAttributes = new Array(attackSelectCount)
  .fill(1)
  .map((_, index) => `attack_${index}`);

attackRadioAttributes.forEach((radioAttribute, index) => {
  on(`clicked:${radioAttribute}`, () => {
    getAttrs(selectedAttackAttrs, (values) => {
      const clearFlags = attackRadioAttributes
        .map((clearRadioAttribute) => `${clearRadioAttribute}_flag`)
        .reduce((acc, flag) => ({ ...acc, [flag]: "0" }), {});
      setAttrs({
        ...clearFlags,
        selected_attack: index,
        [`${radioAttribute}_flag`]: "1",
      });
    });
  });
});

const currentValueSeriesAttributes = ["willpower", "vitality", "spite"];
const currentValueAttributes = [
  ...currentValueSeriesAttributes.flatMap((currentValueSeriesAttribute) =>
    new Array(30)
      .fill(1)
      .map((_, i) => `${currentValueSeriesAttribute}_box${i + 1}`)
  ),
];

currentValueAttributes.forEach((currentValueAttribute) => {
  on(`clicked:${currentValueAttribute}`, () => {
    const [attribute, value] = currentValueAttribute.split("_box");
    const attr = `current_${attribute}`;
    const clickedValue = parseInt(value);
    getAttrs([attr], (v) => {
      const currentValue = parseInt(v[attr]);
      const newValue =
        currentValue === clickedValue ? currentValue - 1 : clickedValue;
      setAttrs({
        [`current_${attribute}`]: newValue,
      });
    });
  });
});

const updateHealth = () => {
  getAttrs(
    ["stamina", "resolve", "base_size", "giant", "small_framed"],
    (v) => {
      const health =
        Number(v.stamina) +
        Number(v.base_size) +
        Number(v.giant) -
        Number(v.small_framed);
      setAttrs({
        health,
      });
    }
  );
};

const updateSpeed = () => {
  getAttrs(["dexterity", "strength"], (v) => {
    speed = (parseInt(v.strength) || 0) + (parseInt(v.dexterity) || 0);
    setAttrs({
      speed_base: speed,
    });
  });
};

const updateDefense = () => {
  getAttrs(
    [
      "defense_attr",
      "defense_skill",
      "entity",
      "athletics",
      "brawl",
      "dexterity",
      "weaponry",
      "wits",
    ],
    (v) => {
      setAttrs({
        defense_base: getDefenseAttr(v) + getDefenseSkill(v),
      });
    }
  );
};

const getDefenseAttr = (v) => {
  const dexterity = parseInt(v.dexterity, 10) || 0;
  const wits = parseInt(v.wits, 10) || 10;
  switch (v.defense_attr) {
    case "lowest":
      return Math.min(dexterity, wits);
    case "highest":
      return Math.max(dexterity, wits);
    case "wits":
      return wits;
    case "dexterity":
      return dexterity;
  }
};

const getDefenseSkill = (v) => {
  const skill = v.defense_skill;
  if (skill === "nothing") {
    return 0;
  }
  return parseInt(v[skill], 10) || 0;
};

const updateInitiative = () => {
  getAttrs(["dexterity", "composure", "shoot_first", "firearms"], (v) => {
    const initiativeBase =
      (parseInt(v.dexterity) || 0) + (parseInt(v.composure) || 0);
    const shootFirstBonus =
      v.shoot_first === "1" ? parseInt(v.firearms) || 0 : 0;
    setAttrs({
      initiative_base: initiativeBase,
      shoot_first_bonus: shootFirstBonus,
    });
  });
};

const updateWillpower = () => {
  getAttrs(["resolve", "composure", "current_willpower"], (v) => {
    const resolve = parseInt(v.resolve) || 0;
    const composure = parseInt(v.composure) || 0;
    const currentWillpower = parseInt(v.current_willpower) || 0;
    const willpower = resolve + composure;
    const newCurrentWp =
      currentWillpower > willpower ? willpower : currentWillpower;
    setAttrs({
      willpower,
      current_willpower: newCurrentWp,
    });
  });
};

on("change:current_willpower", () => {
  getAttrs(["current_willpower", "rollmodify_willpower"], (v) => {
    const currentWillpower = parseInt(v.current_willpower) || 0;
    const rollmodifyWillpower = parseInt(v.rollmodify_willpower) || 0;
    if (currentWillpower <= 0 && rollmodifyWillpower > 0) {
      setAttrs({
        rollmodify_willpower: 0,
      });
    }
  });
});

const updateSpecializationVisible = () => {
  getAttrs(skillsSpecializations, (v) => {
    const specializationVisibility = skillsSpecializations.reduce(
      (acc, skill) => ({
        ...acc,
        [`has_${skill}`]: v[skill] ? "1" : "0",
      }),
      {}
    );
    setAttrs(specializationVisibility);
  });
};

//Health boxes
// trait name and depth (number of distinct healthbox states)
const healthTraits = { healthbox: 4 };
// Create array of all health attribute names, with values 1 through 24 for each health trait.
const healthAttrs = Object.keys(healthTraits).reduce(
  (attrs, trait) => ({
    ...attrs,
    ...new Array(24)
      .fill(1)
      .map((_, index) => `${trait}_${index + 1}`)
      .reduce(
        (traitAttrs, traitAttr) => ({
          ...traitAttrs,
          [traitAttr]: healthTraits[trait],
        }),
        {}
      ),
  }),
  {}
);

// Register button click event for each health attribute
Object.entries(healthAttrs).forEach(([attr, depth]) => {
  on(`clicked:${attr}`, () => {
    // Increment / cycle corresponding attribute value
    getAttrs([attr], (v) => {
      const healthValue = parseInt(v[attr]) || 0;
      setAttrs({
        [attr]: (healthValue + 1) % depth,
      });
    });
  });
});

const updateWoundPenalties = () => {
  getAttrs(["iron_stamina"], (v) => {
    const ironStamina = parseInt(v.iron_stamina, 10) || 0;
    const woundPenalties = getWoundPenalties(ironStamina);

    setAttrs(woundPenalties);
  });
};

const getWoundPenalties = (ironStamina) => {
  const maxPenalty = Math.min(ironStamina, 3) - 3;
  // Whitespace instead of empty string to avoid displaying default value
  return {
    wound_penalty_1: Math.min(maxPenalty + 2, 0) || " ",
    wound_penalty_2: Math.min(maxPenalty + 1, 0) || " ",
    wound_penalty_3: Math.min(maxPenalty, 0) || " ",
  };
};

const incorporealAttr = ["lament", "projected"]
  .map((attr) => `change:${attr}`)
  .join(" ");
on(incorporealAttr, () => {
  updateIncorporeal();
});

const updateIncorporeal = () => {
  getAttrs(["lament", "projected"], (v) => {
    const lament = v.lament || "";
    const projected = v.projected || "";
    const incorporeal = lament === "spirit" || lament === "hue" || projected;
    setAttrs({
      incorporeal,
    });
  });
};

const armorSelectCount = 4;
const updateAttackAttrs = [
  "strength",
  "attack",
  "iron_stamina",
  "incorporeal",
  "health",
  ...["_initiative", "_strength"].flatMap((attr) =>
    [new Array(attackSelectCount).keys()].map((i) => `attack${attr}${i}`)
  ),
  ...[...Array(dotButtonCount).keys()].map((i) => `healthbox_${i + 1}`),
];

const updateAttackTriggers = updateAttackAttrs
  .map((attr) => `change:${attr}`)
  .join(" ");

on(updateAttackTriggers, () => {
  updateAttacks();
});

const updateAttacks = () => {
  getAttrs(updateAttackAttrs, (v) => {
    const atknum = parseInt(v.selected_attack, 10) || 0;
    const str = parseInt(v.strength, 10) || 0;
    const isCorporeal = (parseInt(v.incorporeal) || 0) === 0 ? true : false;

    const initiativePenalty = parseInt(v[`attack_initiative${atknum}`]) || 0;
    const attackStrength = parseInt(v[`attack_strength${atknum}`]) || 0;
    const weaponStrPenalty = Math.min(str - attackStrength, 0);
    const attackName = v[`attack_name${atknum}`] || "";
    const armorStrPenalty = [...new Array(3).keys()].reduce(
      (penalty, index) => {
        const armorFlag = parseInt(v[`armor_flag${index}`]) || 0;
        const armorStrength = parseInt(v[`armor_strength${index}`]) || 0;
        const armorStrengthPenalty =
          str < armorStrength ? str - armorStrength : 0;
        return penalty + (armorFlag === "1" ? armorStrengthPenalty : 0);
      },
      0
    );

    const ironStamina = parseInt(v.iron_stamina, 10);

    const woundPenalty = [...new Array(3).keys()]
      .map((i) => v[`healthbox_${v.health - i}`])
      .reduce((penalty, healthAttr) => {
        const woundPenalty = isCorporeal && healthAttr !== 0 ? -1 : 0;
        return Math.min(ironStamina, penalty + woundPenalty);
      }, 0);

    setAttrs({
      weapon_penalty: weaponStrPenalty,
      armor_penalty: armorStrPenalty,
      initiative_penalty: initiativePenalty,
      wound_penalty: woundPenalty,
    });

    const attackAttrs = getAttackAttributes(v[`attack_type${atknum}`]).join(
      "+"
    );

    if (attackName.includes("@{")) {
      const unresolvedName = attackName.substring(2, attackName.length - 1);
      getAttrs([unresolvedName], (v) => {
        const attackName = v[unresolvedName] || "";
        setAttrs({
          active_attack_name: `${attackName}: ${attackAttrs}`,
        });
      });
    } else {
      setAttrs({
        active_attack_name: `${attackName}: ${attackAttrs}`,
      });
    }
  });
};

const getAttackAttributes = (type) => {
  switch (type) {
    case "brawl":
      return ["strength", "brawl"];
    case "melee":
      return ["strength", "weaponry"];
    case "gun":
      return ["dexterity", "firearms"];
    case "thrown":
      return ["dexterity", "athletics"];
    case "brawl-fight-finesse":
      return ["dexterity", "brawl"];
    case "melee-fight-finesse":
      return ["dexterity", "weaponry"];
    default:
      console.log("Invalid attack type");
      return [];
  }
};

const updateAttackDicePoolAttributes = () => {
  getAttrs(["rollstyle", "selected_attack"], (v) => {
    const rollStyle = v.rollstyle || "";
    const atknum = parseInt(v.selected_attack, 10) || 0;
    if (rollStyle !== "attack") {
      return;
    }
    getAttackAttributes(v[`attack_type${atknum}`]).forEach((attr) =>
      updateDicePoolAttributes(attr)
    );
  });
};

const updateDicePoolAttributes = (attribute) => {
  attribute = attribute.toLowerCase();
  getAttrs([...normalStats, "dice_pool_attributes"], (v) => {
    let poolAttributes = v["dice_pool_attributes"]
      .split(",")
      .filter((poolAttribute) => poolAttribute);

    if (poolAttributes.includes(attribute)) {
      // Remove attribute from roll
      poolAttributes = poolAttributes.filter(
        (poolAttribute) => poolAttribute !== attribute
      );
    } else {
      // Add attribute to roll
      poolAttributes = poolAttributes.concat(attribute);

      // Cap stats by type
      const poolAttributeTypes = poolAttributes.map((poolAttribute) => ({
        poolAttribute,
        type: getAttributeType(poolAttribute),
      }));
      poolAttributes = poolAttributeTypes
        .filter((x) => x.type === "attribute")
        .reverse()
        .slice(0, 2)
        .reverse()
        .concat(
          poolAttributeTypes
            .filter((x) => x.type === "skill")
            .reverse()
            .slice(0, 1)
            .reverse()
        )
        .slice(-2)
        .map((x) => x.poolAttribute);
    }
    // Create HTML for roll template
    const dicePoolHtml = getSheetDicePoolHtml(poolAttributes, v);

    // Create dice pool for roll
    const dicePool = getSheetDicePool(poolAttributes, v);

    // Create display for dice roller
    const rollDisplay = poolAttributes
      .map(
        (poolAttribute) =>
          v[`${poolAttribute}_name`] || getTranslationByKey(poolAttribute)
      )
      .join(" +\n");

    // Determine flag values
    const flags = [...normalStats]
      .map((flagAttribute) => ({
        flag: `${flagAttribute}_flag`,
        value: poolAttributes.includes(flagAttribute) ? 1 : 0,
      }))
      .reduce((all, next) => ({ ...all, [next.flag]: next.value }), {});

    setAttrs({
      ["dice_pool_attributes"]: poolAttributes.join(","),
      ["dice_pool_html"]: dicePoolHtml,
      ["dice_pool"]: dicePool,
      ["rolldisplay"]: rollDisplay,
      ...flags,
    });
  });
};

const rollStyles = ["sheet", "attack", "simple"];
rollStyles.forEach((rollStyle) => {
  on(`clicked:rollstyle_${rollStyle}`, (eventInfo) => {
    getAttrs(["rollstyle"], (v) => {
      const currentRollStyle = v["rollstyle"] || "";
      if (currentRollStyle === rollStyle) {
        return;
      }
      setAttrs({
        ...resetRollFlags(),
        rollstyle: rollStyle,
      });
    });
  });
});

on("change:rollstyle", () => {
  updateDicePool();
});

const rolltypes = ["normal", "9-again", "8-again"];
rolltypes.forEach((rolltype) => {
  on(`clicked:rolltype_select_${rolltype}`, () => {
    setAttrs({
      rolltype_select: rolltype,
    });
  });
});

const rollmodifiers = ["rote", "willpower", "specialty"];
rollmodifiers.forEach((rollmodifier) => {
  on(`clicked:rollmodify_select_${rollmodifier}`, () => {
    getAttrs([`rollmodify_${rollmodifier}`], (v) => {
      setAttrs({
        [`rollmodify_${rollmodifier}`]:
          v[`rollmodify_${rollmodifier}`] === "1" ? "0" : "1",
      });
    });
  });
});

const rollmodifierRestrictedValues = {
  willpower: "current_willpower",
};
_.keys(rollmodifierRestrictedValues).forEach((restrictedModifier) => {
  const rollModifier = `rollmodify_${restrictedModifier}`;
  on(`change:${rollModifier}`, () => {
    const modifierSource = rollmodifierRestrictedValues[restrictedModifier];
    getAttrs([rollModifier, modifierSource], (v) => {
      const value = parseInt(v[modifierSource]) || 0;
      const modifierEnabled = (parseInt(v[rollModifier]) || 0) === "1";
      if (value <= 0) {
        setAttrs({
          [rollModifier]: "0",
        });
      }
    });
  });
});

on(`change:rollmodify_specialty`, ({ newValue: specialtyEnabled }) => {
  if (!specialtyEnabled) {
    return;
  }
  updateUseSpecialty();
});

on(`change:dice_pool_attributes`, () => {
  updateUseSpecialty();
  updateDicePool();
});

const updateUseSpecialty = () => {
  getAttrs(["dice_pool_attributes"], (v) => {
    const dicePoolAttributes = v["dice_pool_attributes"]
      .split(",")
      .filter((poolAttribute) => poolAttribute);
    const specializations = dicePoolAttributes.map(
      (attr) => `has_specialization_${attr}`
    );
    getAttrs(specializations, (specializationValues) => {
      const hasSpecialization = _.contains(specializationValues, "1");
      if (!hasSpecialization) {
        setAttrs({
          ["rollmodify_specialty"]: "0",
        });
      }
    });
  });
};

const updateDicePool = () => {
  getAttrs([...normalStats, "dice_pool_attributes", "rollstyle"], (v) => {
    const rollStyle = v["rollstyle"] || "";

    if (rollStyle !== "sheet") {
      return;
    }

    const poolAttributes = v["dice_pool_attributes"]
      .split(",")
      .filter((poolAttribute) => poolAttribute);
    const dicePoolHtml = getSheetDicePoolHtml(poolAttributes, v);
    const dicePool = getSheetDicePool(poolAttributes, v);

    setAttrs({
      ["dice_pool_html"]: dicePoolHtml,
      ["dice_pool"]: dicePool,
    });
  });
};

const getSheetDicePoolHtml = (poolAttributes, values) => {
  return poolAttributes
    .map((poolAttribute) => ({
      label:
        values[`${poolAttribute}_name`] || getTranslationByKey(poolAttribute),
      value: getAttributePool(poolAttribute, values),
    }))
    .map((stat) => `<div>${stat.label} (${stat.value})</div>`)
    .join("");
};

const getSheetDicePool = (poolAttributes, values) => {
  return poolAttributes
    .map((poolAttribute) => getAttributePool(poolAttribute, values))
    .reduce((sum, value) => sum + value, 0);
};

const getExplodingDiceTarget = (rollType, isChanceRoll) => {
  if (isChanceRoll) {
    return 10;
  }

  switch (rollType) {
    case "9-again":
      return 9;
    case "8-again":
      return 8;
    default:
      return 10;
  }
};

const getTargetDifficulty = (isChanceRoll) => {
  if (isChanceRoll) {
    return 10;
  }
  return 8;
};

const getRerollFailures = (isRote, targetDifficulty) => {
  if (!isRote) {
    return "";
  }

  if (isRote) {
    return `ro<${targetDifficulty - 1}`;
  }
};

const getCriticalFail = (isChanceRoll) => {
  if (isChanceRoll) {
    return "cf<1";
  }
  return "cf<0";
};

const getAttributeType = (attribute) => {
  if (attributes.includes(attribute)) {
    return "attribute";
  }
  if (skills.includes(attribute)) {
    return "skill";
  }
};

const getAttributePool = (attribute, values) => {
  return Number(values[attribute]) || getUnskilledPenalty(attribute);
};

const getUnskilledPenalty = (attribute) => {
  if (mentalSkills.includes(attribute)) {
    return -3;
  }
  if (physicalSkills.includes(attribute)) {
    return -1;
  }
  if (socialSkills.includes(attribute)) {
    return -1;
  }
  return 0;
};

const resetRollFlags = () => {
  const flagValues = normalStats
    .map((attribute) => `${attribute}_flag`)
    .reduce((attrs, flag) => ({ ...attrs, [flag]: "" }), {});

  return {
    dice_pool_attributes: "",
    dice_pool_html: "",
    dice_pool: 0,
    rolldisplay: "",
    rollstyle: "sheet",
    rolltype_select: "normal",
    rollmodify_rote: "0",
    rollmodify_willpower: "0",
    rollmodify_modifier: "0",
    rollmodify_specialty: "0",
    rollreason: "",
    full_pool_html: "",
    ...flagValues,
  };
};

const getWillpowerHtml = (useWillpower, willpower) => {
  if (!useWillpower) {
    return "";
  }

  return `<div>${getTranslationByKey("willpower")} (+3)</div>`;
};

const getSpecialtyHtml = (useSpecialty) => {
  if (!useSpecialty) {
    return "";
  }

  return `<div>${getTranslationByKey("use-specialty")} (+1)</div>`;
};

const getWoundPenaltyHtml = (woundPenalties) => {
  if (woundPenalties >= 0) {
    return "";
  }

  return `<div>${getTranslationByKey(
    "wound-penalty"
  )} (${woundPenalties})</div>`;
};

const getModifiersHtml = (modifier) => {
  if (modifier === 0) {
    return "";
  }

  return `<div>${getTranslationByKey("modifiers")} (${modifier})</div>`;
};

const getDicePoolHtml = (
  dicePoolAttributes,
  values,
  useSpecialty,
  useWillpower,
  woundPenalties,
  modifiers
) => {
  return [
    getSheetDicePoolHtml(dicePoolAttributes, values),
    getSpecialtyHtml(useSpecialty),
    getWillpowerHtml(useWillpower),
    getWoundPenaltyHtml(woundPenalties),
    getModifiersHtml(modifiers),
  ].join("");
};

const generateDiceString = (
  totalDiceToRoll,
  rollType,
  isChanceRoll,
  isRote
) => {
  const targetDifficulty = getTargetDifficulty(isChanceRoll);
  const rerollFailures = getRerollFailures(isRote, targetDifficulty);
  const explodingDice = getExplodingDiceTarget(rollType, isChanceRoll);
  const criticalFail = getCriticalFail(isChanceRoll);
  return `${
    totalDiceToRoll <= 0 ? 1 : totalDiceToRoll
  }d10!>${explodingDice}cs>${targetDifficulty}${rerollFailures}${criticalFail}>${targetDifficulty}`;
};

const getSuccessType = (totalSuccesses, isChanceRoll, diceResults) => {
  if (totalSuccesses >= 5) {
    return "dramatic-success";
  }
  if (totalSuccesses >= 1) {
    return "success";
  }
  if (isChanceRoll && _.every(diceResults, (result) => result === 1)) {
    return "dramatic-failure";
  }
  return "failure";
};

const getRollTemplate = (rollStyle) => {
  switch (rollStyle) {
    case "attack":
      return "wod-attack";
    case "simple":
      return "wod-simple";
    default:
      return "wod";
  }
};

const dicePoolAttributes = [
  ...normalStats,
  "dice_pool_attributes",
  "dice_pool",
  "rolltype_select",
  "rollstyle",
  "rollmodify_rote",
  "rollmodify_willpower",
  "rollmodify_modifier",
  "rollmodify_specialty",
  "rollreason",
  "current_willpower",
  "wound_penalty",
  "character_name",
  "attack",
];

const calculateDicePool = (
  rollStyle,
  dicePool,
  useSpecialty,
  useWillpower,
  woundPenalties,
  modifier
) => {
  if (rollStyle === "simple") {
    return dicePool;
  }
  const willpowerDice = useWillpower ? 3 : 0;
  const specialtyDice = useSpecialty ? 1 : 0;
  return Math.max(
    dicePool + specialtyDice + willpowerDice + modifier + woundPenalties,
    0
  );
};

on("clicked:roll", () => {
  // <button type="roll" class="rollstyle attack" name="roll_attack"
  // value="&{template:wod-attack} {{name=@{character_name}}} {{strength=@{strength}}} {{dexterity=@{dexterity}}} {{brawl=@{brawl}}} {{weaponry=@{weaponry}}} {{firearms=@{firearms}}} {{athletics=@{athletics}}} {{mod=[[@{modifiermacro}]]}} {{woundpenalty=[[@{wound_penalty}]]}} {{wpen=[[@{weapon_penalty}]]}} {{apen=[[@{armor_penalty}]]}} @{attack}@{rolltype}"></button>
  getAttrs(dicePoolAttributes, (v) => {
    const attributes = (v.dice_pool_attributes || "").split(",");
    const modifier = parseInt(v.rollmodify_modifier) || 0;
    const dicePool = parseInt(v.dice_pool) || 0;
    const willpower = parseInt(v.current_willpower) || 0;
    const useWillpower =
      (parseInt(v.rollmodify_willpower) || 0) === 1 && willpower > 0;
    const useSpecialty = (parseInt(v.rollmodify_specialty) || 0) === 1;
    const woundPenalties = parseInt(v.wound_penalty) || 0;
    const isRote = parseInt(v.rollmodify_rote) === 1;
    const rollType = v.rolltype_select || "";
    const rollStyle = v.rollstyle || "simple";
    const totalDiceToRoll = calculateDicePool(
      rollStyle,
      dicePool,
      useSpecialty,
      useWillpower,
      woundPenalties,
      modifier
    );
    const isChanceRoll = totalDiceToRoll <= 0;
    const diceString = generateDiceString(
      totalDiceToRoll,
      rollType,
      isChanceRoll,
      isRote
    );

    const template = `&{template:${getRollTemplate(v.rollstyle)}}`;
    const rollString = `${template} {{name=@{character_name}}} {{dicePool=[[${totalDiceToRoll}]]}} {{dicePoolHtml=@{full_pool_html}}} {{result=[[${diceString}]]}}{{reason=@{rollreason}}} {{rollstyle=@{rollstyle}}} {{isRote=${
      isRote ? "rote" : ""
    }}} {{successType=[[0]]}} {{9again=${
      !isChanceRoll && rollType === "9-again" ? "9again" : ""
    }}} {{8again=${
      !isChanceRoll && rollType === "8-again" ? "8again" : ""
    }}} {{chance=${isChanceRoll ? "chance" : ""}}}`;

    setAttrs(
      {
        full_pool_html:
          rollStyle !== "simple"
            ? getDicePoolHtml(
                rollStyle,
                attributes,
                v,
                useSpecialty,
                useWillpower,
                woundPenalties,
                modifier
              )
            : "",
      },
      {},
      () => {
        startRoll(rollString, (results) => {
          if (useWillpower) {
            setAttrs({
              current_willpower: willpower - 1,
            });
          }
          const countSuccesses = results.results.result.result;
          const rolls = results.results.result.dice;

          finishRoll(results.rollId, {
            successType: getTranslationByKey(
              getSuccessType(countSuccesses, isChanceRoll, rolls)
            ),
          });
        });
      }
    );
  });
});

const extraTraitCount = 9;
const weaponCount = 6;
const maxTraitCount = Math.max(extraTraitCount, weaponCount);
const repeatingWeaponTraits = [
  "weapon_name_%d",
  "weapon_damage_%d",
  "weapon_range_%d",
  "weapon_clip_%d",
  "weapon_initiative_%d",
  "weapon_strength_%d",
  "weapon_size_%d",
];

const repeatingV1Attrs = [
  ...[...Array(extraTraitCount).keys()].flatMap((i) => [
    `other_traits_${i + 1}_name`,
    `other_traits_${i + 1}`,
  ]),
  ...[...Array(weaponCount).keys()].flatMap((i) =>
    repeatingWeaponTraits.map((t) => t.replace("%d", i + 1))
  ),
];

const version1Attrs = [
  "int",
  "res",
  "str",
  "dex",
  "sta",
  "pre",
  "man",
  "com",
  "willpower_available",
  "vitality_dot",
  "vitality_available",
  "shade",
  "lament",
];

const v1AttrMap = {
  int: "intelligence",
  res: "resolve",
  str: "strength",
  dex: "dexterity",
  sta: "stamina",
  pre: "presence",
  man: "manipulation",
  com: "composure",
  willpower_available: "current_willpower",
  vitality_dot: "vitality",
  vitality_available: "current_vitality",
  spite_dot: "spite",
  spite_available: "current_spite",
  speed_defense: "armor_speed0",
  armor_strength: "armor_strength0",
  "armor_defense,": "armor_defense0",
  armor_text: "armor_description0",
};

const newV1Attr = [
  "iron_stamina",
  "fleet_of_foot",
  "shoot_first",
  "giant",
  "small_framed",
  "defense_bonus",
];

const v0ArmorAttr = [
  "armor_rating",
  "armor_strength",
  "armor_defense,",
  "speed_defense",
  "armor_text",
];

const repeatingV1AttrMap = {
  "other_traits_%d_name": "extra_trait_%d_name",
  "other_traits_%d": "extra_trait_%d",
  "weapon_name_%d": "attack_name%d",
  "weapon_damage_%d": "attack_damage%d",
  "weapon_range_%d": "attack_range%d",
  "weapon_clip_%d": "attack_magazine%d",
  "weapon_initiative_%d": "attack_initiative%d",
  "weapon_strength_%d": "attack_strength%d",
  "weapon_size_%d": "attack_size%d",
};

const versionAttrs = [
  "version",
  ...version1Attrs,
  ...repeatingV1Attrs,
  ...v0ArmorAttr,
];

//Upgrade for new sheet versions
const versionUpdate = () => {
  getAttrs(versionAttrs, (v) => {
    const version = parseInt(v.version) || 0;
    let attrs = {};
    if (version < 1) {
      if (v.armor_rating) {
        const [ballistic, general] = v.armor_rating.split("/");
        if (ballistic) {
          attrs["armor_ballistic0"] = ballistic;
        }
        if (general) {
          attrs["armor_general0"] = general || ballistic || 0;
        }
      }
      //Rename v0 attributes to v1 attributes
      const renamedAttrs = Object.entries(v1AttrMap).reduce(
        (attrs, [oldAttr, newAttr]) => ({
          ...attrs,
          [newAttr]: v[oldAttr] || "",
        }),
        {}
      );
      //Initialise new attributes
      const newAttrs = newV1Attr.reduce(
        (attrs, newAttr) => ({
          ...attrs,
          [newAttr]: 0,
        }),
        {}
      );
      const lamentAndShadeAttrs = {
        shade: v.shade.toLowerCase().replace(" ", ""),
        lament: v.lament.toLowerCase().replace(" ", ""),
      };
      const repeatingAttrs = [...Array(maxTraitCount).keys()].reduce(
        (attrs, i) => {
          const repeatingAttrMap = Object.entries(repeatingV1AttrMap)
            .filter(([oldAttr, _]) => oldAttr.replace("%d", i + 1) in v)
            .reduce((attrs, [oldAttr, newAttr]) => {
              return {
                ...attrs,
                [newAttr.replace("%d", i + 1)]: v[oldAttr.replace("%d", i + 1)],
              };
            }, {});
          return {
            ...attrs,
            ...repeatingAttrMap,
          };
        },
        {}
      );
      //Set all attributes
      attrs = {
        ...attrs,
        ...renamedAttrs,
        ...newAttrs,
        ...lamentAndShadeAttrs,
        ...repeatingAttrs,
      };
      attrs["version"] = 1;
    }
    console.log("Upgrading for V1:", attrs);
    setAttrs(attrs);
  });
};

on("sheet:opened", () => {
  versionUpdate();
  updateHealth();
  updateAttacks();
  updateSpeed();
  updateDefense();
  updateInitiative();
  updateWillpower();
  updateSpecializationVisible();
  const resetRollFlagAttrs = resetRollFlags();

  setAttrs(
    {
      dicepoolmacro: getTranslationByKey("dice-pool"),
      modifiermacro: getTranslationByKey("modifiers"),
      unarmedmacro: getTranslationByKey("unarmed"),
      ...resetRollFlagAttrs,
    },
    { silent: true }
  );
});
