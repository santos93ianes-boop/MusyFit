module.exports = async function handler(req,res){
  res.setHeader('Access-Control-Allow-Origin', process.env.MUSYFIT_ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers','Content-Type');
  res.setHeader('Access-Control-Allow-Methods','POST,OPTIONS');
  if(req.method==='OPTIONS') return res.status(204).end();
  if(req.method!=='POST') return res.status(405).json({error:'Method not allowed'});
  if(!process.env.OPENAI_API_KEY) return res.status(503).json({error:'OPENAI_API_KEY não configurada'});
  const {message,profile={},history=[],plan=[]}=req.body||{};
  if(typeof message!=='string'||!message.trim()||message.length>1500) return res.status(400).json({error:'Mensagem inválida'});
  const context={profile,history:history.slice(0,8),plan:plan.slice(0,12)};
  const instructions=`Você é Musy Coach, assistente de treino do aplicativo MusyFit. Responda em português do Brasil, de forma curta, prática e motivadora. Use somente orientação geral de exercício e os dados de perfil/plano fornecidos. Não diagnostique doenças, não prescreva tratamento, não prometa prevenção de lesão e não substitua médico, fisioterapeuta, nutricionista ou profissional de educação física. Em caso de dor aguda, sintomas preocupantes, condição clínica, gestação, lesão ou limitação importante, recomende interromper e procurar profissional habilitado. Para carga, sugira progressão conservadora e opcional, priorizando técnica. Não invente dados do usuário.`;
  try{
    const r=await fetch('https://api.openai.com/v1/responses',{method:'POST',headers:{'Authorization':`Bearer ${process.env.OPENAI_API_KEY}`,'Content-Type':'application/json'},body:JSON.stringify({model:process.env.OPENAI_MODEL||'gpt-5',instructions,input:`Contexto do MusyFit:\n${JSON.stringify(context)}\n\nPergunta do usuário: ${message}`,max_output_tokens:500})});
    const j=await r.json();
    if(!r.ok) return res.status(502).json({error:'Falha no provedor de IA',detail:j?.error?.message||'Erro desconhecido'});
    let answer=j.output_text;
    if(!answer&&Array.isArray(j.output)) answer=j.output.flatMap(o=>o.content||[]).filter(c=>c.type==='output_text').map(c=>c.text).join('\n');
    if(!answer) return res.status(502).json({error:'Resposta vazia da IA'});
    res.status(200).json({answer});
  }catch(err){res.status(500).json({error:'Erro no servidor da IA'});}
}
