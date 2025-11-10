-- Create enum for run types
CREATE TYPE public.run_type AS ENUM ('easy', 'tempo', 'interval', 'long', 'recovery');

-- Create runs table
CREATE TABLE public.runs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  distance DECIMAL(6,2) NOT NULL CHECK (distance > 0),
  duration INTEGER NOT NULL CHECK (duration > 0), -- duration in seconds
  date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  run_type public.run_type NOT NULL DEFAULT 'easy',
  notes TEXT,
  pace DECIMAL(5,2), -- calculated pace in min/km
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.runs ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own runs" 
ON public.runs 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own runs" 
ON public.runs 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own runs" 
ON public.runs 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own runs" 
ON public.runs 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_runs_updated_at
BEFORE UPDATE ON public.runs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to calculate pace
CREATE OR REPLACE FUNCTION public.calculate_pace()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate pace as minutes per kilometer (duration in seconds / distance in km / 60)
  NEW.pace = (NEW.duration::decimal / 60.0) / NEW.distance;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger for automatic pace calculation
CREATE TRIGGER calculate_run_pace
BEFORE INSERT OR UPDATE ON public.runs
FOR EACH ROW
EXECUTE FUNCTION public.calculate_pace();