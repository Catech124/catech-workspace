# Dependencias Watch — Windows

> Archivo generado el 17 de julio de 2026
>
> 📍 **Ubicación en Linux:** `docs/dependencias-windows.md`
>
> Este archivo es un árbol de instalaciones y guía de uso de herramientas del sistema.
> Consulta este archivo cuando necesites conocer rutas de dependencias importantes en Windows.

## 1. yt-dlp ✅ (Encontrado)

| Campo | Valor |
|---|---|
| **Ruta** | `C:\\Users\\catec\\.stacher\\yt-dlp.exe` |
| **Desde WSL** | `/mnt/c/Users/catec/.stacher/yt-dlp.exe` |
| **Estado** | ✅ Instalado |

## 2. Python en Windows

### Instalaciones encontradas

| # | Ruta | Versión | Notas |
|---|---|---|---|
| 1 | `C:\\Users\\catec\\AppData\\Local\\Microsoft\\WindowsApps\\python.exe` | — | Microsoft Store |
| 2 | `C:\\Users\\catec\\AppData\\Local\\Python\\bin\\python.exe` | Python 3.14 | Standalone |
| 3 | `C:\\Users\\catec\\odysseus\\venv\\Scripts\\python.exe` | — | Virtualenv con onnxruntime |

## 3. Modelo Parakeet TDT ✅ (Encontrado)

| Campo | Valor |
|---|---|
| **Ruta** | `C:\\Users\\catec\\AppData\\Roaming\\com.pais.handy\\models\\parakeet-tdt-0.6b-v2-int8\\` |
| **Desde WSL** | `/mnt/c/Users/catec/AppData/Roaming/com.pais.handy/models/parakeet-tdt-0.6b-v2-int8/` |
| **Estado** | ✅ Modelo completo (5 archivos) |

### Archivos del modelo:
- `encoder-model.int8.onnx` (652 MB)
- `decoder_joint-model.int8.onnx` (9 MB)
- `nemo128.onnx`
- `vocab.txt`
- `config.json`

## 4. Script de transcripción ✅ (Encontrado)

| Campo | Valor |
|---|---|
| **Ruta** | `C:\\Users\\catec\\transcribe_parakeet.py` |
| **Desde WSL** | `/mnt/c/Users/catec/transcribe_parakeet.py` |
| **Estado** | ✅ Script presente |
| **Nota** | La ruta del modelo está **hardcodeada** dentro del script |

## 5. Paquetes Python en Windows

### En `C:\\Users\\catec\\odysseus\\venv\\` (virtualenv)

| Paquete | Versión | ¿Instalado? |
|---|---|---|
| `onnxruntime` | 1.26.0 | ✅ Sí |
| `numpy` | 2.4.6 | ✅ Sí |
| `scipy` | 1.18.0 | ✅ **Instalado** |

✅ **Todas las dependencias están instaladas.** No falta nada.

## 6. Resumen Visual

```
┌─────────────────────────────────────────────────┐
│               WATCH SKILL — WINDOWS             │
├─────────────────────────────────────────────────┤
│                                                 │
│  yt-dlp             C:\Users\catec\.stacher\    │
│  ✅ yt-dlp.exe                                   │
│                                                 │
│  Modelo            C:\Users\catec\AppData\       │
│  ✅ Parakeet TDT    Roaming\com.pais.handy\      │
│                     models\parakeet-tdt-...\     │
│                                                 │
│  Script            C:\Users\catec\               │
│  ✅ transcribe_parakeet.py                       │
│                                                 │
│  Python venv       C:\Users\catec\odysseus\      │
│  ✅ onnxruntime     venv\                        │
│  ✅ numpy                                        │
│  ✅ scipy (v1.18.0 via SSH)                      │
│                                                 │
│  Python standalone  C:\Users\catec\AppData\      │
│  (Python 3.14)      Local\Python\bin\            │
│  ❌ onnxruntime (falta)                          │
│  ❌ scipy (falta)                                │
│  ❌ numpy (falta)                                │
│                                                 │
└─────────────────────────────────────────────────┘
```

## 7. Freebuff Chats — Rutas y limpieza

Los chats de freebuff se almacenan como archivos JSON dentro de cada cuenta aislada. Ocupan espacio en disco que puede crecer con el uso.

### Rutas de proyectos/chats por cuenta

| Cuenta | Ruta `projects/` |
|---|---|
| **Cuenta 1** | `~/.config/manicode/projects/` |
| **Cuenta 2** | `~/.freebuff-account2/.config/manicode/projects/` |
| **Cuenta 3** | `~/.freebuff-account3/.config/manicode/projects/` |
| **Cuenta 4** | `~/.freebuff-account4/.config/manicode/projects/` |

### Ruta del historial de mensajes

| Cuenta | Ruta `message-history.json` |
|---|---|
| **Cuenta 1** | `~/.config/manicode/message-history.json` |
| **Cuenta 2** | `~/.freebuff-account2/.config/manicode/message-history.json` |
| **Cuenta 3** | `~/.freebuff-account3/.config/manicode/message-history.json` |
| **Cuenta 4** | `~/.freebuff-account4/.config/manicode/message-history.json` |

### Comandos de diagnóstico

```bash
# Ver tamaño de chats por cuenta
echo "Cuenta 1: $(du -sh ~/.config/manicode/message-history.json 2>/dev/null | cut -f1)"
echo "Cuenta 2: $(du -sh ~/.freebuff-account2/.config/manicode/message-history.json 2>/dev/null | cut -f1)"
echo "Cuenta 3: $(du -sh ~/.freebuff-account3/.config/manicode/message-history.json 2>/dev/null | cut -f1)"
echo "Cuenta 4: $(du -sh ~/.freebuff-account4/.config/manicode/message-history.json 2>/dev/null | cut -f1)"

# Ver tamaño de projects/ (chats embedidos) por cuenta
echo "Cuenta 1: $(du -sh ~/.config/manicode/projects/ 2>/dev/null | cut -f1)"
echo "Cuenta 2: $(du -sh ~/.freebuff-account2/.config/manicode/projects/ 2>/dev/null | cut -f1)"
echo "Cuenta 3: $(du -sh ~/.freebuff-account3/.config/manicode/projects/ 2>/dev/null | cut -f1)"
echo "Cuenta 4: $(du -sh ~/.freebuff-account4/.config/manicode/projects/ 2>/dev/null | cut -f1)"

# Total combinado
du -sh ~/.config/manicode/projects/ ~/.freebuff-account{2,3,4}/.config/manicode/projects/ 2>/dev/null | tail -1
```

### Limpieza

```bash
# Borrar SOLO chats project/ de una cuenta específica (ej: cuenta 1)
rm -rf ~/.config/manicode/projects/*/chats/*

# Borrar projects/ completo de una cuenta (se regenera solo)
rm -rf ~/.config/manicode/projects/

# Borrar projects/ de TODAS las cuentas a la vez
rm -rf ~/.config/manicode/projects/ ~/.freebuff-account{2,3,4}/.config/manicode/projects/
```

> ⚠️ Los chats en `message-history.json` NO se regeneran al borrarlos. Los de `projects/` sí se regeneran solos con el uso.

## 8. Dependencias — Completas ✅

Todas las dependencias están instaladas y verificadas en el virtualenv `odysseus`. No hay pasos pendientes.
