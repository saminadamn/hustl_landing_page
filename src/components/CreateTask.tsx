import React, { useState, useEffect } from 'react';
import { X, MapPin, Clock, DollarSign, User, MessageSquare, Shield, AlertTriangle, Calculator, Tag, Info, Zap, Package, Coffee, Book, Dog, Car, Utensils, Printer, GraduationCap, Dumbbell } from 'lucide-react';
import toast from 'react-hot-toast';
import { calculateTaskPrice, UrgencyLevel } from '../lib/priceCalculator';
import { Location, validateLocation } from '../lib/locationService';
import TaskMap from './TaskMap';
import LocationInput from './LocationInput';
import PriceBreakdown from './PriceBreakdown';
import TaskTemplates from './TaskTemplates';
import StripeCheckout from './StripeCheckout';
import TaskCreationSuccess from './TaskCreationSuccess';
import { taskService, notificationService } from '../lib/database';
import { walletService } from '../lib/walletService';
import { auth } from '../lib/firebase';
import { StarBorder } from './ui/star-border';

interface CreateTaskProps {
  onClose: () => void;
  userLocation?: Location | null;
  selectedTemplate?: any;
  prefilledLocation?: Location | null;
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  delivery: <Package className="w-5 h-5" />,
  academic_help: <Book className="w-5 h-5" />,
  pet_care: <Dog className="w-5 h-5" />,
  meal_exchange: <Utensils className="w-5 h-5" />,
  coffee_run: <Coffee className="w-5 h-5" />,
  other: <Package className="w-5 h-5" />,
  transportation: <Car className="w-5 h-5" />,
  print_pickup: <Printer className="w-5 h-5" />,
  study_group: <GraduationCap className="w-5 h-5" />
};

// Popular task categories for quick selection
const POPULAR_CATEGORIES = [
  {
    id: 'coffee-run',
    title: 'Coffee Run',
    description: 'Get coffee delivered from campus locations',
    icon: <Coffee className="w-10 h-10 text-[#FF4D23]" />,
    category: 'coffee_run',
    estimatedTime: '15-20 minutes',
    price: 8.00,
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
      },
      {
        name: "Dunkin' - Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://logos-world.net/wp-content/uploads/2020/09/Dunkin-Logo.png"
      },
      {
        name: "Pascal's Coffeehouse",
        address: "112 NW 16th St, Gainesville, FL 32603",
        coords: { lat: 29.6529, lng: -82.3381 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQXqHDu9GvbdMJDMEV5tDIwMffLvUb8MmFZlw&s"
      },
      {
        name: "Starbucks - Library West",
        address: "1545 W University Ave, Gainesville, FL 32603",
        coords: { lat: 29.6515, lng: -82.3429 },
        logo: "https://upload.wikimedia.org/wikipedia/en/thumb/d/d3/Starbucks_Corporation_Logo_2011.svg/200px-Starbucks_Corporation_Logo_2011.svg.png"
      }
    ]
  },
  {
    id: 'food-delivery',
    title: 'Food Delivery',
    description: 'Get food delivered from dining halls and restaurants',
    icon: <Utensils className="w-10 h-10 text-[#FF4D23]" />,
    category: 'delivery',
    estimatedTime: '15-20 minutes',
    price: 12.00,
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
    icon: <Printer className="w-10 h-10 text-[#FF4D23]" />,
    category: 'academic_help',
    estimatedTime: '15-30 minutes',
    price: 6.00,
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
      },
      {
        name: "Education Library - Norman Hall",
        address: "1403 Norman Hall, Gainesville, FL 32611",
        coords: { lat: 29.6475, lng: -82.3515 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0bEek6Z6xitqcd8QgJh8Bv0HVfH6RR2TevA&s"
      },
      {
        name: "Architecture & Fine Arts Library",
        address: "1480 Inner Rd, Gainesville, FL 32611",
        coords: { lat: 29.6505, lng: -82.3465 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe1otBUzyKj8ZH2xhN77Qq9xXXuSV4uTEEVQ&s"
      },
      {
        name: "Health Science Center Library",
        address: "1600 SW Archer Rd, Gainesville, FL 32610",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      }
    ]
  },
  {
    id: 'workout-partner',
    title: 'Workout Partner',
    description: 'Find a gym or sports buddy for your next workout or pickup game',
    icon: <Dumbbell className="w-10 h-10 text-[#FF4D23]" />,
    category: 'other',
    estimatedTime: '30-60 minutes',
    price: 0.00,
    is_free: true,
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
      },
      {
        name: "Florida Gym",
        address: "Florida Gymnasium, UF Campus",
        coords: { lat: 29.6494, lng: -82.3476 },
        logo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "O'Connell Center",
        address: "250 Gale Lemerand Dr, Gainesville, FL 32611",
        coords: { lat: 29.6495, lng: -82.3495 },
        logo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Ben Hill Griffin Stadium",
        address: "157 Gale Lemerand Dr, Gainesville, FL 32611",
        coords: { lat: 29.6499, lng: -82.3486 },
        logo: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "University Golf Course",
        address: "2550 SW 2nd Ave, Gainesville, FL 32607",
        coords: { lat: 29.6350, lng: -82.3520 },
        logo: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'campus-ride',
    title: 'Campus Ride',
    description: 'Get a ride around campus',
    icon: <Car className="w-10 h-10 text-[#FF4D23]" />,
    category: 'transportation',
    estimatedTime: '10-20 minutes',
    price: 8.00,
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
      },
      {
        name: "Fraternity Row",
        address: "Fraternity Row, UF Campus",
        coords: { lat: 29.6444, lng: -82.3399 },
        logo: "https://images.unsplash.com/photo-1541339907198-e08756dedf3f?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Ben Hill Griffin Stadium",
        address: "157 Gale Lemerand Dr, Gainesville, FL 32611",
        coords: { lat: 29.6499, lng: -82.3486 },
        logo: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "O'Connell Center",
        address: "250 Gale Lemerand Dr, Gainesville, FL 32611",
        coords: { lat: 29.6495, lng: -82.3495 },
        logo: "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Norman Hall",
        address: "1221 SW 5th Ave, Gainesville, FL 32601",
        coords: { lat: 29.6475, lng: -82.3515 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0bEek6Z6xitqcd8QgJh8Bv0HVfH6RR2TevA&s"
      },
      {
        name: "Shands Hospital",
        address: "1600 SW Archer Rd, Gainesville, FL 32610",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Southwest Recreation Center",
        address: "3150 Hull Rd, Gainesville, FL 32611",
        coords: { lat: 29.6384, lng: -82.3687 },
        logo: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'pet-care',
    title: 'Pet Care',
    description: 'Dog walking and pet sitting services',
    icon: <Dog className="w-10 h-10 text-[#FF4D23]" />,
    category: 'pet_care',
    estimatedTime: '30-60 minutes',
    price: 15.00,
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
      },
      {
        name: "Flavet Field",
        address: "1864 Stadium Rd, Gainesville, FL 32611",
        coords: { lat: 29.6520, lng: -82.3380 },
        logo: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "University Golf Course",
        address: "2550 SW 2nd Ave, Gainesville, FL 32607",
        coords: { lat: 29.6350, lng: -82.3520 },
        logo: "https://images.unsplash.com/photo-1535131749006-b7f58c99034b?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Depot Park",
        address: "200 SE Depot Ave, Gainesville, FL 32601",
        coords: { lat: 29.6489, lng: -82.3184 },
        logo: "https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'study-buddy',
    title: 'Study Buddy',
    description: 'Find someone to study with',
    icon: <Book className="w-10 h-10 text-[#FF4D23]" />,
    category: 'academic_help',
    estimatedTime: '1-3 hours',
    price: 0.00,
    is_free: true,
    locations: [
      {
        name: "Library West",
        address: "1545 W University Ave, Gainesville, FL 32603",
        coords: { lat: 29.6515, lng: -82.3429 },
        logo: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Marston Science Library",
        address: "444 Newell Dr, Gainesville, FL 32611",
        coords: { lat: 29.6481, lng: -82.3439 },
        logo: "https://ufl.pb.unizin.org/app/uploads/sites/128/2022/07/msl-basement-scaled.jpg"
      },
      {
        name: "Architecture & Fine Arts Library",
        address: "1480 Inner Rd, Gainesville, FL 32611",
        coords: { lat: 29.6505, lng: -82.3465 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQe1otBUzyKj8ZH2xhN77Qq9xXXuSV4uTEEVQ&s"
      },
      {
        name: "Education Library - Norman Hall",
        address: "1403 Norman Hall, Gainesville, FL 32611",
        coords: { lat: 29.6475, lng: -82.3515 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS0bEek6Z6xitqcd8QgJh8Bv0HVfH6RR2TevA&s"
      },
      {
        name: "Reitz Union Study Rooms",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Newell Hall",
        address: "Newell Hall, UF Campus",
        coords: { lat: 29.6489, lng: -82.3434 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Turlington Hall",
        address: "Turlington Hall, UF Campus",
        coords: { lat: 29.6490, lng: -82.3425 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      },
      {
        name: "Health Science Center Library",
        address: "1600 SW Archer Rd, Gainesville, FL 32610",
        coords: { lat: 29.6404, lng: -82.3447 },
        logo: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQdH5vND6t5OF3LD_Rg7oXuFHCYUNOeIe7LlA&s"
      }
    ]
  }
];

const CreateTask: React.FC<CreateTaskProps> = ({ onClose, userLocation, selectedTemplate, prefilledLocation }) => {
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [locationCoords, setLocationCoords] = useState<Location | null>(null);
  const [currentLocation, setCurrentLocation] = useState<Location | null>(userLocation || null);
  const [estimatedTime, setEstimatedTime] = useState('');
  const [category, setCategory] = useState('delivery');
  const [urgencyValue, setUrgencyValue] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<any>(null);
  const [calculating, setCalculating] = useState(false);
  const [showTemplates, setShowTemplates] = useState(!selectedTemplate);
  const [showCheckout, setShowCheckout] = useState(false);
  const [createdTaskId, setCreatedTaskId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'stripe'>('wallet');
  const [walletBalance, setWalletBalance] = useState(0);
  const [isFreeTask, setIsFreeTask] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showTaskForm, setShowTaskForm] = useState(false);
  
  // New state for custom payment rate
  const [customPrice, setCustomPrice] = useState<string>('');
  const [useCustomPrice, setUseCustomPrice] = useState(false);
  const [priceType, setPriceType] = useState<'calculated' | 'custom'>('calculated');
  const [hourlyRate, setHourlyRate] = useState<string>('');
  const [useHourlyRate, setUseHourlyRate] = useState(false);
  const [estimatedHours, setEstimatedHours] = useState<string>('1');

  useEffect(() => {
    // Initialize with user location if available
    if (userLocation) {
      setCurrentLocation(userLocation);
    }

    // Pre-fill form if template is selected
    if (selectedTemplate) {
      setTitle(selectedTemplate.title);
      setDescription(selectedTemplate.description);
      setCategory(selectedTemplate.category);
      setEstimatedTime(selectedTemplate.estimatedTime);
      setIsFreeTask(selectedTemplate.is_free || selectedTemplate.price === 0);
      if (selectedTemplate.price > 0) {
        setCustomPrice(selectedTemplate.price.toString());
      }
      setShowTemplates(false);
      setShowTaskForm(true);
    }

    // Pre-fill location if provided
    if (prefilledLocation) {
      setLocationCoords(prefilledLocation);
      setLocation(prefilledLocation.address || `${prefilledLocation.lat}, ${prefilledLocation.lng}`);
    }

    // Load wallet balance
    loadWalletBalance();
  }, [userLocation, selectedTemplate, prefilledLocation]);

  useEffect(() => {
    if (locationCoords && currentLocation && !isFreeTask && priceType === 'calculated') {
      calculatePrice();
    }
  }, [locationCoords, currentLocation, urgencyValue, isFreeTask, priceType]);

  // Calculate price when hourly rate or estimated hours change
  useEffect(() => {
    if (useHourlyRate && hourlyRate && estimatedHours) {
      const rate = parseFloat(hourlyRate);
      const hours = parseFloat(estimatedHours);
      
      if (!isNaN(rate) && !isNaN(hours) && rate > 0 && hours > 0) {
        const totalPrice = rate * hours;
        setCustomPrice(totalPrice.toFixed(2));
      }
    }
  }, [useHourlyRate, hourlyRate, estimatedHours]);

  const loadWalletBalance = async () => {
    try {
      const balance = await walletService.getBalance();
      setWalletBalance(balance);
    } catch (error) {
      console.error('Error loading wallet balance:', error);
    }
  };

  const getUrgencyLevel = (value: number): UrgencyLevel => {
    if (value <= 33) return 'low';
    if (value <= 66) return 'medium';
    return 'high';
  };

  const calculatePrice = async () => {
    if (!locationCoords || !currentLocation || isFreeTask) return;
    
    try {
      setCalculating(true);
      const breakdown = await calculateTaskPrice(
        locationCoords,
        currentLocation,
        getUrgencyLevel(urgencyValue),
        isFreeTask
      );
      setPriceBreakdown(breakdown);
    } catch (error) {
      console.error('Error calculating price:', error);
      toast.error('Error calculating price');
    } finally {
      setCalculating(false);
    }
  };

  const createNotification = async (userId: string, taskId: string) => {
    try {
      await notificationService.createNotification({
        user_id: userId,
        type: 'task',
        title: 'Task Created',
        content: `Your task "${title}" has been created successfully`,
        task_id: taskId,
        read: false
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  };

  const handleCategorySelect = (category: any) => {
    setTitle(category.title);
    setDescription(category.description);
    setCategory(category.category);
    setEstimatedTime(category.estimatedTime);
    setIsFreeTask(category.is_free || category.price === 0);
    if (category.price > 0) {
      setCustomPrice(category.price.toString());
    }
    setShowTemplates(false);
    setShowTaskForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!locationCoords) {
      toast.error('Please set a valid location');
      return;
    }

    if (!validateLocation(locationCoords)) {
      toast.error('Invalid location coordinates');
      return;
    }

    // Validate price
    let finalPrice = 0;
    if (!isFreeTask) {
      if (priceType === 'calculated' && !priceBreakdown?.total) {
        toast.error('Price calculation is required');
        return;
      } else if (priceType === 'custom') {
        const parsedPrice = parseFloat(customPrice);
        if (isNaN(parsedPrice) || parsedPrice <= 0) {
          toast.error('Please enter a valid price');
          return;
        }
        
        // Check if price is reasonable (e.g., not too high)
        if (parsedPrice > 100) {
          toast.error('Price seems unusually high. Please enter a reasonable amount.');
          return;
        }
        
        finalPrice = parsedPrice;
      } else {
        finalPrice = priceBreakdown?.total || 0;
      }
    }

    setLoading(true);

    try {
      const user = auth.currentUser;
      if (!user) throw new Error('Not authenticated');

      const taskData = {
        title,
        description,
        price: isFreeTask ? 0 : finalPrice,
        location: locationCoords.address || `${locationCoords.lat},${locationCoords.lng}`,
        location_coords: locationCoords,
        estimated_time: estimatedTime,
        category,
        created_by: user.uid,
        status: 'open',
        hourly_rate: useHourlyRate ? parseFloat(hourlyRate) : null,
        estimated_hours: useHourlyRate ? parseFloat(estimatedHours) : null
      };

      // If it's a free task, create it directly
      if (isFreeTask) {
        const taskId = await taskService.createTask(taskData);
        await createNotification(user.uid, taskId);
        setCreatedTaskId(taskId);
        setShowSuccessModal(true);
        return;
      }

      // For paid tasks, check payment method
      if (paymentMethod === 'wallet') {
        // Check if user has sufficient balance
        if (walletBalance < finalPrice) {
          toast.error('Insufficient wallet balance. Please add funds or use Stripe payment.');
          return;
        }

        // Process wallet payment
        const taskId = await taskService.createTask(taskData);
        await walletService.processTaskPayment(taskId, finalPrice);
        await createNotification(user.uid, taskId);
        setCreatedTaskId(taskId);
        setShowSuccessModal(true);
      } else {
        // Use Stripe payment
        const taskId = await taskService.createTask({
          ...taskData,
          status: 'pending_payment' // Set as pending until payment is complete
        });
        setCreatedTaskId(taskId);
        setShowCheckout(true);
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      toast.error(error.message || 'Error creating task');
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    if (!createdTaskId) return;
    
    try {
      // Update task status to open after successful payment
      await taskService.updateTask(createdTaskId, { status: 'open' });
      const user = auth.currentUser;
      if (user) {
        await createNotification(user.uid, createdTaskId);
      }
        
      setShowCheckout(false);
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error updating task status:', error);
      toast.error('Error updating task status');
    }
  };

  const handleTemplateSelect = (template: any) => {
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setEstimatedTime(template.estimated_time);
    setIsFreeTask(template.is_free || template.price === 0);
    if (template.price > 0) {
      setCustomPrice(template.price.toString());
    }
    setShowTemplates(false);
    setShowTaskForm(true);
  };

  const handleLocationSelect = (location: Location) => {
    if (!validateLocation(location)) {
      toast.error('Invalid location coordinates');
      return;
    }

    const coords: Location = {
      lat: Number(location.lat),
      lng: Number(location.lng),
      address: location.address
    };

    setLocationCoords(coords);
    setLocation(coords.address || `${coords.lat}, ${coords.lng}`);
  };

  const handleTemplateWithLocationSelect = (template: any, selectedLocation: { name: string; address: string; coords: { lat: number; lng: number } }) => {
    // Set template data
    setTitle(template.title);
    setDescription(template.description);
    setCategory(template.category);
    setEstimatedTime(template.estimated_time);
    setIsFreeTask(template.is_free || template.price === 0);
    if (template.price > 0) {
      setCustomPrice(template.price.toString());
    }
    setShowTemplates(false);
    setShowTaskForm(true);
    
    // Automatically set the location
    const locationData: Location = {
      lat: selectedLocation.coords.lat,
      lng: selectedLocation.coords.lng,
      address: selectedLocation.address
    };
    
    if (validateLocation(locationData)) {
      setLocationCoords(locationData);
      setLocation(locationData.address);
      
      // Show success message
      toast.success(`Template selected with location: ${selectedLocation.name}`);
    } else {
      toast.error('Invalid location coordinates');
    }
  };

  const handleMapLocationSelect = (location: Location) => {
    handleLocationSelect(location);
    if (validateLocation(location)) {
      calculatePrice();
    }
  };

  const handleCurrentLocationUpdate = (location: Location) => {
    if (validateLocation(location)) {
      setCurrentLocation(location);
      calculatePrice();
    }
  };

  const handleSuccessClose = () => {
    setShowSuccessModal(false);
    onClose();
  };

  const handleViewTask = () => {
    setShowSuccessModal(false);
    onClose();
    // Navigate to marketplace to view the task
    window.dispatchEvent(new CustomEvent('view-task', { detail: { taskId: createdTaskId } }));
  };

  // Function to handle price type change
  const handlePriceTypeChange = (type: 'calculated' | 'custom') => {
    setPriceType(type);
    if (type === 'calculated') {
      setUseCustomPrice(false);
      setUseHourlyRate(false);
      calculatePrice();
    } else {
      setUseCustomPrice(true);
    }
  };

  // Function to toggle hourly rate
  const toggleHourlyRate = () => {
    setUseHourlyRate(!useHourlyRate);
    if (!useHourlyRate && hourlyRate && estimatedHours) {
      const rate = parseFloat(hourlyRate);
      const hours = parseFloat(estimatedHours);
      if (!isNaN(rate) && !isNaN(hours)) {
        setCustomPrice((rate * hours).toFixed(2));
      }
    }
  };

  // Function to validate hourly rate
  const validateHourlyRate = (value: string) => {
    const rate = parseFloat(value);
    if (isNaN(rate) || rate <= 0) {
      return false;
    }
    
    // Check if rate is reasonable (e.g., not too high)
    if (rate > 50) {
      toast.error('Hourly rate seems unusually high. Please enter a reasonable amount.');
      return false;
    }
    
    return true;
  };

  // Function to validate estimated hours
  const validateEstimatedHours = (value: string) => {
    const hours = parseFloat(value);
    if (isNaN(hours) || hours <= 0) {
      return false;
    }
    
    // Check if hours is reasonable (e.g., not too high)
    if (hours > 10) {
      toast.error('Estimated hours seems unusually high. Please enter a reasonable amount.');
      return false;
    }
    
    return true;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="p-4 border-b flex justify-between items-center bg-gradient-to-r from-[#002B7F] to-[#0038FF] text-white rounded-t-xl">
          <h2 className="text-xl font-semibold flex items-center">
            <Zap className="w-5 h-5 mr-2" />
            Create New Task
          </h2>
          <button onClick={onClose} className="text-white hover:text-gray-200 transition-colors p-2 rounded-full hover:bg-white/10">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {showTemplates ? (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold">Choose a Task Type</h3>
                <button
                  onClick={() => {
                    setShowTemplates(false);
                    setShowTaskForm(true);
                  }}
                  className="text-[#002B7F] hover:text-[#0038FF] font-medium flex items-center"
                >
                  Create Custom Task
                  <Zap className="w-4 h-4 ml-1" />
                </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {POPULAR_CATEGORIES.map((category) => (
                  <div 
                    key={category.id}
                    onClick={() => handleCategorySelect(category)}
                    className="premium-card p-5 hover:shadow-xl transition-all cursor-pointer transform hover:scale-[1.02]"
                  >
                    <div className="flex items-center mb-3">
                      <div className="w-12 h-12 rounded-full border-2 border-[#0038FF] bg-white flex items-center justify-center shadow-md">
  <div className="w-6 h-6 flex items-center justify-center text-[#FF5A1F]">
    {React.cloneElement(category.icon, { className: "w-5 h-5" })}
  </div>
</div>

                    </div>
                    <h3 className="font-bold text-lg mb-1">{category.title}</h3>
                    <p className="text-gray-600 text-sm mb-3 line-clamp-2">{category.description}</p>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-[#0038FF]" />
                        {category.estimatedTime}
                      </span>
                      <span className="font-semibold">
                        {category.is_free ? (
                          <span className="badge-premium">FREE</span>
                        ) : (
                          <span className="badge-secondary">${category.price.toFixed(2)}</span>
                        )}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : showTaskForm ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Package className="w-5 h-5 text-[#FF4D23] mr-2" />
                  Task Details
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="w-4 h-4 mr-1 text-gray-500" />
                      Title
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-[#0038FF] placeholder:text-gray-400 shadow-sm"
                      placeholder="What do you need help with?"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Info className="w-4 h-4 mr-1 text-gray-500" />
                      Description
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                      rows={3}
                      className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-[#0038FF] placeholder:text-gray-400 shadow-sm"
                      placeholder="Provide details about your task..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                      <Tag className="w-4 h-4 mr-1 text-gray-500" />
                      Category
                    </label>
                    <div className="relative">
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                        className="w-full px-4 py-3 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#0038FF] focus:border-[#0038FF] placeholder:text-gray-400 shadow-sm"
                      >
                        <option value="delivery">Delivery</option>
                        <option value="academic_help">Academic Help</option>
                        <option value="pet_care">Pet Care</option>
                        <option value="meal_exchange">Meal Exchange</option>
                        <option value="coffee_run">Coffee Run</option>
                        <option value="other">Other</option>
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                        {CATEGORY_ICONS[category] || <Package className="w-5 h-5 text-gray-400" />}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <MapPin className="w-5 h-5 text-[#FF4D23] mr-2" />
                  Location
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">Task Location</label>
                    <LocationInput
                      value={location}
                      onChange={setLocation}
                      onLocationChange={handleLocationSelect}
                      placeholder="Enter task location or click on the map"
                      required
                    />

                    <div className="h-64 mt-2 rounded-xl overflow-hidden border border-gray-200 shadow-md">
                      <TaskMap
                        taskLocation={locationCoords}
                        currentLocation={currentLocation}
                        onLocationSelect={handleMapLocationSelect}
                        onCurrentLocationUpdate={handleCurrentLocationUpdate}
                        interactive={true}
                        height="100%"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="premium-card p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 text-[#FF4D23] mr-2" />
                  Time & Pricing
                </h3>
                
                <div className="space-y-4">
                  {/* Free Task Toggle */}
                  <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <input
                      type="checkbox"
                      id="freeTask"
                      checked={isFreeTask}
                      onChange={(e) => setIsFreeTask(e.target.checked)}
                      className="h-5 w-5 text-[#002B7F] focus:ring-[#002B7F] border-gray-300 rounded"
                    />
                    <label htmlFor="freeTask" className="ml-3 block text-sm text-gray-700 font-medium">
                      This is a free task (no payment required)
                    </label>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Time</label>
                    <div className="mt-1 relative rounded-lg shadow-sm">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Clock className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={estimatedTime}
                        onChange={(e) => setEstimatedTime(e.target.value)}
                        required
                        className="block w-full pl-10 rounded-lg border-gray-300 focus:border-[#002B7F] focus:ring focus:ring-[#002B7F] focus:ring-opacity-50 px-4 py-3"
                        placeholder="e.g. 30 minutes"
                      />
                    </div>
                  </div>

                  {!isFreeTask && (
                    <>
                      {/* Payment Type Selection */}
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                        <h4 className="font-medium mb-3 flex items-center">
                          <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                          Payment Options
                        </h4>
                        
                        <div className="space-y-3">
                          <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="priceType"
                              checked={priceType === 'calculated'}
                              onChange={() => handlePriceTypeChange('calculated')}
                              className="h-4 w-4 text-[#002B7F] focus:ring-[#002B7F]"
                            />
                            <div className="ml-3">
                              <p className="font-medium">Automatic Pricing</p>
                              <p className="text-sm text-gray-600">Calculate price based on distance and urgency</p>
                            </div>
                          </label>
                          
                          <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                            <input
                              type="radio"
                              name="priceType"
                              checked={priceType === 'custom'}
                              onChange={() => handlePriceTypeChange('custom')}
                              className="h-4 w-4 text-[#002B7F] focus:ring-[#002B7F]"
                            />
                            <div className="ml-3">
                              <p className="font-medium">Set Your Own Price</p>
                              <p className="text-sm text-gray-600">Specify exactly how much you want to pay</p>
                            </div>
                          </label>
                        </div>
                      </div>

                      {/* Urgency Level (only for calculated price) */}
                      {priceType === 'calculated' && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Urgency Level</label>
                          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                            <input
                              type="range"
                              min="0"
                              max="100"
                              value={urgencyValue}
                              onChange={(e) => setUrgencyValue(parseInt(e.target.value))}
                              className="mt-2 w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                            />
                            <div className="mt-1 flex justify-between text-sm text-gray-500">
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-green-500 rounded-full mr-1"></span>
                                Low
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-yellow-500 rounded-full mr-1"></span>
                                Medium
                              </span>
                              <span className="flex items-center">
                                <span className="w-2 h-2 bg-red-500 rounded-full mr-1"></span>
                                High
                              </span>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Custom Price Input (only for custom price) */}
                      {priceType === 'custom' && (
                        <div className="space-y-4">
                          <div className="flex items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <input
                              type="checkbox"
                              id="hourlyRate"
                              checked={useHourlyRate}
                              onChange={() => toggleHourlyRate()}
                              className="h-5 w-5 text-[#002B7F] focus:ring-[#002B7F] border-gray-300 rounded"
                            />
                            <label htmlFor="hourlyRate" className="ml-3 block text-sm text-gray-700 font-medium">
                              Set hourly rate instead of fixed price
                            </label>
                          </div>
                          
                          {useHourlyRate ? (
                            <div className="space-y-3">
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Hourly Rate ($)
                                </label>
                                <div className="mt-1 relative rounded-lg shadow-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <DollarSign className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    type="number"
                                    value={hourlyRate}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setHourlyRate(value);
                                      if (validateHourlyRate(value) && estimatedHours) {
                                        const rate = parseFloat(value);
                                        const hours = parseFloat(estimatedHours);
                                        setCustomPrice((rate * hours).toFixed(2));
                                      }
                                    }}
                                    min="1"
                                    step="0.01"
                                    required={useHourlyRate}
                                    className="block w-full pl-10 rounded-lg border-gray-300 focus:border-[#002B7F] focus:ring focus:ring-[#002B7F] focus:ring-opacity-50 px-4 py-3"
                                    placeholder="e.g. 15.00"
                                  />
                                </div>
                              </div>
                              
                              <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  Estimated Hours
                                </label>
                                <div className="mt-1 relative rounded-lg shadow-sm">
                                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Clock className="h-5 w-5 text-gray-400" />
                                  </div>
                                  <input
                                    type="number"
                                    value={estimatedHours}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      setEstimatedHours(value);
                                      if (validateEstimatedHours(value) && hourlyRate) {
                                        const rate = parseFloat(hourlyRate);
                                        const hours = parseFloat(value);
                                        setCustomPrice((rate * hours).toFixed(2));
                                      }
                                    }}
                                    min="0.5"
                                    step="0.5"
                                    required={useHourlyRate}
                                    className="block w-full pl-10 rounded-lg border-gray-300 focus:border-[#002B7F] focus:ring focus:ring-[#002B7F] focus:ring-opacity-50 px-4 py-3"
                                    placeholder="e.g. 1.5"
                                  />
                                </div>
                              </div>
                              
                              <div className="bg-blue-50 p-3 rounded-lg">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm font-medium text-gray-700">Total Price:</span>
                                  <span className="text-lg font-bold text-[#002B7F]">
                                    ${customPrice || '0.00'}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                  ${hourlyRate || '0.00'}/hr × {estimatedHours || '0'} hours
                                </p>
                              </div>
                            </div>
                          ) : (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Fixed Price ($)
                              </label>
                              <div className="mt-1 relative rounded-lg shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <DollarSign className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                  type="number"
                                  value={customPrice}
                                  onChange={(e) => setCustomPrice(e.target.value)}
                                  min="1"
                                  step="0.01"
                                  required={priceType === 'custom' && !useHourlyRate}
                                  className="block w-full pl-10 rounded-lg border-gray-300 focus:border-[#002B7F] focus:ring focus:ring-[#002B7F] focus:ring-opacity-50 px-4 py-3"
                                  placeholder="e.g. 10.00"
                                />
                              </div>
                              
                              <div className="mt-2 p-3 bg-blue-50 rounded-lg">
                                <p className="text-sm text-blue-700">
                                  Set a fair price that reflects the effort and time required for your task.
                                </p>
                              </div>
                            </div>
                          )}
                        </div>
                      )}

                      {calculating ? (
                        <div className="bg-gray-50 rounded-lg p-4 flex items-center justify-center">
                          <Calculator className="w-5 h-5 text-gray-400 animate-spin mr-2" />
                          <span className="text-gray-600">Calculating price...</span>
                        </div>
                      ) : priceBreakdown && !isFreeTask && priceType === 'calculated' && (
                        <>
                          <PriceBreakdown
                            breakdown={priceBreakdown}
                            urgencyLevel={getUrgencyLevel(urgencyValue)}
                          />

                          {/* Payment Method Selection */}
                          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
                            <h4 className="font-medium mb-3 flex items-center">
                              <DollarSign className="w-4 h-4 mr-1 text-blue-600" />
                              Payment Method
                            </h4>
                            <div className="space-y-3">
                              <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="wallet"
                                  checked={paymentMethod === 'wallet'}
                                  onChange={(e) => setPaymentMethod(e.target.value as 'wallet' | 'stripe')}
                                  className="h-4 w-4 text-[#002B7F] focus:ring-[#002B7F]"
                                />
                                <span className="ml-2 flex items-center">
                                  <DollarSign className="w-4 h-4 mr-1" />
                                  Wallet Balance: ${walletBalance.toFixed(2)}
                                  {walletBalance < priceBreakdown.total && (
                                    <span className="ml-2 text-red-600 text-sm">(Insufficient)</span>
                                  )}
                                </span>
                              </label>
                              
                              <label className="flex items-center p-3 bg-white rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors cursor-pointer">
                                <input
                                  type="radio"
                                  name="paymentMethod"
                                  value="stripe"
                                  checked={paymentMethod === 'stripe'}
                                  onChange={(e) => setPaymentMethod(e.target.value as 'wallet' | 'stripe')}
                                  className="h-4 w-4 text-[#002B7F] focus:ring-[#002B7F]"
                                />
                                <span className="ml-2 flex items-center">
                                  <Shield className="w-4 h-4 mr-1" />
                                  Credit/Debit Card (Stripe)
                                </span>
                              </label>
                            </div>
                          </div>
                        </>
                      )}
                    </>
                  )}

                  {isFreeTask && (
                    <div className="bg-green-50 rounded-lg p-4 border border-green-100">
                      <div className="flex items-center">
                        <Shield className="w-5 h-5 text-green-600 mr-2" />
                        <span className="text-green-800 font-medium">Free Task</span>
                      </div>
                      <p className="text-green-700 text-sm mt-1">
                        This task is free and will be posted immediately without payment.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-4">
                <StarBorder 
                  color={isFreeTask ? "#0038FF" : "#FF5A1F"}
                  className="w-full"
                >
                  <button
                    type="submit"
                    disabled={loading || (!isFreeTask && priceType === 'calculated' && calculating) || !locationCoords}
                    className={`w-full flex justify-center py-3 px-4 rounded-xl shadow-sm text-base font-semibold text-white ${
                      isFreeTask 
                        ? "bg-gradient-to-r from-[#0038FF] to-[#0021A5]" 
                        : "bg-gradient-to-r from-[#FF5A1F] to-[#E63A0B]"
                    } hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
                  >
                    {loading ? (
                      <div className="flex items-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Creating...
                      </div>
                    ) : (
                      <>
                        <Zap className="w-5 h-5 mr-2" />
                        {isFreeTask ? 'Create Free Task' : 'Create Task & Pay'}
                      </>
                    )}
                  </button>
                </StarBorder>
              </div>
            </form>
          ) : null}
        </div>

        {showCheckout && createdTaskId && priceBreakdown && (
          <StripeCheckout
            taskId={createdTaskId}
            amount={priceType === 'custom' ? parseFloat(customPrice) : priceBreakdown.total}
            onClose={() => {
              setShowCheckout(false);
              onClose();
            }}
            onSuccess={handlePaymentSuccess}
          />
        )}

        {showSuccessModal && createdTaskId && (
          <TaskCreationSuccess
            taskId={createdTaskId}
            onClose={handleSuccessClose}
            onViewTask={handleViewTask}
          />
        )}
      </div>
    </div>
  );
};

export default CreateTask;