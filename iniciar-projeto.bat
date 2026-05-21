@echo off
echo ====================================================================
echo           INICIANDO PROJETO CONTROLE FINANCEIRO COM IA
echo ====================================================================
echo.

:: 1. Verifica se o arquivo .env existe. Se nao existir, cria copiando do .env.example
if not exist .env (
    echo [INFO] Criando arquivo .env a partir do template .env.example...
    copy .env.example .env > nul
    if %errorlevel% neq 0 (
        echo [ERRO] Falha ao criar o arquivo .env.
        pause
        exit /b 1
    )
    echo [OK] Arquivo .env criado com sucesso!
    echo.
)

:: 2. Verifica se o Docker esta instalado e acessivel
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Docker nao esta instalado ou nao esta configurado no PATH.
    echo Por favor, abra o Docker Desktop antes de rodar este script.
    echo.
    pause
    exit /b 1
)

:: 3. Inicia os containers do Docker compose
echo [1/3] Construindo e iniciando os containers no Docker...
echo.
docker compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar os containers do Docker. 
    echo Certifique-se de que o Docker Desktop esta aberto e rodando.
    echo.
    pause
    exit /b 1
)

:: 4. Aguarda 5 segundos para que o banco PostgreSQL e o Node iniciem completamente
echo.
echo [2/3] Aguardando inicializacao completa do sistema (5 segundos)...
timeout /t 5 /nobreak > nul

:: 5. Abre o navegador padrao na porta do projeto
echo.
echo [3/3] Abrindo a aplicacao no navegador em http://localhost:3000 ...
start http://localhost:3000

echo.
echo ====================================================================
echo   PROJETO RODANDO COM SUCESSO!
echo ====================================================================
echo.
echo   * O Frontend e o Backend estao ativos na porta 3000.
echo   * O Banco de Dados PostgreSQL esta rodando em segundo plano.
echo   * A Inteligencia Artificial (Gemini) esta ativa via fallback.
echo.
echo   ================================================================
echo   ATENCAO: Mantenha esta janela aberta enquanto estiver usando o app.
echo   Para encerrar a aplicacao e parar os containers de forma limpa,
echo   pressione qualquer tecla nesta janela do terminal.
echo   ================================================================
echo.
pause
