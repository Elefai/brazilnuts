import test from 'node:test';
import assert from 'node:assert/strict';
import {Engine} from './engine.mjs';
import {CampaignAgent} from './agent.mjs';
test('dashboard retains campaign history and attributes purchases to exact invitation',async()=>{
 const e=new Engine();e.command('occupancy',{value:20});e.command('batch');
 await new CampaignAgent(e,{apiKey:''}).run();
 const m=e.messages.find(m=>m.customerId);
 e.command('open-notification',{messageId:m.id,customerId:m.customerId});
 const {coupon}=e.command('buy',{key:'dashboard-test',messageId:m.id,customerId:m.customerId,version:m.offerVersion});
 assert.equal(coupon.messageId,m.id);
 for(let i=0;i<20;i++)e.recordCampaign({action:'send',customerIds:[],messageIds:[]});
 for(let i=0;i<20;i++)e.messages.push({id:'extra-'+i});
 e.command('occupancy',{value:40});
 assert.equal(e.campaigns.length,21);assert.ok(e.messages.some(n=>n.id===m.id));
 assert.ok(e.messages.length>15);
});
