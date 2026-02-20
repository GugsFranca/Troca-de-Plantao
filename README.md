# Projeto Troca de Plantão - Cisbaf

O projeto `Troca de Plantão` é uma aplicação web desenvolvida para o **Cisbaf (Consórcio Intermunicipal de Saúde da Baixada Fluminense)**, com o objetivo de modernizar e otimizar a gestão de escalas de trabalho para as equipes do **SAMU Baixada** e das **UPAs (Unidades de Pronto Atendimento)** da região.

A plataforma centraliza e automatiza o processo de troca de plantões, reduzindo a necessidade de comunicação informal e garantindo um registro formal e auditável de todas as solicitações.

## ✨ Funcionalidades Principais

O sistema foi desenhado para ser simples e focado nas necessidades dos usuários, oferecendo as seguintes funcionalidades:

*   **Solicitação de Troca:** Uma interface intuitiva onde o colaborador pode facilmente solicitar a troca de um plantão, especificando a data e o colega com quem deseja trocar.
*   **Acompanhamento de Status:** Uma tela dedicada que permite ao colaborador e aos gestores acompanhar em tempo real o andamento da solicitação (ex: pendente, aprovada, recusada).
*   **Painel de Autorização:** Gestores e responsáveis possuem um painel exclusivo para visualizar, aprovar ou recusar as solicitações de troca, garantindo que as escalas permaneçam sempre completas.
*   **Notificações por E-mail:** O sistema envia e-mails automáticos para notificar os envolvidos sobre cada etapa do processo, desde a criação da solicitação até sua aprovação ou recusa final.

## 🛠️ Arquitetura e Tecnologias

Para garantir a robustez, segurança e escalabilidade que um sistema de saúde exige, o projeto foi construído com tecnologias modernas e consolidadas no mercado.

### **Backend**

O núcleo do sistema, responsável por toda a lógica de negócio, segurança e comunicação.

*   **Linguagem:** Java 21
*   **Framework Principal:** Spring Boot
*   **Módulos:** Spring Web (APIs REST), Spring Data JPA (Persistência de Dados), Spring Security (Autenticação e Autorização).
*   **Banco de Dados:** MySQL
*   **Autenticação:** Segurança baseada em Tokens JWT (JSON Web Token).
*   **Documentação da API:** Geração automática com SpringDoc (OpenAPI).

### **Frontend**

A interface do usuário, projetada para ser rápida, acessível e fácil de usar em diferentes dispositivos.

*   **Framework Principal:** Next.js (com React 19)
*   **Linguagem:** TypeScript
*   **Design e Componentes:** Chakra UI e Tailwind CSS.
*   **Gerenciamento de Formulários:** React Hook Form.
*   **Qualidade de Código:** Biome (ferramenta de formatação e linting).

---
