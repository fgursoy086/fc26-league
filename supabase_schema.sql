-- ============================================
-- FC26 LEAGUE - SUPABASE DATABASE SCHEMA
-- Supabase SQL Editor'de çalıştırın
-- ============================================

-- 1. Profiles tablosu (auth.users ile bağlantılı)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('playstation', 'xbox', 'origin')),
  platform_id TEXT NOT NULL,
  position TEXT NOT NULL CHECK (position IN ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF')),
  avatar_url TEXT,
  team_id UUID,
  is_captain BOOLEAN DEFAULT false,
  is_admin BOOLEAN DEFAULT false,
  rating INTEGER DEFAULT 70 CHECK (rating >= 1 AND rating <= 99),
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  matches_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Takımlar tablosu
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  logo_url TEXT,
  captain_id UUID REFERENCES public.profiles(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  wins INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Transfer teklifleri tablosu
CREATE TABLE IF NOT EXISTS public.transfer_offers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  from_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE,
  to_player_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  from_captain_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Maçlar tablosu
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  home_team_id UUID REFERENCES public.teams(id),
  away_team_id UUID REFERENCES public.teams(id),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished')),
  match_date TIMESTAMPTZ,
  week INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Maç olayları (gol, asist)
CREATE TABLE IF NOT EXISTS public.match_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE,
  player_id UUID REFERENCES public.profiles(id),
  team_id UUID REFERENCES public.teams(id),
  event_type TEXT CHECK (event_type IN ('goal', 'assist', 'yellow_card', 'red_card')),
  minute INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Takım talepleri (admin onayı için)
CREATE TABLE IF NOT EXISTS public.team_applications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  logo_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  admin_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transfer_offers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.team_applications ENABLE ROW LEVEL SECURITY;

-- Profiles politikaları
CREATE POLICY "Profiles herkese görünür" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Kullanıcı kendi profilini düzenleyebilir" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Kullanıcı profil oluşturabilir" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams politikaları
CREATE POLICY "Takımlar herkese görünür" ON public.teams FOR SELECT USING (true);
CREATE POLICY "Kaptan takım oluşturabilir" ON public.teams FOR INSERT WITH CHECK (auth.uid() = captain_id);
CREATE POLICY "Kaptan takımı düzenleyebilir" ON public.teams FOR UPDATE USING (auth.uid() = captain_id);
CREATE POLICY "Admin takım düzenleyebilir" ON public.teams FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Transfer offers politikaları
CREATE POLICY "Transfer teklifleri ilgili kişilere görünür" ON public.transfer_offers FOR SELECT USING (
  auth.uid() = to_player_id OR 
  auth.uid() = from_captain_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Kaptan transfer teklifi oluşturabilir" ON public.transfer_offers FOR INSERT WITH CHECK (auth.uid() = from_captain_id);
CREATE POLICY "Oyuncu teklifi güncelleyebilir" ON public.transfer_offers FOR UPDATE USING (
  auth.uid() = to_player_id OR auth.uid() = from_captain_id
);

-- Team applications politikaları
CREATE POLICY "Admin uygulamaları görebilir" ON public.team_applications FOR SELECT USING (
  auth.uid() = applicant_id OR
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Kullanıcı uygulama oluşturabilir" ON public.team_applications FOR INSERT WITH CHECK (auth.uid() = applicant_id);
CREATE POLICY "Admin uygulama güncelleyebilir" ON public.team_applications FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Matches politikaları
CREATE POLICY "Maçlar herkese görünür" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admin maç oluşturabilir" ON public.matches FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);
CREATE POLICY "Admin maç düzenleyebilir" ON public.matches FOR UPDATE USING (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- Match events politikaları
CREATE POLICY "Maç olayları herkese görünür" ON public.match_events FOR SELECT USING (true);
CREATE POLICY "Admin maç olayı ekleyebilir" ON public.match_events FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND is_admin = true)
);

-- ============================================
-- FUNCTIONS & TRIGGERS
-- ============================================

-- Yeni kullanıcı kaydolduğunda profil oluştur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, platform, platform_id, position)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'username', ''),
    COALESCE(NEW.raw_user_meta_data->>'platform', 'playstation'),
    COALESCE(NEW.raw_user_meta_data->>'platform_id', ''),
    COALESCE(NEW.raw_user_meta_data->>'position', 'ST')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Transfer kabul edildiğinde oyuncuyu takıma ekle
CREATE OR REPLACE FUNCTION public.handle_transfer_accepted()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'accepted' AND OLD.status = 'pending' THEN
    UPDATE public.profiles 
    SET team_id = NEW.from_team_id, is_captain = false
    WHERE id = NEW.to_player_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_transfer_accepted
  AFTER UPDATE ON public.transfer_offers
  FOR EACH ROW EXECUTE FUNCTION public.handle_transfer_accepted();

-- Takım başvurusu onaylandığında takım ve kaptan güncelle
CREATE OR REPLACE FUNCTION public.handle_application_approved()
RETURNS TRIGGER AS $$
DECLARE
  new_team_id UUID;
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Takım oluştur
    INSERT INTO public.teams (name, logo_url, captain_id, status)
    VALUES (NEW.team_name, NEW.logo_url, NEW.applicant_id, 'approved')
    RETURNING id INTO new_team_id;
    
    -- Kaptanı güncelle
    UPDATE public.profiles 
    SET team_id = new_team_id, is_captain = true
    WHERE id = NEW.applicant_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_application_approved
  AFTER UPDATE ON public.team_applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_application_approved();

-- ============================================
-- İLK ADMİN KULLANICI (kayıt olduktan sonra çalıştır)
-- Kendi user ID'nizi girin:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'your-email@example.com';
-- ============================================

-- Storage bucket (Supabase Dashboard > Storage'da manuel oluşturun: "team-logos" bucket, public)
