"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from "@/hooks/use-toast"
import { ImagePlusIcon, Upload, Camera } from 'lucide-react';
import Link from 'next/link';
import { getRandomLoadingMessage, resetLoadingMessageCounter } from '@/utils/loading-messages';

interface ProductData {
  name?: string;
  brand?: string;
  quantity?: string;
  categories?: string;
  nutritionGrade?: string;
  ingredients?: string;
  nutrients?: {
    calories?: number;
    proteins?: number;
    carbohydrates?: number;
    fat?: number;
    fiber?: number;
    sugars?: number;
    saturatedFat?: number;
    caloriesPerServing?: number;
    proteinsPerServing?: number;
    carbohydratesPerServing?: number;
    fatPerServing?: number;
  };
  imageUrl?: string;
  stores?: string;
  packaging?: string;
  description?: string;
  source?: 'OpenFoodFacts' | 'AI';
}

interface UIContent {
  status: {
    message: string;
    type: 'success' | 'info' | 'warning';
    title: string;
  };
  sections: {
    details: {
      title: string;
      message?: string;
    };
    nutrition: {
      title: string;
      message?: string;
    };
  };
  disclaimer: {
    title: string;
    message: string;
    source: 'OpenFoodFacts' | 'AI';
    action_steps?: {
      brand_url: string | null;
      shopping_links: string[] | null;
      additional_info: string | null;
    };
  };
}

const NutrientInfo = ({ label, value, unit }: { label: string; value?: number; unit: string }) => {
  if (typeof value === 'undefined') return null;
  return (
    <div className="flex justify-between border-b border-gray-100 py-2">
      <span className="text-gray-600">{label}</span>
      <span className="font-medium">{value} {unit}</span>
    </div>
  );
};

const DetailsBadge = () => (
  <div className="absolute -top-3 left-4 bg-[#475569] text-white px-3 py-1 text-sm rounded-full">
    DETAILS
  </div>
);

const NutritionBadge = () => (
  <div className="absolute -top-3 left-4 bg-[#475569] text-white px-3 py-1 text-sm rounded-full">
    NUTRITION
  </div>
);

const DisclaimerBadge = () => (
  <div className="absolute -top-3 left-4 bg-[#FF6B35] text-white px-3 py-1 text-sm rounded-full">
    DISCLAIMER
  </div>
);

const NutritionSection = ({ productData, uiContent }: { productData: ProductData; uiContent?: UIContent }) => {
  const hasNutritionData = productData.nutrients && 
    Object.values(productData.nutrients).some(value => value !== undefined && value !== null);

  if (!hasNutritionData) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-6 text-center">{productData.name}</h2>
        <div className="bg-[#E8F5E9] p-6 rounded-lg border border-[#C8E6C9] relative mb-6">
          <div className="absolute -top-3 left-4 bg-[#4CAF50] text-white px-3 py-1 text-sm rounded-full">
            STATUS
          </div>
          <p className="text-sm leading-relaxed text-[#1B5E20]">
            {uiContent?.status?.message || 'Product found in database but nutritional information is not available.'}
          </p>
        </div>
        <div className="p-6 bg-gray-50 rounded-lg border border-gray-200 relative">
          <DetailsBadge />
          <div className="space-y-4">
            {productData.brand && (
              <div>
                <h3 className="font-medium">Brand:</h3>
                <p className="text-gray-700">{productData.brand}</p>
              </div>
            )}
            {productData.categories && (
              <div>
                <h3 className="font-medium">Category:</h3>
                <p className="text-gray-700">{productData.categories}</p>
              </div>
            )}
            {productData.description && (
              <div>
                <h3 className="font-medium">Description:</h3>
                <p className="text-gray-700">{productData.description}</p>
              </div>
            )}
          </div>
        </div>
        <div className="mt-6">
          <div className="bg-[#FFF5E4] p-6 rounded-lg border border-[#FFE4BC] relative">
            <DisclaimerBadge />
            <p className="text-[#4A4A4A] text-sm leading-relaxed">
              {uiContent?.disclaimer?.message || 'This application uses artificial intelligence to analyze products. While we strive for accuracy, AI-generated results may contain errors. Please verify information with product packaging.'}
            </p>
          </div>
        </div>
        {uiContent?.disclaimer?.action_steps && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <h4 className="font-medium mb-2">Where to find more information:</h4>
            {uiContent.disclaimer.action_steps.brand_url && (
              <a href={uiContent.disclaimer.action_steps.brand_url} 
                 target="_blank" 
                 rel="noopener noreferrer"
                 className="text-blue-600 hover:underline block mb-2">
                Official Brand Website
              </a>
            )}
            {uiContent.disclaimer.action_steps.shopping_links && (
              <div className="space-y-1">
                <p className="text-sm font-medium">Available at:</p>
                {uiContent.disclaimer.action_steps.shopping_links.map((link, i) => (
                  <a key={i} 
                     href={link} 
                     target="_blank" 
                     rel="noopener noreferrer"
                     className="text-blue-600 hover:underline block text-sm">
                    {new URL(link).hostname.replace('www.', '')}
                  </a>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-center">{productData.name}</h2>
      <div className="bg-[#E8F5E9] p-6 rounded-lg border border-[#C8E6C9] relative mb-6">
        <div className="absolute -top-3 left-4 bg-[#4CAF50] text-white px-3 py-1 text-sm rounded-full">
          STATUS
        </div>
        <p className="text-sm leading-relaxed text-[#1B5E20]">
          {uiContent?.status?.message || 'Nutritional information is available from OpenFoodFacts database.'}
        </p>
      </div>
      <div className="bg-gray-50 p-6 rounded-lg border border-gray-200 relative space-y-1">
        <NutritionBadge />
        <NutrientInfo label="Calories" value={productData.nutrients?.calories} unit="kcal" />
        <NutrientInfo label="Proteins" value={productData.nutrients?.proteins} unit="g" />
        <NutrientInfo label="Carbohydrates" value={productData.nutrients?.carbohydrates} unit="g" />
        <NutrientInfo label="Fat" value={productData.nutrients?.fat} unit="g" />
        <NutrientInfo label="Sugars" value={productData.nutrients?.sugars} unit="g" />
        <NutrientInfo label="Saturated Fat" value={productData.nutrients?.saturatedFat} unit="g" />
      </div>
      <div className="mt-6">
        <div className="bg-[#FFF5E4] p-6 rounded-lg border border-[#FFE4BC] relative">
          <DisclaimerBadge />
          <p className="text-[#4A4A4A] text-sm leading-relaxed">
            {uiContent?.disclaimer?.message || 'This application uses artificial intelligence to analyze products. While we strive for accuracy, AI-generated results may contain errors. Please verify information with product packaging.'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default function Home() {
  const { toast } = useToast()
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [result, setResult] = useState<{ productData: ProductData; ui_content?: UIContent } | null>(null);
  const [loadingMessage, setLoadingMessage] = useState<string>(getRandomLoadingMessage());

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLoading) {
      intervalId = setInterval(() => {
        setLoadingMessage(getRandomLoadingMessage());
      }, 5000);
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [isLoading]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.[0]) return;
    
    resetLoadingMessageCounter();
    setError(null);
    setIsLoading(true);
    setLoadingMessage(getRandomLoadingMessage());
    setSelectedImage(URL.createObjectURL(e.target.files[0]));
    
    const formData = new FormData();
    formData.append('image', e.target.files[0]);

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to analyze image');
      }

      const data = await response.json();
      setResult(data);
      
      toast({
        title: "Success",
        description: "Product analysis complete",
        variant: "default",
        duration: 3000,
      })

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
      console.error('Error uploading image:', error);
      
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : 'Failed to analyze image',
        variant: "destructive",
        duration: 3000,
      })

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FDF6F1]">
      <div className="w-full h-screen flex flex-col md:flex-row">
        <div className={`md:w-1/2 ${selectedImage ? 'hidden md:block' : 'block'} h-full relative`}>
          {!selectedImage ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <label 
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full md:w-1/2 h-[200px] border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-gray-500">PNG, JPG or JPEG</p>
                </div>
                <input
                  id="image-upload"
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                />
              </label>

              <label 
                htmlFor="camera-capture"
                className="flex flex-col items-center justify-center w-full md:w-1/2 h-[200px] border-2 border-dashed rounded-lg cursor-pointer bg-white hover:bg-gray-50"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Camera className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">Click to capture</span> using camera
                  </p>
                  <p className="text-xs text-gray-500">Take a photo of the product</p>
                </div>
                <input
                  id="camera-capture"
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={isLoading}
                />
              </label>
            </div>
          ) : (
            <div className="absolute inset-0 overflow-hidden">
              <div 
                className="absolute inset-0" 
                style={{ 
                  backgroundImage: `url(${selectedImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(10px) brightness(0.9)',
                  transform: 'scale(1.1)'
                }} 
              />
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="relative w-[80%] h-[80%]">
                  <Image
                    src={selectedImage}
                    alt="Selected product"
                    fill
                    className="object-contain"
                    quality={100}
                    priority
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {selectedImage && !isLoading && (
          <div className="fixed bottom-5 right-5 z-20 flex gap-3">
            <label 
              htmlFor="camera-capture-new"
              className="bg-blue-600 text-white p-2 rounded-full shadow-lg flex items-center gap-2 hover:cursor-pointer"
            >
              <Camera className="w-8 h-8" />
              <input
                id="camera-capture-new"
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleImageUpload}
                disabled={isLoading}
              />
            </label>

            <label 
              htmlFor="image-upload-new"
              className="bg-green-700 text-white p-2 rounded-full shadow-lg flex items-center gap-2 hover:cursor-pointer"
            >
              <ImagePlusIcon className="w-8 h-8" />
              <input
                id="image-upload-new"
                type="file"
                className="hidden"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={isLoading}
              />
            </label>
          </div>
        )}

        <div className="w-full md:w-1/2 h-screen overflow-hidden">
          {selectedImage && (
            <div className="bg-white h-full flex flex-col">
              <div className="md:hidden w-full h-[300px] flex-shrink-0 relative overflow-hidden">
                <div className="absolute inset-0" style={{ 
                  backgroundImage: `url(${selectedImage})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                  filter: 'blur(10px) brightness(0.9)',
                  transform: 'scale(1.1)'
                }} />
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <div className="w-[250px] h-[300px] relative">
                    <Image
                      src={selectedImage}
                      alt="Selected product"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex-1 h-0">
                {isLoading ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center space-y-4">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
                      <p className="text-lg">{loadingMessage}</p>
                    </div>
                  </div>
                ) : (
                  <ScrollArea className="h-full bg-white">
                    <div className="p-8 flex flex-col items-center justify-between h-screen">
                    {result?.productData ? <NutritionSection productData={result.productData} uiContent={result.ui_content} /> : (
                      error ? (
                        <div className="p-8">
                          <div className="bg-[#FEE2E2] p-6 rounded-lg border border-[#FECACA] relative">
                            <div className="absolute -top-3 left-4 bg-red-700 text-white px-3 py-1 text-sm rounded-full">
                              ERROR
                            </div>
                            <div className="flex flex-col items-center justify-center space-y-4">
                              <p className="text-[#991B1B] text-lg font-semibold">{error}</p>
                              <p className="text-[#991B1B] text-center">Please try again, or try after some time</p>
                            </div>
                          </div>
                        </div>
                      ) : null)}
                      <div className="flex flex-col items-center justify-center">
                        <span className="self-center text-sm text-gray-500">© Made with ❤️ by <Link href="https://anuragdeol.vercel.app/" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Anurag</Link></span>
                        <span className="self-center text-sm text-gray-500">Checkout this project on <Link href="https://github.com/anuragDeol/nutri-scan" target="_blank" rel="noopener noreferrer" className="text-blue-500 underline">Github</Link></span>
                      </div>
                    </div>
                  </ScrollArea>
                )}
              </div>
            </div>
          )}

          {!selectedImage && (
            <div className="bg-white h-full flex items-center justify-center">
              <p className="text-lg text-gray-500">
                Upload a product image to see the analysis
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}