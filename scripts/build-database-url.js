/**
 * Script pour construire DATABASE_URL à partir des variables PG* pour Amazon Aurora PostgreSQL
 * Usage: node scripts/build-database-url.js
 * Usage avec sauvegarde: node scripts/build-database-url.js --save
 */

// Charger les variables d'environnement depuis .env.local
try {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env.local')
  
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8')
    envContent.split('\n').forEach(line => {
      const match = line.match(/^([^=:#]+)=(.*)$/)
      if (match) {
        const key = match[1].trim()
        let value = match[2].trim()
        // Enlever les guillemets si présents
        if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
          value = value.slice(1, -1)
        }
        if (!process.env[key]) {
          process.env[key] = value
        }
      }
    })
  }
} catch (e) {
  console.error('Erreur lors du chargement de .env.local:', e.message)
}

const host = process.env.PGHOST
const port = process.env.PGPORT || '5432'
const database = process.env.PGDATABASE
const user = process.env.PGUSER
const password = process.env.PGPASSWORD || process.env.PGPASSWORD // Utiliser PGPASSWORD si disponible
const sslMode = process.env.PGSSLMODE || 'require'

if (!host || !database || !user) {
  console.error('❌ Erreur: PGHOST, PGDATABASE et PGUSER sont requis')
  console.error('Variables disponibles:', {
    PGHOST: process.env.PGHOST ? '✓' : '✗',
    PGPORT: process.env.PGPORT || '5432 (défaut)',
    PGDATABASE: process.env.PGDATABASE ? '✓' : '✗',
    PGUSER: process.env.PGUSER ? '✓' : '✗',
    PGPASSWORD: process.env.PGPASSWORD ? '✓' : '✗',
    PGSSLMODE: process.env.PGSSLMODE || 'require (défaut)',
  })
  process.exit(1)
}

// Construire l'URL de connexion PostgreSQL
const databaseUrl = `postgresql://${encodeURIComponent(user)}${password ? ':' + encodeURIComponent(password) : ''}@${host}:${port}/${database}?sslmode=${sslMode}&schema=public`

console.log('✅ DATABASE_URL construite:')
console.log(databaseUrl.replace(/:[^:@]+@/, ':****@')) // Masquer le mot de passe dans la console

// Écrire dans .env.local si demandé
if (process.argv.includes('--save')) {
  const fs = require('fs')
  const path = require('path')
  const envPath = path.join(process.cwd(), '.env.local')
  
  let envContent = ''
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8')
  }
  
  // Remplacer ou ajouter DATABASE_URL
  if (envContent.includes('DATABASE_URL=')) {
    envContent = envContent.replace(/DATABASE_URL=.*/g, `DATABASE_URL="${databaseUrl}"`)
  } else {
    envContent += `\nDATABASE_URL="${databaseUrl}"\n`
  }
  
  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('\n✅ DATABASE_URL ajoutée/mise à jour dans .env.local')
} else {
  console.log('\n💡 Pour sauvegarder dans .env.local, utilisez: node scripts/build-database-url.js --save')
  console.log('\nOu ajoutez manuellement dans .env.local:')
  console.log(`DATABASE_URL="${databaseUrl}"`)
}