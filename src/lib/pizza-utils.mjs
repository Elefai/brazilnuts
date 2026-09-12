export const slugifyPizza = (value) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/&/g, "e")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

export const nutritionForWholePizza = (nutrition, slices) =>
  Object.fromEntries(
    Object.entries(nutrition).map(([key, value]) => [key, value * slices]),
  );

export const findPizzaBySlug = (pizzas, slug) =>
  pizzas.find((pizza) => pizza.slug === slug);
