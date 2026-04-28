Foods Academy 

1.	Sobre a plataforma 

A plataforma consiste em um sistema web para gerenciamento de cursos e conteúdos educacionais destinado aos colaboradores das empresas Nutrihouse, Domaná e suas unidades operacionais.
O sistema permite disponibilizar conteúdos educacionais, como vídeos e materiais de treinamento, de forma centralizada, facilitando o acesso dos colaboradores aos cursos corporativos.
A autenticação dos usuários é realizada através do LDAP corporativo, garantindo integração com o diretório de usuários da empresa e evitando a necessidade de criação de credenciais específicas para o sistema.
A aplicação é hospedada em servidor com IIS, que atua como servidor web e ponto de entrada para os acessos ao sistema.
É importante destacar que o projeto não passou por uma fase formal de levantamento de requisitos ou modelagem inicial, como diagramas de caso de uso ou documentação de arquitetura. O desenvolvimento ocorreu de forma incremental, sendo evoluído conforme as necessidades do negócio surgiam.



2.	Contexto do Sistema / Visão Geral / Estrutura 
	 
A plataforma possui uma arquitetura baseada em aplicação web com API backend, responsável por autenticação, comunicação com banco de dados e controle de acesso aos conteúdos educacionais.
De forma geral, o sistema é composto por três camadas principais:

Interface Web (Frontend)
Responsável pela interface de interação com o usuário, permitindo:
•	autenticação no sistema
•	visualização de cursos disponíveis
•	acesso aos conteúdos educacionais
•	navegação entre módulos do sistema
A interface consome serviços da API backend para recuperar informações e validar permissões.

API Backend
A API é responsável por:
•	autenticação de usuários
•	validação de permissões
•	comunicação com o banco de dados
•	controle de acesso aos conteúdos
•	integração com o LDAP corporativo
A API foi desenvolvida utilizando Node.js com framework Express, disponibilizando endpoints HTTP que são consumidos pelo frontend.
Principais responsabilidades da API:
•	validar credenciais via LDAP
•	recuperar dados do banco de dados
•	controlar permissões de acesso
•	retornar dados estruturados em formato JSON

Banco de Dados
O sistema utiliza SQL Server para armazenamento das informações da plataforma.
Entre os dados armazenados estão:
•	cadastro de cursos
•	informações de conteúdos
•	registros de usuários
•	permissões de acesso
•	histórico de interações com cursos
