const {handler}=require('../netlify/functions/jobs.cjs');
(async()=>{
 let failures=0;
 for(const [provider,board] of [['greenhouse','cloudflare'],['lever','lever'],['ashby','ashby']]){
  const response=await handler({httpMethod:'GET',queryStringParameters:{provider,board}});
  const result=JSON.parse(response.body);
  console.log(JSON.stringify({provider,board,status:response.statusCode,count:result.jobs?.length,total:result.total,complete:result.complete,warnings:result.warnings,code:result.code,error:result.error}));
  if(response.statusCode!==200)failures++;
 }
 if(failures)process.exitCode=1;
})().catch(error=>{console.error(error.message);process.exitCode=1;});
