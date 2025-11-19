import fetch from 'node-fetch';
import cheerio from 'cheerio';
import { createClient } from '@supabase/supabase-js';

// Supabase credentials
const supabaseUrl = 'https://zyvilaqlbsmbwxtdulvt.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp5dmlsYXFsYnNtYnd4dGR1bHZ0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwNzg0NzcsImV4cCI6MjA3NjY1NDQ3N30.yWKACrRr_7mTLK5IDx-Ty0P00vF9ZkAea3FIWFPb7dM';
const supabase = createClient(supabaseUrl, supabaseKey);

// Use the website's existing categories
const SECTIONS = [
  { selector: "#tab-content-Grains", category: "grains" },
  { selector: "#tab-content-Fruits", category: "fruits" },
  { selector: "#tab-content-Vegetables", category: "vegetables" }
];

const fetchAMTData = async () => {
  const response = await fetch('https://amtrends.co.za/market-pricesv2/');
  const html = await response.text();
  const $ = cheerio.load(html);

  const crops = [];

  // Process each category section
  SECTIONS.forEach(({ selector, category }) => {
    const $section = $(selector);
    
    if ($section.length) {
      console.log(`Processing ${category} section...`);
      
      // Find tables in this section
      $section.find('table').each((tableIndex, table) => {
        $(table).find('tbody tr').each((rowIndex, row) => {
          const cells = $(row).find('td');
          
          if (cells.length >= 6) { // Ensure we have all required columns
            const crop = {
              crop_name: $(cells[0]).text().trim(),
              current_price: parseFloat($(cells[1]).text().replace('R', '').replace(',', '').trim()) || 0,
              unit: $(cells[2]).text().trim(),
              last_updated: new Date($(cells[3]).text().trim()).toISOString(),
              price_change: parseFloat($(cells[4]).text().replace('%', '').trim()) || 0,
              previous_price: parseFloat($(cells[5]).text().replace('R', '').replace(',', '').trim()) || 0,
              market: 'AMT Markets',
              region: 'South Africa',
              volume: 'per Ton',
              trend: parseFloat($(cells[4]).text().replace('%', '').trim()) > 0 ? 'up' : 
                     parseFloat($(cells[4]).text().replace('%', '').trim()) < 0 ? 'down' : 'stable',
              category: category // Use the section's category
            };
            
            // Only add if we have valid data
            if (crop.crop_name && crop.crop_name !== '') {
              crops.push(crop);
            }
          }
        });
      });
    }
  });

  return crops;
};

const insertDataToSupabase = async (crops) => {
  const { data, error } = await supabase
    .from('market_prices')
    .upsert(crops, { onConflict: 'crop_name, market, last_updated' });

  if (error) {
    console.error('Error inserting data:', error);
  } else {
    console.log(`Data inserted successfully: ${crops.length} records`);
    
    // Log category breakdown
    const categoryCount = {};
    crops.forEach(crop => {
      categoryCount[crop.category] = (categoryCount[crop.category] || 0) + 1;
    });
    
    console.log('Category breakdown:');
    Object.entries(categoryCount).forEach(([category, count]) => {
      console.log(`- ${category}: ${count} items`);
    });
  }
};

(async () => {
  try {
    const crops = await fetchAMTData();
    await insertDataToSupabase(crops);
  } catch (error) {
    console.error('Scraper failed:', error);
  }
})();