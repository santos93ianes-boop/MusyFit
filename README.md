# MusyFit v2 — Personal Trainer Inteligente

Projeto Android híbrido (Capacitor) preparado para GitHub Actions gerar um APK funcional de teste.

## O que funciona nesta versão
- Onboarding com Homem / Mulher / 60+, idade, nível, objetivo, local e frequência de treino.
- Plano de treino gerado pelo perfil: iniciante, intermediário, avançado ou experiente.
- Biblioteca de exercícios para academia e casa, com instruções de execução.
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
