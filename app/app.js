const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORAGE='musyfit.v9';
const defaults={
  version:9,onboard:false,name:'Atleta',gender:'Homem',age:30,level:'Iniciante',goal:'Ganhar massa',days:4,place:'Academia',minutesTarget:50,
  equipment:['Máquinas','Cabos','Halteres','Barra'],weight:75,height:175,waist:85,chest:95,arm:32,hip:95,thigh:55,
  workouts:0,records:0,totalMinutes:0,streak:0,tab:'home',weeklyNotifications:true,restDefault:90,
  history:[],assessments:[],completed:{},seriesProgress:{},loads:{},favorites:[],coachHistory:[],apiUrl:'',lastWorkoutDate:null,activeWorkout:null,activeRest:null,cycleStartWorkouts:0,cycleLength:4
};
let previousKey=['musyfit.v9','musyfit.v8','musyfit.v7','musyfit.v6','musyfit.v5','musyfit.v4','musyfit.v3','musyfit.v2','musyfit'].find(k=>localStorage.getItem(k));
let previous=previousKey?JSON.parse(localStorage.getItem(previousKey)||'{}'):{};
let state=Object.assign({},defaults,JSON.parse(localStorage.getItem(STORAGE)||'{}'));
if(!localStorage.getItem(STORAGE)&&previousKey){
 state=Object.assign({},defaults,previous,{version:9,place:'Academia',activeWorkout:null,activeRest:null,seriesProgress:{},completed:{},cycleStartWorkouts:previous.workouts||0});
}
state.version=9;state.place='Academia';state.equipment=['Máquinas','Cabos','Halteres','Barra'];
state.seriesProgress=state.seriesProgress||{};
const save=()=>localStorage.setItem(STORAGE,JSON.stringify(state));
const esc=s=>String(s??'').replace(/[&<>"']/g,m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const today=()=>new Date().toISOString().slice(0,10);
const fmtMin=n=>`${Math.floor(n/60)}h${String(n%60).padStart(2,'0')}`;

// Biblioteca V6 revisada: somente exercícios adequados ao ambiente de academia.
// kind: reps = repetições, seconds = tempo, minutes = cardio.
const LIB=[
 {id:'squat',n:'Agachamento livre',m:'Quadríceps • Glúteos • Core',eq:'Barra',cat:'Pernas',kind:'reps',cue:'Pés firmes, joelhos acompanhando a linha dos pés, coluna neutra e descida controlada.'},
 {id:'hack',n:'Agachamento Hack',m:'Quadríceps • Glúteos',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Mantenha costas apoiadas, pés estáveis e não trave os joelhos no topo.'},
 {id:'legpress',n:'Leg press 45°',m:'Quadríceps • Glúteos',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Lombar apoiada, joelhos alinhados aos pés e amplitude sem retirar o quadril do banco.'},
 {id:'ext',n:'Cadeira extensora',m:'Quadríceps',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Ajuste o eixo ao joelho, suba sem impulso e controle a descida.'},
 {id:'flex',n:'Mesa flexora',m:'Posterior de coxa',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Quadril apoiado, joelhos alinhados ao eixo e movimento sem tirar o quadril do banco.'},
 {id:'seatedcurl',n:'Flexora sentada',m:'Posterior de coxa',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Mantenha quadril e costas apoiados e flexione os joelhos de forma controlada.'},
 {id:'rdl',n:'Levantamento romeno',m:'Posterior • Glúteos',eq:'Barra/Halteres',cat:'Pernas',kind:'reps',cue:'Quadril vai para trás, joelhos levemente flexionados, coluna neutra e carga próxima ao corpo.'},
 {id:'hipthrust',n:'Hip thrust',m:'Glúteos • Posterior',eq:'Barra/Máquina',cat:'Pernas',kind:'reps',cue:'Queixo levemente recolhido, costelas controladas e finalize contraindo glúteos sem hiperestender a lombar.'},
 {id:'adductor',n:'Cadeira adutora',m:'Adutores',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Mantenha tronco apoiado e feche as pernas com controle, sem bater as placas.'},
 {id:'abductor',n:'Cadeira abdutora',m:'Glúteo médio',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Tronco estável e abertura controlada, evitando impulso.'},
 {id:'calf',n:'Panturrilha na máquina',m:'Panturrilhas',eq:'Máquina',cat:'Pernas',kind:'reps',cue:'Use amplitude confortável, pause no alto e controle totalmente a descida.'},

 {id:'bench',n:'Supino reto com barra',m:'Peitoral • Tríceps • Ombro anterior',eq:'Barra',cat:'Peito',kind:'reps',cue:'Pés firmes, escápulas para trás e para baixo, punhos alinhados e descida controlada.'},
 {id:'dbbench',n:'Supino reto com halteres',m:'Peitoral • Tríceps',eq:'Halteres',cat:'Peito',kind:'reps',cue:'Escápulas estáveis, halteres sob controle e cotovelos em ângulo confortável.'},
 {id:'incline',n:'Supino inclinado com halteres',m:'Peitoral superior • Tríceps',eq:'Halteres',cat:'Peito',kind:'reps',cue:'Banco moderadamente inclinado, ombros baixos e movimento controlado.'},
 {id:'chestpress',n:'Chest press',m:'Peitoral • Tríceps',eq:'Máquina',cat:'Peito',kind:'reps',cue:'Ajuste o banco para as manoplas ficarem na linha do peito e mantenha costas apoiadas.'},
 {id:'pecdeck',n:'Peck deck',m:'Peitoral',eq:'Máquina',cat:'Peito',kind:'reps',cue:'Cotovelos alinhados, ombros baixos e feche sem perder o apoio das costas.'},
 {id:'cablefly',n:'Crossover no cabo',m:'Peitoral',eq:'Cabos',cat:'Peito',kind:'reps',cue:'Tronco firme, cotovelos levemente flexionados e mãos aproximando-se à frente do peito.'},

 {id:'pulldown',n:'Puxada frontal',m:'Dorsais • Bíceps',eq:'Cabos/Máquina',cat:'Costas',kind:'reps',cue:'Peito aberto, ombros baixos e puxe a barra à frente sem jogar o tronco para trás.'},
 {id:'row',n:'Remada baixa',m:'Costas • Bíceps',eq:'Cabos',cat:'Costas',kind:'reps',cue:'Coluna neutra, peito aberto e cotovelos indo para trás sem embalo.'},
 {id:'chestrow',n:'Remada máquina com apoio',m:'Costas • Bíceps',eq:'Máquina',cat:'Costas',kind:'reps',cue:'Peito apoiado, ombros longe das orelhas e cotovelos conduzindo o movimento.'},
 {id:'onearm',n:'Remada unilateral com halter',m:'Dorsais • Bíceps',eq:'Halter',cat:'Costas',kind:'reps',cue:'Tronco firme e puxe o cotovelo em direção ao quadril, sem girar o corpo.'},
 {id:'tbar',n:'Remada T',m:'Costas • Bíceps',eq:'Máquina/Barra',cat:'Costas',kind:'reps',cue:'Mantenha coluna neutra, abdômen firme e puxe sem usar impulso do quadril.'},
 {id:'straightpull',n:'Pulldown braços retos',m:'Dorsais',eq:'Cabos',cat:'Costas',kind:'reps',cue:'Cotovelos quase estendidos, costelas controladas e leve as mãos em direção às coxas.'},
 {id:'facepull',n:'Face pull',m:'Deltoide posterior • Trapézio médio',eq:'Cabos',cat:'Costas',kind:'reps',cue:'Puxe a corda em direção ao rosto, abrindo as mãos e mantendo ombros baixos.'},

 {id:'ohp',n:'Desenvolvimento com halteres',m:'Ombros • Tríceps',eq:'Halteres',cat:'Ombros',kind:'reps',cue:'Abdômen firme, punhos sobre os cotovelos e sem exagerar o arco lombar.'},
 {id:'machinepress',n:'Desenvolvimento na máquina',m:'Ombros • Tríceps',eq:'Máquina',cat:'Ombros',kind:'reps',cue:'Ajuste o banco para as pegadas iniciarem próximas à linha dos ombros e mantenha costas apoiadas.'},
 {id:'lateral',n:'Elevação lateral',m:'Deltoide lateral',eq:'Halteres',cat:'Ombros',kind:'reps',cue:'Cotovelos levemente flexionados, suba sem encolher os ombros e controle a descida.'},
 {id:'cablelat',n:'Elevação lateral no cabo',m:'Deltoide lateral',eq:'Cabos',cat:'Ombros',kind:'reps',cue:'Tronco imóvel e braço subindo lateralmente com controle.'},
 {id:'reversefly',n:'Crucifixo inverso máquina',m:'Deltoide posterior • Costas',eq:'Máquina',cat:'Ombros',kind:'reps',cue:'Peito apoiado e braços abrindo sem elevar os ombros.'},

 {id:'curl',n:'Rosca direta',m:'Bíceps',eq:'Barra',cat:'Braços',kind:'reps',cue:'Cotovelos próximos ao corpo, punhos neutros e sem embalo do tronco.'},
 {id:'inclinecurl',n:'Rosca inclinada',m:'Bíceps',eq:'Halteres',cat:'Braços',kind:'reps',cue:'Ombros apoiados no banco e cotovelos permanecendo atrás do tronco.'},
 {id:'hammer',n:'Rosca martelo',m:'Bíceps • Braquial • Antebraço',eq:'Halteres',cat:'Braços',kind:'reps',cue:'Pegada neutra, cotovelos estáveis e movimento sem balanço.'},
 {id:'preacher',n:'Rosca Scott',m:'Bíceps',eq:'Máquina/Barra',cat:'Braços',kind:'reps',cue:'Braços apoiados e extensão controlada, sem tirar os cotovelos do suporte.'},
 {id:'pushdown',n:'Tríceps na corda',m:'Tríceps',eq:'Cabos',cat:'Braços',kind:'reps',cue:'Cotovelos junto ao corpo, estenda até o final sem mover os ombros.'},
 {id:'barpushdown',n:'Tríceps na barra',m:'Tríceps',eq:'Cabos',cat:'Braços',kind:'reps',cue:'Tronco estável e cotovelos fixos enquanto estende os braços.'},
 {id:'overtri',n:'Tríceps francês com halter',m:'Tríceps',eq:'Halter',cat:'Braços',kind:'reps',cue:'Cotovelos apontados para frente, abdômen firme e amplitude confortável.'},

 {id:'cablecrunch',n:'Abdominal no cabo',m:'Reto abdominal',eq:'Cabos',cat:'Core',kind:'reps',cue:'Flexione o tronco aproximando costelas da pelve, sem puxar apenas com os braços.'},
 {id:'abmachine',n:'Abdominal na máquina',m:'Reto abdominal',eq:'Máquina',cat:'Core',kind:'reps',cue:'Ajuste o equipamento e faça a flexão do tronco sem impulso.'},
 {id:'kneeraise',n:'Elevação de joelhos',m:'Abdômen • Flexores do quadril',eq:'Estação',cat:'Core',kind:'reps',cue:'Evite balanço e eleve os joelhos mantendo abdômen ativo.'},
 {id:'pallof',n:'Pallof press',m:'Core anti-rotação',eq:'Cabos',cat:'Core',kind:'reps',cue:'Fique de lado para o cabo e estenda os braços sem deixar o tronco girar.'},
 {id:'plank',n:'Prancha',m:'Core',eq:'Colchonete',cat:'Core',kind:'seconds',cue:'Corpo alinhado, abdômen e glúteos ativos e respiração normal.'},

 {id:'treadmill',n:'Esteira',m:'Condicionamento cardiorrespiratório',eq:'Cardio',cat:'Cardio',kind:'minutes',cue:'Use ritmo sustentável e postura ereta. Reduza a intensidade se perder o controle da respiração.'},
 {id:'bike',n:'Bicicleta ergométrica',m:'Condicionamento • Pernas',eq:'Cardio',cat:'Cardio',kind:'minutes',cue:'Ajuste o banco para não comprimir demais os joelhos e mantenha cadência confortável.'},
 {id:'elliptical',n:'Elíptico',m:'Condicionamento de baixo impacto',eq:'Cardio',cat:'Cardio',kind:'minutes',cue:'Mantenha tronco ereto, passada contínua e intensidade progressiva.'},

 {id:'mobilityhips',n:'Mobilidade de quadril',m:'Quadril • Tornozelos',eq:'Área funcional',cat:'Mobilidade',kind:'seconds',cue:'Movimentos lentos, sem forçar amplitude dolorosa; mantenha apoio estável.'},
 {id:'mobilityshoulder',n:'Mobilidade de ombros no cabo leve',m:'Ombros • Escápulas',eq:'Cabos',cat:'Mobilidade',kind:'reps',cue:'Use carga mínima e trabalhe apenas a amplitude confortável.'},
 {id:'sitstand',n:'Sentar e levantar do banco',m:'Pernas • Equilíbrio',eq:'Banco',cat:'Mobilidade',kind:'reps',cue:'Pés firmes, tronco estável e controle tanto na subida quanto na descida.'}
];

function available(e){return true}
const PREFS={
 'Ganhar massa':{
  Pernas:['legpress','hack','ext','flex','hipthrust','rdl','abductor','calf','squat','seatedcurl','adductor'],
  Peito:['chestpress','dbbench','incline','pecdeck','cablefly','bench'],
  Costas:['pulldown','chestrow','row','onearm','straightpull','facepull','tbar'],
  Ombros:['machinepress','lateral','reversefly','cablelat','ohp'],
  Braços:['pushdown','curl','hammer','preacher','overtri','inclinecurl','barpushdown'],
  Core:['abmachine','pallof','plank','cablecrunch','kneeraise']},
 'Força':{
  Pernas:['squat','rdl','legpress','hack','hipthrust','flex','calf','ext'],
  Peito:['bench','dbbench','incline','chestpress','cablefly'],
  Costas:['row','pulldown','tbar','onearm','chestrow','facepull'],
  Ombros:['ohp','machinepress','lateral','reversefly'],
  Braços:['curl','pushdown','hammer','barpushdown','overtri'],
  Core:['pallof','plank','cablecrunch','abmachine']},
 'Condicionamento':{
  Pernas:['legpress','ext','flex','abductor','calf','hack','hipthrust','squat'],
  Peito:['chestpress','pecdeck','dbbench','cablefly','incline'],
  Costas:['pulldown','chestrow','row','facepull','straightpull'],
  Ombros:['machinepress','lateral','reversefly','cablelat'],
  Braços:['pushdown','curl','hammer','barpushdown','preacher'],
  Core:['pallof','abmachine','plank','cablecrunch']},
 'Mobilidade':{
  Pernas:['legpress','flex','ext','abductor','calf','hack'],Peito:['chestpress','pecdeck','cablefly'],Costas:['pulldown','chestrow','facepull'],Ombros:['machinepress','reversefly','lateral'],Braços:['pushdown','curl','hammer'],Core:['pallof','plank','abmachine']}
};
PREFS['Definição']=PREFS['Ganhar massa'];PREFS['Emagrecer']=PREFS['Condicionamento'];
function scheme(){
 const novice=state.level==='Iniciante', advanced=state.level==='Avançado'||state.level==='Experiente';
 if(state.gender==='60+') return {sets:novice?2:3,reps:novice?'10–12':'10–15',rest:75};
 if(state.goal==='Força') return {sets:novice?3:advanced?5:4,reps:novice?'6–8':'4–6',rest:advanced?180:150};
 if(state.goal==='Ganhar massa') return {sets:novice?3:advanced?4:3,reps:'8–12',rest:advanced?105:90};
 if(state.goal==='Definição') return {sets:novice?3:4,reps:'10–15',rest:75};
 if(state.goal==='Condicionamento'||state.goal==='Emagrecer') return {sets:novice?2:3,reps:'12–15',rest:60};
 return {sets:novice?2:3,reps:'10–15',rest:60};
}
function prescription(e,s){
 if(e.kind==='minutes'){
  let mins=state.level==='Iniciante'?8:state.level==='Intermediário'?12:15;
  if(state.goal==='Condicionamento'||state.goal==='Emagrecer')mins+=5;
  return {sets:1,reps:`${mins} min`,rest:0};
 }
 if(e.kind==='seconds') return {sets:e.cat==='Mobilidade'?2:3,reps:e.cat==='Mobilidade'?'30–45 s':'30–60 s',rest:e.cat==='Mobilidade'?20:60};
 if(e.cat==='Mobilidade') return {sets:2,reps:'10–12',rest:20};
 return {sets:s.sets,reps:s.reps,rest:s.rest};
}
function splitFor(dayIndex=0){
 const splits={
  2:[['Pernas','Peito','Costas','Core'],['Pernas','Ombros','Braços','Core']],
  3:[['Peito','Ombros','Braços'],['Costas','Braços','Core'],['Pernas','Core']],
  4:[['Peito','Costas','Ombros'],['Pernas','Core'],['Peito','Costas','Braços'],['Pernas','Ombros','Core']],
  5:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Costas','Ombros'],['Pernas','Braços','Core']],
  6:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Ombros','Braços'],['Costas','Braços','Core'],['Pernas','Core']],
  7:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Costas'],['Ombros','Braços'],['Pernas','Core'],['Cardio','Core']]
 };
 if(state.gender==='60+'){
  const senior=[['Pernas','Core'],['Peito','Costas'],['Pernas','Ombros','Core'],['Costas','Braços']];
  return senior[dayIndex%senior.length];
 }
 const arr=splits[Math.max(2,Math.min(7,state.days))]||splits[4];return arr[dayIndex%arr.length];
}
function levelMainCount(){return state.level==='Iniciante'?6:state.level==='Intermediário'?7:state.level==='Avançado'?8:9}
function findEx(id){return LIB.find(e=>e.id===id)}
function preferredFor(cat){
 if(cat==='Cardio')return ['treadmill','bike','elliptical'].map(findEx).filter(Boolean);
 const g=PREFS[state.goal]||PREFS['Ganhar massa'];let ids=(g[cat]||[]).slice();
 // Iniciante e 60+: máquinas e cabos primeiro; força avançada mantém compostos livres primeiro.
 if((state.level==='Iniciante'||state.gender==='60+')&&state.goal!=='Força'){
  ids.sort((a,b)=>{const ea=findEx(a),eb=findEx(b);const score=x=>/Máquina|Cabos|Cardio/.test(x?.eq||'')?0:1;return score(ea)-score(eb)});
 }
 return ids.map(findEx).filter(Boolean);
}
function pickMain(cats,count){
 const mainCats=cats.filter(c=>c!=='Cardio'&&c!=='Mobilidade');const out=[];
 if(!mainCats.length)return out;
 // Garante pelo menos um exercício de cada grupo do título.
 mainCats.forEach((cat,i)=>{const pool=preferredFor(cat);if(pool.length){const ex=pool[(state.workouts+i)%Math.min(pool.length,3)];if(ex&&!out.some(x=>x.id===ex.id))out.push(ex)}});
 let round=0;
 while(out.length<count&&round<20){
  for(const cat of mainCats){if(out.length>=count)break;const pool=preferredFor(cat);const ex=pool[(round+state.workouts)%pool.length];if(ex&&!out.some(x=>x.id===ex.id))out.push(ex)}round++;
 }
 return out;
}
function blockify(e,block){return {...e,...prescription(e,scheme()),block}}
function planFor(dayIndex=0){
 const cats=splitFor(dayIndex),mainCats=cats.filter(c=>!['Cardio','Mobilidade'].includes(c));
 const items=[];
 // Aquecimento não é contado como exercício principal.
 const warm=(state.gender==='60+'||state.goal==='Mobilidade')?findEx('bike'):findEx((dayIndex%2)?'bike':'treadmill');
 if(warm)items.push({...blockify(warm,'Aquecimento'),sets:1,reps:state.level==='Iniciante'?'5–7 min':'7–10 min',rest:0});
 const mainCount=levelMainCount();pickMain(mainCats,mainCount).forEach(e=>items.push(blockify(e,'Treino principal')));
 // Condicionamento/Emagrecimento recebe cardio final; Core só entra quando previsto no split.
 if((state.goal==='Condicionamento'||state.goal==='Emagrecer'||cats.includes('Cardio'))){const c=findEx(dayIndex%2?'elliptical':'bike');if(c&&!items.some(x=>x.id===c.id))items.push(blockify(c,'Condicionamento'))}
 // Mobilidade sempre separada, 1 movimento; objetivo Mobilidade ou 60+ recebe 2.
 const mobIds=mainCats.some(c=>['Peito','Costas','Ombros','Braços'].includes(c))?['mobilityshoulder','mobilityhips']:['mobilityhips','mobilityshoulder'];
 const mobN=(state.goal==='Mobilidade'||state.gender==='60+')?2:1;mobIds.slice(0,mobN).map(findEx).filter(Boolean).forEach(e=>items.push(blockify(e,'Mobilidade / finalização')));
 const title=mainCats.length?mainCats.join(' + '):(cats.includes('Cardio')?'Condicionamento':'Treino');
 return {title,items,mainCount,cycleWeek:cycleInfo().week,cycleLength:cycleInfo().length};
}
function cycleInfo(){
 const length=state.level==='Iniciante'?4:6;state.cycleLength=length;
 const start=Number(state.cycleStartWorkouts||0),done=Math.max(0,state.workouts-start);const week=Math.min(length,Math.floor(done/Math.max(1,state.days))+1);
 return {week,length,done};
}
function newWorkout(){
 const p=planFor(state.workouts);
 return {id:`w${Date.now()}`,dayIndex:state.workouts,startedAt:new Date().toISOString(),plan:p,completed:[],seriesProgress:{},cycleWeek:cycleInfo().week};
}
function ensureWorkout(){if(!state.activeWorkout){state.activeWorkout=newWorkout();save()}return state.activeWorkout}
function startWorkout(){ensureWorkout();state.tab='train';save();render()}
function weekStartISO(d=new Date()){const x=new Date(d);x.setHours(0,0,0,0);const day=(x.getDay()+6)%7;x.setDate(x.getDate()-day);return x.toISOString().slice(0,10)}
function recalcStreak(){
 const weeks=[...new Set(state.history.map(h=>weekStartISO(new Date(h.date))))].sort().reverse();
 if(!weeks.length)return 0;
 let streak=0, cursor=new Date(weekStartISO());
 for(const w of weeks){const ws=new Date(w+'T00:00:00');const diff=Math.round((cursor-ws)/604800000);if(diff===streak){streak++}else if(streak===0&&diff===1){cursor=ws;streak=1}else break}
 return streak;
}

// MusyFit V9 — ilustrações vetoriais funcionais em toda a biblioteca.
// Cada exercício recebe uma figura própria por padrão de movimento/equipamento,
// sem depender de internet ou arquivos externos.
function exerciseArt(e,large=false){
 const id=e.id||'', cat=e.cat||'', w=large?620:190, h=large?360:145;
 let pose='press';
 if(/squat|hack|legpress|ext|flex|curl|rdl|hip|adductor|abductor|calf|mobilityhips/.test(id)) pose='legs';
 else if(/row|pull|face|reverse|tbar|onearm|straight/.test(id)) pose='pull';
 else if(/curl|hammer|preacher|pushdown|overtri|barpush/.test(id)) pose='arms';
 else if(/plank|crunch|abmachine|kneeraise|pallof/.test(id)) pose='core';
 else if(/treadmill|bike|elliptical/.test(id)) pose='cardio';
 else if(/mobility/.test(id)) pose='mobility';
 else if(/lateral|machinepress|ohp/.test(id)) pose='shoulder';
 const accent='#ff5b0a', skin='#d79a79', muscle='#e8ad8b', metal='#55636a', dark='#11181b';
 const machine = e.eq?.toLowerCase().includes('máq') || e.eq?.toLowerCase().includes('cab') ? `<rect x="38" y="22" width="10" height="102" rx="4" fill="${metal}"/><rect x="142" y="22" width="10" height="102" rx="4" fill="${metal}"/><path d="M43 28H147M43 118H147" stroke="#7b898f" stroke-width="5"/>` : '';
 const person=(cx=95,cy=77)=>{
   if(pose==='legs') return `<circle cx="${cx}" cy="43" r="13" fill="${skin}"/><path d="M${cx-12} 58 Q${cx} 50 ${cx+12} 58 L${cx+16} 94 L${cx+2} 101 L${cx-3} 84 L${cx-14} 105 L${cx-30} 125" fill="none" stroke="${muscle}" stroke-width="14" stroke-linecap="round"/><path d="M${cx+2} 101 L${cx+24} 124" stroke="${muscle}" stroke-width="14" stroke-linecap="round"/><path d="M${cx-8} 66 L${cx-36} 82M${cx+8} 66 L${cx+34} 82" stroke="${muscle}" stroke-width="10" stroke-linecap="round"/>`;
   if(pose==='pull') return `<circle cx="${cx}" cy="42" r="13" fill="${skin}"/><path d="M${cx} 56 L${cx} 97" stroke="${muscle}" stroke-width="19" stroke-linecap="round"/><path d="M${cx-7} 64 L${cx-43} 72 L${cx-59} 57M${cx+7} 64 L${cx+43} 72 L${cx+59} 57" stroke="${muscle}" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M${cx-6} 96 L${cx-18} 128M${cx+6} 96 L${cx+18} 128" stroke="${muscle}" stroke-width="12" stroke-linecap="round"/>`;
   if(pose==='arms') return `<circle cx="${cx}" cy="42" r="13" fill="${skin}"/><path d="M${cx} 56 L${cx} 98" stroke="${muscle}" stroke-width="19"/><path d="M${cx-8} 65 Q${cx-39} 72 ${cx-35} 96M${cx+8} 65 Q${cx+39} 72 ${cx+35} 96" stroke="${muscle}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M${cx-6} 98 L${cx-18} 129M${cx+6} 98 L${cx+18} 129" stroke="${muscle}" stroke-width="12"/>`;
   if(pose==='core') return `<circle cx="${cx}" cy="41" r="13" fill="${skin}"/><path d="M${cx} 55 L${cx+6} 94" stroke="${muscle}" stroke-width="20"/><path d="M${cx-7} 63 L${cx-33} 88M${cx+7} 63 L${cx+30} 85" stroke="${muscle}" stroke-width="10"/><path d="M${cx+4} 94 L${cx-27} 118M${cx+5} 94 L${cx+36} 112" stroke="${muscle}" stroke-width="12"/>`;
   if(pose==='cardio') return `<circle cx="${cx}" cy="40" r="13" fill="${skin}"/><path d="M${cx} 55 L${cx-4} 91" stroke="${muscle}" stroke-width="18"/><path d="M${cx-8} 64 L${cx-34} 83M${cx+7} 64 L${cx+31} 76" stroke="${muscle}" stroke-width="10"/><path d="M${cx-4} 91 L${cx-32} 123M${cx-2} 91 L${cx+25} 116" stroke="${muscle}" stroke-width="12"/><path d="M42 124H154" stroke="${accent}" stroke-width="5"/>`;
   if(pose==='mobility') return `<circle cx="${cx}" cy="39" r="13" fill="${skin}"/><path d="M${cx} 53 L${cx} 95" stroke="${muscle}" stroke-width="18"/><path d="M${cx-7} 62 L${cx-46} 49M${cx+7} 62 L${cx+46} 49" stroke="${muscle}" stroke-width="10"/><path d="M${cx-5} 95 L${cx-31} 127M${cx+5} 95 L${cx+31} 127" stroke="${muscle}" stroke-width="12"/>`;
   if(pose==='shoulder') return `<circle cx="${cx}" cy="43" r="13" fill="${skin}"/><path d="M${cx} 57 L${cx} 98" stroke="${muscle}" stroke-width="19"/><path d="M${cx-8} 64 L${cx-35} 55 L${cx-35} 27M${cx+8} 64 L${cx+35} 55 L${cx+35} 27" stroke="${muscle}" stroke-width="11" fill="none" stroke-linecap="round"/><path d="M${cx-6} 98 L${cx-18} 130M${cx+6} 98 L${cx+18} 130" stroke="${muscle}" stroke-width="12"/>`;
   return `<circle cx="${cx}" cy="43" r="13" fill="${skin}"/><path d="M${cx} 57 L${cx} 98" stroke="${muscle}" stroke-width="19"/><path d="M${cx-8} 65 L${cx-43} 74M${cx+8} 65 L${cx+43} 74" stroke="${muscle}" stroke-width="11"/><path d="M${cx-6} 98 L${cx-18} 130M${cx+6} 98 L${cx+18} 130" stroke="${muscle}" stroke-width="12"/>`;
 };
 return `<svg class="exerciseArt ${large?'large':''}" viewBox="0 0 190 145" role="img" aria-label="Ilustração de ${esc(e.n)}"><defs><linearGradient id="g${esc(id)}" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#1b252a"/><stop offset="1" stop-color="#080d0f"/></linearGradient></defs><rect width="190" height="145" rx="18" fill="url(#g${esc(id)})"/><ellipse cx="95" cy="132" rx="67" ry="7" fill="#0008"/>${machine}${person()}<circle cx="160" cy="24" r="14" fill="#ff5b0a22" stroke="${accent}"/><path d="M154 24h12M160 18v12" stroke="${accent}" stroke-width="2"/><text x="12" y="18" fill="#ff7b1b" font-size="9" font-weight="800">${esc(cat.toUpperCase())}</text></svg>`;
}
function anatomyFigure(stats={}){
 const pct=k=>Math.max(0,Math.min(100,Number(stats[k]||0)));
 const op=k=>(0.18+pct(k)/125).toFixed(2);
 const front=`<g transform="translate(10 8)"><circle cx="76" cy="25" r="18" class="anatBase"/><path class="anatBase" d="M61 46 Q76 39 91 46 L104 90 95 158 93 285 76 285 73 170 59 285 42 285 52 158 47 90Z"/><path class="anatBase" d="M50 58 L21 135 34 141 63 79M102 58 L131 135 118 141 89 79"/><ellipse class="anatMuscle" style="opacity:${op('Peito')}" cx="65" cy="76" rx="14" ry="12"/><ellipse class="anatMuscle" style="opacity:${op('Peito')}" cx="87" cy="76" rx="14" ry="12"/><ellipse class="anatMuscle" style="opacity:${op('Ombros')}" cx="50" cy="61" rx="10" ry="10"/><ellipse class="anatMuscle" style="opacity:${op('Ombros')}" cx="102" cy="61" rx="10" ry="10"/><rect class="anatMuscle" style="opacity:${op('Core')}" x="64" y="90" width="24" height="56" rx="10"/><path class="anatMuscle" style="opacity:${op('Braços')}" d="M43 67 L24 132 37 137 56 77Z M109 67 L128 132 115 137 96 77Z"/><path class="anatMuscle" style="opacity:${op('Pernas')}" d="M57 150 L44 275 66 275 75 166Z M95 150 L108 275 86 275 77 166Z"/><path class="fiber" d="M76 47V146M48 61L76 78 104 61M57 160L73 190M95 160L79 190"/></g>`;
 const back=`<g transform="translate(165 8)"><circle cx="76" cy="25" r="18" class="anatBase"/><path class="anatBase" d="M61 46 Q76 39 91 46 L104 90 95 158 93 285 76 285 73 170 59 285 42 285 52 158 47 90Z"/><path class="anatBase" d="M50 58 L21 135 34 141 63 79M102 58 L131 135 118 141 89 79"/><path class="anatMuscle" style="opacity:${op('Costas')}" d="M56 66 Q76 52 96 66 L91 123 Q76 139 61 123Z"/><ellipse class="anatMuscle" style="opacity:${op('Ombros')}" cx="50" cy="61" rx="10" ry="10"/><ellipse class="anatMuscle" style="opacity:${op('Ombros')}" cx="102" cy="61" rx="10" ry="10"/><path class="anatMuscle" style="opacity:${op('Braços')}" d="M43 67 L24 132 37 137 56 77Z M109 67 L128 132 115 137 96 77Z"/><path class="anatMuscle" style="opacity:${op('Pernas')}" d="M57 150 L44 275 66 275 75 166Z M95 150 L108 275 86 275 77 166Z"/><ellipse class="anatMuscle" style="opacity:${op('Pernas')}" cx="63" cy="151" rx="15" ry="18"/><ellipse class="anatMuscle" style="opacity:${op('Pernas')}" cx="89" cy="151" rx="15" ry="18"/><path class="fiber" d="M76 47V142M59 67Q76 95 93 67M57 162L73 190M95 162L79 190"/></g>`;
 return `<svg class="anatomyDetailed" viewBox="0 0 320 315" role="img" aria-label="Mapa anatômico frente e costas">${front}${back}<text x="86" y="309" class="anatLabel">FRENTE</text><text x="238" y="309" class="anatLabel">COSTAS</text></svg>`;
}

function nav(){return `<nav class="nav">${[['home','⌂','Início'],['train','🏋','Treinos'],['coach','✦','Coach'],['progress','▥','Evolução'],['profile','♙','Perfil']].map(x=>`<button data-tab="${x[0]}" class="${state.tab===x[0]?'active':''}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</nav>`}
function shell(body){$('#app').innerHTML=`<main class="shell">${body}</main>${nav()}`;$$('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;save();render()})}
function onboarding(){ $('#app').innerHTML=`<main class="shell welcome"><div class="logo">M<b>F</b></div><div class="brand big">MUSY<b>FIT</b></div><p class="sub">Seu parceiro em cada treino</p><div class="hero"><span class="kicker">PERSONAL TRAINER INTELIGENTE</span><h1>Treino que evolui com você.</h1><p class="muted">Planos personalizados, evolução, timer, avaliação corporal e Musy Coach.</p></div><button class="btn" id="start">COMEÇAR</button><p class="legal">Orientação fitness geral. Não substitui avaliação médica ou de profissional habilitado.</p></main>`; $('#start').onclick=setupProfile }
function setupProfile(){
 $('#app').innerHTML=`<main class="shell"><div class="brand">MUSY<b>FIT</b></div><section class="section"><h1>Vamos personalizar</h1><p class="muted">As escolhas abaixo ajustam volume, exercícios e descanso.</p>
 <h2>Perfil</h2><div class="choice" id="gender">${['Homem','Mulher','60+'].map(v=>`<button class="${state.gender===v?'on':''}">${v}</button>`).join('')}</div>
 <div class="form2"><label>Nome<input class="input" id="name" value="${esc(state.name==='Atleta'?'':state.name)}"></label><label>Idade<input class="input" id="age" type="number" min="14" max="100" value="${state.age}"></label></div>
 <h2>Nível</h2><div>${['Iniciante','Intermediário','Avançado','Experiente'].map(v=>`<span class="pill ${state.level===v?'on':''}" data-level="${v}">${v}</span>`).join('')}</div>
 <h2>Objetivo</h2><div>${['Ganhar massa','Emagrecer','Definição','Força','Condicionamento','Mobilidade'].map(v=>`<span class="pill ${state.goal===v?'on':''}" data-goal="${v}">${v}</span>`).join('')}</div>
 <h2>Local de treino</h2><div><span class="pill on">Academia</span></div><p class="hint">MusyFit V8 foi otimizado exclusivamente para treinos em academia, com ciclos e fichas por objetivo.</p>
 <div class="form2"><label>Dias/semana<input class="input" id="days" type="number" min="2" max="7" value="${state.days}"></label><label>Min/treino<input class="input" id="mins" type="number" min="20" max="120" value="${state.minutesTarget}"></label></div>
 <button class="btn" id="go">CRIAR MEU PLANO</button></section></main>`;
 $$('#gender button').forEach(b=>b.onclick=()=>{state.gender=b.textContent;setupProfile()}); $$('[data-level]').forEach(b=>b.onclick=()=>{state.level=b.dataset.level;setupProfile()}); $$('[data-goal]').forEach(b=>b.onclick=()=>{state.goal=b.dataset.goal;setupProfile()});
 $('#go').onclick=()=>{state.name=$('#name').value.trim()||'Atleta';state.age=+$('#age').value||30;state.days=Math.max(2,Math.min(7,+$('#days').value||4));state.minutesTarget=+$('#mins').value||50;state.place='Academia';state.onboard=true;save();scheduleWeekly();state.tab='home';render()}
}
function home(){const p=planFor(state.workouts);const week=state.history.filter(h=>Date.now()-new Date(h.date).getTime()<7*864e5).length; const progress=Math.min(100,Math.round((state.workouts/20)*100)); shell(`
 <header class="row"><div><div class="brand">MUSY<b>FIT</b></div><h1>Olá, ${esc(state.name)} 👋</h1><p class="muted">Seu plano está pronto para hoje.</p></div><button class="iconbtn" id="bell">🔔</button></header>
 <section class="hero workoutHero"><div class="row"><span class="kicker">TREINO DE HOJE</span><span class="badge">Ciclo ${cycleInfo().week}/${cycleInfo().length}</span></div><h1>${p.title}</h1><p>${p.mainCount} exercícios principais + aquecimento/finalização • ~${state.minutesTarget} min</p><div class="bar"><i style="width:${cycleInfo().week/cycleInfo().length*100}%"></i></div><button class="btn" id="begin">COMEÇAR TREINO ▶</button></section>
 <section class="grid stats"><div class="stat">🔥<strong>${week}</strong><span>esta semana</span></div><div class="stat">🏆<strong>${state.records}</strong><span>recordes</span></div><div class="stat">⏱<strong>${fmtMin(state.totalMinutes)}</strong><span>treinadas</span></div><div class="stat">↗<strong>${progress}%</strong><span>jornada</span></div></section>
 <section class="card coach" id="ask"><div class="avatar">✦</div><div class="grow"><b>MUSY COACH AI</b><div class="muted">Pergunte sobre sua ficha e exercícios.</div></div><span>›</span></section>
 <section class="section"><div class="row"><h2>Próximos treinos</h2><button class="link" id="allPlans">ver plano</button></div><div class="scrollcards">${[0,1,2].map(i=>{let q=planFor(state.workouts+i);return `<div class="miniPlan"><b>${i===0?'Hoje':`Treino ${i+1}`}</b><span>${q.title}</span><small>${q.items.length} exercícios</small></div>`}).join('')}</div></section>
 <section class="section card"><div class="row"><div><b>Consistência</b><div class="muted">${state.streak} semanas em sequência</div></div><span class="badge">${week}/${state.days}</span></div><div class="bar"><i style="width:${Math.min(100,week/state.days*100)}%"></i></div></section>`);
 $('#begin').onclick=startWorkout;$('#ask').onclick=()=>{state.tab='coach';save();render()};$('#allPlans').onclick=()=>{state.tab='train';save();render()};$('#bell').onclick=()=>toast(state.weeklyNotifications?'Resumo semanal ativo.':'Notificações semanais desativadas.');
}
function train(){
 const w=ensureWorkout(),p=w.plan,done=w.completed||[];
 const blocks=['Aquecimento','Treino principal','Condicionamento','Mobilidade / finalização'];
 const html=blocks.map(block=>{const arr=p.items.filter(x=>x.block===block);if(!arr.length)return '';return `<section class="workoutBlock"><div class="blockTitle"><span>${block}</span><small>${arr.length}</small></div><div class="card exerciseList">${arr.map((e,i)=>{const global=p.items.indexOf(e);return `<div class="exercise exerciseRich ${done.includes(e.id)?'done':''}"><div class="exThumb">${exerciseArt(e)}</div><div class="num">${done.includes(e.id)?'✓':global+1}</div><div class="grow"><b>${e.n}</b><div class="muted">${e.sets} × ${e.reps}</div><small>${e.m}</small></div><button class="pill" data-ex="${e.id}">Abrir</button></div>`}).join('')}</div></section>`}).join('');
 shell(`<div class="row planHeader"><div><span class="kicker">SEU PLANO • CICLO ${cycleInfo().week}/${cycleInfo().length}</span><h1>${p.title}</h1><p class="muted">${state.level} • ${state.goal} • Academia</p></div><span class="badge">${done.length}/${p.items.length}</span></div><div class="cycleStrip"><span>Semana ${cycleInfo().week} de ${cycleInfo().length}</span><div class="bar"><i style="width:${cycleInfo().week/cycleInfo().length*100}%"></i></div></div>${html}<section class="section card"><b>Academia inteligente</b><p class="muted">Máquina ocupada? Abra o exercício e toque em <b>Substituir</b>. O MusyFit mantém a troca dentro do mesmo grupo e da mesma função do treino.</p></section><section class="section"><button class="btn alt" id="finish">FINALIZAR TREINO</button></section>`);
 $$('[data-ex]').forEach(b=>b.onclick=()=>exercise(b.dataset.ex));$('#finish').onclick=finishWorkout
}
let timerInt=null;
function exercise(id){
 const w=ensureWorkout(),p=w.plan,e=p.items.find(x=>x.id===id);if(!e){state.tab='train';save();return render()}
 const load=state.loads[id]||{prev:0,current:0};const completedSeries=Math.min(Number(w.seriesProgress?.[id]||0),e.sets),finished=completedSeries>=e.sets;const usesLoad=e.kind==='reps'&&e.cat!=='Mobilidade';
 const muscleNames=e.m.split('•').map(x=>x.trim()).filter(Boolean);
 shell(`<button class="back" id="back">‹ Voltar</button><div class="detailHead"><div><span class="kicker">${e.block||'EXERCÍCIO'}</span><h1>${e.n}</h1><p class="muted">${e.m}</p></div><button class="heart" id="fav">${state.favorites.includes(id)?'♥':'♡'}</button></div><section class="exerciseHeroV9">${exerciseArt(e,true)}<div class="heroTag">${esc(e.eq)}</div></section><div class="detailTabs"><button class="on">Músculos ativados</button><button id="howTop">Passo a passo</button><button id="tipsTop">Dicas</button></div><section class="card muscleFocus"><div class="miniAnatomy">${anatomyFigure({Peito:e.cat==='Peito'?100:0,Costas:e.cat==='Costas'?100:0,Pernas:e.cat==='Pernas'?100:0,Ombros:e.cat==='Ombros'?100:0,Braços:e.cat==='Braços'?100:0,Core:e.cat==='Core'?100:0})}</div><div><span class="kicker">FOCO MUSCULAR</span><h2>${esc(muscleNames[0]||e.cat)}</h2><p class="muted">${esc(muscleNames.slice(1).join(' • ')||'Grupo estabilizador e músculos auxiliares.')}</p></div></section><section class="stats3"><div class="stat"><span>Séries</span><strong>${e.sets}</strong></div><div class="stat"><span>Repetições</span><strong>${e.reps}</strong></div><div class="stat"><span>Descanso</span><strong>${e.rest?e.rest+'s':'—'}</strong></div></section><section class="section card seriesCard"><div class="row"><div><span class="kicker">PROGRESSO</span><h2>${finished?'Exercício concluído':`Série ${completedSeries+1} de ${e.sets}`}</h2></div><span class="badge">${completedSeries}/${e.sets}</span></div><div class="seriesDots">${Array.from({length:e.sets},(_,i)=>`<i class="${i<completedSeries?'on':''}">${i<completedSeries?'✓':i+1}</i>`).join('')}</div></section>${usesLoad?`<section class="section"><h2>Carga</h2><div class="grid"><div class="stat"><span>Anterior</span><strong>${load.prev||'—'}${load.prev?' kg':''}</strong></div><div class="stat"><span>Hoje</span><input class="loadInput" id="load" type="number" step="0.5" min="0" value="${load.current||load.prev||''}" placeholder="kg"></div></div><p class="hint">Aumente a carga apenas quando concluir as séries com técnica consistente.</p></section>`:`<section class="section card"><span class="kicker">META DO EXERCÍCIO</span><h2>${e.reps}</h2><p class="muted">Neste movimento o foco é tempo, controle ou mobilidade — carga não é necessária.</p></section>`}<button class="btn" id="done" ${finished?'disabled':''}>${finished?'✓ EXERCÍCIO CONCLUÍDO':(e.rest>0?'▶ CONCLUIR SÉRIE':'▶ CONCLUIR EXERCÍCIO')}</button><div id="timerBox">${e.rest>0?`<section class="section card restPreview"><div class="row"><div><span class="kicker">CRONÔMETRO DE DESCANSO</span><b>${e.rest} segundos</b></div><button class="pill" id="startRest">▶ Iniciar</button></div></section>`:`<section class="section card restPreview"><span class="kicker">SEM INTERVALO PROGRAMADO</span><p class="hint">Conclua após cumprir o tempo indicado.</p></section>`}</div><section class="section grid"><button class="btn alt" id="replace">⇄ SUBSTITUIR</button><button class="btn alt" id="how">? COMO FAZER</button></section>`);
 $('#back').onclick=()=>{state.tab='train';save();render()};$('#fav').onclick=()=>{state.favorites=state.favorites.includes(id)?state.favorites.filter(x=>x!==id):[...state.favorites,id];save();exercise(id)};if(usesLoad&&$('#load'))$('#load').onchange=x=>{state.loads[id]={prev:load.prev||0,current:+x.target.value||0};save()};$('#done').onclick=()=>completeSeries(e,id);if($('#startRest'))$('#startRest').onclick=()=>startTimer(e.rest,id,e,false);$('#replace').onclick=()=>showReplacements(e);$('#how').onclick=()=>showGuide(e);$('#howTop').onclick=()=>showGuide(e);$('#tipsTop').onclick=()=>showGuide(e);if(state.activeRest?.workoutId===w.id&&state.activeRest?.exerciseId===id)resumeTimer(e,id)
}
function completeSeries(e,id){
 const w=ensureWorkout(); let n=Math.min(Number(w.seriesProgress?.[id]||0)+1,e.sets);w.seriesProgress=w.seriesProgress||{};w.seriesProgress[id]=n;
 if(n>=e.sets&&!w.completed.includes(id))w.completed.push(id);save();if(e.rest>0)startTimer(e.rest,id,e,n>=e.sets);else exercise(id)
}
function startTimer(seconds,id,e,finalSeries=false){
 clearInterval(timerInt);const sec=Math.max(0,Number(seconds)||90);state.activeRest={workoutId:ensureWorkout().id,exerciseId:id,endAt:Date.now()+sec*1000,remaining:sec,paused:false,finalSeries};save();runTimer(e,id)
}
function resumeTimer(e,id){runTimer(e,id)}
function runTimer(e,id){
 clearInterval(timerInt);const box=$('#timerBox');if(!box)return;const r=state.activeRest;if(!r||r.exerciseId!==id)return;
 const secondsLeft=()=>r.paused?Math.max(0,Math.ceil(r.remaining)):Math.max(0,Math.ceil((r.endAt-Date.now())/1000));
 function paint(){let sec=secondsLeft(),m=Math.floor(sec/60),ss=String(sec%60).padStart(2,'0');box.innerHTML=`<section class="section card restActive"><span class="kicker">DESCANSO • ${e.n}</span><h2 class="center">${r.finalSeries?'Última série concluída':'Prepare a próxima série'}</h2><div class="timer">${m}:${ss}</div><div class="grid"><button class="btn alt" id="minus">−15 s</button><button class="btn alt" id="plus">+30 s</button></div><div class="grid sectionSmall"><button class="btn alt" id="pause">${r.paused?'Continuar':'Pausar'}</button><button class="btn alt" id="skip">Pular descanso</button></div></section>`;
  $('#minus').onclick=()=>adjust(-15);$('#plus').onclick=()=>adjust(30);$('#pause').onclick=togglePause;$('#skip').onclick=finishRest}
 function adjust(delta){let now=secondsLeft(),next=Math.max(0,now+delta);if(r.paused)r.remaining=next;else r.endAt=Date.now()+next*1000;save();paint()}
 function togglePause(){if(r.paused){r.paused=false;r.endAt=Date.now()+Math.max(0,r.remaining)*1000}else{r.remaining=secondsLeft();r.paused=true}save();paint()}
 function finishRest(){clearInterval(timerInt);navigator.vibrate?.([250,120,250]);state.activeRest=null;save();const w=ensureWorkout(),n=Number(w.seriesProgress?.[id]||0);box.innerHTML=`<section class="section card success"><b>${n>=e.sets?'✓ Exercício concluído':'✓ Descanso concluído'}</b><p>${n>=e.sets?'Todas as séries foram registradas.':`Pronto para a série ${n+1} de ${e.sets}.`}</p><button class="btn alt" id="refreshEx">${n>=e.sets?'VOLTAR AO TREINO':'PRÓXIMA SÉRIE'}</button></section>`;$('#refreshEx').onclick=()=>n>=e.sets?(state.tab='train',save(),render()):exercise(id)}
 paint();if(secondsLeft()<=0)return finishRest();timerInt=setInterval(()=>{if(!r.paused&&secondsLeft()<=0)finishRest();else paint()},1000)
}
function showReplacements(e){
 const alts=LIB.filter(x=>x.id!==e.id&&x.cat===e.cat&&available(x)).slice(0,6);
 modal(`<h2>Substituir ${e.n}</h2><p class="muted">A troca será mantida até finalizar este treino.</p>${alts.map(a=>`<button class="option" data-rep="${a.id}"><b>${a.n}</b><span>${a.m}</span></button>`).join('')||'<p class="muted">Nenhuma alternativa disponível para este grupo.</p>'}`);
 $$('[data-rep]').forEach(b=>b.onclick=()=>{const w=ensureWorkout(),alt=LIB.find(x=>x.id===b.dataset.rep),i=w.plan.items.findIndex(x=>x.id===e.id);if(i<0||!alt)return;w.plan.items[i]={...alt,...prescription(alt,scheme())};delete w.seriesProgress[e.id];w.completed=w.completed.filter(x=>x!==e.id);w.plan.title=[...new Set(w.plan.items.map(x=>x.cat))].join(' + ');state.activeRest=null;save();closeModal();exercise(alt.id)})
}
function showGuide(e){modal(`<div class="guideHero">${exerciseArt(e,true)}</div><h2>${e.n}</h2><div class="guideSteps"><div class="guideStep"><b>1</b><p><strong>Ajuste e posição inicial</strong><br>${e.cue}</p></div><div class="guideStep"><b>2</b><p><strong>Execução</strong><br>Inicie o movimento de forma controlada, mantenha o tronco estável e respeite a amplitude confortável.</p></div><div class="guideStep"><b>3</b><p><strong>Contração</strong><br>Finalize a fase ativa sem usar impulso e mantenha o grupo-alvo sob controle.</p></div><div class="guideStep"><b>4</b><p><strong>Retorno</strong><br>Volte lentamente à posição inicial e prepare a próxima repetição.</p></div><div class="coachTip"><b>💡 Dica do Musy Coach</b><p>Priorize execução consistente. Se a técnica se perder, reduza a carga ou use uma substituição equivalente.</p></div></div>`)}
function finishWorkout(){
 const w=state.activeWorkout;if(!w)return toast('Nenhum treino em andamento.');const done=w.completed||[];
 if(!done.length&&!confirm('Nenhum exercício foi concluído. Registrar o treino mesmo assim?'))return;
 if(done.length<w.plan.items.length&&!confirm(`Você concluiu ${done.length} de ${w.plan.items.length} exercícios. Finalizar mesmo assim?`))return;
 const d=new Date(),elapsed=Math.max(1,Math.round((d-new Date(w.startedAt))/60000));state.workouts++;state.totalMinutes+=elapsed;
 state.history.unshift({sessionId:w.id,date:d.toISOString(),title:w.plan.title,minutes:elapsed,completed:done.length,total:w.plan.items.length,groups:[...new Set(w.plan.items.filter(x=>done.includes(x.id)).map(x=>x.cat))]});state.history=state.history.slice(0,100);
 Object.keys(state.loads).forEach(k=>{let l=state.loads[k];if(l.current>l.prev&&l.prev>0)state.records++;if(l.current>0)l.prev=l.current;l.current=0});
 state.lastWorkoutDate=d.toISOString();state.activeWorkout=null;state.activeRest=null;state.streak=recalcStreak();const ci=cycleInfo();if(ci.done+1>=ci.length*Math.max(1,state.days)){state.cycleStartWorkouts=state.workouts;toast('Ciclo concluído! O próximo ciclo manterá a base e variará exercícios.')}save();toast('Treino registrado! Sua evolução foi atualizada.');state.tab='home';setTimeout(render,500)
}

const localAnswers=[
 [/supino|peito/i,'No supino, mantenha os pés apoiados, escápulas estáveis e controle a descida. Use uma carga que permita repetir a técnica em todas as séries.'],
 [/descanso|tempo/i,'Seu plano usa descanso conforme objetivo: em geral, 60–120 s para séries moderadas e mais tempo em séries pesadas. Use o timer e ajuste se ainda estiver ofegante.'],
 [/trocar|ocupad|máquina/i,'Abra o exercício e toque em “Substituir”. O MusyFit mostra opções do mesmo grupo muscular disponíveis no seu local de treino.'],
 [/dor|machuc|lesão/i,'Dor aguda, inchaço, perda de força ou dor que persiste não deve ser tratada pelo app. Interrompa o exercício e procure avaliação profissional.'],
 [/iniciante|começ/i,'Para começar, priorize técnica, frequência sustentável e progressão gradual. Seu plano já reduz o volume quando o perfil está em Iniciante.'],
 [/carga|peso|aument/i,'Se você conclui todas as séries com boa técnica e esforço controlado, pode testar um aumento pequeno, geralmente 2%–5%. Não é obrigatório subir carga toda semana.'],
 [/60\+|idoso|terceira idade/i,'No perfil 60+, o MusyFit prioriza movimentos simples, estabilidade, força funcional e condicionamento. Qualquer condição clínica ou limitação importante deve ser avaliada por profissional habilitado.']
];
function coach(){const messages=state.coachHistory.slice(-12),api=(state.apiUrl||window.MUSYFIT_AI_URL||'').trim();shell(`<div class="row"><div><h1>Musy Coach <span class="online">●</span></h1><p class="muted">Assistente de treino do MusyFit</p></div><span class="badge">${api?'IA ONLINE':'MODO LOCAL'}</span></div><section class="coachHero"><div class="coachPortrait">M</div><div><b>Seu Coach Inteligente</b><p>Treino, execução, substituições, evolução e dúvidas da sua ficha.</p></div></section><div class="card chat" id="chat"><div class="bubble">Olá, ${esc(state.name)}! 💪 Posso explicar sua ficha, exercícios, descanso, progressão e substituições. Não faço diagnóstico médico.</div>${messages.map(m=>`<div class="bubble ${m.role==='user'?'me':''}">${esc(m.text)}</div>`).join('')}</div><div class="composer"><textarea class="input" id="q" rows="2" placeholder="Digite sua dúvida..."></textarea><button class="send" id="send">➤</button></div><div class="quickrow">${['Como fazer este exercício?','Quanto descansar?','Máquina ocupada','Como evoluir minha carga?'].map(x=>`<button class="pill quick">${x}</button>`).join('')}</div><p class="hint">Quando um servidor de IA estiver configurado, o Coach usa seu perfil e histórico. Sem internet, continua com orientação local.</p>`);function ask(q){if(!q.trim())return;appendChat('user',q);$('#q').value='';replyAI(q)}$('#send').onclick=()=>ask($('#q').value);$$('.quick').forEach(x=>x.onclick=()=>ask(x.textContent));$('#q').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(e.target.value)}};scrollChat()}
function appendChat(role,text){state.coachHistory.push({role,text,date:new Date().toISOString()});state.coachHistory=state.coachHistory.slice(-30);save();const c=$('#chat');if(c)c.insertAdjacentHTML('beforeend',`<div class="bubble ${role==='user'?'me':''}">${esc(text)}</div>`);scrollChat()}
async function replyAI(q){const c=$('#chat');c.insertAdjacentHTML('beforeend','<div class="bubble typing" id="typing">Musy Coach está pensando…</div>');scrollChat();try{let text='';const api=(state.apiUrl||window.MUSYFIT_AI_URL||'').trim();if(api){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,profile:{name:state.name,gender:state.gender,age:state.age,level:state.level,goal:state.goal,days:state.days,place:state.place},history:state.history.slice(0,8),plan:(state.activeWorkout?.plan||planFor(state.workouts)).items.map(x=>({name:x.n,sets:x.sets,reps:x.reps,muscles:x.m}))})});if(!r.ok)throw new Error('AI offline');const j=await r.json();text=j.answer||j.output||''}if(!text){const a=localAnswers.find(x=>x[0].test(q));text=a?a[1]:'Posso te ajudar com execução dos exercícios, séries, repetições, descanso, cargas, substituições, organização do treino e evolução. Me diga qual é a sua dúvida ou o nome do exercício.'}$('#typing')?.remove();appendChat('assistant',text)}catch(e){$('#typing')?.remove();const a=localAnswers.find(x=>x[0].test(q));appendChat('assistant',(a?a[1]:'Não consegui acessar a IA online agora. Ainda posso ajudar no modo local com exercícios, descanso, carga, substituições e organização do treino.'))}}
function scrollChat(){const c=$('#chat');if(c)c.scrollTop=c.scrollHeight}

function progress(){const bmi=(state.weight/((state.height/100)**2)).toFixed(1);const last=state.assessments[0],stats=Object.fromEntries(muscleStats());shell(`<div class="progressHead"><div><span class="kicker">MUSY PROGRESS</span><h1>Evolução</h1></div><span class="badge">${state.workouts} treinos</span></div><div class="progressTabs"><button class="on">Mapa muscular</button><button>Medidas</button><button>Histórico</button></div><section class="card muscleCardV9"><div class="anatomyStage">${anatomyFigure(stats)}</div><div class="legend"><span><i></i>Não trabalhado</span><span><i class="worked"></i>Trabalhado</span><span><i class="evolving"></i>Evoluindo</span></div><div class="muscleRows">${muscleStats().map(x=>`<div class="muscleRow"><span class="muscleMini">▦</span><b>${x[0]}</b><div class="bar"><i style="width:${x[1]}%"></i></div><strong>${x[1]}%</strong></div>`).join('')}</div></section><section class="section stats3"><div class="stat"><span>Peso</span><strong>${state.weight} kg</strong></div><div class="stat"><span>IMC</span><strong>${bmi}</strong></div><div class="stat"><span>Cintura</span><strong>${state.waist} cm</strong></div></section><section class="section card"><div class="row"><h2>Avaliação corporal</h2><button class="link" id="photo">+ foto</button></div><div class="form2"><label>Peso (kg)<input class="input" id="w" type="number" step="0.1" value="${state.weight}"></label><label>Altura (cm)<input class="input" id="h" type="number" value="${state.height}"></label><label>Cintura (cm)<input class="input" id="wa" type="number" value="${state.waist}"></label><label>Peito (cm)<input class="input" id="ch" type="number" value="${state.chest}"></label><label>Braço (cm)<input class="input" id="ar" type="number" value="${state.arm}"></label><label>Coxa (cm)<input class="input" id="th" type="number" value="${state.thigh}"></label></div><button class="btn" id="eval">SALVAR AVALIAÇÃO</button>${last?`<p class="hint">Última avaliação: ${new Date(last.date).toLocaleDateString('pt-BR')}</p>`:''}</section><section class="section"><h2>Histórico recente</h2>${state.history.slice(0,5).map(h=>`<div class="history"><div><b>${h.title}</b><span>${new Date(h.date).toLocaleDateString('pt-BR')}</span></div><div>${h.completed}/${h.total} • ${h.minutes} min</div></div>`).join('')||'<div class="card muted">Conclua seu primeiro treino para ver o histórico.</div>'}</section><input hidden id="photoInput" type="file" accept="image/*" capture="user">`);$('#eval').onclick=saveAssessment;$('#photo').onclick=()=>$('#photoInput').click();$('#photoInput').onchange=saveProgressPhoto}
function muscleStats(){const hist=state.history.slice(0,12),v={Peito:0,Costas:0,Pernas:0,Ombros:0,Braços:0,Core:0};hist.forEach(h=>(h.groups||[]).forEach(k=>{if(k in v)v[k]+=18}));const max=Math.max(1,...Object.values(v));return Object.entries(v).map(([k,n])=>[k,Math.min(100,Math.round(n/max*100))])}
function saveAssessment(){['w','h','wa','ch','ar','th'].forEach(()=>{});state.weight=+$('#w').value||state.weight;state.height=+$('#h').value||state.height;state.waist=+$('#wa').value||state.waist;state.chest=+$('#ch').value||state.chest;state.arm=+$('#ar').value||state.arm;state.thigh=+$('#th').value||state.thigh;state.assessments.unshift({date:new Date().toISOString(),weight:state.weight,waist:state.waist,chest:state.chest,arm:state.arm,thigh:state.thigh});state.assessments=state.assessments.slice(0,24);save();toast('Avaliação salva.');render()}
async function saveProgressPhoto(e){const f=e.target.files?.[0];if(!f)return;try{await idbPut('progressPhoto',{id:Date.now(),date:new Date().toISOString(),blob:f});toast('Foto de evolução salva somente neste aparelho.')}catch(err){toast('Não foi possível salvar a foto neste aparelho.')}}
function idbPut(storeName,obj){return new Promise((res,rej)=>{let rq=indexedDB.open('musyfit-media',1);rq.onupgradeneeded=()=>{let db=rq.result;if(!db.objectStoreNames.contains(storeName))db.createObjectStore(storeName,{keyPath:'id'})};rq.onsuccess=()=>{let tx=rq.result.transaction(storeName,'readwrite');tx.objectStore(storeName).put(obj);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)};rq.onerror=()=>rej(rq.error)})}

function profile(){shell(`<div class="row"><div><span class="kicker">PERFIL</span><h1>${esc(state.name)}</h1><p class="muted">${state.gender} • ${state.level}</p></div><div class="avatar bigav">${esc(state.name[0]||'M')}</div></div><section class="grid section"><div class="stat"><strong>${state.workouts}</strong><span>treinos</span></div><div class="stat"><strong>${state.streak}</strong><span>semanas</span></div></section><section class="section card settings"><label>Objetivo <b>${state.goal}</b></label><label>Local <b>${state.place}</b></label><label>Frequência <b>${state.days}x/semana</b></label><label>Descanso padrão <b>${state.restDefault}s</b></label><label class="switchline"><span>Resumo semanal</span><input id="notif" type="checkbox" ${state.weeklyNotifications?'checked':''}></label></section><section class="section card"><h2>Musy Coach AI</h2><p class="muted">Status: <b>${(state.apiUrl||window.MUSYFIT_AI_URL||'').trim()?'IA configurada':'Modo local'}</b>. A chave da IA nunca fica dentro do APK.</p><input class="input" id="api" placeholder="https://seu-backend.com/api/coach" value="${esc(state.apiUrl)}"><div class="grid sectionSmall"><button class="btn alt" id="saveApi">SALVAR SERVIDOR</button><button class="btn alt" id="testApi">TESTAR CONEXÃO</button></div></section><section class="section grid"><button class="btn alt" id="edit">EDITAR PERFIL</button><button class="btn alt" id="reset">RECOMEÇAR</button></section><p class="legal">Dados de treino ficam no aparelho. Fotos de evolução são armazenadas localmente no dispositivo.</p>`);$('#notif').onchange=e=>{state.weeklyNotifications=e.target.checked;save();if(state.weeklyNotifications)scheduleWeekly();else cancelWeekly()};$('#saveApi').onclick=()=>{state.apiUrl=$('#api').value.trim();save();toast('Servidor da IA salvo.')};$('#testApi').onclick=async()=>{const api=($('#api').value||window.MUSYFIT_AI_URL||'').trim();if(!api)return toast('Nenhum servidor de IA configurado.');toast('Testando conexão...');try{const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Responda apenas: conexão MusyFit OK',profile:{name:state.name}})});const j=await r.json();toast(r.ok?'IA online conectada.':`Servidor respondeu com erro.`)}catch(e){toast('Não foi possível conectar ao servidor da IA.')}};$('#edit').onclick=setupProfile;$('#reset').onclick=()=>{if(confirm('Apagar o perfil e reiniciar o MusyFit?')){['musyfit.v9','musyfit.v8','musyfit.v7','musyfit.v6','musyfit.v5','musyfit.v4','musyfit.v3','musyfit.v2','musyfit'].forEach(k=>localStorage.removeItem(k));state=JSON.parse(JSON.stringify(defaults));onboarding()}}}
async function scheduleWeekly(){try{if(!window.Capacitor?.Plugins?.LocalNotifications)return;const p=Capacitor.Plugins.LocalNotifications;const perm=await p.requestPermissions();if(perm.display!=='granted')return;await p.cancel({notifications:[{id:7001}]});await p.schedule({notifications:[{id:7001,title:'Seu resumo MusyFit 💪',body:'Veja sua evolução da semana e prepare seu próximo treino.',schedule:{on:{weekday:1,hour:9,minute:0},repeats:true}}]})}catch(e){console.warn(e)}}
async function cancelWeekly(){try{await Capacitor.Plugins.LocalNotifications.cancel({notifications:[{id:7001}]})}catch(e){}}
function modal(html){let d=document.createElement('div');d.id='modal';d.className='modal';d.innerHTML=`<div class="modalbox"><button class="modalclose" id="modalClose">×</button>${html}</div>`;document.body.appendChild(d);$('#modalClose').onclick=closeModal;d.onclick=e=>{if(e.target===d)closeModal()}}
function closeModal(){$('#modal')?.remove()}
function toast(text){let t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),20);setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)},2200)}
function render(){clearInterval(timerInt);if(!state.onboard)return onboarding();({home,train,coach,progress,profile}[state.tab]||home)()}
render();
