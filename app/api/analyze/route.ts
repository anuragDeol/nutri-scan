import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Enhanced search function with multiple attempts
async function searchOpenFoodFacts(searchQuery: string, attempts = 3) {
  const searchAttempts = [
    searchQuery,                                    // Full search
    searchQuery.split(' ').slice(0, 2).join(' '),  // First two words
    searchQuery.split(' ')[0]                       // First word only
  ];

  for (let i = 0; i < Math.min(attempts, searchAttempts.length); i++) {
    try {
      const response = await fetch(
        `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(searchAttempts[i])}&json=1&page_size=5`
      );
      const data = await response.json();
      if (data.products?.length > 0) {
        return data.products;
      }
    } catch (error) {
      console.error(`Error in attempt ${i + 1}:`, error);
    }
  }
  return [];
}

// Enhanced AI product analysis
async function analyzeProductWithAI(base64Image: string, imageType: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: `Analyze the product image and provide information in JSON format with the following structure:
        {
          "product": {
            "name": string,
            "brand": string,
            "category": string,
            "description": string
          },
          "ui_content": {
            "status": {
              "message": string,
              "type": "success" | "info" | "warning"
            },
            "details_title": string,
            "nutrition_title": string,
            "disclaimer": {
              "message": string,
              "source": "OpenFoodFacts" | "AI",
              "action_steps": {
                "brand_url": string | null,
                "shopping_links": string[] | null,
                "additional_info": string | null
              }
            }
          }
        }

        CRITICAL REQUIREMENTS:
        1. The disclaimer message MUST always include a clear warning about:
           - AI-generated content may contain errors or inaccuracies
           - Users should verify information with product packaging
           - This is an experimental tool and should not be the sole source of information
           - Importance of consulting official sources for critical information

        2. Status messages should be:
           - "success" when nutritional info is available
           - "info" when product is found but no nutritional info
           - "warning" when product is not found in database

        3. For action_steps, provide:
           - Official brand website (prefer .in domain for Indian brands)
           - Major Indian e-commerce sites that likely sell this product
           - Additional verification steps users can take

        Be concise but clear in all messages, prioritizing user safety and awareness of AI limitations.`
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: "Analyze this product and provide detailed information."
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageType};base64,${base64Image}`
            }
          },
        ],
      },
    ],
    max_tokens: 800,
    response_format: { type: "json_object" }
  });

  return JSON.parse(response.choices[0].message.content);
}

async function findBestMatchByImage(uploadedImageBase64: string, imageType: string, products: any[]) {
  const productsWithImages = products.filter(p => p.image_url);
  if (productsWithImages.length === 0) return products[0];

  const response = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content: "Compare the uploaded product image with the database product images. Return the index (0-based) of the most visually similar product. Consider packaging design, colors, and overall appearance. It might be possible that products seem similar but they may vary in the type of product. So carefully compare and analyze. Return only the number."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Which of these database product images (numbered 0 to ${productsWithImages.length - 1}) most closely matches the uploaded product image?`
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${imageType};base64,${uploadedImageBase64}`
            }
          },
          ...productsWithImages.map(product => ({
            type: "image_url",
            image_url: {
              url: product.image_url
            }
          }))
        ],
      },
    ],
    max_tokens: 10,
  });

  const bestMatchIndex = parseInt(response.choices[0].message.content || '0');
  return isNaN(bestMatchIndex) ? products[0] : productsWithImages[bestMatchIndex];
}

// Add type definitions for better type safety
interface AIAnalysisResponse {
  product?: {
    name?: string;
    brand?: string;
    category?: string;
    description?: string;
  };
  ui_content?: {
    status?: {
      message?: string;
      type?: 'success' | 'info' | 'warning';
    };
    disclaimer?: {
      message?: string;
      source?: 'OpenFoodFacts' | 'AI';
      action_steps?: {
        brand_url?: string | null;
        shopping_links?: string[] | null;
        additional_info?: string | null;
      };
    };
  };
}

function mergeProductData(offProduct: any, aiData: AIAnalysisResponse) {
  // Defensive check for both inputs
  if (!offProduct && !aiData?.product) {
    return {
      name: 'Unknown Product',
      brand: 'Unknown Brand',
      description: 'No description available',
      source: 'AI',
      nutrients: null
    };
  }

  // Safe access to AI data
  const aiProduct = aiData?.product || {};
  const aiName = aiProduct.name || 'Unknown Product';
  const aiBrand = aiProduct.brand || 'Unknown Brand';
  const aiCategory = aiProduct.category || '';
  const aiDescription = aiProduct.description || 'No description available';

  // Safe access to OFF data
  const nutrients = offProduct?.nutriments ? {
    calories: offProduct.nutriments?.['energy-kcal_100g'] ?? null,
    proteins: offProduct.nutriments?.proteins_100g ?? null,
    carbohydrates: offProduct.nutriments?.carbohydrates_100g ?? null,
    fat: offProduct.nutriments?.fat_100g ?? null,
    fiber: offProduct.nutriments?.fiber_100g ?? null,
    sugars: offProduct.nutriments?.sugars_100g ?? null,
    saturatedFat: offProduct.nutriments?.['saturated-fat_100g'] ?? null,
    caloriesPerServing: offProduct.nutriments?.['energy-kcal_serving'] ?? null,
    proteinsPerServing: offProduct.nutriments?.proteins_serving ?? null,
    carbohydratesPerServing: offProduct.nutriments?.carbohydrates_serving ?? null,
    fatPerServing: offProduct.nutriments?.fat_serving ?? null,
  } : null;

  return {
    name: offProduct?.product_name || aiName,
    brand: offProduct?.brands || aiBrand,
    quantity: offProduct?.quantity ?? null,
    categories: offProduct?.categories || aiCategory,
    nutritionGrade: offProduct?.nutrition_grade_fr ?? null,
    ingredients: offProduct?.ingredients_text ?? null,
    nutrients,
    imageUrl: offProduct?.image_url ?? null,
    stores: offProduct?.stores ?? null,
    packaging: offProduct?.packaging ?? null,
    description: offProduct?.description || aiDescription,
    source: offProduct ? 'OpenFoodFacts' : 'AI',
  };
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const image = formData.get('image') as File;

    if (!image) {
      return NextResponse.json(
        { error: 'No image provided' },
        { status: 400 }
      );
    }

    // Convert image to base64
    const bytes = await image.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString('base64');

    // Get AI analysis with error handling
    let aiAnalysis: AIAnalysisResponse;
    try {
      aiAnalysis = await analyzeProductWithAI(base64Image, image.type);
      if (!aiAnalysis?.product) {
        throw new Error('AI analysis returned incomplete data');
      }
    } catch (error) {
      console.error('AI analysis failed:', error);
      return NextResponse.json(
        { 
          error: 'AI analysis failed',
          details: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }

    // Ensure UI content exists
    aiAnalysis.ui_content = aiAnalysis.ui_content || {};
    aiAnalysis.ui_content.status = aiAnalysis.ui_content.status || {};
    aiAnalysis.ui_content.disclaimer = aiAnalysis.ui_content.disclaimer || {};

    // Try OpenFoodFacts with safe string concatenation
    const searchQuery = [
      aiAnalysis.product.brand || '',
      aiAnalysis.product.name || ''
    ].filter(Boolean).join(' ').trim();

    const products = await searchOpenFoodFacts(searchQuery || 'unknown');

    if (products.length > 0) {
      // Found in OpenFoodFacts
      const bestMatch = await findBestMatchByImage(base64Image, image.type, products);
      const productData = mergeProductData(bestMatch, aiAnalysis);
      
      // Safe check for nutrition data
      const hasNutrition = productData.nutrients && 
        Object.values(productData.nutrients).some(value => value != null);

      // Safe updates to UI content
      aiAnalysis.ui_content.status.type = hasNutrition ? "success" : "info";
      aiAnalysis.ui_content.status.message = hasNutrition 
        ? "Nutritional information is available from OpenFoodFacts database."
        : "Product found in database but nutritional information is not available.";
      
      return NextResponse.json({ 
        productData,
        ui_content: aiAnalysis.ui_content 
      });
    } else {
      // Not found in OpenFoodFacts - use AI analysis only
      const productData = mergeProductData(null, aiAnalysis);
      
      // Safe updates to UI content
      aiAnalysis.ui_content.status.type = "warning";
      aiAnalysis.ui_content.disclaimer.source = "AI";
      
      return NextResponse.json({ 
        productData,
        ui_content: aiAnalysis.ui_content 
      });
    }
  } catch (error) {
    console.error('Error processing image:', error);
    return NextResponse.json(
      {
        error: 'Failed to process image',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}