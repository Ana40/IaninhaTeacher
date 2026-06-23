# IAninha — Your English Teacher 👩‍🏫

**IAninha** é uma plataforma de tutoria de inglês inteligente, responsiva e focada na prática de conversação real (texto e voz). O projeto foi desenhado para ajudar profissionais, em especial desenvolvedores, a aprimorarem seu inglês em cenários do dia a dia e no ambiente corporativo (como reuniões Dailys e Plannings de Scrum).

> ☕❤️ **Criado por Ana Rodrigues com muito café e amor.**

---

## 🌟 O Projeto

O objetivo da IAninha é fornecer uma experiência de conversação fluida e humana. Diferente de tutores genéricos, a IAninha conta com uma orquestração avançada de Inteligências Artificiais e um *design system* moderno (*Glassmorphism* com tema Dark Mode).

### Funcionalidades Principais:
- **🎙️ Voz de Alta Fidelidade:** Integração nativa com a nuvem de ultra-velocidade da Groq. Utiliza o **Whisper Large V3** para entender sua pronúncia perfeitamente e o modelo **Orpheus TTS** (voz humana ultrarrealista) para as respostas.
- **🔄 Orquestração Multi-API (Fallback):** O sistema é à prova de falhas. Ele prioriza o Groq, usa o OpenRouter como fallback primário, e o Google Gemini como fallback secundário.
- **🏢 Enterprise Mode (Custom API):** Suporte total a **APIs Privadas Corporativas**! Se o firewall do seu trabalho bloquear as APIs públicas, você pode plugar a IAninha direto na infraestrutura interna da sua empresa.
- **💼 Módulos Focados no Mercado:** Módulo exclusivo **Agile & Salesforce** para simular um Scrum Master / Tech Lead, exigindo updates em inglês e treinando sua desenvoltura para o mercado global.
- **💡 Correções Didáticas:** A IAninha gera "Tip Boxes" flutuantes corrigindo erros gramaticais ou sugerindo termos mais nativos de forma amigável.

---

## 🚀 Como Usar

A IAninha roda 100% no navegador (Client-Side) para evitar qualquer problema de bloqueios. 

**Acesse via GitHub Pages:** [https://Ana40.github.io/IaninhaTeacher/](https://Ana40.github.io/IaninhaTeacher/)

### Configurando o Sistema (Chaves de Acesso)
Na tela inicial, você deve fornecer as formas de autenticação com a Inteligência Artificial. Você pode preencher apenas uma ou todas:
1. **Groq API Key** *(Recomendado - Mais Rápido + TTS Avançado)*: [Gerar Chave](https://console.groq.com/keys)
2. **OpenRouter API Key** *(Agregador Global)*: [Gerar Chave](https://openrouter.ai/keys)
3. **Google AI Studio Key** *(Backup Nativo)*: [Gerar Chave](https://aistudio.google.com/apikey)
4. **Corporate / Custom API** *(Ambiente de Trabalho)*: Para burlar firewalls em empresas rígidas, você pode plugar um Endpoint compatível com a OpenAI, inserindo URL Interna, Modelo e Token.

*(Dica de Ouro: Sempre que for usar a Corporate API no escritório, certifique-se de **deixar o campo da Groq completamente vazio** para ativar o modo de emergência de áudio).*

---

## 🔒 Segurança

As suas chaves de acesso (API Keys) ficam salvas **exclusivamente** no cache do seu próprio navegador (via `localStorage`). O repositório é composto de arquivos estáticos, o que significa que nenhum servidor intermediário tem acesso aos seus dados. A conexão sai da sua máquina direto para o servidor da IA escolhida.

---
*Developed by Ana Rodrigues.*
