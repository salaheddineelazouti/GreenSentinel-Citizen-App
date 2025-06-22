/**
 * Script pour générer automatiquement les icônes PWA manquantes
 * à partir des icônes existantes
 */
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

// Chemin vers le répertoire des icônes
const iconsDir = path.join(__dirname, 'public', 'icons');

// Création du répertoire s'il n'existe pas
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
  console.log(`Répertoire créé: ${iconsDir}`);
}

// Fonction pour générer une icône à partir d'une source
async function generateIcon(sourcePath, targetPath, size) {
  try {
    await sharp(sourcePath)
      .resize(size, size)
      .toFile(targetPath);
    console.log(`✓ Icône générée: ${path.basename(targetPath)}`);
  } catch (err) {
    console.error(`⚠️ Erreur lors de la génération de ${path.basename(targetPath)}:`, err);
  }
}

// Fonction principale
async function generateIcons() {
  console.log('🖼️ Génération des icônes PWA...');
  
  // Vérifier si l'icône source existe
  const sourceIcon = path.join(iconsDir, 'icon-512x512.png');
  if (!fs.existsSync(sourceIcon)) {
    console.error(`⚠️ Icône source non trouvée: ${sourceIcon}`);
    return;
  }

  // Tailles d'icônes à générer
  const sizes = [72, 96, 128, 144, 192, 384, 512];
  
  // Générer les icônes standard
  for (const size of sizes) {
    const targetPath = path.join(iconsDir, `icon-${size}x${size}.png`);
    if (!fs.existsSync(targetPath)) {
      await generateIcon(sourceIcon, targetPath, size);
    } else {
      console.log(`✓ L'icône ${path.basename(targetPath)} existe déjà`);
    }
  }
  
  // Générer les icônes maskable (pour les interfaces adaptatives)
  await generateIcon(sourceIcon, path.join(iconsDir, 'icon-maskable-192x192.png'), 192);
  await generateIcon(sourceIcon, path.join(iconsDir, 'icon-maskable-512x512.png'), 512);
  
  console.log('✅ Génération des icônes terminée!');
}

// Exécuter la fonction principale
generateIcons().catch(console.error);
