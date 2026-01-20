// Script pour créer un utilisateur de test manuellement
// Usage: node scripts/create-test-user.js

const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  const email = process.argv[2] || 'test@example.com'
  const name = process.argv[3] || 'Test User'

  const user = await prisma.user.upsert({
    where: { email },
    update: {
      emailVerified: new Date(),
    },
    create: {
      email,
      name,
      emailVerified: new Date(),
    },
  })

  console.log('✅ Utilisateur créé/vérifié:')
  console.log(`   Email: ${user.email}`)
  console.log(`   ID: ${user.id}`)
  console.log(`   Vérifié: ${user.emailVerified ? 'Oui' : 'Non'}`)
  console.log('\n⚠️  Note: Vous devez toujours utiliser le magic link ou OAuth pour créer une session.')
  console.log('   Ce script crée juste l\'utilisateur en base.')
}

main()
  .catch((e) => {
    console.error('❌ Erreur:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
