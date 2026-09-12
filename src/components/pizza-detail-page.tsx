import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Flame,
  Info,
  Leaf,
  Pizza as PizzaIcon,
  Salad,
  Scale,
  Wheat,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pizzas, type NutritionEstimate, type Pizza } from "@/data/pizzas";
import { findPizzaBySlug, nutritionForWholePizza } from "@/lib/pizza-utils.mjs";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const price = (pizza: Pizza) =>
  `${money.format(pizza.priceMin)} – ${money.format(pizza.priceMax)}`;

type Serving = "slice" | "whole";

export function PizzaDetailPage({ slug }: { slug: string }) {
  const pizza = findPizzaBySlug(pizzas, slug) as Pizza | undefined;

  useEffect(() => {
    const title = pizza
      ? `${pizza.name} · Informações nutricionais · BrazilNuts`
      : "Pizza não encontrada · BrazilNuts";
    const description = pizza
      ? `${pizza.name}: ingredientes, porção, alérgenos e estimativas nutricionais por fatia.`
      : "Volte ao cardápio digital BrazilNuts para escolher sua pizza.";
    document.title = title;
    document.querySelector('meta[name="description"]')?.setAttribute("content", description);
  }, [pizza]);

  if (!pizza) return <PizzaNotFound />;
  return <PizzaDetails pizza={pizza} />;
}

function PizzaDetails({ pizza }: { pizza: Pizza }) {
  const [serving, setServing] = useState<Serving>("slice");
  const nutrition = useMemo(
    () =>
      serving === "slice"
        ? pizza.nutrition
        : (nutritionForWholePizza(pizza.nutrition, pizza.slices) as NutritionEstimate),
    [pizza, serving],
  );
  const unit = serving === "slice" ? "por fatia" : "pizza inteira";

  return (
    <div className="pizza-detail-page">
      <header className="detail-header">
        <a className="menu-brand" href="/cardapio" aria-label="Voltar ao cardápio">
          <span><Leaf size={19} /></span>
          brazilnuts<sup>®</sup>
        </a>
        <a className="detail-back" href="/cardapio">
          <ArrowLeft size={15} /> Voltar ao cardápio
        </a>
      </header>

      <main className="detail-main">
        <a className="detail-breadcrumb" href="/cardapio">
          <ArrowLeft size={14} /> Cardápio <span>/</span> {pizza.category}
        </a>
        <section className="detail-hero" aria-labelledby="pizza-title">
          <div className="detail-image-wrap">
            <img src={pizza.image} alt={pizza.alt} />
            {pizza.featured && <Badge>MAIS PEDIDA</Badge>}
          </div>
          <div className="detail-summary">
            <div className="detail-badges">
              <Badge variant="outline">{pizza.category}</Badge>
              {pizza.category === "Veganas" && <Badge variant="secondary">VEGANA</Badge>}
              {pizza.category === "Sem glúten" && <Badge variant="secondary">SEM GLÚTEN</Badge>}
            </div>
            <h1 id="pizza-title">{pizza.name}</h1>
            <p>{pizza.description}</p>
            <div className="detail-price-row">
              <div><small>A partir de</small><b>{price(pizza)}</b></div>
              <span><PizzaIcon size={15} /> {pizza.portion} · {pizza.slices} fatias</span>
            </div>
          </div>
        </section>

        <section className="nutrition-section" aria-labelledby="nutrition-title">
          <div className="detail-section-heading">
            <div>
              <p className="menu-eyebrow">INFORMAÇÃO NUTRICIONAL</p>
              <h2 id="nutrition-title">Uma escolha mais informada.</h2>
              <p>Estimativas calculadas a partir de receitas-modelo. O preparo pode alterar os valores.</p>
            </div>
            <div className="serving-toggle" role="group" aria-label="Unidade nutricional">
              <button className={serving === "slice" ? "active" : ""} onClick={() => setServing("slice")} aria-pressed={serving === "slice"}>Por fatia</button>
              <button className={serving === "whole" ? "active" : ""} onClick={() => setServing("whole")} aria-pressed={serving === "whole"}>Pizza inteira</button>
            </div>
          </div>
          <div className="nutrition-grid">
            <NutritionCard icon={<Flame size={18} />} label="Calorias" value={`${nutrition.calories} kcal`} unit={unit} accent />
            <NutritionCard icon={<Wheat size={18} />} label="Carboidratos" value={`${nutrition.carbs} g`} unit={unit} />
            <NutritionCard icon={<Salad size={18} />} label="Proteínas" value={`${nutrition.protein} g`} unit={unit} />
            <NutritionCard icon={<Scale size={18} />} label="Gorduras totais" value={`${nutrition.fat} g`} unit={unit} />
            <NutritionCard icon={<Leaf size={18} />} label="Fibras" value={`${nutrition.fiber} g`} unit={unit} />
          </div>
        </section>

        <section className="detail-info-grid" aria-label="Ingredientes e avisos">
          <Card className="detail-info-card">
            <CardContent>
              <div className="detail-card-title"><PizzaIcon size={17} /><h2>Ingredientes</h2></div>
              <p>Receita-modelo para uma pizza {pizza.portion.toLowerCase()}.</p>
              <ul className="ingredient-list">
                {pizza.detailedIngredients.map((ingredient) => <li key={ingredient}>{ingredient}</li>)}
              </ul>
            </CardContent>
          </Card>
          <Card className="detail-info-card allergen-card">
            <CardContent>
              <div className="detail-card-title"><AlertTriangle size={17} /><h2>Alérgenos e restrições</h2></div>
              <p>Contém:</p>
              <div className="allergen-tags">
                {pizza.allergens.map((allergen) => <Badge key={allergen} variant="outline">{allergen}</Badge>)}
              </div>
              <div className="trace-warning"><Info size={15} /><span>{pizza.traceWarning}</span></div>
            </CardContent>
          </Card>
        </section>

        <aside className="detail-disclaimer">
          <Info size={17} />
          <p><b>Estimativa nutricional.</b> Estes dados são informativos e foram calculados com base em receitas-modelo e composição de ingredientes. Não substituem informação nutricional oficial ou orientação profissional.</p>
        </aside>
      </main>
      <footer className="menu-footer"><div className="menu-brand"><span><Leaf size={17} /></span> brazilnuts<sup>®</sup></div><p>Preços, disponibilidade e valores nutricionais demonstrativos.</p></footer>
    </div>
  );
}

function NutritionCard({ icon, label, value, unit, accent = false }: { icon: ReactNode; label: string; value: string; unit: string; accent?: boolean }) {
  return <Card className={accent ? "nutrition-card accent" : "nutrition-card"}><CardContent><span>{icon}</span><small>{label}</small><b>{value}</b><p>{unit}</p></CardContent></Card>;
}

function PizzaNotFound() {
  return (
    <main className="pizza-not-found">
      <span><PizzaIcon size={27} /></span>
      <p className="menu-eyebrow">CARDÁPIO BRAZILNUTS</p>
      <h1>Essa pizza não está no forno.</h1>
      <p>Volte ao cardápio para escolher uma das receitas disponíveis.</p>
      <Button asChild><a href="/cardapio">Ver cardápio</a></Button>
    </main>
  );
}
