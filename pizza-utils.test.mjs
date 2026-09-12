import assert from "node:assert/strict";
import test from "node:test";
import {
  findPizzaBySlug,
  nutritionForWholePizza,
  slugifyPizza,
} from "./src/lib/pizza-utils.mjs";

test("creates stable slugs for every menu pizza name", () => {
  const names = [
    "Mussarela", "Calabresa", "Portuguesa", "Frango com Catupiry", "Napolitana",
    "Quatro Queijos", "Rúcula & Tomate Seco", "Baiana", "Brócolis & Bacon", "Pepperoni",
    "Palmito da Horta", "Cogumelos", "Legumes Grelhados", "Brócolis Defumado", "Margherita Vegana",
    "Mussarela GF", "Calabresa GF", "Quatro Queijos GF", "Frango com Catupiry GF", "Alcachofra GF",
    "Banana & Canela", "Romeu & Julieta", "Nutella & Morango", "Brigadeiro", "Avelã & Chocolate Branco",
  ];
  const slugs = names.map(slugifyPizza);
  assert.equal(slugs.length, 25);
  assert.equal(new Set(slugs).size, 25);
  assert.equal(slugs[6], "rucula-e-tomate-seco");
  assert.equal(slugs[24], "avela-e-chocolate-branco");
});

test("calculates nutrition for the full pizza and resolves slugs", () => {
  const slice = { calories: 180, carbs: 22, protein: 9, fat: 7, fiber: 2 };
  assert.deepEqual(nutritionForWholePizza(slice, 8), {
    calories: 1440, carbs: 176, protein: 72, fat: 56, fiber: 16,
  });
  const pizzas = [{ slug: "calabresa" }, { slug: "mussarela" }];
  assert.equal(findPizzaBySlug(pizzas, "calabresa"), pizzas[0]);
  assert.equal(findPizzaBySlug(pizzas, "inexistente"), undefined);
});
