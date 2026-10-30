const base='https://enchanting-dodol-a1c6a0.netlify.app';
const delay=ms=>new Promise(resolve=>setTimeout(resolve,ms));
(async()=>{
 for(let attempt=1;attempt<=12;attempt++){
  try{
   const file=await fetch(base+'/data.js',{signal:AbortSignal.timeout(10000),cache:'no-store'});
   const code=await file.text();
   if(!file.ok||!code.includes('CareerData'))throw Error('A revisão ainda não está publicada (HTTP '+file.status+')');
   const response=await fetch(base+'/.netlify/functions/jobs?provider=greenhouse&board=cloudflare',{signal:AbortSignal.timeout(22000)});
   const data=await response.json();
   if(!response.ok)throw Error(data.error||'A função respondeu HTTP '+response.status);
   if(!Array.isArray(data.jobs)||typeof data.complete!=='boolean')throw Error('A função ainda não é a versão revisada');
   console.log(JSON.stringify({production:base,status:response.status,count:data.jobs.length,complete:data.complete,warnings:data.warnings}));
   return;
  }catch(error){console.log('Tentativa '+attempt+': '+error.message);}
  if(attempt<12)await delay(15000);
 }
 process.exitCode=1;
})();
