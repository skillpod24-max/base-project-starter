import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, User, Clock, Trophy, Share2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ProfileAvatar';

const blogContent: Record<string, { title: string; content: string; author: string; date: string; readTime: string; image: string }> = {
  'choosing-right-turf': {
    title: 'How to Choose the Right Sports Turf for Your Game',
    author: 'Sports Arena Team',
    date: '2025-12-28',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=1200&auto=format&fit=crop',
    content: `
Choosing the right sports turf can make a significant difference in your game experience. Whether you're playing football, cricket, or badminton, here's what you need to consider:

## 1. Surface Type

Different sports require different surfaces:
- **Natural Grass**: Best for cricket and traditional football
- **Artificial Turf**: Ideal for football, consistent playing conditions
- **Synthetic Courts**: Perfect for badminton and tennis
- **Hard Courts**: Suitable for basketball and volleyball

## 2. Location & Accessibility

Consider how far you're willing to travel. A turf that's closer means:
- Less travel time
- Easier for group coordination
- Lower transportation costs

## 3. Facilities & Amenities

Look for turfs that offer:
- Clean changing rooms
- Proper lighting for evening games
- Drinking water facilities
- First aid availability
- Parking space

## 4. Booking Flexibility

Choose venues that offer:
- Online booking options
- Multiple time slots
- Cancellation policies
- Group discounts

## 5. Price vs. Quality

While budget is important, don't compromise on:
- Safety standards
- Surface maintenance
- Equipment quality

## Pro Tip

Always check reviews and ratings before booking. Sports Arena shows verified ratings from real players to help you make the best choice.

Ready to find your perfect turf? Browse our curated selection of premium sports venues across India!
    `
  },
  'benefits-of-turf-booking': {
    title: 'Top 5 Benefits of Online Turf Booking',
    author: 'Sports Arena Team',
    date: '2025-12-20',
    readTime: '4 min read',
    image: 'https://images.unsplash.com/photo-1459865264687-595d652de67e?w=1200&auto=format&fit=crop',
    content: `
Gone are the days of calling multiple venues to check availability. Online turf booking has revolutionized how we plan our sports activities.

## 1. Instant Availability Check

See real-time slot availability without making a single phone call. Our platform shows:
- Available time slots
- Current pricing
- Any ongoing offers

## 2. Secure Your Slot

With online booking, you get:
- Instant confirmation
- Digital tickets with QR codes
- No double-booking worries

## 3. Compare & Choose

Browse multiple venues at once:
- Compare prices
- Read reviews
- Check facilities
- View photos

## 4. Exclusive Online Deals

Booking online often gives you access to:
- Early bird discounts
- Loyalty points
- Special promotional offers
- Bundle deals

## 5. Hassle-Free Management

Manage all your bookings in one place:
- View upcoming games
- Cancel if needed (with proper notice)
- Track your spending
- Build your sports history

## Start Booking Today

Join thousands of players who have made the switch to online booking. Experience the convenience yourself!
    `
  },
  'fitness-through-sports': {
    title: 'Stay Fit with Regular Sports: A Complete Guide',
    author: 'Health Expert',
    date: '2025-12-15',
    readTime: '6 min read',
    image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=1200&auto=format&fit=crop',
    content: `
Regular physical activity is crucial for maintaining good health, and what better way than playing sports you love?

## Why Sports Over Gym?

- **More engaging**: Games keep you motivated
- **Social interaction**: Build friendships while staying fit
- **Full body workout**: Most sports work multiple muscle groups
- **Mental health**: The joy of playing reduces stress

## Recommended Weekly Schedule

### For Beginners:
- 2 sessions per week
- 1-hour each
- Mix of cardio-heavy and skill-based sports

### For Regular Players:
- 3-4 sessions per week
- 1-2 hours each
- Include rest days

## Sports by Fitness Goal

### Weight Loss:
- Football (burns 400-600 calories/hour)
- Badminton (burns 300-500 calories/hour)
- Basketball (burns 400-700 calories/hour)

### Muscle Building:
- Cricket (batting and bowling)
- Tennis (arm and core strength)
- Volleyball (legs and core)

### Cardiovascular Health:
- Running on turf
- Football
- Basketball

## Recovery Tips

1. Always warm up before playing
2. Stay hydrated during games
3. Cool down with stretches
4. Get adequate sleep
5. Maintain proper nutrition

## Book Your Next Game

Start your fitness journey today by booking a turf session with your friends!
    `
  },
  'team-building-sports': {
    title: 'Team Building Through Sports: Corporate Booking Tips',
    author: 'Corporate Solutions',
    date: '2025-12-10',
    readTime: '5 min read',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=1200&auto=format&fit=crop',
    content: `
Sports activities are one of the most effective ways to build team cohesion and boost employee morale. Here's how to organize the perfect corporate sports event.

## Benefits of Sports Team Building

- **Improved Communication**: Players must communicate on the field
- **Trust Building**: Rely on teammates to succeed
- **Leadership Development**: Natural leaders emerge
- **Stress Relief**: Fun way to unwind from work pressure

## Planning Your Event

### Step 1: Choose the Right Sport
Consider your team's:
- Fitness levels
- Size of the group
- Interests and preferences

Popular choices:
- **Football**: Great for larger groups
- **Badminton**: Perfect for smaller teams
- **Cricket**: Traditional favorite
- **Volleyball**: Easy for beginners

### Step 2: Select the Venue
Look for:
- Adequate space for your group size
- Proper facilities (changing rooms, water)
- Easy parking
- Catering options if needed

### Step 3: Plan the Format
- **Tournament style**: Multiple teams competing
- **Friendly matches**: Mixed teams for interaction
- **Skills workshop**: Professional coaching included

## Budget Planning

Typical costs to consider:
- Venue booking
- Equipment rental
- Refreshments
- Transportation
- Prizes/awards

## Pro Tips

1. Book well in advance for better rates
2. Send out invites early
3. Keep backup slots in case of cancellations
4. Include non-players as cheerleaders
5. Document the event with photos/videos

## Book Your Corporate Event

Contact us for special corporate packages and group discounts!
    `
  }
};

export default function BlogPost() {
  const { slug } = useParams<{ slug: string }>();
  const post = slug ? blogContent[slug] : null;

  if (!post) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Post Not Found</h1>
          <Link to="/blog" className="text-emerald-600 hover:underline">← Back to Blog</Link>
        </div>
      </div>
    );
  }

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: post.title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
    }
  };

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

      {/* Back Link */}
      <div className="container mx-auto px-4 py-6">
        <Link to="/blog" className="inline-flex items-center gap-2 text-emerald-600 hover:text-emerald-700">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>
      </div>

      {/* Article */}
      <article className="container mx-auto px-4 pb-16">
        <div className="max-w-3xl mx-auto">
          {/* Hero Image */}
          <div className="aspect-[16/9] rounded-2xl overflow-hidden mb-8">
            <img 
              src={post.image} 
              alt={post.title}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6">
            <span className="flex items-center gap-1">
              <User className="w-4 h-4" />
              {post.author}
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              {post.readTime}
            </span>
            <button 
              onClick={handleShare}
              className="flex items-center gap-1 hover:text-emerald-600 transition-colors ml-auto"
            >
              <Share2 className="w-4 h-4" />
              Share
            </button>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-8">{post.title}</h1>

          {/* Content */}
          <div className="prose prose-lg prose-emerald max-w-none">
            {post.content.split('\n').map((line, i) => {
              if (line.startsWith('## ')) {
                return <h2 key={i} className="text-2xl font-bold text-gray-900 mt-8 mb-4">{line.replace('## ', '')}</h2>;
              }
              if (line.startsWith('### ')) {
                return <h3 key={i} className="text-xl font-semibold text-gray-900 mt-6 mb-3">{line.replace('### ', '')}</h3>;
              }
              if (line.startsWith('- **')) {
                const match = line.match(/- \*\*(.+?)\*\*: (.+)/);
                if (match) {
                  return <p key={i} className="text-gray-700 my-2">• <strong>{match[1]}</strong>: {match[2]}</p>;
                }
              }
              if (line.startsWith('- ')) {
                return <p key={i} className="text-gray-700 my-2">• {line.replace('- ', '')}</p>;
              }
              if (line.match(/^\d+\. /)) {
                return <p key={i} className="text-gray-700 my-2">{line}</p>;
              }
              if (line.trim()) {
                return <p key={i} className="text-gray-700 my-4">{line}</p>;
              }
              return null;
            })}
          </div>

          {/* CTA */}
          <div className="mt-12 p-6 bg-emerald-50 rounded-2xl text-center">
            <h3 className="text-xl font-bold text-gray-900 mb-3">Ready to Play?</h3>
            <p className="text-gray-600 mb-4">Find your perfect sports venue and book instantly</p>
            <Link to="/all-turfs">
              <Button className="bg-emerald-500 hover:bg-emerald-600">
                Browse All Turfs
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </article>

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
              <Link to="/blog" className="hover:text-white">Blog</Link>
              <span>© 2025 Sports Arena</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}