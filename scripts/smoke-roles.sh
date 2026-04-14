#!/usr/bin/env bash
# Smoke test: login with each role and hit all expected API endpoints.
# Prints PASS/FAIL per endpoint per role.
API=http://127.0.0.1:5101/api/v1

login() {
  curl -sS -X POST "$API/auth/login" -H "Content-Type: application/json" \
    -d "{\"email\":\"$1\",\"password\":\"Admin123!\"}"
}

get_token() {
  node -e "let s=''; process.stdin.on('data',c=>s+=c).on('end',()=>{try{console.log(JSON.parse(s).data.accessToken)}catch{console.log('')}})"
}

get_estudio() {
  node -e "let s=''; process.stdin.on('data',c=>s+=c).on('end',()=>{try{const d=JSON.parse(s).data;if(Array.isArray(d)&&d.length)console.log(d[0].id);else console.log('')}catch{console.log('')}})"
}

check() {
  local label="$1" token="$2" estudio="$3" path="$4"
  local args=(-sS -o /dev/null -w "%{http_code}" -H "Authorization: Bearer $token")
  [ -n "$estudio" ] && args+=(-H "x-estudio-id: $estudio")
  local code
  code=$(curl "${args[@]}" "$API$path")
  if [ "$code" = "200" ]; then
    printf "  ✅ %-45s %s\n" "$path" "$code"
  else
    printf "  ❌ %-45s %s\n" "$path" "$code"
  fi
}

run_role() {
  local label="$1" email="$2" shift
  shift 2
  echo ""
  echo "=== $label ($email) ==="
  local resp token estudios estudio_id
  resp=$(login "$email")
  token=$(echo "$resp" | get_token)
  if [ -z "$token" ]; then echo "  ❌ login failed: $resp"; return; fi
  echo "  ✅ login"
  estudios=$(curl -sS -H "Authorization: Bearer $token" "$API/usuarios/me/estudios")
  estudio_id=$(echo "$estudios" | get_estudio)
  [ -n "$estudio_id" ] && echo "  ✅ estudio = $estudio_id" || echo "  (sin estudio)"
  for p in "$@"; do
    check "$label" "$token" "$estudio_id" "$p"
  done
}

run_role "SUPERADMIN" "superadmin@numerito.com" \
  /usuarios/me /usuarios/me/estudios \
  /admin/dashboard/stats /admin/health \
  /admin/estudios /admin/usuarios /admin/usuarios/stats /admin/planes

run_role "SOCIO (admin@demo)" "admin@demo.com" \
  /usuarios/me /usuarios/me/estudios /usuarios/me/permisos \
  /dashboard/stats /clientes /clientes/summary \
  /obligaciones/kpis /obligaciones/vencimientos \
  /contabilidad/stats /facturacion/stats \
  /tareas /estudios/me /estudios/equipo /estudios/plan

run_role "RESPONSABLE" "responsable@demo.com" \
  /usuarios/me /usuarios/me/estudios /usuarios/me/permisos \
  /dashboard/stats /clientes /obligaciones/kpis /contabilidad/stats /tareas

run_role "EMPLEADO" "empleado@demo.com" \
  /usuarios/me /usuarios/me/estudios /usuarios/me/permisos \
  /dashboard/stats /clientes /obligaciones/kpis /tareas

run_role "CLIENTE" "cliente@demo.com" \
  /usuarios/me /portal/dashboard/stats
