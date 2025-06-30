import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Coffee, Book, MapPin, Clock, DollarSign, Star, Shield, Users, Zap, MessageSquare, Award, ChevronRight, ChevronLeft, Briefcase, Mail, Building } from "lucide-react";
import { StarBorder } from "./ui/star-border";
import LearnMoreModal from "./LearnMoreModal";

const LandingPage = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showLearnMore, setShowLearnMore] = useState(false);
  const [isVisible, setIsVisible] = useState<{ [key: string]: boolean }>({
    hero: false,
    features: false,
    howItWorks: false,
    testimonials: false,
    mission: false,
    techStack: false,
    partners: false,
    business: false,
  });

  const slides = [
    {
      title: "Connect with fellow students",
      description: "Get help with quick tasks or earn money helping others",
      image: "https://images.pexels.com/photos/1438072/pexels-photo-1438072.jpeg?auto=format&fit=crop&w=1470&q=80",
      color: "from-blue-600 to-indigo-700"
    },
    {
      title: "Coffee runs made easy",
      description: "Need coffee during a study session? Get it delivered!",
      image: "https://images.pexels.com/photos/302899/pexels-photo-302899.jpeg?auto=format&fit=crop&w=1470&q=80",
      color: "from-orange-500 to-red-600"
    },
    {
      title: "Study materials on demand",
      description: "Get notes, textbooks, or printing delivered to you",
      image: "https://images.pexels.com/photos/5428003/pexels-photo-5428003.jpeg?auto=format&fit=crop&w=1470&q=80",
      color: "from-green-500 to-emerald-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah M.",
      major: "Biology",
      quote: "Hustl saved me during finals week! I needed coffee but couldn't leave the library, and someone delivered it in 15 minutes.",
      image: "https://images.pexels.com/photos/733872/pexels-photo-733872.jpeg?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "James K.",
      major: "Computer Science",
      quote: "I make around $100 a week just doing coffee runs and food deliveries between classes. Perfect for a busy student schedule!",
      image: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=format&fit=crop&w=800&q=80"
    },
    {
      name: "Aisha T.",
      major: "Psychology",
      quote: "The safety features make me feel comfortable using the app. I've met some great people while completing tasks!",
      image: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=format&fit=crop&w=800&q=80"
    }
  ];

  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  useEffect(() => {
    // Auto-advance slides
    const slideInterval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);

    // Auto-advance testimonials
    const testimonialInterval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 7000);

    // Set up intersection observers for animations
    const observerOptions = {
      threshold: 0.2,
      rootMargin: "0px 0px -100px 0px"
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          setIsVisible(prev => ({ ...prev, [entry.target.id]: true }));
        }
      });
    }, observerOptions);

    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => {
      observer.observe(section);
    });

    // Set hero to visible immediately
    setIsVisible(prev => ({ ...prev, hero: true }));

    return () => {
      clearInterval(slideInterval);
      clearInterval(testimonialInterval);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white overflow-hidden">
      {/* Hero Section */}
      <section id="hero" className={`relative min-h-screen flex items-center transition-opacity duration-1000 ${isVisible.hero ? 'opacity-100' : 'opacity-0'}`}>
        {/* Background Slider */}
        <div className="absolute inset-0 overflow-hidden">
          {slides.map((slide, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentSlide === index ? "opacity-100" : "opacity-0"
              }`}
            >
              <div className="absolute inset-0 bg-black opacity-60 z-10"></div>
              <img
                src={slide.image}
                alt={slide.title}
                className="w-full h-full object-cover scale-105 transition-transform duration-10000 transform"
                style={{ 
                  transformOrigin: 'center',
                  transform: currentSlide === index ? 'scale(1.05)' : 'scale(1)'
                }}
              />
              <div className={`absolute inset-0 bg-gradient-to-r ${slide.color} opacity-60 z-20`}></div>
            </div>
          ))}
        </div>

        {/* Animated particles */}
        <div className="absolute inset-0 z-20 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white/20 animate-pulse-custom"
              style={{
                width: `${Math.random() * 10 + 5}px`,
                height: `${Math.random() * 10 + 5}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            ></div>
          ))}
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 relative z-30">
          <div className="max-w-4xl mx-auto text-center">
            <div className="mb-8 flex justify-center">
              <div className="relative">
                <img 
                  src="/files_5770123-1751251303321-image.png" 
                  alt="Hustl Logo" 
                  className="h-24 sm:h-32 w-auto animate-fade-in-down"
                />
                <div className="absolute -inset-1 bg-white/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            
            {/* Animated Tagline */}
            <div className="overflow-hidden mb-8">
              <div className="flex justify-center">
                <div className="text-xl sm:text-2xl md:text-3xl font-bold text-white bg-black/30 px-8 py-4 rounded-full backdrop-blur-sm border border-white/20 shadow-xl">
                  <span className="animate-fade-in-up inline-block">Connect.</span>
                  <span className="animate-fade-in-up animation-delay-200 inline-block ml-2">Help.</span>
                  <span className="animate-fade-in-up animation-delay-300 inline-block ml-2">Thrive on campus.</span>
                </div>
              </div>
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-white mb-6 animate-fade-in-up leading-tight">
              {slides[currentSlide].title}
            </h1>
            
            <p className="text-xl sm:text-2xl text-white/90 mb-8 animate-fade-in-up animation-delay-200 max-w-3xl mx-auto">
              {slides[currentSlide].description}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-fade-in-up animation-delay-300">
              <StarBorder color="#FFFFFF">
                <Link
                  to="/app"
                  className="bg-white text-[#0038FF] px-8 py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition duration-300 flex items-center justify-center shadow-xl"
                >
                  Go to App
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </StarBorder>
              
              <button
                onClick={() => setShowLearnMore(true)}
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition duration-300 backdrop-blur-sm"
              >
                Learn More
              </button>
            </div>
          </div>
        </div>

        {/* Slide Indicators */}
        <div className="absolute bottom-10 left-0 right-0 flex justify-center gap-2 z-30">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                currentSlide === index
                  ? "bg-white w-10"
                  : "bg-white/50 hover:bg-white/80"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 z-30 animate-bounce-custom">
          <div className="w-8 h-12 rounded-full border-2 border-white flex items-start justify-center p-1">
            <div className="w-1 h-3 bg-white rounded-full animate-fade-in"></div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={`py-20 bg-white transition-all duration-1000 transform ${isVisible.features ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'}`}>
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-8 h-8 text-[#0038FF]" />
                </div>
                <div className="absolute -inset-2 bg-blue-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
              Campus Life, Simplified
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in animation-delay-200">
              Hustl connects students to help each other with everyday tasks
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-blue-100/50 animate-fade-in animation-delay-200">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-custom" style={{ animationDuration: '3s' }}>
                <Coffee className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Coffee & Food Runs</h3>
              <p className="text-gray-600">
                Need coffee during a study session? Get it delivered right to your spot in the library.
              </p>
            </div>

            <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-orange-100/50 animate-fade-in animation-delay-300">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-custom" style={{ animationDuration: '4s', animationDelay: '0.5s' }}>
                <Book className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-orange-600 to-red-600">Academic Help</h3>
              <p className="text-gray-600">
                Get notes when you miss class, find study partners, or get textbooks delivered.
              </p>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-2 border border-green-100/50 animate-fade-in animation-delay-400">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-lg animate-bounce-custom" style={{ animationDuration: '3.5s', animationDelay: '1s' }}>
                <DollarSign className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-green-600 to-emerald-600">Earn Between Classes</h3>
              <p className="text-gray-600">
                Turn your free time into income by helping fellow students with quick tasks.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="howItWorks" className={`py-20 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 transform ${isVisible.howItWorks ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/5 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-orange-500/5 mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Clock className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="absolute -inset-2 bg-indigo-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4 animate-fade-in">
              How Hustl Works
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto animate-fade-in animation-delay-200">
              Getting help or earning money is simple
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="text-center animate-fade-in animation-delay-200">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <span className="text-2xl font-bold text-white">1</span>
                </div>
                <div className="absolute -inset-4 bg-blue-400/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-[#0038FF] to-transparent"></div>
              </div>
              <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Post Your Task</h3>
              <p className="text-gray-600">
                Describe what you need, set your budget, and choose a location
              </p>
            </div>

            <div className="text-center animate-fade-in animation-delay-300">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <span className="text-2xl font-bold text-white">2</span>
                </div>
                <div className="absolute -inset-4 bg-blue-400/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                <div className="hidden md:block absolute top-10 left-full w-full h-0.5 bg-gradient-to-r from-[#0038FF] to-transparent"></div>
              </div>
              <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Get Matched</h3>
              <p className="text-gray-600">
                Connect with verified students nearby who can help
              </p>
            </div>

            <div className="text-center animate-fade-in animation-delay-400">
              <div className="relative">
                <div className="w-20 h-20 bg-gradient-to-r from-[#0038FF] to-[#0021A5] rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl">
                  <span className="text-2xl font-bold text-white">3</span>
                </div>
                <div className="absolute -inset-4 bg-blue-400/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
              <h3 className="text-xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Complete & Pay</h3>
              <p className="text-gray-600">
                Task completed, payment processed securely through the app
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={`py-20 bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white transition-all duration-1000 transform ${isVisible.testimonials ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform -translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
          {[...Array(10)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse-custom"
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            ></div>
          ))}
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Star className="w-8 h-8 text-yellow-400" />
                </div>
                <div className="absolute -inset-2 bg-yellow-400/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              What Students Are Saying
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto">
              Join thousands of students already using Hustl
            </p>
          </div>

          <div className="max-w-4xl mx-auto relative">
            <div className="overflow-hidden rounded-2xl shadow-2xl">
              <div className="flex transition-transform duration-500 ease-in-out" style={{ transform: `translateX(-${currentTestimonial * 100}%)` }}>
                {testimonials.map((testimonial, index) => (
                  <div key={index} className="w-full flex-shrink-0 px-4">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
                      <div className="flex items-center mb-6">
                        <div className="relative">
                          <img 
                            src={testimonial.image} 
                            alt={testimonial.name} 
                            className="w-16 h-16 rounded-full object-cover border-2 border-white"
                          />
                          <div className="absolute -inset-1 bg-white/30 rounded-full blur-md -z-10"></div>
                        </div>
                        <div className="ml-4">
                          <h3 className="text-xl font-bold">{testimonial.name}</h3>
                          <p className="text-blue-200">{testimonial.major}</p>
                        </div>
                      </div>
                      <div className="flex mb-4">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        ))}
                      </div>
                      <p className="text-lg italic leading-relaxed">"{testimonial.quote}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center mt-8 gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-all duration-300 ${
                    currentTestimonial === index
                      ? "bg-white w-10"
                      : "bg-white/50 hover:bg-white/80"
                  }`}
                  aria-label={`Go to testimonial ${index + 1}`}
                />
              ))}
            </div>

            <button
              onClick={() => setCurrentTestimonial((prev) => (prev === 0 ? testimonials.length - 1 : prev - 1))}
              className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-6 bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors shadow-lg"
              aria-label="Previous testimonial"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <button
              onClick={() => setCurrentTestimonial((prev) => (prev === testimonials.length - 1 ? 0 : prev + 1))}
              className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-6 bg-white/20 hover:bg-white/30 rounded-full p-2 backdrop-blur-sm transition-colors shadow-lg"
              aria-label="Next testimonial"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          </div>
        </div>
      </section>

      {/* Our Mission Section */}
      <section id="mission" className={`py-20 bg-white transition-all duration-1000 transform ${isVisible.mission ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-blue-500/5 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-orange-500/5 mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16 animate-fade-in">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                  <div className="absolute -inset-2 bg-purple-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Our Mission
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Building a stronger campus community through connection and collaboration
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-2xl border border-blue-100/50 animate-scale-in">
              <div className="prose prose-lg max-w-none text-gray-700">
                <p className="mb-6 animate-fade-in animation-delay-200">
                  At Hustl, we believe in the power of community and the untapped potential of student collaboration. Our mission is to create a platform where students can help each other navigate the challenges of campus life while building meaningful connections.
                </p>
                
                <p className="mb-6 animate-fade-in animation-delay-300">
                  Founded by a diverse team of students who experienced firsthand the everyday hurdles of university life, Hustl was born from a simple observation: students have complementary needs and abilities, but lack an efficient way to connect.
                </p>
                
                <p className="mb-6 animate-fade-in animation-delay-400">
                  Whether it's getting coffee delivered during an intense study session, finding someone to pick up class materials when you're sick, or earning extra money between classes by helping fellow students, Hustl makes these connections possible.
                </p>
                
                <p className="mb-6 animate-fade-in animation-delay-500">
                  We're more than just a task marketplace—we're building a collaborative ecosystem where students support each other through the unique challenges of university life. By connecting those who need help with those who can provide it, we're fostering a more connected, efficient, and supportive campus community.
                </p>
                
                <p className="animate-fade-in animation-delay-500">
                  Our team is committed to creating a platform that is safe, inclusive, and beneficial for all students. We prioritize user safety, fair compensation, and positive community interactions in everything we build.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tech Stack Section */}
      <section id="techStack" className={`py-20 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 transform ${isVisible.techStack ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 left-1/3 w-64 h-64 rounded-full bg-blue-500/5 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-1/3 right-1/3 w-64 h-64 rounded-full bg-purple-500/5 mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-green-600" />
                </div>
                <div className="absolute -inset-2 bg-green-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Our Technology
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Built with modern tools for reliability, security, and performance
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16">
              {/* Firebase */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-200">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://firebase.google.com/downloads/brand-guidelines/PNG/logo-logomark.png" 
                    alt="Firebase" 
                    className="h-16 object-contain"
                  />
                  <div className="absolute -inset-2 bg-yellow-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Firebase</h3>
                <p className="text-sm text-gray-500 text-center">Backend & Auth</p>
              </div>

              {/* React */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-300">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/React-icon.svg/1200px-React-icon.svg.png" 
                    alt="React" 
                    className="h-16 object-contain"
                  />
                  <div className="absolute -inset-2 bg-blue-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">React</h3>
                <p className="text-sm text-gray-500 text-center">Frontend Framework</p>
              </div>

              {/* Tailwind CSS */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-400">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://tailwindcss.com/_next/static/media/tailwindcss-mark.3c5441fc7a190fb1800d4a5c7f07ba4b1345a9c8.svg" 
                    alt="Tailwind CSS" 
                    className="h-12 object-contain"
                  />
                  <div className="absolute -inset-2 bg-teal-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Tailwind CSS</h3>
                <p className="text-sm text-gray-500 text-center">Styling</p>
              </div>

              {/* TypeScript */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-500">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4c/Typescript_logo_2020.svg/1200px-Typescript_logo_2020.svg.png" 
                    alt="TypeScript" 
                    className="h-14 object-contain"
                  />
                  <div className="absolute -inset-2 bg-blue-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">TypeScript</h3>
                <p className="text-sm text-gray-500 text-center">Type Safety</p>
              </div>

              {/* Vite */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-200">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://vitejs.dev/logo-with-shadow.png" 
                    alt="Vite" 
                    className="h-16 object-contain"
                  />
                  <div className="absolute -inset-2 bg-purple-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Vite</h3>
                <p className="text-sm text-gray-500 text-center">Build Tool</p>
              </div>

              {/* Google Maps */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-300">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://developers.google.com/static/maps/images/maps-icon.svg" 
                    alt="Google Maps" 
                    className="h-14 object-contain"
                  />
                  <div className="absolute -inset-2 bg-green-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Google Maps</h3>
                <p className="text-sm text-gray-500 text-center">Location Services</p>
              </div>

              {/* Stripe */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-400">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/2560px-Stripe_Logo%2C_revised_2016.svg.png" 
                    alt="Stripe" 
                    className="h-10 object-contain"
                  />
                  <div className="absolute -inset-2 bg-purple-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Stripe</h3>
                <p className="text-sm text-gray-500 text-center">Payments</p>
              </div>

              {/* Sentry */}
              <div className="flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-500">
                <div className="h-16 flex items-center justify-center mb-4 relative">
                  <img 
                    src="https://seeklogo.com/images/S/sentry-logo-36928B74C1-seeklogo.com.png" 
                    alt="Sentry" 
                    className="h-14 object-contain"
                  />
                  <div className="absolute -inset-2 bg-red-400/10 rounded-full blur-xl -z-10 opacity-0 hover:opacity-100 transition-opacity"></div>
                </div>
                <h3 className="font-bold text-center">Sentry</h3>
                <p className="text-sm text-gray-500 text-center">Error Monitoring</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* University Partners Section */}
      <section id="partners" className={`py-20 bg-white transition-all duration-1000 transform ${isVisible.partners ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-64 h-64 rounded-full bg-orange-500/5 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500/5 mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block mb-4">
              <div className="relative">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <Building className="w-8 h-8 text-orange-600" />
                </div>
                <div className="absolute -inset-2 bg-orange-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              University Partners
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Bringing Hustl to campuses across the country
            </p>
          </div>

          <div className="max-w-5xl mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* University of Florida */}
              <div className="bg-gradient-to-br from-blue-50 to-orange-50 rounded-xl p-8 shadow-2xl border border-blue-100/50 flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-200">
                <div className="h-24 flex items-center justify-center mb-6 relative">
                  <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/8/8e/University_of_Florida_logo.svg/1280px-University_of_Florida_logo.svg.png" 
                    alt="University of Florida" 
                    className="h-20 object-contain"
                  />
                  <div className="absolute -inset-4 bg-blue-400/10 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">University of Florida</h3>
                <p className="text-gray-600 text-center">
                  Our founding campus and first university partner
                </p>
                <div className="mt-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Active
                </div>
              </div>

              {/* Coming Soon */}
              <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-8 shadow-lg border border-gray-200/50 flex flex-col items-center transform transition-all duration-500 hover:scale-105 animate-fade-in animation-delay-300">
                <div className="h-24 flex items-center justify-center mb-6 relative">
                  <Building className="w-16 h-16 text-gray-400" />
                  <div className="absolute -inset-4 bg-gray-400/10 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                </div>
                <h3 className="text-xl font-bold mb-2 text-center">More Universities</h3>
                <p className="text-gray-600 text-center">
                  We're expanding to more campuses soon
                </p>
                <div className="mt-4 bg-gradient-to-r from-gray-500 to-gray-600 text-white px-4 py-1 rounded-full text-sm font-medium shadow-lg">
                  Coming Soon
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Business Inquiries Section */}
      <section id="business" className={`py-20 bg-gradient-to-b from-gray-50 to-white transition-all duration-1000 transform ${isVisible.business ? 'translate-y-0 opacity-100' : 'translate-y-10 opacity-0'} relative overflow-hidden`}>
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/3 right-1/3 w-64 h-64 rounded-full bg-indigo-500/5 mix-blend-multiply filter blur-3xl"></div>
          <div className="absolute bottom-1/3 left-1/3 w-64 h-64 rounded-full bg-green-500/5 mix-blend-multiply filter blur-3xl"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12 animate-fade-in">
              <div className="inline-block mb-4">
                <div className="relative">
                  <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Briefcase className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div className="absolute -inset-2 bg-indigo-100/50 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
                </div>
              </div>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                Partner with Hustl
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Bring the power of student collaboration to your campus
              </p>
            </div>

            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl p-8 md:p-12 shadow-2xl border border-blue-100/50 animate-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                <div className="animate-slide-in-left">
                  <h3 className="text-2xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">For Universities</h3>
                  <p className="text-gray-700 mb-6">
                    Partner with Hustl to provide your students with a safe, efficient platform for campus collaboration. Our platform helps improve student life, increase campus engagement, and provide flexible earning opportunities.
                  </p>
                  <ul className="space-y-3 mb-6">
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Improve student satisfaction and retention</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Enhance campus community and engagement</span>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1 rounded-full mr-2 mt-1">
                        <Check className="w-4 h-4 text-blue-600" />
                      </div>
                      <span className="text-gray-700">Provide flexible earning opportunities for students</span>
                    </li>
                  </ul>
                </div>
                
                <div className="bg-white rounded-xl p-6 shadow-xl border border-gray-100 animate-slide-in-right">
                  <h4 className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-[#0038FF] to-[#0021A5]">Business Inquiries</h4>
                  <p className="text-gray-600 mb-6">
                    Interested in bringing Hustl to your campus? Contact our partnerships team.
                  </p>
                  <a 
                    href="mailto:partnerships@hustlapp.com"
                    className="bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition duration-200 flex items-center justify-center shadow-lg"
                  >
                    <Mail className="w-5 h-5 mr-2" />
                    Contact Partnerships
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-[#0038FF] to-[#0021A5] text-white relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform -translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
          {[...Array(15)].map((_, i) => (
            <div 
              key={i}
              className="absolute rounded-full bg-white/10 animate-pulse-custom"
              style={{
                width: `${Math.random() * 20 + 10}px`,
                height: `${Math.random() * 20 + 10}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${Math.random() * 3 + 2}s`
              }}
            ></div>
          ))}
        </div>

        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="animate-fade-in">
            <div className="inline-block mb-6">
              <div className="relative">
                <div className="w-20 h-20 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center">
                  <Zap className="w-10 h-10 text-white" />
                </div>
                <div className="absolute -inset-2 bg-white/20 rounded-full blur-xl -z-10 animate-pulse-custom"></div>
              </div>
            </div>
            <h2 className="text-3xl sm:text-5xl font-bold mb-6 animate-fade-in">
              Join the Movement
            </h2>
            <p className="text-xl text-blue-100 max-w-3xl mx-auto mb-8 animate-fade-in animation-delay-200">
              Be part of the revolution in campus collaboration. Connect, help, and earn with Hustl.
            </p>
            <div className="animate-fade-in animation-delay-300">
              <StarBorder color="#FFFFFF">
                <Link
                  to="/"
                  className="bg-white text-[#0038FF] px-8 py-4 rounded-xl font-bold text-lg hover:bg-opacity-90 transition duration-300 inline-flex items-center shadow-xl"
                >
                  Join the Movement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
              </StarBorder>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500 opacity-5 rounded-full transform -translate-x-1/4 -translate-y-1/4"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-orange-500 opacity-5 rounded-full transform translate-x-1/4 translate-y-1/4"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-6 md:mb-0 animate-fade-in">
              <div className="relative">
                <img 
                  src="/files_5770123-1751251303321-image.png" 
                  alt="Hustl Logo" 
                  className="h-12 w-auto"
                />
                <div className="absolute -inset-1 bg-white/5 rounded-full blur-xl -z-10"></div>
              </div>
              <p className="mt-2 text-gray-400">
                Campus tasks, simplified.
              </p>
            </div>
            
            <div className="flex flex-wrap gap-8 animate-fade-in animation-delay-200">
              <div>
                <h3 className="font-bold mb-4 text-blue-300">Features</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Task Marketplace</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Secure Payments</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Safety Features</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-blue-300">Company</h3>
                <ul className="space-y-2">
                  <li><button onClick={() => setShowLearnMore(true)} className="text-gray-400 hover:text-white transition">About Us</button></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Careers</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Contact</a></li>
                </ul>
              </div>
              
              <div>
                <h3 className="font-bold mb-4 text-blue-300">Legal</h3>
                <ul className="space-y-2">
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a></li>
                  <li><a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a></li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400 animate-fade-in animation-delay-300">
            <p>© {new Date().getFullYear()} Hustl. All rights reserved.</p>
          </div>
        </div>
      </footer>

      {/* Learn More Modal */}
      {showLearnMore && <LearnMoreModal onClose={() => setShowLearnMore(false)} />}

      {/* Animated Background Elements */}
      <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-blue-500 mix-blend-multiply filter blur-3xl opacity-5 animate-float"></div>
        <div className="absolute top-3/4 left-2/3 w-96 h-96 rounded-full bg-purple-500 mix-blend-multiply filter blur-3xl opacity-5 animate-float animation-delay-2000"></div>
        <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-pink-500 mix-blend-multiply filter blur-3xl opacity-5 animate-float animation-delay-1000"></div>
      </div>
    </div>
  );
};

// Check component for use in the LandingPage
const Check = ({ className = "w-6 h-6" }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <polyline points="20 6 9 17 4 12"></polyline>
  </svg>
);

export default LandingPage;