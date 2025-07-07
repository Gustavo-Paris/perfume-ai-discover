-- RLS Policies
ALTER TABLE coupon_user_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_helpfulness ENABLE ROW LEVEL SECURITY;

-- Políticas para coupon_user_usage
CREATE POLICY "Admins can view all coupon usage" ON coupon_user_usage
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view their own coupon usage" ON coupon_user_usage
  FOR SELECT USING (auth.uid() = user_id);

-- Políticas para affiliates
CREATE POLICY "Admins can manage all affiliates" ON affiliates
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view and manage their own affiliate data" ON affiliates
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view active affiliate codes" ON affiliates
  FOR SELECT USING (status = 'active');

-- Políticas para affiliate_referrals
CREATE POLICY "Admins can manage all referrals" ON affiliate_referrals
  FOR ALL USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Affiliates can view their own referrals" ON affiliate_referrals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM affiliates 
      WHERE affiliates.id = affiliate_referrals.affiliate_id 
      AND affiliates.user_id = auth.uid()
    )
  );

-- Políticas para review_helpfulness
CREATE POLICY "Users can manage their own helpfulness votes" ON review_helpfulness
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view helpfulness votes" ON review_helpfulness
  FOR SELECT USING (true);