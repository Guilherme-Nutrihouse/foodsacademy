// chatbotData.js

const chatbotData = {
  "Menu Principal": {
    "1": { texto: "Acesso e Conta", next: "Acesso e Conta" },
    "2": { texto: "Cursos e Conteúdo", next: "Cursos e Conteúdo" },
    "3": { texto: "Suporte Técnico", next: "Suporte Técnico" },
    "4": { texto: "Progresso e Avaliações", next: "Progresso e Avaliações" },
    "5": { texto: "Informações Gerais", next: "Informações Gerais" }
  },

  "Acesso e Conta": {
    "1": { texto: "Quero trocar minha senha", resposta: "Abra um chamado no suporte de TI solicitando a troca de senha." },
    "2": { texto: "Como faço login na plataforma?", resposta: "Utilize o mesmo usuário e senha que você usa para acessar o computador da empresa." },
    "3": { texto: "Posso alterar meu e-mail ou nome de usuário?", resposta: "Essa alteração deve ser feita pelo suporte de TI. Entre em contato por e-mail ou abra um chamado." },
    "4": { texto: "Não consigo acessar meu curso", resposta: "Verifique qual curso está tentando acessar e abra um chamado informando o nome do curso. O suporte enviará o link correto." }
  },

  "Cursos e Conteúdo": {
    "1": { texto: "Onde encontro os cursos disponíveis?", resposta: "Todos os cursos ficam listados na página principal da plataforma." },
    "2": { texto: "Como começo uma aula?", resposta: "Clique no curso desejado e você será direcionado para a página do vídeo." },
    "3": { texto: "Posso baixar os vídeos para assistir offline?", resposta: "Não. Os vídeos estão disponíveis apenas para acesso online." },
    "4": { texto: "O curso tem certificado?", resposta: "No momento, os cursos não oferecem certificado de conclusão." },
    "5": { texto: "Até quando tenho acesso ao conteúdo?", resposta: "O acesso permanece disponível enquanto você estiver ativo na plataforma." }
  },

  "Suporte Técnico": {
    "1": { texto: "O vídeo não está carregando, como resolver?", resposta: "Atualize a página, limpe o cache do navegador ou tente outro navegador. Se o problema persistir, abra um chamado." },
    "2": { texto: "A plataforma está lenta, é só comigo?", resposta: "Verifique sua conexão de internet. Caso esteja normal, entre em contato com o suporte de TI." },
    "3": { texto: "Quais navegadores são compatíveis?", resposta: "Recomendamos o uso do Google Chrome ou Microsoft Edge para melhor desempenho." },
    "4": { texto: "Posso usar no celular/tablet?", resposta: "Não. A plataforma está disponível apenas para uso em computadores." }
  },

  "Progresso e Avaliações": {
    "1": { texto: "Como sei se concluí uma aula?", resposta: "Cada aula concluída ficará marcada com um ✔️ na lista de aulas do curso." },
    "2": { texto: "Onde vejo meu progresso no curso?", resposta: "O progresso pode ser acompanhado no painel do curso, com a porcentagem concluída." }
  },

  "Informações Gerais": {
    "1": { texto: "Como entro em contato com o suporte?", resposta: "Pelo e-mail de suporte ou abrindo um chamado no sistema de TI." },
    "2": { texto: "Existe custo para os cursos?", resposta: "Não. Os cursos são oferecidos gratuitamente para colaboradores da empresa." }
  }
};

export default chatbotData;
