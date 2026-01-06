import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Calendar, User, Clock, Trophy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const blogPosts = [
  {
    id: 'choosing-right-turf',
    title: 'How to Choose the Right Sports Turf for Your Game',
    excerpt: 'Learn the key factors to consider when selecting a turf for football, cricket, or badminton. From surface type to lighting, we cover it all.',
    author: 'Sports Arena Team',
    date: '2025-12-28',
    readTime: '5 min read',
    category: 'Tips',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&auto=format&fit=crop',
  },
  {
    id: 'benefits-of-turf-booking',
    title: 'Top 5 Benefits of Online Turf Booking',
    excerpt: 'Discover why booking your sports turf online saves time, offers better deals, and guarantees your slot every time.',
    author: 'Sports Arena Team',
    date: '2025-12-20',
    readTime: '4 min read',
    category: 'Guide',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=800&auto=format&fit=crop',
  },
  {
    id: 'fitness-through-sports',
    title: 'Stay Fit with Regular Sports: A Complete Guide',
    excerpt: 'Playing sports regularly is one of the best ways to maintain fitness. Learn how to incorporate sports into your weekly routine.',
    author: 'Health Expert',
    date: '2025-12-15',
    readTime: '6 min read',
    category: 'Health',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800&auto=format&fit=crop',
  },
  {
    id: 'team-building-sports',
    title: 'Team Building Through Sports: Corporate Booking Tips',
    excerpt: 'Looking to organize a corporate sports event? Here are the best practices for booking turfs for team-building activities.',
    author: 'Corporate Solutions',
    date: '2025-12-10',
    readTime: '5 min read',
    category: 'Corporate',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&auto=format&fit=crop',
  },
];

export default function Blog() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <nav className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-900">Sports Arena</span>
              <p className="text-emerald-600 text-xs hidden sm:block">Book • Play • Win</p>
            </div>
          </Link>
          <ProfileAvatar />
        </nav>
      </header>

      {/* Hero */}
      <section className="bg-gradient-to-br from-emerald-50 to-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-4">Sports Arena Blog</h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Tips, guides, and insights to help you make the most of your sports experience
          </p>
        </div>
      </section>

      {/* Blog Grid */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {blogPosts.map((post) => (
              <Link 
                key={post.id}
                to={`/blog/${post.id}`}
                className="group bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
              >
                <div className="aspect-[16/10] relative overflow-hidden">
                  <img 
                    src={post.image} 
                    alt={post.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                <div className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-emerald-600 transition-colors">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-2">{post.excerpt}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <User className="w-4 h-4" />
                      {post.author}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {new Date(post.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {post.readTime}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 bg-emerald-50">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Ready to Play?</h2>
          <p className="text-gray-600 mb-6">Find and book your perfect sports venue today</p>
          <Link to="/all-turfs">
            <Button className="bg-emerald-500 hover:bg-emerald-600">
              Browse All Turfs
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">Sports Arena</span>
            </div>
            <div className="flex items-center gap-6 text-gray-400 text-sm">
              <Link to="/" className="hover:text-white">Home</Link>
              <Link to="/all-turfs" className="hover:text-white">All Turfs</Link>
              <span>© 2025 Sports Arena</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}