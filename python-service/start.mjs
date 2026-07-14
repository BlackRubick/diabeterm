import { spawn, spawnSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWindows = process.platform === 'win32'

const VENV_DIR   = join(__dirname, 'venv')
const PYTHON_BIN = join(VENV_DIR, isWindows ? 'Scripts/python.exe' : 'bin/python')
const PIP_BIN    = join(VENV_DIR, isWindows ? 'Scripts/pip.exe'    : 'bin/pip')

function findSystemPython() {
  for (const cmd of ['python', 'python3']) {
    try {
      const r = spawnSync(cmd, ['--version'], { stdio: 'ignore' })
      if (r.status === 0) return cmd
    } catch {}
  }
  throw new Error(
    'Python no encontrado.\n' +
    'Instala Python 3.8+ desde https://www.python.org/downloads/'
  )
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    // shell: false — Node pasa la ruta directamente al SO, sin pasar por cmd.exe
    // Esto evita el problema de espacios en rutas de Windows
    const proc = spawn(cmd, args, { stdio: 'inherit', shell: false })
    proc.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Proceso terminó con código ${code}`))
    )
    proc.on('error', reject)
  })
}

async function main() {
  // 1. Crear entorno virtual si no existe
  if (!existsSync(VENV_DIR)) {
    console.log('[Python] Creando entorno virtual...')
    const python = findSystemPython()
    await run(python, ['-m', 'venv', VENV_DIR])
  }

  // 2. Instalar dependencias si falta alguna
  const check = spawnSync(PYTHON_BIN, ['-c', 'import fastapi, cv2, easyocr'], { stdio: 'ignore' })
  if (check.status !== 0) {
    console.log('[Python] Instalando dependencias...')
    await run(PIP_BIN, ['install', '-q', '-r', join(__dirname, 'requirements.txt')])
  }

  // 3. Iniciar el servicio FastAPI
  console.log('[Python] Servicio de análisis térmico en http://localhost:8000')
  await run(PYTHON_BIN, [join(__dirname, 'main.py')])
}

main().catch(err => {
  console.error('[Python] Error fatal:', err.message)
  process.exit(1)
})
