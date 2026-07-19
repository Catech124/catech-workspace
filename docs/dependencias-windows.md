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

## 7. Dependencias — Completas ✅

Todas las dependencias están instaladas y verificadas en el virtualenv `odysseus`. No hay pasos pendientes.
