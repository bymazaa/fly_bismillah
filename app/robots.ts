import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://flybismillah.com'; 

  return {
    rules: {
      userAgent: '*', 
      allow: '/',
      disallow: [
        '/admin/',     
        '/dashboard/',  
        '/api/',        
        '/checkout/',  
        '/auth/',      
        '/_next/',      
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}