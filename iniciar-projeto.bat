@echo off
:: Configura o encoding para UTF-8 para exibir acentos corretamente no console do Windows
chcp 65001 > nul

echo ====================================================================
echo           INICIANDO PROJETO CONTROLE FINANCEIRO COM IA
echo ====================================================================
echo.

:: 1. Verifica se o Docker está instalado e acessível no PATH
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERRO] O Docker não está instalado ou não está configurado nas variáveis de ambiente.
    echo Por favor, instale e abra o Docker Desktop antes de executar este script.
    echo.
    pause
    exit /b 1
)

:: 2. Inicia os containers do Docker compose no modo silencioso (background)
echo [1/3] Construindo e iniciando os containers no Docker...
echo.
docker compose up --build -d
if %errorlevel% neq 0 (
    echo.
    echo [ERRO] Falha ao iniciar os containers do Docker. 
    echo Certifique-se de que o Docker Desktop está aberto e rodando em segundo plano.
    echo.
    pause
    exit /b 1
)

:: 3. Aguarda 5 segundos para que o banco PostgreSQL e o Node iniciem completamente
echo.
echo [2/3] Aguardando inicialização completa do sistema (5 segundos)...
timeout /t 5 /nobreak > nul

:: 4. Abre o navegador padrão na porta do projeto
echo.
echo [3/3] Abrindo a aplicação no navegador em http://localhost:3000 ...
start http://localhost:3000

echo.
echo ====================================================================
echo   PROJETO RODANDO COM SUCESSO!
echo ====================================================================
echo.
echo   * O Frontend e o Backend estão ativos na porta 3000.
echo   * O Banco de Dados PostgreSQL está rodando em segundo plano.
echo   * A Inteligência Artificial (Gemini) está ativa via fallback interno.
echo.
echo   ================================================================
echo   ATENÇÃO: Mantenha esta janela aberta enquanto estiver usando o app.
echo   Para encerrar a aplicação e parar os containers de forma limpa,
echo   pressione qualquer tecla nesta janela do terminal.
echo   ================================================================
echo.
pause

echo.
echo Encerrando e limpando os containers do Docker...
echo.
docker compose down
echo.
echo Todos os serviços foram desligados com sucesso!
timeout /t 3 > nul
