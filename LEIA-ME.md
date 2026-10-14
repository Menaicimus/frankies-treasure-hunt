# Frankie's treasure hunt — configuração

Esta versão tem um único estado global, guardado no Firestore. Não usa o progresso local da versão anterior.
Todos os pontos ficam disponíveis desde o início. As setas percorrem a lista em círculo.
O jogador pode ler a tag de qualquer ponto; a aplicação abre esse ponto e marca-o como encontrado.
O admin pode marcar encontrado ou não encontrado e a alteração aparece no jogador sem recarregar.

## 1. Firebase Authentication

Abre https://console.firebase.google.com/ e seleciona frankies-treasure-hunt.
Em Authentication > Sign-in method, ativa:
- Email/Password, para o administrador.
- Anonymous (Anónimo), para o jogador entrar automaticamente sem formulário de login.

Em Authentication > Users, cria um utilizador com o teu email e palavra-passe, caso ainda não exista.
Copia o User UID desse utilizador. Não uses o UID de uma conta anónima.
Não partilhes a palavra-passe; só o UID é necessário para configurar as regras.

## 2. Firestore e regras

Se ainda não existe, cria uma base de dados Cloud Firestore, Standard, com o ID (default), em modo produção e numa região europeia.
Abre regras-firestore.txt nesta pasta e troca UID_DO_ADMIN pelo UID que copiaste.
No Firebase, Firestore Database > Rules, substitui as regras pelo conteúdo completo desse ficheiro e publica.
Estas regras substituem as regras anteriores que usavam o email do admin.

Permissões:
- Um utilizador autenticado pode ler os pontos.
- O jogador com autenticação anónima pode alterar apenas encontrado para true.
- Só o UID do admin pode criar/apagar pontos, editar pistas ou voltar a marcar como não encontrado.
- Tudo o resto é negado por omissão.

Este jogo pessoal valida a tag no navegador. Não é um sistema contra batota: quem tem acesso ao site e conhecimentos técnicos pode marcar um ponto sem a tag. As regras impedem que o jogador edite as pistas ou reponha estados.

Não precisas de criar a coleção manualmente: o painel cria objetivos ao adicionares o primeiro ponto.
Pontos antigos sem o campo encontrado aparecem como não encontrados. Os códigos NFC antigos mantêm-se; não precisas de regravar as tags existentes.

## 3. Publicar com HTTPS no GitHub Pages

1. Cria um repositório público, por exemplo frankies-treasure-hunt, no GitHub (ou usa o que já tens).
2. Carrega o CONTEÚDO da pasta V1 para a raiz do repositório. index.html deve ficar diretamente na raiz.
3. Inclui index.html, admin.html, game.js, geo.mjs, style.css, firebase.js, firebase-config.js, sw.js, manifest.json, icon-192.png e icon-512.png, e a pasta imagens se tiver fotografias.
4. Não carregues cacada.zip (é a versão antiga), os scripts da pasta tools nem ZIPs de distribuição.
5. Settings > Pages > Source: Deploy from a branch > main > / (root) > Save.
6. Aguarda pela publicação e abre o endereço HTTPS mostrado pelo GitHub.
7. Quando alterares ficheiros, volta a carregá-los para o mesmo repositório e aguarda pela nova publicação.

O ZIP frankies-treasure-hunt-v2.zip na pasta principal contém os ficheiros desta versão. Extrai-o antes de carregar os ficheiros para o GitHub: não publiques apenas o ZIP.
A configuração Firebase já preenchida é mantida. Não coloques palavras-passe nem chaves privadas de contas de serviço nos ficheiros do site.

No Firebase > Authentication > Settings > Authorized domains, adiciona o domínio publicado (por exemplo nome.github.io, sem https:// e sem o caminho do repositório), caso ainda não esteja autorizado.

## 4. Criar os pontos

Abre https://TEU-ENDERECO/admin.html e entra com o email e palavra-passe do admin.
Para cada ponto:
1. Preenche o nome.
2. Escolhe distância, direção ou imagem.
3. Para distância/direção: escreve latitude, longitude com ponto decimal (38.7223, -9.1393), ou usa a localização atual no local real.
4. Para imagem: preenche o endereço direto da imagem. Coordenadas não são necessárias neste modo.
5. Escolhe o estado inicial, normalmente Não encontrado.
6. Adiciona o ponto. Usa ▲ e ▼ para alterar a ordem da navegação.

Podes alterar o estado diretamente na lista com Marcar encontrado / Marcar não encontrado, ou no formulário Editar.
As regras verificam o UID do admin, mesmo que outro utilizador consiga abrir a página de administração.

## 5. Associar fotografias

Opção simples, sem Firebase Storage:
1. Guarda a fotografia na pasta V1/imagens, por exemplo jardim.jpg.
2. Publica essa pasta no mesmo repositório do site.
3. No ponto de imagem, escreve imagens/jardim.jpg no campo Endereço da imagem.
4. Confirma a pré-visualização e guarda.

Também podes usar um URL HTTPS direto e público para um JPG/PNG/WebP.
Links de páginas do Google Drive, álbuns ou páginas de partilha não são necessariamente endereços diretos de imagem.
A imagem é mostrada inteira; evita fotografias demasiado pesadas para a ligação móvel.

## 6. Gravar as tags NFC

Usa Chrome num Android com NFC, uma tag NDEF gravável (por exemplo NTAG213 ou NTAG215) e o site HTTPS.
1. Ativa NFC nas definições do Android.
2. Abre /admin.html e entra.
3. No ponto correto, toca em Gravar tag.
4. Aceita a permissão e aproxima a tag da antena NFC, normalmente na parte de trás do telemóvel.
5. Espera pela confirmação e coloca a tag no local.

Gravar tag substitui o conteúdo anterior dessa tag. Usa tags destinadas a este jogo e não as bloqueies contra escrita durante os testes.

## 7. Teste completo no telemóvel

1. Abre o endereço principal do site no Chrome Android. Não abras index.html como ficheiro local.
2. Confirma que o título e todos os pontos aparecem e que as setas permitem percorrer a lista nos dois sentidos.
3. Num ponto de distância, toca em Ativar localização e orientação e permite a localização precisa.
4. A cor varia continuamente: verde até 10 m, amarelo a cerca de 105 m, vermelho a partir de 200 m. A distância real continua visível mesmo acima de 200 m.
5. Num ponto de direção, mantém o telemóvel plano, com o topo para a frente. Roda-o e confirma a orientação da seta. Sem bússola absoluta, a app pode usar o rumo GPS enquanto caminhas: nesse caso a seta é relativa ao movimento, não à rotação do telemóvel parado.
6. Num ponto de imagem, confirma que aparece a imagem certa, sem exigir GPS.
7. Toca no botão NFC no canto inferior esquerdo, permite a leitura e aproxima uma tag.
8. Aguarda pela mensagem Estado guardado online. Recarrega a página: o ponto deve continuar encontrado.
9. Noutro separador/dispositivo, abre o admin e marca esse ponto como Não encontrado. Confirma a mudança na página do jogador sem a recarregar.
10. Experimenta uma tag desconhecida: não deve marcar nenhum ponto.

Para validar permissões separadamente, usa o jogador numa janela privada ou noutro dispositivo, sem sessão de admin.
GPS e bússola não são exatos, sobretudo em interiores. O GPS orienta; a conclusão depende da tag, não de um raio de proximidade.
A leitura Web NFC desta versão requer Chrome Android; não funciona no iPhone. Instalar a página no ecrã inicial não muda essa limitação.
A sincronização requer internet. Não foi implementado um modo de jogo offline.

## Problemas frequentes

- auth/operation-not-allowed: ativa Anonymous em Authentication (e Email/Password para o admin).
- permission-denied: confirma que publicaste as novas regras e que o UID corresponde ao utilizador admin.
- Não aparece nenhum ponto: cria um no admin; confirma também que todos os documentos têm o campo ordem.
- GPS recusado: permite localização nas definições do site e do Android, usa HTTPS e tenta novamente.
- Seta à espera de orientação: verifica os sensores do telemóvel, calibra a bússola ou caminha para obter rumo GPS.
- Imagem não carrega: abre o endereço da imagem diretamente e verifica o nome e as maiúsculas/minúsculas.
- Continua a aparecer a versão antiga: fecha os separadores antigos e recarrega. Se necessário, limpa os dados do site; o estado desta versão permanece no Firestore.

## Verificação local para desenvolvimento

Na pasta principal, com Node instalado:
- node tools/check.mjs — valida os cálculos geográficos, as cores e a sintaxe.
- node tools/preview.mjs — abre um servidor local; http://127.0.0.1:4173/demo/ mostra pontos fictícios sem usar Firebase.
- http://127.0.0.1:4173/ usa a configuração Firebase real. O localhost do computador não é o localhost do telemóvel.

A demonstração não comprova sensores reais, leitura NFC nem regras publicadas. Esses testes fazem-se pelo passo 7 após configurar o projeto.

Referências oficiais:
- https://firebase.google.com/docs/auth/web/anonymous-auth
- https://firebase.google.com/docs/firestore/security/rules-fields
- https://developer.chrome.com/docs/capabilities/nfc
- https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
