-- Create reviews table
CREATE TABLE public.reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  perfume_id UUID NOT NULL REFERENCES public.perfumes(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one review per user per perfume
  UNIQUE(perfume_id, user_id),
  
  -- Ensure status is valid
  CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable Row Level Security
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Create policies for reviews
CREATE POLICY "Users can view approved reviews"
ON public.reviews
FOR SELECT
USING (status = 'approved');

CREATE POLICY "Users can create their own reviews"
ON public.reviews
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reviews"
ON public.reviews
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own pending reviews"
ON public.reviews
FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending')
WITH CHECK (auth.uid() = user_id AND status = 'pending');

CREATE POLICY "Admins can manage all reviews"
ON public.reviews
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Function to check if user has purchased perfume
CREATE OR REPLACE FUNCTION public.user_has_purchased_perfume(user_uuid UUID, perfume_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.orders o
    JOIN public.order_items oi ON o.id = oi.order_id
    WHERE o.user_id = user_uuid 
    AND oi.perfume_id = perfume_uuid
    AND o.payment_status = 'paid'
  );
END;
$$;

-- Function to award points when review is approved
CREATE OR REPLACE FUNCTION public.award_review_points()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- Award points when review status changes to 'approved'
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    PERFORM public.add_points_transaction(
      NEW.user_id,
      20, -- 20 points for approved review
      'review_approved',
      'Pontos ganhos por avaliação aprovada',
      NULL
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for automatic points award
CREATE TRIGGER award_review_points_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.award_review_points();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_reviews_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_reviews_updated_at_trigger
BEFORE UPDATE ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.update_reviews_updated_at();