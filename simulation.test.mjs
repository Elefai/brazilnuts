import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from './engine.mjs';
import {CampaignAgent} from './agent.mjs';
import {Simulation} from './simulation.mjs';
test('demo has 200 unique profiles and renews an exhausted audience',()=>{
 const e=new Engine(),sim=new Simulation(e);
 assert.equal(e.customers.length,200);
 assert.equal(new Set(e.customers.map(c=>c.id)).size,200);
 e.customers.forEach(c=>c.lastContact=e.now());
 sim.set(true);sim.tick();
 assert.ok(e.customers.every(c=>c.lastContact===null));
 assert.equal(sim.enabled,true);
});
test('simulation pauses movement and produces buy, reject and expiry',async()=>{
 const e=new Engine(); const sim=new Simulation(e);
 sim.tick(); assert.equal(e.metrics().occupied,80);
 sim.set(true);sim.tick();assert.equal(e.metrics().occupied,20);
 e.command('batch');await new CampaignAgent(e,{apiKey:''}).run();
 for(let i=0;i<72;i++){e.offset+=1000;sim.tick();}
 assert.ok(e.coupons.length>0);assert.ok(e.messages.some(m=>m.rejectedAt!==undefined));
 const arrived=e.coupons.find(c=>c.status==='used');
 assert.ok(arrived);
 assert.ok(e.tables[arrived.table-1]);
 assert.throws(()=>e.command('validate',{token:arrived.token}),/utilizado/);
 const rejected=e.messages.find(m=>m.rejectedAt!==undefined);
 assert.throws(()=>e.command('buy',{customerId:rejected.customerId,messageId:rejected.id,version:rejected.offerVersion,key:'rejected-test'}),/recusada/);
 const waiting=e.messages.find(m=>m.openedAt!==undefined&&!m.rejectedAt&&!e.coupons.some(c=>c.customerId===m.customerId));
 e.offset+=31000;
 assert.throws(()=>e.command('buy',{customerId:waiting.customerId,messageId:waiting.id,version:waiting.offerVersion,key:'expired-test'}),/5 segundos/);
 sim.set(false);const elapsed=sim.elapsed;sim.tick();assert.equal(sim.elapsed,elapsed);
});
