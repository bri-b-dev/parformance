#!/usr/bin/env bash
set -Eeuo pipefail

##########################################################
#   ParFormance – Android Release Build Script (test/)
#   Runs from test/; builds from project root
##########################################################

# ==== Directories relative to this script ====
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ANDROID_DIR="$PROJECT_ROOT/android"

cd "$PROJECT_ROOT"

# ====== CLI ======
usage() {
  cat <<USAGE
$0 [--env <path>] [--dest <path>] [--no-clean] [--no-sync] [--aab]

  --env <path>   Path to .env file (default: test/.env)
  --dest <path>  Output directory for artifacts (overrides DEST_DEFAULT from env)
  --no-clean     Skip gradle clean
  --no-sync      Skip 'npx cap sync android' (not recommended)
  --aab          Also build Android App Bundle (.aab)

Environment:
  DEST_DEFAULT   If set (via shell or .env), artifacts will be copied there.
                 If neither --dest nor DEST_DEFAULT is set, copying is skipped.
USAGE
}

APP_NAME="parformance"
BUILD_AAB=false
CLEAN=true
SYNC=true
ENV_FILE="$PROJECT_ROOT/test/.env"
CLI_DEST=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --env) ENV_FILE="$2"; shift 2 ;;
    --dest) CLI_DEST="$2"; shift 2 ;;
    --no-clean) CLEAN=false; shift ;;
    --no-sync) SYNC=false; shift ;;
    --aab) BUILD_AAB=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "[ERR] Unknown option: $1" >&2; usage; exit 1 ;;
  esac
done

# ====== Load .env (required values must be present there or in env) ======
if [[ -f "$ENV_FILE" ]]; then
  echo "[INFO] Loading env from $ENV_FILE"
  set -o allexport
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +o allexport
else
  echo "[WARN] No .env at $ENV_FILE; using current environment"
fi

# After env load, compute DEST precedence: CLI > DEST_DEFAULT > empty
DEST_DEFAULT="${DEST_DEFAULT:-}"
DEST="$CLI_DEST"
if [[ -z "$DEST" && -n "$DEST_DEFAULT" ]]; then
  DEST="$DEST_DEFAULT"
fi

# ====== Config (NO silent defaults; fail if missing) ======
# Required: JAVA_HOME, ANDROID_KEYSTORE_PATH, ANDROID_KEYSTORE_PASSWORD, ANDROID_KEY_ALIAS, ANDROID_KEY_PASSWORD

req() { [[ -n "${!1:-}" ]] || { echo "[ERR] Missing required env: $1" >&2; exit 2; }; }
need() { command -v "$1" >/dev/null 2>&1 || { echo "[ERR] Required tool missing: $1" >&2; exit 3; }; }
log()  { printf "\033[1;34m[INFO]\033[0m %s\n" "$*"; }
warn() { printf "\033[1;33m[WARN]\033[0m %s\n" "$*"; }

eq() {
  printf "%-28s %s\n" "$1" "$2"
}

req JAVA_HOME
req ANDROID_KEYSTORE_PATH
req ANDROID_KEYSTORE_PASSWORD
req ANDROID_KEY_ALIAS
req ANDROID_KEY_PASSWORD

# Validate paths
[[ -d "$ANDROID_DIR" ]] || { echo "[ERR] Android dir not found: $ANDROID_DIR" >&2; exit 4; }
[[ -f "$PROJECT_ROOT/package.json" ]] || { echo "[ERR] package.json missing at $PROJECT_ROOT" >&2; exit 4; }
[[ -f "$ANDROID_KEYSTORE_PATH" ]] || { echo "[ERR] Keystore not found at $ANDROID_KEYSTORE_PATH" >&2; exit 4; }

# Tools
need node; need npm; need npx
if ! command -v shasum >/dev/null 2>&1 && ! command -v sha256sum >/dev/null 2>&1; then
  warn "No shasum/sha256sum found; checksums will be skipped"
fi

# Summary
log "Environment summary"
eq "Project root" "$PROJECT_ROOT"
eq "Android dir" "$ANDROID_DIR"
eq "Env file" "$ENV_FILE"
eq "JAVA_HOME" "$JAVA_HOME"
eq "Keystore" "$ANDROID_KEYSTORE_PATH"
eq "Key alias" "$ANDROID_KEY_ALIAS"
eq "Sync native" "$SYNC"
eq "Gradle clean" "$CLEAN"
eq "Build AAB" "$BUILD_AAB"
eq "DEST_DEFAULT" "${DEST_DEFAULT:-<unset>}"
eq "Effective DEST" "${DEST:-<none>}"

# ====== Version & timestamp ======
PKG_VERSION="$(node -p "require('./package.json').version" 2>/dev/null || echo "0.0.0")"
TIMESTAMP="$(date +%Y%m%d-%H%M)"
log "Version: $PKG_VERSION"

# ====== Build web assets ======
log "npm run build"
npm run build

# ====== Capacitor sync ======
if $SYNC; then
  log "npx cap sync android"
  npx cap sync android
else
  warn "Sync skipped (you brave soul)"
fi

# ====== Gradle build ======
GRADLE="$ANDROID_DIR/gradlew"
[[ -x "$GRADLE" ]] || { echo "[ERR] Gradle wrapper missing: $GRADLE" >&2; exit 5; }

pushd "$ANDROID_DIR" >/dev/null
if $CLEAN; then
  log "Gradle clean"
  "$GRADLE" -p . clean
fi

log ":app:assembleRelease (APK)"
"$GRADLE" -p . :app:assembleRelease

APK_PATH="app/build/outputs/apk/release/app-release.apk"
[[ -f "$APK_PATH" ]] || { echo "[ERR] APK not found: $ANDROID_DIR/$APK_PATH" >&2; exit 6; }

if $BUILD_AAB; then
  log ":app:bundleRelease (AAB)"
  "$GRADLE" -p . :app:bundleRelease || { echo "[ERR] AAB build failed" >&2; exit 7; }
fi

AAB_PATH="app/build/outputs/bundle/release/app-release.aab"
popd >/dev/null

# ====== Copy artifacts (only if DEST is set) ======
if [[ -n "${DEST:-}" ]]; then
  mkdir -p "$DEST"
  APK_OUT="$DEST/${APP_NAME}-v${PKG_VERSION}-${TIMESTAMP}-release.apk"
  cp "$ANDROID_DIR/$APK_PATH" "$APK_OUT"
  log "APK -> $APK_OUT"

  if $BUILD_AAB && [[ -f "$ANDROID_DIR/$AAB_PATH" ]]; then
    AAB_OUT="$DEST/${APP_NAME}-v${PKG_VERSION}-${TIMESTAMP}-release.aab"
    cp "$ANDROID_DIR/$AAB_PATH" "$AAB_OUT"
    log "AAB -> $AAB_OUT"
  fi
else
  warn "No DEST provided and DEST_DEFAULT unset. Skipping artifact copy."
  log "APK at: $ANDROID_DIR/$APK_PATH"
  if $BUILD_AAB && [[ -f "$ANDROID_DIR/$AAB_PATH" ]]; then
    log "AAB at: $ANDROID_DIR/$AAB_PATH"
  fi
fi

# ====== Checksums ======
if command -v shasum >/dev/null 2>&1 || command -v sha256sum >/dev/null 2>&1; then
  if [[ -n "${DEST:-}" ]]; then
    # Checksums for copied files
    if command -v shasum >/dev/null 2>&1; then
      log "SHA256"
      shasum -a 256 "$APK_OUT"
      [[ -n "${AAB_OUT:-}" && -f "$AAB_OUT" ]] && shasum -a 256 "$AAB_OUT"
    else
      log "SHA256"
      sha256sum "$APK_OUT"
      [[ -n "${AAB_OUT:-}" && -f "$AAB_OUT" ]] && sha256sum "$AAB_OUT"
    fi
  else
    # Checksums for source files in android build dir
    if command -v shasum >/dev/null 2>&1; then
      log "SHA256 (source files)"
      shasum -a 256 "$ANDROID_DIR/$APK_PATH"
      [[ -f "$ANDROID_DIR/$AAB_PATH" ]] && shasum -a 256 "$ANDROID_DIR/$AAB_PATH"
    else
      log "SHA256 (source files)"
      sha256sum "$ANDROID_DIR/$APK_PATH"
      [[ -f "$ANDROID_DIR/$AAB_PATH" ]] && sha256sum "$ANDROID_DIR/$AAB_PATH"
    fi
  fi
else
  warn "No shasum/sha256sum found; checksums skipped."
fi

log "Done."
exit 0
