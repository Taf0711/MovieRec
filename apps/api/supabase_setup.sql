-- =============================================
-- MovieRec Database Setup Script
-- Run this in Supabase Dashboard > SQL Editor
-- =============================================

-- 1. Create profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create reviews table
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'book', 'show')),
    media_id TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, media_type, media_id)
);

-- 3. Create user_lists table (watchlist, favorites, reading_list)
CREATE TABLE IF NOT EXISTS public.user_lists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    list_type TEXT NOT NULL CHECK (list_type IN ('watchlist', 'favorites', 'reading_list', 'completed')),
    media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'book', 'show')),
    media_id TEXT NOT NULL,
    title TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, list_type, media_type, media_id)
);

-- =============================================
-- Enable Row Level Security (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_lists ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for profiles
-- =============================================

-- Users can view any profile
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT 
USING (true);

-- Users can only update their own profile
CREATE POLICY "Users can update own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = id);

-- =============================================
-- RLS Policies for reviews
-- =============================================

-- Anyone can view reviews
CREATE POLICY "Reviews are viewable by everyone" 
ON public.reviews FOR SELECT 
USING (true);

-- Users can only create their own reviews
CREATE POLICY "Users can create own reviews" 
ON public.reviews FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own reviews
CREATE POLICY "Users can update own reviews" 
ON public.reviews FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own reviews
CREATE POLICY "Users can delete own reviews" 
ON public.reviews FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================
-- RLS Policies for user_lists
-- =============================================

-- Users can only view their own lists
CREATE POLICY "Users can view own lists" 
ON public.user_lists FOR SELECT 
USING (auth.uid() = user_id);

-- Users can only create items in their own lists
CREATE POLICY "Users can create own list items" 
ON public.user_lists FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Users can only update their own list items
CREATE POLICY "Users can update own list items" 
ON public.user_lists FOR UPDATE 
USING (auth.uid() = user_id);

-- Users can only delete their own list items
CREATE POLICY "Users can delete own list items" 
ON public.user_lists FOR DELETE 
USING (auth.uid() = user_id);

-- =============================================
-- Function to auto-create profile on signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, username, created_at)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        NOW()
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call function on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- Indexes for better performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_media ON public.reviews(media_type, media_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_user_id ON public.user_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_user_lists_type ON public.user_lists(user_id, list_type);

-- =============================================
-- Grant permissions to authenticated users
-- =============================================

GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.reviews TO authenticated;
GRANT ALL ON public.user_lists TO authenticated;

-- Service role needs full access for backend operations
GRANT ALL ON public.profiles TO service_role;
GRANT ALL ON public.reviews TO service_role;
GRANT ALL ON public.user_lists TO service_role;

-- =============================================
-- Success message
-- =============================================
DO $$
BEGIN
    RAISE NOTICE 'MovieRec database setup complete!';
    RAISE NOTICE 'Tables created: profiles, reviews, user_lists';
    RAISE NOTICE 'RLS policies enabled for all tables';
END $$;

