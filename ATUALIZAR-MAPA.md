# Atualização: mapa por ponto

## O que mudou
- Botão Mapa no canto inferior direito, disponível nos pontos de distância e direção.
- Mapa OpenStreetMap com zoom e deslocação; mantém a vista ao alternar pontos.
- Distância: cada toque em Adicionar circunferência obtém uma posição GPS nova. O centro é essa posição e o raio é a distância ao destino naquele momento.
- Direção: cada toque em Adicionar linha regista uma reta que passa pela posição GPS e pelo destino. A reta prolonga-se até às bordas da vista, incluindo após zoom e deslocação. Não é uma rota de estradas.
- Não é mostrado um marcador no destino.
- Os desenhos são fixos: caminhar não move os que já adicionaste. Podes adicionar outros para comparar/intersetar as pistas.
- Remover último apaga apenas o desenho mais recente do ponto selecionado. Pode ser usado repetidamente.
- Os desenhos ficam online na coleção mapas, num documento com o mesmo ID do ponto. Permanecem ao fechar a página ou mudar de dispositivo.
- As pistas de imagem não têm mapa. Se mudares para uma delas através das setas do mapa, regressas à pista de imagem.
- Limite de 100 desenhos por ponto. GPS e internet são necessários para adicionar; internet é necessária para remover.

## 1. Atualizar o GitHub
Extrai frankies-map-update.zip. No repositório, Add file > Upload files, carrega os ficheiros extraídos e a pasta vendor, mantendo a estrutura:

index.html
game.js
style.css
hunt-map.js
map-geometry.mjs
vendor/leaflet.js
vendor/leaflet.css
vendor/LICENSE.txt

Guarda com Commit changes e aguarda pela atualização do GitHub Pages.
Não é necessário substituir firebase-config.js, as imagens ou admin.html.
Não apagues os ficheiros já existentes. O ZIP não inclui os dados do Firestore.

## 2. Atualizar as regras do Firebase
Abre regras-firestore.txt incluído nesta atualização.
O UID já está preenchido com o da conta de administrador que confirmámos: 7Vfs8c3XevgZLcZSOwXBmUg5Zue2.
No Firebase > Firestore Database > Regras, substitui o conteúdo pelo ficheiro completo e clica em Publicar.
É necessário publicar no Firebase: carregar o ficheiro para o GitHub não aplica regras.

A nova secção match /mapas/{id} permite a utilizadores autenticados guardar os desenhos de pontos existentes de distância/direção, sem dar permissão para alterar as pistas. As permissões dos objetivos continuam iguais.
Não precisas de criar a coleção mapas manualmente; ela é criada no primeiro desenho.

## 3. Testar no telemóvel
1. Atualiza a página do jogo. Num ponto de distância, confirma o botão Mapa no canto inferior direito.
2. Abre o mapa e toca em Adicionar circunferência. Permite a localização e espera pela confirmação de gravação online.
3. Caminha alguns metros e adiciona outra. As duas devem permanecer nos locais onde foram criadas.
4. Toca em Remover último: deve ficar só a primeira.
5. Muda para um ponto de direção. Não devem aparecer as circunferências do ponto anterior. Adiciona uma linha; deve atravessar a vista nos dois sentidos.
6. Volta ao ponto anterior e confirma a circunferência. Recarrega a página e confirma que permanece.
7. Num ponto de imagem, confirma que não aparece o botão Mapa.

A gravação é feita numa transação para que a remoção e adição usem a lista mais recente do servidor. Se não houver internet, não é apresentada uma confirmação falsa de gravação.
Se vires Sem permissão ou Falta publicar as regras, confirma o passo 2 e fecha/volta a abrir o mapa.
O estado encontrado/não encontrado continua independente dos desenhos; repor um ponto como não encontrado não apaga o seu mapa.

## Verificação realizada
- Testes automáticos de distâncias, rumos, cores, retas horizontais/verticais/diagonais, retas fora da vista, pontos coincidentes, adição/remoção e dados inválidos.
- Teste visual no navegador com pontos, GPS e armazenamento simulados: adição, remoção, persistência após recarregar, isolamento entre pontos, pistas de imagem e ecrã móvel.
- A integração com o Firebase real e o GPS do telemóvel deve ser confirmada após os passos 1 e 2. Não foram modificados os pontos reais nem as regras publicadas.

O mapa usa Leaflet 1.9.4 (biblioteca incluída em vendor) e os mapas OpenStreetMap, com atribuição visível. Requer internet; não descarrega mapas em massa nem oferece cache offline.
