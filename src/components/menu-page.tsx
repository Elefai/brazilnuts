import { useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  ChevronRight,
  Clock3,
  Leaf,
  MapPin,
  Pizza as PizzaIcon,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { pizzaCategories, pizzas, type Pizza, type PizzaCategory } from "@/data/pizzas";

const money = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
  maximumFractionDigits: 0,
});

const price = (pizza: Pizza) => `${money.format(pizza.priceMin)} – ${money.format(pizza.priceMax)}`;

export function MenuPage() {
  const [category, setCategory] = useState<PizzaCategory | "Todos">("Todos");

  useEffect(() => {
    document.title = "Cardápio de pizzas · BrazilNuts";
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute(
        "content",
        "Cardápio digital de pizzas artesanais: sabores tradicionais, especiais, veganos, sem glúten e doces.",
      );
  }, []);

  const shownCategories = useMemo(
    () => (category === "Todos" ? pizzaCategories : [category]),
    [category],
  );
  const featured = pizzas.find((pizza) => pizza.name === "Calabresa")!;

  const chooseCategory = (next: PizzaCategory | "Todos") => {
    setCategory(next);
    requestAnimationFrame(() =>
      document.getElementById("pizzas")?.scrollIntoView({ behavior: "smooth", block: "start" }),
    );
  };

  return (
    <div className="menu-page">
      <header className="menu-header">
        <a className="menu-brand" href="/" aria-label="Voltar para BrazilNuts">
          <span><Leaf size={19} /></span>
          brazilnuts<sup>®</sup>
        </a>
        <nav aria-label="Categorias do cardápio" className="menu-nav">
          {pizzaCategories.map((item) => (
            <button key={item} onClick={() => chooseCategory(item)}>
              {item}
            </button>
          ))}
        </nav>
        <a className="menu-back" href="/">
          <ArrowLeft size={15} /> Voltar ao painel
        </a>
      </header>

      <main>
        <section className="menu-hero">
          <div>
            <p className="menu-eyebrow"><Sparkles size={13} /> PIZZARIA LAB · SÃO PAULO</p>
            <h1>Pizza feita no tempo certo.</h1>
            <p className="menu-intro">
              Sabores clássicos, especiais e inclusivos para transformar qualquer pausa em um bom encontro.
            </p>
            <div className="menu-meta">
              <span><MapPin size={14} /> Pinheiros, São Paulo</span>
              <span><Clock3 size={14} /> Ter–Dom · 18h–23h</span>
            </div>
            <Button onClick={() => chooseCategory("Todos")}>
              Ver cardápio <ChevronRight size={15} />
            </Button>
          </div>
          <article className="featured-pizza">
            <img src={featured.image} alt={featured.alt} />
            <div>
              <Badge>MAIS PEDIDA</Badge>
              <h2>{featured.name}</h2>
              <p>{featured.ingredients}</p>
              <b>{price(featured)}</b>
            </div>
          </article>
        </section>

        <section id="pizzas" className="menu-catalog" aria-labelledby="menu-title">
          <div className="menu-section-heading">
            <div>
              <p className="menu-eyebrow">ESCOLHA SEU SABOR</p>
              <h2 id="menu-title">Nosso cardápio</h2>
            </div>
            <div className="category-filter" role="group" aria-label="Filtrar categoria">
              <button className={category === "Todos" ? "active" : ""} onClick={() => chooseCategory("Todos")}>Todos</button>
              {pizzaCategories.map((item) => (
                <button key={item} className={category === item ? "active" : ""} onClick={() => chooseCategory(item)}>
                  {item}
                </button>
              ))}
            </div>
          </div>

          {shownCategories.map((item) => (
            <section id={item.toLowerCase().replace(" ", "-")} className="pizza-category" key={item} aria-labelledby={`${item}-title`}>
              <div className="category-title">
                <span><PizzaIcon size={17} /></span>
                <div>
                  <h3 id={`${item}-title`}>{item}</h3>
                  <p>{categoryDescription(item)}</p>
                </div>
              </div>
              <div className="pizza-grid">
                {pizzas.filter((pizza) => pizza.category === item).map((pizza) => <PizzaCard key={pizza.name} pizza={pizza} />)}
              </div>
            </section>
          ))}
        </section>
      </main>

      <footer className="menu-footer">
        <div className="menu-brand"><span><Leaf size={17} /></span> brazilnuts<sup>®</sup></div>
        <p>Feito para compartilhar bons momentos. Preços e disponibilidade demonstrativos.</p>
        <div><span>Instagram</span><span>WhatsApp</span><span>Contato</span></div>
      </footer>
    </div>
  );
}

function PizzaCard({ pizza }: { pizza: Pizza }) {
  return (
    <Card className="pizza-card">
      <div className="pizza-image-wrap">
        <img src={pizza.image} alt={pizza.alt} loading="lazy" />
        {pizza.featured && <Badge>MAIS PEDIDA</Badge>}
        {pizza.category === "Veganas" && <Badge variant="secondary">VEGANA</Badge>}
        {pizza.category === "Sem glúten" && <Badge variant="secondary">SEM GLÚTEN</Badge>}
      </div>
      <CardContent>
        <div className="pizza-card-top"><h4>{pizza.name}</h4><b>{price(pizza)}</b></div>
        <p>{pizza.ingredients}</p>
        <small>{pizza.portion}</small>
      </CardContent>
    </Card>
  );
}

function categoryDescription(category: PizzaCategory) {
  return {
    Tradicionais: "Os clássicos que sempre pedem mais uma fatia.",
    Especiais: "Ingredientes marcantes para quem quer sair do comum.",
    Veganas: "Receitas inteiras à base de plantas, cheias de sabor.",
    "Sem glúten": "Massas especiais, feitas para acolher todos à mesa.",
    Doces: "O final perfeito para a noite.",
  }[category];
}
