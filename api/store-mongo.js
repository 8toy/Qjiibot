import { MongoClient } from 'mongodb';
import { chatKind } from './helper.js';
const SEEN_TTL=600000;
export function createMongoStore(uri,dbName='reaction-bot'){
 const client=new MongoClient(uri,{maxPoolSize:10,serverSelectionTimeoutMS:8000,connectTimeoutMS:8000});let dbPromise=null;const seen=new Map();
 async function db(){if(!dbPromise)dbPromise=client.connect().then(()=>client.db(dbName));try{return await dbPromise}catch(e){dbPromise=null;throw e;}}
 async function c(){const d=await db();return {chats:d.collection('chats'),settings:d.collection('chat_settings'),pending:d.collection('pending_settings'),connections:d.collection('connections'),requestUsers:d.collection('channel_request_users')};}
 return {
  async add(id,type,{force=false}={}){const kind=chatKind(type);if(!kind)return;const last=seen.get(id);if(!force&&last&&Date.now()-last<SEEN_TTL)return;const {chats}=await c();await chats.updateOne({_id:String(id)},{$set:{id:Number(id),kind}},{upsert:true});seen.set(id,Date.now());},
  async remove(id){const {chats,settings,connections}=await c();seen.delete(id);await chats.deleteOne({_id:String(id)});await settings.deleteOne({_id:String(id)});await connections.deleteMany({chat_id:Number(id)});},
  async setReactionsEnabled(id,v){const {settings}=await c();await settings.updateOne({_id:String(id)},{$set:{chat_id:Number(id),reactions_enabled:!!v}},{upsert:true});},
  async setReactions(id,v){const {settings}=await c();await settings.updateOne({_id:String(id)},{$set:{chat_id:Number(id),reactions:v||[]}},{upsert:true});},
  async resetReactions(id){const {settings}=await c();await settings.updateOne({_id:String(id)},{$unset:{reactions:''}},{upsert:true});},
  async getReactions(id){const {settings}=await c();return (await settings.findOne({_id:String(id)}))?.reactions||null;},
  async isReactionsEnabled(id){const {settings}=await c();return (await settings.findOne({_id:String(id)},{projection:{reactions_enabled:1}}))?.reactions_enabled!==false;},
  async setPending(userId,chatId,mode,payload=null,ttlMs=300000){const {pending}=await c();await pending.updateOne({_id:String(userId)},{$set:{user_id:Number(userId),chat_id:Number(chatId),mode,payload,expires_at:Date.now()+ttlMs}},{upsert:true});},
  async getPending(userId){const {pending}=await c();const r=await pending.findOne({_id:String(userId)});if(!r)return null;if(r.expires_at<Date.now()){await pending.deleteOne({_id:String(userId)});return null;}return {chatId:Number(r.chat_id),mode:r.mode,payload:r.payload??null};},
  async clearPending(userId){const {pending}=await c();await pending.deleteOne({_id:String(userId)});},
  async getGroupSettings(id){const {settings}=await c();return normalize(await settings.findOne({_id:String(id)}));},
  async updateGroupSettings(id,patch){const {settings}=await c();await settings.updateOne({_id:String(id)},{$set:{chat_id:Number(id),...patch}},{upsert:true});},
  async connect(userId,chatId,kind,title=''){const {connections}=await c();await connections.updateOne({_id:`${userId}:${chatId}`},{$set:{user_id:Number(userId),chat_id:Number(chatId),kind,title}},{upsert:true});},
  async addChannelRequestUser(userId){const {requestUsers}=await c();await requestUsers.updateOne({_id:String(userId)},{$setOnInsert:{user_id:Number(userId),first_seen:Date.now()}},{upsert:true});},
  async channelRequestCount(){const {requestUsers}=await c();return requestUsers.countDocuments();},
  async channelRequestIds(afterId=Number.MIN_SAFE_INTEGER,limit=1000000){const {requestUsers}=await c();const rows=await requestUsers.find({user_id:{$gt:Number(afterId)}},{projection:{user_id:1}}).sort({user_id:1}).limit(limit).toArray();return rows.map(x=>Number(x.user_id));},
  async disconnect(userId,chatId){const {connections}=await c();await connections.deleteOne({_id:`${userId}:${chatId}`});},
  async connections(userId,kind=null){const {connections}=await c();return connections.find({user_id:Number(userId),...(kind?{kind}:{})}).sort({title:1}).toArray();},
  async counts(){const {chats}=await c();const rows=await chats.aggregate([{$group:{_id:'$kind',n:{$sum:1}}}]).toArray();const x={users:0,groups:0,channels:0};for(const r of rows)if(r._id in x)x[r._id]=r.n;return x;},
  async ids(kinds,afterId=Number.MIN_SAFE_INTEGER,limit=1000000){const {chats}=await c();const rows=await chats.find({kind:{$in:kinds},id:{$gt:Number(afterId)}},{projection:{id:1}}).sort({id:1}).limit(limit).toArray();return rows.map(r=>Number(r.id));},
  async close(){await client.close()}
 };
}
function normalize(r){return {reactions_enabled:r?.reactions_enabled!==false,reactions:Array.isArray(r?.reactions)?r.reactions:null,welcome_enabled:r?.welcome_enabled!==false,welcome_mode:r?.welcome_mode||'group',welcome_message:r?.welcome_message||'',welcome_buttons:Array.isArray(r?.welcome_buttons)?r.welcome_buttons:[],join_enabled:r?.join_enabled===true,join_mode:r?.join_mode||'notify',join_message:r?.join_message||'',join_buttons:Array.isArray(r?.join_buttons)?r.join_buttons:[],required_channel_id:r?.required_channel_id?Number(r.required_channel_id):null,required_channel_url:r?.required_channel_url||''};}
