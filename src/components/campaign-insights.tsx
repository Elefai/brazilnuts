import { Card, CardContent } from "@/components/ui/card";
import { useState } from "react";
import { Button } from "@/components/ui/button";

export function CampaignInsights({state:s}:{state:any}) {
  const [page,setPage]=useState(0);
  const campaigns=(s.campaigns||[]).filter((c:any)=>c.action==="send");
  const ids=new Set(campaigns.flatMap((c:any)=>c.messageIds||[]));
  const messages=s.messages.filter((m:any)=>ids.has(m.id));
  const bought=new Set(s.coupons.map((c:any)=>c.messageId).filter(Boolean));
  const stats=(list:any[])=>{
    const set=new Set(list.map(m=>m.id));
    const coupons=s.coupons.filter((c:any)=>set.has(c.messageId));
    return {sent:list.length,opened:list.filter(m=>m.openedAt!==undefined).length,bought:coupons.length,arrived:coupons.filter((c:any)=>c.status==='used').length};
  };
  const total=stats(messages);
  const rate=(n:number,d:number)=>d?Math.round(n/d*100)+'%':'—';
  const outcomes=[
    ['Comprados',messages.filter((m:any)=>bought.has(m.id)).length],
    ['Recusados',messages.filter((m:any)=>!bought.has(m.id)&&m.rejectedAt!==undefined).length],
    ['Prazo esgotado',messages.filter((m:any)=>!bought.has(m.id)&&m.rejectedAt===undefined&&m.acceptBy!==undefined&&s.now>=m.acceptBy).length],
    ['Aguardando',messages.filter((m:any)=>!bought.has(m.id)&&m.rejectedAt===undefined&&(m.acceptBy===undefined||s.now<m.acceptBy)).length]
  ] as [string,number][];
  const funnel=[['Enviados',total.sent],['Abertos',total.opened],['Comprados',total.bought],['Validados',total.arrived]] as [string,number][];
  const pages=Math.max(1,Math.ceil(campaigns.length/8)),current=Math.min(page,pages-1);
  const recent=[...campaigns].reverse().slice(current*8,current*8+8);
  return <Card id="results" className="dashboard-v2"><CardContent>
    <h2>Resultados da demonstração</h2><p>Totais do ciclo atual · reiniciar a demonstração zera os indicadores. Pagamentos e envios fictícios.</p>
    <div className="dash-kpis">{[['Convites',total.sent],['Compras',total.bought],['Chegadas',total.arrived],['Conversão',rate(total.bought,total.sent)]].map(([label,value])=><div key={label}><span>{label}</span><strong>{value}</strong></div>)}</div>
    {!total.sent?<p>Aguardando o primeiro envio automático.</p>:<div className="dash-charts">
      <section><h3>Do convite à chegada</h3><p>Percentual sobre os convites enviados</p>{funnel.map(([label,n])=><div className="dash-row" key={label}><div><b>{label}</b><span>{n} · {rate(n,total.sent)}</span></div><div className="dash-track"><i style={{width:100*n/total.sent+'%'}} /></div></div>)}</section>
      <section><h3>Decisão dos clientes</h3><p>Cada convite aparece em apenas um resultado</p>{outcomes.map(([label,n],i)=><div className="dash-row" key={label}><div><b>{label}</b><span>{n} · {rate(n,total.sent)}</span></div><div className={'dash-track outcome-'+i}><i style={{width:100*n/total.sent+'%'}} /></div></div>)}</section>
    </div>}
    <h3>Histórico de campanhas</h3><div className="dash-table"><table><thead><tr><th>Horário</th><th>Enviados</th><th>Abertos</th><th>Comprados</th><th>Validados</th></tr></thead><tbody>{recent.map((c:any)=>{
      const set=new Set(c.messageIds),t=stats(messages.filter((m:any)=>set.has(m.id)));
      return <tr key={c.id}><td>{new Date(c.at).toLocaleTimeString('pt-BR')}</td><td>{t.sent}</td><td>{t.opened}</td><td>{t.bought}</td><td>{t.arrived}</td></tr>;
    })}</tbody></table></div>
    <div className="dash-pagination"><Button variant="outline" disabled={!current} onClick={()=>setPage(current-1)}>Mais recentes</Button><span>{current+1} / {pages}</span><Button variant="outline" disabled={current>=pages-1} onClick={()=>setPage(current+1)}>Mais antigas</Button></div>
  </CardContent></Card>;
}
