import { contextFor } from './agent.mjs';
export class Simulation {
  constructor(engine) { this.engine=engine; this.enabled=false; this.elapsed=0; this.seen=new Map(); this.current=null; }
  set(enabled) { this.enabled=enabled; }
  snapshot() { return {enabled:this.enabled,elapsed:this.elapsed,customerId:this.current?.customerId,stage:[20,40,60,80][Math.floor(this.elapsed/90)%4]}; }
  tick() {
    if(!this.enabled)return;
    const e=this.engine;
    if(this.elapsed%90===0)e.command('occupancy',{value:this.snapshot().stage});
    this.elapsed++;
    if(!this.current){
      const m=[...e.messages].reverse().find(m=>m.customerId&&!this.seen.has(m.id));
      if(!m){
        if(contextFor(e).customers.length===0){
          e.command('reset');
          e.log('Novo ciclo da demonstração','Base fictícia renovada: 200 clientes. Resultados do ciclo anterior reiniciados.');
          this.seen.clear();this.elapsed=0;
        }
        return;
      }
      this.current={...m,start:this.elapsed,kind:this.seen.size%3};
      this.seen.set(m.id,true);
    }
    const c=this.current,age=this.elapsed-c.start,m=e.messages.find(m=>m.id===c.id);
    if(!m){this.current=null;return;}
    try{
      if(age>=4&&m.openedAt===undefined)e.command('open-notification',{messageId:m.id,customerId:m.customerId});
      if(age>=6&&!c.acted){
        c.acted=true;
        if(c.kind===0)e.command('buy',{messageId:m.id,customerId:m.customerId,key:'sim-'+m.id,version:m.offerVersion});
        if(c.kind===1)e.command('reject-notification',{messageId:m.id,customerId:m.customerId});
      }
      if(c.kind===0 && age>=10 && !c.arrived){
        c.arrived=true;
        const coupon=e.coupons.find(p=>p.key==='sim-'+m.id && p.status==='active');
        if(coupon) e.command('validate',{token:coupon.token});
      }
    }catch(error){e.log('Simulação: ação indisponível',error.message);}
    if(age>=(c.kind===0?15:c.kind===2?12:10))this.current=null;
  }
}
