import 'dotenv/config';
import mongoose from 'mongoose';
import Recipe from '../models/Recipe';
import https from 'https';

function fetchWikiImage(query: string): Promise<string | null> {
  return new Promise((resolve) => {
    // 1. Search for exact title
    const searchUrl = `https://en.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(query)}&limit=1&format=json`;
    https.get(searchUrl, { headers: { 'User-Agent': 'RecipeHubBot/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          const title = parsed[1] && parsed[1][0];
          if (!title) return resolve(null);

          // 2. Fetch image for title
          const imgUrl = `https://en.wikipedia.org/w/api.php?action=query&prop=pageimages&format=json&piprop=original&titles=${encodeURIComponent(title)}`;
          https.get(imgUrl, { headers: { 'User-Agent': 'RecipeHubBot/1.0' } }, (imgRes) => {
            let imgData = '';
            imgRes.on('data', chunk => imgData += chunk);
            imgRes.on('end', () => {
              try {
                const imgParsed = JSON.parse(imgData);
                const pages = imgParsed.query.pages;
                const firstPage = Object.values(pages)[0] as any;
                if (firstPage && firstPage.original && firstPage.original.source) {
                  resolve(firstPage.original.source);
                } else {
                  resolve(null);
                }
              } catch (e) {
                resolve(null);
              }
            });
          }).on('error', () => resolve(null));

        } catch (e) {
          resolve(null);
        }
      });
    }).on('error', () => resolve(null));
  });
}

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800';

async function main() {
  await mongoose.connect(process.env.MONGODB_URI!);
  console.log('✅ Connected to MongoDB');

  const recipes = await Recipe.find({ cuisine: 'Indian' });
  console.log(`Found ${recipes.length} Indian recipes to update.`);

  let successCount = 0;
  for (let i = 0; i < recipes.length; i++) {
    const recipe = recipes[i];
    let dishName = recipe.title;
    
    // Custom replacements for better Wiki search
    if (dishName.includes('Biryani')) dishName = 'Biryani';
    if (dishName === 'Fish Curry (Goan)') dishName = 'Fish curry';
    if (dishName === 'Paratha with Aloo Stuffing') dishName = 'Aloo paratha';
    if (dishName === 'Dosa with Coconut Chutney') dishName = 'Dosa';

    try {
      let imgUrl = await fetchWikiImage(dishName);
      if (!imgUrl && dishName.includes(' ')) {
        // try first word
        imgUrl = await fetchWikiImage(dishName.split(' ')[0]);
      }
      
      if (imgUrl) {
        recipe.images = [imgUrl];
        await recipe.save();
        successCount++;
        console.log(`✅ [${i+1}/${recipes.length}] Fixed image for: ${recipe.title} -> ${imgUrl}`);
      } else {
        console.log(`⚠️ [${i+1}/${recipes.length}] No image found for: ${recipe.title}, keeping fallback`);
      }
    } catch (err: any) {
      console.error(`❌ Error fetching image for ${recipe.title}: ${err.message}`);
    }
    
    await new Promise(r => setTimeout(r, 100)); // Be nice to Wikipedia
  }

  console.log(`\n🎉 Done! Updated images for ${successCount} dishes.`);
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
