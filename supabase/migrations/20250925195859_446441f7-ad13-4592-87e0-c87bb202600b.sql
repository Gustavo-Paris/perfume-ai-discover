-- Create storage bucket for shipment labels
INSERT INTO storage.buckets (id, name, public) 
VALUES ('shipment-labels', 'shipment-labels', false)
ON CONFLICT (id) DO NOTHING;

-- Create policies for shipment labels bucket
CREATE POLICY "Admins can manage shipment labels"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id = 'shipment-labels' AND has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (bucket_id = 'shipment-labels' AND has_role(auth.uid(), 'admin'::app_role));

-- Add missing columns to shipments table
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS label_downloaded_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS collection_scheduled_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE shipments ADD COLUMN IF NOT EXISTS collection_date DATE;

-- Create fiscal_notes_view for better NF-e management
CREATE OR REPLACE VIEW fiscal_notes_view AS
SELECT 
  fn.*,
  o.order_number,
  o.user_id,
  o.total_amount as order_total,
  o.created_at as order_created_at,
  COUNT(fni.id) as items_count
FROM fiscal_notes fn
JOIN orders o ON fn.order_id = o.id
LEFT JOIN fiscal_note_items fni ON fn.id = fni.fiscal_note_id
GROUP BY fn.id, o.order_number, o.user_id, o.total_amount, o.created_at;