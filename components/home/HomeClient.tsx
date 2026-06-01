"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { Product } from "@/types";
import { Search, ArrowRight, MapPin, MessageCircle, Youtube, Instagram, ChevronLeft, ChevronRight, Wand2, X } from "lucide-react";
import Image from "next/image";
import ProductCard from "@/components/ProductCard";
import CouponBanner from "@/components/CouponBanner";
import CatalogBrowse from "@/components/home/CatalogBrowse";

type CatalogState = {
  searchQuery: string;
};

const DEFAULT_CATALOG_STATE: CatalogState = {
  searchQuery: "",
};

const CATALOG_STORAGE_KEY = "catalogState";

interface HomeClientProps {
  initialProducts: Product[];
}

function HomeClientContent({ initialProducts }: HomeClientProps) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchSuggestionsRef = useRef<HTMLDivElement>(null);
  const [testimonialImages, setTestimonialImages] = useState<string[]>([]);
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const catalogSectionRef = useRef<HTMLDivElement | null>(null);
  const catalogStateRef = useRef<CatalogState>(DEFAULT_CATALOG_STATE);
  // Customizable Item modal state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customNote, setCustomNote] = useState("");
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [sendingWA, setSendingWA] = useState(false);

  const persistCatalogState = (updates: Partial<CatalogState>) => {
    if (typeof window === "undefined") return;
    catalogStateRef.current = { ...catalogStateRef.current, ...updates };
    // Using sessionStorage so each visitor starts fresh (perfect for Instagram bio links)
    sessionStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(catalogStateRef.current));
  };

  // Filter products based on search query (word-by-word matching)
  const filteredProductsBySearch = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(word => word.length > 0);
    if (queryWords.length === 0) return [];

    return products.filter(product => {
      const searchableText = [
        product.name,
        product.description,
        product.category,
        product.subcategory,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      // Check if all words in the query match (word-by-word)
      return queryWords.every(word => searchableText.includes(word));
    });
  }, [searchQuery, products]);

  // Get search suggestions (Google-style - shows as user types)
  const searchSuggestions = useMemo(() => {
    if (!searchQuery.trim()) return [];
    
    const queryLower = searchQuery.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/).filter(word => word.length > 0);
    
    // Collect all possible suggestions from products
    const allSuggestions = new Set<string>();
    
    // Add product names, categories, and subcategories
    products.forEach(product => {
      if (product.name) allSuggestions.add(product.name);
      if (product.category) allSuggestions.add(product.category);
      if (product.subcategory) allSuggestions.add(product.subcategory);
    });
    
    // Filter suggestions that match the query (word-by-word or partial match)
    const matchingSuggestions = Array.from(allSuggestions).filter(suggestion => {
      const suggestionLower = suggestion.toLowerCase();
      
      // Check if all query words are present in the suggestion
      if (queryWords.length > 0) {
        return queryWords.every(word => suggestionLower.includes(word));
      }
      
      // Fallback to simple contains check
      return suggestionLower.includes(queryLower);
    });
    
    // Sort by relevance (exact matches first, then by length)
    const sorted = matchingSuggestions.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match gets priority
      if (aLower === queryLower) return -1;
      if (bLower === queryLower) return 1;
      
      // Starts with query gets priority
      if (aLower.startsWith(queryLower)) return -1;
      if (bLower.startsWith(queryLower)) return 1;
      
      // Shorter matches first
      return a.length - b.length;
    });
    
    return sorted.slice(0, 10); // Show up to 10 suggestions like Google
  }, [searchQuery, products]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setShowSearchSuggestions(value.trim().length > 0); // Show suggestions as soon as user types
    persistCatalogState({ searchQuery: value });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSearchQuery(suggestion);
    setShowSearchSuggestions(false);
    persistCatalogState({ searchQuery: suggestion });
    // Scroll to search results
    if (catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSearchSuggestions(false);
    if (searchQuery.trim() && catalogSectionRef.current) {
      catalogSectionRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchSuggestionsRef.current &&
        !searchSuggestionsRef.current.contains(event.target as Node) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target as Node)
      ) {
        setShowSearchSuggestions(false);
      }
    };

    if (showSearchSuggestions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showSearchSuggestions]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const storedRaw = sessionStorage.getItem(CATALOG_STORAGE_KEY);
      if (!storedRaw) {
        return;
      }

      const parsed: CatalogState = { ...DEFAULT_CATALOG_STATE, ...JSON.parse(storedRaw) };
      catalogStateRef.current = parsed;

      if (parsed.searchQuery) {
        setSearchQuery(parsed.searchQuery);
      }
    } catch (error) {
      console.error("Failed to restore catalog preferences:", error);
    }
  }, []);

  const resinArtQuotes = [
    "Resin art is where creativity meets chemistry, creating timeless beauty",
    "Every drop of resin tells a story, every layer adds depth to your vision",
    "Transform ordinary into extraordinary with the magic of resin art",
    "Resin art: Where fluidity meets permanence, creating art that lasts forever",
    "In resin art, imperfections become perfections, and mistakes become masterpieces",
    "Resin art captures moments in crystal clarity, preserving beauty for eternity"
  ];

  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setCurrentQuoteIndex((prevIndex) => (prevIndex + 1) % resinArtQuotes.length);
    }, 4000); // Change quote every 4 seconds

    return () => clearInterval(quoteInterval);
  }, []);

  useEffect(() => {
    setProducts(initialProducts);
  }, [initialProducts]);

  // Load testimonial images - review images from Testimonies folder
  useEffect(() => {
    // Directly set the review images we know exist
    const images = [
      "/Testimonies/review (1).jpeg",
      "/Testimonies/review (2).jpeg",
      "/Testimonies/review (3).jpeg",
      "/Testimonies/review (4).jpeg",
      "/Testimonies/review (5).jpeg",
      "/Testimonies/review (6).jpeg",
      "/Testimonies/review (7).jpeg",
      "/Testimonies/review (8).jpeg",
      "/Testimonies/review (9).jpeg",
      "/Testimonies/review (10).jpeg",
      "/Testimonies/review (11).jpeg",
      "/Testimonies/review (12).jpeg",
      "/Testimonies/review (13).jpeg",
      "/Testimonies/review (14).jpeg",
      "/Testimonies/review (15).jpeg",
    ];
    setTestimonialImages(images);
  }, []);

  // Auto-rotate review images with smooth transition - always active unless paused
  useEffect(() => {
    if (testimonialImages.length === 0) return;
    
    // Auto-resume after 3 seconds if paused
    let resumeTimeout: NodeJS.Timeout;
    if (isPaused) {
      resumeTimeout = setTimeout(() => {
        setIsPaused(false);
      }, 3000);
    }
    
    if (isPaused) {
      return () => {
        if (resumeTimeout) clearTimeout(resumeTimeout);
      };
    }
    
    const interval = setInterval(() => {
      setIsTransitioning(true);
      setTimeout(() => {
        setCurrentReviewIndex((prevIndex) => 
          (prevIndex + 1) % testimonialImages.length
        );
        setTimeout(() => {
          setIsTransitioning(false);
        }, 50);
      }, 150);
    }, 3000); // Change image every 3 seconds

    return () => {
      clearInterval(interval);
      if (resumeTimeout) clearTimeout(resumeTimeout);
    };
  }, [testimonialImages.length, isPaused]);

  // Navigation functions - pause auto-rotation when user navigates manually
  const goToPrevious = () => {
    setIsPaused(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentReviewIndex((prevIndex) => 
        prevIndex === 0 ? testimonialImages.length - 1 : prevIndex - 1
      );
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const goToNext = () => {
    setIsPaused(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentReviewIndex((prevIndex) => 
        (prevIndex + 1) % testimonialImages.length
      );
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  const goToImage = (index: number) => {
    if (index === currentReviewIndex) return;
    setIsPaused(true);
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentReviewIndex(index);
      setTimeout(() => {
        setIsTransitioning(false);
      }, 50);
    }, 150);
  };

  return (
    <div className="min-h-screen">
      <CouponBanner variant="banner" />
      {/* Hero Section with Decorative Elements */}
      <section className="relative overflow-hidden bg-gradient-to-br from-purple-200 via-purple-100 to-purple-200 min-h-[48vh] flex items-center justify-center">
        {/* Background Image */}
        <div className="absolute inset-0 opacity-45">
          <Image
            src="/background/bg.png"
            alt="Floral Background"
            fill
            sizes="100vw"
            className="object-cover"
            priority
            quality={90}
          />
        </div>
        
        {/* Decorative Background Patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-10 left-10 w-64 h-64 bg-purple-300 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-80 h-80 bg-pink-200 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-200 rounded-full blur-3xl"></div>
        </div>
        
        {/* Fine textured overlay */}
        <div className="absolute inset-0 opacity-15" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, rgba(196, 181, 253, 0.2) 1px, transparent 0)`,
          backgroundSize: '20px 20px'
        }}></div>

        {/* Mandala/Pattern Overlay */}
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.3) 1px, transparent 0)`,
          backgroundSize: '40px 40px'
        }}></div>

        {/* Beautiful Watercolor Floral Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top Left Floral Cluster */}
          <div className="absolute -top-32 -left-32 w-96 h-96 opacity-70">
            <svg viewBox="0 0 400 400" className="w-full h-full text-purple-500" preserveAspectRatio="xMidYMid meet">
              {/* Large Dahlia/Chrysanthemum */}
              <g transform="translate(200, 200)">
                {/* Outer petals */}
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(0)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(30)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(60)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(90)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(120)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(150)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(180)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(210)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(240)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(270)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(300)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="25" fill="currentColor" opacity="0.6" transform="rotate(330)"/>
                {/* Middle petals */}
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(15)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(45)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(75)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(105)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(135)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(165)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(195)"/>
                <ellipse cx="0" cy="-25" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(225)"/>
                {/* Center */}
                <circle cx="0" cy="0" r="15" fill="currentColor" opacity="0.8"/>
                <circle cx="0" cy="0" r="8" fill="currentColor" opacity="0.9"/>
              </g>
              
              {/* Smaller flowers around */}
              <g transform="translate(100, 150)">
                <circle cx="0" cy="0" r="20" fill="currentColor" opacity="0.5"/>
                <path d="M0,-20 Q-5,-10 0,0 Q5,-10 0,-20" fill="currentColor" opacity="0.4"/>
                <path d="M0,20 Q-5,10 0,0 Q5,10 0,20" fill="currentColor" opacity="0.4"/>
                <path d="M-20,0 Q-10,-5 0,0 Q-10,5 -20,0" fill="currentColor" opacity="0.4"/>
                <path d="M20,0 Q10,-5 0,0 Q10,5 20,0" fill="currentColor" opacity="0.4"/>
              </g>
              
              <g transform="translate(300, 250)">
                <circle cx="0" cy="0" r="18" fill="currentColor" opacity="0.5"/>
                <path d="M0,-18 Q-4,-9 0,0 Q4,-9 0,-18" fill="currentColor" opacity="0.4"/>
                <path d="M0,18 Q-4,9 0,0 Q4,9 0,18" fill="currentColor" opacity="0.4"/>
                <path d="M-18,0 Q-9,-4 0,0 Q-9,4 -18,0" fill="currentColor" opacity="0.4"/>
                <path d="M18,0 Q9,-4 0,0 Q9,4 18,0" fill="currentColor" opacity="0.4"/>
              </g>
              
              {/* Leaves */}
              <g transform="translate(150, 280)" className="text-purple-600">
                <ellipse cx="0" cy="0" rx="25" ry="12" fill="currentColor" opacity="0.4" transform="rotate(-30)"/>
              </g>
              <g transform="translate(250, 320)" className="text-purple-600">
                <ellipse cx="0" cy="0" rx="20" ry="10" fill="currentColor" opacity="0.4" transform="rotate(45)"/>
              </g>
            </svg>
          </div>
          
          {/* Bottom Right Floral Cluster */}
          <div className="absolute -bottom-32 -right-32 w-96 h-96 opacity-70">
            <svg viewBox="0 0 400 400" className="w-full h-full text-pink-500" preserveAspectRatio="xMidYMid meet">
              {/* Large Dahlia/Chrysanthemum */}
              <g transform="translate(200, 200)">
                {/* Outer petals */}
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(0)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(30)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(60)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(90)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(120)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(150)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(180)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(210)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(240)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(270)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(300)"/>
                <ellipse cx="0" cy="-45" rx="14" ry="28" fill="currentColor" opacity="0.65" transform="rotate(330)"/>
                {/* Middle petals */}
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(15)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(45)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(75)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(105)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(135)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(165)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(195)"/>
                <ellipse cx="0" cy="-28" rx="10" ry="20" fill="currentColor" opacity="0.75" transform="rotate(225)"/>
                {/* Center */}
                <circle cx="0" cy="0" r="18" fill="currentColor" opacity="0.85"/>
                <circle cx="0" cy="0" r="10" fill="currentColor" opacity="0.95"/>
              </g>
              
              {/* Smaller flowers */}
              <g transform="translate(120, 120)">
                <circle cx="0" cy="0" r="22" fill="currentColor" opacity="0.55"/>
                <path d="M0,-22 Q-6,-11 0,0 Q6,-11 0,-22" fill="currentColor" opacity="0.45"/>
                <path d="M0,22 Q-6,11 0,0 Q6,11 0,22" fill="currentColor" opacity="0.45"/>
                <path d="M-22,0 Q-11,-6 0,0 Q-11,6 -22,0" fill="currentColor" opacity="0.45"/>
                <path d="M22,0 Q11,-6 0,0 Q11,6 22,0" fill="currentColor" opacity="0.45"/>
              </g>
              
              <g transform="translate(280, 280)">
                <circle cx="0" cy="0" r="20" fill="currentColor" opacity="0.55"/>
                <path d="M0,-20 Q-5,-10 0,0 Q5,-10 0,-20" fill="currentColor" opacity="0.45"/>
                <path d="M0,20 Q-5,10 0,0 Q5,10 0,20" fill="currentColor" opacity="0.45"/>
                <path d="M-20,0 Q-10,-5 0,0 Q-10,5 -20,0" fill="currentColor" opacity="0.45"/>
                <path d="M20,0 Q10,-5 0,0 Q10,5 20,0" fill="currentColor" opacity="0.45"/>
              </g>
              
              {/* Leaves */}
              <g transform="translate(100, 250)" className="text-pink-600">
                <ellipse cx="0" cy="0" rx="28" ry="14" fill="currentColor" opacity="0.45" transform="rotate(25)"/>
              </g>
              <g transform="translate(300, 150)" className="text-pink-600">
                <ellipse cx="0" cy="0" rx="24" ry="12" fill="currentColor" opacity="0.45" transform="rotate(-40)"/>
              </g>
            </svg>
          </div>
          
          {/* Watercolor Splashes */}
          <div className="absolute top-20 left-20 w-64 h-64 opacity-30">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300/50 via-pink-300/40 to-purple-400/30 blur-2xl"></div>
          </div>
          <div className="absolute bottom-24 right-24 w-72 h-72 opacity-30">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-pink-300/50 via-rose-300/40 to-pink-400/30 blur-2xl"></div>
          </div>
        </div>

        {/* Elegant Floral Designs */}
        <div className="absolute top-16 left-12 w-24 h-24 opacity-35">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
            {/* Rose/Flower */}
            <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.8"/>
            <path d="M50,30 Q45,40 50,50 Q55,40 50,30" fill="currentColor" opacity="0.7"/>
            <path d="M50,70 Q45,60 50,50 Q55,60 50,70" fill="currentColor" opacity="0.7"/>
            <path d="M30,50 Q40,45 50,50 Q40,55 30,50" fill="currentColor" opacity="0.7"/>
            <path d="M70,50 Q60,45 50,50 Q60,55 70,50" fill="currentColor" opacity="0.7"/>
            <path d="M38,38 Q42,42 50,50 Q42,42 38,38" fill="currentColor" opacity="0.6"/>
            <path d="M62,38 Q58,42 50,50 Q58,42 62,38" fill="currentColor" opacity="0.6"/>
            <path d="M38,62 Q42,58 50,50 Q42,58 38,62" fill="currentColor" opacity="0.6"/>
            <path d="M62,62 Q58,58 50,50 Q58,58 62,62" fill="currentColor" opacity="0.6"/>
          </svg>
        </div>

        <div className="absolute top-32 right-16 w-20 h-20 opacity-30">
          <svg viewBox="0 0 100 100" className="w-full h-full text-pink-400">
            {/* Lotus */}
            <path d="M50 20 L55 45 L80 45 L60 60 L65 85 L50 70 L35 85 L40 60 L20 45 L45 45 Z" fill="currentColor" opacity="0.8"/>
            <circle cx="50" cy="50" r="6" fill="currentColor" opacity="0.9"/>
          </svg>
        </div>

        <div className="absolute bottom-24 left-20 w-28 h-28 opacity-30">
          <svg viewBox="0 0 100 100" className="w-full h-full text-purple-300">
            {/* Floral Pattern */}
            <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.7"/>
            <path d="M50,30 Q48,40 50,50 Q52,40 50,30" fill="currentColor" opacity="0.6"/>
            <path d="M50,70 Q48,60 50,50 Q52,60 50,70" fill="currentColor" opacity="0.6"/>
            <path d="M30,50 Q40,48 50,50 Q40,52 30,50" fill="currentColor" opacity="0.6"/>
            <path d="M70,50 Q60,48 50,50 Q60,52 70,50" fill="currentColor" opacity="0.6"/>
            <circle cx="50" cy="35" r="3" fill="currentColor" opacity="0.7"/>
            <circle cx="50" cy="65" r="3" fill="currentColor" opacity="0.7"/>
            <circle cx="35" cy="50" r="3" fill="currentColor" opacity="0.7"/>
            <circle cx="65" cy="50" r="3" fill="currentColor" opacity="0.7"/>
          </svg>
        </div>

        {/* Scattered small flowers */}
        <div className="absolute top-1/4 right-1/4 w-12 h-12 opacity-25">
          <svg viewBox="0 0 50 50" className="w-full h-full text-purple-300">
            <circle cx="25" cy="25" r="4" fill="currentColor"/>
            <circle cx="25" cy="15" r="2" fill="currentColor"/>
            <circle cx="25" cy="35" r="2" fill="currentColor"/>
            <circle cx="15" cy="25" r="2" fill="currentColor"/>
            <circle cx="35" cy="25" r="2" fill="currentColor"/>
          </svg>
        </div>

        <div className="absolute bottom-1/3 left-1/3 w-10 h-10 opacity-25">
          <svg viewBox="0 0 50 50" className="w-full h-full text-pink-300">
            <circle cx="25" cy="25" r="3" fill="currentColor"/>
            <circle cx="25" cy="15" r="2" fill="currentColor"/>
            <circle cx="25" cy="35" r="2" fill="currentColor"/>
            <circle cx="15" cy="25" r="2" fill="currentColor"/>
            <circle cx="35" cy="25" r="2" fill="currentColor"/>
          </svg>
        </div>

        {/* Peacock-like Design */}
        <div className="absolute top-1/3 right-16 w-48 h-48 opacity-15">
          <div className="relative w-full h-full">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-300 via-pink-200 to-purple-300 rounded-full blur-xl"></div>
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-24 h-24 bg-gradient-to-b from-purple-200 to-pink-200 rounded-full"></div>
            <div className="absolute top-8 left-4 w-16 h-16 bg-pink-300 rounded-full"></div>
            <div className="absolute top-8 right-4 w-16 h-16 bg-purple-300 rounded-full"></div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 text-center px-4">
      <div className="mb-7">
            <div className="min-h-[200px] md:min-h-[250px] flex items-center justify-center">
              <div className="max-w-4xl mx-auto px-4">
                <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-purple-800 drop-shadow-2xl mb-4 leading-tight" style={{
                  textShadow: '2px 2px 4px rgba(0,0,0,0.1), 0 0 20px rgba(147, 51, 234, 0.3)',
                  fontFamily: 'serif'
                }}>
                  <span className="inline-block transition-all duration-500 ease-in-out">
                    "{resinArtQuotes[currentQuoteIndex]}"
                  </span>
                </h1>
                <div className="flex justify-center gap-2 mt-4">
                  {resinArtQuotes.map((_, index) => (
                    <div
                      key={index}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentQuoteIndex
                          ? 'w-8 bg-purple-600'
                          : 'w-2 bg-purple-300'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
          
          <p className="text-purple-800 text-lg sm:text-xl md:text-2xl mb-7 font-light drop-shadow-sm">
            Discover Beautiful Handcrafted Products for Every Celebration
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto">
            <form onSubmit={handleSearchSubmit} className="relative">
              <Search className="absolute left-3 sm:left-4 top-1/2 transform -translate-y-1/2 text-purple-600 w-5 h-5 sm:w-6 sm:h-6 z-10" />
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search for products..."
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => {
                  if (searchQuery.trim() || searchSuggestions.length > 0) {
                    setShowSearchSuggestions(true);
                  }
                }}
                className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-3.5 rounded-full bg-white/95 backdrop-blur-sm border-2 border-white/50 focus:outline-none focus:ring-4 focus:ring-yellow-300/50 shadow-2xl text-base sm:text-lg"
              />
              
              {/* Search Suggestions Dropdown - Google Style */}
              {showSearchSuggestions && searchQuery.trim() && (
                <div
                  ref={searchSuggestionsRef}
                  className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-gray-200 max-h-96 overflow-y-auto"
                >
                  {searchSuggestions.length > 0 ? (
                    <div className="py-1">
                      {searchSuggestions.map((suggestion, index) => {
                        // Highlight matching text
                        const suggestionLower = suggestion.toLowerCase();
                        const queryLower = searchQuery.toLowerCase();
                        const matchIndex = suggestionLower.indexOf(queryLower);
                        
                        return (
                          <button
                            key={`${suggestion}-${index}`}
                            type="button"
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-100 transition-colors flex items-center gap-3 group"
                          >
                            <Search className="w-5 h-5 text-gray-400 group-hover:text-purple-600 flex-shrink-0" />
                            <span className="text-gray-800 text-sm flex-1">
                              {matchIndex >= 0 ? (
                                <>
                                  {suggestion.substring(0, matchIndex)}
                                  <span className="font-semibold text-purple-700">
                                    {suggestion.substring(matchIndex, matchIndex + searchQuery.length)}
                                  </span>
                                  {suggestion.substring(matchIndex + searchQuery.length)}
                                </>
                              ) : (
                                suggestion
                              )}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">
                      No suggestions found
                    </div>
                  )}
                </div>
              )}
            </form>
          </div>
        </div>
      </section>

      {/* Catalog Section - Main Categories */}
      <section ref={catalogSectionRef} className="relative py-16 px-4 overflow-hidden">
        {/* Floral Background for Catalog Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top Left Floral Cluster */}
          <div className="absolute -top-24 -left-24 w-80 h-80 opacity-60">
            <svg viewBox="0 0 300 300" className="w-full h-full text-purple-400">
              <g transform="translate(150, 150)">
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(0)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(30)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(60)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(90)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(120)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(150)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(180)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(210)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(240)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(270)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(300)"/>
                <ellipse cx="0" cy="-35" rx="10" ry="22" fill="currentColor" opacity="0.6" transform="rotate(330)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(15)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(45)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(75)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(105)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(135)"/>
                <ellipse cx="0" cy="-22" rx="7" ry="16" fill="currentColor" opacity="0.7" transform="rotate(165)"/>
                <circle cx="0" cy="0" r="12" fill="currentColor" opacity="0.8"/>
                <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.9"/>
              </g>
              <g transform="translate(80, 100)">
                <circle cx="0" cy="0" r="16" fill="currentColor" opacity="0.5"/>
                <path d="M0,-16 Q-4,-8 0,0 Q4,-8 0,-16" fill="currentColor" opacity="0.4"/>
                <path d="M0,16 Q-4,8 0,0 Q4,8 0,16" fill="currentColor" opacity="0.4"/>
                <path d="M-16,0 Q-8,-4 0,0 Q-8,4 -16,0" fill="currentColor" opacity="0.4"/>
                <path d="M16,0 Q8,-4 0,0 Q8,4 16,0" fill="currentColor" opacity="0.4"/>
              </g>
            </svg>
            </div>
          
          {/* Top Right Floral Cluster */}
          <div className="absolute -top-20 -right-20 w-72 h-72 opacity-60">
            <svg viewBox="0 0 300 300" className="w-full h-full text-pink-400">
              <g transform="translate(150, 150)">
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(0)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(30)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(60)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(90)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(120)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(150)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(180)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(210)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(240)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(270)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(300)"/>
                <ellipse cx="0" cy="-32" rx="9" ry="20" fill="currentColor" opacity="0.65" transform="rotate(330)"/>
                <circle cx="0" cy="0" r="14" fill="currentColor" opacity="0.85"/>
                <circle cx="0" cy="0" r="7" fill="currentColor" opacity="0.95"/>
              </g>
            </svg>
        </div>
          
          {/* Bottom Left Watercolor Splash */}
          <div className="absolute bottom-10 left-10 w-64 h-64 opacity-35">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300/40 via-pink-300/30 to-purple-400/25 blur-3xl"></div>
          </div>
          
          {/* Bottom Right Watercolor Splash */}
          <div className="absolute bottom-10 right-10 w-56 h-56 opacity-35">
            <div className="w-full h-full rounded-full bg-gradient-to-bl from-pink-300/40 via-rose-300/30 to-pink-400/25 blur-3xl"></div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-7xl px-4 sm:px-6 relative z-10">
          <h2 className="text-3xl sm:text-4xl font-bold text-center mb-8 sm:mb-12 text-purple-900 drop-shadow-sm">
            Browse Our Catalog
          </h2>

          <CatalogBrowse />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mt-8">
            {/* Search Results Section */}
            {searchQuery.trim() && filteredProductsBySearch.length > 0 && (
              <div className="md:col-span-2 lg:col-span-4 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-purple-100/50 p-5 lg:p-6">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-5 pb-3 border-b border-purple-100">
                    <h3 className="text-xl md:text-2xl font-bold text-purple-800">
                      Search Results for "{searchQuery}"
                      <span className="block sm:inline text-sm sm:text-base font-normal text-gray-600 sm:ml-2">
                        ({filteredProductsBySearch.length} {filteredProductsBySearch.length === 1 ? 'product' : 'products'})
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        setSearchQuery("");
                        setShowSearchSuggestions(false);
                        persistCatalogState({ searchQuery: "" });
                      }}
                      className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 font-medium flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors text-sm"
                    >
                      <X className="w-4 h-4" />
                      <span className="hidden sm:inline">Clear</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {filteredProductsBySearch.map((product, index) => (
                      <div
                        key={product.id}
                        style={{ animationDelay: `${index * 50}ms` }}
                        className="animate-in fade-in slide-in-from-bottom-4 duration-500"
                      >
                        <ProductCard product={product} />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No Search Results Message */}
            {searchQuery.trim() && filteredProductsBySearch.length === 0 && (
              <div className="md:col-span-2 lg:col-span-4 mt-6 animate-in fade-in slide-in-from-top-4 duration-500">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border border-purple-100/50 p-8 text-center">
                  <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">No products found</h3>
                  <p className="text-gray-600 mb-4">
                    No products match your search for "{searchQuery}"
                  </p>
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setShowSearchSuggestions(false);
                      persistCatalogState({ searchQuery: "" });
                    }}
                    className="text-purple-600 hover:text-purple-800 hover:bg-purple-50 font-medium px-4 py-2 rounded-lg transition-colors"
                  >
                    Clear search
                  </button>
                </div>
              </div>
            )}
            
            {/* --- Customizable Item Card --- */}
            <div
              key="customizable-item"
              className="group relative overflow-hidden rounded-3xl shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 cursor-pointer"
              onClick={() => setShowCustomModal(true)}
            >
              {/* Background Gradient */}
              <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-yellow-400 opacity-90"></div>
              {/* Decorative Pattern */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white rounded-full blur-2xl"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-white rounded-full blur-2xl"></div>
              </div>
              {/* Content */}
              <div className="relative z-10 p-5 sm:p-6 min-h-[260px] sm:min-h-[300px] flex flex-col">
                {/* Icon */}
                <div className="mb-4">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Wand2 className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                  </div>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-white mb-2 group-hover:translate-x-2 transition-transform">Customizable Item</h3>
                <p className="text-white/80 text-sm mb-4">Create something unique with your message</p>
                {/* Preview Icon instead of image */}
                <div className="mt-auto flex justify-center">
                  <span className="inline-flex items-center justify-center w-20 h-20 sm:w-24 sm:h-24 rounded-xl bg-white/20 text-white text-5xl shadow-lg">
                    <Wand2 className="w-10 h-10" />
                  </span>
                </div>
                <div className="absolute bottom-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/30 transition-all">
                  <ArrowRight className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </div>

          {/* --- Customizable Item Modal --- */}
          {showCustomModal && (
            <div className="fixed inset-0 flex items-center justify-center bg-black/30 z-50 p-4">
              <div className="bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto p-5 sm:p-8 relative animate-fadeIn">
                <button
                  onClick={() => setShowCustomModal(false)}
                  className="absolute top-4 right-6 text-gray-500 hover:text-purple-600 text-lg font-bold"
                  aria-label="Close"
                >
                  ×
                </button>
                <h3 className="text-lg sm:text-xl font-bold text-center mb-2 text-purple-700">Order a Customizable Item</h3>
                {/* WhatsApp opening explanation */}
                <p className="text-sm sm:text-[15px] text-gray-700 text-center mb-5">
                  <b>After you submit, WhatsApp will open with all your details. Just press <span className="bg-green-100 text-green-900 px-1 rounded">Send</span> to place your order!</b>
                </p>
                <form
                  onSubmit={e => {
                    e.preventDefault();
                    if (!customNote.trim() || !customName.trim() || !customNumber.trim()) {
                      alert('Please fill all fields.');
                      return;
                    }
                    setSendingWA(true);
                    const waMsg = `Hi, I want to order a custom item.\nMessage: ${customNote}\nName: ${customName}\nContact: ${customNumber}`;
                    const waMsgEncoded = encodeURIComponent(waMsg);
                    const waURL = `https://wa.me/917209732310?text=${waMsgEncoded}`;
                    window.open(waURL, '_blank');
                    setSendingWA(false);
                    setShowCustomModal(false);
                    setCustomNote(""); setCustomName(""); setCustomNumber("");
                  }}
                  className="flex flex-col gap-4"
                >
                  <label className="font-semibold text-purple-700">
                    Your Message/Note
                    <textarea
                      rows={3}
                      className="w-full mt-1 rounded-lg border-gray-300 bg-purple-50/40 p-2 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      placeholder="Write what you want customized..."
                      value={customNote}
                      required
                      onChange={e => setCustomNote(e.target.value)}
                    />
                  </label>
                  <label className="font-semibold text-purple-700">
                    Your Name
                    <input
                      type="text"
                      className="w-full mt-1 rounded-lg border-gray-300 bg-purple-50/40 p-2 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      placeholder="Your name"
                      value={customName}
                      required
                      onChange={e => setCustomName(e.target.value)}
                    />
                  </label>
                  <label className="font-semibold text-purple-700">
                    Your Mobile Number
                    <input
                      type="tel"
                      className="w-full mt-1 rounded-lg border-gray-300 bg-purple-50/40 p-2 focus:outline-none focus:ring-2 focus:ring-yellow-200"
                      placeholder="Your 10-digit number"
                      value={customNumber}
                      required
                      onChange={e => setCustomNumber(e.target.value)}
                      pattern="[0-9]{10,13}"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={sendingWA}
                    className="mt-4 rounded-full bg-gradient-to-r from-green-500 to-amber-400 hover:from-green-600 hover:to-yellow-500 text-white font-bold py-3 shadow-lg transition-all disabled:opacity-60"
                  >
                    {sendingWA ? "Sending to WhatsApp..." : "Send Order on WhatsApp"}
                  </button>
                </form>
                {/* Copy to Clipboard fallback */}
                {(customNote || customName || customNumber) && (
                  <div className="mt-3 flex flex-col items-center">
                    <button
                      className="text-sm text-purple-700 hover:text-purple-900 bg-purple-100 px-3 py-1 rounded-lg mt-1"
                      onClick={() => {
                        const waMsg = `Hi, I want to order a custom item.\nMessage: ${customNote}\nName: ${customName}\nContact: ${customNumber}`;
                        navigator.clipboard.writeText(waMsg);
                        alert('Message copied! You can now paste it in WhatsApp if needed.');
                      }}
                      type="button"
                    >
                      Copy message to clipboard (if WhatsApp does not open)
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Mehndi-Inspired Decorative Section */}
      <section className="relative py-12 px-4 overflow-hidden">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/10 backdrop-blur-sm"></div>
        
        {/* Beautiful Floral Background for Artistry Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Left Side Floral Cluster */}
          <div className="absolute -left-20 top-1/2 transform -translate-y-1/2 w-96 h-96 opacity-65">
            <svg viewBox="0 0 400 400" className="w-full h-full text-purple-500">
              <g transform="translate(200, 200)">
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(0)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(30)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(60)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(90)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(120)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(150)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(180)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(210)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(240)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(270)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(300)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.6" transform="rotate(330)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(15)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(45)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(75)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(105)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(135)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.7" transform="rotate(165)"/>
                <circle cx="0" cy="0" r="13" fill="currentColor" opacity="0.8"/>
                <circle cx="0" cy="0" r="7" fill="currentColor" opacity="0.9"/>
              </g>
            </svg>
          </div>
          
          {/* Right Side Floral Cluster */}
          <div className="absolute -right-20 top-1/2 transform -translate-y-1/2 w-96 h-96 opacity-65">
            <svg viewBox="0 0 400 400" className="w-full h-full text-pink-500">
              <g transform="translate(200, 200)">
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(0)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(30)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(60)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(90)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(120)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(150)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(180)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(210)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(240)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(270)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(300)"/>
                <ellipse cx="0" cy="-40" rx="12" ry="26" fill="currentColor" opacity="0.65" transform="rotate(330)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(15)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(45)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(75)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(105)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(135)"/>
                <ellipse cx="0" cy="-25" rx="9" ry="19" fill="currentColor" opacity="0.75" transform="rotate(165)"/>
                <circle cx="0" cy="0" r="15" fill="currentColor" opacity="0.85"/>
                <circle cx="0" cy="0" r="8" fill="currentColor" opacity="0.95"/>
              </g>
            </svg>
          </div>
          
          {/* Top Center Watercolor Splash */}
          <div className="absolute top-10 left-1/2 transform -translate-x-1/2 w-80 h-80 opacity-40">
            <div className="w-full h-full rounded-full bg-gradient-to-b from-purple-300/35 via-pink-300/30 to-purple-400/25 blur-3xl"></div>
          </div>
          
          {/* Bottom Center Watercolor Splash */}
          <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 w-72 h-72 opacity-40">
            <div className="w-full h-full rounded-full bg-gradient-to-t from-pink-300/35 via-rose-300/30 to-pink-400/25 blur-3xl"></div>
          </div>
        </div>
        
        {/* Elegant Floral Background Pattern */}
        <div className="absolute inset-0 opacity-25 overflow-hidden pointer-events-none">
          {/* Top left floral */}
          <div className="absolute top-8 left-8 w-32 h-32 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
              <path d="M50,15 Q45,25 50,35 Q55,25 50,15" fill="currentColor"/>
              <path d="M50,65 Q45,75 50,85 Q55,75 50,65" fill="currentColor"/>
              <path d="M15,50 Q25,45 35,50 Q25,55 15,50" fill="currentColor"/>
              <path d="M85,50 Q75,45 65,50 Q75,55 85,50" fill="currentColor"/>
              <circle cx="50" cy="50" r="8" fill="currentColor" opacity="0.6"/>
              <circle cx="50" cy="25" r="3" fill="currentColor" opacity="0.5"/>
              <circle cx="50" cy="75" r="3" fill="currentColor" opacity="0.5"/>
              <circle cx="25" cy="50" r="3" fill="currentColor" opacity="0.5"/>
              <circle cx="75" cy="50" r="3" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          
          {/* Top right floral */}
          <div className="absolute top-12 right-12 w-28 h-28 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full text-pink-400">
              <path d="M50 10 L55 35 L80 35 L60 50 L70 80 L50 65 L30 80 L40 50 L20 35 L45 35 Z" fill="currentColor" opacity="0.5"/>
              <circle cx="50" cy="45" r="5" fill="currentColor" opacity="0.7"/>
            </svg>
          </div>
          
          {/* Bottom left floral */}
          <div className="absolute bottom-16 left-16 w-24 h-24 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full text-purple-300">
              <path d="M50,20 Q60,30 70,50 Q60,70 50,80 Q40,70 30,50 Q40,30 50,20" fill="currentColor" opacity="0.4"/>
              <path d="M50,35 Q55,45 60,50 Q55,55 50,65 Q45,55 40,50 Q45,45 50,35" fill="currentColor" opacity="0.5"/>
            </svg>
          </div>
          
          {/* Bottom right floral */}
          <div className="absolute bottom-12 right-8 w-30 h-30 opacity-30">
            <svg viewBox="0 0 100 100" className="w-full h-full text-rose-400">
              <circle cx="50" cy="50" r="10" fill="none" stroke="currentColor" strokeWidth="1.5" opacity="0.4"/>
              <path d="M50,30 Q48,40 50,50 Q52,40 50,30" fill="currentColor" opacity="0.3"/>
              <path d="M50,70 Q48,60 50,50 Q52,60 50,70" fill="currentColor" opacity="0.3"/>
              <path d="M30,50 Q40,48 50,50 Q40,52 30,50" fill="currentColor" opacity="0.3"/>
              <path d="M70,50 Q60,48 50,50 Q60,52 70,50" fill="currentColor" opacity="0.3"/>
              <circle cx="50" cy="50" r="4" fill="currentColor" opacity="0.6"/>
            </svg>
          </div>
        </div>

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 relative z-10">
          {/* Main Card with Mehndi Border */}
          <div className="relative bg-white/90 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden">
            {/* Background Image for Container */}
            <div className="absolute inset-0 opacity-30">
              <Image
                src="/background/bg2.png"
                alt="Floral Background"
                fill
                sizes="100vw"
                className="object-cover"
                quality={90}
              />
            </div>
            {/* Mehndi-Inspired Top Border */}
            <div className="relative h-10 bg-gradient-to-r from-amber-100 via-orange-100 to-rose-100 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 64" preserveAspectRatio="none">
                {/* Flowing mehndi pattern */}
                <path d="M0,32 Q150,10 300,32 T600,32 T900,32 T1200,32" stroke="#9333ea" strokeWidth="2" fill="none" opacity="0.6"/>
                <path d="M0,40 Q200,20 400,40 T800,40 T1200,40" stroke="#ec4899" strokeWidth="1.5" fill="none" opacity="0.5"/>
                {/* Paisley motifs */}
                <path d="M100,32 Q110,20 120,32 Q110,44 100,32" fill="#f59e0b" opacity="0.4"/>
                <path d="M300,32 Q310,20 320,32 Q310,44 300,32" fill="#ec4899" opacity="0.4"/>
                <path d="M500,32 Q510,20 520,32 Q510,44 500,32" fill="#9333ea" opacity="0.4"/>
                <path d="M700,32 Q710,20 720,32 Q710,44 700,32" fill="#f59e0b" opacity="0.4"/>
                <path d="M900,32 Q910,20 920,32 Q910,44 900,32" fill="#ec4899" opacity="0.4"/>
                <path d="M1100,32 Q1110,20 1120,32 Q1110,44 1100,32" fill="#9333ea" opacity="0.4"/>
              </svg>
            </div>

            <div className="p-8 md:p-12 relative z-10">
              {/* Background Textured Patterns */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Decorative dots pattern */}
                <div className="absolute top-10 left-10 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-400">
                    <circle cx="10" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="30" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="50" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="70" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="90" cy="10" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="30" r="1.5" fill="currentColor"/>
                    <circle cx="30" cy="30" r="1.5" fill="currentColor"/>
                    <circle cx="50" cy="30" r="1.5" fill="currentColor"/>
                    <circle cx="70" cy="30" r="1.5" fill="currentColor"/>
                    <circle cx="90" cy="30" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="50" r="1.5" fill="currentColor"/>
                    <circle cx="30" cy="50" r="1.5" fill="currentColor"/>
                    <circle cx="50" cy="50" r="1.5" fill="currentColor"/>
                    <circle cx="70" cy="50" r="1.5" fill="currentColor"/>
                    <circle cx="90" cy="50" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="70" r="1.5" fill="currentColor"/>
                    <circle cx="30" cy="70" r="1.5" fill="currentColor"/>
                    <circle cx="50" cy="70" r="1.5" fill="currentColor"/>
                    <circle cx="70" cy="70" r="1.5" fill="currentColor"/>
                    <circle cx="90" cy="70" r="1.5" fill="currentColor"/>
                    <circle cx="10" cy="90" r="1.5" fill="currentColor"/>
                    <circle cx="30" cy="90" r="1.5" fill="currentColor"/>
                    <circle cx="50" cy="90" r="1.5" fill="currentColor"/>
                    <circle cx="70" cy="90" r="1.5" fill="currentColor"/>
                    <circle cx="90" cy="90" r="1.5" fill="currentColor"/>
                  </svg>
                  </div>
                <div className="absolute bottom-20 left-20 w-28 h-28 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-amber-400">
                    <path d="M50,30 Q65,40 80,50 Q65,60 50,70 Q35,60 20,50 Q35,40 50,30" fill="currentColor"/>
                  </svg>
                </div>
                <div className="absolute bottom-10 right-10 w-32 h-32 opacity-10">
                  <svg viewBox="0 0 100 100" className="w-full h-full text-purple-300">
                    <circle cx="10" cy="10" r="2" fill="currentColor"/>
                    <circle cx="30" cy="10" r="2" fill="currentColor"/>
                    <circle cx="50" cy="10" r="2" fill="currentColor"/>
                    <circle cx="70" cy="10" r="2" fill="currentColor"/>
                    <circle cx="90" cy="10" r="2" fill="currentColor"/>
                    <circle cx="10" cy="30" r="2" fill="currentColor"/>
                    <circle cx="30" cy="30" r="2" fill="currentColor"/>
                    <circle cx="50" cy="30" r="2" fill="currentColor"/>
                    <circle cx="70" cy="30" r="2" fill="currentColor"/>
                    <circle cx="90" cy="30" r="2" fill="currentColor"/>
                    <circle cx="10" cy="50" r="2" fill="currentColor"/>
                    <circle cx="30" cy="50" r="2" fill="currentColor"/>
                    <circle cx="50" cy="50" r="2" fill="currentColor"/>
                    <circle cx="70" cy="50" r="2" fill="currentColor"/>
                    <circle cx="90" cy="50" r="2" fill="currentColor"/>
                    <circle cx="10" cy="70" r="2" fill="currentColor"/>
                    <circle cx="30" cy="70" r="2" fill="currentColor"/>
                    <circle cx="50" cy="70" r="2" fill="currentColor"/>
                    <circle cx="70" cy="70" r="2" fill="currentColor"/>
                    <circle cx="90" cy="70" r="2" fill="currentColor"/>
                    <circle cx="10" cy="90" r="2" fill="currentColor"/>
                    <circle cx="30" cy="90" r="2" fill="currentColor"/>
                    <circle cx="50" cy="90" r="2" fill="currentColor"/>
                    <circle cx="70" cy="90" r="2" fill="currentColor"/>
                    <circle cx="90" cy="90" r="2" fill="currentColor"/>
                  </svg>
                </div>
              </div>

              {/* Elegant Header */}
              <div className="text-center mb-4 relative z-10">
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-amber-600 via-orange-600 to-rose-600 bg-clip-text text-transparent mb-1 font-serif">
                  Artistry in Every Detail
          </h2>
                <p className="text-sm md:text-base text-gray-600 italic font-serif">
                  Like intricate mehndi patterns, each creation tells a story of tradition and beauty
          </p>
        </div>

              {/* Customer Reviews/Testimonies Label */}
              {testimonialImages.length > 0 && (
                <div className="text-center mb-4 relative z-10">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 via-pink-50 to-amber-50 rounded-full border border-purple-200/50 shadow-sm">
                    <svg className="w-4 h-4 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <p className="text-xs md:text-sm text-purple-700 font-medium italic font-serif">
                      Voices of joy, whispers of satisfaction
                    </p>
                    <span className="text-purple-400 text-xs">•</span>
                    <p className="text-xs md:text-sm text-purple-700 font-medium italic font-serif">
                      Customer Testimonies
                    </p>
                  </div>
                </div>
              )}

              {/* Rotating Customer Reviews Carousel with Decorative Elements */}
              {testimonialImages.length > 0 && (
                <div className="mb-6 flex justify-center relative z-10">
                  {/* Decorative elements around carousel */}
                  <div className="absolute -left-12 top-1/2 transform -translate-y-1/2 opacity-20">
                    <svg className="w-20 h-20 text-purple-400" viewBox="0 0 50 50" fill="none">
                      <path d="M25,10 Q30,20 35,25 Q30,30 25,35 Q20,30 15,25 Q20,20 25,10" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute -right-12 top-1/2 transform -translate-y-1/2 opacity-20">
                    <svg className="w-20 h-20 text-pink-400" viewBox="0 0 50 50" fill="none">
                      <path d="M25,15 Q35,20 40,25 Q35,30 25,35 Q15,30 10,25 Q15,20 25,15" fill="currentColor"/>
                    </svg>
                  </div>
                  <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-6 opacity-15">
                    <svg className="w-16 h-16 text-amber-400" viewBox="0 0 50 50" fill="none">
                      <circle cx="25" cy="25" r="8" fill="currentColor"/>
                      <circle cx="25" cy="25" r="15" fill="none" stroke="currentColor" strokeWidth="1"/>
                    </svg>
                  </div>
                  <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 translate-y-6 opacity-15">
                    <svg className="w-16 h-16 text-rose-400" viewBox="0 0 50 50" fill="none">
                      <path d="M25,20 Q30,25 35,30 Q30,35 25,40 Q20,35 15,30 Q20,25 25,20" fill="currentColor"/>
                    </svg>
                  </div>
                  
                  <div className="relative w-full max-w-[380px] md:max-w-[420px] mx-auto">
                    {/* Previous Button */}
                    <button
                      onClick={goToPrevious}
                      className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 md:-translate-x-8 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-purple-200"
                      aria-label="Previous review"
                    >
                      <ChevronLeft className="w-6 h-6 text-purple-600" />
                    </button>

                    {/* Next Button */}
                    <button
                      onClick={goToNext}
                      className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 md:translate-x-8 z-20 bg-white/90 hover:bg-white rounded-full p-2 shadow-lg hover:shadow-xl transition-all hover:scale-110 border-2 border-purple-200"
                      aria-label="Next review"
                    >
                      <ChevronRight className="w-6 h-6 text-purple-600" />
                    </button>

                    <div className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-xl border-2 border-white/50 bg-gradient-to-br from-purple-50 via-pink-50 to-amber-50">
                      <Image
                        key={currentReviewIndex}
                        src={testimonialImages[currentReviewIndex]}
                        alt={`Customer Review ${currentReviewIndex + 1}`}
                        fill
                        sizes="(max-width: 768px) 85vw, 420px"
                        className={`object-cover transition-all duration-300 ease-in-out ${
                          isTransitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
                        }`}
                        priority={currentReviewIndex === 0}
                      />
                      
                      {/* Slider/Dots Indicator - Overlay at bottom */}
                      <div className="absolute bottom-3 left-1/2 transform -translate-x-1/2 z-10 flex justify-center items-center gap-1.5 px-3 py-1.5 bg-black/40 backdrop-blur-md rounded-full">
                        {testimonialImages.map((_, index) => (
                          <button
                            key={index}
                            onClick={() => goToImage(index)}
                            className={`transition-all duration-300 rounded-full ${
                              index === currentReviewIndex
                                ? 'w-2.5 h-2.5 bg-white scale-125 shadow-md'
                                : 'w-2 h-2 bg-white/50 hover:bg-white/80 hover:scale-110'
                            }`}
                            aria-label={`Go to review ${index + 1}`}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Feature Cards with Mehndi Accents */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                {/* Decorative elements between cards */}
                <div className="hidden md:block absolute top-1/2 left-1/3 transform -translate-x-1/2 -translate-y-1/2 opacity-10">
                  <svg className="w-8 h-8 text-purple-400" viewBox="0 0 50 50" fill="none">
                    <circle cx="25" cy="25" r="3" fill="currentColor"/>
                    <circle cx="25" cy="25" r="8" fill="none" stroke="currentColor" strokeWidth="1"/>
                  </svg>
                </div>
                <div className="hidden md:block absolute top-1/2 right-1/3 transform translate-x-1/2 -translate-y-1/2 opacity-10">
                  <svg className="w-8 h-8 text-pink-400" viewBox="0 0 50 50" fill="none">
                    <path d="M25,20 Q30,25 35,30 Q30,35 25,40 Q20,35 15,30 Q20,25 25,20" fill="currentColor"/>
                  </svg>
                </div>
                {/* Feature 1 */}
                <div className="relative group">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-lg p-3 border-2 border-amber-200 hover:border-rose-300 transition-all transform hover:scale-105">
                    {/* Mehndi accent */}
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg className="w-6 h-6 text-purple-600" viewBox="0 0 50 50" fill="none">
                        <path d="M25,10 Q30,20 35,25 Q30,30 25,35 Q20,30 15,25 Q20,20 25,10" fill="currentColor"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-0.5 relative z-10">Handcrafted</h3>
                    <p className="text-gray-600 text-xs relative z-10">Meticulously created by skilled artisans</p>
                  </div>
                </div>

                {/* Feature 2 */}
                <div className="relative group">
                  <div className="bg-gradient-to-br from-rose-50 to-pink-50 rounded-lg p-3 border-2 border-rose-200 hover:border-purple-300 transition-all transform hover:scale-105">
                    {/* Mehndi accent */}
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg className="w-6 h-6 text-rose-600" viewBox="0 0 50 50" fill="none">
                        <path d="M25,15 Q35,20 40,25 Q35,30 25,35 Q15,30 10,25 Q15,20 25,15" fill="currentColor"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-0.5 relative z-10">Elegant Design</h3>
                    <p className="text-gray-600 text-xs relative z-10">Beautiful patterns that celebrate tradition</p>
                  </div>
                </div>

                {/* Feature 3 */}
                <div className="relative group">
                  <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border-2 border-purple-200 hover:border-amber-300 transition-all transform hover:scale-105">
                    {/* Mehndi accent */}
                    <div className="absolute top-2 right-2 opacity-20 group-hover:opacity-40 transition-opacity">
                      <svg className="w-6 h-6 text-purple-600" viewBox="0 0 50 50" fill="none">
                        <path d="M25,10 Q30,15 35,20 Q30,25 25,30 Q20,25 15,20 Q20,15 25,10" fill="currentColor"/>
                      </svg>
                    </div>
                    <h3 className="text-base font-bold text-gray-800 mb-0.5 relative z-10">Timeless Beauty</h3>
                    <p className="text-gray-600 text-xs relative z-10">Celebrating every special moment</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Mehndi-Inspired Bottom Border */}
            <div className="relative h-10 bg-gradient-to-r from-rose-100 via-pink-100 to-purple-100 overflow-hidden">
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 1200 64" preserveAspectRatio="none">
                {/* Flowing mehndi pattern */}
                <path d="M0,32 Q150,54 300,32 T600,32 T900,32 T1200,32" stroke="#9333ea" strokeWidth="2" fill="none" opacity="0.6"/>
                <path d="M0,24 Q200,44 400,24 T800,24 T1200,24" stroke="#ec4899" strokeWidth="1.5" fill="none" opacity="0.5"/>
                {/* Paisley motifs */}
                <path d="M100,32 Q110,44 120,32 Q110,20 100,32" fill="#f59e0b" opacity="0.4"/>
                <path d="M300,32 Q310,44 320,32 Q310,20 300,32" fill="#ec4899" opacity="0.4"/>
                <path d="M500,32 Q510,44 520,32 Q510,20 500,32" fill="#9333ea" opacity="0.4"/>
                <path d="M700,32 Q710,44 720,32 Q710,20 700,32" fill="#f59e0b" opacity="0.4"/>
                <path d="M900,32 Q910,44 920,32 Q910,20 900,32" fill="#ec4899" opacity="0.4"/>
                <path d="M1100,32 Q1110,44 1120,32 Q1110,20 1100,32" fill="#9333ea" opacity="0.4"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Floating Mehndi Pattern Elements */}
        <div className="absolute top-10 left-5 w-24 h-24 opacity-10">
          <svg viewBox="0 0 100 100" className="w-full h-full text-amber-600">
            <path d="M50,20 Q60,30 70,40 Q60,50 50,60 Q40,50 30,40 Q40,30 50,20" fill="currentColor"/>
            <circle cx="50" cy="40" r="3" fill="currentColor"/>
          </svg>
        </div>
      </section>

      {/* About Section with Decorative Border */}
      <section className="relative py-16 px-4 overflow-hidden">
        {/* Semi-transparent overlay */}
        <div className="absolute inset-0 bg-black/15 backdrop-blur-sm"></div>
        
        {/* Beautiful Floral Background for About Section */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top Left Floral Cluster */}
          <div className="absolute -top-28 -left-28 w-88 h-88 opacity-60">
            <svg viewBox="0 0 350 350" className="w-full h-full text-purple-500">
              <g transform="translate(175, 175)">
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(0)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(30)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(60)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(90)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(120)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(150)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(180)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(210)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(240)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(270)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(300)"/>
                <ellipse cx="0" cy="-36" rx="10" ry="23" fill="currentColor" opacity="0.6" transform="rotate(330)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(15)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(45)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(75)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(105)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(135)"/>
                <ellipse cx="0" cy="-23" rx="7" ry="17" fill="currentColor" opacity="0.7" transform="rotate(165)"/>
                <circle cx="0" cy="0" r="12" fill="currentColor" opacity="0.8"/>
                <circle cx="0" cy="0" r="6" fill="currentColor" opacity="0.9"/>
              </g>
            </svg>
          </div>
          
          {/* Bottom Right Floral Cluster */}
          <div className="absolute -bottom-28 -right-28 w-88 h-88 opacity-60">
            <svg viewBox="0 0 350 350" className="w-full h-full text-pink-500">
              <g transform="translate(175, 175)">
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(0)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(30)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(60)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(90)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(120)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(150)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(180)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(210)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(240)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(270)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(300)"/>
                <ellipse cx="0" cy="-38" rx="11" ry="24" fill="currentColor" opacity="0.65" transform="rotate(330)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(15)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(45)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(75)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(105)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(135)"/>
                <ellipse cx="0" cy="-24" rx="8" ry="18" fill="currentColor" opacity="0.75" transform="rotate(165)"/>
                <circle cx="0" cy="0" r="14" fill="currentColor" opacity="0.85"/>
                <circle cx="0" cy="0" r="7" fill="currentColor" opacity="0.95"/>
              </g>
            </svg>
          </div>
          
          {/* Center Watercolor Splashes */}
          <div className="absolute top-1/2 left-1/4 transform -translate-y-1/2 w-64 h-64 opacity-40">
            <div className="w-full h-full rounded-full bg-gradient-to-br from-purple-300/40 via-pink-300/35 to-purple-400/30 blur-3xl"></div>
          </div>
          <div className="absolute top-1/2 right-1/4 transform -translate-y-1/2 w-56 h-56 opacity-40">
            <div className="w-full h-full rounded-full bg-gradient-to-bl from-pink-300/40 via-rose-300/35 to-pink-400/30 blur-3xl"></div>
          </div>
        </div>
        
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 relative z-10">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl overflow-hidden">
            {/* Header Section with Gradient Background */}
            <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 px-8 py-6 text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full -ml-12 -mb-12"></div>
              <div className="relative z-10 flex items-center gap-6">
                {/* Circular Image */}
                <div className="flex-shrink-0">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-full overflow-hidden border-4 border-white/30 shadow-xl">
                    <Image
                      src="/sh.jpeg"
                      alt="magi.cofresin"
                      width={128}
                      height={128}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                
                {/* Text Content */}
                <div className="flex-1">
                  <p className="uppercase text-xs tracking-[0.3em] mb-2 text-purple-200">ABOUT</p>
                  <h2 className="text-3xl font-bold">
                    magic of resinn
                  </h2>
                  <p className="text-white/90 mt-2">
                    Handcrafted with love, designed for celebrations
                  </p>
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="p-8 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-purple-600 mb-2">
                    BRAND STORY
                  </h3>
                  <p className="text-gray-700">
                    We create beautiful, handcrafted products that bring joy to every celebration and make your home more beautiful.
                  </p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-200 hover:border-purple-400 transition-all">
                  <h3 className="text-sm font-bold uppercase tracking-wide text-purple-600 mb-2">
                    CRAFTSMANSHIP
                  </h3>
                  <p className="text-gray-700">
                    Each product is carefully crafted with attention to detail, using traditional techniques and modern designs.
                  </p>
                </div>
              </div>

              {/* Contact Information Section */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border-2 border-dashed border-purple-200">
                <h3 className="text-sm font-bold uppercase tracking-wide text-purple-600 mb-4">
                  CONTACT US
                </h3>
                
                {/* Location */}
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-gray-800 font-serif">Muzaffarpur, Bihar</span>
                </div>

                {/* Social Media Links */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-green-600" />
                      <span className="text-gray-700 font-serif">WhatsApp</span>
                    </div>
                    <a 
                      href={`https://wa.me/7209732310`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-serif transition-colors"
                    >
                      7209732310
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Youtube className="w-5 h-5 text-red-600" />
                      <span className="text-gray-700 font-serif">YouTube</span>
                    </div>
                    <a 
                      href={`https://www.youtube.com/@Resinart_by_shrutii`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-serif transition-colors"
                    >
                      @Resinart_by_shrutii
                    </a>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Instagram className="w-5 h-5 text-pink-600" />
                      <span className="text-gray-700 font-serif">Instagram</span>
                    </div>
                    <a 
                      href={`https://www.instagram.com/magicofresinn?igsh=Z2JnNTlydG1ncWlh&utm_source=qr`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:text-purple-800 font-serif transition-colors"
                    >
                      @magicofresinn
                    </a>
                  </div>
                </div>
              </div>

              {/* Decorative Flowers at Bottom */}
              <div className="mt-6 flex justify-center">
                <div className="relative">
                  <svg className="w-32 h-16 text-purple-300" viewBox="0 0 200 100" fill="currentColor">
                    {/* Lavender flowers */}
                    <path d="M50,80 Q45,60 50,50 Q55,40 50,30 Q45,20 50,10 Q55,20 60,30 Q65,40 60,50 Q55,60 60,80" fill="currentColor" opacity="0.6"/>
                    <circle cx="50" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                    <circle cx="60" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                    
                    <path d="M100,80 Q95,60 100,50 Q105,40 100,30 Q95,20 100,10 Q105,20 110,30 Q115,40 110,50 Q105,60 110,80" fill="currentColor" opacity="0.6"/>
                    <circle cx="100" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                    <circle cx="110" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                    
                    <path d="M150,80 Q145,60 150,50 Q155,40 150,30 Q145,20 150,10 Q155,20 160,30 Q165,40 160,50 Q155,60 160,80" fill="currentColor" opacity="0.6"/>
                    <circle cx="150" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                    <circle cx="160" cy="30" r="8" fill="currentColor" opacity="0.8"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 py-4 text-center border-t border-gray-200">
        <p className="text-sm text-gray-600">
          Website made by <a href="mailto:vishalcr7m10@gmail.com" className="text-purple-600 hover:text-purple-800 font-medium transition-colors">Vishal Yadav</a> (vishalcr7m10@gmail.com)
        </p>
      </footer>
    </div>
  );
}

export default function HomeClient({ initialProducts }: HomeClientProps) {
  return <HomeClientContent initialProducts={initialProducts} />;
}
