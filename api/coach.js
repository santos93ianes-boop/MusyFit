module.exports = async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin', process.env.MUSYFIT_ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY não configurada'});

  const {message,profile={},workoutHistory=[],conversation=[],currentExercise=null,plan=[]}=req.body||{};
  if(typeof message!=='string'||!message.trim()||message.length>1800) return res.status(400).json({error:'Mensagem inválida'});

  const safeContext={
    profile,
    currentExercise,
    plan:Array.isArray(plan)?plan.slice(0,20):[],
    workoutHistory:Array.isArray(workoutHistory)?workoutHistory.slice(0,10):[],
    conversation:Array.isArray(conversation)?conversation.slice(-14):[]
  };

  const instructions=`Você é o Musy Coach, assistente conversacional de academia do aplicativo MusyFit. Responda em português do Brasil e converse de modo natural, como um treinador atencioso e objetivo. O foco é academia: exercícios, aparelhos, regulagem de máquinas, execução, posição inicial e final, músculos ativados, séries, repetições, descanso, carga, progressão, substituições, aquecimento, mobilidade, cardio, hipertrofia, força, definição, condicionamento e organização da ficha.

Use o contexto do perfil, treino atual, exercício atual, histórico recente e conversa anterior quando for relevante. Quando a pessoa disser “esse exercício”, “essa máquina”, “o anterior”, “posso trocar?” ou algo parecido, use currentExercise e a conversa para manter continuidade. Se o usuário citar um exercício do plano, responda especificamente sobre ele.

Para execução, dê instruções claras e práticas: ajuste inicial, postura, movimento, retorno, erros comuns e como reduzir dificuldade. Para carga, não invente um número exato de kg: use esforço percebido, repetições concluídas e qualidade técnica; sugira progressões conservadoras. Para substituições, preserve grupo muscular e função do exercício sempre que possível. Para aparelhos desconhecidos, peça o nome ou uma descrição objetiva do equipamento.

Não faça diagnóstico médico, tratamento, prescrição de medicamento ou promessa de prevenção de lesão. Em dor aguda, inchaço, perda de força, desmaio, falta de ar incomum, dor no peito ou sintomas preocupantes, recomende interromper o exercício e procurar atendimento/profissional habilitado. Não trate toda dúvida de desconforto como emergência: diferencie esforço muscular esperado de sinais de alerta sem diagnosticar.

Não invente dados do usuário nem afirme que viu uma foto, aparelho ou movimento que não foi enviado. Se faltar informação, faça no máximo uma pergunta curta antes de orientar. Prefira respostas úteis em 2 a 6 parágrafos curtos, mas aprofunde quando o usuário pedir.`;

  try{
    const r=await fetch('https://api.openai.com/v1/responses',{
      method:'POST',
      headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},
      body:JSON.stringify({
        model:process.env.OPENAI_MODEL||'gpt-5',
        instructions,
        input:`Contexto do MusyFit:\n${JSON.stringify(safeContext)}\n\nMensagem atual do usuário: ${message}`,
        max_output_tokens:800
      })
    });
    const j=await r.json();
    if(!r.ok) return res.status(502).json({error:'Falha no provedor de IA',detail:j?.error?.message||'Erro desconhecido'});
    let answer=j.output_text;
    if(!answer&&Array.isArray(j.output)) answer=j.output.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');
    if(!answer) return res.status(502).json({error:'Resposta vazia da IA'});
    return res.status(200).json({answer});
  }catch(err){
    return res.status(500).json({error:'Erro no servidor da IA'});
  }
}
