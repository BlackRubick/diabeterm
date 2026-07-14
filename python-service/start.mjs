import { spawn, execSync } from 'child_process'
import { existsSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const isWindows = process.platform === 'win32'

const VENV_DIR   = join(__dirname, 'venv')
const PYTHON_BIN = join(VENV_DIR, isWindows ? 'Scripts/python.exe' : 'bin/python')
const PIP_BIN    = join(VENV_DIR, isWindows ? 'Scripts/pip.exe'    : 'bin/pip')

function findSystemPython() {
  for (const cmd of ['python3', 'python']) {
    try {
      execSync(`${cmd} --version`, { stdio: 'ignore' })
      return cmd
    } catch {}
  }
  throw new Error(
    'Python no encontrado.\n' +
    'Instala Python 3.8+ desde https://www.python.org/downloads/'
  )
}

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    // En Windows con shell:true el ejecutable debe ir entre comillas si la ruta tiene espacios
    const safeCmd = isWindows ? `"${cmd}"` : cmd
    const proc = spawn(safeCmd, args, { stdio: 'inherit', shell: isWindows })
    proc.on('close', code =>
      code === 0 ? resolve() : reject(new Error(`Proceso terminó con código ${code}`))
    )
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
  try {
    execSync(`"${PYTHON_BIN}" -c "import fastapi, cv2, easyocr"`, { stdio: 'ignore' })
  } catch {
    console.log('[Python] Instalando dependencias...')
    const reqPath = join(__dirname, 'requirements.txt')
    await run(PIP_BIN, ['install', '-q', '-r', isWindows ? `"${reqPath}"` : reqPath])
  }

  // 3. Iniciar el servicio FastAPI
  console.log('[Python] Servicio de análisis térmico en http://localhost:8000')
  const mainPath = join(__dirname, 'main.py')
  await run(PYTHON_BIN, [isWindows ? `"${mainPath}"` : mainPath])
}

main().catch(err => {
  console.error('[Python] Error fatal:', err.message)
  process.exit(1)
})
