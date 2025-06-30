import React, { useState, useEffect } from 'react';
import { X, Coffee, Book, Dog, Car, GraduationCap, Users, Package, Star, Clock, MapPin, Dumbbell, Trophy, Utensils, Bike, ShoppingBag, Printer, Gamepad2, Shield, ChevronDown, ChevronUp, ExternalLink, ChevronLeft, ChevronRight, Tag, DollarSign, ArrowRight, Plus } from 'lucide-react';
import { taskTemplateService } from '../lib/database';
import toast from 'react-hot-toast';

interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  category: string;
  estimated_time: string;
  price: number;
  image: string;
  locations?: { name: string; address: string; coords: { lat: number; lng: number }; logo?: string }[];
  is_free?: boolean;
}

interface TaskTemplateModalProps {
  onClose: () => void;
  onSelectTemplate: (template: TaskTemplate) => void;
  onCreateCustomTask: () => void;
}

// Built-in fallback templates with real UF campus locations from campusmap.ufl.edu
const BUILT_IN_TEMPLATES: TaskTemplate[] = [
  {
    id: 'coffee-run',
    title: 'Coffee Runs',
    description: 'Get coffee from campus locations',
    category: 'coffee_run',
    estimated_time: '15-20 minutes',
    price: 8.00,
    image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=400&h=200&q=80',
    is_free: false,
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
    ]
  },
  {
    id: 'food-pickup',
    title: 'Food Pickup',
    description: 'Pick up meals from dining halls and restaurants',
    category: 'delivery',
    estimated_time: '30-45 minutes',
    price: 12.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRbu6Y6YGQKiiwpGv6U-1JnrSdIdVa7-eGVSg&s',
    is_free: false,
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
    ]
  },
  {
    id: 'print-pickup',
    title: 'Print & Deliver',
    description: 'Print documents and deliver them',
    category: 'academic_help',
    estimated_time: '15-25 minutes',
    price: 5.00,
    image: 'https://images.unsplash.com/photo-1586281380349-632531db7ed4?auto=format&fit=crop&w=400&h=200&q=80',
    is_free: false,
    locations: [
      {
        name: "Marston Science Library",
        address: "444 Newell Dr, Gainesville, FL 32611",
        coords: { lat: 29.6481, lng: -82.3439 },
        logo: "https://upload.wikimedia.org/wikipedia/commons/a/af/Marston_Library.jpg"
      },
      {
        name: "Library West",
        address: "1545 W University Ave, Gainesville, FL 32603",
        coords: { lat: 29.6515, lng: -82.3429 },
        logo: "https://images.unsplash.com/photo-1481627834876-b7833e8f5570?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=100&q=80"
      },
    ]
  },
  {
    id: 'campus-rides',
    title: 'Campus Rides',
    description: 'Quick rides around campus',
    category: 'transportation',
    estimated_time: '10-20 minutes',
    price: 8.00,
    image: 'https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=400&h=200&q=80',
    is_free: false,
    locations: [
      {
        name: "Reitz Union",
        address: "686 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6463, lng: -82.3478 },
        logo: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Sorority Row",
        address: "1926 Museum Rd, Gainesville, FL 32611",
        coords: { lat: 29.6449, lng: -82.3399 },
        logo: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=100&q=80"
      },
      {
        name: "Ben Hill Griffin Stadium",
        address: "157 Gale Lemerand Dr, Gainesville, FL 32611",
        coords: { lat: 29.6499, lng: -82.3486 },
        logo: "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=100&q=80"
      }
    ]
  },
  {
    id: 'study-buddy',
    title: 'Study Buddy',
    description: 'Find someone to study with',
    category: 'academic_help',
    estimated_time: '1-3 hours',
    price: 0.00,
    image: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSorGqEYuQ4yX2WXMD8oZs3Zyb0ZABygSL-TQ&s',
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
        logo: "https://upload.wikimedia.org/wikipedia/commons/<boltArtifact id="task-template-modal" title="Task Template Selection Modal">