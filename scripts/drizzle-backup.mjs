#!/usr/bin/env node

/**
 * Drizzle Backup Script
 * 
 * Cria backup completo dos schemas Drizzle antes de mudanças.
 * Preserva versões para rollback se necessário.
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

/**
 * Cria backup dos schemas Drizzle
 */
function createBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0]
  const timeOnly = new Date().toISOString().split('T')[1].replace(/[:.]/g, '-').split('.')[0]
  const backupDir = path.join(__dirname, '..', 'docs', 'backup-drizzle-schemas', `${timestamp}_${timeOnly}`)
  
  // Criar diretório de backup
  fs.mkdirSync(backupDir, { recursive: true })
  
  const schemaPath = path.join(__dirname, '..', 'packages', 'database', 'src', 'schema')
  const typesPath = path.join(__dirname, '..', 'packages', 'database', 'src', 'types.ts')
  const indexPath = path.join(__dirname, '..', 'packages', 'database', 'src', 'index.ts')
  
  const filesToBackup = [
    { src: typesPath, name: 'types.ts' },
    { src: indexPath, name: 'index.ts' }
  ]
  
  // Adicionar arquivos de schema
  const schemaFiles = ['core.ts', 'etl.ts', 'staging.ts', 'facts.ts']
  for (const file of schemaFiles) {
    const filePath = path.join(schemaPath, file)
    if (fs.existsSync(filePath)) {
      filesToBackup.push({ 
        src: filePath, 
        name: `schema/${file}` 
      })
    }
  }
  
  // Copiar arquivos
  let backedUpFiles = 0
  for (const file of filesToBackup) {
    if (fs.existsSync(file.src)) {
      const destPath = path.join(backupDir, file.name)
      const destDir = path.dirname(destPath)
      
      // Criar diretório se necessário
      fs.mkdirSync(destDir, { recursive: true })
      
      // Copiar arquivo
      fs.copyFileSync(file.src, destPath)
      backedUpFiles++
    }
  }
  
  // Criar arquivo de informações do backup
  const backupInfo = {
    timestamp: new Date().toISOString(),
    files: backedUpFiles,
    purpose: 'Backup automático antes de sincronização',
    command: 'npm run drizzle:backup'
  }
  
  fs.writeFileSync(
    path.join(backupDir, 'backup-info.json'), 
    JSON.stringify(backupInfo, null, 2)
  )
  
  console.log('💾 Backup criado com sucesso!')
  console.log(`📁 Localização: ${backupDir}`)
  console.log(`📄 Arquivos salvos: ${backedUpFiles}`)
  
  return backupDir
}

/**
 * Lista backups existentes
 */
function listBackups() {
  const backupBaseDir = path.join(__dirname, '..', 'docs', 'backup-drizzle-schemas')
  
  if (!fs.existsSync(backupBaseDir)) {
    console.log('📂 Nenhum backup encontrado.')
    return []
  }
  
  const backups = fs.readdirSync(backupBaseDir)
    .filter(name => fs.statSync(path.join(backupBaseDir, name)).isDirectory())
    .sort()
    .reverse() // Mais recentes primeiro
  
  if (backups.length === 0) {
    console.log('📂 Nenhum backup encontrado.')
    return []
  }
  
  console.log('📂 Backups disponíveis:')
  backups.forEach((backup, index) => {
    const backupPath = path.join(backupBaseDir, backup)
    const infoPath = path.join(backupPath, 'backup-info.json')
    
    let info = { files: '?', timestamp: backup }
    if (fs.existsSync(infoPath)) {
      try {
        info = JSON.parse(fs.readFileSync(infoPath, 'utf8'))
      } catch (e) {
        // Ignore parse errors
      }
    }
    
    const date = new Date(info.timestamp).toLocaleString('pt-BR')
    console.log(`   ${index + 1}. ${backup} (${info.files} arquivos, ${date})`)
  })
  
  return backups
}

/**
 * Função principal
 */
function main() {
  const command = process.argv[2] || 'create'
  
  switch (command) {
    case 'create':
    case 'backup':
      createBackup()
      break
      
    case 'list':
      listBackups()
      break
      
    case 'help':
      console.log('💾 Drizzle Backup Script')
      console.log('')
      console.log('Comandos disponíveis:')
      console.log('  npm run drizzle:backup         - Criar novo backup')
      console.log('  npm run drizzle:backup create  - Criar novo backup')
      console.log('  npm run drizzle:backup list    - Listar backups existentes')
      console.log('  npm run drizzle:backup help    - Mostrar esta ajuda')
      break
      
    default:
      console.error(`❌ Comando desconhecido: ${command}`)
      console.log('💡 Use: npm run drizzle:backup help')
      process.exit(1)
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  main()
}