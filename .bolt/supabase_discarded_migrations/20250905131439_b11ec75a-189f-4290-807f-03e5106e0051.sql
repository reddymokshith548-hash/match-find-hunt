-- Create profiles table for user data
CREATE TABLE public.profiles (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  bio text,
  role text CHECK (role IN ('Student', 'Entrepreneur', 'Mentor', 'Investor')),
  skills text[] DEFAULT '{}',
  interests text[] DEFAULT '{}',
  stage text CHECK (stage IN ('Idea', 'Prototype', 'Early Startup', 'Scaling')),
  looking_for text[] DEFAULT '{}',
  profile_pic_url text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles 
FOR SELECT 
USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Create projects table
CREATE TABLE public.projects (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  needs text[],
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Create policies for projects
CREATE POLICY "Projects are viewable by everyone" 
ON public.projects 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create their own projects" 
ON public.projects 
FOR INSERT 
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update their own projects" 
ON public.projects 
FOR UPDATE 
USING (auth.uid() = owner_id);

-- Create messages table
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  content text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for messages
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Create policies for messages
CREATE POLICY "Users can view their own messages" 
ON public.messages 
FOR SELECT 
USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" 
ON public.messages 
FOR INSERT 
WITH CHECK (auth.uid() = sender_id);

-- Create opportunities table
CREATE TABLE public.opportunities (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  category text,
  description text,
  event_date date,
  link text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for opportunities
ALTER TABLE public.opportunities ENABLE ROW LEVEL SECURITY;

-- Create policies for opportunities
CREATE POLICY "Opportunities are viewable by everyone" 
ON public.opportunities 
FOR SELECT 
USING (true);

-- Create connections table for networking
CREATE TABLE public.connections (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user1_id uuid NOT NULL,
  user2_id uuid NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS for connections
ALTER TABLE public.connections ENABLE ROW LEVEL SECURITY;

-- Create policies for connections
CREATE POLICY "Users can view their own connections" 
ON public.connections 
FOR SELECT 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

CREATE POLICY "Users can create connections" 
ON public.connections 
FOR INSERT 
WITH CHECK (auth.uid() = user1_id);

CREATE POLICY "Users can update their connections" 
ON public.connections 
FOR UPDATE 
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample opportunities
INSERT INTO public.opportunities (title, category, description, event_date, link) VALUES
('TechCrunch Disrupt 2024', 'Hackathon', 'Join the biggest startup competition and showcase your innovative ideas to top investors and entrepreneurs.', '2024-10-15', 'https://techcrunch.com/events/disrupt/'),
('Y Combinator Demo Day', 'Investor Event', 'Present your startup to leading investors and venture capitalists from around the world.', '2024-11-20', 'https://www.ycombinator.com/'),
('StartupWeekend Global', 'Networking', 'Connect with entrepreneurs, developers, and designers in this 54-hour startup competition.', '2024-09-28', 'https://startupweekend.org/'),
('AI & Future Tech Summit', 'Conference', 'Explore the latest trends in artificial intelligence and emerging technologies.', '2024-12-05', 'https://aitechsummit.com/'),
('Women in Tech Leadership', 'Mentorship', 'Mentorship program connecting female entrepreneurs with industry leaders.', '2024-10-01', 'https://womenintech.com/');