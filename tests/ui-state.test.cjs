const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const vm=require('node:vm');
function setup(saved=null){
 const elements=new Map(),listeners=new Map(),writes=[];let fail=false;
 function element(key){if(key==='dialog[open]')return [...elements.values()].find(v=>v.open)||null;const found=[...elements.values()].find(v=>key==='#'+v.id);if(found)return found;if(!elements.has(key))elements.set(key,{value:'',textContent:'',innerHTML:'',style:{},hidden:false,open:false,dataset:{},elements:{},classList:{toggle(){}},addEventListener(){},querySelectorAll(){return [];},before(){},append(){},prepend(){},setAttribute(){},remove(){},close(){this.open=false;},showModal(){this.open=true;},reset(){},parentElement:{before(){}}});return elements.get(key);}
 element('#jobForm').elements.description=element('description');
 const window={dispatchEvent(event){for(const fn of listeners.get(event.type)||[])fn(event);},addEventListener(type,fn){listeners.set(type,[...(listeners.get(type)||[]),fn]);},scrollTo(){}};
 const context=vm.createContext({structuredClone,URL,Event,console,crypto:require('node:crypto').webcrypto,FormData:class{constructor(form){this.form=form;}*[Symbol.iterator](){yield* Object.entries(this.form.fields||{});}},document:{body:element('body'),querySelector:element,querySelectorAll:()=>[],createElement:()=>element('created'+elements.size)},window,localStorage:{getItem:()=>saved,setItem:(key,value)=>{if(fail)throw Error('Quota exceeded');writes.push(value);}},setTimeout:()=>1,clearTimeout(){},setInterval:()=>1,clearInterval(){},confirm:()=>true,Blob,AbortController,URLSearchParams});
 for(const path of ['data.js','app.js','rules.js','review.js','discovery.js'])vm.runInContext(fs.readFileSync('dist/'+path,'utf8'),context,{filename:path});
 return {element,writes,context,fail:()=>{fail=true;},run:code=>vm.runInContext(code,context)};
}
test('Adding a job refreshes an already open matching panel',()=>{
 const s=setup();s.run("view('matching')");
 s.element('#jobForm').fields={role:'Cloud II',company:'Example',mode:'Remoto',url:'https://example.com/1',description:'Azure',location:'Brasil',notes:''};
 s.element('#jobForm').onsubmit({preventDefault(){},target:s.element('#jobForm')});
 assert.equal(s.run('state.jobs.length'),1);
 // The panel created by review.js is accessible by its assigned id.
 assert.match(s.element('#matching').innerHTML,/Cloud II/);assert.match(s.element('#matching').innerHTML,/Example/);
 assert.equal(s.run('state.jobs[0].company'),'Example');
});
test('Storage rejection rolls back a new job and does not report success',()=>{
 const s=setup();s.fail();s.element('#jobForm').fields={role:'Cloud II',company:'Example',mode:'Remoto',url:'https://example.com/1',description:'Azure'};
 s.element('#jobForm').onsubmit({preventDefault(){},target:s.element('#jobForm')});
 assert.equal(s.run('state.jobs.length'),0);assert.equal(s.writes.length,0);assert.match(s.element('#toast').textContent,/Não foi possível salvar/);
});
test('Malformed saved data is preserved rather than overwritten',()=>{const s=setup('{"jobs":[{}]}');assert.equal(s.run('loadFailure'),true);assert.equal(s.run('save()'),false);assert.equal(s.writes.length,0);});
test('Legacy restore initializes discovery and allows navigation',async()=>{
 const s=setup();const raw=s.run('JSON.stringify(defaults)');
 const target={files:[{size:raw.length,text:async()=>raw}],value:'backup.json'};
 await s.element('#restore').onchange({target});s.run("view('discovery')");
 assert.equal(s.run('state.discovery.sources.length'),0);assert.equal(s.element('#pageLabel').textContent,'Buscar oportunidades');
});
