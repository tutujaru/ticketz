[![pt-br](https://img.shields.io/badge/lang-pt--br-red.svg)](README.pt.md)
[![en](https://img.shields.io/badge/lang-en-green.svg)](README.md)

# Sobre o Projeto

O **Ticketz** é um comunicador com recursos de CRM e helpdesk que utiliza o WhatsApp como meio de comunicação com os clientes.

## Autoria Original

Este projeto foi iniciado como [um projeto Open Source](https://github.com/canove/whaticket-community), publicado pelo desenvolvedor [Cassio Santos](https://github.com/canove) sob a licença permissiva MIT. Posteriormente, recebeu diversas melhorias por autores não identificados e foi distribuído comercialmente entre desenvolvedores e usuários com fornecimento do código-fonte.

Segundo informações contidas [neste vídeo](https://www.youtube.com/watch?v=SX_cGD5RLkQ), o projeto foi vazado e disponibilizado publicamente em determinado momento.

Após algumas pesquisas, foi identificado que a primeira versão SaaS do Whaticket foi criada pelo desenvolvedor [Wender Teixeira](https://github.com/w3nder), incluindo uma versão chamada [Whaticket Single](https://github.com/unkbot/whaticket-free), que utiliza a biblioteca Baileys para acesso ao WhatsApp.

É praticamente impossível identificar e creditar todos os autores das melhorias. O código publicado pelo canal [Vem Fazer](https://github.com/vemfazer/whaticket-versao-03-12-canal-vem-fazer) não menciona nenhuma licença; portanto, estou assumindo que todos os autores concordam em manter essas alterações sob a mesma licença do projeto original (MIT).

## Nova Licença

Como estou fazendo modificações e oferecendo este trabalho gratuitamente, quero que ele permaneça acessível a todos. Por isso, escolhi relicenciar sob a licença **AGPL**, que exige que qualquer pessoa com acesso ao sistema possa obter também o código-fonte.

Portanto, se você utilizar diretamente esta versão, é **obrigatório manter o link na tela “Sobre o Ticketz”, com acesso ao repositório**. Se preferir, pode mover o link para outro local, desde que seja de fácil acesso para qualquer usuário do sistema.

Caso você modifique o código, deve alterar o link para apontar para o repositório do seu fork ou outro local onde o código-fonte esteja disponível.

Se for usar partes do código apenas **para uso pessoal**, sinta-se à vontade — não precisa se preocupar com a licença AGPL. Porém, se for usar qualquer parte adicionada neste projeto em um sistema que será **comercializado**, deverá disponibilizar o código completo do sistema para os usuários ou entrar em contato com o autor para negociar uma licença alternativa.

## Objetivo

O objetivo deste projeto é manter atualizações abertas e melhorias sobre a versão SaaS publicada do Whaticket, com foco em qualidade da aplicação e facilidade de instalação e uso.

As melhorias feitas por mim serão adicionadas aqui, e, dependendo da situação, poderei incluir — sempre creditando — melhorias de outros projetos derivados do Whaticket Community ou Whaticket SaaS.

## Contribuindo com os Projetos Originais

Sempre que possível, pretendo enviar de volta melhorias para os projetos originais.

---

## Início Rápido em um Servidor Público

Imagens Docker estão disponíveis para que você possa colocar o **Ticketz** em funcionamento rapidamente em um servidor público (baremetal ou VPS).

### Primeira Instalação

Antes de começar, tenha em mãos:

- ✅ Um servidor limpo com Ubuntu 20.04 ou mais recente
- ✅ Portas 80 e 443 liberadas e não bloqueadas por firewall
- ✅ Um domínio (hostname) com DNS já apontando para o seu servidor

Depois disso, acesse seu servidor e execute o comando abaixo, substituindo com seu domínio e e-mail:

```bash
curl -sSL get.ticke.tz | sudo bash -s app.seudominio.com.br seu@email.com
```

Após alguns minutos, o sistema estará rodando no domínio informado.

> 🔐 Login padrão:
> - **Usuário:** o e-mail informado na instalação
> - **Senha:** `123456` (altere imediatamente)

### Atualização

Para atualizar para a versão mais recente:

```bash
curl -sSL update.ticke.tz | sudo bash
```

O sistema será reiniciado e atualizado automaticamente.

### Ver logs

Acesse a pasta de instalação:

```bash
cd ~/ticketz-docker-acme
```

Visualize os logs completos:

```bash
docker compose logs -t
```

Ou com acompanhamento em tempo real:

```bash
docker compose logs -t -f
```

---

## Executando a partir do Código-Fonte (com Docker)

Você precisa ter o **Docker** e o **Git** instalados. A forma de instalação depende do seu sistema operacional. [Guia oficial do Docker aqui](https://docs.docker.com/engine/install/).

Clone o repositório oficial mantido por mim:

```bash
git clone https://github.com/tutujaru/ticketz.git
cd ticketz
```

### Executando Localmente

Por padrão, o sistema roda apenas no computador local. Para acesso pela rede local, edite os arquivos `.env-backend-local` e `.env-frontend-local`, trocando `localhost` pelo IP da máquina (ex: `192.168.0.10`).

Para iniciar:

```bash
docker compose -f docker-compose-local.yaml up -d
```

> A aplicação ficará acessível na porta **3000**  
> Login padrão: `admin@ticketz.host` / `123456`

Para parar:

```bash
docker compose -f docker-compose-local.yaml down
```

---

## Executando na Internet (com seu domínio)

Com uma VPS configurada e acessível pela internet, edite os arquivos `.env-backend-acme` e `.env-frontend-acme`, configurando:

- **backend:** api.seudominio.com.br
- **frontend:** seudominio.com.br
- **email:** contato@seudominio.com.br

Caso utilize reCAPTCHA no cadastro, adicione as chaves nos arquivos `.env`.

Execute:

```bash
sudo docker compose -f docker-compose-acme.yaml up -d
```

> Após algum tempo, o Ticketz estará disponível no domínio configurado.

Para parar:

```bash
sudo docker compose -f docker-compose-acme.yaml down
```

---

## Aviso Importante

Este projeto **não possui qualquer vínculo com a Meta, WhatsApp ou empresas similares**. O uso do código é de responsabilidade do usuário e não implica responsabilidade do autor ou colaboradores do projeto.

---

## Esse Projeto te Ajudou?

Se esse projeto facilitou sua vida ou economizou tempo, considere apoiar com uma doação via **PIX** ou **PayPal**:

[![](https://www.paypalobjects.com/en_US/i/btn/btn_donateCC_LG.gif)](https://www.paypal.com/cgi-bin/webscr?cmd=_s-xclick&hosted_button_id=X6XHVCPMRQEL4)

**Chave PIX:**  
`0699c69d-0951-4686-a5b7-c6cd21aa7e15`

---

> Repositório oficial: [https://github.com/tutujaru/ticketz](https://github.com/tutujaru/ticketz)
