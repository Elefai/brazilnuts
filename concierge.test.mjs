import {test} from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from './engine.mjs';
import {CampaignAgent} from './agent.mjs';
import {Concierge} from './concierge.mjs';
function setup(){let now=100000;const e=new Engine(()=>now),a=new CampaignAgent(e,{apiKey:''}),c=new Concierge(e,a,{clock:()=>now,settleMs:2,cooldownMs:60});return {e,a,c,tick:async(n=3)=>{now+=n;await c.tick()}};}
test('opens batch and sends without manual action; cooldown blocks repeat',async()=>{const {e,c,tick}=setup();e.command('occupancy',{value:24});await c.tick();await tick();assert.equal(e.stock,5);assert.equal(e.campaigns.length,1);await tick(20);assert.equal(e.campaigns.length,1);assert.equal(e.messages.filter(m=>m.customerId).length,5)});
test('disabled pilot does not release stock; high occupancy pauses',async()=>{const {e,a,c,tick}=setup();a.setAutomatic(false);e.command('occupancy',{value:20});await c.tick();await tick();assert.equal(e.stock,0);a.setAutomatic(true);await c.tick();await tick();assert.equal(e.stock,5);e.command('occupancy',{value:80});await tick();assert.equal(a.last.action,'pause');assert.equal(e.metrics().available,0)});
test('no eligible recipients prevents creating batches',async()=>{const {e,c,tick}=setup();e.customers.forEach(x=>x.consent=false);e.command('occupancy',{value:20});await c.tick();await tick();assert.equal(e.stock,0)});
test('sold-out lot refills after cooldown without changing purchased terms',async()=>{const {e,c,tick}=setup();e.command('occupancy',{value:20});await c.tick();await tick();for(let i=0;i<5;i++)e.command('buy',{version:e.version,key:crypto.randomUUID()});await tick(3);assert.equal(e.stock,0);await tick(60);assert.equal(e.stock,5);assert.equal(e.coupons[0].discount,50);assert.equal(e.campaigns.length,2)});
