import React, { useState, useEffect } from 'react';
import { Search, Filter, MapPin, Clock, DollarSign, ChevronDown, ChevronUp, Coffee, Book, Dog, Car, Utensils, Printer, GraduationCap, Dumbbell, ArrowRight, CheckCircle, Users, Shield, HelpCircle, Star, ChevronLeft, ChevronRight, MessageSquare, Zap, Award, Trophy, Package } from 'lucide-react';
import { taskTemplateService } from '../lib/database';
import { Location } from '../lib/locationService';
import toast from 'react-hot-toast';
import FoodLocationModal from './FoodLocationModal';

interface TaskTemplatesProps {
  onSelectTemplate: (template: any) => void;
  onSelectLocation?: (location: Location) => void;
  onSelectTemplateWithLocation?: (template: any, location: any) => void;
}

const BUILT_IN_TEMPLATES = [
  {
    id: 'coffee-run',
    title: 'Coffee Runs',
    description: 'Get coffee from campus locations',
    icon: <Coffee className="w-6 h-6 text-[#FA4616]" />,
    category: 'coffee_run',
    estimated_time: '15-20 minutes',
    price: 8.00,
    image: "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?cs=srgb&dl=pexels-chevanon-324028.jpg&fm=jpg",
    locations: [
      {
        name: "Starbucks - Marston Science Library",
        address: "444 Newell Dr, Gainesville, FL 32611",
        coords: { lat: 29.6481, lng: -82.3439 },
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png"
      },
      {
        name: "Starbucks - The Hub",
        address: "3025 SW 23rd St, Gainesville, FL 32608",
        coords: { lat: 29.6483, lng: -82.3459 },
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png"
      },
      {
        name: "Einstein Bros Bagels - Shands Hospital",
        address: "1600 SW Archer Rd, Gainesville, FL 32610",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtQeTm1yJI_fgdRj1WXyxf7C7tp8N3_xLVqw&s"
      }
    ]
  },
  {
    id: 'food-pickup',
    title: 'Food Pickup',
    description: 'Pick up meals from dining halls and restaurants',
    icon: <Utensils className="w-6 h-6 text-[#FA4616]" />,
    category: 'delivery',
    estimated_time: '15-20 minutes',
    price: 8.00,
    image: "https://images.pexels.com/photos/1640772/pexels-photo-1640772.jpeg?cs=srgb&dl=pexels-ella-olsson-572949-1640772.jpg&fm=jpg",
    locations: [
      {
        name: "Chick-fil-A - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://brandlogos.net/wp-content/uploads/2022/02/chick-fil-a-logo-brandlogos.net_.png"
      },
      {
        name: "Panda Express - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://brandlogos.net/wp-content/uploads/2022/03/panda_express-logo-brandlogos.net_.png"
      },
      {
        name: "Subway - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://download.logo.wine/logo/Subway_(restaurant)/Subway_(restaurant)-Logo.wine.png"
      },
      {
        name: "The Halal Shack - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://cdn.prod.website-files.com/5efa207a59d29b5583d9972a/64f8b9e75bd0575518fecb1b_open-graph-the-halal-shack.png"
      },
      {
        name: "Baba's Pizza - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1513104890138-7c749659a591?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Mi Apa Reitz - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFkbl_5YqlGIOC4pPaecE4fL6zXVNn_7kvSg&s"
      },
      {
        name: "Cabo - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQyvo1m0zbjdoD-bmhyabHdq8anv9Z88g1o5Q&s"
      },
      {
        name: "Chick-fil-A - Shands Hospital",
        address: "Sun Terrace, Shands Hospital, UF Campus",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://brandlogos.net/wp-content/uploads/2022/02/chick-fil-a-logo-brandlogos.net_.png"
      },
      {
        name: "Panda Express - Shands Hospital",
        address: "Sun Terrace, Shands Hospital, UF Campus",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://brandlogos.net/wp-content/uploads/2022/03/panda_express-logo-brandlogos.net_.png"
      },
      {
        name: "Starbucks - Shands Hospital",
        address: "1600 SW Archer Rd, Gainesville, FL 32610",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png"
      },
      {
        name: "Gator Corner Dining Center",
        address: "Gale Lemerand Dr, Gainesville, FL 32603",
        coords: { lat: 29.6490, lng: -82.3512 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Broward Dining Hall",
        address: "Broward Hall, Gainesville, FL 32612",
        coords: { lat: 29.6465, lng: -82.3419 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Fresh Food Company",
        address: "Broward Hall, Gainesville, FL 32612",
        coords: { lat: 29.6465, lng: -82.3419 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Pollo Tropical - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Steak 'n Shake - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Wendy's - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      }
    ]
  },
  {
    id: 'print-study-pickup',
    title: 'Print & Study Pickup',
    description: 'Print homework, practice tests, or grab textbooks from campus',
    icon: <Printer className="w-6 h-6 text-[#FA4616]" />,
    category: 'academic_help',
    estimated_time: '15-30 minutes',
    price: 6.00,
    image: "https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&dpr=1&w=500",
    locations: [
      {
        name: "UF Bookstore (Reitz Union)",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Library West (1545 W University Ave)",
        address: "1545 W University Ave, Gainesville, FL 32603",
        coords: { lat: 29.6515, lng: -82.3429 },
        logo: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Marston Science Library",
        address: "444 Newell Dr, Gainesville, FL 32611",
        coords: { lat: 29.6481, lng: -82.3439 },
        logo: "https://ufl.pb.unizin.org/app/uploads/sites/128/2022/07/msl-basement-scaled.jpg"
      }
    ]
  },
  {
    id: 'workout-partner',
    title: 'Workout Partner',
    description: 'Find a gym or sports buddy for your next workout or pickup game',
    icon: <Dumbbell className="w-6 h-6 text-[#FA4616]" />,
    category: 'other',
    estimated_time: '30-60 minutes',
    price: 0.00,
    is_free: true,
    image: "https://www.gainesvillesportscommission.com/wp-content/uploads/2019/02/southwest-recreation-center.jpg",
    locations: [
      {
        name: "Student Rec Center",
        address: "1864 Stadium Rd, Gainesville, FL 32611",
        coords: { lat: 29.6502, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Southwest Rec",
        address: "3150 Hull Rd, Gainesville, FL 32611",
        coords: { lat: 29.6384, lng: -82.3687 },
        logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Broward Courts",
        address: "Broward Hall, Gainesville, FL 32612",
        coords: { lat: 29.6465, lng: -82.3419 },
        logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Flavet Field",
        address: "1864 Stadium Rd, Gainesville, FL 32611",
        coords: { lat: 29.6520, lng: -82.3380 },
        logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'campus-rides',
    title: 'Campus Quick Rides',
    description: 'Get a ride around campus or to nearby locations',
    icon: <Car className="w-6 h-6 text-[#FA4616]" />,
    category: 'transportation',
    estimated_time: '10-20 minutes',
    price: 8.00,
    image: "https://images.pexels.com/photos/13861/IMG_3496bfree.jpg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
    locations: [
      {
        name: "Reitz Union",
        address: "J. Wayne Reitz Union, UF Campus",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Sorority Row",
        address: "Sorority Row, UF Campus",
        coords: { lat: 29.6449, lng: -82.3399 },
        logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'dog-walking',
    title: 'Dog Walking',
    description: 'Walk dogs around campus areas',
    icon: <Dog className="w-6 h-6 text-[#FA4616]" />,
    category: 'pet_care',
    estimated_time: '30-45 minutes',
    price: 10.00,
    image: "https://images.pexels.com/photos/1254140/pexels-photo-1254140.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=750&w=1260",
    locations: [
      {
        name: "Lake Alice",
        address: "Lake Alice, UF Campus",
        coords: { lat: 29.6428, lng: -82.3609 },
        logo: "https://images.unsplash.com/photo-1439066615861-d1af74d74000?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Plaza of the Americas",
        address: "Plaza of the Americas, UF Campus",
        coords: { lat: 29.6494, lng: -82.3438 },
        logo: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&w=100&q=80"
      }
    ]
  }
];

const TaskTemplates: React.FC<TaskTemplatesProps> = ({ 
  onSelectTemplate, 
  onSelectLocation,
  onSelectTemplateWithLocation
}) => {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [expandedLocations, setExpandedLocations] = useState<Record<string, boolean>>({});
  const [currentTestimonialIndex, setCurrentTestimonialIndex] = useState(0);
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [selectedTemplateForLocations, setSelectedTemplateForLocations] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Hero section content with matching images
  const heroContent = [
    {
      title: "Need help studying?",
      subtitle: "Find study partners or get materials delivered",
      image: "https://images.pexels.com/photos/5428003/pexels-photo-5428003.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      tag: "Study Buddy",
      tagIcon: <Book className="w-5 h-5 text-[#0038FF]" />,
      tagTime: "60 min",
      tagPrice: "FREE"
    },
    {
      title: "Running late for class?",
      subtitle: "Get coffee delivered right to you",
      image: "https://images.pexels.com/photos/324028/pexels-photo-324028.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      tag: "Coffee Run",
      tagIcon: <Coffee className="w-5 h-5 text-[#0038FF]" />,
      tagTime: "15 min",
      tagPrice: "$8"
    },
    {
      title: "Out of time for errands?",
      subtitle: "Get help with campus tasks and deliveries",
      image: "https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      tag: "Campus Errands",
      tagIcon: <Utensils className="w-5 h-5 text-[#0038FF]" />,
      tagTime: "20 min",
      tagPrice: "$10"
    },
    {
      title: "Forgot to print again?",
      subtitle: "Get your documents delivered to you",
      image: "https://images.pexels.com/photos/1925536/pexels-photo-1925536.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      tag: "Print Delivery",
      tagIcon: <Printer className="w-5 h-5 text-[#0038FF]" />,
      tagTime: "15 min",
      tagPrice: "$5"
    },
    {
      title: "Grab tasks between classes",
      subtitle: "Earn money helping fellow students",
      image: "https://images.pexels.com/photos/3184338/pexels-photo-3184338.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      tag: "Quick Tasks",
      tagIcon: <DollarSign className="w-5 h-5 text-[#0038FF]" />,
      tagTime: "30 min",
      tagPrice: "$15"
    }
  ];

  useEffect(() => {
    loadTemplates();
    
    // Set up hero rotation interval
    const heroInterval = setInterval(() => {
      setCurrentHeroIndex(prevIndex => (prevIndex + 1) % heroContent.length);
    }, 5000);
    
    // Set up testimonial rotation interval
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonialIndex(prevIndex => (prevIndex + 1) % testimonials.length);
    }, 4000);
    
    return () => {
      clearInterval(heroInterval);
      clearInterval(testimonialInterval);
    };
  }, []);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      
      // Try to load templates from the database
      let templatesData = [];
      try {
        templatesData = await taskTemplateService.getTemplates();
      } catch (error) {
        console.warn('Error loading templates from database, using built-in templates:', error);
      }
      
      // If no templates from database, use built-in templates
      if (!templatesData || templatesData.length === 0) {
        templatesData = BUILT_IN_TEMPLATES;
      }
      
      setTemplates(templatesData);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Error loading task templates');
      
      // Fallback to built-in templates
      setTemplates(BUILT_IN_TEMPLATES);
    } finally {
      setLoading(false);
    }
  };

  const toggleLocationExpand = (templateId: string) => {
    setExpandedLocations(prev => ({
      ...prev,
      [templateId]: !prev[templateId]
    }));
  };

  const handleSelectTemplate = (template: any) => {
    onSelectTemplate(template);
  };

  const handleSelectLocation = (template: any, location: any) => {
    if (onSelectTemplateWithLocation) {
      onSelectTemplateWithLocation(template, location);
    } else {
      // Fallback if the combined function is not provided
      onSelectTemplate(template);
      if (onSelectLocation) {
        onSelectLocation({
          lat: location.coords.lat,
          lng: location.coords.lng,
          address: location.address
        });
      }
    }
  };

  const handleViewAllLocations = (template: any) => {
    setSelectedTemplateForLocations(template);
    setShowLocationModal(true);
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === 'all' || 
      template.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'delivery', name: 'Delivery' },
    { id: 'coffee_run', name: 'Coffee Run' },
    { id: 'academic_help', name: 'Academic Help' },
    { id: 'pet_care', name: 'Pet Care' },
    { id: 'transportation', name: 'Transportation' },
    { id: 'other', name: 'Other' }
  ];

  const testimonials = [
    {
      id: 1,
      name: "Aryan S.",
      major: "Economics",
      year: "Junior",
      rating: 5,
      service: "Coffee Run",
      quote: "Hustl saved me during finals week when I needed a quick coffee run while I was cramming in the library. The app is super easy to use and everyone is so helpful."
    },
    {
      id: 2,
      name: "Jessica L.",
      major: "Biology",
      year: "Sophomore",
      rating: 5,
      service: "Print & Study Pickup",
      quote: "I forgot to print my lab report and had 10 minutes before class. Someone delivered it right to my classroom door! Absolute lifesaver."
    },
    {
      id: 3,
      name: "Michael T.",
      major: "Computer Science",
      year: "Senior",
      rating: 5,
      service: "Food Delivery",
      quote: "As a CS major, I practically live in the lab. Being able to get food delivered directly there has been a game-changer for my productivity."
    },
    {
      id: 4,
      name: "Sophia R.",
      major: "Psychology",
      year: "Freshman",
      rating: 5,
      service: "Campus Rides",
      quote: "Being new to campus, I wasn't familiar with all the buildings. Getting rides to my classes during the first week helped me so much!"
    },
    {
      id: 5,
      name: "David K.",
      major: "Engineering",
      year: "Junior",
      rating: 5,
      service: "Dog Walking",
      quote: "My lab sessions run long and my dog needs walks. Fellow students help me take care of my pup when I'm stuck in class. Worth every penny!"
    },
    {
      id: 6,
      name: "Emma W.",
      major: "Journalism",
      year: "Senior",
      rating: 5,
      service: "Workout Partner",
      quote: "Found an awesome gym buddy through Hustl! Having someone to work out with keeps me accountable and makes fitness way more fun."
    }
  ];

  const nextTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevTestimonial = () => {
    setCurrentTestimonialIndex((prevIndex) => 
      prevIndex === 0 ? testimonials.length - 1 : prevIndex - 1
    );
  };

  const currentTestimonial = testimonials[currentTestimonialIndex];
  const currentHero = heroContent[currentHeroIndex];

  return (
    <div>
      {/* Hero Section with Dynamic Content */}
      <div className="bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-xl overflow-hidden mb-6 sm:mb-10 shadow-xl">
        <div className="flex flex-col md:flex-row h-[300px] sm:h-[400px]">
          <div className="md:w-1/2 p-6 sm:p-8 md:p-12 flex flex-col justify-center relative z-10">
            {/* Animated decorative elements */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
              <div className="absolute top-10 left-10 w-20 h-20 rounded-full bg-white float-animation" style={{animationDelay: '0s'}}></div>
              <div className="absolute bottom-20 right-10 w-16 h-16 rounded-full bg-white float-animation" style={{animationDelay: '0.5s'}}></div>
              <div className="absolute top-1/2 left-1/4 w-12 h-12 rounded-full bg-white float-animation" style={{animationDelay: '1s'}}></div>
            </div>
            
            <div className="relative">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-4 leading-tight">{currentHero.title}</h2>
              <p className="text-lg sm:text-xl mb-3 sm:mb-6">{currentHero.subtitle}</p>
              <p className="text-blue-100 mb-4 sm:mb-8 max-w-md">Campus errands, covered. Coffee runs, printing, pet care — Hustl connects Gators in minutes.</p>
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('create-task'))}
                  className="secondary-button flex items-center justify-center group"
                >
                  Post a Task 
                  <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
                </button>
                <button 
                  onClick={() => window.dispatchEvent(new CustomEvent('view-tasks'))}
                  className="bg-white text-[#002B7F] px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-semibold hover:bg-gray-100 transition duration-200 shadow-md"
                >
                  Browse Tasks
                </button>
              </div>
            </div>
          </div>
          <div className="md:w-1/2 relative h-full">
            <div className="absolute inset-0 flex items-center justify-center overflow-hidden">
              <img 
                src={currentHero.image}
                alt={currentHero.title} 
                className="w-full h-full object-cover transition-opacity duration-500"
                style={{ objectPosition: "center" }}
              />
            </div>
            <div className="absolute inset-0 bg-gradient-to-r from-[#002B7F]/30 to-transparent pointer-events-none"></div>
            <div className="absolute bottom-6 right-6">
              <div className="glass-card p-3 shadow-lg">
                <div className="flex items-center">
                  {currentHero.tagIcon}
                  <div className="ml-2">
                    <p className="font-bold text-white">{currentHero.tag}</p>
                    <p className="text-sm text-white/90">{currentHero.tagTime} • {currentHero.tagPrice}</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Animated indicators */}
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
              {heroContent.map((_, index) => (
                <button 
                  key={index}
                  onClick={() => setCurrentHeroIndex(index)}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentHeroIndex 
                      ? 'bg-white w-6' 
                      : 'bg-white/50 hover:bg-white/80'
                  }`}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <h2 className="text-xl sm:text-2xl font-bold mb-2 flex items-center">
          <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-[#FF5A1F] mr-2" />
          Popular Tasks
        </h2>
        <p className="text-gray-600">
          Choose from our most popular task templates or create your own
        </p>
      </div>

      {/* Mobile Search and Filters */}
      <div className="md:hidden mb-4">
        <div className="flex space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
            />
            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="p-2 border border-gray-300 rounded-lg bg-white"
          >
            <Filter className="w-5 h-5 text-gray-600" />
          </button>
        </div>
        
        {showFilters && (
          <div className="mt-3 p-4 bg-white rounded-lg border border-gray-200 shadow-sm">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Desktop Search and Filters */}
      <div className="hidden md:flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 mb-6">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-gray-400" />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-[#0038FF] shadow-sm"
        >
          {categories.map(category => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0038FF]"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-md">
          <Filter className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900">No templates found</h3>
          <p className="mt-2 text-sm text-gray-500">
            Try adjusting your search or filters
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className="premium-card transform hover:scale-[1.02] transition-all duration-300"
            >
              {template.image && (
                <div className="h-32 sm:h-40 overflow-hidden relative">
                  <img
                    src={template.image}
                    alt={template.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                  <div className="absolute bottom-3 left-3">
                    <span className={`${template.price === 0 ? 'badge-premium' : 'badge-secondary'}`}>
                      {template.price === 0 ? 'FREE' : `$${template.price.toFixed(2)}`}
                    </span>
                  </div>
                </div>
              )}
              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg sm:text-xl font-bold">{template.title}</h3>
                  <div className="flex items-center">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-medium ml-1">4.9</span>
                  </div>
                </div>
                <p className="text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center space-x-4 mb-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1 text-[#0038FF]" />
                    <span>{template.estimated_time}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <MapPin className="w-4 h-4 mr-1 text-[#0038FF]" />
                    <span>{template.locations?.length || 0} locations</span>
                  </div>
                </div>

                {template.locations && template.locations.length > 0 && (
                  <div className="mb-4">
                    <button
                      onClick={() => toggleLocationExpand(template.id)}
                      className="flex items-center justify-between w-full text-sm text-[#0038FF] hover:text-[#0021A5] transition-colors font-medium"
                    >
                      <span>Popular Locations</span>
                      {expandedLocations[template.id] ? (
                        <ChevronUp className="w-4 h-4" />
                      ) : (
                        <ChevronDown className="w-4 h-4" />
                      )}
                    </button>

                    {expandedLocations[template.id] && (
                      <div className="mt-2 space-y-2">
                        {template.locations.slice(0, 3).map((location, index) => (
                          <div
                            key={index}
                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer border border-gray-100"
                            onClick={() => handleSelectLocation(template, location)}
                          >
                            <div className="flex items-center">
                              {location.logo ? (
                                <img
                                  src={location.logo}
                                  alt={location.name}
                                  className="w-8 h-8 rounded-full object-cover mr-2 border border-gray-200"
                                />
                              ) : (
                                <MapPin className="w-5 h-5 text-gray-400 mr-2" />
                              )}
                              <div>
                                <p className="text-sm font-medium">{location.name}</p>
                                <p className="text-xs text-gray-500">{location.address.split(',')[0]}</p>
                              </div>
                            </div>
                            <MapPin className="w-4 h-4 text-[#0038FF]" />
                          </div>
                        ))}
                        {template.locations.length > 3 && (
                          <button
                            className="text-sm text-[#0038FF] hover:text-[#0021A5] transition-colors w-full text-center py-2 border-t border-gray-100 font-medium"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleViewAllLocations(template);
                            }}
                          >
                            View All {template.locations.length} Locations
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                <button
                  onClick={() => handleSelectTemplate(template)}
                  className="premium-button w-full flex items-center justify-center"
                >
                  <Zap className="w-5 h-5 mr-2" />
                  Select Task
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Need Something Else Section */}
      <div className="bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-xl p-6 sm:p-8 text-center my-8 sm:my-12 shadow-xl relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform -translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
        </div>
        
        <div className="relative z-10">
          <div className="inline-block mb-4 p-2 rounded-full bg-white/10 backdrop-blur-sm">
            <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5A1F]" />
          </div>
          <h2 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">Need Something Else?</h2>
          <p className="mb-6 max-w-md mx-auto">Create a custom task for anything you need help with on campus.</p>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('create-task'))}
            className="secondary-button inline-flex items-center group"
          >
            <Zap className="w-5 h-5 mr-2" />
            Create Custom Task
            <ArrowRight className="ml-2 w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>

      {/* How Hustl Works Section */}
      <div className="my-8 sm:my-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-4 flex items-center justify-center">
          <Award className="w-6 h-6 sm:w-8 sm:h-8 text-[#FF5A1F] mr-2" />
          How Hustl Works
        </h2>
        <p className="text-center text-gray-600 mb-8 sm:mb-12">Help is just a few clicks away!</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          {/* Card 1 */}
          <div className="premium-card p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF5A1F] to-[#E63A0B] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <Package className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Post Your Task</h3>
            <p className="text-gray-600">
              Describe what you need help with and set your budget
            </p>
          </div>

          {/* Card 2 */}
          <div className="premium-card p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Get Matched</h3>
            <p className="text-gray-600">
              Ready students will see your task and offer to help
            </p>
          </div>

          {/* Card 3 */}
          <div className="premium-card p-6 text-center">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#FF5A1F] to-[#E63A0B] rounded-full flex items-center justify-center text-white mx-auto mb-4 shadow-lg">
              <Star className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Task Complete</h3>
            <p className="text-gray-600">
              Chat with your helper, track progress, and rate your experience
            </p>
          </div>
        </div>
      </div>

      {/* Testimonials Section */}
      <div className="my-8 sm:my-16 grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
        <div>
          <h2 className="text-2xl sm:text-3xl font-bold mb-4 flex items-center">
            <Star className="w-6 h-6 sm:w-7 sm:h-7 text-[#FF5A1F] mr-2" />
            What Students Are Saying
          </h2>
          <p className="text-gray-600 mb-6">
            Join thousands of UF students already using Hustl to connect, help each other, and build a stronger campus community.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-500" />
              </div>
              <span className="ml-3 font-medium">Student ID verification required</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-blue-500" />
              </div>
              <span className="ml-3 font-medium">Real-time chat and tracking</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-500" />
              </div>
              <span className="ml-3 font-medium">Community ratings and reviews</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-yellow-500" />
              </div>
              <span className="ml-3 font-medium">24/7 support team</span>
            </div>
          </div>
        </div>
        
        <div className="bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-xl p-6 shadow-xl relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white opacity-5 rounded-full transform -translate-x-1/4 -translate-y-1/4"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-white opacity-5 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white text-xl font-bold mr-4 shadow-lg">
                {currentTestimonial.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold">{currentTestimonial.name}</h3>
                <p className="text-sm text-blue-100">{currentTestimonial.major} • {currentTestimonial.year}</p>
              </div>
            </div>
            
            <div className="flex mb-2">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-yellow-400" fill="#FBBF24" />
              ))}
            </div>
            
            <div className="inline-block px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-3">
              {currentTestimonial.service}
            </div>
            
            <div className="border-l-4 border-[#FF5A1F] pl-4 italic bg-white/5 p-3 rounded-r-lg">
              "{currentTestimonial.quote}"
            </div>
            
            <div className="flex justify-between items-center mt-6">
              <div className="flex space-x-1">
                {testimonials.map((_, index) => (
                  <button 
                    key={index}
                    onClick={() => setCurrentTestimonialIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      index === currentTestimonialIndex ? 'bg-white w-6' : 'bg-white/50 hover:bg-white/80'
                    }`}
                    aria-label={`Go to testimonial ${index + 1}`}
                  />
                ))}
              </div>
              
              <div className="flex space-x-2">
                <button 
                  onClick={prevTestimonial}
                  className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button 
                  onClick={nextTestimonial}
                  className="w-8 h-8 rounded-full bg-blue-800 flex items-center justify-center hover:bg-blue-700 transition-colors"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="my-8 sm:my-16">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-8 sm:mb-12 flex items-center justify-center">
          <Trophy className="w-6 h-6 sm:w-8 sm:h-8 text-[#0038FF] mr-2" />
          Why Choose Hustl
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
          <div className="premium-card p-6 text-center hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
              <Shield className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Safe & Secure</h3>
            <p className="text-gray-600">Verified UF students only with built-in safety features and secure payments.</p>
          </div>
          
          <div className="premium-card p-6 text-center hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
              <Users className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Campus Community</h3>
            <p className="text-gray-600">Connect with fellow Gators in a trusted, campus-focused environment.</p>
          </div>
          
          <div className="premium-card p-6 text-center hover:scale-105 transition-all duration-300">
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg text-white">
              <DollarSign className="w-6 h-6 sm:w-8 sm:h-8" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold mb-2">Flexible Earnings</h3>
            <p className="text-gray-600">Set your own schedule and earn money helping other students.</p>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl p-6 sm:p-8 text-center my-8 sm:my-12 shadow-md border border-blue-100">
        <div className="inline-block mb-4 p-2 rounded-full bg-blue-100">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-[#0038FF]" />
        </div>
        <h2 className="text-xl sm:text-2xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-gray-600 mb-6 max-w-xl mx-auto">Join thousands of UF students already using Hustl to connect and help each other.</p>
        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('create-task'))}
            className="secondary-button flex items-center justify-center"
          >
            <Zap className="w-5 h-5 mr-2" />
            Post a Task
          </button>
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('view-tasks'))}
            className="premium-button flex items-center justify-center"
          >
            <Search className="w-5 h-5 mr-2" />
            Browse Tasks
          </button>
        </div>
      </div>

      {/* Help Section */}
      <div className="border-t pt-8 sm:pt-12 mt-8 sm:mt-12">
        <div className="text-center mb-6 sm:mb-8">
          <div className="inline-block mb-4 p-2 rounded-full bg-blue-100">
            <HelpCircle className="w-6 h-6 sm:w-8 sm:h-8 text-[#0038FF]" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold mb-2">Need Help?</h3>
          <p className="text-gray-600">Our support team is available 24/7</p>
        </div>
        
        <div className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4">
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-faq'))}
            className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <HelpCircle className="w-5 h-5 mr-2 text-[#002B7F]" />
            <span>FAQs</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-support'))}
            className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <MessageSquare className="w-5 h-5 mr-2 text-[#002B7F]" />
            <span>Contact Support</span>
          </button>
          
          <button 
            onClick={() => window.dispatchEvent(new CustomEvent('open-safety'))}
            className="flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
          >
            <Shield className="w-5 h-5 mr-2 text-[#002B7F]" />
            <span>Safety Center</span>
          </button>
        </div>
      </div>

      {/* Food Location Modal */}
      {showLocationModal && selectedTemplateForLocations && (
        <FoodLocationModal
          locations={selectedTemplateForLocations.locations || []}
          onClose={() => setShowLocationModal(false)}
          onSelectLocation={(location) => {
            handleSelectLocation(selectedTemplateForLocations, location);
            setShowLocationModal(false);
          }}
          title={`${selectedTemplateForLocations.title} Locations`}
        />
      )}
    </div>
  );
};

export default TaskTemplates;