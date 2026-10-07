$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$envFile = Join-Path $projectRoot ".env.local"
if (Test-Path $envFile) {
  Get-Content $envFile | ForEach-Object {
    if ($_ -match '^\s*([A-Z][A-Z0-9_]*)=(.*)$') {
      $name = $Matches[1]
      if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
        [Environment]::SetEnvironmentVariable($name, $Matches[2].Trim(), "Process")
      }
    }
  }
}

foreach ($name in @("DB_HOST", "DB_PORT", "DB_NAME", "DB_USER", "DB_PASSWORD")) {
  if (-not [Environment]::GetEnvironmentVariable($name, "Process")) {
    throw "Falta $name. Configúralo en .env.local antes de ejecutar esta migración."
  }
}

$psqlCommand = Get-Command psql.exe -ErrorAction SilentlyContinue
if ($psqlCommand) {
  $psql = $psqlCommand.Source
} else {
  $postgresRoot = Join-Path $env:ProgramFiles "PostgreSQL"
  $psql = Get-ChildItem $postgresRoot -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object {
      $candidate = Join-Path $_.FullName "bin\psql.exe"
      if (Test-Path $candidate) { $candidate }
    } |
    Select-Object -First 1
}
if (-not $psql) {
  throw "No se encontró psql.exe. Instala PostgreSQL o añade su carpeta bin al PATH."
}

$connectionArgs = @(
  "--no-psqlrc",
  "-h", $env:DB_HOST,
  "-p", $env:DB_PORT,
  "-U", $env:DB_USER,
  "-d", $env:DB_NAME,
  "-v", "ON_ERROR_STOP=1"
)
$previousPassword = [Environment]::GetEnvironmentVariable("PGPASSWORD", "Process")
$env:PGPASSWORD = $env:DB_PASSWORD

try {
  $trackingTableExists = & $psql @connectionArgs -Atc "SELECT to_regclass('public.viveplus_schema_migrations') IS NOT NULL"
  if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar la base de datos $($env:DB_NAME)." }

  if ($trackingTableExists.Trim() -ne "t") {
    $baseTableExists = & $psql @connectionArgs -Atc "SELECT to_regclass('public.usuarios') IS NOT NULL"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo comprobar el esquema de $($env:DB_NAME)." }
    if ($baseTableExists.Trim() -eq "t") {
      throw "La base ya contiene la tabla usuarios pero no tiene historial de migraciones. No se aplicó ningún cambio."
    }
    & $psql @connectionArgs -c "CREATE TABLE public.viveplus_schema_migrations (filename TEXT PRIMARY KEY, applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW())"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo crear el registro de migraciones." }
  }

  $migrationsPath = Join-Path $projectRoot "backend\migrations"
  $migrations = Get-ChildItem $migrationsPath -File -Filter "*.sql" | Sort-Object Name
  foreach ($migration in $migrations) {
    $filename = $migration.Name.Replace("'", "''")
    $alreadyApplied = & $psql @connectionArgs -Atc "SELECT EXISTS (SELECT 1 FROM public.viveplus_schema_migrations WHERE filename = '$filename')"
    if ($LASTEXITCODE -ne 0) { throw "No se pudo consultar el historial antes de $($migration.Name)." }
    if ($alreadyApplied.Trim() -eq "t") {
      Write-Output "Omitida: $($migration.Name)"
      continue
    }

    Write-Output "Aplicando: $($migration.Name)"
    $recordApplied = "INSERT INTO public.viveplus_schema_migrations (filename) VALUES ('$filename')"
    & $psql @connectionArgs --single-transaction --file $migration.FullName --command $recordApplied
    if ($LASTEXITCODE -ne 0) { throw "Falló $($migration.Name); se revirtió esa migración." }
  }

  Write-Output "Migraciones completadas."
} finally {
  if ($null -eq $previousPassword) {
    Remove-Item Env:PGPASSWORD -ErrorAction SilentlyContinue
  } else {
    $env:PGPASSWORD = $previousPassword
  }
}
