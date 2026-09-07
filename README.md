# MusyFit V6 — Academia

Atualização: correção da montagem de treinos combinados. Quando o treino exibe grupos como Peito + Braços ou Pernas + Costas, a lista agora distribui exercícios entre todos os grupos em vez de preencher a ficha pelo primeiro grupo da biblioteca. Mantém o cronômetro de descanso por série e o Musy Coach corrigido.

# MusyFit v3 — Personal Trainer Inteligente

Projeto Android híbrido (Capacitor) preparado para GitHub Actions gerar um APK funcional de teste.

## O que funciona nesta versão
- Onboarding com Homem / Mulher / 60+, idade, nível, objetivo, local e frequência de treino.
- Plano de treino gerado pelo perfil: iniciante, intermediário, avançado ou experiente.
- Biblioteca revisada exclusivamente para academia, com instruções de execução, equipamento e prescrição adequada por tipo de exercício.
- Academia Inteligente: troca de exercício por alternativa do mesmo grupo quando um aparelho estiver ocupado.
- Registro de séries, carga atual/anterior e sugestão conservadora de progressão.
- Cronômetro de descanso com +30 s, pular e vibração ao terminar.
- Registro completo do treino e histórico recente.
- Avaliação corporal: peso, altura, cintura, peito, braço, coxa e IMC.
- Fotos de evolução pela câmera/galeria, armazenadas localmente no aparelho via IndexedDB.
- Mapa muscular baseado no histórico recente.
- Resumo semanal por notificação local (segunda-feira às 9h), com opção de ativar/desativar.
- Musy Coach com dois modos:
  1. **IA online**, quando um backend seguro for configurado.
  2. **Modo local**, que continua respondendo dúvidas básicas sem internet.
- Dados de treino persistidos localmente no aparelho.
- Ícone MusyFit aplicado automaticamente durante o build Android.

## Gerar APK no GitHub
1. Crie um repositório vazio.
2. Envie todo o conteúdo deste ZIP para a raiz, incluindo `.github`.
3. Abra **Actions > Build MusyFit APK > Run workflow**.
4. Ao concluir, baixe o artifact **MusyFit-debug-apk**.

## Ativar a IA real com segurança
**Nunca coloque `OPENAI_API_KEY` dentro do APK.** Este projeto inclui `api/coach.js`, pronto para ser hospedado como função serverless compatível com Vercel.

1. Hospede o repositório/projeto na Vercel.
2. No ambiente do servidor, configure `OPENAI_API_KEY` e opcionalmente `OPENAI_MODEL`.
3. A função ficará em uma URL semelhante a `https://SEU-PROJETO.vercel.app/api/coach`.
4. No GitHub do app, crie o secret `MUSYFIT_AI_URL` com essa URL. O workflow injeta apenas a URL pública no APK, nunca a chave.
5. Também é possível informar a URL na tela **Perfil > Musy Coach AI** para teste.

A implementação do backend usa a API Responses da OpenAI. Para uso comercial, adicione autenticação de usuários, limites de uso, política de privacidade e controle de custos antes de distribuir amplamente.

## Aviso de saúde
O MusyFit é um app de apoio ao treino. Não faz diagnóstico, não trata lesões e não substitui médico, fisioterapeuta, nutricionista ou profissional de educação física. Usuários com condições clínicas, dor, lesões, gestação ou limitações importantes devem buscar orientação profissional.


## Novidades v3

- Cronômetro de descanso dentro de cada exercício.
- Início automático do descanso ao concluir cada série.
- Controle de séries 1/4, 2/4 etc. e conclusão somente após a última série.
- Pausar, pular, reduzir 15 s ou adicionar 30 s ao descanso.
- Vibração ao terminar o descanso.
- Musy Coach local corrigido: não repete o treino atual quando a pergunta não tem relação com a ficha.
- Atalhos do Coach focados em execução, descanso, máquina ocupada e progressão de carga.


## V6 — revisão de estabilidade
- Sessão de treino persistente, sem duplicar finalização.
- Séries e exercícios isolados por sessão, sem misturar treinos no mesmo dia.
- Substituições ficam salvas durante o treino.
- Cronômetro baseado em horário real, continua correto após minimizar/retomar.
- Tempo real do treino no histórico.
- Sequência semanal recalculada pelo histórico.
- Mapa muscular usa grupos realmente concluídos.
- Status e teste do backend do Musy Coach.
- Divisões de treino específicas para 2 a 7 dias/semana.


## V7 — Ícone premium
O ícone do launcher agora usa a arte premium aprovada em `assets/musyfit_app_icon.png`, redimensionada em alta qualidade para todas as densidades Android pelo workflow do GitHub.

## MusyFit V8
- Somente academia.
- Fichas por objetivo/modalidade e nível.
- 6 exercícios principais no Iniciante, 7 no Intermediário, 8 no Avançado e 9 no Experiente, além de aquecimento/finalização quando aplicável.
- Aquecimento, treino principal, condicionamento e mobilidade em blocos separados.
- Ciclos de 4 semanas para Iniciante e 6 semanas para demais níveis.
- Cronômetro por exercício, substituição de máquinas e histórico mantidos.
- Tela Evolução com safe-area Android e mapa corporal vetorial revisado.
