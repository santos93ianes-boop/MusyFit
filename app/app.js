const $=(s,r=document)=>r.querySelector(s), $$=(s,r=document)=>[...r.querySelectorAll(s)];
const STORAGE='musyfit.v6';
const defaults={
  version:6,onboard:false,name:'Atleta',gender:'Homem',age:30,level:'Iniciante',goal:'Ganhar massa',days:4,place:'Academia',minutesTarget:50,
  equipment:['Máquinas','Cabos','Halteres','Barra'],weight:75,height:175,waist:85,chest:95,arm:32,hip:95,thigh:55,
  workouts:0,records:0,totalMinutes:0,streak:0,tab:'home',weeklyNotifications:true,restDefault:90,
  history:[],assessments:[],completed:{},seriesProgress:{},loads:{},favorites:[],coachHistory:[],apiUrl:'',lastWorkoutDate:null,activeWorkout:null,activeRest:null
};
let previousKey=['musyfit.v5','musyfit.v4','musyfit.v3','musyfit.v2','musyfit'].find(k=>localStorage.getItem(k));
let previous=previousKey?JSON.parse(localStorage.getItem(previousKey)||'{}'):{};
let state=Object.assign({},defaults,JSON.parse(localStorage.getItem(STORAGE)||'{}'));
if(!localStorage.getItem(STORAGE)&&previousKey){
 state=Object.assign({},defaults,previous,{version:6,place:'Academia',activeWorkout:null,activeRest:null,seriesProgress:{},completed:{}});
}
state.version=6;state.place='Academia';state.equipment=['Máquinas','Cabos','Halteres','Barra'];
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
function scheme(){
 if(state.gender==='60+') return {sets:state.level==='Iniciante'?2:3,reps:'10–15',rest:90};
 if(state.goal==='Força') return {sets:4,reps:'4–6',rest:150};
 if(state.goal==='Ganhar massa'||state.goal==='Definição') return {sets:state.level==='Iniciante'?3:4,reps:'8–12',rest:90};
 if(state.goal==='Condicionamento'||state.goal==='Emagrecer') return {sets:3,reps:'12–15',rest:60};
 return {sets:3,reps:'10–15',rest:75};
}
function prescription(e,s){
 if(e.kind==='minutes'){
  const mins=state.level==='Iniciante'?10:state.level==='Intermediário'?15:20;
  return {sets:1,reps:`${mins} min`,rest:0};
 }
 if(e.kind==='seconds') return {sets:e.cat==='Mobilidade'?2:3,reps:e.cat==='Mobilidade'?'30–45 s':'30–60 s',rest:e.cat==='Mobilidade'?30:60};
 return {sets:s.sets,reps:s.reps,rest:s.rest};
}
function balancedExercises(cats,limit){
 const pools=cats.map(cat=>LIB.filter(e=>e.cat===cat));
 const picked=[];let round=0;
 while(picked.length<limit){
  let added=false;
  for(let i=0;i<cats.length&&picked.length<limit;i++){
   const pool=pools[i]; if(!pool.length) continue;
   const offset=(state.workouts+i)%pool.length;
   const ex=pool[(round+offset)%pool.length];
   if(ex&&!picked.some(x=>x.id===ex.id)){picked.push(ex);added=true;}
  }
  if(!added||round>20)break;round++;
 }
 return picked;
}
function splitFor(dayIndex=0){
 const splits={
  2:[['Pernas','Peito','Costas','Core'],['Pernas','Ombros','Braços','Core']],
  3:[['Peito','Ombros','Braços'],['Costas','Braços','Core'],['Pernas','Core']],
  4:[['Peito','Costas','Ombros'],['Pernas','Core'],['Peito','Costas','Braços'],['Pernas','Ombros','Core']],
  5:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Costas','Ombros'],['Pernas','Core']],
  6:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core']],
  7:[['Peito','Ombros','Braços'],['Costas','Braços'],['Pernas','Core'],['Peito','Costas'],['Ombros','Braços'],['Pernas','Core'],['Cardio','Mobilidade']]
 };
 if(state.gender==='60+'){
  const senior=[['Pernas','Core','Mobilidade'],['Peito','Costas','Cardio'],['Pernas','Ombros','Core'],['Costas','Braços','Mobilidade']];
  return senior[dayIndex%senior.length];
 }
 const arr=splits[Math.max(2,Math.min(7,state.days))]||splits[4];
 return arr[dayIndex%arr.length];
}
function planFor(dayIndex=0){
 const s=scheme(),cats=splitFor(dayIndex),limit=state.level==='Iniciante'?6:7;
 const arr=balancedExercises(cats,limit).map(e=>({...e,...prescription(e,s)}));
 return {title:cats.join(' + '),items:arr};
}
function newWorkout(){
 const p=planFor(state.workouts);
 return {id:`w${Date.now()}`,dayIndex:state.workouts,startedAt:new Date().toISOString(),plan:p,completed:[],seriesProgress:{}};
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
function nav(){return `<nav class="nav">${[['home','⌂','Início'],['train','🏋','Treinos'],['coach','✦','Coach'],['progress','▥','Evolução'],['profile','♙','Perfil']].map(x=>`<button data-tab="${x[0]}" class="${state.tab===x[0]?'active':''}"><span>${x[1]}</span>${x[2]}</button>`).join('')}</nav>`}
function shell(body){$('#app').innerHTML=`<main class="shell">${body}</main>${nav()}`;$$('[data-tab]').forEach(b=>b.onclick=()=>{state.tab=b.dataset.tab;save();render()})}
function onboarding(){ $('#app').innerHTML=`<main class="shell welcome"><div class="logo">M<b>F</b></div><div class="brand big">MUSY<b>FIT</b></div><p class="sub">Seu parceiro em cada treino</p><div class="hero"><span class="kicker">PERSONAL TRAINER INTELIGENTE</span><h1>Treino que evolui com você.</h1><p class="muted">Planos personalizados, evolução, timer, avaliação corporal e Musy Coach.</p></div><button class="btn" id="start">COMEÇAR</button><p class="legal">Orientação fitness geral. Não substitui avaliação médica ou de profissional habilitado.</p></main>`; $('#start').onclick=setupProfile }
function setupProfile(){
 $('#app').innerHTML=`<main class="shell"><div class="brand">MUSY<b>FIT</b></div><section class="section"><h1>Vamos personalizar</h1><p class="muted">As escolhas abaixo ajustam volume, exercícios e descanso.</p>
 <h2>Perfil</h2><div class="choice" id="gender">${['Homem','Mulher','60+'].map(v=>`<button class="${state.gender===v?'on':''}">${v}</button>`).join('')}</div>
 <div class="form2"><label>Nome<input class="input" id="name" value="${esc(state.name==='Atleta'?'':state.name)}"></label><label>Idade<input class="input" id="age" type="number" min="14" max="100" value="${state.age}"></label></div>
 <h2>Nível</h2><div>${['Iniciante','Intermediário','Avançado','Experiente'].map(v=>`<span class="pill ${state.level===v?'on':''}" data-level="${v}">${v}</span>`).join('')}</div>
 <h2>Objetivo</h2><div>${['Ganhar massa','Emagrecer','Definição','Força','Condicionamento','Mobilidade'].map(v=>`<span class="pill ${state.goal===v?'on':''}" data-goal="${v}">${v}</span>`).join('')}</div>
 <h2>Local de treino</h2><div><span class="pill on">Academia</span></div><p class="hint">MusyFit V6 foi otimizado exclusivamente para treinos em academia.</p>
 <div class="form2"><label>Dias/semana<input class="input" id="days" type="number" min="2" max="7" value="${state.days}"></label><label>Min/treino<input class="input" id="mins" type="number" min="20" max="120" value="${state.minutesTarget}"></label></div>
 <button class="btn" id="go">CRIAR MEU PLANO</button></section></main>`;
 $$('#gender button').forEach(b=>b.onclick=()=>{state.gender=b.textContent;setupProfile()}); $$('[data-level]').forEach(b=>b.onclick=()=>{state.level=b.dataset.level;setupProfile()}); $$('[data-goal]').forEach(b=>b.onclick=()=>{state.goal=b.dataset.goal;setupProfile()});
 $('#go').onclick=()=>{state.name=$('#name').value.trim()||'Atleta';state.age=+$('#age').value||30;state.days=Math.max(2,Math.min(7,+$('#days').value||4));state.minutesTarget=+$('#mins').value||50;state.place='Academia';state.onboard=true;save();scheduleWeekly();state.tab='home';render()}
}
function home(){const p=planFor(state.workouts);const week=state.history.filter(h=>Date.now()-new Date(h.date).getTime()<7*864e5).length; const progress=Math.min(100,Math.round((state.workouts/20)*100)); shell(`
 <header class="row"><div><div class="brand">MUSY<b>FIT</b></div><h1>Olá, ${esc(state.name)} 👋</h1><p class="muted">Seu plano está pronto para hoje.</p></div><button class="iconbtn" id="bell">🔔</button></header>
 <section class="hero workoutHero"><span class="kicker">TREINO DE HOJE</span><h1>${p.title}</h1><p>${p.items.length} exercícios • ~${state.minutesTarget} min</p><button class="btn" id="begin">COMEÇAR TREINO ▶</button></section>
 <section class="grid stats"><div class="stat">🔥<strong>${week}</strong><span>esta semana</span></div><div class="stat">🏆<strong>${state.records}</strong><span>recordes</span></div><div class="stat">⏱<strong>${fmtMin(state.totalMinutes)}</strong><span>treinadas</span></div><div class="stat">↗<strong>${progress}%</strong><span>jornada</span></div></section>
 <section class="card coach" id="ask"><div class="avatar">✦</div><div class="grow"><b>MUSY COACH AI</b><div class="muted">Pergunte sobre sua ficha e exercícios.</div></div><span>›</span></section>
 <section class="section"><div class="row"><h2>Próximos treinos</h2><button class="link" id="allPlans">ver plano</button></div><div class="scrollcards">${[0,1,2].map(i=>{let q=planFor(state.workouts+i);return `<div class="miniPlan"><b>${i===0?'Hoje':`Treino ${i+1}`}</b><span>${q.title}</span><small>${q.items.length} exercícios</small></div>`}).join('')}</div></section>
 <section class="section card"><div class="row"><div><b>Consistência</b><div class="muted">${state.streak} semanas em sequência</div></div><span class="badge">${week}/${state.days}</span></div><div class="bar"><i style="width:${Math.min(100,week/state.days*100)}%"></i></div></section>`);
 $('#begin').onclick=startWorkout;$('#ask').onclick=()=>{state.tab='coach';save();render()};$('#allPlans').onclick=()=>{state.tab='train';save();render()};$('#bell').onclick=()=>toast(state.weeklyNotifications?'Resumo semanal ativo.':'Notificações semanais desativadas.');
}
function train(){
 const w=ensureWorkout(), p=w.plan, done=w.completed||[];
 shell(`<div class="row"><div><span class="kicker">SEU PLANO</span><h1>${p.title}</h1><p class="muted">${state.level} • ${state.goal} • ${state.place}</p></div><span class="badge">${done.length}/${p.items.length}</span></div><div class="card">${p.items.map((e,i)=>`<div class="exercise ${done.includes(e.id)?'done':''}"><div class="num">${done.includes(e.id)?'✓':i+1}</div><div class="grow"><b>${e.n}</b><div class="muted">${e.sets} × ${e.reps} • ${e.m}</div></div><button class="pill" data-ex="${e.id}">Abrir</button></div>`).join('')}</div><section class="section card"><b>Academia inteligente</b><p class="muted">Máquina ocupada? Abra o exercício e toque em <b>Substituir</b>. A troca fica salva neste treino.</p></section><section class="section"><button class="btn alt" id="finish">FINALIZAR TREINO</button></section>`);
 $$('[data-ex]').forEach(b=>b.onclick=()=>exercise(b.dataset.ex));$('#finish').onclick=finishWorkout
}
let timerInt=null;
function exercise(id){
 const w=ensureWorkout(), p=w.plan, e=p.items.find(x=>x.id===id); if(!e){state.tab='train';save();return render()}
 const load=state.loads[id]||{prev:0,current:0};
 const completedSeries=Math.min(Number(w.seriesProgress?.[id]||0),e.sets), finished=completedSeries>=e.sets;
 shell(`<button class="back" id="back">‹ Voltar</button><span class="kicker">EXERCÍCIO</span><h1>${e.n}</h1>
 <div class="exerciseVisual"><div class="bodyIcon">🏋️</div><div><b>${e.m}</b><p>${e.cue}</p><span class="badge">${e.eq}</span></div></div>
 <section class="card"><div class="row"><div><span class="muted">Séries</span><strong class="bigNumber">${e.sets}</strong></div><div><span class="muted">Repetições</span><strong class="bigNumber">${e.reps}</strong></div><div><span class="muted">Descanso</span><strong class="bigNumber">${e.rest}s</strong></div></div></section>
 <section class="section card seriesCard"><div class="row"><div><span class="kicker">PROGRESSO</span><h2>${finished?'Exercício concluído':`Série ${completedSeries+1} de ${e.sets}`}</h2></div><span class="badge">${completedSeries}/${e.sets}</span></div><div class="seriesDots">${Array.from({length:e.sets},(_,i)=>`<i class="${i<completedSeries?'on':''}">${i<completedSeries?'✓':i+1}</i>`).join('')}</div></section>
 <section class="section"><h2>Carga</h2><div class="grid"><div class="stat"><span>Anterior</span><strong>${load.prev||'—'}${load.prev?' kg':''}</strong></div><div class="stat"><span>Hoje</span><input class="loadInput" id="load" type="number" step="0.5" min="0" value="${load.current||load.prev||''}" placeholder="kg"></div></div><p class="hint">Aumente a carga apenas quando concluir as séries com técnica consistente. Progressão pequena é opcional.</p></section>
 <button class="btn" id="done" ${finished?'disabled':''}>${finished?'✓ EXERCÍCIO CONCLUÍDO':(e.rest>0?'✓ CONCLUIR SÉRIE E DESCANSAR':'✓ CONCLUIR EXERCÍCIO')}</button>
 <div id="timerBox">${e.rest>0?`<section class="section card restPreview"><div class="row"><div><span class="kicker">CRONÔMETRO DE DESCANSO</span><b>${e.rest} segundos</b></div><button class="pill" id="startRest">▶ Iniciar</button></div><p class="hint">Inicia automaticamente após cada série e continua correto se o app for minimizado.</p></section>`:`<section class="section card restPreview"><span class="kicker">SEM INTERVALO PROGRAMADO</span><p class="hint">Este exercício é contínuo. Conclua após cumprir o tempo indicado.</p></section>`}</div>
 <section class="section grid"><button class="btn alt" id="replace">⇄ SUBSTITUIR</button><button class="btn alt" id="how">? COMO FAZER</button></section>`);
 $('#back').onclick=()=>{state.tab='train';save();render()};
 $('#load').onchange=x=>{state.loads[id]={prev:load.prev||0,current:+x.target.value||0};save()};
 $('#done').onclick=()=>completeSeries(e,id); if($('#startRest'))$('#startRest').onclick=()=>startTimer(e.rest,id,e,false);
 $('#replace').onclick=()=>showReplacements(e); $('#how').onclick=()=>showGuide(e);
 if(state.activeRest?.workoutId===w.id&&state.activeRest?.exerciseId===id) resumeTimer(e,id);
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
function showGuide(e){modal(`<h2>${e.n}</h2><div class="guideSteps"><b>1. Prepare</b><p>${e.cue}</p><b>2. Execute</b><p>Use amplitude confortável, respire naturalmente e mantenha controle nas duas fases do movimento.</p><b>3. Pare se necessário</b><p>Dor aguda, tontura, falta de ar incomum ou perda de controle são motivos para interromper e buscar orientação adequada.</p></div>`)}
function finishWorkout(){
 const w=state.activeWorkout;if(!w)return toast('Nenhum treino em andamento.');const done=w.completed||[];
 if(!done.length&&!confirm('Nenhum exercício foi concluído. Registrar o treino mesmo assim?'))return;
 if(done.length<w.plan.items.length&&!confirm(`Você concluiu ${done.length} de ${w.plan.items.length} exercícios. Finalizar mesmo assim?`))return;
 const d=new Date(),elapsed=Math.max(1,Math.round((d-new Date(w.startedAt))/60000));state.workouts++;state.totalMinutes+=elapsed;
 state.history.unshift({sessionId:w.id,date:d.toISOString(),title:w.plan.title,minutes:elapsed,completed:done.length,total:w.plan.items.length,groups:[...new Set(w.plan.items.filter(x=>done.includes(x.id)).map(x=>x.cat))]});state.history=state.history.slice(0,100);
 Object.keys(state.loads).forEach(k=>{let l=state.loads[k];if(l.current>l.prev&&l.prev>0)state.records++;if(l.current>0)l.prev=l.current;l.current=0});
 state.lastWorkoutDate=d.toISOString();state.activeWorkout=null;state.activeRest=null;state.streak=recalcStreak();save();toast('Treino registrado! Sua evolução foi atualizada.');state.tab='home';setTimeout(render,500)
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
function coach(){const messages=state.coachHistory.slice(-12),api=(state.apiUrl||window.MUSYFIT_AI_URL||'').trim();shell(`<div class="row"><div><h1>Musy Coach <span class="online">●</span></h1><p class="muted">Assistente de treino do MusyFit</p></div><span class="badge">${api?'IA ONLINE':'MODO LOCAL'}</span></div><div class="card chat" id="chat"><div class="bubble">Olá, ${esc(state.name)}! 💪 Posso explicar sua ficha, exercícios, descanso, progressão e substituições. Não faço diagnóstico médico.</div>${messages.map(m=>`<div class="bubble ${m.role==='user'?'me':''}">${esc(m.text)}</div>`).join('')}</div><div class="composer"><textarea class="input" id="q" rows="2" placeholder="Digite sua dúvida..."></textarea><button class="send" id="send">➤</button></div><div class="quickrow">${['Como fazer este exercício?','Quanto descansar?','Máquina ocupada','Como evoluir minha carga?'].map(x=>`<button class="pill quick">${x}</button>`).join('')}</div><p class="hint">Quando um servidor de IA estiver configurado, o Coach usa seu perfil e histórico. Sem internet, continua com orientação local.</p>`);function ask(q){if(!q.trim())return;appendChat('user',q);$('#q').value='';replyAI(q)}$('#send').onclick=()=>ask($('#q').value);$$('.quick').forEach(x=>x.onclick=()=>ask(x.textContent));$('#q').onkeydown=e=>{if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();ask(e.target.value)}};scrollChat()}
function appendChat(role,text){state.coachHistory.push({role,text,date:new Date().toISOString()});state.coachHistory=state.coachHistory.slice(-30);save();const c=$('#chat');if(c)c.insertAdjacentHTML('beforeend',`<div class="bubble ${role==='user'?'me':''}">${esc(text)}</div>`);scrollChat()}
async function replyAI(q){const c=$('#chat');c.insertAdjacentHTML('beforeend','<div class="bubble typing" id="typing">Musy Coach está pensando…</div>');scrollChat();try{let text='';const api=(state.apiUrl||window.MUSYFIT_AI_URL||'').trim();if(api){const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:q,profile:{name:state.name,gender:state.gender,age:state.age,level:state.level,goal:state.goal,days:state.days,place:state.place},history:state.history.slice(0,8),plan:(state.activeWorkout?.plan||planFor(state.workouts)).items.map(x=>({name:x.n,sets:x.sets,reps:x.reps,muscles:x.m}))})});if(!r.ok)throw new Error('AI offline');const j=await r.json();text=j.answer||j.output||''}if(!text){const a=localAnswers.find(x=>x[0].test(q));text=a?a[1]:'Posso te ajudar com execução dos exercícios, séries, repetições, descanso, cargas, substituições, organização do treino e evolução. Me diga qual é a sua dúvida ou o nome do exercício.'}$('#typing')?.remove();appendChat('assistant',text)}catch(e){$('#typing')?.remove();const a=localAnswers.find(x=>x[0].test(q));appendChat('assistant',(a?a[1]:'Não consegui acessar a IA online agora. Ainda posso ajudar no modo local com exercícios, descanso, carga, substituições e organização do treino.'))}}
function scrollChat(){const c=$('#chat');if(c)c.scrollTop=c.scrollHeight}

function progress(){const bmi=(state.weight/((state.height/100)**2)).toFixed(1);const last=state.assessments[0];shell(`<div class="row"><div><span class="kicker">MUSY PROGRESS</span><h1>Evolução</h1></div><span class="badge">${state.workouts} treinos</span></div><section class="card muscleCard"><h2>Mapa muscular</h2><div class="bodymap"><div class="human">◉<br>╱┃╲<br>╱ ╲</div><div class="bars">${muscleStats().map(x=>`<div><div class="row small"><span>${x[0]}</span><b>${x[1]}%</b></div><div class="bar"><i style="width:${x[1]}%"></i></div></div>`).join('')}</div></div></section><section class="section grid"><div class="stat"><span>Peso</span><strong>${state.weight} kg</strong></div><div class="stat"><span>IMC</span><strong>${bmi}</strong></div><div class="stat"><span>Cintura</span><strong>${state.waist} cm</strong></div><div class="stat"><span>Treinos</span><strong>${state.workouts}</strong></div></section><section class="section card"><div class="row"><h2>Avaliação corporal</h2><button class="link" id="photo">+ foto</button></div><div class="form2"><label>Peso (kg)<input class="input" id="w" type="number" step="0.1" value="${state.weight}"></label><label>Altura (cm)<input class="input" id="h" type="number" value="${state.height}"></label><label>Cintura (cm)<input class="input" id="wa" type="number" value="${state.waist}"></label><label>Peito (cm)<input class="input" id="ch" type="number" value="${state.chest}"></label><label>Braço (cm)<input class="input" id="ar" type="number" value="${state.arm}"></label><label>Coxa (cm)<input class="input" id="th" type="number" value="${state.thigh}"></label></div><button class="btn" id="eval">SALVAR AVALIAÇÃO</button>${last?`<p class="hint">Última avaliação: ${new Date(last.date).toLocaleDateString('pt-BR')}</p>`:''}</section><section class="section"><h2>Histórico recente</h2>${state.history.slice(0,5).map(h=>`<div class="history"><div><b>${h.title}</b><span>${new Date(h.date).toLocaleDateString('pt-BR')}</span></div><div>${h.completed}/${h.total} • ${h.minutes} min</div></div>`).join('')||'<div class="card muted">Conclua seu primeiro treino para ver o histórico.</div>'}</section><input hidden id="photoInput" type="file" accept="image/*" capture="user">`);$('#eval').onclick=saveAssessment;$('#photo').onclick=()=>$('#photoInput').click();$('#photoInput').onchange=saveProgressPhoto}
function muscleStats(){const hist=state.history.slice(0,7),v={Peito:0,Costas:0,Pernas:0,Ombros:0,Braços:0,Core:0};hist.forEach(h=>{const g=h.groups||String(h.title||'').split(' + ');g.forEach(k=>{if(k in v)v[k]+=20});if(g.length)v.Core=Math.min(100,v.Core+5)});return Object.entries(v).map(([k,n])=>[k,Math.min(100,n)])}
function saveAssessment(){['w','h','wa','ch','ar','th'].forEach(()=>{});state.weight=+$('#w').value||state.weight;state.height=+$('#h').value||state.height;state.waist=+$('#wa').value||state.waist;state.chest=+$('#ch').value||state.chest;state.arm=+$('#ar').value||state.arm;state.thigh=+$('#th').value||state.thigh;state.assessments.unshift({date:new Date().toISOString(),weight:state.weight,waist:state.waist,chest:state.chest,arm:state.arm,thigh:state.thigh});state.assessments=state.assessments.slice(0,24);save();toast('Avaliação salva.');render()}
async function saveProgressPhoto(e){const f=e.target.files?.[0];if(!f)return;try{await idbPut('progressPhoto',{id:Date.now(),date:new Date().toISOString(),blob:f});toast('Foto de evolução salva somente neste aparelho.')}catch(err){toast('Não foi possível salvar a foto neste aparelho.')}}
function idbPut(storeName,obj){return new Promise((res,rej)=>{let rq=indexedDB.open('musyfit-media',1);rq.onupgradeneeded=()=>{let db=rq.result;if(!db.objectStoreNames.contains(storeName))db.createObjectStore(storeName,{keyPath:'id'})};rq.onsuccess=()=>{let tx=rq.result.transaction(storeName,'readwrite');tx.objectStore(storeName).put(obj);tx.oncomplete=()=>res();tx.onerror=()=>rej(tx.error)};rq.onerror=()=>rej(rq.error)})}

function profile(){shell(`<div class="row"><div><span class="kicker">PERFIL</span><h1>${esc(state.name)}</h1><p class="muted">${state.gender} • ${state.level}</p></div><div class="avatar bigav">${esc(state.name[0]||'M')}</div></div><section class="grid section"><div class="stat"><strong>${state.workouts}</strong><span>treinos</span></div><div class="stat"><strong>${state.streak}</strong><span>semanas</span></div></section><section class="section card settings"><label>Objetivo <b>${state.goal}</b></label><label>Local <b>${state.place}</b></label><label>Frequência <b>${state.days}x/semana</b></label><label>Descanso padrão <b>${state.restDefault}s</b></label><label class="switchline"><span>Resumo semanal</span><input id="notif" type="checkbox" ${state.weeklyNotifications?'checked':''}></label></section><section class="section card"><h2>Musy Coach AI</h2><p class="muted">Status: <b>${(state.apiUrl||window.MUSYFIT_AI_URL||'').trim()?'IA configurada':'Modo local'}</b>. A chave da IA nunca fica dentro do APK.</p><input class="input" id="api" placeholder="https://seu-backend.com/api/coach" value="${esc(state.apiUrl)}"><div class="grid sectionSmall"><button class="btn alt" id="saveApi">SALVAR SERVIDOR</button><button class="btn alt" id="testApi">TESTAR CONEXÃO</button></div></section><section class="section grid"><button class="btn alt" id="edit">EDITAR PERFIL</button><button class="btn alt" id="reset">RECOMEÇAR</button></section><p class="legal">Dados de treino ficam no aparelho. Fotos de evolução são armazenadas localmente no dispositivo.</p>`);$('#notif').onchange=e=>{state.weeklyNotifications=e.target.checked;save();if(state.weeklyNotifications)scheduleWeekly();else cancelWeekly()};$('#saveApi').onclick=()=>{state.apiUrl=$('#api').value.trim();save();toast('Servidor da IA salvo.')};$('#testApi').onclick=async()=>{const api=($('#api').value||window.MUSYFIT_AI_URL||'').trim();if(!api)return toast('Nenhum servidor de IA configurado.');toast('Testando conexão...');try{const r=await fetch(api,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:'Responda apenas: conexão MusyFit OK',profile:{name:state.name}})});const j=await r.json();toast(r.ok?'IA online conectada.':`Servidor respondeu com erro.`)}catch(e){toast('Não foi possível conectar ao servidor da IA.')}};$('#edit').onclick=setupProfile;$('#reset').onclick=()=>{if(confirm('Apagar o perfil e reiniciar o MusyFit?')){['musyfit.v6','musyfit.v5','musyfit.v4','musyfit.v3','musyfit.v2','musyfit'].forEach(k=>localStorage.removeItem(k));state=JSON.parse(JSON.stringify(defaults));onboarding()}}}
async function scheduleWeekly(){try{if(!window.Capacitor?.Plugins?.LocalNotifications)return;const p=Capacitor.Plugins.LocalNotifications;const perm=await p.requestPermissions();if(perm.display!=='granted')return;await p.cancel({notifications:[{id:7001}]});await p.schedule({notifications:[{id:7001,title:'Seu resumo MusyFit 💪',body:'Veja sua evolução da semana e prepare seu próximo treino.',schedule:{on:{weekday:1,hour:9,minute:0},repeats:true}}]})}catch(e){console.warn(e)}}
async function cancelWeekly(){try{await Capacitor.Plugins.LocalNotifications.cancel({notifications:[{id:7001}]})}catch(e){}}
function modal(html){let d=document.createElement('div');d.id='modal';d.className='modal';d.innerHTML=`<div class="modalbox"><button class="modalclose" id="modalClose">×</button>${html}</div>`;document.body.appendChild(d);$('#modalClose').onclick=closeModal;d.onclick=e=>{if(e.target===d)closeModal()}}
function closeModal(){$('#modal')?.remove()}
function toast(text){let t=document.createElement('div');t.className='toast';t.textContent=text;document.body.appendChild(t);setTimeout(()=>t.classList.add('show'),20);setTimeout(()=>{t.classList.remove('show');setTimeout(()=>t.remove(),250)},2200)}
function render(){clearInterval(timerInt);if(!state.onboard)return onboarding();({home,train,coach,progress,profile}[state.tab]||home)()}
render();
