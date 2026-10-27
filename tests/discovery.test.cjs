const test=require('node:test'),assert=require('node:assert/strict');
const {normalize,handler}=require('../netlify/functions/jobs.cjs');
test('Greenhouse normalizes and deduplicates public jobs',()=>{
 const rows=normalize('greenhouse','acme',{jobs:[{id:1,title:'Cloud Engineer',absolute_url:'https://example.com/jobs/1',location:{name:'Brazil'},content:'<p>Azure</p>'},{id:2,title:'Cloud Engineer',absolute_url:'https://example.com/jobs/1'}]},'now');
 assert.equal(rows.length,1);assert.equal(rows[0].location,'Brazil');assert.equal(rows[0].description,'Azure');assert.equal(rows[0].mode,'Não informado');
});
test('Lever preserves remote restriction and timestamp',()=>{
 const rows=normalize('lever','acme',[{id:'a',text:'SRE',hostedUrl:'https://example.com/1',categories:{location:'US only'},workplaceType:'remote',createdAt:1700000000000}],'now');
 assert.equal(rows[0].mode,'Remoto');assert.equal(rows[0].location,'US only');assert.equal(rows[0].publishedAt,'2023-11-14T22:13:20.000Z');
});
test('Ashby excludes unlisted jobs and unsafe URLs',()=>{
 assert.equal(normalize('ashby','acme',{jobs:[{title:'a',jobUrl:'javascript:alert(1)'},{title:'b',jobUrl:'https://example.com/2',isListed:false}]},'now').length,0);
});
test('Reject malformed upstream',()=>assert.throws(()=>normalize('ashby','acme',{},'now')));
test('Reject arbitrary outbound destinations',async()=>{
 for(const query of [{provider:'unknown',board:'a'},{provider:'greenhouse',board:'../../internal'},{provider:'__proto__',board:'a'}]){
 assert.equal((await handler({httpMethod:'GET',queryStringParameters:query})).statusCode,400);
 }
});
test('Read only endpoint',async()=>assert.equal((await handler({httpMethod:'POST'})).statusCode,405));
