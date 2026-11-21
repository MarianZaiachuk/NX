param(
    [string]$ServerHost = $env:DEPLOY_HOST,
    [string]$ServerUser = "root"
)

if (-not $ServerHost) {
    Write-Error "Set -ServerHost or DEPLOY_HOST environment variable (e.g. .\deploy.ps1 -ServerHost your.server.ip)"
    exit 1
}

Write-Host "=========================================="
Write-Host "Deploying NX Trading to $ServerHost..."
Write-Host "=========================================="

Write-Host "`n[1/3] Packing project..."
tar.exe -czvf nx_deploy.tar.gz `
    --exclude=node_modules `
    --exclude=.venv `
    --exclude=venv `
    --exclude=.git `
    --exclude=.gemini `
    --exclude=__pycache__ `
    --exclude=.env `
    --exclude=.env.production `
    --exclude=ngrok_bin `
    --exclude=ngrok.zip `
    --exclude=nx_deploy.tar.gz `
    .

Write-Host "`n[2/3] Uploading to server..."
scp nx_deploy.tar.gz "${ServerUser}@${ServerHost}:/root/"

Write-Host "`n[3/3] Installing Docker and running project..."
$RemoteCommand = @"
apt-get update &&
apt-get install -y docker.io docker-compose-v2 &&
systemctl enable --now docker &&
mkdir -p /root/nx &&
tar -xzvf /root/nx_deploy.tar.gz -C /root/nx &&
cd /root/nx &&
docker compose up -d --build &&
sleep 5 &&
docker compose exec -T backend python add_agent_columns.py
"@

ssh "${ServerUser}@${ServerHost}" $RemoteCommand

Write-Host "`nDONE! Your project is deployed."
Write-Host "Check http://${ServerHost}"
