export const pizzaCategories = [
  "Tradicionais",
  "Especiais",
  "Veganas",
  "Sem glúten",
  "Doces",
] as const;

export type PizzaCategory = (typeof pizzaCategories)[number];

type BasePizza = {
  category: PizzaCategory;
  name: string;
  ingredients: string;
  portion: string;
  priceMin: number;
  priceMax: number;
  image: string;
  alt: string;
  featured?: boolean;
};

export type NutritionEstimate = {
  calories: number;
  carbs: number;
  protein: number;
  fat: number;
  fiber: number;
};

export type Pizza = BasePizza & {
  slug: string;
  description: string;
  slices: number;
  detailedIngredients: string[];
  allergens: string[];
  traceWarning: string;
  nutrition: NutritionEstimate;
};

const images = {
  classic:
    "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=900&q=85",
  cheese:
    "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=900&q=85",
  vegetable:
    "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?auto=format&fit=crop&w=900&q=85",
  dessert:
    "https://images.unsplash.com/photo-1579751626657-72bc17010498?auto=format&fit=crop&w=900&q=85",
  oven:
    "https://images.unsplash.com/photo-1594007654729-407eedc4be65?auto=format&fit=crop&w=900&q=85",
};

const basePizzas: BasePizza[] = [
  {
    category: "Tradicionais",
    name: "Mussarela",
    ingredients: "Molho de tomate, mussarela e orégano.",
    portion: "Média · 30 cm",
    priceMin: 20,
    priceMax: 25,
    image: images.cheese,
    alt: "Pizza de mussarela com orégano",
    featured: true,
  },
  {
    category: "Tradicionais",
    name: "Calabresa",
    ingredients: "Molho, mussarela, calabresa defumada e cebola.",
    portion: "Média · 30 cm",
    priceMin: 22,
    priceMax: 28,
    image: images.classic,
    alt: "Pizza de calabresa fatiada com cebola",
    featured: true,
  },
  {
    category: "Tradicionais",
    name: "Portuguesa",
    ingredients: "Presunto, ovo, ervilha, cebola e azeitonas.",
    portion: "Média · 30 cm",
    priceMin: 25,
    priceMax: 32,
    image: images.oven,
    alt: "Pizza portuguesa assada",
  },
  {
    category: "Tradicionais",
    name: "Frango com Catupiry",
    ingredients: "Frango desfiado, catupiry e mussarela.",
    portion: "Média · 30 cm",
    priceMin: 23,
    priceMax: 30,
    image: images.classic,
    alt: "Pizza de frango com catupiry",
  },
  {
    category: "Tradicionais",
    name: "Napolitana",
    ingredients: "Mussarela, tomate, manjericão e parmesão.",
    portion: "Média · 30 cm",
    priceMin: 25,
    priceMax: 30,
    image: images.cheese,
    alt: "Pizza napolitana com tomate e manjericão",
  },
  {
    category: "Especiais",
    name: "Quatro Queijos",
    ingredients: "Mussarela, provolone, parmesão e gorgonzola.",
    portion: "Média · 30 cm",
    priceMin: 30,
    priceMax: 38,
    image: images.cheese,
    alt: "Pizza quatro queijos dourada",
    featured: true,
  },
  {
    category: "Especiais",
    name: "Rúcula & Tomate Seco",
    ingredients: "Creme de ricota, rúcula, tomate seco e parmesão.",
    portion: "Média · 30 cm",
    priceMin: 32,
    priceMax: 39,
    image: images.vegetable,
    alt: "Pizza com rúcula e tomate seco",
  },
  {
    category: "Especiais",
    name: "Baiana",
    ingredients: "Molho apimentado, cream cheese, ovo e pimenta.",
    portion: "Média · 30 cm",
    priceMin: 28,
    priceMax: 35,
    image: images.classic,
    alt: "Pizza baiana com ingredientes apimentados",
  },
  {
    category: "Especiais",
    name: "Brócolis & Bacon",
    ingredients: "Molho branco, brócolis, bacon crocante e mussarela.",
    portion: "Média · 30 cm",
    priceMin: 30,
    priceMax: 37,
    image: images.vegetable,
    alt: "Pizza de brócolis com bacon",
  },
  {
    category: "Especiais",
    name: "Pepperoni",
    ingredients: "Molho de tomate, mussarela e pepperoni picante.",
    portion: "Média · 30 cm",
    priceMin: 32,
    priceMax: 40,
    image: images.classic,
    alt: "Pizza de pepperoni",
  },
  {
    category: "Veganas",
    name: "Palmito da Horta",
    ingredients: "Palmito, tomate, cebola e azeitonas, sem queijo.",
    portion: "Média · 30 cm",
    priceMin: 25,
    priceMax: 32,
    image: images.vegetable,
    alt: "Pizza vegana de palmito e tomate",
    featured: true,
  },
  {
    category: "Veganas",
    name: "Cogumelos",
    ingredients: "Pesto sem queijo, cogumelos salteados e rúcula.",
    portion: "Média · 30 cm",
    priceMin: 30,
    priceMax: 35,
    image: images.vegetable,
    alt: "Pizza vegana de cogumelos",
  },
  {
    category: "Veganas",
    name: "Legumes Grelhados",
    ingredients: "Berinjela, abobrinha, pimentão e pesto de manjericão.",
    portion: "Média · 30 cm",
    priceMin: 27,
    priceMax: 34,
    image: images.vegetable,
    alt: "Pizza vegana de legumes grelhados",
  },
  {
    category: "Veganas",
    name: "Brócolis Defumado",
    ingredients: "Brócolis, tofu defumado, tomate e orégano.",
    portion: "Média · 30 cm",
    priceMin: 26,
    priceMax: 33,
    image: images.vegetable,
    alt: "Pizza vegana de brócolis e tofu",
  },
  {
    category: "Veganas",
    name: "Margherita Vegana",
    ingredients: "Queijo vegetal de castanhas, tomate e manjericão.",
    portion: "Média · 30 cm",
    priceMin: 28,
    priceMax: 35,
    image: images.vegetable,
    alt: "Pizza margherita vegana",
  },
  {
    category: "Sem glúten",
    name: "Mussarela GF",
    ingredients: "Mussarela, molho de tomate e orégano em massa sem glúten.",
    portion: "Individual · 25 cm",
    priceMin: 30,
    priceMax: 35,
    image: images.cheese,
    alt: "Pizza sem glúten de mussarela",
  },
  {
    category: "Sem glúten",
    name: "Calabresa GF",
    ingredients: "Calabresa, cebola e mussarela em massa sem glúten.",
    portion: "Individual · 25 cm",
    priceMin: 32,
    priceMax: 37,
    image: images.classic,
    alt: "Pizza sem glúten de calabresa",
  },
  {
    category: "Sem glúten",
    name: "Quatro Queijos GF",
    ingredients: "Quatro queijos em massa de arroz e polvilho.",
    portion: "Individual · 25 cm",
    priceMin: 35,
    priceMax: 40,
    image: images.cheese,
    alt: "Pizza sem glúten quatro queijos",
  },
  {
    category: "Sem glúten",
    name: "Frango com Catupiry GF",
    ingredients: "Frango desfiado e catupiry em massa sem glúten.",
    portion: "Individual · 25 cm",
    priceMin: 34,
    priceMax: 40,
    image: images.oven,
    alt: "Pizza sem glúten de frango com catupiry",
  },
  {
    category: "Sem glúten",
    name: "Alcachofra GF",
    ingredients: "Alcachofra, tomate, azeitonas e mussarela.",
    portion: "Individual · 25 cm",
    priceMin: 33,
    priceMax: 39,
    image: images.vegetable,
    alt: "Pizza sem glúten de alcachofra",
  },
  {
    category: "Doces",
    name: "Banana & Canela",
    ingredients: "Banana em rodelas, açúcar e canela.",
    portion: "Brotinho · 20 cm",
    priceMin: 15,
    priceMax: 20,
    image: images.dessert,
    alt: "Pizza doce de banana com canela",
    featured: true,
  },
  {
    category: "Doces",
    name: "Romeu & Julieta",
    ingredients: "Goiabada cremosa e queijo fresco.",
    portion: "Brotinho · 20 cm",
    priceMin: 16,
    priceMax: 22,
    image: images.dessert,
    alt: "Pizza doce de goiabada e queijo",
  },
  {
    category: "Doces",
    name: "Nutella & Morango",
    ingredients: "Creme de avelã, morangos fatiados e chocolate.",
    portion: "Brotinho · 20 cm",
    priceMin: 20,
    priceMax: 25,
    image: images.dessert,
    alt: "Pizza doce de creme de avelã e morangos",
  },
  {
    category: "Doces",
    name: "Brigadeiro",
    ingredients: "Creme de chocolate e granulado.",
    portion: "Brotinho · 20 cm",
    priceMin: 16,
    priceMax: 22,
    image: images.dessert,
    alt: "Pizza doce de brigadeiro",
  },
  {
    category: "Doces",
    name: "Avelã & Chocolate Branco",
    ingredients: "Creme de avelã e lascas de chocolate branco.",
    portion: "Brotinho · 20 cm",
    priceMin: 18,
    priceMax: 25,
    image: images.dessert,
    alt: "Pizza doce de creme de avelã e chocolate branco",
  },
];

const nutritionByPizza: Record<string, NutritionEstimate> = {
  Mussarela: { calories: 185, carbs: 21, protein: 9, fat: 8, fiber: 1.5 },
  Calabresa: { calories: 210, carbs: 21, protein: 9, fat: 10, fiber: 1.5 },
  Portuguesa: { calories: 215, carbs: 22, protein: 10, fat: 10, fiber: 2 },
  "Frango com Catupiry": { calories: 205, carbs: 20, protein: 12, fat: 9, fiber: 1 },
  Napolitana: { calories: 190, carbs: 21, protein: 9, fat: 8, fiber: 2 },
  "Quatro Queijos": { calories: 230, carbs: 20, protein: 11, fat: 12, fiber: 1 },
  "Rúcula & Tomate Seco": { calories: 205, carbs: 21, protein: 10, fat: 9, fiber: 2 },
  Baiana: { calories: 220, carbs: 22, protein: 10, fat: 10, fiber: 1.5 },
  "Brócolis & Bacon": { calories: 225, carbs: 20, protein: 11, fat: 11, fiber: 2 },
  Pepperoni: { calories: 235, carbs: 21, protein: 10, fat: 12, fiber: 1 },
  "Palmito da Horta": { calories: 165, carbs: 23, protein: 4, fat: 6, fiber: 3 },
  Cogumelos: { calories: 175, carbs: 22, protein: 5, fat: 7, fiber: 3 },
  "Legumes Grelhados": { calories: 170, carbs: 23, protein: 4, fat: 6, fiber: 3.5 },
  "Brócolis Defumado": { calories: 175, carbs: 22, protein: 7, fat: 6, fiber: 3.5 },
  "Margherita Vegana": { calories: 180, carbs: 23, protein: 5, fat: 7, fiber: 2.5 },
  "Mussarela GF": { calories: 195, carbs: 24, protein: 9, fat: 8, fiber: 1.5 },
  "Calabresa GF": { calories: 220, carbs: 24, protein: 9, fat: 11, fiber: 1.5 },
  "Quatro Queijos GF": { calories: 240, carbs: 23, protein: 11, fat: 13, fiber: 1 },
  "Frango com Catupiry GF": { calories: 215, carbs: 23, protein: 12, fat: 10, fiber: 1 },
  "Alcachofra GF": { calories: 205, carbs: 24, protein: 9, fat: 9, fiber: 2.5 },
  "Banana & Canela": { calories: 155, carbs: 27, protein: 2, fat: 4, fiber: 2 },
  "Romeu & Julieta": { calories: 185, carbs: 28, protein: 4, fat: 6, fiber: 1 },
  "Nutella & Morango": { calories: 220, carbs: 31, protein: 3, fat: 9, fiber: 2 },
  Brigadeiro: { calories: 210, carbs: 30, protein: 3, fat: 8, fiber: 1.5 },
  "Avelã & Chocolate Branco": { calories: 225, carbs: 31, protein: 3, fat: 10, fiber: 1.5 },
};

const categoryDescriptions: Record<PizzaCategory, string> = {
  Tradicionais: "Uma receita clássica, assada na hora sobre massa artesanal e pensada para dividir.",
  Especiais: "Uma combinação autoral de ingredientes selecionados para quem quer experimentar algo marcante.",
  Veganas: "Uma receita inteiramente vegetal, com sabor e textura construídos a partir de ingredientes frescos.",
  "Sem glúten": "Uma massa especial feita com ingredientes sem glúten, preparada para uma experiência mais inclusiva.",
  Doces: "Uma pizza brotinho para encerrar a refeição com uma combinação doce e afetiva.",
};

const allergensFor = (pizza: BasePizza) => {
  if (pizza.category === "Veganas") return ["Glúten"];
  if (pizza.category === "Sem glúten") return ["Leite"];
  if (pizza.category === "Doces")
    return pizza.name === "Banana & Canela" ? ["Glúten"] : ["Glúten", "Leite"];
  const allergens = ["Glúten", "Leite"];
  if (["Portuguesa", "Baiana"].includes(pizza.name)) allergens.push("Ovos");
  return allergens;
};

const ingredientsFor = (pizza: BasePizza) => {
  const base = pizza.category === "Sem glúten" ? "Massa especial sem glúten" : "Massa artesanal";
  return [base, ...pizza.ingredients.replace(/\.$/, "").split(/, | e /)];
};

import { slugifyPizza } from "@/lib/pizza-utils.mjs";

export const pizzas: Pizza[] = basePizzas.map((pizza) => ({
  ...pizza,
  slug: slugifyPizza(pizza.name),
  description: `${categoryDescriptions[pizza.category]} ${pizza.name} traz ${pizza.ingredients.toLowerCase()}`,
  slices: pizza.category === "Doces" ? 4 : pizza.category === "Sem glúten" ? 6 : 8,
  detailedIngredients: ingredientsFor(pizza),
  allergens: allergensFor(pizza),
  traceWarning:
    "Produzido em cozinha que também manipula trigo, leite, ovos, castanhas e outros alergênicos. Confirme a composição com a equipe antes de pedir.",
  nutrition: nutritionByPizza[pizza.name],
}));
