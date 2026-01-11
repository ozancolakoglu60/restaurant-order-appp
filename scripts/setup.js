#!/usr/bin/env node

/**
 * Restoran Sipariş Uygulaması - Otomatik Kurulum Script'i
 * 
 * Bu script, uygulamanın temel kurulumunu otomatikleştirir.
 * 
 * Kullanım:
 *   node scripts/setup.js
 */

const fs = require('fs')
const path = require('path')
const readline = require('readline')

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function setup() {
  console.log('🚀 Restoran Sipariş Uygulaması - Kurulum Başlatılıyor...\n')

  // 1. .env.local dosyasını kontrol et
  const envPath = path.join(process.cwd(), '.env.local')
  const envExamplePath = path.join(process.cwd(), '.env.example')

  if (fs.existsSync(envPath)) {
    console.log('⚠️  .env.local dosyası zaten mevcut.')
    const overwrite = await question('Üzerine yazmak istiyor musunuz? (e/h): ')
    if (overwrite.toLowerCase() !== 'e' && overwrite.toLowerCase() !== 'evet') {
      console.log('✅ Mevcut .env.local dosyası korunuyor.')
    } else {
      await createEnvFile(envPath)
    }
  } else {
    await createEnvFile(envPath)
  }

  // 2. Node modules kontrolü
  const nodeModulesPath = path.join(process.cwd(), 'node_modules')
  if (!fs.existsSync(nodeModulesPath)) {
    console.log('\n📦 Bağımlılıklar yükleniyor...')
    const { execSync } = require('child_process')
    try {
      execSync('npm install', { stdio: 'inherit' })
      console.log('✅ Bağımlılıklar başarıyla yüklendi!')
    } catch (error) {
      console.error('❌ Bağımlılık yükleme hatası:', error.message)
      process.exit(1)
    }
  } else {
    console.log('✅ Bağımlılıklar zaten yüklü.')
  }

  // 3. Özet
  console.log('\n' + '='.repeat(50))
  console.log('✅ Kurulum Tamamlandı!')
  console.log('='.repeat(50))
  console.log('\n📋 Sonraki Adımlar:')
  console.log('1. .env.local dosyasını düzenleyin ve Supabase bilgilerinizi ekleyin')
  console.log('2. Supabase veritabanı şemasını oluşturun: supabase/schema.sql')
  console.log('3. Geliştirme sunucusunu başlatın: npm run dev')
  console.log('\n📖 Detaylı bilgi için: SETUP.md dosyasına bakın\n')

  rl.close()
}

async function createEnvFile(envPath) {
  console.log('\n📝 .env.local dosyası oluşturuluyor...')
  
  const supabaseUrl = await question('Supabase Project URL: ')
  const supabaseAnonKey = await question('Supabase Anon Key: ')
  const serviceRoleKey = await question('Supabase Service Role Key (Opsiyonel, boş bırakabilirsiniz): ')

  let envContent = `# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=${supabaseUrl}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${supabaseAnonKey}
`

  if (serviceRoleKey.trim()) {
    envContent += `SUPABASE_SERVICE_ROLE_KEY=${serviceRoleKey}\n`
  }

  fs.writeFileSync(envPath, envContent, 'utf8')
  console.log('✅ .env.local dosyası oluşturuldu!')
  console.log('⚠️  Önemli: Bu dosyayı Git\'e commit etmeyin!\n')
}

// Hata yakalama
process.on('SIGINT', () => {
  console.log('\n\n⚠️  Kurulum iptal edildi.')
  rl.close()
  process.exit(0)
})

// Script'i çalıştır
setup().catch(error => {
  console.error('❌ Kurulum hatası:', error)
  rl.close()
  process.exit(1)
})
