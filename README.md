# Inter-Knot Codes — central comunitária de códigos ZZZ

Página estática em HTML, CSS e JavaScript, sem dependências de build ou servidor.

## Publicar sem custo

Cloudflare Pages é uma opção adequada para este protótipo: conecte este repositório no painel do Cloudflare Pages, selecione **Direct Upload** ou a integração Git, e deixe o comando de build vazio. O diretório de saída é a raiz do projeto. Também é possível usar GitHub Pages para publicar os arquivos estáticos.

## Gerenciar códigos

A página pública é somente leitura: não oferece controles para adicionar ou remover códigos, e não salva alterações no navegador. Para atualizar a lista, edite `window.INTER_KNOT_CODES` em `codes-data.js` e publique uma nova versão. Cada código tem uma lista de recompensas com nome, quantidade e ícone (`assets/icons/`). Use `expiresAt` para uma data e hora ISO 8601 com fuso horário, ou `expiryStatus: 'permanent'` / `'undetermined'` para os estados correspondentes.

## Atualizar códigos

Não há cadastro ou sistema de contas no site. Para adicionar, atualizar ou remover códigos, edite `window.INTER_KNOT_CODES` em `codes-data.js` e publique os arquivos atualizados. Cada entrada pode incluir o código, recompensa, validade e status.

Cada botão **Resgatar** abre `https://zenless.hoyoverse.com/redemption?code=...`, o portal oficial de resgate. Os códigos podem expirar ou depender de região/conta; esta página não verifica validade junto à HoYoverse.

## Observação visual

O cenário é feito em CSS: uma sala lounge pastel, com sofá e pequenos detalhes que remetem a Random Play. O cartaz da parede recebe uma ilustração chibi do usuário com transparência. A personagem principal flutuante vem do GIF em `assets/ramielle.gif`, com uma leve flutuação vertical via CSS. `ramielle-theme.css` define a paleta rosa, creme e lavanda da página.
