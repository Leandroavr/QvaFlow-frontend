import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')

// Directorios y archivos a escanear
const targets = [
  path.join(rootDir, 'index.html'),
  path.join(rootDir, 'src'),
]

const distPath = path.join(rootDir, 'dist')
if (fs.existsSync(distPath)) {
  targets.push(distPath)
}

// Regex para detectar URLs HTTP y HTTPS
const urlRegex = /https?:\/\/[^\s"'`<>)]+/gi

// Dominios y namespaces permitidos (locales o identificadores XML/SVG/MathML requeridos por estándares)
const allowedPatterns = [
  /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?(\/.*)?$/i,
  /^https?:\/\/([a-z0-9-]+\.)?w3\.org(\/.*)?$/i, // Namespaces XML, SVG, MathML
  /^https?:\/\/schema\.org(\/.*)?$/i,
  /^https?:\/\/vuejs\.org\/error-reference/i, // Mensajes internos de error de runtime de Vue
]

function isAllowedUrl(url) {
  return allowedPatterns.some((pattern) => pattern.test(url))
}

const violations = []

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  lines.forEach((line, lineIndex) => {
    // Excluir comentarios que documentan configuraciones si son de documentación
    const matches = line.match(urlRegex)
    if (matches) {
      matches.forEach((rawUrl) => {
        // Limpiar caracteres de puntuación al final
        const cleanUrl = rawUrl.replace(/[,;.:]+$/, '')
        if (!isAllowedUrl(cleanUrl)) {
          violations.push({
            file: path.relative(rootDir, filePath),
            line: lineIndex + 1,
            url: cleanUrl,
          })
        }
      })
    }
  })
}

function scanDir(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(dirPath, entry.name)
    if (entry.isDirectory()) {
      scanDir(fullPath)
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase()
      if (['.html', '.vue', '.ts', '.js', '.css', '.json', '.svg'].includes(ext)) {
        scanFile(fullPath)
      }
    }
  }
}

console.log('🔍 Iniciando verificación offline de recursos externos...')

targets.forEach((target) => {
  if (fs.existsSync(target)) {
    if (fs.statSync(target).isDirectory()) {
      scanDir(target)
    } else {
      scanFile(target)
    }
  }
})

if (violations.length > 0) {
  console.error('\n❌ ERROR: Se encontraron URLs externas que violan la arquitectura 100% offline:\n')
  violations.forEach((v) => {
    console.error(`  - ${v.file}:${v.line} -> ${v.url}`)
  })
  console.error('\nTodo recurso (fuentes, iconos, imágenes, librerías) debe estar estrictamente autoalojado.\n')
  process.exit(1)
} else {
  console.log('\n✅ ÉXITO: 0 recursos externos encontrados en index.html, src/ y dist/.')
  console.log('   La aplicación cumple 100% con los requerimientos offline de red local (LAN).\n')
  process.exit(0)
}
