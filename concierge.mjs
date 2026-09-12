import { contextFor } from './agent.mjs';

// Server-owned loop: independent of browser tabs and manual batch buttons.
export class Concierge {
  constructor(engine,agent,{clock=Date.now,settleMs=2000,cooldownMs=60000}={}) {
    Object.assign(this,{engine,agent,clock,settleMs,cooldownMs});
    this.reset();
  }
  reset(){this.signature=null;this.changedAt=0;this.nextAt=0;this.running=false;}
  async tick(){
    const context=contextFor(this.engine); // Also processes coupon expirations.
    if(!this.agent.autoEnabled||this.agent.busy||this.running)return;
    const signature=JSON.stringify(context),now=this.clock();
    if(signature!==this.signature){this.signature=signature;this.changedAt=now;}
    if(!context.discount){
      if(this.agent.last?.action==='send') {
        this.agent.last={...this.agent.last,action:'pause',automatic:true,customerIds:[],message:null,at:this.engine.now(),reason:'Demanda em 75% ou mais: novos convites pausados.',notice:'Pausa aplicada pelo motor de regras.',source:'rules'};
        this.engine.log('Concierge: pausa automática','Ocupação e reservas atingiram o limite.');
      }
      return;
    }
    if(now-this.changedAt<this.settleMs||now<this.nextAt||!context.customers.length)return;
    this.running=true;this.nextAt=now+this.cooldownMs;
    try{
      if(!context.available){this.engine.command('batch');this.engine.log('Concierge: lote automático','Até 5 cupons liberados para a demanda atual.');}
      await this.agent.run({automatic:true});
    }catch(error){this.agent.recordAutoFailure(error);}
    finally{this.running=false;}
  }
}
