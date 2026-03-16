class AboreaActorSheet extends ActorSheet {
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      classes: ["aborea", "sheet", "actor"],
      width: 720,
      height: 760
    });
  }

  get template() {
    return "systems/aborea-lite/templates/actor/actor-sheet.hbs";
  }

  async getData(options = {}) {
    const context = await super.getData(options);
    context.system = context.actor.system;
    context.talents = context.items.filter(i => i.type === "talent");
    return context;
  }

  activateListeners(html) {
    super.activateListeners(html);

    html.find(".roll-attribute").on("click", async ev => {
      const key = ev.currentTarget.dataset.attribute;
      const value = Number(this.actor.system.attributes?.[key]?.value ?? 0);
      await rollExplodingD10({
        label: `${this.actor.name} • ${key.toUpperCase()}`,
        modifier: value
      });
    });

    html.find(".roll-talent").on("click", async ev => {
      const itemId = ev.currentTarget.dataset.itemId;
      const item = this.actor.items.get(itemId);
      if (!item) return;
      const attrKey = item.system.linkedAttribute || "int";
      const attr = Number(this.actor.system.attributes?.[attrKey]?.value ?? 0);
      const rank = Number(item.system.rank ?? 0);
      await rollExplodingD10({
        label: `${this.actor.name} • ${item.name}`,
        modifier: attr + rank
      });
    });

    html.find(".item-edit").on("click", ev => {
      const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
      item?.sheet.render(true);
    });

    html.find(".item-delete").on("click", async ev => {
      const item = this.actor.items.get(ev.currentTarget.dataset.itemId);
      if (item) await item.delete();
    });
  }
}

Hooks.once("init", () => {
  console.log("Aborea Lite | Initialisiere System");

  Actors.unregisterSheet("core", ActorSheet);
  Actors.registerSheet("aborea-lite", AboreaActorSheet, { makeDefault: true });
});

async function rollExplodingD10({ label, modifier = 0 } = {}) {
  let total = 0;
  const rolls = [];
  let result = 10;

  while (result === 10) {
    result = Math.ceil(CONFIG.Dice.randomUniform() * 10);
    rolls.push(result);
    total += result;
  }

  total += modifier;

  const formulaText = `${rolls.join(" + ")}${modifier ? ` + ${modifier}` : ""}`;
  const content = `
    <div>
      <strong>${label}</strong>
      <p>Würfe: ${rolls.join(", ")}</p>
      <p>Modifikator: ${modifier}</p>
      <p><strong>Gesamt: ${total}</strong></p>
      <p class="muted">Formel: ${formulaText}</p>
    </div>
  `;

  ChatMessage.create({
    speaker: ChatMessage.getSpeaker(),
    content
  });
}
