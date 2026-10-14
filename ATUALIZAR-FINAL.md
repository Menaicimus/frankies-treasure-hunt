# Localização final

Quando todos os pontos (pelo menos um) estiverem encontrados e o Firebase confirmar o estado, aparece uma animação de 3 segundos com a mensagem:
Todos os pontos encontrados. Localização final desbloqueada.
Depois aparece o texto configurado e a imagem por baixo. É possível saltar a animação, voltar aos pontos e reabrir o final. A preferência de movimento reduzido é respeitada.
Se o admin marcar um ponto como não encontrado ou adicionar outro ponto por encontrar, o final volta a ficar bloqueado.

## Configuração
1. Publica o conteúdo completo de regras-firestore.txt em Firebase > Firestore > Regras. O UID do admin já está preenchido.
2. Atualiza admin.html no navegador e procura Localização final no topo do painel.
3. Preenche o texto e o endereço da imagem (nome do ficheiro publicado no GitHub ou URL HTTPS direto).
4. Clica em Guardar localização final.

A configuração fica em configuracao/final, com os campos texto e imagem. Só o admin pode escrever. O jogador autenticado pode ler, como nas outras pistas do jogo. O desbloqueio é uma regra da interface, não um mecanismo contra inspeção técnica das pistas.
A imagem pode ficar vazia até a fotografia estar preparada. Nenhum texto de exemplo é gravado no Firebase real.

## Publicação manual dos ficheiros (se necessária)
Extrai frankies-final-update.zip e carrega index.html, admin.html, game.js, finale.mjs e style.css para a raiz do repositório. Mantém os outros ficheiros e fotografias.
As regras precisam sempre de ser publicadas na consola Firebase; carregar regras-firestore.txt no GitHub não as aplica.

## Verificação
Testado com dados de demonstração: 2/3 não desbloqueia; 3/3 mostra animação e texto/imagem; voltar aos pontos e reabrir; repor um ponto bloqueia novamente. Não foram alterados os pontos reais para realizar estes testes.
