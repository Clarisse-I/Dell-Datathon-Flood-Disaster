import sharp from 'sharp';
import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
test('two distinct real photos reach model; malformed and unavailable model fail honestly',async()=>{
 process.env.QWEN_BASE_URL='http://model.test/v1';process.env.QWEN_MODEL='qwen3-vl-8b-instruct';process.env.QWEN_API_KEY='test-only-key';
 const nativeFetch=globalThis.fetch;const received=[];let mode='ok';
 globalThis.fetch=async(url,options)=>{
  if(!String(url).startsWith('http://model.test'))return nativeFetch(url,options);
  assert.equal(options.headers.Authorization,'Bearer test-only-key');if(mode==='auth')return new Response('{}',{status:401});if(String(url).endsWith('/models'))return Response.json({data:[{id:'Qwen/Qwen3-VL-8B-Instruct'}]});
  const payload=JSON.parse(options.body);assert.equal(payload.model,'Qwen/Qwen3-VL-8B-Instruct');received.push(payload);
  if(mode==='offline')throw Error('offline');
  return Response.json({choices:[{message:{content:mode==='bad'?'invalid json':payload.messages[0].content.includes('plain text')?'This is a test-only answer tied to the attached image.':JSON.stringify({observations:['Test model output'],actions:['Test verification action']})}}]});
 };
 const {app}=await import('./server.mjs');const server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const origin=`http://127.0.0.1:${server.address().port}`;
 async function post(name){const bytes=await readFile(new URL('../frontend/public/samples/'+name,import.meta.url));const body=new FormData();body.append('images',new Blob([bytes],{type:name.endsWith('.jpg')?'image/jpeg':'image/png'}),name);body.append('human_notes','Entrance on right');return {response:await nativeFetch(origin+'/api/analyze',{method:'POST',body}),bytes};}
 try{assert.equal((await(await nativeFetch(origin+'/api/health')).json()).connected,true);
 for(const name of ['AF001.jpg','HC001.png']){const {response,bytes}=await post(name);assert.equal(response.status,200);const content=received.at(-1).messages[1].content;assert.equal(content[1].image_url.url.split(',')[1],(await sharp(bytes).rotate().resize(1280,1280,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer()).toString('base64'));assert.match(content[0].text,/Entrance on right/);}
 assert.notEqual(received[0].messages[1].content[1].image_url.url,received[1].messages[1].content[1].image_url.url);
  const questionBody=new FormData();const questionBytes=await readFile(new URL('../frontend/public/samples/HC001.png',import.meta.url));questionBody.append('images',new Blob([questionBytes],{type:'image/png'}),'HC001.png');questionBody.append('question','What is near the river?');questionBody.append('history',JSON.stringify([{role:'user',content:'Earlier question'},{role:'assistant',content:'Earlier answer'}]));const qr=await nativeFetch(origin+'/api/question',{method:'POST',body:questionBody});assert.equal(qr.status,200);assert.match((await qr.json()).answer,/test-only/);const messages=received.at(-1).messages;assert.equal(messages[1].content,'Earlier question');assert.equal(messages[2].content,'Earlier answer');assert.match(messages.at(-1).content[1].image_url.url,/^data:image\/jpeg;base64,/);assert.equal(messages.at(-1).content[1].image_url.url.split(',')[1],(await sharp(questionBytes).rotate().resize(1280,1280,{fit:'inside',withoutEnlargement:true}).jpeg({quality:85}).toBuffer()).toString('base64'));
 mode='bad';assert.equal((await post('AF001.jpg')).response.status,502);mode='offline';assert.equal((await post('HC001.png')).response.status,502);
 const body=new FormData();body.append('images',new Blob(['not an image'],{type:'image/png'}),'fake.png');assert.equal((await nativeFetch(origin+'/api/analyze',{method:'POST',body})).status,400);
 mode='auth';const auth=await nativeFetch(origin+'/api/health');assert.equal(auth.status,503);assert.equal((await auth.json()).code,'MODEL_AUTH');
 }finally{server.close();globalThis.fetch=nativeFetch;}
});
