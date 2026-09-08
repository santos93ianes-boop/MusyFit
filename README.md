# MusyFit V11.2 — Correção de inicialização

Hotfix da V11 para evitar tela preta na abertura. Adiciona leitura segura de dados locais, migração protegida da V10/V11 e uma tela de erro visível caso o WebView encontre uma falha de inicialização. Mantém o Musy Coach conversacional e os recursos da V11.

# MusyFit V11 — Musy Coach Conversacional

Atualização baseada na V10, preservando a biblioteca visual, treinos, progresso, timer, cargas, substituições e geração de APK pelo GitHub Actions.

## Novidades da V11
- Musy Coach com conversa contextual: entende o exercício atualmente aberto e mantém o assunto entre mensagens.
- Base local ampliada para responder sobre toda a biblioteca de exercícios mesmo sem servidor de IA.
- Respostas locais sobre execução, músculos, aparelho, ajustes, séries, repetições, descanso, carga, erros comuns e substituições.
- Botão “Perguntar ao Musy Coach” dentro de cada exercício.
- Quando a IA online está configurada, o app envia perfil, treino atual, exercício atual, histórico recente e conversa anterior ao backend.
- Histórico do chat ampliado para manter uma conversa mais contínua.
- Regras de segurança para dor/sintomas sem transformar o Coach em diagnóstico médico.

## IA online
A chave da OpenAI fica somente no backend. Configure `OPENAI_API_KEY` no ambiente do Vercel e, opcionalmente, `OPENAI_MODEL`. Nunca coloque a chave dentro do APK.

## GitHub / APK
O workflow está em `.github/workflows/build-apk.yml`. No GitHub, execute **Actions > Build MusyFit APK > Run workflow**.


## Correção V11.2
- Restaura navegação, tela inicial e personalização ausentes no pacote anterior.
- Mantém o conteúdo, imagens e Musy Coach definidos na V11.
- Inicialização protegida para evitar tela preta.


## Atualização V11.2 — IMC
- Classificação automática do IMC na área Musy Progress.
- Faixas: baixo peso, peso adequado, sobrepeso e obesidade graus I, II e III.
- Orientação breve sobre perda de gordura, manutenção do peso ou ganho/preservação de massa muscular conforme a classificação.
- Aviso específico para perfil 60+: o IMC deve ser interpretado junto com massa muscular, força e condição de saúde.
- Aviso de que IMC é triagem e não substitui avaliação profissional.
