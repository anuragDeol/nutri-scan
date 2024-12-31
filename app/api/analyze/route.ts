import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const dynamic = 'force-dynamic';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

async function searchOpenFoodFacts(productName: string) {
  try {
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(productName)}&json=1`
    );
    
    const data = await response.json();
    
    if (data.products && data.products.length > 0) {
      const product = data.products[0]; // Get the first (most relevant) result
      return {
        name: product.product_name,
        brand: product.brands,
        nutritionGrade: product.nutrition_grade_fr,
        ingredients: product.ingredients_text,
        nutrients: {
          calories: product.nutriments['energy-kcal_100g'],
          proteins: product.nutriments.proteins_100g,
          carbohydrates: product.nutriments.carbohydrates_100g,
          fat: product.nutriments.fat_100g,
          fiber: product.nutriments.fiber_100g,
        },
        imageUrl: product.image_url,
      };
    }
    return null;
  } catch (error) {
    console.error('Error fetching from Open Food Facts:', error);
    return null;
  }
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

    // Call OpenAI Vision API
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that identifies product names from images. Return only the product name, nothing else."
        },
        {
          role: "user",
          content: [
            { type: "text", text: "What is the name of this product?" },
            {
              type: "image_url",
              image_url: {
                url: `data:${image.type};base64,${base64Image}`
              }
            },
          ],
        },
      ],
      max_tokens: 100,
    });

    const productName = response.choices[0].message.content;

    // Search Open Food Facts database
    const productData = await searchOpenFoodFacts(productName as string);

    return NextResponse.json({ 
      productName,
      productData: productData || { message: 'No product details found in database' }
    });

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