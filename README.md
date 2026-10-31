- Versão 2.0 do site 

# OBS - Instalar o Node.js
Windows (Recomendado): Use o winget no terminal (PowerShell/CMD): winget install OpenJS.NodeJS.LTS

Para checar use: node -v

# Órbita — Em breve

Página conceitual em português, React + Vite + Three.js, responsiva. A Órbita é uma futura base para portfólios e projetos, inspirada em missões espaciais. Marca fictícia para o TCC, sem vínculo com empresas reais. Não há formulário de cadastro nem promessa de lançamento em uma data fictícia.

## Versão 3 — código e leitura

- A página React foi separada em componentes por seção; textos e dados dos módulos ficam em uma lista simples.
- A requisição de visita está em `src/analytics.js`, com funções pequenas para preparar os dados e enviar o POST.
- Textos menores foram ampliados, com cores e fundos mais opacos para facilitar a leitura sobre a animação.
- O rodapé mostra símbolos de LinkedIn, Instagram e X. São apenas visuais até a Órbita ter perfis oficiais; não apontam para contas inventadas.
- `orbita-v3-projeto.zip` contém o código para editar no VS Code. `orbita-v3-s3-sem-api.zip` contém os arquivos compilados para enviar à raiz do S3, com a chamada de visitas desativada por enquanto.

## Versão 2 — universo em movimento

- Planeta procedural, lua, estrelas e três satélites com painéis solares, renderizados em WebGL pelo Three.js.
- Mudança de enquadramento com a rolagem, paralaxe discreta do ponteiro e entrada progressiva das seções.
- Módulos de portfólio/projetos/descoberta interativos, história da marca e plano de lançamento.
- Botão para pausar a cena; preferência do sistema por movimento reduzido respeitada; composição CSS alternativa quando WebGL não está disponível.
- Three.js carregado em módulo separado; resolução limitada para reduzir carga gráfica; sem modelos ou texturas externos. As fontes continuam vindo do Google Fonts.
- Tudo continua estático: HTML/CSS/JS no S3; nenhuma renderização no servidor.

Para o laboratório somente com S3/CloudFront, altere `analyticsEnabled` para `false` em `config.json`. Quando a API estiver pronta, use `true`. Se editar em `public/config.json`, compile novamente; o `config.json` da raiz do pacote compilado pode ser alterado diretamente antes de enviar ao S3. Invalide o cache desse arquivo após atualizar. A chamada à API está preservada e ativada por padrão, mas sua falha não impede o site.

O botão de pausa interrompe o movimento automático e a paralaxe da cena 3D. Ao rolar, a composição estática ainda acompanha a seção. A preferência de movimento reduzido também desativa transições CSS.

## Executar e editar

Requer Node.js 22.12+ ou uma versão LTS compatível com Vite 7.

```sh
npm ci
npm run dev
npm test
npm run build
npm run preview
```

O conteúdo fica em `src/main.jsx`; estilos em `src/style.css`. `dist/` contém somente arquivos estáticos prontos para publicar. React é incluído no JavaScript compilado: não é necessário Node no S3. As fontes vêm do Google Fonts, com alternativas locais se não carregarem; remova o @import para evitar essa requisição externa.

## Fluxo implementado

1. Navegador solicita a página ao CloudFront + WAF.
2. CloudFront entrega HTML/CSS/JS do S3 (ou de seu cache).
3. Após iniciar React, o navegador lê `/config.json` e faz **POST `/api/visits`** pelo mesmo domínio CloudFront.
4. O comportamento `/api/*` encaminha a chamada ao API Gateway → Lambda → DynamoDB.

É o JavaScript no navegador que dispara a chamada, não o S3 nem automaticamente o CloudFront. Cada novo carregamento gera um evento UUID; âncoras e abas internas não geram outro. O site abre mesmo com API offline. Bloqueadores, JavaScript desabilitado e falhas de rede podem impedir a contagem. Não é uma medição exata de visitantes únicos.

## Configuração AWS

Não há recursos AWS criados ou credenciais incluídas neste projeto. A Lambda é um exemplo de integração pronto para configurar e validar em sua conta.

### S3 e CloudFront

- Bucket privado, Block Public Access habilitado. Use origem REST do S3, não o endpoint de website.
- Configure Origin Access Control (OAC) e bucket policy permitindo leitura apenas à distribuição.
- Faça upload **do conteúdo de dist/** para a raiz do bucket. Defina `index.html` como Default Root Object.
- Comportamento padrão: origem S3, HTTPS, métodos GET/HEAD, cache dos arquivos estáticos.
- `assets/*`: cache longo (`public,max-age=31536000,immutable`), pois os nomes possuem hash.
- `index.html` e `config.json`: `no-cache` e comportamento/política sem TTL mínimo positivo; invalide `/index.html`, `/` e `/config.json` quando necessário.
- Esta página usa âncoras, não rotas SPA: não precisa transformar 403/404 globais em index.html. Isso mascararia erros da API.
- Associe seu Web ACL WAF à distribuição.

### API Gateway

- Crie uma HTTP API regional com stage `$default` e rota **POST /api/visits**.
- Configure integração Lambda proxy, payload 2.0, com permissão para o API Gateway invocar a função.
- Na distribuição CloudFront, adicione uma origem HTTPS com o domínio `ID.execute-api.REGIAO.amazonaws.com`, sem caminho no campo de domínio, e Origin Path vazio para `$default`.
- Crie comportamento **/api/*** apontando a essa origem, com precedência sobre o padrão. Habilite os métodos que incluem POST (no CloudFront, opção de todos os métodos), cache policy **CachingDisabled**.
- Use origin request policy personalizada que encaminhe `Content-Type`, `CloudFront-Viewer-Country`, `CloudFront-Viewer-Country-Region`, sem cookies e sem query strings. Não encaminhe o Host do visitante. Alternativa mais abrangente: **AllViewerExceptHostHeader**.
- Adicione custom origin header `X-Origin-Verify` com um segredo forte e configure o mesmo valor em `ORIGIN_VERIFY_SECRET` na Lambda. Nunca coloque esse segredo no frontend. Isso permite rejeitar chamadas diretas sem o cabeçalho, mas não é autenticação de usuários. Rotacione o segredo e configure throttling/WAF para abuso.
- CloudFront mantém o prefixo `/api`: a rota precisa ser `/api/visits`, não somente `/visits`. Para stage nomeado, configure Origin Path `/nome-do-stage` e adapte a validação de rawPath conforme o evento real.
- Como site e API compartilham origem, CORS não é necessário. Se usar URL direta em `public/config.json`, configure CORS na API para o domínio exato do site e adapte a proteção de origem; a configuração padrão foi projetada para CloudFront.

### Lambda e DynamoDB

- Tabela DynamoDB com partition key **eventId** (String), sem sort key, capacidade on-demand. Ative TTL no atributo **expiresAt** (30 dias no exemplo; expiração é assíncrona).
- Empacote `backend/lambda.mjs` e suas dependências (`npm install` dentro de backend); use runtime Node.js compatível, handler `lambda.handler`.
- Variáveis: `VISITS_TABLE` = nome da tabela e `ORIGIN_VERIFY_SECRET` = segredo da origem.
- Role da Lambda: `dynamodb:PutItem` apenas na tabela e permissões mínimas de logs. Nunca disponibilize credenciais AWS no navegador.
- Registro: eventId, visitedAt (horário UTC do servidor), source (domínio de referência), country, region e expiresAt. Não grava IP, user-agent, URL completa ou identificador persistente. Não faça log do evento bruto.
- País/região vêm dos cabeçalhos do CloudFront, são aproximados e podem estar ausentes. O domínio de referência é entrada não confiável e pode faltar; não o use para autorização.
- Escrita condicional evita duplicar o mesmo eventId. Recarregar a página gera outro id: visitas repetidas da mesma pessoa são contadas novamente.
- Os logs dos serviços AWS têm configurações próprias e podem conter IP. A ausência de IP nesta tabela não garante anonimização nem conformidade legal da implantação inteira.

## Verificar na AWS

Abra pelo domínio CloudFront, inspecione Network: `POST /api/visits` deve retornar 204. Confirme o item na tabela e os cabeçalhos de país/região. Recarregue: deve surgir novo evento. Clique nas perspectivas: não deve surgir outro evento. Bloqueie a API: a página deve continuar utilizável. Repita o mesmo eventId: apenas um item deve existir. Sem o cabeçalho de origem, a Lambda deve responder 403. Confira a visualização em celular.

O teste local valida payload, minimização de dados e falha HTTP. A integração real AWS depende da infraestrutura acima e não foi executada neste ambiente.

## Registro de interesse

O botão **"Registrar interesse"** da seção de lançamento só pode ser usado uma vez por navegador. Depois do clique, o registro fica salvo e continua valendo mesmo se a página for recarregada (F5).

### Como funciona

- O estado é guardado no `localStorage` do navegador, na chave `orbita-registered` com o valor `1`.
- Ao carregar a página, o componente `Launch` lê essa chave. Se ela existir, o botão já nasce como **REGISTRADO ✓** e desativado.
- O card "Sua presença foi confirmada" aparece **apenas no momento do clique**. Ele some sozinho depois de 8 segundos e não reaparece ao recarregar.
- Se o navegador bloquear o armazenamento (por exemplo, em alguns modos de privacidade), o registro vale somente até a página ser recarregada.

Arquivo: `src/main.jsx` (função `Launch`, `STORAGE_KEY` e `readRegistered`).

### Como testar

1. Abra o Console do navegador (F12) e limpe qualquer registro antigo:
   ```js
   localStorage.removeItem("orbita-registered");
   ```
2. Recarregue a página e clique em **Registrar interesse**.
3. Confirme que o botão virou **REGISTRADO ✓**, ficou desativado e o card apareceu.
4. Aperte F5. O botão deve continuar como **REGISTRADO ✓**, desativado, e o card **não** deve aparecer de novo.

Para conferir o valor salvo: F12 > **Application** > **Local Storage** > `http://127.0.0.1:5173` > chave `orbita-registered`.

### Como liberar um novo registro (testes)

Rode no Console:
```js
localStorage.removeItem("orbita-registered");
```
e recarregue a página.

### Limitações

- O registro é **por navegador**, e não por pessoa. Limpar os dados do navegador, usar uma aba anônima ou trocar de navegador ou dispositivo permite registrar de novo.
- O clique **não é enviado ao servidor**, então não entra em nenhuma contagem. Quem registra as visitas é o `recordPageView()` em `src/analytics.js`.
- Para impedir registros repetidos de verdade, o backend precisaria guardar algum identificador da pessoa. Isso muda o que o aviso de privacidade diz hoje ("não usamos identificador permanente").

## Referências oficiais

### Build e hospedagem
- https://vite.dev/guide/static-deploy
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/private-content-restricting-access-to-s3.html
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistValuesCacheBehavior.html
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/using-managed-origin-request-policies.html
- https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/adding-cloudfront-headers.html

### React e animação 3D
- https://react.dev/reference/react/useState (inicialização lazy do estado, usada em `readRegistered`)
- https://threejs.org/docs/ (cena do planeta em `Universe.jsx`)

### Registro de interesse e armazenamento
- https://developer.mozilla.org/en-US/docs/Web/API/Window/localStorage

### CSS e animações
- https://developer.mozilla.org/en-US/docs/Web/CSS/@property (ângulo animado da borda "cobra")
- https://developer.mozilla.org/en-US/docs/Web/CSS/gradient/conic-gradient
- https://developer.mozilla.org/en-US/docs/Web/CSS/@media/prefers-reduced-motion

### Acessibilidade
- https://developer.mozilla.org/en-US/docs/Web/CSS/:focus-visible
- https://developer.mozilla.org/en-US/docs/Web/HTML/Element/dialog (janela "Sobre os dados")
- https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html

By Gabriel & Arthur 